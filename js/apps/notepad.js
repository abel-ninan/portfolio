// ════════════════════════════════
//  NOTEPAD
// ════════════════════════════════
function buildNotepadWindow(container) {
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>S</u>earch</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="notepad-edit-row">
      <textarea class="notepad-ta"></textarea>
      <div class="notepad-vscroll">
        <button class="notepad-scroll-btn notepad-scroll-up"></button>
        <div class="notepad-vtrack">
          <div class="notepad-vthumb"></div>
        </div>
        <button class="notepad-scroll-btn notepad-scroll-down"></button>
        <div style="width:16px;height:16px;flex-shrink:0;background:#c0c0c0;"></div>
      </div>
    </div>
  `;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

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

  let vDrag = false, vDragY = 0, vScrollT = 0;
  vthumb.addEventListener('mousedown', e => {
    vDrag = true; vDragY = e.clientY; vScrollT = ta.scrollTop; e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (vDrag) {
      const scrollable = ta.scrollHeight - ta.clientHeight;
      ta.scrollTop = vScrollT + (e.clientY - vDragY) * (scrollable / (vtrack.clientHeight - vthumb.offsetHeight));
      updateVScroll();
    }
  });
  document.addEventListener('mouseup', () => { vDrag = false; });

  ta.addEventListener('wheel', e => {
    e.preventDefault();
    ta.scrollTop += e.deltaY;
    updateVScroll();
  }, { passive: false });

  setTimeout(() => { updateVScroll(); }, 50);
}
