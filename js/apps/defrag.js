// ════════════════════════════════
//  DISK DEFRAGMENTER
// ════════════════════════════════
// The animation and the progress timer run only while the window is shown:
// a ResizeObserver on the block map stops them when the window is minimized
// (display:none gives it a 0x0 size) and starts them again on restore, and
// everything is torn down when the window is closed.
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
          <canvas id="${cvId}" width="0" height="0" style="position:absolute;top:0;left:0;image-rendering:pixelated;image-rendering:crisp-edges;"></canvas>
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
          <button class="dialog-btn defrag-btn" id="dfstop-${type}"><u>S</u>top</button>
          <button class="dialog-btn defrag-btn" id="dfpause-${type}"><u>P</u>ause</button>
          <button class="dialog-btn defrag-btn">Legend</button>
          <button class="dialog-btn defrag-btn">Hide Details</button>
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
  let grid, headPos = 0, scrollOffset = 0;
  let lastTs = 0, nextInterval = 200;
  let progressPos = 0, progressTimer = null;
  let paused = false, headBatch = [];
  let ready = false, running = false, rafId = 0, gridW = 0;

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

  function redrawAll() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const rightMargin = cv.width - COLS * CW;
    if (rightMargin > 0) { ctx.fillStyle = '#fff'; ctx.fillRect(COLS * CW, 0, rightMargin, cv.height); }
    drawRowRange(0, ROWS_MAX);
  }

  // Size the block map to the viewport width. On a later width change
  // (rotation, phone <-> desktop) the map is rebuilt with the same share
  // already defragmented, so it never shows a cut-off or empty column.
  function layoutGrid() {
    const w = vp.clientWidth;
    if (!w) return false;
    if (w === gridW) return true;
    const done = COLS ? headPos / (ROWS_MAX * COLS) : 0;
    gridW = w;
    COLS = Math.max(10, Math.floor(w / CW));
    cv.width  = w;              // exact viewport width — no black gap on right
    cv.height = ROWS_MAX * CH;  // pre-allocate full height
    initGrid(COLS);
    headPos = Math.floor(done * ROWS_MAX * COLS);
    for (let i = 0; i < headPos; i++) if (grid[i] === USED) grid[i] = DEFRAG;
    headBatch = [];
    redrawAll();
    updateScrollbar();
    updateProgress();
    return true;
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

  vup.addEventListener('click',   () => { scrollOffset -= CH * 3; updateScrollbar(); });
  vdown.addEventListener('click', () => { scrollOffset += CH * 3; updateScrollbar(); });

  // Thumb drag (mouse, pen or touch) with pointer capture.
  let vDrag = null;
  vthumb.addEventListener('pointerdown', e => {
    vDrag = { id: e.pointerId, y: e.clientY, start: scrollOffset };
    try { vthumb.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  vthumb.addEventListener('pointermove', e => {
    if (!vDrag || e.pointerId !== vDrag.id) return;
    const canH = ROWS_MAX * CH, vpH = vp.clientHeight;
    const scrollable = Math.max(0, canH - vpH);
    const trackH = vtrack.clientHeight;
    const thumbH = Math.max(20, (vpH / canH) * trackH);
    scrollOffset = vDrag.start + (e.clientY - vDrag.y) * scrollable / Math.max(1, trackH - thumbH);
    updateScrollbar();
  });
  const endThumb = () => { vDrag = null; };
  vthumb.addEventListener('pointerup', endThumb);
  vthumb.addEventListener('pointercancel', endThumb);

  // The block map itself scrolls by wheel, or by dragging it with a finger.
  vp.addEventListener('wheel', e => {
    e.preventDefault();
    scrollOffset += e.deltaY;
    updateScrollbar();
  }, { passive: false });
  let mapDrag = null;
  vp.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    mapDrag = { id: e.pointerId, y: e.clientY, start: scrollOffset };
    try { vp.setPointerCapture(e.pointerId); } catch (err) {}
  });
  vp.addEventListener('pointermove', e => {
    if (!mapDrag || e.pointerId !== mapDrag.id) return;
    scrollOffset = mapDrag.start - (e.clientY - mapDrag.y);
    updateScrollbar();
  });
  const endMap = () => { mapDrag = null; };
  vp.addEventListener('pointerup', endMap);
  vp.addEventListener('pointercancel', endMap);

  // ── Progress bar (whole blocks only) ───────
  function updateProgress() {
    const pct = Math.min(100, Math.floor(progressPos / (ROWS_MAX * COLS) * 100));
    const trackW = fillEl.parentElement.clientWidth - 4; // 2px padding each side
    const maxBlks = Math.max(0, Math.floor(trackW / 10));
    fillEl.style.width = (Math.floor(pct / 100 * maxBlks) * 10) + 'px';
    pctEl.textContent = pct + '% Complete';
  }

  // ── Animation tick ──────────────────────────
  function tick(ts) {
    rafId = 0;
    if (!running) return;
    if (!cv.isConnected) { teardown(); return; } // window closed
    rafId = requestAnimationFrame(tick);
    if (paused) return;
    if (ts - lastTs < nextInterval) return;
    lastTs = ts;
    nextInterval = randInterval();

    if (headPos >= ROWS_MAX * COLS) {
      // Full pass complete — restart
      initGrid(COLS);
      headPos = 0;
      headBatch = [];
      scrollOffset = 0;
      redrawAll();
      updateScrollbar();
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
  }

  // ── Run / pause with the window's visibility ──
  function start() {
    if (running || !ready || !cv.isConnected) return;
    if (!layoutGrid()) return;
    running = true;
    // Progress bar runs on its own fixed 100ms timer, independent of animation speed
    progressTimer = setInterval(() => {
      if (!cv.isConnected) { teardown(); return; }
      if (paused) return;
      progressPos++;
      if (progressPos >= ROWS_MAX * COLS) progressPos = 0;
      updateProgress();
    }, 100);
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  }

  function teardown() {
    stop();
    ready = false;
    if (ro) ro.disconnect();
  }

  // Fires with a 0x0 size when the window is minimized, its real size when
  // it is restored or resized, and when the window is removed.
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    if (!vp.isConnected) { teardown(); return; }
    if (!ready) return;
    if (vp.clientWidth === 0) { stop(); return; }
    if (running) { layoutGrid(); updateScrollbar(); updateProgress(); }
    else start();
  }) : null;
  if (ro) ro.observe(vp);

  // ── Wire buttons ────────────────────────────
  const stopBtn = document.getElementById('dfstop-' + type);
  if (stopBtn) stopBtn.addEventListener('click', () => {
    teardown();
    closeWindow('defrag');
  });

  const pauseBtn = document.getElementById('dfpause-' + type);
  if (pauseBtn) pauseBtn.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.innerHTML = paused ? '<u>R</u>esume' : '<u>P</u>ause';
  });

  // ── Init after layout renders ───────────────
  setTimeout(() => {
    if (!cv.isConnected) { teardown(); return; }
    ready = true;
    start();
  }, 1000);
}
