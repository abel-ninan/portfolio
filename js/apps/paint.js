// ════════════════════════════════
//  PAINT
// ════════════════════════════════
// A working Win95 Paint. One Pointer Events path serves mouse, touch and pen:
// the left button draws with the foreground color, the right button with the
// background color. On touch screens a tap on a swatch sets the foreground
// color, a long-press sets the background color, and tapping the two color
// boxes swaps them.
//
// The picture: a new one is 400 x 300 on desktop (as in Win95) and fills the
// window on phones, following rotation. Nothing drawn is lost when it shrinks:
// the cut-off part is kept and comes back when it grows again. Its canvas has
// devicePixelRatio backing pixels per picture pixel, so strokes stay crisp.
// An opened image keeps its own pixels and is shown 1:1, scaled down on phones
// when it is bigger than the window. Every tool maps the pointer through
// canvas.width / canvas.clientWidth, so any display size works.
//
// openImageInPaint(src, name) in js/desktop.js sets canvas.width/height on the
// first .paint-canvas and draws the image itself; the MutationObserver set up
// in buildPaintWindow adopts that as an opened picture. paintLoadImage(src,
// name) does the same job from inside Paint (File > Open uses it).
const PAINT_COLORS = [
  '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
  '#808040','#004040','#0080ff','#004080','#8000ff','#804000',
  '#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff',
  '#ffff80','#80ff80','#80ffff','#8080ff','#ff80ff','#ff8040',
];

// unavailable: shows a Win95 message box instead of becoming the active tool
const PAINT_TOOLS = [
  { id:'free-select', name:'Free Select', unavailable:true, svg:`<svg viewBox="0 0 16 16"><path d="M8,1C12,1,15,4,15,8C15,12,12,15,8,15C4,15,1,12,1,8C1,4,4,1,8,1Z" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="2,1.5"/></svg>` },
  { id:'select',      name:'Rect Select', unavailable:true, svg:`<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="3,1.5"/></svg>` },
  { id:'eraser',      name:'Eraser',        svg:`<svg viewBox="0 0 16 16"><rect x="1" y="8" width="14" height="7" fill="#ffaaff" stroke="#000" stroke-width="1"/><rect x="1" y="8" width="6" height="7" fill="#ff00ff"/></svg>` },
  { id:'fill',        name:'Fill',          svg:`<svg viewBox="0 0 16 16"><path d="M2,13L2,7L6,3L10,7L8,7L8,13Z" fill="#4040ff" stroke="#000" stroke-width="0.5"/><circle cx="13" cy="13" r="2.5" fill="#ff0000"/><line x1="10" y1="10" x2="12" y2="11" stroke="#000" stroke-width="1"/></svg>` },
  { id:'picker',      name:'Color Picker',  svg:`<svg viewBox="0 0 16 16"><path d="M14,2L15,3L7,11L5,11L5,13L3,15L1,13L3,11L5,11L5,9Z" fill="#000"/></svg>` },
  { id:'magnifier',   name:'Magnifier', unavailable:true, svg:`<svg viewBox="0 0 16 16"><circle cx="6" cy="6" r="5" fill="none" stroke="#000" stroke-width="2"/><circle cx="6" cy="6" r="2.5" fill="#fff"/><line x1="10" y1="10" x2="15" y2="15" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>` },
  { id:'pencil',      name:'Pencil',        svg:`<svg viewBox="0 0 16 16"><path d="M13,2L15,4L5,14L3,14L3,12Z" fill="#000"/><path d="M3,12L3,14L5,14" fill="none" stroke="#808080" stroke-width="1"/></svg>` },
  { id:'brush',       name:'Brush',         svg:`<svg viewBox="0 0 16 16"><path d="M13,1L15,3L7,11L5,9Z" fill="#804000"/><path d="M5,9L7,11C7,11,6,14,3,14C2,13,2,11,5,9Z" fill="#4080ff"/></svg>` },
  { id:'airbrush',    name:'Airbrush',      svg:`<svg viewBox="0 0 16 16"><rect x="4" y="6" width="7" height="8" rx="2" fill="#808080" stroke="#000" stroke-width="1"/><rect x="1" y="8" width="4" height="2" fill="#000"/><circle cx="12" cy="3" r="1" fill="#000"/><circle cx="14" cy="6" r="1" fill="#000"/><circle cx="14" cy="1" r="1" fill="#000"/><circle cx="11" cy="1" r="1" fill="#000"/></svg>` },
  { id:'text',        name:'Text',          svg:`<svg viewBox="0 0 16 16"><text x="2" y="13" font-family="serif" font-size="13" font-weight="bold" fill="#000">A</text></svg>` },
  { id:'line',        name:'Line',          svg:`<svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2" stroke="#000" stroke-width="2"/></svg>` },
  { id:'curve',       name:'Curve',         svg:`<svg viewBox="0 0 16 16"><path d="M2,14 Q2,2 14,2" fill="none" stroke="#000" stroke-width="2"/></svg>` },
  { id:'rect',        name:'Rectangle',     svg:`<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" fill="none" stroke="#000" stroke-width="2"/></svg>` },
  { id:'polygon',     name:'Polygon',       svg:`<svg viewBox="0 0 16 16"><polygon points="8,2 14,7 12,14 4,14 2,7" fill="none" stroke="#000" stroke-width="2"/></svg>` },
  { id:'ellipse',     name:'Ellipse',       svg:`<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="6" ry="5" fill="none" stroke="#000" stroke-width="2"/></svg>` },
  { id:'roundrect',   name:'Rounded Rect',  svg:`<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/></svg>` },
];

const PAINT_LINE_WIDTHS = [1, 2, 3, 4, 5];
const PAINT_BLANK_W = 400, PAINT_BLANK_H = 300; // a new picture on desktop
const PAINT_UNDO_LEVELS = 3;                    // as in Win95
const PAINT_LONG_PRESS_MS = 450;                // swatch long-press = background color
const PAINT_FILL_TOLERANCE = 40;                // per channel; swallows anti-aliased edges
const PAINT_MAX_PIXELS = 16000000;              // stay under the iOS canvas limit
const PAINT_SHAPE_TOOLS = ['line', 'rect', 'ellipse', 'roundrect'];
const PAINT_HAS_COLOR_INPUT = (() => {
  const i = document.createElement('input');
  i.setAttribute('type', 'color');
  return i.type === 'color';
})();

