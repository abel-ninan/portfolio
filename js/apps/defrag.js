// ════════════════════════════════
//  DISK DEFRAGMENTER
// ════════════════════════════════
function buildDefragWindow(container, type) {
  const BW = 9, BH = 12, GAP = 1;
  const CW = BW + GAP, CH = BH + GAP; // cell stride: 10w × 13h
  const ROWS_MAX = 150;               // total rows for ~15 min run

  const USED = 0, SYS = 1, FRAG = 2, FREE = 3, HEAD = 4, DEFRAG = 5;

  const cvId   = `dfcv-${type}`;
  const vpId   = `dfvp-${type}`;
  const fillId = `dffill-${type}`;
  const pctId  = `dfpct-${type}`;

  container.innerHTML = `
    <div class="defrag-body">
      <div class="defrag-scroll-row">
        <div class="defrag-viewport" id="${vpId}">
          <canvas id="${cvId}" style="position:absolute;top:0;left:0;image-rendering:pixelated;image-rendering:crisp-edges;"></canvas>
        </div>
        <div class="notepad-vscroll">
          <button class="notepad-scroll-btn notepad-scroll-up"></button>
          <div class="notepad-vtrack"><div class="notepad-vthumb"></div></div>
          <button class="notepad-scroll-btn notepad-scroll-down"></button>
        </div>
      </div>
      <div class="defrag-controls">
        <div class="defrag-info">
          <div class="defrag-status-txt">Defragmenting file system...</div>
          <div class="defrag-bar-track">
            <div class="defrag-bar-fill" id="${fillId}"></div>
          </div>
          <div class="defrag-pct" id="${pctId}">0% Complete</div>
        </div>
        <div class="defrag-btns">
          <button class="dialog-btn" id="dfstop-${type}" style="width:90px"><u>S</u>top</button>
          <button class="dialog-btn" id="dfpause-${type}" style="width:90px"><u>P</u>ause</button>
          <button class="dialog-btn" style="width:90px">Legend</button>
          <button class="dialog-btn" style="width:90px">Hide Details</button>
        </div>
      </div>
    </div>
  `;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  const vp     = document.getElementById(vpId);
  const cv     = document.getElementById(cvId);
  const ctx    = cv.getContext('2d');
  const fillEl = document.getElementById(fillId);
  const pctEl  = document.getElementById(pctId);
  const vtrack = container.querySelector('.notepad-vtrack');
  const vthumb = container.querySelector('.notepad-vthumb');
  const vup    = container.querySelector('.notepad-scroll-up');
  const vdown  = container.querySelector('.notepad-scroll-down');

  let COLS = 0;
  let grid, headPos, scrollOffset;
  let lastTs = 0, nextInterval = 200;
  let progressPos = 0, progressTimer = null;
  let paused = false, headBatch = [];

  function randInterval() { return 150 + Math.random() * 300; } // 150–450ms

  function initGrid(cols) {
    grid = new Uint8Array(ROWS_MAX * cols);
    for (let r = 0; r < ROWS_MAX; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, rnd = Math.random();
        if      (rnd < 0.07) grid[i] = FREE;
        else if (rnd < 0.13) grid[i] = FRAG;
        else                 grid[i] = USED;
      }
    }
  }

  function drawBlock(i) {
    const r = (i / COLS) | 0, c = i % COLS;
    const x = c * CW, y = r * CH;
    const t = grid[i];
    if (t === FREE) {
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(x, y, BW, BH);
      return;
    }
    if (t === FRAG) {
      // White base with red top-right quarter
      ctx.fillStyle = '#F0F0F0';
      ctx.fillRect(x, y, BW, BH);
      ctx.fillStyle = '#CC2020';
      ctx.fillRect(x + ((BW + 1) >> 1), y, BW >> 1, (BH + 1) >> 1);
      return;
    }
    if (t === HEAD) {
      ctx.fillStyle = '#FF2020';
      ctx.fillRect(x, y, BW, BH);
      ctx.fillStyle = '#000000';
      for (let dy = 0; dy < BH; dy++)
        for (let dx = dy & 1; dx < BW; dx += 2)
          ctx.fillRect(x + dx, y + dy, 1, 1);
      return;
    }
    if (t === DEFRAG) {
      // Completed blue with black checkerboard dots (like taskbar active tiles)
      ctx.fillStyle = '#1e83e2';
      ctx.fillRect(x, y, BW, BH);
      ctx.fillStyle = '#000000';
      for (let dy = 0; dy < BH; dy++)
        for (let dx = dy & 1; dx < BW; dx += 2)
          ctx.fillRect(x + dx, y + dy, 1, 1);
      return;
    }
    // USED or SYS — flat fill, black gap between cells acts as outline
    ctx.fillStyle = t === SYS ? '#0000A8' : '#0ce3f4';
    ctx.fillRect(x, y, BW, BH);
  }

  function drawRowRange(r0, r1) {
    for (let r = r0; r < r1; r++)
      for (let c = 0; c < COLS; c++) drawBlock(r * COLS + c);
  }

  // ── Scrollbar ──────────────────────────────
  function updateScrollbar() {
    const vpH = vp.clientHeight;
    const canH = ROWS_MAX * CH;
    const scrollable = Math.max(0, canH - vpH);
    scrollOffset = Math.max(0, Math.min(scrollOffset, scrollable));
    cv.style.top = -scrollOffset + 'px';
    vup.classList.toggle('scroll-disabled', scrollOffset <= 0);
    vdown.classList.toggle('scroll-disabled', scrollOffset >= scrollable);
    vtrack.classList.toggle('scroll-disabled', scrollable <= 0);
    if (scrollable <= 0) { vthumb.style.display = 'none'; return; }
    vthumb.style.display = '';
    const trackH = vtrack.clientHeight;
    const thumbH = Math.max(20, (vpH / canH) * trackH);
    const thumbT = (scrollOffset / scrollable) * (trackH - thumbH);
    vthumb.style.height = thumbH + 'px';
    vthumb.style.top    = thumbT + 'px';
  }

  function autoScroll() {
    const scrollable = Math.max(0, ROWS_MAX * CH - vp.clientHeight);
    if (scrollable > 0 && scrollOffset >= scrollable - CH * 3) {
      scrollOffset = scrollable;
      updateScrollbar();
    }
  }

  vup.addEventListener('click',   () => { scrollOffset -= CH * 3; updateScrollbar(); });
  vdown.addEventListener('click', () => { scrollOffset += CH * 3; updateScrollbar(); });

  let vDrag = false, vDragY = 0, vScrollStart = 0;
  vthumb.addEventListener('mousedown', e => {
    vDrag = true; vDragY = e.clientY; vScrollStart = scrollOffset; e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!vDrag) return;
    const canH = ROWS_MAX * CH, vpH = vp.clientHeight;
    const scrollable = Math.max(0, canH - vpH);
    const trackH = vtrack.clientHeight;
    const thumbH = Math.max(20, (vpH / canH) * trackH);
    scrollOffset = vScrollStart + (e.clientY - vDragY) * scrollable / (trackH - thumbH);
    updateScrollbar();
  });
  document.addEventListener('mouseup', () => { vDrag = false; });

  // ── Progress bar (whole blocks only) ───────
  function updateProgress() {
    const pct = Math.min(100, Math.floor(progressPos / (ROWS_MAX * COLS) * 100));
    const trackW = fillEl.parentElement.clientWidth - 4; // 2px padding each side
    const maxBlks = Math.floor(trackW / 10);
    fillEl.style.width = (Math.floor(pct / 100 * maxBlks) * 10) + 'px';
    pctEl.textContent = pct + '% Complete';
  }

  // ── Animation tick ──────────────────────────
  function tick(ts) {
    if (!document.getElementById(cvId)) return; // window closed
    if (paused) { requestAnimationFrame(tick); return; }
    if (ts - lastTs < nextInterval) { requestAnimationFrame(tick); return; }
    lastTs = ts;
    nextInterval = randInterval();

    if (headPos >= ROWS_MAX * COLS) {
      // Full pass complete — restart
      initGrid(COLS);
      headPos = 0;
      headBatch = [];
      scrollOffset = 0;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, cv.width, cv.height);
      const rightMargin = cv.width - COLS * CW;
      if (rightMargin > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(COLS * CW, 0, rightMargin, cv.height); }
      drawRowRange(0, ROWS_MAX);
      updateScrollbar();
      requestAnimationFrame(tick);
      return;
    }

    // Clear previous batch: all HEAD blocks → DEFRAG
    for (const pos of headBatch) {
      if (grid[pos] === HEAD) { grid[pos] = DEFRAG; drawBlock(pos); }
    }
    headBatch = [];

    // Advance 1–6 blocks this tick, biased toward 1–2; all flash red together
    const steps = 1 + Math.floor(Math.random() * Math.random() * 6);
    for (let s = 0; s < steps && headPos < ROWS_MAX * COLS; s++) {
      if (grid[headPos] !== SYS && grid[headPos] !== FREE && grid[headPos] !== FRAG) {
        grid[headPos] = HEAD;
        drawBlock(headPos);
        headBatch.push(headPos);
      }
      headPos++;
    }

    requestAnimationFrame(tick);
  }

  // ── Init after layout renders ───────────────
  setTimeout(() => {
    COLS = Math.max(10, Math.floor(vp.clientWidth / CW));

    cv.width  = vp.clientWidth; // exact viewport width — no black gap on right
    cv.height = ROWS_MAX * CH;  // pre-allocate full height

    initGrid(COLS);
    headPos      = 0;
    headBatch    = [];
    progressPos  = 0;
    scrollOffset = 0;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const rightMargin = cv.width - COLS * CW;
    if (rightMargin > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(COLS * CW, 0, rightMargin, cv.height); }
    drawRowRange(0, ROWS_MAX);
    updateScrollbar();
    updateProgress();

    // Progress bar runs on its own fixed 100ms timer, independent of animation speed
    progressTimer = setInterval(() => {
      if (!document.getElementById(cvId)) { clearInterval(progressTimer); return; }
      progressPos++;
      if (progressPos >= ROWS_MAX * COLS) progressPos = 0;
      updateProgress();
    }, 100);

    requestAnimationFrame(tick);

    // Wire Stop button
    const stopBtn = document.getElementById('dfstop-' + type);
    if (stopBtn) stopBtn.addEventListener('click', () => {
      clearInterval(progressTimer);
      closeWindow('defrag');
    });

    // Wire Pause button
    const pauseBtn = document.getElementById('dfpause-' + type);
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.innerHTML = paused ? '<u>R</u>esume' : '<u>P</u>ause';
    });
  }, 1000);
}
