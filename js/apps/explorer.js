// ════════════════════════════════
//  EXPLORER WINDOWS (My Computer, My Files, folders, Recycle Bin)
// ════════════════════════════════
function buildFilesWindow(container) {
  const files = [
    { name: 'Documents', icon: ICONS.files },
    { name: 'Photos',    icon: ICONS.files },
    { name: 'Nat Miletic Bio', icon: ICONS.textFile },
  ];

  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${files.map(f => `
          <div class="file-item" onclick="selectFile(this)" ondblclick="openFileItem('${f.name}')">
            <img src="${f.icon}" alt="">
            <span class="file-label">${f.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${files.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildDocumentsWindow(container) {
  const files = [
    { name: 'Clio Websites Portfolio', url: 'https://cliowebsites.com/portfolio' },
    { name: 'Websites USA Portfolio',  url: 'https://websitesusa.com/our-work/' },
    { name: 'Nat Miletic Github',      url: 'https://github.com/natmiletic' },
  ];
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${files.map(f => `
          <div class="file-item" onclick="selectFile(this)" ondblclick="window.open('${f.url}','_blank')">
            <img src="img/world.png" alt="${f.name}">
            <span class="file-label">${f.name}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${files.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildPhotosWindow(container) {
  const photos = [
    { name: 'Nat Miletic Headshot', src: 'img/headshot.png', icon: ICONS.imageFile },
  ];
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${photos.map(p => `
          <div class="file-item" onclick="selectFile(this)" ondblclick="openImageInPaint('${p.src}','${p.name}')">
            <img src="${p.icon}" alt="">
            <span class="file-label">${p.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${photos.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildComputerWindow(container) {
  const drives = [
    { name: 'Floppy (A:)',      icon: ICONS.floppy },
    { name: 'Local Disk (C:)',  icon: ICONS.drive },
    { name: 'CD-ROM (D:)',      icon: ICONS.cdrom },
    { name: 'My Files',         icon: ICONS.files },
    { name: 'Control Panel',    icon: ICONS.controlPanel },
  ];

  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${drives.map(d => `
          <div class="file-item" onclick="selectFile(this)" ondblclick="${d.name === 'My Files' ? "openWindow('files')" : d.name === 'Control Panel' ? "openWindow('controlpanel')" : ''}">
            <img src="${d.icon}" alt="">
            <span class="file-label">${d.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${drives.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildControlPanelWindow(container) {
  const items = [
    { name: 'Display',        icon: 'img/my-computer.png' },
    { name: 'Fonts',          icon: 'img/notepad.png' },
    { name: 'Internet',       icon: 'img/internet-explorer.png' },
    { name: 'Mouse',          icon: 'img/my-computer.png' },
    { name: 'Sounds',         icon: 'img/speaker.png' },
  ];
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${items.map(d => `
          <div class="file-item" onclick="selectFile(this)">
            <img src="${d.icon}" alt="">
            <span class="file-label">${d.name}</span>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${items.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildBriefcaseWindow(container) {
  const files = [
    { name: 'Clio Websites Portfolio',  url: 'https://cliowebsites.com/portfolio' },
    { name: 'Websites USA Portfolio',   url: 'https://websitesusa.com/our-work/' },
    { name: 'Nat Miletic Github',       url: 'https://github.com/natmiletic' },
  ];
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
    <div class="window-content">
      <div class="file-grid">
        ${files.map(f => `
          <div class="file-item" onclick="selectFile(this)" ondblclick="window.open('${f.url}','_blank')">
            <img src="img/world.png" alt="${f.name}">
            <span class="file-label">${f.name}</span>
          </div>`).join('')}
      </div>
    </div>
    <div class="status-bar">
      <span class="status-item">${files.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}

function buildRecycleWindow(container) {
  const colStyle = `flex:1;padding:2px 6px;font-size:11px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;border:2px solid;border-top-color:var(--c-border-lightest);border-left-color:var(--c-border-lightest);border-bottom-color:var(--c-border-dark);border-right-color:var(--c-border-dark);cursor:default;`;
  const rowStyle = `display:flex;align-items:center;padding:2px 0;border-bottom:1px solid #e0e0e0;font-size:13px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;`;
  const items = typeof recycleBinItems !== 'undefined' ? recycleBinItems : [];
  const rows = items.map(item => `
    <div style="${rowStyle}">
      <div style="flex:1;display:flex;align-items:center;gap:6px;padding:0 6px;">
        <img src="${item.src}" style="width:16px;height:16px;image-rendering:pixelated;flex-shrink:0;">
        <span>${item.name}</span>
      </div>
      <div style="flex:1;padding:0 6px;color:#444;">Desktop</div>
    </div>`).join('');
  container.innerHTML = `
    <div class="window-menubar">
      <span class="menu-item"><u>F</u>ile</span>
      <span class="menu-item"><u>E</u>dit</span>
      <span class="menu-item"><u>V</u>iew</span>
      <span class="menu-item"><u>H</u>elp</span>
    </div>
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
      <span class="status-item">${items.length} object(s)</span>
      <div class="status-resize-slot"></div>
    </div>
  `;
}