const PAINT_MENUS = {
  file: [
    { label: '<u>N</u>ew', run: () => paintNew() },
    { label: '<u>O</u>pen...', key: 'Ctrl+O', run: () => paintOpenFile() },
    { label: '<u>S</u>ave', key: 'Ctrl+S', run: () => paintSave() },
    { label: 'Save <u>A</u>s...', run: () => paintSave() },
    null,
    { label: 'E<u>x</u>it', run: () => closeWindow('paint') },
  ],
  edit: [
    { label: '<u>U</u>ndo', key: 'Ctrl+Z', run: () => paintUndo(), enabled: () => paint.undo.length > 0 },
  ],
  view: [
    { label: '<u>T</u>ool Box', run: () => paintToggleView('tools'), checked: () => !paint.hidden.tools },
    { label: '<u>C</u>olor Box', run: () => paintToggleView('colors'), checked: () => !paint.hidden.colors },
    { label: '<u>S</u>tatus Bar', run: () => paintToggleView('status'), checked: () => !paint.hidden.status },
  ],
  image: [
    { label: '<u>F</u>lip Horizontal', run: () => paintTransform('flipH') },
    { label: 'Flip <u>V</u>ertical', run: () => paintTransform('flipV') },
    { label: '<u>I</u>nvert Colors', run: () => paintTransform('invert') },
    { label: '<u>C</u>lear Image', run: () => paintClearImage() },
  ],
  options: [
    { label: '<u>E</u>dit Colors...', run: () => paintEditColors(), enabled: () => PAINT_HAS_COLOR_INPUT },
  ],
  help: [
    { label: '<u>A</u>bout Paint', run: () => paintMessage('Paint for Windows 95. Draw with the mouse or a finger. Right-click a color (or long-press it on a touch screen) to make it the background color; tap the two color boxes to swap them.') },
  ],
};

let paint = null; // state of the open Paint window (it is a singleton)

function buildPaintWindow(container) {
  if (paint) paintTeardown(paint); // the previous window is gone

  // Palette order for the 4-row phone layout (row-major, 7 per row); the
  // desktop layout keeps the original 2-row column flow.
  const order4 = i => {
    const pair = i >> 1, top = i % 2 === 0;
    return (pair < 7 ? (top ? 0 : 1) : (top ? 2 : 3)) * 7 + (pair % 7);
  };

  container.innerHTML = `
    <div class="window-menubar paint-menubar">
      <span class="menu-item" data-paint-menu="file"><u>F</u>ile</span>
      <span class="menu-item" data-paint-menu="edit"><u>E</u>dit</span>
      <span class="menu-item" data-paint-menu="view"><u>V</u>iew</span>
      <span class="menu-item" data-paint-menu="image"><u>I</u>mage</span>
      <span class="menu-item" data-paint-menu="options"><u>O</u>ptions</span>
      <span class="menu-item" data-paint-menu="help"><u>H</u>elp</span>
    </div>
    <div class="paint-body">
      <div class="paint-toolbox">
        <div class="paint-tools">
          ${PAINT_TOOLS.map(t => `
            <button class="paint-tool${t.id === 'pencil' ? ' active' : ''}" data-tool="${t.id}" title="${t.name}"
              aria-label="${t.name}" aria-pressed="${t.id === 'pencil'}">${t.svg}</button>`).join('')}
        </div>
        <div class="paint-tool-options">
          ${PAINT_LINE_WIDTHS.map((w, i) => `
            <button class="paint-line-opt${i === 0 ? ' active' : ''}" data-width="${w}" title="${w}px line"
              aria-label="${w} pixel line" aria-pressed="${i === 0}">
              <span class="paint-line-preview" style="height:${w}px;"></span>
            </button>`).join('')}
        </div>
      </div>
      <div class="paint-canvas-wrap">
        <div class="paint-canvas-inner">
          <canvas class="paint-canvas" width="${PAINT_BLANK_W}" height="${PAINT_BLANK_H}"></canvas>
          <canvas class="paint-overlay" aria-hidden="true"></canvas>
          <div class="paint-canvas-handle paint-handle-r"></div>
          <div class="paint-canvas-handle paint-handle-b"></div>
          <div class="paint-canvas-handle paint-handle-br"></div>
        </div>
      </div>
    </div>
    <div class="paint-palette">
      <div class="paint-fg-bg" title="Swap colors" role="button" aria-label="Swap foreground and background colors">
        <div class="paint-color-box paint-bg-color"></div>
        <div class="paint-color-box paint-fg-color"></div>
      </div>
      <div class="paint-color-grid">
        ${PAINT_COLORS.map((c, i) => `<div class="paint-color-swatch" style="background:${c};--o4:${order4(i)};"
          data-color="${c}" title="${c}" role="button" aria-label="Color ${c}"></div>`).join('')}
      </div>
    </div>
    <div class="status-bar paint-status">
      <span class="status-item paint-coords" style="min-width:80px;"></span>
      <span class="status-item paint-size">${PAINT_BLANK_W} x ${PAINT_BLANK_H}</span>
      <div class="status-resize-slot"></div>
    </div>
    <input type="file" class="paint-hidden-input paint-file-input" accept="image/*" tabindex="-1" aria-hidden="true">
  `;

  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;position:relative;';
  container.classList.add('paint-app');

  const canvas = container.querySelector('.paint-canvas');
  const overlay = container.querySelector('.paint-overlay');
  const p = paint = {
    container, canvas, overlay,
    ctx: canvas.getContext('2d'),
    octx: overlay.getContext('2d'),
    wrap: container.querySelector('.paint-canvas-wrap'),
    tool: 'pencil', lastTool: 'pencil', width: 1,
    fg: '#000000', bg: '#ffffff',
    mode: 'blank',      // 'blank': new picture (fills the window on phones); 'image': opened file
    dirty: false,       // anything drawn since New
    name: 'untitled',
    logicalW: PAINT_BLANK_W, logicalH: PAINT_BLANK_H,
    ratio: 1,           // backing pixels per picture pixel
    store: null,        // everything drawn, including parts cut off by a smaller window
    undo: [],
    stroke: null, poly: null, curve: null, text: null, menu: null,
    hidden: { tools: false, colors: false, status: false },
    layoutPending: false, layoutRaf: 0, swatch: null,
    observer: null, resizeObserver: null,
  };

  paintResizeSurface(PAINT_BLANK_W, PAINT_BLANK_H, false);
  paintWireEvents(p);

  // openImageInPaint() resizes the canvas and draws into it: adopt that picture.
  if (typeof MutationObserver === 'function') {
    p.observer = new MutationObserver(() => {
      if (paint !== p || !canvas.isConnected) { paintTeardown(p); return; }
      paintCancelPending();
      const t = document.querySelector('#win-paint .window-title');
      const name = t ? t.textContent.replace(/\s*-\s*Paint\s*$/, '') : '';
      paintAdoptImage(name || 'untitled', false);
    });
    p.observer.observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });
  }

  // Phones: the picture follows the window (open, rotate, resize, toolbars).
  if (typeof ResizeObserver === 'function') {
    p.resizeObserver = new ResizeObserver(() => paintQueueLayout(p));
    p.resizeObserver.observe(p.wrap);
  } else {
    window.addEventListener('resize', () => paintQueueLayout(p));
  }
  paintQueueLayout(p);
}

