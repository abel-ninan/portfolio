// ════════════════════════════════
//  INTERNET EXPLORER
// ════════════════════════════════
// A real browser in a Win95 window: pages load in a sandboxed <iframe>.
// Google works through its frame-friendly igu=1 mode. Many big sites refuse
// to be shown inside another page (X-Frame-Options / CSP frame-ancestors);
// those get an IE-style error page with a button that opens the page in a
// real browser tab. Back / Forward / Stop / Refresh work on the pages opened
// from the address bar, links bar, menus and toolbar.
const IE_HOME       = 'https://www.google.com/webhp?igu=1';
const IE_SEARCH_URL = 'https://www.google.com/search?igu=1&q=';
const IE_SANDBOX    = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';

const IE_LINKS = [
  { label: 'Google',    url: IE_HOME },
  { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Main_Page' },
  { label: 'HairMaxxx', url: 'https://abel-ninan.github.io/hairlinescan-ai-app/' },
  { label: 'GitHub',    url: 'https://github.com/abel-ninan' },
];

// Sites (and their subdomains) that refuse to load inside a frame, checked
// with curl -sI (X-Frame-Options / CSP frame-ancestors). Google's own igu=1
// pages are allowed before this list is checked.
const IE_BLOCKED_HOSTS = [
  'google.com', 'youtube.com', 'youtu.be', 'gmail.com',
  'bing.com', 'duckduckgo.com', 'yahoo.com',
  'github.com', 'linkedin.com', 'lnkd.in',
  'x.com', 'twitter.com', 'facebook.com', 'fb.com', 'instagram.com',
  'tiktok.com', 'reddit.com', 'redd.it', 'pinterest.com', 'discord.com', 'whatsapp.com',
  'apple.com', 'amazon.com', 'ebay.com', 'paypal.com', 'netflix.com', 'twitch.tv', 'spotify.com',
  'stackoverflow.com', 'stackexchange.com', 'medium.com', 'quora.com',
  'nytimes.com', 'cnn.com', 'bbc.com', 'bbc.co.uk',
  'openai.com', 'chatgpt.com', 'claude.ai', 'anthropic.com',
  'office.com', 'dropbox.com',
];

// Sites known to load fine in the frame (no reachability check needed).
const IE_FRAMEABLE_HOSTS = ['wikipedia.org', 'wikimedia.org', 'abel-ninan.github.io', 'example.com'];

const IE_PROBE_TIMEOUT = 10000; // ms before the reachability check gives up
const IE_PROBE_GRACE   = 4000;  // ms to wait for the frame after the check failed
const IE_LOAD_TIMEOUT  = 25000; // ms before a page that never loads shows an error

const IE_MENUS = {
  file:      [['Open in New Window', 'newwin'], ['Home Page', 'home'], '-', ['Close', 'close']],
  edit:      [['Copy Address', 'copy'], ['Select Address', 'focusaddr']],
  view:      [['Stop', 'stop'], ['Refresh', 'refresh']],
  favorites: IE_LINKS.map(l => [l.label, 'link', l.url]),
  help:      [['About Internet Explorer', 'about']],
};

let ieHistory = [];
let ieHistoryIndex = -1;
let ieNavId = 0;          // bumped on every navigation; stale callbacks compare against it
let ieLoading = false;
let ieFrameLoads = 0;     // load events from the current frame
let ieInFrameNav = false; // the visitor clicked to another page inside the frame
let ieFrameFocused = false; // focus moved into the frame (the visitor used the page)
let ieLastLoadAt = 0;
let ieProbeState = '';    // '', 'pending', 'ok', 'failed', 'timeout'
let ieTimers = [];
let ieGlobalBound = false;

function buildIEWindow(container) {
  ieHistory = [IE_HOME];
  ieHistoryIndex = 0;

  container.classList.add('ie-window-body');
  container.innerHTML = `
    <div class="window-menubar ie-menubar">
      <span class="menu-item" data-ie-menu="file"><u>F</u>ile</span>
      <span class="menu-item" data-ie-menu="edit"><u>E</u>dit</span>
      <span class="menu-item" data-ie-menu="view"><u>V</u>iew</span>
      <span class="menu-item" data-ie-menu="favorites">F<u>a</u>vorites</span>
      <span class="menu-item" data-ie-menu="help"><u>H</u>elp</span>
    </div>

    <div class="ie-bars">
      <div class="ie-toolbar">
        <button class="ie-nav-btn" id="ie-back" type="button" title="Back" data-ie-cmd="back" disabled>
          <img class="ie-ico-sq" src="img/ie-back-disabled.png" alt="">
          <span>Back</span>
        </button>
        <button class="ie-nav-btn" id="ie-forward" type="button" title="Forward" data-ie-cmd="forward" disabled>
          <img class="ie-ico-sq" src="img/ie-forward-disabled.png" alt="">
          <span>Forward</span>
        </button>
        <div class="ie-toolbar-divider"></div>
        <button class="ie-nav-btn" id="ie-stop" type="button" title="Stop" data-ie-cmd="stop">
          <img class="ie-ico-wide" src="img/ie-stop-icon.png" alt="">
          <span>Stop</span>
        </button>
        <button class="ie-nav-btn" id="ie-refresh" type="button" title="Refresh" data-ie-cmd="refresh">
          <img class="ie-ico-wide" src="img/ie-refresh-icon.png" alt="">
          <span>Refresh</span>
        </button>
        <button class="ie-nav-btn" id="ie-home" type="button" title="Home" data-ie-cmd="home">
          <img class="ie-ico-wide" src="img/ie-home-icon.png" alt="">
          <span>Home</span>
        </button>
        <button class="ie-nav-btn" id="ie-search" type="button" title="Search" data-ie-cmd="search">
          <img class="ie-ico-wide" src="img/ie-search-icon.png" alt="">
          <span>Search</span>
        </button>
        <div class="ie-toolbar-divider"></div>
        <button class="ie-nav-btn ie-newwin-btn" id="ie-newwin" type="button" title="Open in New Window" data-ie-cmd="newwin">
          <img class="ie-ico-sq" src="img/world.png" alt="">
          <span class="ie-lbl-full">New Window</span><span class="ie-lbl-short">Open</span>
        </button>
        <div class="ie-toolbar-sep"></div>
        <div class="ie-logo" id="ie-logo">
          <img src="img/internet-explorer.png" id="ie-logo-img" alt="">
        </div>
      </div>

      <form class="ie-addressbar" id="ie-address-form" action="#" autocomplete="off">
        <label class="ie-address-label" for="ie-address">Address</label>
        <input class="ie-address-input" id="ie-address" type="text" value="${escapeHTML(IE_HOME)}"
          enterkeyhint="go" autocapitalize="off" autocorrect="off" spellcheck="false"
          aria-label="Address or search">
        <button class="ie-go-btn" type="submit" title="Go to this address, or search Google">Go</button>
      </form>
    </div>

    <div class="ie-linksbar">
      <span class="ie-links-label">Links</span>
      ${IE_LINKS.map(l => `<button class="ie-link-btn" type="button" data-ie-cmd="link" data-url="${escapeHTML(l.url)}"
        title="${escapeHTML(ieIsBlocked(l.url) ? l.label + ' (opens in a new window)' : l.label)}">${escapeHTML(l.label)}</button>`).join('')}
    </div>

    <div class="ie-content" id="ie-content">
      <iframe class="ie-frame" id="ie-frame" title="Web page" src="about:blank" sandbox="${IE_SANDBOX}"></iframe>
      <div class="ie-page" id="ie-page" hidden></div>
    </div>

    <div class="status-bar ie-statusbar">
      <span class="status-item ie-status-main"><span class="ie-status-text" id="ie-status">Done</span></span>
      <span class="status-item ie-status-zone">Internet zone</span>
      <div class="status-resize-slot"></div>
    </div>
  `;

  container.addEventListener('click', ieOnClick);
  container.addEventListener('pointerover', ieOnMenuHover);
  container.querySelector('#ie-address-form').addEventListener('submit', e => {
    e.preventDefault();
    ieGo();
  });
  const addr = container.querySelector('#ie-address');
  addr.addEventListener('focus', () => {
    // Select the whole address so typing replaces it (like a real address bar).
    setTimeout(() => { try { addr.setSelectionRange(0, addr.value.length); } catch (e) {} }, 0);
  });
  ieBindGlobal();

  ieNavigate(IE_HOME);
}

// ════════════════════════════════
//  ADDRESS PARSING
// ════════════════════════════════
function ieSearchUrl(text) {
  return IE_SEARCH_URL + encodeURIComponent(text).replace(/%20/g, '+');
}

// "example.com", "en.wikipedia.org/wiki/X", "192.168.0.1:8080"
function ieLooksLikeHost(text) {
  const host = text.split(/[/?#]/)[0].replace(/:\d+$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host)) return false;
  return /\.[a-z]{2,}$/i.test(host) || /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

// Google only frames its igu=1 pages: rewrite google.com addresses to them.
function ieFixGoogle(u) {
  if (!/^(www\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/i.test(u.hostname)) return u.href;
  const path = u.pathname.replace(/\/+$/, '');
  if (path === '' || path === '/webhp') {
    const q = u.searchParams.get('q');
    return q ? ieSearchUrl(q) : IE_HOME;
  }
  if (path === '/search') {
    u.protocol = 'https:';
    u.hostname = 'www.google.com';
    u.searchParams.set('igu', '1');
    return u.href;
  }
  return u.href; // other Google pages refuse frames: handled as blocked
}

// Address bar text -> url to load. Anything that is not clearly a web
// address is searched on Google.
function ieResolveInput(raw) {
  const text = String(raw == null ? '' : raw).trim();
  if (!text) return '';
  let url = '';
  if (/^https?:\/\//i.test(text)) url = text;
  else if (/^\/\//.test(text)) url = 'https:' + text;
  else if (!/\s/.test(text) && ieLooksLikeHost(text)) url = 'https://' + text;
  if (!url) return ieSearchUrl(text); // includes javascript:, data:, mailto: and plain words

  let u;
  try { u = new URL(url); } catch (e) { return ieSearchUrl(text); }
  // An http page inside an https site is blocked as mixed content.
  if (u.protocol === 'http:' && location.protocol === 'https:') u.protocol = 'https:';
  return ieFixGoogle(u);
}

function ieHostOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch (e) { return ''; }
}

function ieHostIn(host, list) {
  return list.some(d => host === d || host.slice(-(d.length + 1)) === '.' + d);
}

function ieIsGoogleIgu(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'www.google.com' && /^\/(webhp|search)?$/.test(u.pathname) &&
      u.searchParams.get('igu') === '1';
  } catch (e) { return false; }
}

// True for pages that will refuse to load inside the frame.
function ieIsBlocked(url) {
  if (ieIsGoogleIgu(url)) return false;
  return ieHostIn(ieHostOf(url), IE_BLOCKED_HOSTS);
}

function ieIsKnownGood(url) {
  return ieIsGoogleIgu(url) || ieHostIn(ieHostOf(url), IE_FRAMEABLE_HOSTS);
}

// ════════════════════════════════
//  NAVIGATION
// ════════════════════════════════
// Load an address (or search) and add it to the history.
// fromHistory=true is used by Back / Forward (history index already moved).
function ieLoad(input, fromHistory) {
  const url = ieResolveInput(input);
  if (!url || !document.getElementById('ie-content')) return;
  if (!fromHistory && ieHistory[ieHistoryIndex] !== url) {
    ieHistory = ieHistory.slice(0, ieHistoryIndex + 1);
    ieHistory.push(url);
    ieHistoryIndex = ieHistory.length - 1;
  }
  ieNavigate(url);
}

function ieGo() {
  const addr = document.getElementById('ie-address');
  if (!addr || !addr.value.trim()) return;
  ieLoad(addr.value);
  if (isPhone()) addr.blur(); // close the on-screen keyboard
}

// Back-compat entry point for toolbar actions.
function ieNav(action) {
  ieCommand(action);
}

function ieSetStatus(text) {
  const s = document.getElementById('ie-status');
  if (s) s.textContent = text;
}

function ieSetAddress(url) {
  const addr = document.getElementById('ie-address');
  if (addr) addr.value = url;
}

function ieClearTimers() {
  ieTimers.forEach(clearTimeout);
  ieTimers = [];
}

function ieSetBusy(on) {
  ieLoading = on;
  const logo = document.getElementById('ie-logo');
  if (logo) logo.classList.toggle('busy', on);
}

// Swap in a fresh <iframe>: no stale load events from the old page, and our
// own navigations never pile up entries in the browser's history.
function ieReplaceFrame(url, navId) {
  const old = document.getElementById('ie-frame');
  if (!old) return null;
  const frame = document.createElement('iframe');
  frame.className = 'ie-frame';
  frame.id = 'ie-frame';
  frame.title = 'Web page';
  frame.setAttribute('sandbox', IE_SANDBOX);
  if (navId != null) frame.addEventListener('load', () => ieOnFrameLoad(navId));
  frame.src = url;
  old.parentNode.replaceChild(frame, old);
  return frame;
}

// Show `url` in the content area (no history change).
function ieNavigate(url) {
  const navId = ++ieNavId;
  ieClearTimers();
  ieCloseMenu();
  ieHidePage();
  ieFrameLoads = 0;
  ieInFrameNav = false;
  ieFrameFocused = false;
  ieProbeState = '';
  ieSetAddress(url);
  ieUpdateNavBtns();

  if (ieIsBlocked(url)) {
    ieReplaceFrame('about:blank', null);
    ieSetBusy(false);
    ieShowPage('blocked', url);
    ieSetStatus('Done');
    return;
  }

  ieSetBusy(true);
  ieSetStatus('Opening page ' + url + '...');
  ieReplaceFrame(url, navId);

  // Unknown sites: a quick reachability check, because WebKit (iOS Safari)
  // never fires "load" for a host that does not exist.
  if (!ieIsKnownGood(url)) ieProbe(url, navId);

  ieTimers.push(setTimeout(() => {
    if (navId !== ieNavId || !ieLoading) return;
    if (ieProbeState === 'ok') { ieSetBusy(false); ieSetStatus('Done'); return; }
    ieShowPage(ieProbeState === 'failed' ? 'notfound' : 'timeout', url);
    ieSetStatus('Done');
  }, IE_LOAD_TIMEOUT));
}

// Is the server there at all? A no-cors fetch only fails on network errors
// (unknown host, refused connection). Never blocks the frame from loading.
function ieProbe(url, navId) {
  if (typeof fetch !== 'function') return;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const opts = { mode: 'no-cors', cache: 'no-store', credentials: 'omit' };
  if (ctrl) opts.signal = ctrl.signal;
  ieProbeState = 'pending';
  const timer = setTimeout(() => { if (ctrl) ctrl.abort(); }, IE_PROBE_TIMEOUT);
  let req;
  try { req = fetch(url, opts); } catch (e) { clearTimeout(timer); ieProbeState = ''; return; }
  req.then(() => {
    clearTimeout(timer);
    if (navId === ieNavId) ieProbeState = 'ok';
  }, err => {
    clearTimeout(timer);
    if (navId !== ieNavId) return;
    if (err && err.name === 'AbortError') { ieProbeState = 'timeout'; return; }
    ieProbeState = 'failed';
    // Give the frame a moment: if it loads after all, the page is fine.
    ieTimers.push(setTimeout(() => {
      if (navId !== ieNavId || ieFrameLoads > 0) return;
      ieSetBusy(false);
      ieShowPage('notfound', url);
      ieSetStatus('Done');
    }, IE_PROBE_GRACE));
  });
}

function ieOnFrameLoad(navId) {
  if (navId !== ieNavId) return;
  const now = Date.now();
  ieFrameLoads++;
  if (ieFrameLoads === 1) {
    ieSetBusy(false);
    // A slow page that finally arrived replaces the timeout error.
    const page = document.getElementById('ie-page');
    if (page && !page.hidden && /notfound|timeout/.test(page.dataset.kind || '')) ieHidePage();
  } else if (ieFrameFocused || now - ieLastLoadAt > 3000) {
    // The visitor followed a link inside the page (a page that redirects
    // itself right after loading does not count). Its address is private
    // to the frame, so Back returns to the last page opened from here.
    ieInFrameNav = true;
    ieUpdateNavBtns();
  }
  ieLastLoadAt = now;
  ieSetStatus('Done');
}

function ieStop() {
  if (!ieLoading) { ieSetStatus('Done'); return; }
  // A cross-origin frame cannot be stopped from outside, so the load is
  // dropped by swapping in a blank page.
  const url = ieHistory[ieHistoryIndex] || '';
  ++ieNavId;
  ieClearTimers();
  ieSetBusy(false);
  ieReplaceFrame('about:blank', null);
  ieShowPage('canceled', url);
  ieSetStatus('Done');
}

function ieUpdateNavBtns() {
  const canBack = ieInFrameNav || ieHistoryIndex > 0;
  const canFwd  = ieHistoryIndex < ieHistory.length - 1;
  ieSetNavBtn('ie-back', canBack, 'img/ie-back.png', 'img/ie-back-disabled.png');
  ieSetNavBtn('ie-forward', canFwd, 'img/ie-forward.png', 'img/ie-forward-disabled.png');
}

function ieSetNavBtn(id, enabled, src, srcDisabled) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = !enabled;
  const img = btn.querySelector('img');
  if (img) img.src = enabled ? src : srcDisabled;
}

function ieCurrentUrl() {
  return ieHistory[ieHistoryIndex] || IE_HOME;
}

function ieOpenNewWindow(url) {
  if (!url || url === 'about:blank') return;
  if (typeof openExternal === 'function') openExternal(url);
  else window.open(url, '_blank', 'noopener');
  ieSetStatus('Opened ' + (ieHostOf(url) || url) + ' in a new window');
}

function ieCopyAddress() {
  const url = ieCurrentUrl();
  const done = () => ieSetStatus('Address copied');
  const fallback = () => {
    const addr = document.getElementById('ie-address');
    if (!addr) return;
    addr.value = url;
    addr.focus();
    addr.setSelectionRange(0, url.length);
    try { if (document.execCommand('copy')) done(); } catch (e) {}
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, fallback);
  } else {
    fallback();
  }
}

// Every button, link and menu row in the window carries data-ie-cmd.
function ieCommand(cmd, el) {
  switch (cmd) {
    case 'back':
      if (ieInFrameNav) ieNavigate(ieCurrentUrl());
      else if (ieHistoryIndex > 0) { ieHistoryIndex--; ieNavigate(ieHistory[ieHistoryIndex]); }
      break;
    case 'forward':
      if (ieHistoryIndex < ieHistory.length - 1) { ieHistoryIndex++; ieNavigate(ieHistory[ieHistoryIndex]); }
      break;
    case 'stop':    ieStop(); break;
    case 'refresh': ieNavigate(ieCurrentUrl()); break;
    case 'home':
    case 'search':  ieLoad(IE_HOME); break;
    case 'go':      ieGo(); break;
    case 'newwin':  ieOpenNewWindow(ieCurrentUrl()); break;
    case 'open':    ieOpenNewWindow(el && el.dataset.url); break;
    case 'link': {
      const url = el && el.dataset.url;
      if (!url) break;
      if (ieIsBlocked(url)) ieOpenNewWindow(url);
      else ieLoad(url);
      break;
    }
    case 'searchhost': ieLoad(ieSearchUrl(el && el.dataset.q || '')); break;
    case 'copy':    ieCopyAddress(); break;
    case 'focusaddr': {
      const addr = document.getElementById('ie-address');
      if (addr) { addr.focus(); addr.select(); }
      break;
    }
    case 'about':   ieShowPage('about', ''); ieSetStatus('Done'); break;
    case 'close':   closeWindow('ie'); break;
  }
}

function ieOnClick(e) {
  const menuTitle = e.target.closest('[data-ie-menu]');
  if (menuTitle) {
    const open = document.getElementById('ie-menu');
    if (open && open.dataset.menu === menuTitle.dataset.ieMenu) ieCloseMenu();
    else ieOpenMenu(menuTitle);
    return;
  }
  const el = e.target.closest('[data-ie-cmd]');
  if (!el || el.disabled) return;
  e.preventDefault();
  ieCloseMenu();
  ieCommand(el.dataset.ieCmd, el);
}

// ════════════════════════════════
//  MENUS  (File / Edit / View / Favorites / Help)
// ════════════════════════════════
function ieOpenMenu(title) {
  ieCloseMenu();
  const body = title.closest('.ie-window-body');
  const items = IE_MENUS[title.dataset.ieMenu];
  if (!body || !items) return;

  const menu = document.createElement('div');
  menu.className = 'ie-menu';
  menu.id = 'ie-menu';
  menu.dataset.menu = title.dataset.ieMenu;
  menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map(it => it === '-'
    ? '<div class="ie-menu-sep" role="separator"></div>'
    : `<button class="ie-menu-row" type="button" role="menuitem" data-ie-cmd="${escapeHTML(it[1])}"
        ${it[2] ? `data-url="${escapeHTML(it[2])}"` : ''}>${escapeHTML(it[0])}</button>`).join('');
  body.appendChild(menu);
  title.classList.add('open');

  // Taps on the page go into the iframe and never reach this document, so a
  // clear shield over the page catches them and just closes the menu.
  const content = document.getElementById('ie-content');
  if (content) {
    const shield = document.createElement('div');
    shield.className = 'ie-menu-shield';
    shield.id = 'ie-menu-shield';
    content.appendChild(shield);
  }

  // Under its title, but never past the window's right edge.
  const bw = body.clientWidth;
  const left = Math.max(0, Math.min(title.offsetLeft, bw - menu.offsetWidth));
  menu.style.left = left + 'px';
  menu.style.top = (title.offsetTop + title.offsetHeight) + 'px';
}

function ieCloseMenu() {
  const menu = document.getElementById('ie-menu');
  if (menu) menu.remove();
  const shield = document.getElementById('ie-menu-shield');
  if (shield) shield.remove();
  document.querySelectorAll('.ie-menubar .menu-item.open').forEach(m => m.classList.remove('open'));
}

// With a menu open, pointing at another menu title opens that one (mouse).
function ieOnMenuHover(e) {
  if (e.pointerType !== 'mouse') return;
  const open = document.getElementById('ie-menu');
  const title = e.target.closest('[data-ie-menu]');
  if (open && title && open.dataset.menu !== title.dataset.ieMenu) ieOpenMenu(title);
}

// Bound once for the whole page (the window can be opened many times).
function ieBindGlobal() {
  if (ieGlobalBound) return;
  ieGlobalBound = true;
  document.addEventListener('pointerdown', e => {
    if (!document.getElementById('ie-menu')) return;
    if (e.target.closest && e.target.closest('#ie-menu, .ie-menubar')) return;
    ieCloseMenu();
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') ieCloseMenu();
  });
  // Clicking into the page moves focus into the iframe.
  window.addEventListener('blur', () => {
    ieCloseMenu();
    setTimeout(() => {
      const a = document.activeElement;
      if (a && a.id === 'ie-frame') ieFrameFocused = true;
    }, 0);
  });
}

// ════════════════════════════════
//  BUILT-IN PAGES  (error pages, Action canceled, About)
// ════════════════════════════════
function ieHidePage() {
  const page = document.getElementById('ie-page');
  if (!page) return;
  page.hidden = true;
  page.innerHTML = '';
  page.dataset.kind = '';
}

function ieShowPage(kind, url) {
  const page = document.getElementById('ie-page');
  if (!page) return;
  page.innerHTML = iePageHtml(kind, url);
  page.dataset.kind = kind;
  page.hidden = false;
  page.scrollTop = 0;
}

function iePageHtml(kind, url) {
  const host = ieHostOf(url) || url;
  const h = escapeHTML(host);
  const u = escapeHTML(url);
  const openBtn = `<button class="ie-err-btn" type="button" data-ie-cmd="open" data-url="${u}">Open in New Window</button>`;
  const back = '<button class="ie-err-link" type="button" data-ie-cmd="back">Back</button>';
  const refresh = '<button class="ie-err-link" type="button" data-ie-cmd="refresh">Refresh</button>';
  const google = `<button class="ie-err-link" type="button" data-ie-cmd="searchhost" data-q="${h}">search for it on Google</button>`;
  const canBack = ieInFrameNav || ieHistoryIndex > 0;

  let title, intro, tips, foot, button = openBtn;
  if (kind === 'blocked') {
    title = 'The page cannot be displayed';
    intro = `<b>${h}</b> does not allow its pages to be shown inside another window, so Internet Explorer cannot display it here.`;
    tips = ['Click <b>Open in New Window</b> to view this page in a real browser tab.'];
    if (canBack) tips.push(`Click the ${back} button to return to the previous page.`);
    tips.push(`Or ${google} instead.`);
    foot = 'Cannot display page in a frame';
  } else if (kind === 'notfound' || kind === 'timeout') {
    title = 'The page cannot be displayed';
    intro = kind === 'notfound'
      ? `Internet Explorer cannot find the server <b>${h}</b>. The address may be mistyped, or the site may be down.`
      : `<b>${h}</b> is taking too long to respond.`;
    tips = [
      'Check the address in the Address bar for typing mistakes.',
      `Click the ${refresh} button, or try again later.`,
      `Or ${google}.`,
    ];
    if (canBack) tips.push(`Click the ${back} button to try another link.`);
    foot = kind === 'notfound' ? 'Cannot find server or DNS Error' : 'Connection timed out';
  } else if (kind === 'canceled') {
    title = 'Action canceled';
    intro = `Internet Explorer stopped loading <b>${u || 'the page'}</b>.`;
    tips = [`Click the ${refresh} button to load the page again.`];
    if (canBack) tips.push(`Click the ${back} button to return to the previous page.`);
    foot = 'Navigation canceled';
  } else {
    title = 'About Internet Explorer';
    intro = 'This window is a working web browser. Type an address, or any words to search Google, in the Address bar and press <b>Go</b>.';
    tips = [
      'Some sites (GitHub, LinkedIn, YouTube and others) do not allow being shown inside another window. Use <b>File &gt; Open in New Window</b> or the <b><span class="ie-lbl-full">New Window</span><span class="ie-lbl-short">Open</span></b> button to view them in a real browser tab.',
      'Links you follow inside a page are not shown in the Address bar.',
    ];
    foot = 'Internet Explorer';
    button = '';
  }

  return `
    <div class="ie-err">
      <div class="ie-err-head">
        <img class="ie-err-icon" src="img/world.png" alt="">
        <h1 class="ie-err-title">${title}</h1>
      </div>
      <p>${intro}</p>
      ${button ? `<p class="ie-err-actions">${button}</p>` : ''}
      <hr>
      ${tips.length ? `<p>Please try the following:</p><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
      <p class="ie-err-foot">${foot}<br>Internet Explorer</p>
    </div>
  `;
}
