// ════════════════════════════════
//  DRAG
// ════════════════════════════════
function makeDraggable(win, handle, type) {
  let startX, startY, startL, startT, dragging = false;

  const onDown = (cx, cy) => {
    if (openWindows[type].maximized) return;
    dragging = true;
    startX = cx; startY = cy;
    startL = parseInt(win.style.left) || 0;
    startT = parseInt(win.style.top) || 0;
    focusWindow(type);
  };

  const onMove = (cx, cy) => {
    if (!dragging) return;
    const desktop = document.getElementById('desktop');
    const nx = Math.max(0, Math.min(desktop.offsetWidth  - win.offsetWidth,  startL + cx - startX));
    const ny = Math.max(0, Math.min(desktop.offsetHeight - win.offsetHeight, startT + cy - startY));
    win.style.left = nx + 'px';
    win.style.top  = ny + 'px';
  };

  handle.addEventListener('mousedown', e => {
    if (e.target.classList.contains('win-btn')) return;
    onDown(e.clientX, e.clientY);
    e.preventDefault();
  });
  handle.addEventListener('touchstart', e => {
    if (e.target.classList.contains('win-btn')) return;
    onDown(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  document.addEventListener('mousemove',  e => onMove(e.clientX, e.clientY));
  document.addEventListener('touchmove',  e => onMove(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  document.addEventListener('mouseup',    () => { dragging = false; });
  document.addEventListener('touchend',   () => { dragging = false; });

  win.addEventListener('mousedown', () => focusWindow(type));
}

// ════════════════════════════════
//  RESIZE
// ════════════════════════════════
function makeResizable(win, handle, type) {
  let startX, startY, startW, startH, resizing = false;

  handle.addEventListener('mousedown', e => {
    if (openWindows[type].maximized) return;
    resizing = true;
    startX = e.clientX; startY = e.clientY;
    startW = win.offsetWidth; startH = win.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    win.style.width  = Math.max(220, startW + e.clientX - startX) + 'px';
    win.style.height = Math.max(160, startH + e.clientY - startY) + 'px';
  });
  document.addEventListener('mouseup', () => { resizing = false; });
}
