// ════════════════════════════════
//  SCREENSAVER
// ════════════════════════════════
(function () {
  const IDLE_MS = 20000;
  let idleTimer = null;
  let active = false;
  let overlay, video;

  function showScreensaver() {
    if (active) return;
    active = true;
    overlay.style.display = 'block';
    video.currentTime = 0;
    video.play();
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
    idleTimer = setTimeout(showScreensaver, IDLE_MS);
  }

  document.addEventListener('DOMContentLoaded', function () {
    overlay = document.getElementById('screensaver');
    video   = document.getElementById('screensaver-video');
    if (!overlay || !video) return;

    video.loop = true;
    video.addEventListener('ended', () => { video.currentTime = 0; video.play(); });

    // Start buffering the video 2s after page load so it's ready when the screensaver triggers
    setTimeout(() => { video.preload = 'auto'; video.load(); }, 2000);

    overlay.addEventListener('click',     hideScreensaver);
    overlay.addEventListener('mousemove', hideScreensaver);
    overlay.addEventListener('keydown',   hideScreensaver);

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'].forEach(evt => {
      document.addEventListener(evt, () => { if (!active) resetTimer(); }, { passive: true });
    });

    resetTimer();
  });
})();
