// ════════════════════════════════
//  MINESWEEPER
// ════════════════════════════════
// Win95 rules: the first click is always safe (no mine in its 3x3), the
// right button flags (flag, ?, clear), and clicking a number whose flags are
// all placed opens its other neighbors (chord; double-click works too).
// Touch screens: a long-press flags a square, the Flag button next to the
// smiley turns taps into flags, and tapping a number chords.
//
// Size: cells are 22px as in Win95 on desktop. On phones they grow up to 30px
// when there is room and shrink to fit the screen, down to 16px; Expert is
// played as 30 rows x 16 columns on a portrait phone (a game in progress is
// turned with the phone). When the board still does not fit, it scrolls
// inside the window under the counters. On short landscape phones the
// counters stand beside the board instead.
const MINE_LEVELS = {
  beginner:     { rows: 9,  cols: 9,  mines: 10, label: 'Beginner' },
  intermediate: { rows: 16, cols: 16, mines: 40, label: 'Intermediate' },
  expert:       { rows: 16, cols: 30, mines: 99, label: 'Expert' },
};
const MINE_CELL = 22;            // Win95 cell size (desktop)
const MINE_CELL_PHONE_MAX = 30;  // biggest cell on phones
const MINE_CELL_MIN = 20;        // smallest comfortable tap target
const MINE_CELL_FLOOR = 16;      // never smaller; the board scrolls instead
const MINE_LONG_PRESS_MS = 450;
const MINE_MOVE_SLOP = 10;       // px a finger may move before a press becomes a scroll

let mineLevel = 'beginner';
let mineRows = 9, mineCols = 9, mineTotalMines = 10;
let mineBoard = [], mineRevealed = 0, mineFlags = 0;
let mineGameOver = false, mineGameWon = false, mineFirstClick = true;
let mineTimerVal = 0, mineTimerInterval = null;
let mineFlagMode = false;
let minePress = null;            // the press in progress on the board
let mineLastPointer = 'mouse';
let mineCellEls = [];            // [r][c] -> element
let mineResizeObserver = null;
let mineLayoutRaf = 0;

const MINE_NUM_COLORS = ['','#0000ff','#008000','#ff0000','#000080','#800000','#008080','#000000','#808080'];

// The smiley, drawn as 16x16 pixel art ('#' black, 'y' yellow) like Win95's.
const MINE_FACE_TOP = ['.....######.....', '...##yyyyyy##...', '..#yyyyyyyyyy#..', '.#yyyyyyyyyyyy#.'];
const MINE_FACE_BOTTOM = ['.#yyyyyyyyyyyy#.', '..#yyyyyyyyyy#..', '...##yyyyyy##...', '.....######.....'];
const MINE_FACE_EYES = ['.#yyyyyyyyyyyy#.', '#yyyy##yy##yyyy#', '#yyyy##yy##yyyy#', '#yyyyyyyyyyyyyy#'];
const MINE_FACE_SMILE = ['#yyyyyyyyyyyyyy#', '#yyy#yyyyyy#yyy#', '#yyyy#yyyy#yyyy#', '.#yyyy####yyyy#.'];
const MINE_FACES = {
  smile: MINE_FACE_EYES.concat(MINE_FACE_SMILE),
  oh:    MINE_FACE_EYES.concat(['#yyyyyy##yyyyyy#', '#yyyyy#yy#yyyyy#', '#yyyyy#yy#yyyyy#', '.#yyyyy##yyyyy#.']),
  cool:  ['#y############y#', '#yy####yy####yy#', '#yyy##yyyy##yyy#', '#yyyyyyyyyyyyyy#'].concat(MINE_FACE_SMILE),
  dead:  ['.#yyyyyyyyyyyy#.', '#yyy#y#yy#y#yyy#', '#yyyy#yyyy#yyyy#', '#yyy#y#yy#y#yyy#',
          '#yyyyyyyyyyyyyy#', '#yyyyyyyyyyyyyy#', '#yyyyy####yyyyy#', '.#yyy#yyyy#yyy#.'],
};

