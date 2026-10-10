// ════════════════════════════════
//  EXPLORER WINDOWS (My Computer, My Files, folders, Recycle Bin)
// ════════════════════════════════
// Folder items open with one click / tap through the js/desktop.js convention:
//   open:   window type  -> data-open
//   href:   url          -> data-href (new tab)
//   action: tap action   -> data-action (+ data-* from `data`)
// Items without any of these only get selected, like the original.
const FOLDER_MENUBAR = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>`;

function folderItemHTML(item) {
  let attrs = '';
  if (item.open) attrs += ` data-open="${escapeHTML(item.open)}"`;
  else if (item.href) attrs += ` data-href="${escapeHTML(item.href)}"`;
  else if (item.action) attrs += ` data-action="${escapeHTML(item.action)}"`;
  Object.keys(item.data || {}).forEach(k => {
    attrs += ` data-${k}="${escapeHTML(item.data[k])}"`;
  });
  if (item.tip) attrs += ` title="${escapeHTML(item.tip)}"`;
  const tappable = item.open || item.href || item.action;
  return `
          <div class="file-item"${attrs}${tappable ? ' role="button" tabindex="0"' : ''}>
            <img src="${escapeHTML(item.icon)}" alt="">
            <span class="file-label">${escapeHTML(item.name).replace(/_/g, '_<wbr>')}</span>
          </div>`;
}

// Standard folder window: menubar, white icon grid, status bar.
function buildFolderWindow(container, items) {
  container.innerHTML = `
    ${FOLDER_MENUBAR}
    <div class="window-content">
      <div class="file-grid">
        ${items.map(folderItemHTML).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${items.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
  // Plain items (drives, Control Panel applets) still select on click.
  container.querySelector('.file-grid').addEventListener('click', e => {
    const item = e.target.closest('.file-item');
    if (item) selectFile(item);
  });
}

function buildFilesWindow(container) {
  buildFolderWindow(container, [
    { name: 'Documents',      icon: ICONS.files, open: 'documents' },
    { name: 'Photos',         icon: ICONS.files, open: 'photos' },
    { name: 'My Projects',    icon: ICONS.projects, open: 'projects' },
    { name: 'Abel Ninan Bio', icon: ICONS.textFile, open: 'bio' },
  ]);
}

function buildDocumentsWindow(container) {
  buildFolderWindow(container, [
    { name: 'Abel_Ninan_Resume.pdf', icon: ICONS.pdf, href: PORTFOLIO.links.resumePdf, tip: 'Opens the PDF in a new tab' },
    { name: 'Resume.doc',            icon: ICONS.resume, open: 'resume' },
    { name: 'Certifications.txt',    icon: ICONS.certificate, open: 'certifications' },
    { name: 'GitHub',                icon: ICONS.github, href: PORTFOLIO.links.github, tip: PORTFOLIO.links.github },
  ]);
}

function buildPhotosWindow(container) {
  buildFolderWindow(container, [
    { name: 'Abel_Ninan.jpg', icon: ICONS.imageFile, action: 'open-image',
      data: { src: 'img/headshot.jpg', name: 'Abel_Ninan.jpg' } },
  ]);
}

// The empty drives answer like Win95 with no disk in them; C: holds My Files.
// (Tap actions are registered in js/apps/registry.js.)
function buildComputerWindow(container) {
  buildFolderWindow(container, [
    { name: 'Floppy (A:)',     icon: ICONS.floppy, action: 'drive-not-ready', data: { drive: 'A' } },
    { name: 'Local Disk (C:)', icon: ICONS.drive, open: 'files' },
    { name: 'CD-ROM (D:)',     icon: ICONS.cdrom, action: 'drive-not-ready', data: { drive: 'D' } },
    { name: 'My Files',        icon: ICONS.files, open: 'files' },
    { name: 'Control Panel',   icon: ICONS.controlPanel, open: 'controlpanel' },
  ]);
}

function buildControlPanelWindow(container) {
  const applet = (name, icon) => ({ name, icon, action: 'cpl-unavailable', data: { name } });
  buildFolderWindow(container, [
    applet('Display',  'img/my-computer.png'),
    applet('Fonts',    'img/notepad.png'),
    applet('Internet', 'img/internet-explorer.png'),
    applet('Mouse',    'img/my-computer.png'),
    applet('Sounds',   'img/speaker.png'),
  ]);
}

function showDriveNotReady(drive) {
  showMessageBox({
    id: 'drive-error',
    title: drive + ':\\',
    icon: 'error',
    owner: 'computer',
    text: `${drive}:\\ is not accessible.\n\nThe device is not ready.`,
    buttons: [{ label: '<u>R</u>etry', run: () => setTimeout(() => showDriveNotReady(drive), 150) }, { label: 'Cancel' }],
  });
}

// My Projects: one icon per project in PORTFOLIO.projects; the status bar
// shows a project's one-line subtitle while the pointer is over it.
function buildProjectsFolderWindow(container) {
  const projects = PORTFOLIO.projects;
  buildFolderWindow(container, projects.map(p => ({
    name: p.title,
    icon: p.icon,
    open: projectWindowType(p.id),
    tip: p.subtitle,
  })));
  container.querySelector('.file-grid').classList.add('pf-project-grid');
  const status = container.querySelector('.status-item');
  const idle = `${projects.length} object(s)`;
  container.querySelectorAll('.file-item').forEach((el, i) => {
    el.addEventListener('mouseenter', () => { status.textContent = projects[i].subtitle; });
    el.addEventListener('mouseleave', () => { status.textContent = idle; });
  });
}

function buildRecycleWindow(container) {
  const colStyle = `flex:1;padding:2px 6px;font-size:11px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;border:2px solid;border-top-color:var(--c-border-lightest);border-left-color:var(--c-border-lightest);border-bottom-color:var(--c-border-dark);border-right-color:var(--c-border-dark);cursor:default;`;
  const rowStyle = `display:flex;align-items:center;padding:2px 0;border-bottom:1px solid #e0e0e0;font-size:13px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;`;
  const items = typeof recycleBinItems !== 'undefined' ? recycleBinItems : [];
  // One click / tap on a row restores it to the desktop (restoreRecycledIcon).
  const rows = items.map(item => `
    <div class="recycle-row" style="${rowStyle}" data-action="recycle-restore" data-id="${escapeHTML(item.id)}"
         role="button" tabindex="0" title="Restore to the desktop" aria-label="Restore ${escapeHTML(item.name)} to the desktop">
      <div style="flex:1;display:flex;align-items:center;gap:6px;padding:0 6px;min-width:0;">
        <img src="${escapeHTML(item.src)}" alt="" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">
        <span style="overflow-wrap:anywhere;">${escapeHTML(item.name)}</span>
      </div>
      <div style="flex:1;padding:0 6px;color:#444;">Desktop</div>
    </div>`).join('');
  container.innerHTML = `
    ${FOLDER_MENUBAR}
    <div style="display:flex;flex-direction:column;flex:1;overflow:hidden;min-height:0;">
      <div style="display:flex;flex-shrink:0;background:var(--c-material);">
        <div style="${colStyle}">Name</div>
        <div style="${colStyle}">Original Location</div>
      </div>
      <div class="window-content" style="flex:1;overflow:auto;background:#fff;">
        ${rows}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${items.length} object(s)${items.length ? ` &middot; ${isPhone() ? 'Tap' : 'Click'} one to restore it` : ''}</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}