function paintTeardown(p) {
  if (p.observer) p.observer.disconnect();
  if (p.resizeObserver) p.resizeObserver.disconnect();
  if (p.stroke && p.stroke.timer) clearInterval(p.stroke.timer);
  if (p.menu) document.removeEventListener('pointerdown', p.menu.onDown, true);
  if (paint === p) paint = null;
}

function paintWireEvents(p) {
  const { container, canvas } = p;

  // Right-clicks are Paint's (background color), not the desktop's: its
  // context menu would open on top of the picture. Text boxes keep theirs.
  container.addEventListener('contextmenu', e => {
    e.stopPropagation();
    if (!(e.target instanceof Element && e.target.closest('input'))) e.preventDefault();
  });

  // Menus
  const menubar = container.querySelector('.paint-menubar');
  menubar.addEventListener('click', e => {
    const item = e.target.closest('[data-paint-menu]');
    if (!item) return;
    if (p.menu && p.menu.name === item.dataset.paintMenu) paintCloseMenu();
    else paintOpenMenu(item.dataset.paintMenu, item);
  });
  menubar.addEventListener('pointerover', e => {
    const item = e.target.closest('[data-paint-menu]');
    if (item && p.menu && e.pointerType === 'mouse' && p.menu.name !== item.dataset.paintMenu) {
      paintOpenMenu(item.dataset.paintMenu, item);
    }
  });

  // Tool box
  container.querySelector('.paint-tools').addEventListener('click', e => {
    const btn = e.target.closest('.paint-tool');
    if (btn) paintSelectTool(btn.dataset.tool);
  });
  container.querySelector('.paint-tool-options').addEventListener('click', e => {
    const btn = e.target.closest('.paint-line-opt');
    if (!btn) return;
    p.width = +btn.dataset.width;
    container.querySelectorAll('.paint-line-opt').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
  });

  // Color box: click = foreground, right-click / long-press = background
  const grid = container.querySelector('.paint-color-grid');
  const swatchOf = e => e.target.closest && e.target.closest('.paint-color-swatch');
  const endSwatchPress = () => {
    if (p.swatch) clearTimeout(p.swatch.timer);
  };
  grid.addEventListener('pointerdown', e => {
    const sw = swatchOf(e);
    endSwatchPress();
    p.swatch = { type: e.pointerType, long: false, timer: 0, x: e.clientX, y: e.clientY };
    if (!sw || e.pointerType === 'mouse') return;
    const press = p.swatch;
    press.timer = setTimeout(() => {
      press.long = true;
      paintSetColor('bg', sw.dataset.color);
      if (navigator.vibrate) { try { navigator.vibrate(10); } catch (err) { /* not allowed */ } }
    }, PAINT_LONG_PRESS_MS);
  });
  grid.addEventListener('pointermove', e => {
    if (p.swatch && Math.hypot(e.clientX - p.swatch.x, e.clientY - p.swatch.y) > 10) endSwatchPress();
  });
  grid.addEventListener('pointerup', endSwatchPress);
  grid.addEventListener('pointercancel', endSwatchPress);
  grid.addEventListener('click', e => {
    const sw = swatchOf(e);
    if (!sw) return;
    if (p.swatch && p.swatch.long) { p.swatch.long = false; return; } // long-press already set the background
    paintSetColor('fg', sw.dataset.color);
  });
  grid.addEventListener('contextmenu', e => {
    e.preventDefault();
    const sw = swatchOf(e);
    if (!sw) return;
    endSwatchPress();
    paintSetColor('bg', sw.dataset.color);
    if (p.swatch && p.swatch.type !== 'mouse') p.swatch.long = true; // swallow the click that may follow
  });
  container.querySelector('.paint-fg-bg').addEventListener('click', () => {
    const fg = p.fg;
    paintSetColor('fg', p.bg);
    paintSetColor('bg', fg);
  });

  // Canvas
  canvas.addEventListener('pointerdown', paintPointerDown);
  canvas.addEventListener('pointermove', paintPointerMove);
  canvas.addEventListener('pointerup', paintPointerUp);
  canvas.addEventListener('pointercancel', paintPointerCancel);
  canvas.addEventListener('pointerleave', () => { if (!p.stroke) paintShowCoords(null); });
  canvas.addEventListener('dblclick', () => { if (p.poly) paintPolygonFinish(); });

  // File > Open
  container.querySelector('.paint-file-input').addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    paintLoadImage(url, file.name.replace(/\.[^.]+$/, ''), () => URL.revokeObjectURL(url));
  });
}

// ════════════════════════════════
//  PICTURE SIZE
// ════════════════════════════════
// iOS Safari counts canvas memory until garbage collection, so scratch
// canvases are emptied as soon as they are done with.
function paintRelease(c) {
  if (c) { c.width = 0; c.height = 0; }
}

function paintClearUndo() {
  paint.undo.forEach(paintRelease);
  paint.undo = [];
}

function paintMakeCanvas(w, h, fill) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  if (fill) {
    const x = c.getContext('2d');
    x.fillStyle = fill;
    x.fillRect(0, 0, w, h);
  }
  return c;
}

// Backing pixels per picture pixel for a w x h picture.
function paintDpr(w, h) {
  let d = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  while (d > 1 && w * h * d * d > PAINT_MAX_PIXELS) d = Math.max(1, d - 0.5);
  return d;
}

// Space for the picture inside the gray area, in CSS px (null while hidden).
function paintArea() {
  const wrap = paint.wrap;
  if (!wrap.clientWidth || !wrap.clientHeight) return null;
  const cs = getComputedStyle(wrap);
  // 4 = the canvas border (2) and its drop shadow (2)
  const w = Math.floor(wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 4);
  const h = Math.floor(wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 4);
  return w >= 16 && h >= 16 ? { w, h } : null;
}

