// ════════════════════════════════
//  PAINT
// ════════════════════════════════
function buildPaintWindow(container) {
  const COLORS = [
    '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
    '#808040','#004040','#0080ff','#004080','#8000ff','#804000',
    '#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff',
    '#ffff80','#80ff80','#80ffff','#8080ff','#ff80ff','#ff8040',
  ];

  const TOOLS = [
    { name:'Free Select',   svg:`<svg viewBox="0 0 16 16"><path d="M8,1C12,1,15,4,15,8C15,12,12,15,8,15C4,15,1,12,1,8C1,4,4,1,8,1Z" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="2,1.5"/></svg>` },
    { name:'Rect Select',   svg:`<svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" fill="none" stroke="#000" stroke-width="1.5" stroke-dasharray="3,1.5"/></svg>` },
    { name:'Eraser',        svg:`<svg viewBox="0 0 16 16"><rect x="1" y="8" width="14" height="7" fill="#ffaaff" stroke="#000" stroke-width="1"/><rect x="1" y="8" width="6" height="7" fill="#ff00ff"/></svg>` },
    { name:'Fill',          svg:`<svg viewBox="0 0 16 16"><path d="M2,13L2,7L6,3L10,7L8,7L8,13Z" fill="#4040ff" stroke="#000" stroke-width="0.5"/><circle cx="13" cy="13" r="2.5" fill="#ff0000"/><line x1="10" y1="10" x2="12" y2="11" stroke="#000" stroke-width="1"/></svg>` },
    { name:'Color Picker',  svg:`<svg viewBox="0 0 16 16"><path d="M14,2L15,3L7,11L5,11L5,13L3,15L1,13L3,11L5,11L5,9Z" fill="#000"/></svg>` },
    { name:'Magnifier',     svg:`<svg viewBox="0 0 16 16"><circle cx="6" cy="6" r="5" fill="none" stroke="#000" stroke-width="2"/><circle cx="6" cy="6" r="2.5" fill="#fff"/><line x1="10" y1="10" x2="15" y2="15" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg>` },
    { name:'Pencil',        svg:`<svg viewBox="0 0 16 16"><path d="M13,2L15,4L5,14L3,14L3,12Z" fill="#000"/><path d="M3,12L3,14L5,14" fill="none" stroke="#808080" stroke-width="1"/></svg>` },
    { name:'Brush',         svg:`<svg viewBox="0 0 16 16"><path d="M13,1L15,3L7,11L5,9Z" fill="#804000"/><path d="M5,9L7,11C7,11,6,14,3,14C2,13,2,11,5,9Z" fill="#4080ff"/></svg>` },
    { name:'Airbrush',      svg:`<svg viewBox="0 0 16 16"><rect x="4" y="6" width="7" height="8" rx="2" fill="#808080" stroke="#000" stroke-width="1"/><rect x="1" y="8" width="4" height="2" fill="#000"/><circle cx="12" cy="3" r="1" fill="#000"/><circle cx="14" cy="6" r="1" fill="#000"/><circle cx="14" cy="1" r="1" fill="#000"/><circle cx="11" cy="1" r="1" fill="#000"/></svg>` },
    { name:'Text',          svg:`<svg viewBox="0 0 16 16"><text x="2" y="13" font-family="serif" font-size="13" font-weight="bold" fill="#000">A</text></svg>` },
    { name:'Line',          svg:`<svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2" stroke="#000" stroke-width="2"/></svg>` },
    { name:'Curve',         svg:`<svg viewBox="0 0 16 16"><path d="M2,14 Q2,2 14,2" fill="none" stroke="#000" stroke-width="2"/></svg>` },
    { name:'Rectangle',     svg:`<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" fill="none" stroke="#000" stroke-width="2"/></svg>` },
    { name:'Polygon',       svg:`<svg viewBox="0 0 16 16"><polygon points="8,2 14,7 12,14 4,14 2,7" fill="none" stroke="#000" stroke-width="2"/></svg>` },
    { name:'Ellipse',       svg:`<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="6" ry="5" fill="none" stroke="#000" stroke-width="2"/></svg>` },
    { name:'Rounded Rect',  svg:`<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" rx="3" fill="none" stroke="#000" stroke-width="2"/></svg>` },
  ];

  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>I</u>mage</span>
      <span class="menu-item"><u>O</u>ptions</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="paint-body">
      <div class="paint-toolbox">
        <div class="paint-tools">
          ${TOOLS.map((t, i) => `
            <button class="paint-tool${i === 6 ? ' active' : ''}" title="${t.name}"
              onclick="this.closest('.paint-tools').querySelectorAll('.paint-tool').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
              ${t.svg}
            </button>`).join('')}
        </div>
        <div class="paint-tool-options">
          ${[1,2,3,4,5].map((w, i) => `
            <button class="paint-line-opt${i === 0 ? ' active' : ''}" title="${w}px line"
              onclick="this.closest('.paint-tool-options').querySelectorAll('.paint-line-opt').forEach(b=>b.classList.remove('active'));this.classList.add('active')">
              <span class="paint-line-preview" style="height:${w}px;"></span>
            </button>`).join('')}
        </div>
      </div>
      <div class="paint-canvas-wrap">
        <div class="paint-canvas-inner">
          <canvas class="paint-canvas" width="400" height="300"></canvas>
          <div class="paint-canvas-handle paint-handle-r"></div>
          <div class="paint-canvas-handle paint-handle-b"></div>
          <div class="paint-canvas-handle paint-handle-br"></div>
        </div>
      </div>
    </div>
    <div class="paint-palette">
      <div class="paint-fg-bg">
        <div class="paint-color-box paint-bg-color"></div>
        <div class="paint-color-box paint-fg-color"></div>
      </div>
      <div class="paint-color-grid">
        ${COLORS.map(c => `<div class="paint-color-swatch" style="background:${c};" title="${c}"
          onclick="this.closest('.paint-palette').querySelector('.paint-fg-color').style.background='${c}'"
          oncontextmenu="event.preventDefault();this.closest('.paint-palette').querySelector('.paint-bg-color').style.background='${c}'"></div>`).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item paint-coords" style="min-width:80px;"></span>
      <span class="status-item">400 x 300</span>
      <div class="status-resize-slot"></div>
    </div>
  `;

  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;';

  const canvas = container.querySelector('.paint-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      const x = Math.round(e.clientX - r.left);
      const y = Math.round(e.clientY - r.top);
      const el = container.querySelector('.paint-coords');
      if (el) el.textContent = `${x}, ${y}`;
    });
    canvas.addEventListener('mouseleave', () => {
      const el = container.querySelector('.paint-coords');
      if (el) el.textContent = '';
    });
  }
}