function mineFaceSVG(name) {
  const rows = MINE_FACE_TOP.concat(MINE_FACES[name] || MINE_FACES.smile, MINE_FACE_BOTTOM);
  const paths = { '#': '', y: '' };
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const c = row[x];
      let n = 1;
      while (row[x + n] === c) n++;
      if (paths[c] !== undefined) paths[c] += `M${x},${y}h${n}v1h-${n}z`;
      x += n;
    }
  });
  return `<svg class="mine-face" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">` +
    `<path d="${paths.y}" fill="#ffff00"/><path d="${paths['#']}" fill="#000"/></svg>`;
}

function buildMinesweeperWindow(container) {
  container.classList.add('mine-body');
  container.innerHTML = `
    <div class="window-menubar mine-menubar">
      <span class="menu-item" id="mine-game-btn" role="button" aria-haspopup="true" aria-expanded="false"><u>G</u>ame</span>
      <div class="mine-menu" id="mine-game-menu" role="menu" hidden>
        ${Object.keys(MINE_LEVELS).map(k => `
          <div class="mine-menu-item" role="menuitemradio" data-mine-level="${k}">
            <span class="mine-menu-check"></span>${MINE_LEVELS[k].label}
          </div>`).join('')}
        <div class="mine-menu-sep" role="separator"></div>
        <div class="mine-menu-item" role="menuitem" data-mine-cmd="new">
          <span class="mine-menu-check"></span>New Game<span class="mine-menu-key">F2</span>
        </div>
      </div>
    </div>
    <div class="mine-main">
      <div class="mine-header">
        <div class="mine-lcd" id="mine-count-lcd">010</div>
        <div class="mine-header-mid">
          <button class="mine-face-btn" id="mine-face-btn" title="New game" aria-label="New game" data-face="smile">${mineFaceSVG('smile')}</button>
          <button class="mine-flag-btn" id="mine-flag-btn" title="Flag mode: taps place flags"
            aria-label="Flag mode" aria-pressed="false">🚩</button>
        </div>
        <div class="mine-lcd" id="mine-timer-lcd">000</div>
      </div>
      <div class="mine-field-border" id="mine-field">
        <div class="mine-field-scroll" id="mine-scroll">
          <div class="mine-grid" id="mine-grid"></div>
        </div>
      </div>
    </div>
  `;

  // Right-clicks are the game's, not the desktop's (its context menu would
  // open on top of the board).
  container.addEventListener('contextmenu', e => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Game menu
  const menu = container.querySelector('#mine-game-menu');
  container.querySelector('#mine-game-btn').addEventListener('click', e => {
    e.stopPropagation();
    if (menu.hidden) mineOpenMenu(); else mineCloseMenu();
  });
  menu.addEventListener('click', e => {
    const item = e.target.closest('.mine-menu-item');
    if (!item) return;
    mineCloseMenu();
    if (item.dataset.mineLevel) mineSetLevel(item.dataset.mineLevel);
    else mineNewGame();
  });

  // Header
  container.querySelector('#mine-face-btn').addEventListener('click', () => mineNewGame());
  container.querySelector('#mine-flag-btn').addEventListener('click', () => mineSetFlagMode(!mineFlagMode));
  mineSetFlagMode(mineFlagMode);

  // Board (one set of delegated listeners; cells are re-used between renders)
  const grid = container.querySelector('#mine-grid');
  grid.addEventListener('pointerdown', mineOnPointerDown);
  grid.addEventListener('pointermove', mineOnPointerMove);
  grid.addEventListener('pointerup', mineOnPointerUp);
  grid.addEventListener('pointercancel', mineCancelPress);
  grid.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') mineCancelPress(); });
  grid.addEventListener('contextmenu', mineOnContextMenu);
  grid.addEventListener('dblclick', e => {
    const cell = mineCellFrom(e.target);
    if (cell) mineChord(+cell.dataset.r, +cell.dataset.c);
  });

  // Re-fit on rotation / resize, and when the window is shown again.
  if (mineResizeObserver) mineResizeObserver.disconnect();
  mineResizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(mineQueueLayout) : null;
  if (mineResizeObserver) {
    mineResizeObserver.observe(document.getElementById('desktop'));
    const win = document.getElementById('win-minesweeper');
    if (win) mineResizeObserver.observe(win);
  }

  mineNewGame();
}

// ════════════════════════════════
//  MENU
// ════════════════════════════════
function mineOpenMenu() {
  const menu = document.getElementById('mine-game-menu');
  const btn = document.getElementById('mine-game-btn');
  if (!menu || !menu.hidden) return;
  menu.querySelectorAll('[data-mine-level]').forEach(el => {
    const on = el.dataset.mineLevel === mineLevel;
    el.setAttribute('aria-checked', on);
    el.querySelector('.mine-menu-check').innerHTML = on ? '&#10003;' : '';
  });
  menu.hidden = false;
  btn.classList.add('mine-menu-open');
  btn.setAttribute('aria-expanded', 'true');
  // Keep it inside the window body.
  const body = document.getElementById('wbody-minesweeper');
  if (body) menu.style.maxHeight = Math.max(80, body.clientHeight - menu.offsetTop) + 'px';
  document.addEventListener('pointerdown', mineMenuOutside, true);
  document.addEventListener('keydown', mineMenuKey, true);
}

function mineCloseMenu() {
  const menu = document.getElementById('mine-game-menu');
  const btn = document.getElementById('mine-game-btn');
  document.removeEventListener('pointerdown', mineMenuOutside, true);
  document.removeEventListener('keydown', mineMenuKey, true);
  if (menu) menu.hidden = true;
  if (btn) {
    btn.classList.remove('mine-menu-open');
    btn.setAttribute('aria-expanded', 'false');
  }
}

function mineMenuOutside(e) {
  const t = e.target;
  if (t.closest && (t.closest('#mine-game-menu') || t.closest('#mine-game-btn'))) return;
  mineCloseMenu();
}

function mineMenuKey(e) {
  if (e.key === 'Escape') { e.preventDefault(); mineCloseMenu(); }
}

// F2 = new game (Win95), while Minesweeper is the active window.
document.addEventListener('keydown', e => {
  if (e.key === 'F2' && activeWindow === 'minesweeper' && document.getElementById('mine-grid')) {
    e.preventDefault();
    mineNewGame();
  }
});

// ════════════════════════════════
//  GAME
// ════════════════════════════════
function mineSetLevel(level) {
  if (!MINE_LEVELS[level]) return;
  mineLevel = level;
  mineNewGame();
}

// Kept for older callers: mineSetDifficulty(rows, cols, mines).
function mineSetDifficulty(r, c, m) {
  const key = Object.keys(MINE_LEVELS).find(k => {
    const lv = MINE_LEVELS[k];
    return lv.mines === m && ((lv.rows === r && lv.cols === c) || (lv.rows === c && lv.cols === r));
  });
  mineSetLevel(key || 'beginner');
}

function mineNewGame() {
  if (mineTimerInterval) { clearInterval(mineTimerInterval); mineTimerInterval = null; }
  mineTimerVal = 0; mineFirstClick = true; mineGameOver = false; mineGameWon = false;
  mineFlags = 0; mineRevealed = 0; minePress = null;

  const lv = MINE_LEVELS[mineLevel];
  const turned = mineShouldTurn();
  mineRows = turned ? lv.cols : lv.rows;
  mineCols = turned ? lv.rows : lv.cols;
  mineTotalMines = lv.mines;
  mineBoard = Array.from({ length: mineRows }, () =>
    Array.from({ length: mineCols }, () => ({ mine: false, revealed: false, flagged: false, questioned: false, adj: 0 }))
  );

  mineLCDSet('mine-count-lcd', mineTotalMines);
  mineLCDSet('mine-timer-lcd', 0);
  mineSetFace('smile');
  // Size the window first: a grid briefly wider than its window leaves
  // WebKit with a stale height.
  mineLayout();
  mineBuildGrid();
  mineRenderGrid();
  const scroll = document.getElementById('mine-scroll');
  if (scroll) { scroll.scrollTop = 0; scroll.scrollLeft = 0; }
}

function minePlaceMines(safeR, safeC) {
  const safe = new Set([`${safeR},${safeC}`]);
  // Also protect the 8 neighbors
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) safe.add(`${safeR+dr},${safeC+dc}`);
  let placed = 0;
  while (placed < mineTotalMines) {
    const r = Math.floor(Math.random() * mineRows);
    const c = Math.floor(Math.random() * mineCols);
    if (!mineBoard[r][c].mine && !safe.has(`${r},${c}`)) {
      mineBoard[r][c].mine = true; placed++;
    }
  }
  for (let r = 0; r < mineRows; r++)
    for (let c = 0; c < mineCols; c++)
      mineBoard[r][c].adj = mineCountAdj(r, c);
}