// Give the (blank-mode) picture a new size in CSS px. keep=true carries over
// everything drawn, including what an earlier, bigger size had.
function paintResizeSurface(w, h, keep) {
  const p = paint, c = p.canvas;
  const dpr = paintDpr(w, h);
  const bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));

  let union = null;
  if (keep && p.dirty) {
    const k = dpr / p.ratio; // the pixel ratio can change (browser zoom, other screen)
    const parts = [p.store, c].filter(Boolean);
    const uw = Math.max(bw, ...parts.map(o => Math.round(o.width * k)));
    const uh = Math.max(bh, ...parts.map(o => Math.round(o.height * k)));
    union = paintMakeCanvas(uw, uh, '#ffffff');
    const u = union.getContext('2d');
    parts.forEach(o => u.drawImage(o, 0, 0, Math.round(o.width * k), Math.round(o.height * k)));
  }
  if (p.store && p.store !== union) paintRelease(p.store);

  c.width = bw;
  c.height = bh;
  p.ctx.fillStyle = '#ffffff';
  p.ctx.fillRect(0, 0, bw, bh);
  if (union) p.ctx.drawImage(union, 0, 0);
  if (p.observer) p.observer.takeRecords(); // our own resize, not openImageInPaint

  p.store = union;
  p.ratio = dpr;
  p.logicalW = w;
  p.logicalH = h;
  paintClearUndo();
  paintSyncOverlay();
  paintSetDisplaySize();
  paintShowSize();
}

// The canvas now holds an opened picture at its own pixel size.
function paintAdoptImage(name, retitle) {
  const p = paint, c = p.canvas;
  // Transparent parts become white, like a bitmap.
  const flat = paintMakeCanvas(c.width, c.height, '#ffffff');
  flat.getContext('2d').drawImage(c, 0, 0);
  p.ctx.drawImage(flat, 0, 0);
  paintRelease(flat);

  p.mode = 'image';
  p.dirty = true;
  paintRelease(p.store);
  p.store = null;
  paintClearUndo();
  p.ratio = 1;
  p.logicalW = c.width;
  p.logicalH = c.height;
  p.name = name || 'untitled';
  if (retitle) paintSetTitle(p.name + ' - Paint');
  paintSyncOverlay();
  paintSetDisplaySize();
  paintShowSize();
}

// Load an image file or URL into Paint (same result as openImageInPaint).
function paintLoadImage(src, name, done) {
  const p = paint;
  if (!p) return;
  const img = new Image();
  img.onload = () => {
    if (done) done();
    if (paint !== p || !p.canvas.isConnected) return;
    paintCancelPending();
    let w = img.naturalWidth || PAINT_BLANK_W, h = img.naturalHeight || PAINT_BLANK_H;
    const k = Math.min(1, Math.sqrt(PAINT_MAX_PIXELS / (w * h)));
    w = Math.max(1, Math.floor(w * k));
    h = Math.max(1, Math.floor(h * k));
    p.canvas.width = w;
    p.canvas.height = h;
    if (p.observer) p.observer.takeRecords();
    p.ctx.drawImage(img, 0, 0, w, h);
    paintAdoptImage(name, true);
  };
  img.onerror = () => {
    if (done) done();
    paintMessage('Paint cannot read this file. This is not a valid bitmap file, or its format is not currently supported.');
  };
  img.src = src;
}

function paintSyncOverlay() {
  const p = paint, o = p.overlay;
  if (o.width !== p.canvas.width || o.height !== p.canvas.height) {
    o.width = p.canvas.width;
    o.height = p.canvas.height;
  } else {
    p.octx.clearRect(0, 0, o.width, o.height);
  }
}

// CSS size: a blank picture is shown at its size; an opened image 1:1, but
// scaled down to fit on phones.
function paintSetDisplaySize() {
  const p = paint;
  let w = p.logicalW, h = p.logicalH;
  if (p.mode === 'image' && isPhone()) {
    const a = paintArea();
    if (a) {
      const k = Math.min(1, a.w / w, a.h / h);
      w = Math.max(1, Math.floor(w * k));
      h = Math.max(1, Math.floor(h * k));
    }
  }
  [p.canvas, p.overlay].forEach(el => {
    el.style.width = w + 'px';
    el.style.height = h + 'px';
  });
}

function paintQueueLayout(p) {
  if (p.layoutRaf) return;
  p.layoutRaf = requestAnimationFrame(() => {
    p.layoutRaf = 0;
    if (paint !== p || !p.canvas.isConnected) { paintTeardown(p); return; }
    paintLayout();
  });
}

function paintLayout() {
  const p = paint;
  if (!p || !p.canvas.isConnected) return;
  // Never resize under a stroke or an open text box; catch up afterwards.
  if (p.stroke || p.text) { p.layoutPending = true; return; }
  p.layoutPending = false;
  if (p.mode === 'blank') {
    if (isPhone()) {
      const a = paintArea();
      if (a && (a.w !== p.logicalW || a.h !== p.logicalH)) paintResizeSurface(a.w, a.h, true);
    } else if (!p.dirty && (p.logicalW !== PAINT_BLANK_W || p.logicalH !== PAINT_BLANK_H)) {
      paintResizeSurface(PAINT_BLANK_W, PAINT_BLANK_H, false);
    }
  }
  paintSetDisplaySize();
}

function paintSetTitle(title) {
  const t = document.querySelector('#win-paint .window-title');
  if (t) t.textContent = title;
  const btn = document.getElementById('tbtn-paint');
  if (btn) {
    btn.setAttribute('aria-label', title);
    const span = btn.querySelector('span');
    if (span) span.textContent = title;
  }
}

function paintShowSize() {
  const el = paint.container.querySelector('.paint-size');
  if (el) el.textContent = `${paint.logicalW} x ${paint.logicalH}`;
}

function paintShowCoords(pt) {
  const p = paint, el = p.container.querySelector('.paint-coords');
  if (!el) return;
  if (!pt) { el.textContent = ''; return; }
  const kx = p.logicalW / p.canvas.width, ky = p.logicalH / p.canvas.height;
  const x = Math.max(0, Math.min(p.logicalW - 1, Math.floor(pt.x * kx)));
  const y = Math.max(0, Math.min(p.logicalH - 1, Math.floor(pt.y * ky)));
  el.textContent = `${x}, ${y}`;
}

