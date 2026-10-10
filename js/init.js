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

// Tapping (or hovering) the clock shows today's date in a yellow tooltip,
// like the Windows 95 taskbar clock.
let clockTipTimer = null;
function showClockTip(autoHide) {
  const tip = document.getElementById('clock-tip');
  if (!tip) return;
  tip.textContent = new Date().toLocaleDateString('en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  tip.classList.add('visible');
  clearTimeout(clockTipTimer);
  if (autoHide) clockTipTimer = setTimeout(hideClockTip, 4000);
}
function hideClockTip() {
  clearTimeout(clockTipTimer);
  const tip = document.getElementById('clock-tip');
  if (tip) tip.classList.remove('visible');
}
(function wireClockTip() {
  const clock = document.getElementById('clock');
  if (!clock) return;
  let hoverTimer = null;
  clock.addEventListener('click', e => {
    e.stopPropagation();
    const tip = document.getElementById('clock-tip');
    if (tip && tip.classList.contains('visible')) hideClockTip();
    else showClockTip(true);
  });
  clock.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showClockTip(true); }
  });
  clock.addEventListener('pointerenter', e => {
    if (e.pointerType !== 'mouse') return;
    hoverTimer = setTimeout(() => showClockTip(false), 500);
  });
  clock.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer);
    hideClockTip();
  });
})();

// ════════════════════════════════
//  GLOBAL CLICK HANDLERS
// ════════════════════════════════
document.addEventListener('click', e => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStartMenu();
  if (!e.target.closest('#context-menu')) hideContextMenu();
  if (!e.target.closest('#clock')) hideClockTip();
});

// Welcome opens as soon as the desktop is ready (the scripts run at the end
// of <body>), but never over a window the visitor already opened.
function openWelcome() {
  if (!Object.keys(openWindows).length) openWindow('welcome');
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openWelcome);
else openWelcome();