function mineCountAdj(r, c) {
  let n = 0;
  mineEachNeighbor(r, c, (nr, nc) => { if (mineBoard[nr][nc].mine) n++; });
  return n;
}

function mineEachNeighbor(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const nr = r + dr, nc = c + dc;
    if ((dr || dc) && nr >= 0 && nr < mineRows && nc >= 0 && nc < mineCols) fn(nr, nc);
  }
}

function mineStartTimer() {
  if (mineTimerInterval) clearInterval(mineTimerInterval);
  mineTimerInterval = setInterval(() => {
    if (!document.getElementById('mine-timer-lcd')) { // window closed
      clearInterval(mineTimerInterval); mineTimerInterval = null;
      return;
    }
    mineTimerVal = Math.min(mineTimerVal + 1, 999);
    mineLCDSet('mine-timer-lcd', mineTimerVal);
  }, 1000);
}

// Open a square (and the empty area around it). Returns false on a mine.
function mineOpen(r, c) {
  const cell = mineBoard[r][c];
  if (cell.revealed || cell.flagged) return true;
  if (cell.mine) {
    cell.revealed = true;
    cell.exploded = true;
    return false;
  }
  const stack = [[r, c]];
  while (stack.length) {
    const [y, x] = stack.pop();
    const cur = mineBoard[y][x];
    if (cur.revealed || cur.flagged) continue;
    cur.revealed = true; cur.questioned = false; mineRevealed++;
    if (cur.adj === 0) {
      mineEachNeighbor(y, x, (ny, nx) => {
        const n = mineBoard[ny][nx];
        if (!n.revealed && !n.flagged && !n.mine) stack.push([ny, nx]);
      });
    }
  }
  return true;
}

