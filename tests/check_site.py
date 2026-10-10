#!/usr/bin/env python3
"""Whole-site check for the Windows 95 portfolio (Python Playwright).

Usage:
    python3 -I tests/check_site.py [base_url] [--browser chromium|webkit|both]
                                   [--only 390x844,...] [--jobs N] [--shots DIR]

Defaults: base_url http://127.0.0.1:8095/ (any static server for the project
root), --browser both, --jobs 2. Each engine x viewport runs in its own
process. Phone and tablet viewports use is_mobile + has_touch and are driven
by taps; desktop viewports by mouse clicks.

What it checks, for every viewport:
  * no page errors and no console errors from this site
  * no horizontal page scroll (documentElement.scrollWidth <= viewport width)
  * one tap / click on every desktop icon opens exactly its window
    (data-href icons must request exactly one new tab instead)
  * one tap / click on every file item in the folder windows does the same,
    and the project windows' Previous / Next buttons switch projects
  * every WINDOW_DEFS type (all project-* windows included), one at a time:
      - window (and companion panels) inside the viewport and above the taskbar
      - nothing inside it wider than its box (scrollWidth - clientWidth <= 1)
        apart from the intentional exceptions in ALLOW_HSCROLL
      - every <img> loaded
      - on phones every text input / textarea / select is >= 16px
      - the title-bar close button closes it
  * Minesweeper at all three levels, picked from its Game menu
  * every window open at once still fits
  * the Start menu (and every submenu / drill-down panel) fits; on phones
    every row is >= 40px tall; every leaf item opens its window with one tap
    (drill-down on phones, hover flyouts on desktop) and closes the menu
  * Internet Explorer loads Google and a typed search navigates the frame
  * the resume PDF link answers HTTP 200 with a PDF
  * desktop only: a real double-click opens a window / link once

Prints one table row per engine x viewport, then every failure, and exits
non-zero when anything failed.
"""
import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse

VIEWPORTS = [
    # (width, height, touch device)
    (320, 568, True),
    (360, 740, True),
    (375, 667, True),
    (390, 844, True),
    (430, 932, True),
    (844, 390, True),   # landscape phone
    (768, 1024, True),  # tablet (portrait)
    (1280, 720, False),
    (1440, 900, False),
]

# Elements allowed to be wider than their box: things that scroll sideways on
# purpose, or clip on purpose (marquees, ruler artwork, iframes).
ALLOW_HSCROLL = [
    '#taskbar-windows',                 # taskbar button strip scrolls on phones
    '.mine-field-scroll.mine-scroll-x', # Minesweeper board, only when it cannot fit
    '.wa-marquee', '.wa-title-scroll',  # Winamp song title marquee
    '.rs-ruler', '.rs-ruler-track',     # WordPad ruler artwork
    'iframe',
]

# Generous: a busy machine can stall a browser for seconds. A control that is
# really covered or off screen still fails, just later.
ACTION_TIMEOUT = 12000

COLUMNS = ['errors', 'hscroll', 'icons', 'items', 'windows', 'mines', 'all-open', 'start', 'ie', 'pdf', 'dblclick']

# ════════════════════════════════
#  IN-PAGE HELPERS
# ════════════════════════════════
INIT_JS = r"""
window.__opened = [];
window.open = function (u) { window.__opened.push(String(u)); return null; };
// Stretches of the run drive the page by script, without input events. Keep
// the 90s desktop screensaver (js/screensaver.js) from covering the page.
setInterval(function () { document.dispatchEvent(new Event('mousemove')); }, 20000);
"""

SEL_JS = r"""
window.__sel = function (el) {
  const parts = [];
  let e = el;
  for (let i = 0; e && i < 4 && e !== document.body; i++) {
    let s = e.tagName.toLowerCase();
    if (e.id) { parts.unshift(s + '#' + e.id); break; }
    const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += '.' + cls.join('.');
    parts.unshift(s);
    e = e.parentElement;
  }
  return parts.join(' > ');
};
"""

