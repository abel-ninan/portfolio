// ════════════════════════════════
//  OPEN / CLOSE WINDOWS
// ════════════════════════════════
// Window modes:
//   desktop        floating Win95 windows (original behaviour)
//   phone          normal windows open full-screen (maximized, flagged autoMax);
//                  WINDOW_DEFS entries with dialog:true stay centered boxes
//   bare (Winamp)  own chrome and layout; only clamped inside the desktop
const PHONE_MARGIN = 8; // gap around floating windows and dialogs on phones

// Extra elements that belong to a window and are fitted with it (Winamp's
// panels). Other code can tag elements with data-window-group="<type>".
const WINDOW_COMPANIONS = { winamp: ['win-winampeq', 'win-winamppl'] };

function getDesktopSize() {
  const d = document.getElementById('desktop');
  return { w: d.clientWidth, h: d.clientHeight };
}

// Centered rect for a floating window on a phone: never bigger than the
// desktop minus an 8px margin on every side.
function phoneFloatRect(w, h, dw, dh) {
  const fw = Math.max(0, Math.min(w, dw - PHONE_MARGIN * 2));
  const fh = Math.max(0, Math.min(h, dh - PHONE_MARGIN * 2));
  return { x: Math.round((dw - fw) / 2), y: Math.round((dh - fh) / 2), w: fw, h: fh };
}

// Default floating rect on desktop: cascaded around the center (original rule).
function desktopRect(def, dw, dh, count) {
  const w = Math.min(def.width, dw - 40);
  const h = Math.min(def.height, dh - 40);
  const defaultX = Math.max(20, Math.min(dw - w - 20, (dw - w) / 2 + count * 22));
  const defaultY = Math.max(20, Math.min(dh - h - 20, (dh - h) / 2 + count * 22));
  const pos = def.getPos ? def.getPos(dw, dh, w, h) : { x: defaultX, y: defaultY };
  return { x: Math.round(pos.x), y: Math.round(pos.y), w, h };
}

function openWindow(type) {
  if (openWindows[type]) {
    restoreWindow(type);
    focusWindow(type);
    return;
  }

  const def = WINDOW_DEFS[type];
  if (!def) return;

  const desktop = document.getElementById('desktop');
  const { w: dw, h: dh } = getDesktopSize();
  const count = Object.keys(openWindows).length;
  const phone = isPhone();

  let rect;
  if (phone && !def.bare) {
    rect = phoneFloatRect(def.width, def.height, dw, dh);
  } else {
    rect = desktopRect(def, dw, dh, count);
  }
  const { x, y, w, h } = rect;

  const win = document.createElement('div');
  win.id = 'win-' + type;

  // Bare windows (e.g. Winamp) skip the standard Win95 chrome and own their layout.
  if (def.bare) {
    win.className = 'winamp';
    win.style.cssText = `left:${x}px;top:${y}px;`;
    desktop.appendChild(win);
    openWindows[type] = { minimized: false, maximized: false, autoMax: false, x, y, w, h, prefW: def.width, prefH: def.height };
    def.build(win, type);
    focusWindow(type);
    addTaskbarBtn(type, def.title, def.icon);
    fitWindow(type, { group: true });
    return;
  }

  win.className = 'window active' + (def.dialog ? ' is-dialog' : '');
  win.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;

  // Title-bar buttons as in Win95: dialogs (closeOnly) have just Close;
  // fixed-size windows (noResize) show Maximize greyed out.
  win.innerHTML = `
    <div class="window-titlebar" id="titlebar-${type}">
      ${def.noIcon ? '' : `<img class="window-title-icon" src="${escapeHTML(ICONS[def.icon] || '')}" alt="">`}
      <span class="window-title">${escapeHTML(def.title)}</span>
      <div class="window-controls">
        ${def.closeOnly ? '' : `
        <button class="win-btn win-btn-minimize" title="Minimize" aria-label="Minimize" data-win-btn="minimize"></button>
        <button class="win-btn" title="Maximize" aria-label="Maximize" data-win-btn="maximize"${def.noResize ? ' disabled' : ''}>
          <img src="img/maximize-icon.png" alt="" style="width:14px;height:14px;image-rendering:pixelated;display:block;">
        </button>`}
        <button class="win-btn win-btn-close" title="Close" aria-label="Close" data-win-btn="close">
          <img src="img/close-icon.png" alt="" style="width:14px;height:14px;image-rendering:pixelated;display:block;">
        </button>
      </div>
    </div>
    <div class="window-body" id="wbody-${type}"></div>
    ${def.noResize ? '' : `<div class="resize-handle" id="resize-${type}"></div>`}
  `;

  desktop.appendChild(win);
  openWindows[type] = { minimized: false, maximized: false, autoMax: false, x, y, w, h, prefW: def.width, prefH: def.height };

  def.build(document.getElementById('wbody-' + type), type);
  wireWindowChrome(win, type, def);
  focusWindow(type);
  makeDraggable(win, document.getElementById('titlebar-' + type), type);
  if (!def.noResize) makeResizable(win, document.getElementById('resize-' + type), type);
  addTaskbarBtn(type, def.title, def.icon);

  // Phones: normal windows fill the desktop like an app; dialogs stay boxes.
  if (phone && !def.dialog) setMaximized(type, true, true);
  fitWindow(type);
}

