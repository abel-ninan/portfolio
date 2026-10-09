// ════════════════════════════════
//  STATE
// ════════════════════════════════
let windowZIndex = 1000;
let activeWindow = null;
const openWindows = {};

// ════════════════════════════════
//  PHONE MODE
// ════════════════════════════════
// Phones (portrait and landscape) get full-screen windows, bigger touch
// targets and no screensaver. body.is-phone mirrors isPhone() and is kept in
// sync on resize / orientation change (see VIEWPORT in windows.js).
const PHONE_QUERY = '(max-width: 768px), (pointer: coarse) and (max-height: 500px)';
const phoneMedia = window.matchMedia(PHONE_QUERY);

function isPhone() {
  return phoneMedia.matches;
}

function syncPhoneClass() {
  document.body.classList.toggle('is-phone', isPhone());
}

// --app-height: the real visible height in px, for browsers without dvh
// (older iOS Safari, where 100vh includes the area behind the toolbars).
function updateAppHeight() {
  const vv = window.visualViewport;
  if (vv && vv.scale > 1.01) return; // pinch-zoomed: keep the unzoomed height
  document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
}

syncPhoneClass();
updateAppHeight();

// Escape text before putting it into innerHTML.
function escapeHTML(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ════════════════════════════════
//  ICONS  (URL-encoded inline SVG)
// ════════════════════════════════
const ICONS = {
  files: `img/folder.png`,

  computer: `img/my-computer.png`,

  ie: `img/internet-explorer.png`,

  drive: `img/hard-drive.png`,

  floppy: `img/floppy.png`,

  cdrom: `img/cdrom.png`,

  controlPanel: `img/control-panel.png`,

  recycle: `img/recycle-bin.png`,

  notepad: `img/notepad2.png`,

  textFile: `img/notepad.png`,

  run: `img/run.ico`,

  welcome: `img/welcome.png`,

  shutdown: `img/shutdown.ico`,

  paint: `img/paint.png`,

  imageFile: `img/image-file.png`,

  minesweeper: `img/minesweeper.png`,

  briefcase: `img/briefcase.png`,

  defrag: `img/defrag.png`,

  winamp: `img/winamp.svg`,

  msdos: `img/msdos-icon.png`,
};

