// ════════════════════════════════
//  INTERNET EXPLORER
// ════════════════════════════════
function buildIEWindow(container) {
  const HOME = 'https://cliowebsites.com';
  ieHistory = [HOME];
  ieHistoryIndex = 0;

  const LINKS = [
    { label: 'Clio Websites', url: 'https://cliowebsites.com' },
    { label: 'Microsoft',     url: 'https://microsoft.com' },
  ];

  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item">F<u>a</u>vorites</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>

    <div class="ie-toolbar">
      <button class="ie-nav-btn" id="ie-back" title="Back" onclick="ieNav('back')" style="opacity:0.4;pointer-events:none;">
        <img src="img/ie-back-disabled.png" style="width:22px;height:22px;image-rendering:pixelated;">
        <span>Back</span>
      </button>
      <button class="ie-nav-btn" id="ie-forward" title="Forward" onclick="ieNav('forward')" style="opacity:0.4;pointer-events:none;">
        <img src="img/ie-forward-disabled.png" style="width:22px;height:22px;image-rendering:pixelated;">
        <span>Forward</span>
      </button>
      <div class="ie-toolbar-divider"></div>
      <button class="ie-nav-btn" id="ie-stop" title="Stop" onclick="ieNav('stop')">
        <img src="img/ie-stop-icon.png" style="width:42px;height:22px;image-rendering:pixelated;">
        <span>Stop</span>
      </button>
      <button class="ie-nav-btn" id="ie-refresh" title="Refresh" onclick="ieNav('refresh')">
        <img src="img/ie-refresh-icon.png" style="width:42px;height:22px;image-rendering:pixelated;">
        <span>Refresh</span>
      </button>
      <button class="ie-nav-btn" id="ie-home" title="Home" onclick="ieNav('home')">
        <img src="img/ie-home-icon.png" style="width:42px;height:22px;image-rendering:pixelated;">
        <span>Home</span>
      </button>
      <button class="ie-nav-btn" id="ie-search" title="Search" onclick="ieLoad('https://google.com')">
        <img src="img/ie-search-icon.png" style="width:42px;height:22px;image-rendering:pixelated;">
        <span>Search</span>
      </button>
      <div class="ie-toolbar-sep"></div>
      <div class="ie-logo">
        <img src="img/internet-explorer.png" id="ie-logo-img" alt="">
      </div>
    </div>

    <div class="ie-addressbar">
      <span class="ie-address-label">Address</span>
      <input class="ie-address-input" id="ie-address" type="text" value="${HOME}"
        onkeydown="if(event.key==='Enter')ieGo()">
    </div>

    <div class="ie-linksbar">
      <span class="ie-links-label">Links</span>
      ${LINKS.map(l => `<button class="ie-link-btn" onclick="ieLoad('${l.url}')">${l.label}</button>`).join('')}
    </div>

    <div class="ie-content" id="ie-content">
      <iframe id="ie-frame" src="${HOME}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onload="ieFrameLoaded(this)" onerror="ieFrameError()"></iframe>
      <div id="ie-blocked" style="display:none;position:absolute;inset:0;background:#fff;padding:12px;font-family:Arial,sans-serif;font-size:13px;color:#000;"></div>
    </div>

    <div class="status-bar">
      <span class="status-item" id="ie-status" style="flex:1;">Done</span>
      <span class="status-item">Internet zone</span>
      <div class="status-resize-slot"></div>
    </div>
  `;

  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;';
  setTimeout(() => ieUpdateNavBtns(), 0);
}

let ieHistory = [];
let ieHistoryIndex = -1;

function ieUpdateNavBtns() {
  const backBtn = document.getElementById('ie-back');
  const fwdBtn  = document.getElementById('ie-forward');
  const canBack = ieHistoryIndex > 0;
  const canFwd  = ieHistoryIndex < ieHistory.length - 1;
  console.log('[IE nav]', { ieHistoryIndex, histLen: ieHistory.length, canBack, canFwd });
  if (backBtn) {
    const img = backBtn.querySelector('img');
    backBtn.style.opacity = canBack ? '1' : '0.4';
    backBtn.style.pointerEvents = canBack ? '' : 'none';
    if (img) img.src = canBack ? 'img/ie-back.png' : 'img/ie-back-disabled.png';
  }
  if (fwdBtn) {
    const img = fwdBtn.querySelector('img');
    fwdBtn.style.opacity = canFwd ? '1' : '0.4';
    fwdBtn.style.pointerEvents = canFwd ? '' : 'none';
    if (img) img.src = canFwd ? 'img/ie-forward.png' : 'img/ie-forward-disabled.png';
  }
}

function ieNav(action) {
  const frame = document.getElementById('ie-frame');
  if (!frame) return;
  if (action === 'back') {
    if (ieHistoryIndex > 0) { ieHistoryIndex--; ieLoad(ieHistory[ieHistoryIndex], true); }
  }
  if (action === 'forward') {
    if (ieHistoryIndex < ieHistory.length - 1) { ieHistoryIndex++; ieLoad(ieHistory[ieHistoryIndex], true); }
  }
  if (action === 'stop')    { frame.src = frame.src; }
  if (action === 'refresh') { try { frame.contentWindow.location.reload(); } catch(e){ frame.src = frame.src; } }
  if (action === 'home')    { ieLoad('https://cliowebsites.com'); }
}

function ieLoad(url, isBack) {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const frame   = document.getElementById('ie-frame');
  const addr    = document.getElementById('ie-address');
  const blocked = document.getElementById('ie-blocked');
  const status  = document.getElementById('ie-status');
  if (addr)    addr.value = url;
  if (blocked) { blocked.style.display = 'none'; blocked.textContent = ''; }
  if (frame)   { frame.style.display = 'none'; frame.src = 'about:blank'; }
  if (status)  status.textContent = 'Connecting to ' + url + '...';

  if (!isBack) {
    ieHistory = ieHistory.slice(0, ieHistoryIndex + 1);
    ieHistory.push(url);
    ieHistoryIndex = ieHistory.length - 1;
  }
  ieUpdateNavBtns();

  let hostname = url;
  try { hostname = new URL(url).hostname; } catch(e) {}

  fetch(url, { mode: 'no-cors', signal: AbortSignal.timeout(8000) })
    .then(() => {
      if (frame) { frame.style.display = 'block'; frame.src = url; }
    })
    .catch(err => {
      const msg = err.name === 'TimeoutError'
        ? hostname + ' timed out.'
        : (err.message || 'The page could not be loaded.');
      if (blocked) { blocked.textContent = 'Error: ' + msg; blocked.style.display = 'block'; }
      if (status)  status.textContent = 'Cannot connect to ' + hostname;
    });
}

function ieGo() {
  const addr = document.getElementById('ie-address');
  if (addr) ieLoad(addr.value.trim());
}

function ieFrameLoaded(frame) {
  const status  = document.getElementById('ie-status');
  const blocked = document.getElementById('ie-blocked');
  if (status) status.textContent = 'Done';
  if (!frame.src || frame.src === 'about:blank') return;
  let hostname = frame.src;
  try { hostname = new URL(frame.src).hostname; } catch(e) {}

  let isError = false;

  // Check 1: contentDocument accessible = browser error page (real cross-origin pages throw)
  try {
    const body = frame.contentDocument && frame.contentDocument.body;
    if (body) isError = true;
  } catch(e) { /* cross-origin success */ }

  // Check 2: contentWindow.location.href — chrome-error:// pages don't throw and expose a non-http URL
  if (!isError) {
    try {
      const href = frame.contentWindow.location.href;
      if (href && !/^https?:\/\//i.test(href)) isError = true;
    } catch(e) { /* cross-origin success */ }
  }

  if (isError) {
    if (blocked) { blocked.textContent = 'Error: ' + hostname + ' refused to connect.'; blocked.style.display = 'block'; }
    frame.style.display = 'none';
  }
}

function ieFrameError(e) {
  const blocked = document.getElementById('ie-blocked');
  const frame   = document.getElementById('ie-frame');
  const msg = (e && e.message) ? e.message : 'The page could not be loaded.';
  if (blocked) { blocked.textContent = 'Error: ' + msg; blocked.style.display = 'block'; }
  if (frame)   frame.style.display = 'none';
}