function mineReveal(r, c) {
  if (mineGameOver || mineGameWon) return;
  const cell = mineBoard[r][c];
  if (cell.revealed || cell.flagged) return;
  if (mineFirstClick) {
    mineFirstClick = false;
    minePlaceMines(r, c);
    mineStartTimer();
  }
  if (!mineOpen(r, c)) mineLose();
  else mineCheckWin();
  mineRenderGrid();
}

// Open every unflagged neighbor of a number whose flags are all placed.
function mineChord(r, c) {
  if (mineGameOver || mineGameWon) return;
  const cell = mineBoard[r][c];
  if (!cell.revealed || cell.mine || cell.adj === 0) return;
  let adjFlags = 0;
  mineEachNeighbor(r, c, (nr, nc) => { if (mineBoard[nr][nc].flagged) adjFlags++; });
  if (adjFlags !== cell.adj) return;
  let safe = true;
  mineEachNeighbor(r, c, (nr, nc) => { if (!mineOpen(nr, nc)) safe = false; });
  if (!safe) mineLose();
  else mineCheckWin();
  mineRenderGrid();
}

function mineLose() {
  mineGameOver = true;
  clearInterval(mineTimerInterval); mineTimerInterval = null;
  mineSetFace('dead');
  mineRevealAllMines();
}

function mineCheckWin() {
  if (mineRevealed !== mineRows * mineCols - mineTotalMines) return;
  mineGameWon = true;
  clearInterval(mineTimerInterval); mineTimerInterval = null;
  mineSetFace('cool');
  // Auto-flag remaining
  for (let r = 0; r < mineRows; r++) for (let c = 0; c < mineCols; c++)
    if (mineBoard[r][c].mine) { mineBoard[r][c].flagged = true; mineBoard[r][c].questioned = false; }
  mineFlags = mineTotalMines;
  mineLCDSet('mine-count-lcd', 0);
}

function mineRevealAllMines() {
  for (let r = 0; r < mineRows; r++) for (let c = 0; c < mineCols; c++) {
    const cell = mineBoard[r][c];
    if (cell.mine && !cell.flagged) cell.revealed = true;
    if (!cell.mine && cell.flagged) cell.wrongFlag = true;
  }
}

