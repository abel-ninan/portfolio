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
  const isMobile = () => window.matchMedia('(max-width:768px)').matches;
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

  document.addEventListener('DOMContentLoaded', function () {
    // Tap on a top-level has-submenu item
    document.getElementById('start-menu').addEventListener('click', function (e) {
      if (!isMobile()) return;
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
  });

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
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  const x = Math.min(e.clientX, window.innerWidth  - 170);
  const y = Math.min(e.clientY, window.innerHeight - 120);
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
  if (e.target === document.getElementById('desktop')) {
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  }
}

function selectIcon(e, id) {
  e.stopPropagation();
  document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
  document.getElementById(id).classList.add('selected');
}

function selectFile(el) {
  el.closest('.window-content').querySelectorAll('.file-item').forEach(f => f.classList.remove('selected'));
  el.classList.add('selected');
}

function openFileItem(name) {
  if (name === 'Nat Miletic Bio') { openWindow('bio'); return; }
  if (name === 'Photos') { openWindow('photos'); return; }
  if (name === 'Documents') { openWindow('documents'); return; }
  if (name.endsWith('.txt')) openWindow('notepad');
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
      // Update status bar dimensions
      const dimEl = document.querySelector('#win-paint .status-item:last-child');
      if (dimEl) dimEl.textContent = `${canvas.width} x ${canvas.height}`;
    };
    img.src = src;
  }, 50);
}

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

  const iconEl = document.getElementById(id);
  if (iconEl) iconEl.style.display = 'none';

  recycleBinItems.push({ id, name, src });

  const recycleImg = document.querySelector('#icon-recycle img');
  if (recycleImg) recycleImg.src = 'img/recycle-bin-full.png';

  document.getElementById('icon-recycle').classList.remove('selected');

  // Refresh window if open
  const body = document.getElementById('wbody-recycle');
  if (body) buildRecycleWindow(body);
}