// Title-bar buttons and double-click-to-maximize (no inline handlers).
function wireWindowChrome(win, type, def) {
  win.querySelector('.window-controls').addEventListener('click', e => {
    const btn = e.target.closest('[data-win-btn]');
    if (!btn) return;
    const action = btn.dataset.winBtn;
    if (action === 'minimize') minimizeWindow(type);
    else if (action === 'maximize') toggleMaximize(type);
    else if (action === 'close') closeWindow(type);
  });

  const titlebar = win.querySelector('.window-titlebar');
  titlebar.addEventListener('dblclick', e => {
    if (e.target.closest('.window-controls')) return;
    if (isPhone() || def.noResize || def.dialog) return;
    toggleMaximize(type);
  });
}

// ════════════════════════════════
//  WINDOW MANAGEMENT
// ════════════════════════════════
function focusWindow(type) {
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
  document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));

  const win = document.getElementById('win-' + type);
  if (!win) return;
  win.classList.add('active');
  // Only raise when something else is on top, so z-index does not climb on every click.
  if (activeWindow !== type || +win.style.zIndex !== windowZIndex) win.style.zIndex = ++windowZIndex;
  activeWindow = type;

  const tb = document.getElementById('tbtn-' + type);
  if (tb) tb.classList.add('active');
}

// Focus the top-most visible window (after a minimize or close).
function focusTopWindow(exclude) {
  let top = null, topZ = -Infinity;
  Object.keys(openWindows).forEach(t => {
    if (t === exclude || openWindows[t].minimized) return;
    const el = document.getElementById('win-' + t);
    if (!el || el.style.display === 'none') return;
    const z = parseInt(el.style.zIndex, 10) || 0;
    if (z > topZ) { topZ = z; top = t; }
  });
  if (top) {
    focusWindow(top);
  } else {
    activeWindow = null;
    document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
    document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));
  }
}

// The Shut Down dialog's dimmed backdrop (js/dialog.js) goes with it.
function setShutdownBackdrop(shown) {
  const backdrop = document.getElementById('shutdown-backdrop');
  if (backdrop) backdrop.style.display = shown ? '' : 'none';
}

function minimizeWindow(type) {
  const win = document.getElementById('win-' + type);
  if (!win || !openWindows[type]) return;
  win.style.display = 'none';
  openWindows[type].minimized = true;
  if (type === 'shutdown') setShutdownBackdrop(false);
  windowCompanions(type).forEach(el => { el.style.display = 'none'; });
  const tb = document.getElementById('tbtn-' + type);
  if (tb) tb.classList.remove('active');
  activeWindow = null;
  focusTopWindow(type);
}

function restoreWindow(type) {
  const win = document.getElementById('win-' + type);
  if (!win || !openWindows[type]) return;
  win.style.display = (WINDOW_DEFS[type] && WINDOW_DEFS[type].bare) ? 'block' : 'flex';
  openWindows[type].minimized = false;
  if (type === 'shutdown') setShutdownBackdrop(true);
  if (type === 'winamp') {
    const eq = document.getElementById('win-winampeq');
    const pl = document.getElementById('win-winamppl');
    if (eq) eq.style.display = WINAMP.eqVisible ? '' : 'none';
    if (pl) pl.style.display = WINAMP.plVisible ? '' : 'none';
  }
  // The viewport may have changed while it was hidden.
  fitWindow(type);
}

// Switch a window in or out of the maximized (full-desktop) state.
// auto=true marks it as maximized by phone mode, so it floats again on desktop.
function setMaximized(type, on, auto) {
  const win = document.getElementById('win-' + type);
  const state = openWindows[type];
  if (!win || !state) return;

  if (on && !state.maximized) {
    state.x = win.offsetLeft;
    state.y = win.offsetTop;
    state.w = parseFloat(win.style.width) || win.offsetWidth;
    state.h = parseFloat(win.style.height) || win.offsetHeight;
    win.classList.add('maximized');
  } else if (!on && state.maximized) {
    win.classList.remove('maximized');
    win.style.left   = state.x + 'px';
    win.style.top    = state.y + 'px';
    win.style.width  = state.w + 'px';
    win.style.height = state.h + 'px';
  }
  state.maximized = on;
  state.autoMax = !!(on && auto);

  // The middle button shows Restore while maximized, as in Win95.
  const btn = win.querySelector('[data-win-btn="maximize"]');
  if (btn) {
    const label = on ? 'Restore' : 'Maximize';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    const img = btn.querySelector('img');
    if (img) img.src = on ? 'img/restore-icon.png' : 'img/maximize-icon.png';
  }
}