// ════════════════════════════════
//  TOOLS AND COLORS
// ════════════════════════════════
function paintSelectTool(id) {
  const p = paint, def = PAINT_TOOLS.find(t => t.id === id);
  if (!p || !def) return;
  if (def.unavailable) {
    paintMessage(`The ${def.name} tool is not available in this version of Paint.`);
    return;
  }
  paintCommitPending();
  if (p.tool !== 'picker') p.lastTool = p.tool;
  p.tool = id;
  p.container.querySelectorAll('.paint-tool').forEach(b => {
    const on = b.dataset.tool === id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on);
  });
  p.canvas.style.cursor = id === 'text' ? 'text' : '';
}

function paintSetColor(which, color) {
  const p = paint;
  p[which] = color;
  const box = p.container.querySelector(which === 'fg' ? '.paint-fg-color' : '.paint-bg-color');
  if (box) box.style.background = color;
}

// Pointer position in canvas backing pixels.
function paintPoint(e) {
  const c = paint.canvas, r = c.getBoundingClientRect();
  const cw = c.clientWidth || 1, ch = c.clientHeight || 1;
  return {
    x: (e.clientX - r.left - c.clientLeft) * c.width / cw,
    y: (e.clientY - r.top - c.clientTop) * c.height / ch,
  };
}

// Backing pixels per CSS pixel, rounded: 1 on a normal screen, 2-3 on phones.
// Tool sizes are in CSS px and multiplied by this, so they look the same everywhere.
function paintUnit() {
  const c = paint.canvas;
  return Math.max(1, Math.round(c.width / (c.clientWidth || c.width)));
}

// Put odd-width strokes on pixel centers so straight lines stay sharp.
function paintSnap(pt, lw) {
  const f = Math.round(lw) % 2 === 1 ? v => Math.floor(v) + 0.5 : v => Math.round(v);
  return { x: f(pt.x), y: f(pt.y) };
}

function paintNear(a, b, cssPx) {
  return Math.hypot(a.x - b.x, a.y - b.y) <= cssPx * paintUnit();
}

// 45-degree steps for lines and squares/circles for shapes (Shift).
function paintConstrain(tool, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (tool === 'line') {
    const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.hypot(dx, dy);
    return { x: a.x + Math.cos(ang) * len, y: a.y + Math.sin(ang) * len };
  }
  const s = Math.max(Math.abs(dx), Math.abs(dy));
  return { x: a.x + Math.sign(dx || 1) * s, y: a.y + Math.sign(dy || 1) * s };
}

function paintLineWidth() {
  return paint.width * paintUnit();
}

function paintDot(ctx, pt, size, color, round) {
  ctx.fillStyle = color;
  if (round) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(Math.round(pt.x - size / 2), Math.round(pt.y - size / 2), size, size);
  }
}

// Pencil (1px), brush (line width) and eraser (square, background color).
function paintFreehand(a, b) {
  const p = paint, s = p.stroke, ctx = p.ctx, unit = paintUnit();
  if (s.tool === 'eraser') {
    const size = (4 + p.width * 4) * unit;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (size / 4)));
    for (let i = 0; i <= steps; i++) {
      paintDot(ctx, { x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps }, size, p.bg, false);
    }
    return;
  }
  const pencil = s.tool === 'pencil';
  const lw = pencil ? unit : (p.width * 2 + 1) * unit;
  const A = paintSnap(a, lw), B = paintSnap(b, lw);
  if (A.x === B.x && A.y === B.y) {
    paintDot(ctx, A, lw, s.color, !pencil);
    return;
  }
  ctx.strokeStyle = s.color;
  ctx.lineWidth = lw;
  ctx.lineCap = pencil ? 'square' : 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();
}

function paintSpray(pt, color) {
  const p = paint, unit = paintUnit();
  const r = (4 + p.width * 3) * unit, n = 6 + p.width * 3;
  p.ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r;
    p.ctx.fillRect(Math.round(pt.x + Math.cos(ang) * d), Math.round(pt.y + Math.sin(ang) * d), unit, unit);
  }
}

function paintRoundRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function paintDrawShape(ctx, tool, a, b, color, lw) {
  const A = paintSnap(a, lw), B = paintSnap(b, lw);
  if (A.x === B.x && A.y === B.y) { paintDot(ctx, A, lw, color, true); return; }
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  // Closed shapes need no caps (and round caps blur a rectangle in Chrome).
  ctx.lineCap = tool === 'line' ? 'round' : 'butt';
  ctx.lineJoin = tool === 'rect' ? 'miter' : 'round';
  ctx.beginPath();
  if (tool === 'line') {
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  } else {
    const x = Math.min(A.x, B.x), y = Math.min(A.y, B.y);
    const w = Math.abs(B.x - A.x), h = Math.abs(B.y - A.y);
    if (tool === 'rect') ctx.rect(x, y, w, h);
    else if (tool === 'ellipse') ctx.ellipse(x + w / 2, y + h / 2, Math.max(w / 2, 0.5), Math.max(h / 2, 0.5), 0, 0, Math.PI * 2);
    else paintRoundRectPath(ctx, x, y, w, h, Math.min(w / 2, h / 2, 8 * paintUnit()));
  }
  ctx.stroke();
}

function paintDrawCurve(ctx, c) {
  ctx.strokeStyle = c.color;
  ctx.lineWidth = c.lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(c.a.x, c.a.y);
  ctx.bezierCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, c.b.x, c.b.y);
  ctx.stroke();
}

function paintDrawPolygon(ctx, poly, cursor, close) {
  const pts = cursor ? poly.pts.concat([cursor]) : poly.pts;
  if (pts.length === 1) { paintDot(ctx, pts[0], poly.lw, poly.color, true); return; }
  ctx.strokeStyle = poly.color;
  ctx.lineWidth = poly.lw;
  ctx.lineCap = close ? 'butt' : 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
  if (close) ctx.closePath();
  ctx.stroke();
}

function paintClearOverlay() {
  const o = paint.overlay;
  paint.octx.clearRect(0, 0, o.width, o.height);
}

