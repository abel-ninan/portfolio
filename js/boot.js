// ════════════════════════════════
//  BOOT VIDEO
// ════════════════════════════════
(function () {
  const screen = document.getElementById('boot-screen');
  const video  = document.getElementById('boot-video');
  if (!screen || !video) return;

  function dismissBoot() {
    screen.classList.add('fade-out');
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
  }

  video.addEventListener('ended', dismissBoot);
  video.addEventListener('error', dismissBoot);
  video.play().catch(dismissBoot);
})();

function reboot() {
  // Close all open windows and clear backdrop
  [...Object.keys(openWindows)].forEach(t => closeWindow(t));
  const backdrop = document.getElementById('shutdown-backdrop');
  if (backdrop) backdrop.remove();

  const screen = document.createElement('div');
  screen.id = 'boot-screen';
  screen.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999999;display:flex;align-items:center;justify-content:center;transition:opacity 0.5s ease;cursor:default;';

  const clickMsg = document.createElement('div');
  clickMsg.style.cssText = 'display:none;position:absolute;inset:0;align-items:center;justify-content:center;flex-direction:column;gap:16px;cursor:pointer;';
  clickMsg.innerHTML = `<p style="color:#fff;font-family:'MS Sans Serif',sans-serif;font-size:16px;animation:blinkText 1.2s step-start infinite;">Click to start Windows 95</p>`;

  screen.innerHTML = `<video id="reboot-video" playsinline muted autoplay style="width:100%;height:100%;object-fit:contain;background:#000;display:block;"><source src="videos/mmjdxbwbsb3b1.mp4" type="video/mp4"></video>`;
  screen.appendChild(clickMsg);
  document.body.appendChild(screen);

  function dismissReboot() {
    screen.style.transition = 'opacity 0.5s ease';
    screen.style.opacity = '0';
    screen.addEventListener('transitionend', () => screen.remove(), { once: true });
  }

  const vid = document.getElementById('reboot-video');
  vid.addEventListener('ended', dismissReboot);
  vid.addEventListener('error', () => {
    clickMsg.style.display = 'flex';
    clickMsg.addEventListener('click', dismissReboot, { once: true });
  });
  vid.play().catch(() => {
    clickMsg.style.display = 'flex';
    clickMsg.addEventListener('click', () => {
      vid.play().then(() => { clickMsg.style.display = 'none'; }).catch(dismissReboot);
    }, { once: true });
  });
}
