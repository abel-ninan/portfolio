// ════════════════════════════════
//  BIO (Notepad-style)
// ════════════════════════════════
function buildBioWindow(container) {
  const s = "font-family:'Fixedsys','Courier New',monospace;font-size:16px;line-height:1.6;color:#000;padding:8px;";
  const a = 'color:#000080;text-decoration:underline;cursor:pointer;';
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>S</u>earch</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="notepad-edit-row">
      <div class="notepad-ta" style="overflow:hidden;display:block;white-space:normal;">
        <div style="${s}">
          <p style="margin-bottom:12px;">Nat Miletic is the founder of <a href="https://cliowebsites.com" target="_blank" style="${a}">Clio Websites</a> and co-founder of <a href="https://websitesusa.com" target="_blank" style="${a}">Websites USA</a>. With a BCIS and an MBA under his belt, Nat's all about helping businesses thrive online with his sharp eye for detail and relentless passion for making things better.</p>
          <p style="margin-bottom:12px;">From crafting sleek WordPress websites to boosting SEO and ensuring everything works smoothly across devices, Nat's helped businesses big and small grow their online presence. Whether it's global brands like MyFitnessPal or local favorites like Galvanic, his work has made websites not only look great but also perform better in search results.</p>
          <p style="margin-bottom:12px;">Nat's been in the web development and marketing game since the early 2000s, and he loves sharing his insights with thousands of followers on social media.</p>
          <p style="margin-bottom:12px;">Oh, and did we mention? He's also the author of <a href="https://clientbytes.gumroad.com/l/dev-agency-and-freelancer-sales" target="_blank" style="${a}">Client Bytes – Dev Agency and Freelancer Sales</a> and has created several WordPress and SEO courses available on Gumroad and Udemy. He also co-hosts a podcast called The Agency Hustle with Kyle Prinsloo.</p>
        </div>
      </div>
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
    const trackH = vtrack.clientHeight;
    const thumbH = Math.max(20, (ta.clientHeight / ta.scrollHeight) * trackH);
    const thumbT = (ta.scrollTop / scrollable) * (trackH - thumbH);
    vthumb.style.height = thumbH + 'px';
    vthumb.style.top    = thumbT + 'px';
  }

  ta.addEventListener('scroll', () => { updateVScroll(); });

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
