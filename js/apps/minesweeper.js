// ════════════════════════════════
//  MINESWEEPER
// ════════════════════════════════
let mineRows = 9, mineCols = 9, mineTotalMines = 10;
let mineBoard = [], mineRevealed = 0, mineFlags = 0;
let mineGameOver = false, mineGameWon = false, mineFirstClick = true;
let mineTimerVal = 0, mineTimerInterval = null;

const MINE_NUM_COLORS = ['','#0000ff','#008000','#ff0000','#000080','#800000','#008080','#000000','#808080'];

function buildMinesweeperWindow(container) {
  container.style.cssText = 'display:flex;flex-direction:column;background:var(--c-material);user-select:none;';
  container.innerHTML = `
    <div class="window-menubar" style="position:relative;">
      <span class="menu-item" onclick="mineGameMenu(event)"><u>G</u>ame</span>
      <div id="mine-game-menu" style="display:none;position:absolute;top:100%;left:0;background:var(--c-material);box-shadow:var(--shadow-window-frame);z-index:9999;min-width:160px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;font-size:13px;">
        <div class="mine-menu-item" onclick="mineSetDifficulty(9,9,10)">Beginner</div>
        <div class="mine-menu-item" onclick="mineSetDifficulty(16,16,40)">Intermediate</div>
        <div class="mine-menu-item" onclick="mineSetDifficulty(16,30,99)">Expert</div>
        <div style="border-top:1px solid var(--c-border-dark);margin:2px 0;"></div>
        <div class="mine-menu-item" onclick="mineNewGame()">New Game</div>
      </div>
    </div>
    <div style="padding:6px;display:flex;flex-direction:column;gap:6px;">
      <div class="mine-header">
        <div class="mine-lcd" id="mine-count-lcd">010</div>
        <button class="mine-face-btn" id="mine-face-btn" onmousedown="mineFacePress()" onmouseup="mineNewGame()">🙂</button>
        <div class="mine-lcd" id="mine-timer-lcd">000</div>
      </div>
      <div class="mine-field-border">
        <div class="mine-grid" id="mine-grid"></div>
      </div>
    </div>
  `;
  mineNewGame();
}

function mineGameMenu(e) {
  e.stopPropagation();
  const menu = document.getElementById('mine-game-menu');
  if (!menu) return;
  const visible = menu.style.display !== 'none';
  menu.style.display = visible ? 'none' : 'block';
  if (!visible) {
    const close = () => { menu.style.display = 'none'; document.removeEventListener('click', close); };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}

function mineSetDifficulty(r, c, m) {
  mineRows = r; mineCols = c; mineTotalMines = m;
  const win = document.getElementById('win-minesweeper');
  if (win) {
    const newW = c * 22 + 26;
    const newH = r * 22 + 132;
    win.style.width  = newW + 'px';
    win.style.height = newH + 'px';
  }
  mineNewGame();
}

function mineNewGame() {
  if (mineTimerInterval) { clearInterval(mineTimerInterval); mineTimerInterval = null; }
  mineTimerVal = 0; mineFirstClick = true; mineGameOver = false; mineGameWon = false;
  mineFlags = 0; mineRevealed = 0;
  mineBoard = Array.from({ length: mineRows }, () =>
    Array.from({ length: mineCols }, () => ({ mine: false, revealed: false, flagged: false, questioned: false, adj: 0 }))
  );
  mineLCDSet('mine-count-lcd', mineTotalMines);
  mineLCDSet('mine-timer-lcd', 0);
  mineSetFace('🙂');
  mineRenderGrid();
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
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const nr = r+dr, nc = c+dc;
    if (nr >= 0 && nr < mineRows && nc >= 0 && nc < mineCols && mineBoard[nr][nc].mine) n++;
  }
  return n;
}

