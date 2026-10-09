// ════════════════════════════════
//  SCREENSAVER
// ════════════════════════════════
// Desktop only (never on phones or touch-only devices). The 8MB video is not
// downloaded until the screensaver first starts: the <video> keeps its url in
// data-src with preload="none".
(function () {
  const IDLE_MS = 90000;
  const WAKE_GRACE_MS = 400; // ignore the pointer jitter right after it starts
  let idleTimer = null;
  let active = false;
  let shownAt = 0;
  let overlay, video;

  function disabled() {
    return isPhone() || window.matchMedia('(hover: none), (pointer: coarse)').matches;
  }

  function showScreensaver() {
    if (active || disabled()) return;
    // Focus inside the IE iframe means the user is busy there; so does a hidden tab.
    const a = document.activeElement;
    if (document.hidden || (a && a.tagName === 'IFRAME')) { resetTimer(); return; }
    active = true;
    shownAt = Date.now();
    if (!video.getAttribute('src') && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }
    overlay.style.display = 'block';
    try { video.currentTime = 0; } catch (err) { /* metadata not loaded yet */ }
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  }

  function hideScreensaver() {
    if (!active) return;
    active = false;
    overlay.style.display = 'none';
    video.pause();
    resetTimer();
  }

  function resetTimer() {
    clearTimeout(idleTimer);
    if (disabled()) return;
    idleTimer = setTimeout(showScreensaver, IDLE_MS);
  }

  function onActivity() {
    if (active) {
      if (Date.now() - shownAt > WAKE_GRACE_MS) hideScreensaver();
    } else {
      resetTimer();
    }
  }

  function init() {
    overlay = document.getElementById('screensaver');
    video   = document.getElementById('screensaver-video');
    if (!overlay || !video) return;

    video.loop = true;
    video.addEventListener('ended', () => { video.currentTime = 0; video.play(); });

    // Capture phase so activity inside windows (and scrolls, which don't bubble) counts.
    ['pointerdown', 'pointermove', 'mousedown', 'mousemove', 'keydown', 'wheel', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, onActivity, { capture: true, passive: true });
    });
    overlay.addEventListener('click', hideScreensaver);
    // Clicking into the IE iframe blurs this window: the user is still here.
    window.addEventListener('blur', () => { if (!active) resetTimer(); });
    window.addEventListener('focus', () => { if (!active) resetTimer(); });

    resetTimer();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