CHECK_WINDOW_JS = r"""
([type, W, allow, phone]) => {
  const res = { fails: [] };
  const main = document.getElementById('win-' + type);
  if (!main || !openWindows[type]) { res.fails.push('window did not open'); return res; }
  const shown = el => el && el.isConnected && el.style.display !== 'none' && el.getClientRects().length > 0;
  let parts = [main];
  if (typeof windowCompanions === 'function') parts = parts.concat(windowCompanions(type));
  parts = parts.filter(shown);
  if (!parts.length) { res.fails.push('window not visible'); return res; }

  // Inside the viewport and above the taskbar.
  const tb = document.getElementById('taskbar').getBoundingClientRect();
  parts.forEach(p => {
    const r = p.getBoundingClientRect();
    const bad = [];
    if (r.left < -0.5) bad.push('left ' + Math.round(r.left));
    if (r.top < -0.5) bad.push('top ' + Math.round(r.top));
    if (r.right > W + 0.5) bad.push('right ' + Math.round(r.right) + ' > ' + W);
    if (r.bottom > tb.top + 0.5) bad.push('bottom ' + Math.round(r.bottom) + ' > taskbar ' + Math.round(tb.top));
    if (bad.length) res.fails.push('#' + p.id + ' outside: ' + bad.join(', '));
  });

  // Nothing wider than its box.
  const offenders = [];
  parts.forEach(root => {
    [root].concat(Array.from(root.querySelectorAll('*'))).forEach(el => {
      if (!(el instanceof HTMLElement)) return;
      const cw = el.clientWidth, sw = el.scrollWidth;
      if (!cw || sw - cw <= 1) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return; // their text scrolls inside them
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (allow.some(s => el.matches(s) || el.closest(s))) return;
      if (/(hidden|clip)/.test(cs.overflowX) && cs.textOverflow === 'ellipsis') return;
      // overflow:visible content is not cut off here; if it leaves the window
      // it shows up on the clipping ancestor, the window or the page instead.
      if (cs.overflowX === 'visible') {
        const r = el.getBoundingClientRect(), wr = root.getBoundingClientRect();
        let spill = false;
        el.querySelectorAll('*').forEach(k => {
          const kr = k.getBoundingClientRect();
          if (kr.width && (kr.right > wr.right + 1 || kr.left < wr.left - 1)) spill = true;
        });
        if (!spill) return;
      }
      offenders.push({ sel: window.__sel(el), px: sw - cw, ox: cs.overflowX });
    });
  });
  offenders.sort((a, b) => b.px - a.px);
  offenders.slice(0, 5).forEach(o => res.fails.push(`overflow ${o.px}px (${o.ox}) ${o.sel}`));
  if (offenders.length > 5) res.fails.push(`... ${offenders.length - 5} more overflowing elements`);

  // Inputs that would make iOS zoom in.
  if (phone) {
    const skip = /^(radio|checkbox|range|hidden|file|button|submit|reset|color|image)$/;
    parts.forEach(root => root.querySelectorAll('input, textarea, select').forEach(i => {
      if (i.tagName === 'INPUT' && skip.test(i.type)) return;
      const fs = parseFloat(getComputedStyle(i).fontSize);
      if (fs < 16) res.fails.push(`input font ${fs}px ${window.__sel(i)}`);
    }));
  }

  const de = document.documentElement;
  if (de.scrollWidth > W) res.fails.push(`page scrollWidth ${de.scrollWidth} > ${W}`);
  return res;
}
"""

IMAGES_JS = r"""
async (type) => {
  const roots = [document.getElementById('win-' + type)];
  if (typeof windowCompanions === 'function') windowCompanions(type).forEach(el => roots.push(el));
  const imgs = [];
  roots.filter(Boolean).forEach(r => r.querySelectorAll('img').forEach(i => imgs.push(i)));
  imgs.forEach(i => { if (i.loading === 'lazy') i.loading = 'eager'; });
  await Promise.all(imgs.map(i => (i.complete && i.naturalWidth) ? null : new Promise(res => {
    i.addEventListener('load', res, { once: true });
    i.addEventListener('error', res, { once: true });
    setTimeout(res, 6000);
  })));
  return imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
}
"""

CLOSE_ALL_JS = r"""
() => {
  Object.keys(openWindows).forEach(t => closeWindow(t));
  const b = document.getElementById('shutdown-backdrop'); if (b) b.remove();
  closeStartMenu();
  window.__opened = [];
}
"""

# Folder items that do something when tapped: data-open / data-href / data-action.
ITEMS_JS = r"""
(type) => Array.from(document.querySelectorAll('#win-' + type + ' .file-item'))
  .filter(el => el.dataset.open || el.dataset.href || el.dataset.action)
  .map((el, i) => { el.dataset.chk = type + '-' + i;
    return { chk: el.dataset.chk, name: el.textContent.trim(), open: el.dataset.open || null,
             href: el.dataset.href || null, action: el.dataset.action || null }; })
"""

# Every Start menu leaf with the names of the submenus above it.
START_LEAVES_JS = r"""
() => Array.from(document.querySelectorAll('#start-menu .start-menu-items [data-open], #start-menu .start-menu-items [data-action], #start-menu .start-menu-items [data-href]'))
  .map(el => {
    const chain = [];
    for (let p = el.parentElement; p && p.id !== 'start-menu'; p = p.parentElement)
      if (p.classList.contains('has-submenu')) chain.unshift(p.querySelector(':scope > .item-text').textContent.trim());
    return { text: el.querySelector('.item-text').textContent.trim(), open: el.dataset.open || null,
             action: el.dataset.action || null, href: el.dataset.href || null, chain };
  })
"""

