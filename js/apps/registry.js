// ════════════════════════════════
//  WINDOW DEFINITIONS
// ════════════════════════════════
// dialog: true    small box window; on phones it stays a centered box sized
//                 to its content instead of opening full-screen (js/windows.js)
// closeOnly: true the title bar has only Close (Win95 dialogs)
// noResize: true  fixed size: no resize grip, Maximize shown greyed out
// taskbarTitle    shorter taskbar label on phones, where the buttons are narrow

// Icons for the portfolio windows (title bar and taskbar use ICONS[def.icon]).
Object.assign(ICONS, {
  projects:     'img/icons/projects.png',
  resume:       'img/icons/resume.png',
  contact:      'img/icons/contact.png',
  pdf:          'img/icons/pdf.png',
  certificate:  'img/icons/certificate.png',
  github:       'img/icons/github.png',
});

const WINDOW_DEFS = {
  computer: {
    title: 'My Computer',
    width: 500, height: 360,
    icon: 'computer',
    build: buildComputerWindow,
  },
  files: {
    title: 'My Files',
    taskbarTitle: 'Files',
    width: 520, height: 380,
    icon: 'files',
    build: buildFilesWindow,
  },
  projects: {
    title: 'My Projects',
    taskbarTitle: 'Projects',
    width: 560, height: 380,
    icon: 'projects',
    build: buildProjectsFolderWindow,
  },
  resume: {
    title: 'Resume.doc - WordPad',
    taskbarTitle: 'Resume',
    width: 720, height: 600,
    icon: 'resume',
    build: buildResumeWindow,
  },
  skills: {
    title: 'Skills.doc - WordPad',
    taskbarTitle: 'Skills',
    width: 720, height: 600,
    icon: 'resume',
    build: buildSkillsWindow,
  },
  contact: {
    title: 'New Message',
    taskbarTitle: 'Contact',
    width: 560, height: 480,
    icon: 'contact',
    build: buildContactWindow,
  },
  recycle: {
    title: 'Recycle Bin',
    width: 380, height: 300,
    icon: 'recycle',
    build: buildRecycleWindow,
  },
  ie: {
    title: 'Internet Explorer',
    taskbarTitle: 'Internet',
    width: 800, height: 580,
    icon: 'ie',
    build: buildIEWindow,
  },
  welcome: {
    title: 'Welcome',
    width: 480, height: 380,
    icon: 'welcome',
    dialog: true,
    closeOnly: true,
    noIcon: true,
    noResize: true,
    build: buildWelcomeWindow,
  },
  shutdown: {
    title: 'Shut Down Windows',
    taskbarTitle: 'Shut Down',
    width: 374, height: 215,
    icon: 'shutdown',
    dialog: true,
    closeOnly: true,
    noIcon: true,
    noResize: true,
    build: buildShutdownWindow,
  },
  notepad: {
    title: 'Untitled - Notepad',
    taskbarTitle: 'Notepad',
    width: 430, height: 320,
    icon: 'notepad',
    build: buildNotepadWindow,
  },
  bio: {
    title: 'Abel Ninan Bio - Notepad',
    taskbarTitle: 'Bio',
    width: 540, height: 440,
    icon: 'notepad',
    build: buildBioWindow,
  },
  certifications: {
    title: 'Certifications.txt - Notepad',
    taskbarTitle: 'Certifications',
    width: 460, height: 440,
    icon: 'notepad',
    build: buildCertificationsWindow,
  },
  controlpanel: {
    title: 'Control Panel',
    width: 500, height: 360,
    icon: 'controlPanel',
    build: buildControlPanelWindow,
  },
  documents: {
    title: 'Documents',
    width: 480, height: 330,
    icon: 'files',
    build: buildDocumentsWindow,
  },
  photos: {
    title: 'Photos',
    width: 420, height: 320,
    icon: 'files',
    build: buildPhotosWindow,
  },
  paint: {
    title: 'Untitled - Paint',
    width: 590, height: 500,
    icon: 'paint',
    build: buildPaintWindow,
  },
  run: {
    title: 'Run',
    width: 360, height: 185,
    icon: 'run',
    dialog: true,
    closeOnly: true,
    noResize: true,
    build: buildRunWindow,
    getPos: (dw, dh, w, h) => ({ x: 10, y: dh - h - 10 }),
  },
  minesweeper: {
    title: 'Minesweeper',
    width: 224, height: 330,
    icon: 'minesweeper',
    dialog: true,
    noResize: true,
    build: buildMinesweeperWindow,
  },
  defrag: {
    title: 'Defragmenting Drive C',
    taskbarTitle: 'Defrag',
    width: 660, height: 510,
    icon: 'defrag',
    noResize: true,
    build: buildDefragWindow,
  },
  winamp: {
    title: 'Winamp',
    width: 350, height: 150,
    icon: 'winamp',
    bare: true,
    noResize: true,
    build: buildWinampWindow,
    getPos: (dw, dh) => ({ x: Math.max(20, Math.round((dw - 350) / 2)), y: 28 }),
  },
  msdos: {
    title: 'MS-DOS Prompt',
    taskbarTitle: 'MS-DOS',
    width: 560, height: 400,
    icon: 'msdos',
    build: buildMsdosWindow,
  },
};

// One window per project, type 'project-<id>' (see js/apps/projects.js).
PORTFOLIO.projects.forEach(p => {
  const type = projectWindowType(p.id);
  ICONS[type] = p.icon;
  WINDOW_DEFS[type] = {
    title: p.title,
    width: 680, height: 560,
    icon: type,
    build: buildProjectWindow,
  };
});

// ════════════════════════════════
//  TAP ACTIONS + START MENU
// ════════════════════════════════
// data-action handlers used by the portfolio markup (registered once
// js/desktop.js, which defines registerTapAction, has loaded).
document.addEventListener('DOMContentLoaded', () => {
  registerTapAction('shutdown', () => showShutdown());
  registerTapAction('open-image', el => openImageInPaint(el.dataset.src, el.dataset.name));
  registerTapAction('project-nav', el => switchProjectWindow(el.dataset.from, el.dataset.to));
  registerTapAction('drive-not-ready', el => showDriveNotReady(el.dataset.drive));
  registerTapAction('cpl-unavailable', el => showMessageBox({
    id: 'cpl-info', title: 'Control Panel', owner: 'controlpanel',
    text: `${el.dataset.name} settings are not available in this version of Windows.`,
  }));
  registerTapAction('recycle-restore', el => restoreRecycledIcon(el.dataset.id));
});

// Leaf Start menu items close the menu once the opener in js/desktop.js has
// run (deferred, so the clicked item is still in the drill-down panel then).
document.addEventListener('click', e => {
  const t = e.target;
  if (!(t instanceof Element)) return;
  if (t.closest('#start-menu [data-open], #start-menu [data-action]')) setTimeout(closeStartMenu, 0);
});