// marks=true (right button): flag -> ? -> clear, as in Win95.
// marks=false (touch): flag <-> clear.
function mineToggleFlag(r, c, marks) {
  if (mineGameOver || mineGameWon) return;
  const cell = mineBoard[r][c];
  if (cell.revealed) return;
  if (cell.flagged) {
    cell.flagged = false; mineFlags--;
    if (marks) cell.questioned = true;
  } else if (cell.questioned && marks) {
    cell.questioned = false;
  } else {
    cell.questioned = false;
    cell.flagged = true; mineFlags++;
  }
  mineLCDSet('mine-count-lcd', mineTotalMines - mineFlags);
  mineRenderGrid();
}

function mineSetFlagMode(on) {
  mineFlagMode = !!on;
  const btn = document.getElementById('mine-flag-btn');
  if (btn) {
    btn.classList.toggle('active', mineFlagMode);
    btn.setAttribute('aria-pressed', mineFlagMode);
  }
  const grid = document.getElementById('mine-grid');
  if (grid) grid.classList.toggle('mine-flag-mode', mineFlagMode);
}

// Swap rows and columns (Expert turned with the phone), keeping the game.
function mineTurnBoard() {
  const turned = [];
  for (let c = 0; c < mineCols; c++) {
    turned.push([]);
    for (let r = 0; r < mineRows; r++) turned[c].push(mineBoard[r][c]);
  }
  mineBoard = turned;
  const t = mineRows; mineRows = mineCols; mineCols = t;
  minePress = null;
}

// ════════════════════════════════
//  BOARD INPUT  (Pointer Events: mouse, touch and pen)
// ════════════════════════════════
function mineCellFrom(target) {
  return target && target.closest ? target.closest('.mine-cell') : null;
}

function mineSetPressed(el) {
  document.querySelectorAll('#mine-grid .mine-cell-pressed').forEach(c => c.classList.remove('mine-cell-pressed'));
  if (el) el.classList.add('mine-cell-pressed');
}

function mineOnPointerDown(e) {
  mineLastPointer = e.pointerType || 'mouse';
  if (!e.isPrimary) { mineCancelPress(); return; } // a second finger: pinch or scroll
  if (e.button !== 0) return;                     // right button: see contextmenu
  const el = mineCellFrom(e.target);
  if (!el || mineGameOver || mineGameWon) return;
  const r = +el.dataset.r, c = +el.dataset.c, cell = mineBoard[r][c];
  if (e.pointerType === 'mouse') e.preventDefault(); // no text selection while dragging

  clearTimeout(minePress && minePress.timer);
  const press = minePress = { id: e.pointerId, type: e.pointerType, x: e.clientX, y: e.clientY, r, c, el, long: false, timer: 0 };
  if (!cell.revealed && !cell.flagged && !mineFlagMode) {
    mineSetFace('oh');
    mineSetPressed(el);
  }
  // Touch / pen: hold to flag.
  if (e.pointerType !== 'mouse' && !cell.revealed) {
    press.timer = setTimeout(() => {
      if (minePress !== press) return;
      press.long = true;
      mineSetPressed(null);
      mineSetFace('smile');
      mineToggleFlag(r, c, false);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) { /* not allowed */ } }
    }, MINE_LONG_PRESS_MS);
  }
}

function mineOnPointerMove(e) {
  const p = minePress;
  if (!p || e.pointerId !== p.id || p.long) return;
  if (p.type === 'mouse') {
    // Win95: the pressed square follows the mouse; release opens that one.
    const el = mineCellFrom(e.target);
    if (el && el !== p.el) {
      p.el = el; p.r = +el.dataset.r; p.c = +el.dataset.c;
      const cell = mineBoard[p.r][p.c];
      mineSetPressed(!cell.revealed && !cell.flagged && !mineFlagMode ? el : null);
    }
    return;
  }
  if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > MINE_MOVE_SLOP) mineCancelPress(); // a scroll, not a tap
}

function mineOnPointerUp(e) {
  const p = minePress;
  if (!p || e.pointerId !== p.id) return;
  minePress = null;
  clearTimeout(p.timer);
  mineSetPressed(null);
  if (p.long || mineGameOver || mineGameWon) return; // a long-press already flagged
  if (p.type === 'mouse' && e.button !== 0) return;
  mineSetFace('smile');
  const cell = mineBoard[p.r] && mineBoard[p.r][p.c];
  if (!cell) return;
  if (cell.revealed) mineChord(p.r, p.c);
  else if (mineFlagMode) mineToggleFlag(p.r, p.c, false);
  else mineReveal(p.r, p.c);
}