# Marks the item named `name` in `scope` and returns a selector for it.
MARK_JS = r"""
([scope, name]) => {
  const el = Array.from(document.querySelectorAll(scope)).find(e => {
    const t = e.querySelector(':scope > .item-text');
    return t && t.textContent.trim() === name;
  });
  if (!el) return null;
  el.dataset.chk = 'm' + Math.random().toString(36).slice(2);
  return '[data-chk="' + el.dataset.chk + '"]';
}
"""

# Why a control could not be tapped: what covers its centre, or where it is.
BLOCKER_JS = r"""
([sel, scroll]) => {
  let el;
  try {
    const m = sel.match(/^(.*?) >> nth=(\d+)$/);
    el = m ? document.querySelectorAll(m[1])[+m[2]] : document.querySelector(sel);
  } catch (e) { return 'selector error'; }
  if (!el) return 'no such element';
  if (scroll) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const top = document.elementFromPoint(x, y);
  const where = `rect ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
  if (!top) return where + ', centre off screen';
  if (top === el || el.contains(top)) return where + ', not covered';
  return where + ', covered by ' + window.__sel(top);
}
"""

RECT_JS = r"""
(sel) => Array.from(document.querySelectorAll(sel)).filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
  .map(el => { const r = el.getBoundingClientRect(); return { sel: window.__sel(el), l: r.left, t: r.top, r: r.right, b: r.bottom, h: r.height, text: (el.textContent || '').trim().slice(0, 24) }; })
"""