// Scanline flood fill of the area around (x, y) that matches its color.
function paintFloodFill(px, py, color) {
  const p = paint, c = p.canvas, w = c.width, h = c.height;
  const x0 = Math.floor(px), y0 = Math.floor(py);
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return false;
  const img = p.ctx.getImageData(0, 0, w, h), d = img.data;
  const o0 = (y0 * w + x0) * 4;
  const tr = d[o0], tg = d[o0 + 1], tb = d[o0 + 2];
  const fr = parseInt(color.slice(1, 3), 16), fg = parseInt(color.slice(3, 5), 16), fb = parseInt(color.slice(5, 7), 16);
  if (tr === fr && tg === fg && tb === fb) return false;

  const T = PAINT_FILL_TOLERANCE, seen = new Uint8Array(w * h);
  const match = i => {
    if (seen[i]) return false;
    const o = i * 4;
    return Math.abs(d[o] - tr) <= T && Math.abs(d[o + 1] - tg) <= T && Math.abs(d[o + 2] - tb) <= T;
  };
  const stack = [x0, y0];
  while (stack.length) {
    const y = stack.pop();
    let x = stack.pop(), i = y * w + x;
    if (!match(i)) continue;
    while (x > 0 && match(i - 1)) { x--; i--; }
    let up = false, down = false;
    for (; x < w && match(i); x++, i++) {
      seen[i] = 1;
      const o = i * 4;
      d[o] = fr; d[o + 1] = fg; d[o + 2] = fb; d[o + 3] = 255;
      if (y > 0) {
        if (match(i - w)) { if (!up) { stack.push(x, y - 1); up = true; } } else up = false;
      }
      if (y < h - 1) {
        if (match(i + w)) { if (!down) { stack.push(x, y + 1); down = true; } } else down = false;
      }
    }
  }
  p.ctx.putImageData(img, 0, 0);
  return true;
}

function paintPickColor(pt, right) {
  const p = paint, c = p.canvas;
  const x = Math.max(0, Math.min(c.width - 1, Math.floor(pt.x)));
  const y = Math.max(0, Math.min(c.height - 1, Math.floor(pt.y)));
  const d = p.ctx.getImageData(x, y, 1, 1).data;
  const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  paintSetColor(right ? 'bg' : 'fg', hex);
  paintSelectTool(p.lastTool); // Win95 goes back to the previous tool
}

// ════════════════════════════════
//  POINTER INPUT
// ════════════════════════════════
function paintPointerDown(e) {
  const p = paint;
  if (!p || !e.isPrimary || p.stroke) return;
  if (e.button !== 0 && e.button !== 2) return;
  e.preventDefault(); // no text selection, focus change or iOS magnifier
  paintCloseMenu();
  if (p.text) { paintTextCommit(); return; } // a click outside the text box commits it

  const right = e.button === 2;
  const color = right ? p.bg : p.fg;
  const pt = paintPoint(e);
  paintShowCoords(pt);

  if (p.tool === 'fill') {
    paintPushUndo();
    if (paintFloodFill(pt.x, pt.y, color)) p.dirty = true;
    else paintDropUndo();
    return;
  }
  if (p.tool === 'picker') { paintPickColor(pt, right); return; }

  const s = p.stroke = { id: e.pointerId, tool: p.tool, color, right, start: pt, last: pt, moved: false, timer: 0 };
  try { p.canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer already gone */ }

  if (s.tool === 'pencil' || s.tool === 'brush' || s.tool === 'eraser') {
    paintPushUndo();
    p.dirty = true;
    paintFreehand(pt, pt);
  } else if (s.tool === 'airbrush') {
    paintPushUndo();
    p.dirty = true;
    paintSpray(pt, color);
    s.timer = setInterval(() => { if (p.stroke === s) paintSpray(s.last, color); }, 40);
  } else if (s.tool === 'curve') {
    if (!p.curve) p.curve = { phase: 0, a: pt, b: pt, c1: pt, c2: pt, color, lw: paintLineWidth() };
    else paintCurveMove(pt);
  } else if (s.tool === 'polygon') {
    if (!p.poly) p.poly = { pts: [pt], color, lw: paintLineWidth() };
    paintClearOverlay();
    paintDrawPolygon(p.octx, p.poly, pt, false);
  }
}

function paintPointerMove(e) {
  const p = paint;
  if (!p) return;
  const s = p.stroke;
  if (!s) {
    if (e.pointerType === 'mouse') paintShowCoords(paintPoint(e));
    return;
  }
  if (e.pointerId !== s.id) return;
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  const list = events.length ? events : [e];
  list.forEach(ev => {
    let pt = paintPoint(ev);
    if (!s.moved && !paintNear(pt, s.start, 1)) s.moved = true;
    if (s.tool === 'pencil' || s.tool === 'brush' || s.tool === 'eraser') {
      paintFreehand(s.last, pt);
    } else if (s.tool === 'airbrush') {
      paintSpray(pt, s.color);
    } else if (PAINT_SHAPE_TOOLS.indexOf(s.tool) !== -1) {
      if (e.shiftKey) pt = paintConstrain(s.tool, s.start, pt);
      s.end = pt;
    }
    s.last = pt;
  });
  paintShowCoords(s.last);

  if (PAINT_SHAPE_TOOLS.indexOf(s.tool) !== -1) {
    paintClearOverlay();
    paintDrawShape(p.octx, s.tool, s.start, s.end || s.last, s.color, paintLineWidth());
  } else if (s.tool === 'curve') {
    paintCurveMove(s.last);
  } else if (s.tool === 'polygon') {
    paintClearOverlay();
    paintDrawPolygon(p.octx, p.poly, s.last, false);
  }
}

function paintPointerUp(e) {
  const p = paint;
  if (!p || !p.stroke || e.pointerId !== p.stroke.id) return;
  const s = p.stroke;
  p.stroke = null;
  if (s.timer) clearInterval(s.timer);
  const pt = s.end || s.last;

  if (PAINT_SHAPE_TOOLS.indexOf(s.tool) !== -1) {
    paintClearOverlay();
    if (s.moved) {
      paintPushUndo();
      paintDrawShape(p.ctx, s.tool, s.start, pt, s.color, paintLineWidth());
      p.dirty = true;
    }
  } else if (s.tool === 'curve') {
    paintCurveUp(s);
  } else if (s.tool === 'polygon') {
    paintPolygonUp(s);
  } else if (s.tool === 'text') {
    paintTextStart(s.start, s.color);
  }
  if (e.pointerType !== 'mouse') paintShowCoords(null);
  if (p.layoutPending) paintLayout();
}

function paintPointerCancel(e) {
  const p = paint;
  if (!p || !p.stroke || e.pointerId !== p.stroke.id) return;
  if (p.stroke.timer) clearInterval(p.stroke.timer);
  p.stroke = null;
  if (!p.curve && !p.poly) paintClearOverlay();
  paintShowCoords(null);
  if (p.layoutPending) paintLayout();
}