function mineCancelPress() {
  const p = minePress;
  if (!p) return;
  minePress = null;
  clearTimeout(p.timer);
  mineSetPressed(null);
  if (!mineGameOver && !mineGameWon) mineSetFace('smile');
}

function mineOnContextMenu(e) {
  e.preventDefault();
  // Touch long-press is handled by its own timer (Android also fires contextmenu).
  if (mineLastPointer !== 'mouse') return;
  mineCancelPress(); // Ctrl+click on a Mac starts as a left press
  const el = mineCellFrom(e.target);
  if (!el) return;
  const r = +el.dataset.r, c = +el.dataset.c;
  if (mineBoard[r][c].revealed) mineChord(r, c);
  else mineToggleFlag(r, c, true);
}

// ════════════════════════════════
//  LAYOUT AND RENDERING
// ════════════════════════════════
function mineShown(el) {
  return !!el && el.isConnected && el.style.display !== 'none' && el.getClientRects().length > 0;
}

// Space for the board: the desktop, minus the 8px phone dialog margin.
function mineSpace(win) {
  const desk = getDesktopSize();
  const st = openWindows.minesweeper;
  const margin = isPhone() && !(st && st.maximized) ? 16 : 0;
  const pad = isPhone() ? 4 : 6;
  // window padding 4 + 4, .mine-main padding, field bevel 3 + 3; plus the
  // counters when they stand beside the board (short landscape phones)
  let chromeW = 8 + pad * 2 + 6;
  const main = win && win.querySelector('.mine-main');
  const header = win && win.querySelector('.mine-header');
  if (main && header && mineShown(win) && getComputedStyle(main).flexDirection === 'row') {
    chromeW += header.offsetWidth + (parseFloat(getComputedStyle(main).columnGap) || 0);
  }
  let chromeH = 140; // fallback before the window has a layout
  const field = document.getElementById('mine-field');
  if (win && field && mineShown(win)) {
    const body = document.getElementById('wbody-minesweeper');
    const top = field.getBoundingClientRect().top - win.getBoundingClientRect().top + (body ? body.scrollTop : 0);
    chromeH = Math.ceil(top) + 6 + pad + 4; // bevel, .mine-main padding, window padding
  }
  return { w: desk.w - margin - chromeW, h: desk.h - margin - chromeH, chromeW, chromeH, desk };
}

// Expert on a tall screen too narrow for 30 columns: play it 30 x 16.
function mineShouldTurn() {
  const lv = MINE_LEVELS[mineLevel];
  if (lv.cols <= lv.rows) return false;
  const win = document.getElementById('win-minesweeper');
  const s = mineSpace(win);
  return s.desk.h > s.desk.w && Math.floor(s.w / lv.cols) < MINE_CELL_MIN;
}

function mineQueueLayout() {
  if (mineLayoutRaf) return;
  mineLayoutRaf = requestAnimationFrame(() => {
    mineLayoutRaf = 0;
    if (!document.getElementById('mine-grid')) {
      if (mineResizeObserver) { mineResizeObserver.disconnect(); mineResizeObserver = null; }
      return;
    }
    mineLayout();
  });
}