# ════════════════════════════════
#  ONE ENGINE x VIEWPORT
# ════════════════════════════════
def run_config(base, engine, w, h, touch, shots):
    from playwright.sync_api import sync_playwright

    tag = f'{engine} {w}x{h}'
    res = {c: [] for c in COLUMNS}
    errors = res['errors']
    origin = '{0.scheme}://{0.netloc}'.format(urlparse(base))

    with sync_playwright() as p:
        browser = getattr(p, engine).launch()
        kw = dict(viewport={'width': w, 'height': h})
        if touch:
            kw.update(is_mobile=True, has_touch=True, device_scale_factor=3 if w < 700 or h < 500 else 2)
        ctx = browser.new_context(**kw)
        ctx.add_init_script(INIT_JS)
        pg = ctx.new_page()

        def on_console(m):
            if m.type != 'error':
                return
            loc = (m.location or {}).get('url', '') or ''
            if loc and not loc.startswith(origin):
                return  # pages shown inside Internet Explorer
            # WebKit reports some frame errors without a location; they name
            # the foreign URL in the text instead ("Blocked https://...").
            urls = re.findall(r'https?://[^\s\'"]+', m.text)
            if not loc and urls and not any(u.startswith(origin) for u in urls):
                return
            errors.append(f'console: {m.text[:160]} @{loc.replace(origin, "")}')
        pg.on('console', on_console)
        def foreign_frame():
            return any(f != pg.main_frame and f.url.startswith('http') and not f.url.startswith(origin)
                       for f in pg.frames)

        def on_pageerror(e):
            stack = getattr(e, 'stack', '') or ''
            urls = re.findall(r'https?://[^\s)]+', stack)  # Chromium "(url)", WebKit "fn@url"
            if not any(u.startswith(origin) for u in urls):
                # Thrown by a page inside Internet Explorer: its stack names
                # only foreign URLs, or (WebKit) none at all while one is open.
                if urls or foreign_frame():
                    return
            errors.append(f'pageerror: {str(e)[:200]}')
        pg.on('pageerror', on_pageerror)

        for attempt in range(3):
            try:
                pg.goto(base, timeout=60000)
                break
            except Exception:
                if attempt == 2:
                    raise
                pg.wait_for_timeout(1000)
        pg.wait_for_load_state('load')
        pg.wait_for_timeout(700)
        pg.evaluate(SEL_JS)

        phone = pg.evaluate('isPhone()')
        exp_phone = touch and (w <= 768 or h <= 500)
        if phone != exp_phone:
            res['hscroll'].append(f'isPhone() = {phone}, expected {exp_phone}')

        def act(sel):
            # A starved browser can time out on a tap that did land. If the
            # control was clear before and is now covered, hidden or gone,
            # the tap landed (the caller checks what it did); if it is still
            # clear, tap once more. A control that was covered from the start
            # fails, naming what is on top of it.
            before = pg.evaluate(BLOCKER_JS, [sel, True])
            for attempt in (1, 2):
                try:
                    if touch:
                        pg.tap(sel, timeout=ACTION_TIMEOUT)
                    else:
                        pg.click(sel, timeout=ACTION_TIMEOUT)
                    return
                except Exception as e:
                    why = pg.evaluate(BLOCKER_JS, [sel, False])
                    if before.endswith('not covered') and not why.endswith('not covered'):
                        return
                    if attempt == 2 or not why.endswith('not covered'):
                        raise RuntimeError(f'{str(e).splitlines()[0][:70]}; {why}') from None
                    pg.wait_for_timeout(500)

        def guard():
            pg.wait_for_timeout(400)  # touch double-tap guard in js/desktop.js is 350ms

        def shot(name):
            if shots:
                pg.screenshot(path=os.path.join(shots, f'{engine}-{w}x{h}-{name}.png'))

        def page_hscroll(where):
            sw, iw = pg.evaluate('[document.documentElement.scrollWidth, innerWidth]')
            if sw > w or iw != w:
                res['hscroll'].append(f'{where}: scrollWidth {sw}, innerWidth {iw}, viewport {w}')

        def check_window(t, col, label=None):
            label = label or t
            r = pg.evaluate(CHECK_WINDOW_JS, [t, w, ALLOW_HSCROLL, phone])
            for f in r['fails']:
                res[col].append(f'{label}: {f}')
            bad = pg.evaluate(IMAGES_JS, t)
            if bad:
                res[col].append(f'{label}: images not loaded {bad}')

        def run_section(col, fn):
            # One section that throws (a dead browser, a hung page) is
            # reported in its column; the next sections still run.
            try:
                fn()
            except Exception as e:
                res[col].append(f'stopped early: {str(e).splitlines()[0][:240]}')
                try:
                    pg.evaluate(CLOSE_ALL_JS)
                except Exception:
                    pass

        def expect_effect(col, label, it):
            st = pg.evaluate('({ open: Object.keys(openWindows), urls: window.__opened })')
            if it.get('href'):
                if st['urls'] != [it['href']]:
                    res[col].append(f"{label}: expected one new tab for {it['href']}, got {st['urls']}")
            elif it.get('action') == 'open-image':
                if 'paint' not in st['open'] or st['urls']:
                    res[col].append(f"{label}: expected Paint, got {st}")
            elif it.get('action') == 'shutdown':
                if 'shutdown' not in st['open'] or st['urls']:
                    res[col].append(f"{label}: expected Shut Down, got {st}")
            elif it.get('open'):
                if it['open'] not in st['open'] or st['urls']:
                    res[col].append(f"{label}: expected {it['open']}, got {st}")

        types = pg.evaluate('Object.keys(WINDOW_DEFS)')

        # ── Welcome opens on load and fits
        def sec_welcome():
            if not pg.evaluate('!!openWindows.welcome'):
                res['windows'].append('welcome did not open on load')
            else:
                check_window('welcome', 'windows', 'welcome (on load)')
            page_hscroll('load')
        run_section('windows', sec_welcome)

        # ── Desktop icons: one tap / click each
        def sec_icons():
            pg.evaluate(CLOSE_ALL_JS)
            shot('desktop')
            icons = pg.evaluate("""Array.from(document.querySelectorAll('.desktop-icon')).map(i =>
                ({ id: i.id, open: i.dataset.open || null, href: i.dataset.href || null }))""")
            if not icons:
                res['icons'].append('no desktop icons')
            hidden = pg.evaluate("""() => { const tb = document.getElementById('taskbar').getBoundingClientRect();
                return Array.from(document.querySelectorAll('.desktop-icon')).filter(i => { const r = i.getBoundingClientRect();
                return !(r.top >= 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= tb.top); }).map(i => i.id); }""")
            if hidden:
                res['icons'].append(f'icons not fully on screen: {hidden}')
            for ic in icons:
                pg.evaluate(CLOSE_ALL_JS)
                guard()
                try:
                    act('#' + ic['id'])
                except Exception as e:
                    res['icons'].append(f"{ic['id']}: could not tap ({str(e).splitlines()[0][:240]})")
                    continue
                pg.wait_for_timeout(300)
                st = pg.evaluate('({ open: Object.keys(openWindows), urls: window.__opened })')
                if ic['href']:
                    if st['urls'] != [ic['href']] or st['open']:
                        res['icons'].append(f"{ic['id']}: expected one new tab for {ic['href']}, got {st}")
                elif st['open'] != [ic['open']]:
                    res['icons'].append(f"{ic['id']}: expected [{ic['open']}], got {st['open']}")
        run_section('icons', sec_icons)

        # ── Folder items: one tap / click each
        def sec_items():
            for folder in ('computer', 'files', 'documents', 'photos', 'projects'):
                pg.evaluate(CLOSE_ALL_JS)
                pg.evaluate('t => openWindow(t)', folder)
                pg.wait_for_timeout(250)
                items = pg.evaluate(ITEMS_JS, folder)
                if not items:
                    res['items'].append(f'{folder}: no tappable items')
                for it in items:
                    pg.evaluate(CLOSE_ALL_JS)
                    guard()
                    pg.evaluate('t => openWindow(t)', folder)
                    pg.wait_for_timeout(250)
                    pg.evaluate(ITEMS_JS, folder)
                    try:
                        act(f'[data-chk="{it["chk"]}"]')
                    except Exception as e:
                        res['items'].append(f"{folder} > {it['name']}: could not tap ({str(e).splitlines()[0][:240]})")
                        continue
                    pg.wait_for_timeout(350)
                    expect_effect('items', f"{folder} > {it['name']}", it)

            # Project windows: Next / Previous switch to the neighbouring project.
            projects = pg.evaluate('PORTFOLIO.projects.map(p => projectWindowType(p.id))')
            for i, t in enumerate(projects):
                for btn, j in (('next', i + 1), ('prev', i - 1)):
                    to = projects[j % len(projects)]
                    pg.evaluate(CLOSE_ALL_JS)
                    guard()
                    pg.evaluate('t => openWindow(t)', t)
                    pg.wait_for_timeout(250)
                    sel = f'#win-{t} [data-action="project-nav"][data-to="{to}"]'
                    if not pg.evaluate('s => !!document.querySelector(s)', sel):
                        if len(projects) > 1:
                            res['items'].append(f'{t}: no {btn} button to {to}')
                        continue
                    try:
                        act(sel)
                    except Exception as e:
                        res['items'].append(f"{t} {btn}: could not tap ({str(e).splitlines()[0][:240]})")
                        continue
                    pg.wait_for_timeout(350)
                    st = pg.evaluate('Object.keys(openWindows)')
                    if st != [to]:
                        res['items'].append(f'{t} {btn}: expected [{to}], got {st}')
        run_section('items', sec_items)

        # ── Every window type, one at a time
        def sec_windows():
            for t in types:
                pg.evaluate(CLOSE_ALL_JS)
                pg.evaluate('t => openWindow(t)', t)
                pg.wait_for_timeout(350)
                check_window(t, 'windows')
                page_hscroll(t)
                if t == 'ie':
                    continue  # closed by the IE test below
                close_sel = '#wa-close' if t == 'winamp' else f'#win-{t} [data-win-btn="close"]'
                try:
                    act(close_sel)
                    pg.wait_for_timeout(200)
                    gone = pg.evaluate("t => !openWindows[t] && !document.getElementById('win-' + t)", t)
                    if not gone:
                        res['windows'].append(f'{t}: close button did not close it')
                except Exception as e:
                    res['windows'].append(f'{t}: close button not tappable ({str(e).splitlines()[0][:240]})')
        run_section('windows', sec_windows)

        # ── Minesweeper: every level from the Game menu
        def sec_mines():
            pg.evaluate(CLOSE_ALL_JS)
            pg.evaluate("openWindow('minesweeper')")
            pg.wait_for_timeout(300)
            for level in ('beginner', 'intermediate', 'expert'):
                try:
                    act('#mine-game-btn')
                    pg.wait_for_timeout(150)
                    act(f'#mine-game-menu [data-mine-level="{level}"]')
                    pg.wait_for_timeout(400)
                except Exception as e:
                    res['mines'].append(f'{level}: menu not usable ({str(e).splitlines()[0][:240]})')
                    continue
                if pg.evaluate('mineLevel') != level:
                    res['mines'].append(f'{level}: level did not change')
                check_window('minesweeper', 'mines', f'minesweeper {level}')
                # every cell reachable: inside the board's (scrollable) box
                cells = pg.evaluate("document.querySelectorAll('#mine-grid .mine-cell').length")
                exp = pg.evaluate('mineRows * mineCols')
                if cells != exp:
                    res['mines'].append(f'{level}: {cells} cells, expected {exp}')
                if shots and level == 'expert':
                    shot('minesweeper-expert')
            # A real tap on a cell starts the game.
            try:
                act('#mine-grid .mine-cell')
                pg.wait_for_timeout(200)
                if pg.evaluate('mineFirstClick'):
                    res['mines'].append('tapping a cell did not start the game')
            except Exception as e:
                res['mines'].append(f'cell not tappable ({str(e).splitlines()[0][:240]})')
            pg.evaluate("mineSetLevel('beginner')")
            shot('minesweeper')
        run_section('mines', sec_mines)

        # ── Everything open at once
        def sec_all_open():
            pg.evaluate(CLOSE_ALL_JS)
            pg.evaluate("Object.keys(WINDOW_DEFS).forEach(t => openWindow(t))")
            pg.wait_for_timeout(800)
            for t in types:
                r = pg.evaluate(CHECK_WINDOW_JS, [t, w, ALLOW_HSCROLL, phone])
                for f in r['fails']:
                    if f.startswith('#') or f.startswith('page') or f.startswith('window'):
                        res['all-open'].append(f'{t}: {f}')
            page_hscroll('all windows open')
            pg.evaluate(CLOSE_ALL_JS)
        run_section('all-open', sec_all_open)

        # ── Start menu
        def sec_start():
            guard()
            act('#start-btn')
            pg.wait_for_timeout(250)
            shot('start')

            def check_menu_rects(sel, where, min_h):
                tb_top = pg.evaluate("document.getElementById('taskbar').getBoundingClientRect().top")
                for r in pg.evaluate(RECT_JS, sel):
                    if r['l'] < -0.5 or r['t'] < -0.5 or r['r'] > w + 0.5 or r['b'] > tb_top + 0.5:
                        res['start'].append(f"{where}: '{r['text']}' outside the screen ({round(r['l'])},{round(r['t'])},{round(r['r'])},{round(r['b'])})")
                    if min_h and r['h'] < min_h - 0.5:
                        res['start'].append(f"{where}: '{r['text']}' only {r['h']:.0f}px tall")

            if not pg.evaluate("document.getElementById('start-menu').classList.contains('visible')"):
                res['start'].append('Start button did not open the menu')
            else:
                check_menu_rects('#start-menu', 'menu', 0)
                check_menu_rects('#start-menu .start-menu-items > .start-menu-item', 'menu', 40 if phone else 0)
                if phone:
                    # Drill down through every submenu (depth first) and back.
                    def drill(path, depth):
                        if depth > 4:
                            return
                        n = pg.evaluate("document.querySelectorAll('#ssm-items > .start-submenu-item.has-submenu').length")
                        for i in range(n):
                            act(f'#ssm-items > .start-submenu-item.has-submenu >> nth={i}')
                            pg.wait_for_timeout(200)
                            name = path + ' > ' + str(i)
                            check_menu_rects('#start-submenu-panel', name, 0)
                            check_menu_rects('#ssm-back, #ssm-items > .start-submenu-item', name, 40)
                            drill(name, depth + 1)
                            act('#ssm-back')
                            pg.wait_for_timeout(150)
                    tops = pg.evaluate("document.querySelectorAll('#start-menu .start-menu-items > .start-menu-item.has-submenu').length")
                    for i in range(tops):
                        if not pg.evaluate("document.getElementById('start-menu').classList.contains('visible')"):
                            act('#start-btn')
                            pg.wait_for_timeout(200)
                        act(f'#start-menu .start-menu-items > .start-menu-item.has-submenu >> nth={i}')
                        pg.wait_for_timeout(200)
                        if not pg.evaluate("document.getElementById('start-submenu-panel').classList.contains('visible')"):
                            res['start'].append(f'submenu {i}: drill-down panel did not open')
                            continue
                        check_menu_rects('#start-submenu-panel', f'submenu {i}', 0)
                        check_menu_rects('#ssm-back, #ssm-items > .start-submenu-item', f'submenu {i}', 40)
                        drill(f'submenu {i}', 1)
                        act('#ssm-back')
                        pg.wait_for_timeout(150)
                else:
                    # Hover every flyout; each visible submenu must stay on screen.
                    def hover_tree(prefix, depth):
                        if depth > 4:
                            return
                        n = pg.evaluate(f"document.querySelectorAll('{prefix} > .has-submenu').length")
                        for i in range(n):
                            item = f'{prefix} > .has-submenu >> nth={i}'
                            pg.hover(item)
                            pg.wait_for_timeout(150)
                            check_menu_rects('#start-menu .start-submenu', f'flyout {depth}.{i}', 0)
                            sub_id = pg.evaluate(f"""(() => {{ const it = document.querySelectorAll('{prefix} > .has-submenu')[{i}];
                                const s = it.querySelector(':scope > .start-submenu'); if (!s) return null;
                                s.dataset.chk = s.dataset.chk || ('s' + Math.random().toString(36).slice(2)); return s.dataset.chk; }})()""")
                            if sub_id:
                                hover_tree(f'[data-chk="{sub_id}"]', depth + 1)
                            pg.hover(item)
                    hover_tree('#start-menu .start-menu-items', 1)
                # Every leaf opens its window with one tap and closes the menu.
                leaves = pg.evaluate(START_LEAVES_JS)
                if not leaves:
                    res['start'].append('no Start menu items')
                for lf in leaves:
                    label = ' > '.join(lf['chain'] + [lf['text']])
                    pg.evaluate(CLOSE_ALL_JS)
                    guard()
                    try:
                        act('#start-btn')
                        pg.wait_for_timeout(200)
                        if phone:
                            scope = '#start-menu .start-menu-items > .start-menu-item'
                            for name in lf['chain']:
                                sel = pg.evaluate(MARK_JS, [scope, name])
                                if not sel:
                                    raise RuntimeError(f'submenu {name} not found')
                                act(sel)
                                pg.wait_for_timeout(200)
                                scope = '#ssm-items > .start-submenu-item'
                            sel = pg.evaluate(MARK_JS, [scope, lf['text']])
                        else:
                            scope = '#start-menu .start-menu-items > .start-menu-item'
                            for name in lf['chain']:
                                sel = pg.evaluate(MARK_JS, [scope, name])
                                if not sel:
                                    raise RuntimeError(f'submenu {name} not found')
                                pg.hover(sel, timeout=ACTION_TIMEOUT)
                                pg.wait_for_timeout(150)
                                scope = sel + ' > .start-submenu > .start-submenu-item'
                            sel = pg.evaluate(MARK_JS, [scope, lf['text']])
                        if not sel:
                            raise RuntimeError('item not found')
                        act(sel)
                    except Exception as e:
                        res['start'].append(f"{label}: could not tap ({str(e).splitlines()[0][:240]})")
                        continue
                    pg.wait_for_timeout(350)
                    expect_effect('start', label, lf)
                    if pg.evaluate("document.getElementById('start-menu').classList.contains('visible')"):
                        res['start'].append(f'{label}: the menu stayed open')
                pg.evaluate(CLOSE_ALL_JS)
        run_section('start', sec_start)

        # ── Internet Explorer: Google loads, a typed search navigates
        def sec_ie():
            pg.evaluate(CLOSE_ALL_JS)
            guard()
            pg.evaluate("openWindow('ie')")

            def google_frame(pred, timeout=20):
                end = time.time() + timeout
                while time.time() < end:
                    for f in pg.frames:
                        if f != pg.main_frame and pred(f.url):
                            return f.url
                    pg.wait_for_timeout(250)
                return None

            u = google_frame(lambda url: 'google.' in url)
            if not u:
                res['ie'].append('Google did not load in the frame: ' + str([f.url for f in pg.frames][:3]))
            try:
                act('#ie-address')
                pg.fill('#ie-address', 'windows 95')
                # keyboard.press does not wait for the frame's navigation, which
                # a slow or captcha-walled Google can hold open for a long time.
                pg.keyboard.press('Enter')
                pg.wait_for_timeout(300)
                src = pg.evaluate("document.getElementById('ie-frame').getAttribute('src')")
                if 'q=windows' not in (src or ''):
                    res['ie'].append(f'typed search did not navigate the frame (src {src})')
                u2 = google_frame(lambda url: 'google.' in url and 'search' in url)
                if not u2:
                    res['ie'].append('search results frame never loaded: ' + str([f.url[:80] for f in pg.frames][:3]))
                if pg.url.rstrip('/') != base.rstrip('/'):
                    res['ie'].append(f'the page itself navigated to {pg.url}')
            except Exception as e:
                res['ie'].append(f'address bar not usable ({str(e).splitlines()[0][:240]})')
            check_window('ie', 'ie')
            shot('ie')
            try:
                act('#win-ie [data-win-btn="close"]')
                pg.wait_for_timeout(200)
                if pg.evaluate('!!openWindows.ie'):
                    res['ie'].append('close button did not close IE')
            except Exception as e:
                res['ie'].append(f'close button not tappable ({str(e).splitlines()[0][:240]})')
        run_section('ie', sec_ie)

        # ── Resume PDF
        def sec_pdf():
            pdf = pg.evaluate('PORTFOLIO.links.resumePdf')
            r = ctx.request.get(urljoin(base, pdf))
            if r.status != 200 or not r.body().startswith(b'%PDF'):
                res['pdf'].append(f'{pdf}: HTTP {r.status}, {r.headers.get("content-type")}')
            hrefs = pg.evaluate("""(() => { openWindow('documents'); openWindow('resume');
                const a = document.querySelector('#win-documents [data-href$=".pdf"]');
                const b = document.querySelector('#win-resume a[href$=".pdf"]');
                return [a && a.dataset.href, b && b.getAttribute('href')]; })()""")
            if hrefs != [pdf, pdf]:
                res['pdf'].append(f'PDF links point to {hrefs}, expected {pdf}')
        run_section('pdf', sec_pdf)

        # ── Screenshots of the portfolio windows
        def sec_shots():
            if shots:
                for t in ('project-hairmaxx', 'resume', 'contact'):
                    pg.evaluate(CLOSE_ALL_JS)
                    pg.evaluate('t => openWindow(t)', t)
                    pg.wait_for_timeout(500)
                    pg.evaluate(IMAGES_JS, t)
                    shot(t)
        run_section('errors', sec_shots)

        # ── Desktop: a real double-click opens once
        def sec_dblclick():
            if not touch:
                pg.evaluate(CLOSE_ALL_JS)
                guard()
                pg.dblclick('#icon-computer')
                pg.wait_for_timeout(300)
                st = pg.evaluate('Object.keys(openWindows)')
                if st != ['computer']:
                    res['dblclick'].append(f'double-click on My Computer gave {st}')
                pg.evaluate(CLOSE_ALL_JS)
                pg.evaluate("openWindow('documents')")
                pg.wait_for_timeout(400)
                pg.dblclick('#win-documents [data-href$=".pdf"]')
                pg.wait_for_timeout(300)
                n = pg.evaluate('window.__opened.length')
                if n != 1:
                    res['dblclick'].append(f'double-click on the PDF opened {n} tabs')
        run_section('dblclick', sec_dblclick)

        page_hscroll('end')
        browser.close()

    res['errors'] = sorted(set(errors))
    return {'tag': tag, 'res': res}