function toggleMaximize(type) {
  const win = document.getElementById('win-' + type);
  const state = openWindows[type];
  if (!win || !state) return;
  const def = WINDOW_DEFS[type];
  // Bare windows lay themselves out; dialogs and fixed-size windows have no Maximize.
  if (def && (def.bare || def.noResize || def.closeOnly)) return;

  if (state.maximized && isPhone()) {
    // Phones: "restore" is a floating window fitted inside the screen.
    const { w: dw, h: dh } = getDesktopSize();
    const r = phoneFloatRect(state.w, state.h, dw, dh);
    Object.assign(state, { x: r.x, y: r.y, w: r.w, h: r.h });
  }
  setMaximized(type, !state.maximized, false);
  focusWindow(type);
  fitWindow(type);
}

function closeWindow(type) {
  const win = document.getElementById('win-' + type);
  if (win) win.remove();
  const tb = document.getElementById('tbtn-' + type);
  if (tb) tb.remove();
  delete openWindows[type];
  activeWindow = null;
  if (type === 'winamp') winampCleanup();
  document.querySelectorAll('.msgbox-backdrop').forEach(b => {
    if (b.dataset.owner === type && b._cancel) b._cancel();
  });
  if (type === 'shutdown') {
    const backdrop = document.getElementById('shutdown-backdrop');
    if (backdrop) backdrop.remove();
  }
  focusTopWindow(type);
}

// ════════════════════════════════
//  FIT  (one rule for every window, every device)
// ════════════════════════════════
// fitWindow(typeOrElementOrId) keeps a window fully inside the desktop area
// (left >= 0, top >= 0, right <= desktop width, bottom <= desktop height).
// Size is capped in CSS (.window max-width/max-height: 100%), so the size an
// app asked for is kept and comes back when the screen grows again; this only
// fixes the position. Phone dialogs are re-centered. Called on open, restore,
// viewport changes and whenever a window's size changes (ResizeObserver).
function resolveWindowEl(ref) {
  if (!ref) return null;
  if (typeof ref !== 'string') return ref;
  return document.getElementById('win-' + ref) || document.getElementById(ref);
}

// The window type an element belongs to (companions map to their owner).
function windowOwnerType(el) {
  if (!el || !el.id) return null;
  const own = el.id.indexOf('win-') === 0 ? el.id.slice(4) : null;
  if (own && openWindows[own]) return own;
  if (el.dataset && el.dataset.windowGroup) return el.dataset.windowGroup;
  for (const t in WINDOW_COMPANIONS) {
    if (WINDOW_COMPANIONS[t].indexOf(el.id) !== -1) return t;
  }
  return null;
}

function windowCompanions(type) {
  if (!type) return [];
  const list = (WINDOW_COMPANIONS[type] || []).map(id => document.getElementById(id));
  document.querySelectorAll(`[data-window-group="${type}"]`).forEach(el => list.push(el));
  return list.filter(Boolean);
}

function isShown(el) {
  return el.isConnected && el.style.display !== 'none' && el.getClientRects().length > 0;
}

// Clamp one positioned element inside the desktop (optionally centering it).
function clampToDesktop(el, desk, center) {
  const w = el.offsetWidth, h = el.offsetHeight;
  let x = center ? (desk.w - w) / 2 : el.offsetLeft;
  let y = center ? (desk.h - h) / 2 : el.offsetTop;
  x = Math.max(0, Math.min(x, desk.w - w));
  y = Math.max(0, Math.min(y, desk.h - h));
  x = Math.round(x); y = Math.round(y);
  if (el.offsetLeft !== x) el.style.left = x + 'px';
  if (el.offsetTop !== y) el.style.top = y + 'px';
}

// Move a group of panels together so its bounding box sits inside the desktop.
function shiftGroupInside(parts, desk) {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  parts.forEach(p => {
    l = Math.min(l, p.offsetLeft); t = Math.min(t, p.offsetTop);
    r = Math.max(r, p.offsetLeft + p.offsetWidth); b = Math.max(b, p.offsetTop + p.offsetHeight);
  });
  let dx = 0, dy = 0;
  if (r > desk.w) dx = desk.w - r;
  if (l + dx < 0) dx = -l;
  if (b > desk.h) dy = desk.h - b;
  if (t + dy < 0) dy = -t;
  if (!dx && !dy) return;
  parts.forEach(p => {
    p.style.left = (p.offsetLeft + dx) + 'px';
    p.style.top  = (p.offsetTop + dy) + 'px';
  });
}