// Curve (Win95): drag a line, then drag twice to bend it.
function paintCurveMove(pt) {
  const p = paint, c = p.curve;
  if (!c) return;
  if (c.phase === 0) { c.b = pt; c.c1 = c.a; c.c2 = pt; }
  else if (c.phase === 1) { c.c1 = pt; c.c2 = pt; }
  else c.c2 = pt;
  paintClearOverlay();
  paintDrawCurve(p.octx, c);
}

function paintCurveUp(s) {
  const p = paint, c = p.curve;
  if (!c) return;
  if (c.phase === 0 && !s.moved) { p.curve = null; paintClearOverlay(); return; }
  if (c.phase < 2) { c.phase++; return; }
  paintCurveFinish();
}

function paintCurveFinish() {
  const p = paint, c = p.curve;
  if (!c) return;
  p.curve = null;
  paintClearOverlay();
  paintPushUndo();
  paintDrawCurve(p.ctx, c);
  p.dirty = true;
}

// Polygon: drag the first side, then tap each corner. Tapping the first
// corner, tapping the last corner again or double-clicking closes it.
function paintPolygonUp(s) {
  const p = paint, poly = p.poly;
  if (!poly) return;
  const pt = s.last, pts = poly.pts, lastPt = pts[pts.length - 1];
  if (pts.length >= 3 && (paintNear(pt, pts[0], 8) || paintNear(pt, lastPt, 8))) {
    paintPolygonFinish();
    return;
  }
  if (!paintNear(pt, lastPt, 2)) pts.push(pt);
  paintClearOverlay();
  paintDrawPolygon(p.octx, poly, null, false);
}

function paintPolygonFinish() {
  const p = paint, poly = p.poly;
  if (!poly) return;
  p.poly = null;
  paintClearOverlay();
  paintPushUndo();
  paintDrawPolygon(p.ctx, poly, null, poly.pts.length >= 3);
  p.dirty = true;
}

// Text: tap to place a text box, type, then Enter or tap elsewhere.
function paintTextStart(pt, color) {
  const p = paint, c = p.canvas;
  const k = c.clientWidth / c.width; // backing px -> CSS px
  const left = pt.x * k, top = pt.y * k;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'paint-text-input';
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('enterkeyhint', 'done');
  input.setAttribute('aria-label', 'Text');
  input.spellcheck = false;
  input.style.left = (c.clientLeft + left) + 'px';
  input.style.top = (c.clientTop + top) + 'px';
  input.style.width = Math.max(40, c.clientWidth - left) + 'px';
  input.style.color = color;
  p.canvas.parentElement.appendChild(input);
  p.text = { input, x: pt.x, y: pt.y, color };
  input.addEventListener('keydown', e => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); paintTextCommit(); }
    else if (e.key === 'Escape') { e.preventDefault(); paintTextCancel(); }
  });
  input.addEventListener('blur', () => { if (p.text && p.text.input === input) paintTextCommit(); });
  input.focus();
}

function paintTextCommit() {
  const p = paint, t = p && p.text;
  if (!t) return;
  p.text = null;
  const value = t.input.value;
  t.input.remove();
  if (value.trim()) {
    const c = p.canvas, k = c.width / (c.clientWidth || c.width);
    paintPushUndo();
    p.ctx.fillStyle = t.color;
    p.ctx.font = `${Math.round(16 * k)}px "w95fa", "MS Sans Serif", Tahoma, sans-serif`;
    p.ctx.textBaseline = 'top';
    p.ctx.fillText(value, t.x + 2 * k, t.y + 2 * k);
    p.dirty = true;
  }
  if (p.layoutPending) paintLayout();
}

function paintTextCancel() {
  const p = paint, t = p && p.text;
  if (!t) return;
  p.text = null;
  t.input.remove();
  if (p.layoutPending) paintLayout();
}

// Finish a polygon, curve or text box (tool change, menu, New...).
function paintCommitPending() {
  const p = paint;
  if (!p) return;
  if (p.poly) paintPolygonFinish();
  if (p.curve) {
    if (p.curve.phase > 0) paintCurveFinish();
    else { p.curve = null; paintClearOverlay(); }
  }
  if (p.text) paintTextCommit();
}

function paintCancelPending() {
  const p = paint;
  if (!p) return;
  p.poly = null;
  p.curve = null;
  paintTextCancel();
  paintClearOverlay();
}

// ════════════════════════════════
//  UNDO AND IMAGE COMMANDS
// ════════════════════════════════
// Snapshots are canvases (cheap to copy); the oldest one is reused.
function paintPushUndo() {
  const p = paint, c = p.canvas;
  let snap = p.undo.length >= PAINT_UNDO_LEVELS ? p.undo.shift() : null;
  if (snap) {
    snap.width = c.width; // also clears it
    snap.height = c.height;
  } else {
    snap = paintMakeCanvas(c.width, c.height);
  }
  snap.getContext('2d').drawImage(c, 0, 0);
  p.undo.push(snap);
}

function paintDropUndo() {
  paintRelease(paint.undo.pop());
}

function paintUndo() {
  const p = paint;
  paintCommitPending();
  const snap = p.undo.pop();
  if (!snap) return;
  if (snap.width === p.canvas.width && snap.height === p.canvas.height) p.ctx.drawImage(snap, 0, 0);
  paintRelease(snap);
}

function paintNew() {
  const p = paint;
  paintCancelPending();
  p.mode = 'blank';
  p.dirty = false;
  paintRelease(p.store);
  p.store = null;
  p.name = 'untitled';
  paintSetTitle('Untitled - Paint');
  const a = isPhone() ? paintArea() : null;
  paintResizeSurface(a ? a.w : PAINT_BLANK_W, a ? a.h : PAINT_BLANK_H, false);
}

function paintClearImage() {
  const p = paint, c = p.canvas;
  paintCommitPending();
  paintPushUndo();
  p.ctx.fillStyle = p.bg;
  p.ctx.fillRect(0, 0, c.width, c.height);
  paintRelease(p.store);
  p.store = null;
  p.dirty = true;
}