function mineReveal(r, c) {
  if (mineGameOver || mineGameWon) return;
  if (r < 0 || r >= mineRows || c < 0 || c >= mineCols) return;
  const cell = mineBoard[r][c];
  if (cell.revealed || cell.flagged) return;

  if (mineFirstClick) {
    mineFirstClick = false;
    minePlaceMines(r, c);
    cell.adj = mineCountAdj(r, c); // recalc after placement
    mineTimerInterval = setInterval(() => {
      mineTimerVal = Math.min(mineTimerVal + 1, 999);
      mineLCDSet('mine-timer-lcd', mineTimerVal);
    }, 1000);
  }

  cell.revealed = true; mineRevealed++;

  if (cell.mine) {
    cell.exploded = true;
    mineGameOver = true;
    clearInterval(mineTimerInterval); mineTimerInterval = null;
    mineSetFace('😵');
    mineRevealAllMines();
    mineRenderGrid();
    return;
  }

  if (cell.adj === 0) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) mineReveal(r+dr, c+dc);
  }

  if (mineRevealed === mineRows * mineCols - mineTotalMines) {
    mineGameWon = true;
    clearInterval(mineTimerInterval); mineTimerInterval = null;
    mineSetFace('😎');
    // Auto-flag remaining
    for (let rr = 0; rr < mineRows; rr++) for (let cc = 0; cc < mineCols; cc++)
      if (mineBoard[rr][cc].mine) mineBoard[rr][cc].flagged = true;
    mineFlags = mineTotalMines;
    mineLCDSet('mine-count-lcd', 0);
  }
  mineRenderGrid();
}

function mineRevealAllMines() {
  for (let r = 0; r < mineRows; r++) for (let c = 0; c < mineCols; c++) {
    const cell = mineBoard[r][c];
    if (cell.mine && !cell.flagged) cell.revealed = true;
    if (!cell.mine && cell.flagged) cell.wrongFlag = true;
  }
}

function mineFlag(r, c) {
  if (mineGameOver || mineGameWon) return;
  const cell = mineBoard[r][c];
  if (cell.revealed) return;
  if (!cell.flagged && !cell.questioned) {
    cell.flagged = true; mineFlags++;
  } else if (cell.flagged) {
    cell.flagged = false; cell.questioned = true; mineFlags--;
  } else {
    cell.questioned = false;
  }
  mineLCDSet('mine-count-lcd', mineTotalMines - mineFlags);
  mineRenderGrid();
}

function mineChord(r, c) {
  const cell = mineBoard[r][c];
  if (!cell.revealed || cell.adj === 0) return;
  let adjFlags = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const nr = r+dr, nc = c+dc;
    if (nr >= 0 && nr < mineRows && nc >= 0 && nc < mineCols && mineBoard[nr][nc].flagged) adjFlags++;
  }
  if (adjFlags === cell.adj) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) mineReveal(r+dr, c+dc);
  }
}

function mineRenderGrid() {
  const grid = document.getElementById('mine-grid');
  if (!grid) return;
  grid.style.gridTemplateColumns = `repeat(${mineCols}, 22px)`;
  const frag = document.createDocumentFragment();
  for (let r = 0; r < mineRows; r++) {
    for (let c = 0; c < mineCols; c++) {
      const cell = mineBoard[r][c];
      const el = document.createElement('div');
      el.className = 'mine-cell';
      if (cell.revealed) {
        el.classList.add('mine-cell-revealed');
        if (cell.mine) {
          el.classList.add(cell.exploded ? 'mine-cell-exploded' : 'mine-cell-mine');
          el.textContent = '💣';
        } else if (cell.adj > 0) {
          el.textContent = cell.adj;
          el.style.color = MINE_NUM_COLORS[cell.adj];
        }
      } else if (cell.wrongFlag) {
        el.classList.add('mine-cell-revealed', 'mine-cell-wrongflag');
        el.innerHTML = '<span style="text-decoration:line-through;">🚩</span>';
      } else if (cell.flagged) {
        el.textContent = '🚩';
      } else if (cell.questioned) {
        el.textContent = '❓';
      }

      if (!cell.revealed && !cell.wrongFlag) {
        const rr = r, cc = c;
        el.addEventListener('mousedown', e => {
          if (e.button === 0) mineSetFace('😮');
        });
        el.addEventListener('mouseup', e => {
          if (mineGameOver || mineGameWon) return;
          if (e.button === 0) { mineSetFace('🙂'); mineReveal(rr, cc); }
        });
        el.addEventListener('contextmenu', e => { e.preventDefault(); mineFlag(rr, cc); });
      } else if (cell.revealed && !cell.mine && cell.adj > 0) {
        const rr = r, cc = c;
        el.addEventListener('contextmenu', e => { e.preventDefault(); mineChord(rr, cc); });
        el.addEventListener('dblclick', () => mineChord(rr, cc));
      }
      frag.appendChild(el);
    }
  }
  grid.innerHTML = '';
  grid.appendChild(frag);
}

function mineLCDSet(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(Math.max(0, Math.min(999, val))).padStart(3, '0');
}

function mineSetFace(f) {
  const btn = document.getElementById('mine-face-btn');
  if (btn) btn.textContent = f;
}

function mineFacePress() { mineSetFace('🙂'); }