# ════════════════════════════════
#  DRIVER
# ════════════════════════════════
def main():
    args = sys.argv[1:]
    if '--worker' in args:
        i = args.index('--worker')
        base, engine, w, h, touch, shots = args[i + 1:i + 7]
        out = run_config(base, engine, int(w), int(h), touch == '1', shots if shots != '-' else None)
        print('@@RESULT@@' + json.dumps(out))
        return 0

    base = 'http://127.0.0.1:8095/'
    engines = ['chromium', 'webkit']
    only = None
    jobs = 2
    shots = None
    i = 0
    while i < len(args):
        a = args[i]
        if a == '--browser':
            v = args[i + 1]; i += 1
            engines = ['chromium', 'webkit'] if v == 'both' else [v]
        elif a == '--only':
            only = set(args[i + 1].split(',')); i += 1
        elif a == '--jobs':
            jobs = int(args[i + 1]); i += 1
        elif a == '--shots':
            shots = os.path.abspath(args[i + 1]); i += 1
            os.makedirs(shots, exist_ok=True)
        elif not a.startswith('--'):
            base = a if a.endswith('/') else a + '/'
        i += 1

    configs = [(e, w, h, t) for e in engines for (w, h, t) in VIEWPORTS
               if not only or f'{w}x{h}' in only]

    def work(c):
        e, w, h, t = c
        cmd = [sys.executable, '-I', os.path.abspath(__file__), '--worker', base, e, str(w), str(h),
               '1' if t else '0', shots or '-']
        crash = ''
        for attempt in range(2):  # a browser that dies on start-up gets one more go
            try:
                p = subprocess.run(cmd, capture_output=True, text=True, timeout=1500)
            except subprocess.TimeoutExpired:
                crash = 'timed out after 1500s'
                continue
            for line in p.stdout.splitlines():
                if line.startswith('@@RESULT@@'):
                    return json.loads(line[len('@@RESULT@@'):])
            crash = (p.stderr or p.stdout).strip()[-1500:]
        return {'tag': f'{e} {w}x{h}', 'crash': crash}

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=jobs) as ex:
        results = list(ex.map(work, configs))

    # Table
    head = f"{'config':<18}" + ''.join(f'{c:>10}' for c in COLUMNS)
    print(head)
    print('-' * len(head))
    total = 0
    for r in results:
        if 'crash' in r:
            print(f"{r['tag']:<18}  CRASHED")
            total += 1
            continue
        cells = []
        for c in COLUMNS:
            n = len(r['res'][c])
            total += n
            cells.append(f'{"ok" if not n else str(n) + " FAIL":>10}')
        print(f"{r['tag']:<18}" + ''.join(cells))
    print('-' * len(head))

    for r in results:
        if 'crash' in r:
            print(f"\n[{r['tag']}] CRASHED:\n{r['crash']}")
            continue
        lines = [(c, f) for c in COLUMNS for f in r['res'][c]]
        if lines:
            print(f"\n[{r['tag']}]")
            for c, f in lines:
                print(f'  {c:>9}: {f}')

    print(f'\n{len(results)} configurations, {total} problem(s), {time.time() - t0:.0f}s')
    return 1 if total else 0


if __name__ == '__main__':
    sys.exit(main())