function fitWindow(ref, opts) {
  const el = resolveWindowEl(ref);
  if (!el || !el.isConnected) return;
  const desktop = document.getElementById('desktop');
  if (!desktop.contains(el)) return;
  const desk = getDesktopSize();
  const type = windowOwnerType(el);

  // Not a managed window (e.g. an app popup inside #desktop): just clamp it.
  if (!type || !openWindows[type]) {
    if (isShown(el)) clampToDesktop(el, desk, false);
    return;
  }

  const main = document.getElementById('win-' + type);
  const state = openWindows[type];
  const def = WINDOW_DEFS[type] || {};
  const parts = [main].concat(windowCompanions(type)).filter(p => p && isShown(p));
  if (!parts.length) return;

  if (opts && opts.group && parts.length > 1) shiftGroupInside(parts, desk);
  const centerDialog = def.dialog && isPhone();
  parts.forEach(p => {
    if (p === main && state.maximized) return; // CSS fills the desktop exactly
    clampToDesktop(p, desk, p === main && centerDialog);
  });
}

function refitAllWindows() {
  Object.keys(openWindows).forEach(t => fitWindow(t));
}

// Re-fit whenever a window (or a companion panel) changes size, e.g.
// Minesweeper switching difficulty or Winamp showing its EQ / playlist.
const pendingFits = new Set();
let pendingFitRaf = 0;
function queueFit(el) {
  pendingFits.add(el);
  if (!pendingFitRaf) {
    // Deferred a frame so a fit never feeds back into the same observer pass.
    pendingFitRaf = requestAnimationFrame(() => {
      pendingFitRaf = 0;
      const els = Array.from(pendingFits);
      pendingFits.clear();
      els.forEach(e => fitWindow(e));
    });
  }
}

const windowResizeObserver = typeof ResizeObserver === 'function'
  ? new ResizeObserver(entries => entries.forEach(entry => queueFit(entry.target)))
  : null;

// Watch #desktop for windows being added or removed, so every window and
// panel is observed without the apps having to register anything.
(function () {
  const desktop = document.getElementById('desktop');
  if (!desktop || !windowResizeObserver || typeof MutationObserver !== 'function') return;
  const isWindowEl = n => n.nodeType === 1 && n.id && (n.id.indexOf('win-') === 0 || n.hasAttribute('data-window-group'));
  new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(n => { if (isWindowEl(n)) windowResizeObserver.observe(n); });
      m.removedNodes.forEach(n => { if (n.nodeType === 1) windowResizeObserver.unobserve(n); });
    });
  }).observe(desktop, { childList: true });
})();

// ════════════════════════════════
//  VIEWPORT  (resize, rotation, phone <-> desktop)
// ════════════════════════════════
let lastPhoneMode = isPhone();

// Phone mode makes normal windows full-screen; leaving it floats the ones it
// maximized again at their desktop size.
function applyWindowMode(phone) {
  const { w: dw, h: dh } = getDesktopSize();
  Object.keys(openWindows).forEach((type, i) => {
    const def = WINDOW_DEFS[type];
    const state = openWindows[type];
    if (!def || def.bare || def.dialog) return;
    if (phone && !state.maximized) {
      setMaximized(type, true, true);
      const r = phoneFloatRect(state.w, state.h, dw, dh);
      Object.assign(state, { x: r.x, y: r.y, w: r.w, h: r.h });
    } else if (!phone && state.maximized && state.autoMax) {
      const r = desktopRect({ width: state.prefW, height: state.prefH }, dw, dh, i);
      Object.assign(state, { x: r.x, y: r.y, w: r.w, h: r.h });
      setMaximized(type, false, false);
    }
  });
}

let viewportRaf = 0;
function onViewportChange() {
  if (viewportRaf) return;
  viewportRaf = requestAnimationFrame(() => {
    viewportRaf = 0;
    updateAppHeight();
    syncPhoneClass();
    const phone = isPhone();
    if (phone !== lastPhoneMode) {
      lastPhoneMode = phone;
      applyWindowMode(phone);
    }
    refitAllWindows();
  });
}

window.addEventListener('resize', onViewportChange);
window.addEventListener('orientationchange', () => {
  onViewportChange();
  setTimeout(onViewportChange, 300); // iOS reports the new size late
});
if (window.visualViewport) window.visualViewport.addEventListener('resize', onViewportChange);
if (phoneMedia.addEventListener) phoneMedia.addEventListener('change', onViewportChange);
else if (phoneMedia.addListener) phoneMedia.addListener(onViewportChange);

// iOS can leave the page scrolled after the on-screen keyboard closes.
document.addEventListener('focusout', () => {
  if (!isPhone()) return;
  setTimeout(() => {
    const a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
  }, 100);
});
