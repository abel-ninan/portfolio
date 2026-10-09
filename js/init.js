// ════════════════════════════════
//  CLOCK
// ════════════════════════════════
function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  document.getElementById('clock').textContent = h + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}
updateClock();
setInterval(updateClock, 10000);

// ════════════════════════════════
//  GLOBAL CLICK HANDLERS
// ════════════════════════════════
document.addEventListener('click', e => {
  if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStartMenu();
  if (!e.target.closest('#context-menu')) hideContextMenu();
});

// Auto-open Welcome on load
window.addEventListener('load', () => openWindow('welcome'));
