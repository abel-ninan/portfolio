// ════════════════════════════════
//  TASKBAR
// ════════════════════════════════
function addTaskbarBtn(type, title, iconKey) {
  const bar = document.getElementById('taskbar-windows');
  const btn = document.createElement('button');
  btn.className = 'taskbar-btn active';
  btn.id = 'tbtn-' + type;
  btn.innerHTML = `<img src="${ICONS[iconKey] || ''}" alt=""><span>${title}</span>`;
  btn.onclick = () => {
    if (openWindows[type].minimized) {
      restoreWindow(type);
      focusWindow(type);
    } else if (activeWindow === type) {
      minimizeWindow(type);
    } else {
      restoreWindow(type);
      focusWindow(type);
    }
  };
  bar.appendChild(btn);
}
