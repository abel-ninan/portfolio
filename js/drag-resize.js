// ════════════════════════════════
//  DRAG
// ════════════════════════════════
// Pointer Events with pointer capture: one code path for mouse, touch and pen,
// and the listeners only live for the length of a drag (nothing is left on
// document). The title bar has touch-action:none in window.css.
function makeDraggable(win, handle, type) {
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary) return;
    if (e.target.closest('.win-btn, .window-controls')) return; // buttons (and their <img>) click normally
    const state = openWindows[type];
    if (!state || state.maximized) return; // full-screen / maximized windows don't move

    focusWindow(type);
    const desktop = document.getElementById('desktop');
    const startX = e.clientX, startY = e.clientY;
    const startL = win.offsetLeft, startT = win.offsetTop;
    const maxL = desktop.clientWidth  - win.offsetWidth;
    const maxT = desktop.clientHeight - win.offsetHeight;

    const onMove = ev => {
      if (ev.pointerId !== e.pointerId) return;
      win.style.left = Math.max(0, Math.min(maxL, startL + ev.clientX - startX)) + 'px';
      win.style.top  = Math.max(0, Math.min(maxT, startT + ev.clientY - startY)) + 'px';
    };
    const onEnd = ev => {
      if (ev.pointerId !== e.pointerId) return;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      handle.removeEventListener('lostpointercapture', onEnd);
      if (handle.hasPointerCapture && handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    };

    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
    handle.addEventListener('lostpointercapture', onEnd);
    e.preventDefault(); // no text selection while dragging
  });

  // Any press inside the window brings it to the front.
  win.addEventListener('pointerdown', () => focusWindow(type), true);
}

// ════════════════════════════════
//  RESIZE
// ════════════════════════════════
function makeResizable(win, handle, type) {
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary) return;
    const state = openWindows[type];
    if (!state || state.maximized) return;
    e.preventDefault();
    e.stopPropagation();

    focusWindow(type);
    const desktop = document.getElementById('desktop');
    const startX = e.clientX, startY = e.clientY;
    const startW = win.offsetWidth, startH = win.offsetHeight;
    // Never grow past the desktop's right or bottom edge.
    const maxW = desktop.clientWidth  - win.offsetLeft;
    const maxH = desktop.clientHeight - win.offsetTop;

    const onMove = ev => {
      if (ev.pointerId !== e.pointerId) return;
      win.style.width  = Math.max(220, Math.min(maxW, startW + ev.clientX - startX)) + 'px';
      win.style.height = Math.max(160, Math.min(maxH, startH + ev.clientY - startY)) + 'px';
    };
    const onEnd = ev => {
      if (ev.pointerId !== e.pointerId) return;
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      handle.removeEventListener('lostpointercapture', onEnd);
      if (handle.hasPointerCapture && handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
      if (openWindows[type]) {
        openWindows[type].prefW = win.offsetWidth;
        openWindows[type].prefH = win.offsetHeight;
      }
    };

    try { handle.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
    handle.addEventListener('lostpointercapture', onEnd);
  });
}
