// ════════════════════════════════
//  RESUME  (WordPad - Resume.doc)
// ════════════════════════════════
// WordPad chrome around a white page built from PORTFOLIO (js/content.js).
// Download PDF links the real file; Print prints only the page.
const PRINTER_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
  <rect x="4" y="1" width="8" height="5" fill="#fff" stroke="#000"/>
  <rect x="1" y="6" width="14" height="6" fill="#c0c0c0" stroke="#000"/>
  <rect x="2" y="7" width="12" height="1" fill="#fff"/>
  <rect x="11" y="8" width="2" height="1" fill="#008000"/>
  <rect x="4" y="10" width="8" height="5" fill="#fff" stroke="#000"/>
  <rect x="5" y="12" width="6" height="1" fill="#808080"/>
</svg>`;

function resumePageHTML() {
  const P = PORTFOLIO;
  const L = P.links;
  const linkText = url => url.replace(/^https?:\/\/(www\.)?/, '');

  const jobs = P.experience.map(j => `
        <div class="rs-job">
          <div class="rs-job-head">
            <span class="rs-role">${escapeHTML(j.role)}</span>
            <span class="rs-dates">${escapeHTML(j.start)} - ${escapeHTML(j.current ? 'Present' : j.end)}</span>
          </div>
          <div class="rs-company">${escapeHTML(j.company)}</div>
          <ul class="rs-list">${j.bullets.map(b => `<li>${escapeHTML(b)}</li>`).join('')}</ul>
        </div>`).join('');

  const schools = P.education.map(e => `
        <div class="rs-job">
          <div class="rs-job-head">
            <span class="rs-role">${escapeHTML(e.school)}</span>
            <span class="rs-dates">${escapeHTML(e.date)}</span>
          </div>
          <div class="rs-company">${escapeHTML(e.degree)}${e.minor ? `, Minor in ${escapeHTML(e.minor)}` : ''}</div>
        </div>`).join('');

  const skills = P.skills.map(s => `
          <div class="rs-skill">
            <dt>${escapeHTML(s.group)}:</dt>
            <dd>${escapeHTML(s.items.join(', '))}</dd>
          </div>`).join('');

  const certs = P.certifications.map(c => `
          <li><b>${escapeHTML(c.name)}</b>, ${escapeHTML(c.issuer)}${c.date ? ` <span class="rs-cert-date">(${escapeHTML(c.date)})</span>` : ''}</li>`).join('');

  const leadership = (P.leadership || []).map(l => `
          <li><b>${escapeHTML(l.role)}</b>, ${escapeHTML(l.org)}${l.note ? `: ${escapeHTML(l.note)}` : ''}${l.date ? ` <span class="rs-cert-date">(${escapeHTML(l.date)})</span>` : ''}</li>`).join('');

  return `
      <header class="rs-header">
        <h1 class="rs-name">${escapeHTML(P.name)}</h1>
        <p class="rs-tagline">${escapeHTML(P.tagline)}</p>
        <p class="rs-contact">
          <a href="mailto:${escapeHTML(P.email)}">${escapeHTML(P.email)}</a>
          <span class="rs-dot" aria-hidden="true">|</span>
          <a href="${escapeHTML(L.linkedin)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkText(L.linkedin))}</a>
          <span class="rs-dot" aria-hidden="true">|</span>
          <a href="${escapeHTML(L.github)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkText(L.github))}</a>
        </p>
      </header>
      <section class="rs-section">
        <h2 class="rs-h2">Experience</h2>
        ${jobs}
      </section>
      <section class="rs-section">
        <h2 class="rs-h2">Education</h2>
        ${schools}
      </section>
      ${leadership ? `<section class="rs-section">
        <h2 class="rs-h2">Leadership</h2>
        <ul class="rs-list">${leadership}</ul>
      </section>` : ''}
      <section class="rs-section">
        <h2 class="rs-h2">Skills</h2>
        <dl class="rs-skills">${skills}</dl>
      </section>
      <section class="rs-section">
        <h2 class="rs-h2">Certifications</h2>
        <ul class="rs-list">${certs}</ul>
      </section>`;
}

function buildResumeWindow(container) {
  const pdf = PORTFOLIO.links.resumePdf;
  container.innerHTML = `
    <div class="window-menubar pf-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>I</u>nsert</span>
      <span class="menu-item">F<u>o</u>rmat</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="pf-toolbar">
      <a class="pf-btn pf-tool-btn" href="${escapeHTML(pdf)}" download="Abel_Ninan_Resume.pdf" target="_blank" rel="noopener">
        <img src="${escapeHTML(ICONS.pdf)}" alt="">Download PDF
      </a>
      <button type="button" class="pf-btn pf-tool-btn rs-print">${PRINTER_SVG}Print</button>
    </div>
    <div class="rs-formatbar" aria-hidden="true">
      <span class="rs-combo rs-combo-font">Arial</span>
      <span class="rs-combo rs-combo-size">10</span>
      <span class="toolbar-sep"></span>
      <span class="rs-fmt"><b>B</b></span>
      <span class="rs-fmt"><i>I</i></span>
      <span class="rs-fmt"><u>U</u></span>
    </div>
    <div class="rs-ruler" aria-hidden="true"><div class="rs-ruler-track"></div></div>
    <div class="window-content rs-doc">
      <article class="rs-page">${resumePageHTML()}
      </article>
    </div>
    <div class="status-bar">
      <span class="status-item">For Help, press F1</span>
      <span class="status-item rs-status-num">NUM</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
  container.querySelector('.rs-print').addEventListener('click', printResume);
}

// Print just the resume page: copy it into a top-level node that the print
// stylesheet (css/apps/portfolio.css) shows on its own.
function printResume() {
  const old = document.getElementById('pf-print-root');
  if (old) old.remove();
  const root = document.createElement('div');
  root.id = 'pf-print-root';
  root.innerHTML = `<article class="rs-page">${resumePageHTML()}</article>`;
  document.body.appendChild(root);
  document.body.classList.add('pf-printing');
  const done = () => {
    document.body.classList.remove('pf-printing');
    root.remove();
    window.removeEventListener('afterprint', done);
  };
  // The copy is hidden on screen, so a browser without afterprint just
  // leaves it until the next Print.
  window.addEventListener('afterprint', done);
  window.print();
}
