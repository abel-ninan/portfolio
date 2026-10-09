// ════════════════════════════════
//  BIO + CERTIFICATIONS (read-only Notepad documents)
// ════════════════════════════════
const NOTEPAD_DOC_MENUBAR = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>S</u>earch</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>`;

const NOTEPAD_DOC_VSCROLL = `
      <div class="notepad-vscroll">
        <button class="notepad-scroll-btn notepad-scroll-up" aria-label="Scroll up"></button>
        <div class="notepad-vtrack">
          <div class="notepad-vthumb"></div>
        </div>
        <button class="notepad-scroll-btn notepad-scroll-down" aria-label="Scroll down"></button>
        <div style="width:16px;height:16px;flex-shrink:0;background:#c0c0c0;"></div>
      </div>`;

// The drawn Win95 scrollbar next to a .notepad-ta. Thumb dragging uses
// pointer capture, so nothing is left on document between drags. On phones
// css/mobile.css hides the bar and the text scrolls natively by touch.
function wireNotepadScroll(container) {
  const ta     = container.querySelector('.notepad-ta');
  const vtrack = container.querySelector('.notepad-vtrack');
  const vthumb = container.querySelector('.notepad-vthumb');
  const vup    = container.querySelector('.notepad-scroll-up');
  const vdown  = container.querySelector('.notepad-scroll-down');

  function updateVScroll() {
    const scrollable = ta.scrollHeight - ta.clientHeight;
    const disabled = scrollable <= 0;
    vup.classList.toggle('scroll-disabled', disabled);
    vdown.classList.toggle('scroll-disabled', disabled);
    vtrack.classList.toggle('scroll-disabled', disabled);
    if (disabled) { vthumb.style.display = 'none'; return; }
    vthumb.style.display = '';
    const trackH = vtrack.clientHeight;
    const thumbH = Math.max(20, (ta.clientHeight / ta.scrollHeight) * trackH);
    const thumbT = (ta.scrollTop / scrollable) * (trackH - thumbH);
    vthumb.style.height = thumbH + 'px';
    vthumb.style.top    = thumbT + 'px';
  }

  ta.addEventListener('scroll', updateVScroll);
  vup.addEventListener('click',   () => { ta.scrollTop -= 20; updateVScroll(); });
  vdown.addEventListener('click', () => { ta.scrollTop += 20; updateVScroll(); });

  vthumb.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    const startY = e.clientY, startTop = ta.scrollTop;
    const onMove = ev => {
      const scrollable = ta.scrollHeight - ta.clientHeight;
      const room = vtrack.clientHeight - vthumb.offsetHeight;
      if (room > 0) ta.scrollTop = startTop + (ev.clientY - startY) * (scrollable / room);
      updateVScroll();
    };
    const onEnd = () => {
      vthumb.removeEventListener('pointermove', onMove);
      vthumb.removeEventListener('pointerup', onEnd);
      vthumb.removeEventListener('pointercancel', onEnd);
    };
    try { vthumb.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }
    vthumb.addEventListener('pointermove', onMove);
    vthumb.addEventListener('pointerup', onEnd);
    vthumb.addEventListener('pointercancel', onEnd);
    e.preventDefault();
  });

  ta.addEventListener('wheel', e => {
    if (isPhone()) return; // native scrolling there
    e.preventDefault();
    ta.scrollTop += e.deltaY;
    updateVScroll();
  }, { passive: false });

  // Track the window being resized or maximized.
  if (typeof ResizeObserver === 'function') new ResizeObserver(updateVScroll).observe(ta);
  setTimeout(updateVScroll, 50);
}

function buildBioWindow(container) {
  // PORTFOLIO.bio is trusted HTML (plain text plus inline <a> links).
  container.innerHTML = `
    ${NOTEPAD_DOC_MENUBAR}
    <div class="notepad-edit-row">
      <div class="notepad-ta pf-notepad-doc" tabindex="0">
        <div class="pf-bio">
          ${PORTFOLIO.bio.map(p => `<p>${p}</p>`).join('')}
        </div>
      </div>
      ${NOTEPAD_DOC_VSCROLL}
    </div>
  `;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  // Every link opens in a new tab, whatever the copy says.
  container.querySelectorAll('.pf-bio a').forEach(a => {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  });
  wireNotepadScroll(container);
}

function buildCertificationsWindow(container) {
  container.innerHTML = `
    ${NOTEPAD_DOC_MENUBAR}
    <div class="notepad-edit-row">
      <div class="notepad-ta pf-notepad-doc pf-notepad-pre" tabindex="0">${escapeHTML(PORTFOLIO.certificationsTxt)}</div>
      ${NOTEPAD_DOC_VSCROLL}
    </div>
  `;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  wireNotepadScroll(container);
}
