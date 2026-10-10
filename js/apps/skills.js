// ════════════════════════════════
//  SKILLS  (WordPad - Skills.doc)
// ════════════════════════════════
// The full skills breakdown from PORTFOLIO.skillsDoc (js/content.js), in the
// same WordPad chrome and page styles as Resume.doc (css/apps/portfolio.css).
function skillsPageHTML() {
  const P = PORTFOLIO;
  const D = P.skillsDoc;

  const sections = D.sections.map(sec => `
      <section class="rs-section">
        <h2 class="rs-h2">${escapeHTML(sec.heading)}</h2>
        <dl class="rs-skills">${sec.groups.map(g => `
          <div class="rs-skill">
            <dt>${escapeHTML(g.label)}:</dt>
            <dd>${escapeHTML(g.items.join(', '))}</dd>
          </div>`).join('')}
        </dl>
        ${sec.appliedIn ? `<p class="sk-applied"><b>Used in:</b> ${escapeHTML(sec.appliedIn)}</p>` : ''}
      </section>`).join('');

  const certs = P.certifications.map(c => `
          <li><b>${escapeHTML(c.name)}</b>, ${escapeHTML(c.issuer)}${c.date ? ` <span class="rs-cert-date">(${escapeHTML(c.date)})</span>` : ''}</li>`).join('');

  return `
      <header class="rs-header">
        <h1 class="rs-name">${escapeHTML(P.name)}</h1>
        <p class="rs-tagline">${escapeHTML(D.title)}</p>
        <p class="sk-roles">${escapeHTML(D.roles)}</p>
      </header>
      <p class="sk-intro">${escapeHTML(D.intro)}</p>
      ${sections}
      <section class="rs-section">
        <h2 class="rs-h2">Certifications</h2>
        <ul class="rs-list">${certs}</ul>
      </section>`;
}

function buildSkillsWindow(container) {
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
      <button type="button" class="pf-btn pf-tool-btn" data-open="resume">
        <img src="${escapeHTML(ICONS.resume)}" alt="">Open Resume.doc
      </button>
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
      <article class="rs-page">${skillsPageHTML()}
      </article>
    </div>
    <div class="status-bar">
      <span class="status-item">For Help, press F1</span>
      <span class="status-item rs-status-num">NUM</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}
