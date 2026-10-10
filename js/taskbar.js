// ════════════════════════════════
//  TASKBAR
// ════════════════════════════════
function addTaskbarBtn(type, title, iconKey) {
  const bar = document.getElementById('taskbar-windows');
  const btn = document.createElement('button');
  btn.className = 'taskbar-btn active';
  btn.id = 'tbtn-' + type;
  btn.setAttribute('aria-label', title);
  const short = WINDOW_DEFS[type] && WINDOW_DEFS[type].taskbarTitle;
  btn.innerHTML = `<img src="${escapeHTML(ICONS[iconKey] || '')}" alt=""><span></span>` +
    (short ? '<span class="tb-short"></span>' : '');
  btn.querySelector('span').textContent = title;
  if (short) {
    btn.querySelector('span').classList.add('tb-long');
    btn.querySelector('.tb-short').textContent = short;
  }
  btn.addEventListener('click', () => {
    const state = openWindows[type];
    if (!state) return;
    if (state.minimized) {
      restoreWindow(type);
      focusWindow(type);
    } else if (activeWindow === type) {
      minimizeWindow(type);
    } else {
      restoreWindow(type);
      focusWindow(type);
    }
  });
  bar.appendChild(btn);
  // Phones: the button strip scrolls sideways; keep the new button in view.
  if (bar.scrollWidth > bar.clientWidth) bar.scrollLeft = bar.scrollWidth;
}
