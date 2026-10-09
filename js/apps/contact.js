// ════════════════════════════════
//  CONTACT  (Outlook Express - New Message)
// ════════════════════════════════
// Send opens the visitor's mail app with a mailto: link (nothing is sent
// over the network from this page). Copy email uses the clipboard API with
// an execCommand fallback.
const SEND_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">
  <rect x="2" y="7" width="17" height="12" fill="#fff" stroke="#000"/>
  <polyline points="2,7 10.5,14 19,7" fill="none" stroke="#000"/>
  <rect x="3" y="18" width="16" height="1" fill="#808080"/>
  <polygon points="14,2 23,2 23,11 20,8 16,12 13,9 17,5" fill="#000080"/>
</svg>`;

function buildContactWindow(container) {
  const P = PORTFOLIO;
  container.innerHTML = `
    <div class="window-menubar pf-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>I</u>nsert</span>
      <span class="menu-item">F<u>o</u>rmat</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="ct-toolbar">
      <button type="button" class="ct-tool ct-send" title="Send message">
        ${SEND_SVG}<span><u>S</u>end</span>
      </button>
    </div>
    <form class="ct-form" novalidate>
      <div class="ct-headers">
        <div class="ct-row">
          <label class="ct-label" for="ct-to">To:</label>
          <input class="ct-field" id="ct-to" type="text" value="${escapeHTML(P.email)}" readonly>
        </div>
        <div class="ct-row">
          <label class="ct-label" for="ct-subject">Subject:</label>
          <input class="ct-field" id="ct-subject" type="text" maxlength="200" autocomplete="off">
        </div>
      </div>
      <textarea class="ct-body" id="ct-body" aria-label="Message" placeholder="Hi Abel,"></textarea>
    </form>
    <div class="ct-other">
      <span class="ct-other-label">Other ways to reach me:</span>
      <div class="ct-other-btns">
        <a class="pf-btn pf-tool-btn" href="${escapeHTML(P.links.linkedin)}" target="_blank" rel="noopener noreferrer">
          <img src="img/linkedin.png" alt="">LinkedIn
        </a>
        <a class="pf-btn pf-tool-btn" href="${escapeHTML(P.links.github)}" target="_blank" rel="noopener noreferrer">
          <img src="${escapeHTML(ICONS.github)}" alt="">GitHub
        </a>
        <span class="ct-copy-wrap">
          <button type="button" class="pf-btn pf-tool-btn ct-copy">
            <img src="${escapeHTML(ICONS.contact)}" alt="">Copy email
          </button>
          <span class="ct-tip" role="status" aria-live="polite" hidden>Copied!</span>
        </span>
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item ct-status">Ready</span>
      <div class="status-resize-slot"></div>
    </div>
  `;

  // The body scrolls as a whole when the screen is too short (landscape phones).
  container.classList.add('ct-window');

  const form    = container.querySelector('.ct-form');
  const subject = container.querySelector('#ct-subject');
  const body    = container.querySelector('#ct-body');
  const status  = container.querySelector('.ct-status');
  const tip     = container.querySelector('.ct-tip');
  let statusTimer = 0;

  function setStatus(text, ms) {
    status.textContent = text;
    clearTimeout(statusTimer);
    if (ms) statusTimer = setTimeout(() => { status.textContent = 'Ready'; }, ms);
  }

  function send() {
    const params = [];
    if (subject.value.trim()) params.push('subject=' + encodeURIComponent(subject.value.trim()));
    if (body.value.trim()) params.push('body=' + encodeURIComponent(body.value));
    const url = 'mailto:' + P.email + (params.length ? '?' + params.join('&') : '');
    setStatus('Opening your email program...', 4000);
    window.location.href = url;
  }

  container.querySelector('.ct-send').addEventListener('click', send);
  form.addEventListener('submit', e => { e.preventDefault(); send(); });

  // Ctrl/Cmd+Enter sends, like Outlook Express.
  body.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
  });

  let tipTimer = 0;
  function showCopied(ok) {
    tip.textContent = ok ? 'Copied!' : 'Press Ctrl+C to copy';
    tip.hidden = false;
    setStatus(ok ? 'Email address copied to the clipboard.' : 'Select the address in the To: box and copy it.', 3000);
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { tip.hidden = true; }, 2000);
  }

  function copyFallback() {
    const ta = document.createElement('textarea');
    ta.value = P.email;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    if (!ok) {
      const to = container.querySelector('#ct-to');
      to.focus();
      to.select();
    }
    return ok;
  }

  container.querySelector('.ct-copy').addEventListener('click', () => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(P.email).then(() => showCopied(true), () => showCopied(copyFallback()));
    } else {
      showCopied(copyFallback());
    }
  });
}
