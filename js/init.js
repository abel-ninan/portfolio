// ════════════════════════════════
//  CLOCK
// ════════════════════════════════
function updateClock() {
  const clock = document.getElementById('clock');
  if (!clock) { clearInterval(clockTimer); return; } // the shut down / log on screen replaced the desktop
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  clock.textContent = h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}
const clockTimer = setInterval(updateClock, 10000);
updateClock();

// ════════════════════════════════
//  GLOBAL CLICK HANDLERS
// ════════════════════════════════
document.addEventListener('click', e => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStartMenu();
  if (!e.target.closest('#context-menu')) hideContextMenu();
});

// Welcome opens as soon as the desktop is ready (the scripts run at the end
// of <body>), but never over a window the visitor already opened.
function openWelcome() {
  if (!Object.keys(openWindows).length) openWindow('welcome');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openWelcome);
else openWelcome();
