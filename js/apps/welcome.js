// ════════════════════════════════
//  WELCOME
// ════════════════════════════════
// The original Win95 welcome dialog. Layout lives in css/apps/portfolio.css
// (.wl-*) so it can stack the buttons under the yellow box on narrow screens.
function buildWelcomeWindow(container) {
  const W = PORTFOLIO.welcome;
  container.innerHTML = `
    <div class="wl-root">

      <!-- Header: grey background -->
      <div class="wl-header">
        <span class="wl-h-light">Welcome to </span><span class="wl-h-bold">Windows</span><span class="wl-h-95">95</span>
      </div>

      <!-- Main row: yellow box + buttons -->
      <div class="wl-main">

        <!-- Yellow sunken box: text, then headshot -->
        <div class="wl-box">
          <div class="wl-text">
            <div class="wl-headline">${escapeHTML(W.headline)}</div>
            <div class="wl-body">${escapeHTML(W.body)}</div>
          </div>
          <img class="wl-photo" draggable="false" src="img/headshot.jpg" alt="${escapeHTML(PORTFOLIO.name)}" width="140" height="140">
        </div>

        <!-- Right: buttons -->
        <div class="wl-buttons">
          <div class="wl-spacer"></div>
          <div class="wl-sep"></div>
          <div class="wl-gap"></div>
          <button class="dialog-btn wl-btn wl-close"><u>C</u>lose</button>
        </div>

      </div>
    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;';
  container.querySelector('.wl-close').addEventListener('click', () => closeWindow('welcome'));
}