function paintTransform(kind) {
  const p = paint, c = p.canvas, ctx = p.ctx;
  paintCommitPending();
  paintPushUndo();
  if (kind === 'invert') {
    const img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(img, 0, 0);
  } else {
    const copy = paintMakeCanvas(c.width, c.height);
    copy.getContext('2d').drawImage(c, 0, 0);
    ctx.save();
    if (kind === 'flipH') ctx.setTransform(-1, 0, 0, 1, c.width, 0);
    else ctx.setTransform(1, 0, 0, -1, 0, c.height);
    ctx.drawImage(copy, 0, 0);
    ctx.restore();
    paintRelease(copy);
  }
  paintRelease(p.store);
  p.store = null;
  p.dirty = true;
}

function paintToggleView(part) {
  const p = paint;
  p.hidden[part] = !p.hidden[part];
  const sel = { tools: '.paint-toolbox', colors: '.paint-palette', status: '.paint-status' }[part];
  const el = p.container.querySelector(sel);
  if (el) el.style.display = p.hidden[part] ? 'none' : '';
}

function paintSave() {
  const p = paint, c = p.canvas;
  paintCommitPending();
  const name = (p.name || 'untitled')
    .replace(/\.(png|jpe?g|gif|bmp|webp|svg)$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '').trim() || 'untitled';
  const download = href => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name + '.png';
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  if (c.toBlob) {
    c.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      download(url);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  } else {
    download(c.toDataURL('image/png'));
  }
}

function paintOpenFile() {
  const input = paint.container.querySelector('.paint-file-input');
  if (!input) return;
  input.value = '';
  input.click();
}

function paintEditColors() {
  const p = paint;
  let input = p.container.querySelector('.paint-color-input');
  if (!input) {
    input = document.createElement('input');
    input.type = 'color';
    input.className = 'paint-hidden-input paint-color-input';
    input.tabIndex = -1;
    input.setAttribute('aria-hidden', 'true');
    input.addEventListener('input', () => paintSetColor('fg', input.value));
    input.addEventListener('change', () => paintSetColor('fg', input.value));
    p.container.appendChild(input);
  }
  input.value = /^#[0-9a-f]{6}$/i.test(p.fg) ? p.fg : '#000000';
  input.click();
}

// ════════════════════════════════
//  MENUS AND MESSAGE BOX
// ════════════════════════════════
function paintOpenMenu(name, anchor) {
  const p = paint, items = PAINT_MENUS[name];
  if (!p || !items) return;
  paintCloseMenu();
  paintCommitPending();

  const menu = document.createElement('div');
  menu.className = 'paint-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map((it, i) => {
    if (!it) return '<div class="paint-menu-sep" role="separator"></div>';
    const off = it.enabled && !it.enabled();
    const on = it.checked && it.checked();
    return `<div class="paint-menu-item${off ? ' disabled' : ''}" role="menuitem" data-i="${i}"${off ? ' aria-disabled="true"' : ''}>
      <span class="paint-menu-check">${on ? '&#10003;' : ''}</span>
      <span class="paint-menu-label">${it.label}</span>
      <span class="paint-menu-key">${it.key || ''}</span>
    </div>`;
  }).join('');
  p.container.appendChild(menu);

  // Under its title, kept inside the window.
  const cr = p.container.getBoundingClientRect(), ar = anchor.getBoundingClientRect();
  const top = Math.round(ar.bottom - cr.top);
  menu.style.top = top + 'px';
  menu.style.maxHeight = Math.max(60, p.container.clientHeight - top) + 'px';
  menu.style.left = Math.max(0, Math.min(Math.round(ar.left - cr.left), p.container.clientWidth - menu.offsetWidth)) + 'px';
  anchor.classList.add('paint-menu-open');

  menu.addEventListener('click', e => {
    const el = e.target.closest('.paint-menu-item');
    if (!el || el.classList.contains('disabled')) return;
    const it = items[+el.dataset.i];
    paintCloseMenu();
    it.run();
  });
  const onDown = e => {
    if (menu.contains(e.target) || (e.target.closest && e.target.closest('.paint-menubar [data-paint-menu]'))) return;
    paintCloseMenu();
  };
  document.addEventListener('pointerdown', onDown, true);
  p.menu = { name, el: menu, anchor, onDown };
}

function paintCloseMenu() {
  const p = paint;
  if (!p || !p.menu) return;
  document.removeEventListener('pointerdown', p.menu.onDown, true);
  p.menu.el.remove();
  p.menu.anchor.classList.remove('paint-menu-open');
  p.menu = null;
}

// Win95 information box inside the Paint window.
function paintMessage(text) {
  const p = paint;
  if (!p) return;
  const old = p.container.querySelector('.paint-msg-backdrop');
  if (old) old.remove();
  const back = document.createElement('div');
  back.className = 'paint-msg-backdrop';
  back.innerHTML = `
    <div class="paint-msg" role="alertdialog" aria-modal="true" aria-label="Paint">
      <div class="paint-msg-title">
        <span>Paint</span>
        <button class="win-btn paint-msg-close" title="Close" aria-label="Close">
          <img src="img/close-icon.png" alt="" style="width:14px;height:14px;image-rendering:pixelated;display:block;">
        </button>
      </div>
      <div class="paint-msg-body">
        <svg class="paint-msg-icon" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16,2C8,2,2,7.5,2,14c0,4,2.3,7.5,6,9.7L6,30l8-5c0.7,0.1,1.3,0.1,2,0.1c8,0,14-5.5,14-12S24,2,16,2Z" fill="#fff" stroke="#000" stroke-width="1"/>
          <circle cx="16" cy="8.5" r="2.2" fill="#0000ff"/>
          <rect x="14" y="12" width="4" height="10" fill="#0000ff"/>
        </svg>
        <p class="paint-msg-text"></p>
      </div>
      <div class="paint-msg-footer"><button class="dialog-btn paint-msg-ok">OK</button></div>
    </div>`;
  back.querySelector('.paint-msg-text').textContent = text;
  p.container.appendChild(back);
  const close = () => back.remove();
  back.querySelector('.paint-msg-ok').addEventListener('click', close);
  back.querySelector('.paint-msg-close').addEventListener('click', close);
  back.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); close(); }
  });
  back.querySelector('.paint-msg-ok').focus({ preventScroll: true });
}

// Keyboard shortcuts while Paint is the active window.
document.addEventListener('keydown', e => {
  const p = paint;
  if (!p || !p.canvas.isConnected || activeWindow !== 'paint') return;
  if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
  if (e.key === 'Escape') {
    if (p.menu) paintCloseMenu();
    else paintCancelPending();
    return;
  }
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'z') paintUndo();
  else if (k === 's') paintSave();
  else if (k === 'o') paintOpenFile();
  else return;
  e.preventDefault();
});