// Pick the cell size and window size for the current screen.
function mineLayout() {
  const win = document.getElementById('win-minesweeper');
  const grid = document.getElementById('mine-grid');
  if (!grid || !mineShown(win)) return;
  if (typeof syncPhoneClass === 'function') syncPhoneClass(); // phone CSS must be current to measure
  const phone = isPhone();
  const body = document.getElementById('wbody-minesweeper');
  if (body) body.classList.toggle('mine-touch', phone || mineHasTouch());

  const lv = MINE_LEVELS[mineLevel];
  const turned = mineRows !== lv.rows || mineCols !== lv.cols;
  const turn = mineShouldTurn() !== turned;
  if (turn) mineTurnBoard();

  const s = mineSpace(win);
  const cellW = Math.floor(s.w / mineCols), cellH = Math.floor(s.h / mineRows);
  let cell = Math.min(phone ? MINE_CELL_PHONE_MAX : MINE_CELL, cellW, cellH);
  if (cell < MINE_CELL_FLOOR) {
    // It cannot all be seen even at the smallest size: fit the width and
    // scroll down. (A whole board at 16-19px beats scrolling a bigger one.)
    cell = Math.max(MINE_CELL_FLOOR, Math.min(MINE_CELL, cellW));
  }

  // The board only becomes a scroll area when it really does not fit, so a
  // board that fits never shows scrollbars (desktop browsers draw them).
  const scrollY = mineRows * cell > s.h;
  const scroller = document.getElementById('mine-scroll');
  if (scroller) scroller.classList.toggle('mine-scroll-y', scrollY);
  // A vertical scrollbar that takes space (desktop browsers, not phones).
  const bar = scrollY && scroller ? scroller.offsetWidth - scroller.clientWidth : 0;
  if (bar > 0 && mineCols * cell + bar > s.w) cell = Math.max(MINE_CELL_FLOOR, Math.floor((s.w - bar) / mineCols));
  const scrollX = mineCols * cell + bar > s.w;
  if (scroller) scroller.classList.toggle('mine-scroll-x', scrollX);
  if (body) body.classList.toggle('mine-scrolling', scrollX || scrollY);

  grid.style.setProperty('--mine-cell', cell + 'px');
  grid.style.setProperty('--mine-font', Math.round(cell * 13 / MINE_CELL) + 'px');
  grid.style.gridTemplateColumns = `repeat(${mineCols}, ${cell}px)`;

  const st = openWindows.minesweeper;
  if (!(st && st.maximized)) {
    const w = Math.min(mineCols * cell + s.chromeW + bar, s.desk.w) + 'px';
    // Desktop keeps the original Win95 window height (rows * 22 + 132).
    // On phones the dialog CSS sizes the height to the content.
    const h = phone ? '' : Math.min(mineRows * cell + 132, s.desk.h) + 'px';
    if (win.style.width !== w) win.style.width = w;
    if (h && win.style.height !== h) win.style.height = h;
    if (st) { st.prefW = mineCols * MINE_CELL + 26; st.prefH = mineRows * MINE_CELL + 132; }
  }
  if (turn) {
    mineBuildGrid();
    mineRenderGrid();
  }
}

function mineHasTouch() {
  return window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches;
}

function mineBuildGrid() {
  const grid = document.getElementById('mine-grid');
  if (!grid) return;
  const frag = document.createDocumentFragment();
  mineCellEls = [];
  for (let r = 0; r < mineRows; r++) {
    mineCellEls.push([]);
    for (let c = 0; c < mineCols; c++) {
      const el = document.createElement('div');
      el.className = 'mine-cell';
      el.dataset.r = r;
      el.dataset.c = c;
      el.setAttribute('data-no-tap-open', '');
      mineCellEls[r].push(el);
      frag.appendChild(el);
    }
  }
  grid.innerHTML = '';
  grid.appendChild(frag);
}

function mineRenderGrid() {
  if (!document.getElementById('mine-grid')) return;
  for (let r = 0; r < mineRows; r++) {
    for (let c = 0; c < mineCols; c++) {
      const cell = mineBoard[r][c];
      const el = mineCellEls[r] && mineCellEls[r][c];
      if (!el) continue;
      let cls = 'mine-cell', text = '', color = '';
      if (cell.revealed) {
        cls += ' mine-cell-revealed';
        if (cell.mine) {
          cls += cell.exploded ? ' mine-cell-exploded' : ' mine-cell-mine';
          text = '💣';
        } else if (cell.adj > 0) {
          text = String(cell.adj);
          color = MINE_NUM_COLORS[cell.adj];
        }
      } else if (cell.wrongFlag) {
        cls += ' mine-cell-revealed mine-cell-wrongflag';
        text = '🚩';
      } else if (cell.flagged) {
        text = '🚩';
      } else if (cell.questioned) {
        text = '❓';
      }
      if (el.className !== cls) el.className = cls;
      if (el.textContent !== text) el.textContent = text;
      if (el.style.color !== color) el.style.color = color;
    }
  }
}

function mineLCDSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(Math.max(0, Math.min(999, val))).padStart(3, '0');
}

function mineSetFace(name) {
  const btn = document.getElementById('mine-face-btn');
  if (!btn || btn.dataset.face === name) return;
  btn.dataset.face = name;
  btn.innerHTML = mineFaceSVG(name);
}
