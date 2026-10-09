// ════════════════════════════════
//  NOTEPAD
// ════════════════════════════════
// A real <textarea>. Desktop draws the Win95 scrollbar beside it; phones hide
// that and scroll the textarea natively by touch (css/mobile.css).
function buildNotepadWindow(container) {
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>S</u>earch</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="notepad-edit-row">
      <textarea class="notepad-ta" aria-label="Notepad text" spellcheck="false"></textarea>
      <div class="notepad-vscroll">
        <button class="notepad-scroll-btn notepad-scroll-up" tabindex="-1"></button>
        <div class="notepad-vtrack">
          <div class="notepad-vthumb"></div>
        </div>
        <button class="notepad-scroll-btn notepad-scroll-down" tabindex="-1"></button>
        <div style="width:16px;height:16px;flex-shrink:0;background:#c0c0c0;"></div>
      </div>
    </div>
  `;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  const row    = container.querySelector('.notepad-edit-row');
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
    const trackH  = vtrack.clientHeight;
    const thumbH  = Math.max(20, (ta.clientHeight / ta.scrollHeight) * trackH);
    const thumbT  = (ta.scrollTop / scrollable) * (trackH - thumbH);
    vthumb.style.height = thumbH + 'px';
    vthumb.style.top    = thumbT + 'px';
  }

  ta.addEventListener('scroll', () => { updateVScroll(); });
  ta.addEventListener('input',  () => { updateVScroll(); });

  vup.addEventListener('click',  () => { ta.scrollTop -= 20; updateVScroll(); });
  vdown.addEventListener('click', () => { ta.scrollTop += 20; updateVScroll(); });

  // Thumb drag with pointer capture: no document listeners left behind.
  let vDrag = null;
  vthumb.addEventListener('pointerdown', e => {
    vDrag = { id: e.pointerId, y: e.clientY, top: ta.scrollTop };
    try { vthumb.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  vthumb.addEventListener('pointermove', e => {
    if (!vDrag || e.pointerId !== vDrag.id) return;
    const scrollable = ta.scrollHeight - ta.clientHeight;
    const travel = Math.max(1, vtrack.clientHeight - vthumb.offsetHeight);
    ta.scrollTop = vDrag.top + (e.clientY - vDrag.y) * (scrollable / travel);
    updateVScroll();
  });
  const endDrag = () => { vDrag = null; };
  vthumb.addEventListener('pointerup', endDrag);
  vthumb.addEventListener('pointercancel', endDrag);

  ta.addEventListener('wheel', e => {
    if (isPhone()) return;
    e.preventDefault();
    ta.scrollTop += e.deltaY;
    updateVScroll();
  }, { passive: false });

  // Phones: while typing, end the text area above the on-screen keyboard
  // (which covers the window without resizing it), so the caret stays in view.
  ta.addEventListener('focus', notepadKeyboardFit);
  ta.addEventListener('blur', notepadKeyboardFit);
  row.classList.add('notepad-kb-row');

  setTimeout(() => { updateVScroll(); }, 50);
}

let notepadKbRaf = 0;
function notepadKeyboardFit() {
  if (notepadKbRaf) return;
  notepadKbRaf = requestAnimationFrame(() => {
    notepadKbRaf = 0;
    const win = document.getElementById('win-notepad');
    const row = win && win.querySelector('.notepad-kb-row');
    const ta = row && row.querySelector('.notepad-ta');
    if (!ta) return;
    const vv = window.visualViewport;
    let covered = 0;
    if (vv && document.activeElement === ta && isPhone()) {
      const r = row.getBoundingClientRect();
      covered = Math.max(0, Math.round(r.bottom - (vv.offsetTop + vv.height)));
      covered = Math.min(covered, Math.max(0, row.clientHeight - 60));
    }
    row.style.paddingBottom = covered ? covered + 'px' : '';
  });
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', notepadKeyboardFit);
  window.visualViewport.addEventListener('scroll', notepadKeyboardFit);
}
