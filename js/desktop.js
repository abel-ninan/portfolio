// ════════════════════════════════
//  START MENU
// ════════════════════════════════
function toggleStartMenu(e) {
  e.stopPropagation();
  document.getElementById('start-menu').classList.toggle('visible');
  document.getElementById('start-btn').classList.toggle('pressed');
}
function closeStartMenu() {
  document.getElementById('start-menu').classList.remove('visible');
  document.getElementById('start-btn').classList.remove('pressed');
  mobileMenuReset();
}

// ════════════════════════════════
//  MOBILE DRILL-DOWN MENU
// ════════════════════════════════
(function () {
  let navStack = [];

  function getPanel() { return document.getElementById('start-submenu-panel'); }
  function getItems() { return document.getElementById('ssm-items'); }

  // Wire up has-submenu taps inside the panel (called after each panel update)
  function wirePanel() {
    getItems().querySelectorAll('.has-submenu').forEach(function (item) {
      item.addEventListener('click', function (e) {
        const sub = item.querySelector(':scope > .start-submenu');
        if (!sub) return;
        e.stopPropagation();
        navStack.push(getItems().innerHTML);
        getItems().innerHTML = sub.innerHTML;
        wirePanel();
      });
    });
  }

  function init() {
    // Tap on a top-level has-submenu item
    document.getElementById('start-menu').addEventListener('click', function (e) {
      if (!isPhone()) return;
      const panel = getPanel();
      if (panel.classList.contains('visible')) return; // panel already handling it
      const item = e.target.closest('.start-menu-item.has-submenu');
      if (!item) return;
      const sub = item.querySelector(':scope > .start-submenu');
      if (!sub) return;
      e.stopPropagation();
      navStack = [];
      getItems().innerHTML = sub.innerHTML;
      wirePanel();
      panel.classList.add('visible');
    });

    // Back button
    document.getElementById('ssm-back').addEventListener('click', function (e) {
      e.stopPropagation();
      if (navStack.length > 0) {
        getItems().innerHTML = navStack.pop();
        wirePanel();
      } else {
        mobileMenuReset();
      }
    });
  }

  // Scripts load at the end of <body>, so the menu usually exists already.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Exposed so closeStartMenu can call it
  window.mobileMenuReset = function () {
    const panel = getPanel();
    if (panel) panel.classList.remove('visible');
    const items = getItems();
    if (items) items.innerHTML = '';
    navStack = [];
  };
})();

// ════════════════════════════════
//  CONTEXT MENU
// ════════════════════════════════
function showContextMenu(e) {
  // Right-clicks inside a window belong to that window (or the browser).
  if (e.target instanceof Element && e.target.closest('.window, .winamp, [data-window-group]')) return;
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  const x = Math.max(0, Math.min(e.clientX, window.innerWidth  - 170));
  const y = Math.max(0, Math.min(e.clientY, window.innerHeight - 120));
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  menu.classList.add('visible');
}
function hideContextMenu() {
  document.getElementById('context-menu').classList.remove('visible');
}

// ════════════════════════════════
//  DESKTOP / ICON INTERACTIONS
// ════════════════════════════════
function desktopClick(e) {
  closeStartMenu();
  hideContextMenu();
  if (e.target === document.getElementById('desktop') || e.target === document.getElementById('desktop-icons')) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
}

function selectFile(el) {
  const scope = el.closest('.window-content') || el.parentElement;
  if (scope) scope.querySelectorAll('.file-item').forEach(f => f.classList.remove('selected'));
  el.classList.add('selected');
}

function openImageInPaint(src, filename) {
  const title = (filename || 'Image') + ' - Paint';
  openWindow('paint');
  // Wait for paint window to render, then load image onto canvas
  setTimeout(() => {
    const canvas = document.querySelector('.paint-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width  = img.naturalWidth  || 400;
      canvas.height = img.naturalHeight || 300;
      ctx.drawImage(img, 0, 0);
      // Update title bar
      const win = document.getElementById('win-paint');
      if (win) {
        const titleEl = win.querySelector('.window-title');
        if (titleEl) titleEl.textContent = title;
      }
      const btn = document.getElementById('tbtn-paint');
      if (btn) {
        const span = btn.querySelector('span');
        if (span) span.textContent = title;
      }
    };
    img.src = src;
  }, 50);
}

// ════════════════════════════════
//  SINGLE-CLICK OPEN  (no double-click anywhere)
// ════════════════════════════════
// Convention for any markup, on the desktop or inside windows:
//   data-open="<type>"   one click/tap runs openWindow(type)
//   data-href="<url>"    one click/tap opens the url in a new tab (noopener)
//   data-action="<name>" one click/tap runs the function registered with
//                        registerTapAction(name, fn), called as fn(element, event)
//   data-no-tap-open     opt an element (and its children) out of all of this
// Legacy items that only open on double-click (.file-item, Winamp playlist
// rows, or anything marked data-tap-open) get their dblclick handler run on a
// single click. Real double-clicks on those items are swallowed, and the
// guards below stop a double-click (or double-tap) from opening twice, or
// from also opening whatever appears under the pointer after the first click.
const TAP_OPEN_SELECTOR   = '[data-open], [data-href], [data-action]';
const TAP_DBLCLICK_ITEMS  = '.file-item, .wa-pl-row, [data-tap-open]';
const TAP_OPEN_EXCLUDE    = '[data-no-tap-open], .mine-cell';
const TAP_OPEN_GUARD_MS   = 600; // same element
const TAP_CASCADE_GUARD_MS = 350; // any element, right after something opened

