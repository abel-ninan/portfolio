// ════════════════════════════════
//  PROJECT WINDOWS  (one per PORTFOLIO.projects entry, type 'project-<id>')
// ════════════════════════════════
// A Win95 document: white sunken page that scrolls natively, with the
// project's header, hero figure, metric tiles, sections, tech stack, extra
// figures and link buttons. All copy comes from js/content.js and is escaped.
// WINDOW_DEFS entries are registered in js/apps/registry.js.
function projectWindowType(id) {
  return 'project-' + id;
}

function getProjectByType(type) {
  const id = String(type).replace(/^project-/, '');
  return PORTFOLIO.projects.find(p => p.id === id) || null;
}

// "Label: text" -> bold label + text (both escaped). Plain text otherwise.
function labelledHTML(str) {
  const s = String(str);
  const i = s.indexOf(': ');
  if (i > 0 && i <= 40) {
    return `<b>${escapeHTML(s.slice(0, i + 1))}</b> ${escapeHTML(s.slice(i + 2))}`;
  }
  return escapeHTML(s);
}

function projectFigureHTML(img, hero) {
  if (!img || !img.src) return '';
  const svg = /\.svg(\?|$)/i.test(img.src);
  return `
        <figure class="pf-figure${hero ? ' pf-hero' : ''}${svg ? ' pf-svg' : ''}">
          <div class="pf-frame">
            <img src="${escapeHTML(img.src)}" alt="${escapeHTML(img.alt || '')}" loading="lazy" decoding="async">
          </div>
          ${img.caption ? `<figcaption>${escapeHTML(img.caption)}</figcaption>` : ''}
        </figure>`;
}

function projectSectionHTML(sec) {
  let body = '';
  (sec.paragraphs || []).forEach(t => { body += `<p>${escapeHTML(t)}</p>`; });
  if (sec.steps && sec.steps.length) {
    body += `<ol class="pf-steps">${sec.steps.map(t => `<li>${labelledHTML(t)}</li>`).join('')}</ol>`;
  }
  if (sec.bullets && sec.bullets.length) {
    body += `<ul class="pf-bullets">${sec.bullets.map(t => `<li>${labelledHTML(t)}</li>`).join('')}</ul>`;
  }
  return `
        <section class="pf-section">
          <h2 class="pf-h2">${escapeHTML(sec.heading)}</h2>
          ${body}
        </section>`;
}

function buildProjectWindow(container, type) {
  const p = getProjectByType(type);
  if (!p) return;
  const list = PORTFOLIO.projects;
  const idx = list.indexOf(p);
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  const metrics = (p.metrics || []).map(m => `
          <div class="pf-metric">
            <span class="pf-metric-value">${escapeHTML(m.value)}</span>
            <span class="pf-metric-label">${escapeHTML(m.label)}</span>
          </div>`).join('');

  const links = (p.links || []).map(l => `
          <a class="pf-btn" href="${escapeHTML(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(l.label)}</a>`).join('');

  const navBtn = (to, label) => `
          <button type="button" class="pf-btn" data-action="project-nav"
                  data-from="${escapeHTML(type)}" data-to="${escapeHTML(projectWindowType(to.id))}"
                  title="${escapeHTML(to.title)}"><span>${label}</span></button>`;

  container.innerHTML = `
    <div class="window-menubar pf-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content pf-doc">
      <article class="pf-article">
        <header class="pf-head">
          <img class="pf-head-icon" src="${escapeHTML(p.icon)}" alt="">
          <div class="pf-head-text">
            <h1 class="pf-title">${escapeHTML(p.title)}</h1>
            <p class="pf-subtitle">${escapeHTML(p.subtitle)}</p>
            <p class="pf-meta">
              ${p.badge ? `<span class="pf-badge">${escapeHTML(p.badge)}</span>` : ''}
              <span class="pf-meta-text">${escapeHTML([p.period, p.role].filter(Boolean).join(' | '))}</span>
            </p>
          </div>
        </header>

        <p class="pf-summary">${escapeHTML(p.summary)}</p>

        ${projectFigureHTML(p.hero, true)}

        ${metrics ? `<div class="pf-metrics">${metrics}</div>` : ''}

        ${(p.sections || []).map(projectSectionHTML).join('')}

        ${p.stack && p.stack.length ? `
        <section class="pf-section">
          <h2 class="pf-h2">Tech stack</h2>
          <ul class="pf-chips">${p.stack.map(s => `<li>${escapeHTML(s)}</li>`).join('')}</ul>
        </section>` : ''}

        ${p.images && p.images.length ? `
        <section class="pf-section">
          <h2 class="pf-h2">Gallery</h2>
          ${p.images.map(img => projectFigureHTML(img, false)).join('')}
        </section>` : ''}

        ${links ? `
        <section class="pf-section">
          <h2 class="pf-h2">Links</h2>
          <div class="pf-btn-row">${links}</div>
        </section>` : ''}

        <nav class="pf-nav" aria-label="More projects">
          ${navBtn(prev, '&lt; <u>P</u>revious')}
          <button type="button" class="pf-btn" data-open="projects">All projects</button>
          ${navBtn(next, '<u>N</u>ext &gt;')}
        </nav>
      </article>
    </div>
    <div class="status-bar">
      <span class="status-item">${escapeHTML(p.role || '')}</span>
      <span class="status-item pf-status-period">${escapeHTML(p.period || '')}</span>
      <div class="status-resize-slot"></div>
    </div>
  `;

  // Photos are shown at most 480px wide; panoramas (2:1 or wider) may use the
  // full page width, tall portrait ones (e.g. a 9:16 video frame) half that.
  container.querySelectorAll('.pf-figure:not(.pf-svg) img').forEach(img => {
    const mark = () => {
      const fig = img.closest('.pf-figure');
      if (img.naturalWidth >= img.naturalHeight * 2) fig.classList.add('pf-wide');
      else if (img.naturalHeight > img.naturalWidth * 1.2) fig.classList.add('pf-portrait');
    };
    if (img.complete && img.naturalWidth) mark();
    else img.addEventListener('load', mark, { once: true });
  });
}

// Previous / Next: replace this project window with another one, in the same
// place and at the same size on desktop (phones show it full-screen anyway).
function switchProjectWindow(fromType, toType) {
  if (!WINDOW_DEFS[toType] || fromType === toType) return;
  const from = document.getElementById('win-' + fromType);
  const state = openWindows[fromType];
  const wasOpen = !!openWindows[toType];
  const rect = from && state ? {
    x: from.offsetLeft, y: from.offsetTop,
    w: from.offsetWidth, h: from.offsetHeight,
    maximized: state.maximized && !state.autoMax,
  } : null;

  if (from) closeWindow(fromType);
  openWindow(toType);
  if (wasOpen || !rect || isPhone()) return;

  const win = document.getElementById('win-' + toType);
  const next = openWindows[toType];
  if (!win || !next) return;
  if (rect.maximized) {
    setMaximized(toType, true, false);
  } else {
    Object.assign(next, { x: rect.x, y: rect.y, w: rect.w, h: rect.h });
    win.style.left = rect.x + 'px';
    win.style.top = rect.y + 'px';
    win.style.width = rect.w + 'px';
    win.style.height = rect.h + 'px';
  }
  fitWindow(toType);
}