const TAP_ACTIONS = {};
const tapLastOpened = new WeakMap();
let tapLastOpenAt = 0;
let tapPointerType = 'mouse';

function registerTapAction(name, fn) {
  TAP_ACTIONS[name] = fn;
}

document.addEventListener('pointerdown', e => { tapPointerType = e.pointerType || 'mouse'; }, true);

// True when this click should not open anything (2nd click of a double-click).
function tapShouldSkip(el, e) {
  const now = Date.now();
  if (now - (tapLastOpened.get(el) || 0) < TAP_OPEN_GUARD_MS) return true;
  if (tapPointerType === 'mouse') {
    // 2nd click of a double-click, even if a new window now sits under it.
    if (e.detail > 1) return true;
  } else if (now - tapLastOpenAt < TAP_CASCADE_GUARD_MS) {
    // Touch: click counts are unreliable (two quick taps on different things
    // at one spot are normal), so a double-tap is caught by time instead.
    return true;
  }
  tapLastOpened.set(el, now);
  tapLastOpenAt = now;
  return false;
}

// Open a url in a new tab without giving it a handle back to this page.
function openExternal(url) {
  if (!url) return;
  const w = window.open(url, '_blank', 'noopener');
  if (w) w.opener = null;
}

// Run whatever an element is wired to open.
function activateTapTarget(el, e) {
  if (el.dataset.open) {
    if (WINDOW_DEFS[el.dataset.open]) openWindow(el.dataset.open);
  } else if (el.dataset.href) {
    openExternal(el.dataset.href);
  } else if (el.dataset.action) {
    const fn = TAP_ACTIONS[el.dataset.action];
    if (typeof fn === 'function') fn(el, e);
  }
}

function selectTapTarget(el) {
  if (el.classList.contains('desktop-icon')) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
  } else if (el.classList.contains('file-item')) {
    selectFile(el);
  }
}

document.addEventListener('click', e => {
  if (e.button !== 0) return;
  const t = e.target;
  if (!(t instanceof Element) || t.closest(TAP_OPEN_EXCLUDE)) return;

  const el = t.closest(TAP_OPEN_SELECTOR);
  if (el) {
    selectTapTarget(el);
    if (el.tagName === 'A' && el.dataset.href) e.preventDefault();
    if (tapShouldSkip(el, e)) return;
    activateTapTarget(el, e);
    return;
  }

  const item = t.closest(TAP_DBLCLICK_ITEMS);
  if (item) {
    if (tapShouldSkip(item, e)) return;
    item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window, detail: 2 }));
  }
});

// Swallow real double-clicks on single-click items (their synthetic dblclick
// from the listener above is untrusted and passes through).
document.addEventListener('dblclick', e => {
  if (!e.isTrusted) return;
  const t = e.target;
  if (!(t instanceof Element) || t.closest(TAP_OPEN_EXCLUDE)) return;
  if (t.closest(TAP_OPEN_SELECTOR) || t.closest(TAP_DBLCLICK_ITEMS)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

// Keyboard: Enter / Space on a focused desktop icon (or other tap target).
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target;
  if (!(el instanceof Element) || !el.matches(TAP_OPEN_SELECTOR)) return;
  if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return; // these click natively
  e.preventDefault();
  selectTapTarget(el);
  if (!tapShouldSkip(el, e)) activateTapTarget(el, e);
});

// ════════════════════════════════
//  RECYCLE BIN DRAG & DROP
// ════════════════════════════════
let recycleBinItems = [];

function iconDragStart(e, id, name, src) {
  e.dataTransfer.setData('iconId', id);
  e.dataTransfer.setData('iconName', name);
  e.dataTransfer.setData('iconSrc', src);
  e.dataTransfer.effectAllowed = 'move';
}

function recycleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.getElementById('icon-recycle').classList.add('selected');
}

function recycleDragLeave(e) {
  document.getElementById('icon-recycle').classList.remove('selected');
}

function recycleDrop(e) {
  e.preventDefault();
  const id   = e.dataTransfer.getData('iconId');
  const name = e.dataTransfer.getData('iconName');
  const src  = e.dataTransfer.getData('iconSrc');
  if (!id || !name) return;

  // Hidden but still holding its grid cell, so the other icons don't move.
  const iconEl = document.getElementById(id);
  if (iconEl) iconEl.classList.add('recycled');

  recycleBinItems.push({ id, name, src });

  const recycleImg = document.querySelector('#icon-recycle img');
  if (recycleImg) recycleImg.src = 'img/recycle-bin-full.png';

  document.getElementById('icon-recycle').classList.remove('selected');

  // Refresh window if open
  const body = document.getElementById('wbody-recycle');
  if (body) buildRecycleWindow(body);
}

// Draggable desktop icons (draggable="true") can be dropped on the Recycle Bin.
(function () {
  const icons = document.getElementById('desktop-icons');
  if (icons) {
    icons.addEventListener('dragstart', e => {
      const icon = e.target.closest && e.target.closest('.desktop-icon[draggable="true"]');
      if (!icon) return;
      const label = icon.querySelector('.icon-label');
      const img = icon.querySelector('img');
      iconDragStart(e, icon.id, label ? label.textContent.trim() : icon.id, img ? img.getAttribute('src') : '');
    });
  }
  const bin = document.getElementById('icon-recycle');
  if (bin) {
    bin.addEventListener('dragover', recycleDragOver);
    bin.addEventListener('dragleave', recycleDragLeave);
    bin.addEventListener('drop', recycleDrop);
  }
})();
