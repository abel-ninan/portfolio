
// ════════════════════════════════
//  MS-DOS PROMPT
// ════════════════════════════════
// Typing goes into a real (invisible) <input> so phones show their keyboard;
// its value is mirrored into the prompt line with the blinking cursor.
// Tapping or clicking the black screen focuses it.
let dosScroll = '';
let dosBuffer = '';
let dosCaret = 0;
let dosCwd = 'C:\\WINDOWS';
let dosHistory = [];
let dosHistIdx = 0;

const DOS_FS = {
  'C:\\': [
    ['ABEL', '<DIR>'],
    ['WINDOWS', '<DIR>'], ['PROGRA~1', '<DIR>'], ['MSDOS', '<DIR>'], ['MYDOCU~1', '<DIR>'],
    ['COMMAND', 'COM', '93,890'], ['AUTOEXEC', 'BAT', '416'],
    ['CONFIG', 'SYS', '278'], ['IO', 'SYS', '222,390'], ['MSDOS', 'SYS', '1,676'],
  ],
  'C:\\WINDOWS': [
    ['SYSTEM', '<DIR>'], ['COMMAND', '<DIR>'], ['TEMP', '<DIR>'], ['FONTS', '<DIR>'],
    ['WIN', 'INI', '12,494'], ['SYSTEM', 'INI', '3,116'], ['NOTEPAD', 'EXE', '34,304'],
    ['CALC', 'EXE', '45,568'], ['WINMINE', 'EXE', '27,792'], ['CLOUDS', 'BMP', '307,260'],
    ['WIN', 'COM', '22,679'],
  ],
  'C:\\ABEL': [],
};

// Text that TYPE prints, and the window START / OPEN opens, by full path.
// Filled from PORTFOLIO (js/content.js) by dosBuildAbelFs().
const DOS_FILES = {};
const DOS_OPENS = {};

// Windows programs that can be started by name, like the real prompt.
const DOS_PROGRAMS = {
  NOTEPAD: 'notepad', WINMINE: 'minesweeper', MSPAINT: 'paint', PBRUSH: 'paint',
  DEFRAG: 'defrag', WINAMP: 'winamp', IEXPLORE: 'ie', EXPLORER: 'computer',
};

const DOS_TB_BTN = {
  mark:  `<svg viewBox="0 0 16 16"><rect x="2" y="3" width="12" height="10" fill="none" stroke="#000" stroke-dasharray="2,1"/></svg>`,
  copy:  `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="8" height="10" fill="#fff" stroke="#000"/><rect x="5" y="5" width="8" height="9" fill="#fff" stroke="#000"/></svg>`,
  paste: `<svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="11" fill="#fff" stroke="#000"/><rect x="5" y="1" width="6" height="3" fill="#c0c0c0" stroke="#000"/></svg>`,
  full:  `<svg viewBox="0 0 16 16"><path d="M2,5 V2 H5 M11,2 H14 V5 M14,11 V14 H11 M5,14 H2 V11" fill="none" stroke="#000" stroke-width="1.5"/></svg>`,
  props: `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#000"/><path d="M4,5 H12 M4,8 H12 M4,11 H9" stroke="#000"/></svg>`,
  font:  `<svg viewBox="0 0 16 16"><text x="3" y="13" font-family="serif" font-size="14" font-weight="bold">A</text></svg>`,
};

function buildMsdosWindow(container, type) {
  dosBuildAbelFs();
  dosScroll = 'Microsoft(R) Windows 95\n   (C)Copyright Microsoft Corp 1981-1995.\n\n' +
              'Type HELP for a list of commands.\n\n';
  dosBuffer = '';
  dosCaret = 0;
  dosCwd = 'C:\\WINDOWS';
  dosHistory = [];
  dosHistIdx = 0;

  container.innerHTML = `
    <div class="dos-toolbar">
      <div class="dos-combo">
        <span class="dos-combo-txt">Auto</span>
        <button class="dos-combo-btn" tabindex="-1" aria-label="Font size list"><svg width="7" height="4" viewBox="0 0 7 4"><polygon points="0,0 7,0 3.5,4" fill="#000"/></svg></button>
      </div>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Mark" tabindex="-1">${DOS_TB_BTN.mark}</button>
      <button class="dos-tb-btn" title="Copy" tabindex="-1">${DOS_TB_BTN.copy}</button>
      <button class="dos-tb-btn" title="Paste" tabindex="-1">${DOS_TB_BTN.paste}</button>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Full Screen" tabindex="-1">${DOS_TB_BTN.full}</button>
      <button class="dos-tb-btn" title="Properties" tabindex="-1">${DOS_TB_BTN.props}</button>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Font" tabindex="-1">${DOS_TB_BTN.font}</button>
    </div>
    <div class="notepad-edit-row dos-edit-row">
      <form class="dos-form" id="dos-form" autocomplete="off">
        <input class="dos-input" id="dos-input" type="text" maxlength="127"
               autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
               enterkeyhint="go" aria-label="MS-DOS command">
      </form>
      <div class="dos-screen" id="dos-screen"><span id="dos-out"></span><span id="dos-curline"></span></div>
      <div class="notepad-vscroll">
        <button class="notepad-scroll-btn notepad-scroll-up" id="dos-vup" tabindex="-1"></button>
        <div class="notepad-vtrack" id="dos-vtrack"><div class="notepad-vthumb" id="dos-vthumb"></div></div>
        <button class="notepad-scroll-btn notepad-scroll-down" id="dos-vdown" tabindex="-1"></button>
        <div style="width:22px;height:16px;flex-shrink:0;background:var(--c-gray-200);"></div>
      </div>
    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;background:var(--c-material);';

  const screen = container.querySelector('#dos-screen');
  const input = container.querySelector('#dos-input');
  const form = container.querySelector('#dos-form');

  input.addEventListener('input', dosSyncFromInput);
  input.addEventListener('keydown', dosKey);
  input.addEventListener('focus', () => { screen.classList.add('dos-focused'); dosKeepPromptVisible(); });
  input.addEventListener('blur', () => { screen.classList.remove('dos-focused'); dosKeepPromptVisible(); });
  // Fallback for phone keyboards whose Enter key never reaches keydown.
  form.addEventListener('submit', e => { e.preventDefault(); dosEnter(); });

  // Tap / click anywhere on the screen to type. Focus has to happen inside
  // the tap itself, or iOS will not open the keyboard.
  screen.addEventListener('click', () => {
    if (document.activeElement === input && isPhone()) input.blur(); // re-open a dismissed keyboard
    dosFocusInput();
  });

  // Custom Win95 scrollbar (same widget as Notepad), driving the console scroll.
  // Phones hide it and scroll the screen natively (css/mobile.css).
  const vup = container.querySelector('#dos-vup');
  const vdown = container.querySelector('#dos-vdown');
  const vthumb = container.querySelector('#dos-vthumb');
  const vtrack = container.querySelector('#dos-vtrack');
  vup.addEventListener('click', () => { screen.scrollTop -= 32; dosUpdateVScroll(); });
  vdown.addEventListener('click', () => { screen.scrollTop += 32; dosUpdateVScroll(); });
  screen.addEventListener('wheel', e => {
    if (isPhone()) return;
    e.preventDefault(); screen.scrollTop += e.deltaY; dosUpdateVScroll();
  }, { passive: false });
  screen.addEventListener('scroll', dosUpdateVScroll);

  // Thumb drag with pointer capture: no document listeners left behind.
  let vDrag = null;
  vthumb.addEventListener('pointerdown', e => {
    vDrag = { id: e.pointerId, y: e.clientY, top: screen.scrollTop };
    try { vthumb.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault(); e.stopPropagation();
  });
  vthumb.addEventListener('pointermove', e => {
    if (!vDrag || e.pointerId !== vDrag.id) return;
    const scrollable = screen.scrollHeight - screen.clientHeight;
    const travel = Math.max(1, vtrack.clientHeight - vthumb.offsetHeight);
    screen.scrollTop = vDrag.top + (e.clientY - vDrag.y) * (scrollable / travel);
    dosUpdateVScroll();
  });
  const endDrag = () => { vDrag = null; };
  vthumb.addEventListener('pointerup', endDrag);
  vthumb.addEventListener('pointercancel', endDrag);

  dosRender();
  // Desktop: ready to type. Phones wait for a tap, so the keyboard does not
  // cover the window the moment it opens.
  setTimeout(() => { if (!isPhone()) dosFocusInput(); dosUpdateVScroll(); }, 50);
}

function dosFocusInput() {
  const input = document.getElementById('dos-input');
  if (!input) return;
  try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  const end = input.value.length;
  try { input.setSelectionRange(end, end); } catch (e) {}
  dosSyncFromInput();
}

function dosUpdateVScroll() {
  const sc = document.getElementById('dos-screen');
  const track = document.getElementById('dos-vtrack');
  const thumb = document.getElementById('dos-vthumb');
  const up = document.getElementById('dos-vup');
  const down = document.getElementById('dos-vdown');
  if (!sc || !track || !thumb) return;
  const scrollable = sc.scrollHeight - sc.clientHeight;
  const disabled = scrollable <= 0;
  up.classList.toggle('scroll-disabled', disabled);
  down.classList.toggle('scroll-disabled', disabled);
  track.classList.toggle('scroll-disabled', disabled);
  if (disabled) { thumb.style.display = 'none'; return; }
  thumb.style.display = '';
  const trackH = track.clientHeight;
  const thumbH = Math.max(22, (sc.clientHeight / sc.scrollHeight) * trackH);
  const thumbT = (sc.scrollTop / scrollable) * (trackH - thumbH);
  thumb.style.height = thumbH + 'px';
  thumb.style.top = thumbT + 'px';
}

function dosEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dosScrollToEnd() {
  const screen = document.getElementById('dos-screen');
  if (screen) screen.scrollTop = screen.scrollHeight;
  dosUpdateVScroll();
}

// Prompt line: the block cursor sits at the input's caret.
function dosRenderLine() {
  const line = document.getElementById('dos-curline');
  if (!line) return;
  const caret = Math.max(0, Math.min(dosCaret, dosBuffer.length));
  const before = dosEscape(dosCwd + '>' + dosBuffer.slice(0, caret));
  if (caret >= dosBuffer.length) {
    line.innerHTML = before + '<span class="dos-cursor"></span>';
  } else {
    line.innerHTML = before + '<span class="dos-cursor dos-cursor-char">' + dosEscape(dosBuffer[caret]) +
                     '</span>' + dosEscape(dosBuffer.slice(caret + 1));
  }
}

function dosRender() {
  const out = document.getElementById('dos-out');
  if (!out) return;
  out.textContent = dosScroll;
  dosRenderLine();
  dosScrollToEnd();
}

function dosSyncFromInput() {
  const input = document.getElementById('dos-input');
  if (!input) return;
  dosBuffer = input.value;
  dosCaret = input.selectionStart == null ? dosBuffer.length : input.selectionStart;
  dosRenderLine();
  dosScrollToEnd();
}

function dosSetInput(value) {
  const input = document.getElementById('dos-input');
  dosBuffer = value;
  dosCaret = value.length;
  if (input) {
    input.value = value;
    try { input.setSelectionRange(value.length, value.length); } catch (e) {}
  }
}

function dosPrint(s) { dosScroll += s; }

function dosKey(e) {
  if (e.isComposing) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    dosEnter();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (dosHistIdx > 0) { dosHistIdx--; dosSetInput(dosHistory[dosHistIdx] || ''); dosRenderLine(); }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (dosHistIdx < dosHistory.length) { dosHistIdx++; dosSetInput(dosHistory[dosHistIdx] || ''); dosRenderLine(); }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    dosSetInput('');
    dosRenderLine();
  } else {
    // Caret moves (arrows, Home, End) land after the default action.
    setTimeout(dosSyncFromInput, 0);
  }
}

function dosEnter() {
  const input = document.getElementById('dos-input');
  if (input) dosBuffer = input.value;
  dosScroll += dosCwd + '>' + dosBuffer + '\n';
  const cmd = dosBuffer;
  dosSetInput('');
  dosExec(cmd);
  dosRender();
}

// ════════════════════════════════
//  PHONE KEYBOARD
// ════════════════════════════════
// The on-screen keyboard covers the bottom of the window without resizing it
// (iOS, newer Android). While typing, pad the screen by the covered height so
// the prompt line, scrolled to the bottom, sits just above the keyboard.
let dosVvRaf = 0;
function dosKeepPromptVisible() {
  if (dosVvRaf) return;
  dosVvRaf = requestAnimationFrame(() => {
    dosVvRaf = 0;
    const screen = document.getElementById('dos-screen');
    const input = document.getElementById('dos-input');
    if (!screen || !input) return;
    const vv = window.visualViewport;
    let covered = 0;
    if (vv && document.activeElement === input && isPhone()) {
      const r = screen.getBoundingClientRect();
      covered = Math.max(0, Math.round(r.bottom - (vv.offsetTop + vv.height)));
      covered = Math.min(covered, Math.max(0, screen.clientHeight - 40));
    }
    screen.style.paddingBottom = covered ? (covered + 6) + 'px' : '';
    dosScrollToEnd();
  });
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', dosKeepPromptVisible);
  window.visualViewport.addEventListener('scroll', dosKeepPromptVisible);
}
window.addEventListener('resize', dosKeepPromptVisible);

// ════════════════════════════════
//  C:\ABEL  (built from PORTFOLIO in js/content.js)
// ════════════════════════════════
function dosPortfolio() {
  return typeof PORTFOLIO !== 'undefined' && PORTFOLIO ? PORTFOLIO : null;
}

function dosPlainText(html) {
  const s = String(html == null ? '' : html);
  try {
    return new DOMParser().parseFromString(s, 'text/html').body.textContent || '';
  } catch (e) {
    return s.replace(/<[^>]*>/g, '');
  }
}

function dosBytes(text) {
  return String(text.length).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 8.3 file name from a project id: HAIRMAXX, HISTOR~1, ...
function dosShortName(id, taken) {
  const base = String(id).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (base.length <= 8 && !taken.has(base)) { taken.add(base); return base; }
  for (let n = 1; n < 10; n++) {
    const s = base.slice(0, 6) + '~' + n;
    if (!taken.has(s)) { taken.add(s); return s; }
  }
  return base.slice(0, 8);
}

let dosAbelBuilt = false;
function dosBuildAbelFs() {
  if (dosAbelBuilt) return;
  const P = dosPortfolio();
  if (!P) return; // try again next time the window opens
  dosAbelBuilt = true;

  const bio = (P.bio || []).map(dosPlainText).join('\n\n') + '\n';
  const resume = dosResumeText(P);
  DOS_FILES['C:\\ABEL\\BIO.TXT'] = bio;
  DOS_FILES['C:\\ABEL\\RESUME.DOC'] = resume;
  DOS_OPENS['C:\\ABEL\\BIO.TXT'] = 'bio';
  DOS_OPENS['C:\\ABEL\\RESUME.DOC'] = 'resume';

  const taken = new Set();
  const projects = (P.projects || []).map((p, i) => {
    const name = dosShortName(p.id, taken);
    const path = 'C:\\ABEL\\PROJECTS\\' + name + '.TXT';
    let txt = `${p.title}\n${p.subtitle || ''}\n`;
    if (p.period) txt += `${p.period}${p.role ? '  |  ' + p.role : ''}\n`;
    txt += `\n${dosPlainText(p.summary)}\n\nType OPEN ${i + 1} to see the full project.\n`;
    DOS_FILES[path] = txt;
    DOS_OPENS[path] = 'project-' + p.id;
    return [name, 'TXT', dosBytes(txt)];
  });

  DOS_FS['C:\\ABEL'] = [
    ['PROJECTS', '<DIR>'],
    ['RESUME', 'DOC', dosBytes(resume)],
    ['BIO', 'TXT', dosBytes(bio)],
  ];
  DOS_FS['C:\\ABEL\\PROJECTS'] = projects;
}

function dosResumeText(P) {
  let t = `${P.name || ''}\n${P.title || ''}${P.email ? '  |  ' + P.email : ''}\n\nEXPERIENCE\n`;
  (P.experience || []).forEach(x => {
    t += `  ${x.role}, ${x.company}\n    ${x.start} - ${x.end || (x.current ? 'Present' : '')}\n`;
  });
  if ((P.education || []).length) {
    t += '\nEDUCATION\n';
    P.education.forEach(x => {
      t += `  ${x.degree || ''}${x.minor ? ', minor in ' + x.minor : ''}\n    ${x.school || ''}${x.date ? ', ' + x.date : ''}\n`;
    });
  }
  return t + '\nType RESUME to open the full resume.\n';
}

// ════════════════════════════════
//  PATHS
// ════════════════════════════════
function dosDirsIn(path) {
  return (DOS_FS[path] || []).filter(r => r[1] === '<DIR>').map(r => r[0]);
}

function dosJoin(parts) {
  return parts.length ? 'C:\\' + parts.join('\\') : 'C:\\';
}

// Absolute directory for a DOS path (relative to the current one), or null.
function dosResolveDir(arg) {
  let a = String(arg || '').trim().toUpperCase().replace(/\//g, '\\');
  if (!a) return dosCwd;
  if (/^[A-Z]:/.test(a)) {
    if (a[0] !== 'C') return null;
    a = a.slice(2);
  }
  let parts = a.startsWith('\\') ? [] : dosCwd.slice(3).split('\\').filter(Boolean);
  const segs = a.split('\\').filter(Boolean);
  for (const s of segs) {
    if (s === '.') continue;
    if (s === '..') { if (!parts.length) return null; parts.pop(); continue; }
    if (!dosDirsIn(dosJoin(parts)).includes(s)) return null;
    parts.push(s);
  }
  return dosJoin(parts);
}

// { dir, row, path } for a file path, or null.
function dosResolveFile(arg) {
  const a = String(arg || '').trim().toUpperCase().replace(/\//g, '\\');
  const cut = a.lastIndexOf('\\');
  const dirPart = cut < 0 ? (/^[A-Z]:/.test(a) ? a.slice(0, 2) : '') : a.slice(0, cut + 1);
  const name = cut < 0 ? a.replace(/^[A-Z]:/, '') : a.slice(cut + 1);
  const dir = dirPart ? dosResolveDir(dirPart) : dosCwd;
  if (!dir || !name) return null;
  const row = (DOS_FS[dir] || []).find(r => r[1] !== '<DIR>' && (r[0] + '.' + r[1]) === name);
  if (!row) return null;
  return { dir, row, path: (dir.endsWith('\\') ? dir : dir + '\\') + name };
}

// ════════════════════════════════
//  COMMANDS
// ════════════════════════════════
function dosExec(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  dosHistory.push(cmd);
  dosHistIdx = dosHistory.length;

  // "CD.." and "CD\" work without a space, as in real DOS.
  const glued = cmd.match(/^(cd|chdir)([.\\].*)$/i);
  const sp = cmd.search(/\s/);
  let name = (glued ? glued[1] : (sp < 0 ? cmd : cmd.slice(0, sp))).toUpperCase();
  const args = glued ? glued[2] : (sp < 0 ? '' : cmd.slice(sp + 1).trim());
  name = name.replace(/\.(EXE|COM|BAT)$/, '');

  switch (name) {
    case 'CLS':
      dosScroll = '';
      break;
    case 'VER':
      dosPrint('\nWindows 95. [Version 4.00.950]\n\n');
      break;
    case 'DIR':
      dosDir(args);
      break;
    case 'CD':
    case 'CHDIR':
      dosCd(args);
      break;
    case 'C:':
      break;
    case 'ECHO':
      if (!args) dosPrint('ECHO is on\n\n');
      else if (args === '.') dosPrint('\n');
      else dosPrint(args + '\n\n');
      break;
    case 'DATE': {
      const d = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const p = n => String(n).padStart(2, '0');
      dosPrint(`Current date is ${days[d.getDay()]} ${p(d.getMonth() + 1)}-${p(d.getDate())}-${d.getFullYear()}\n\n`);
      break;
    }
    case 'TIME': {
      const d = new Date();
      let h = d.getHours(); const ap = h >= 12 ? 'p' : 'a'; h = h % 12 || 12;
      const p = n => String(n).padStart(2, '0');
      dosPrint(`Current time is ${h}:${p(d.getMinutes())}:${p(d.getSeconds())}.00${ap}\n\n`);
      break;
    }
    case 'VOL':
      dosPrint('\n Volume in drive C is MS-DOS_6\n Volume Serial Number is 1A2B-3C4D\n\n');
      break;
    case 'MEM':
      dosPrint('\nMemory Type        Total  =   Used  +   Free\n' +
               '----------------  -------   -------   -------\n' +
               'Conventional         640K       82K      558K\n' +
               'Upper                  0K        0K        0K\n' +
               'Extended (XMS)    65,536K   16,384K   49,152K\n' +
               '----------------  -------   -------   -------\n' +
               'Total memory      66,176K   16,466K   49,710K\n\n' +
               'Largest executable program size       558K (571,392 bytes)\n\n');
      break;
    case 'HELP':
      dosPrint('\nAbel\'s commands:\n' +
               '  WHOAMI     Who is Abel?\n' +
               '  PROJECTS   Lists Abel\'s projects.\n' +
               '  OPEN n     Opens project number n.\n' +
               '  RESUME     Opens Abel\'s resume.\n' +
               '  CONTACT    Shows how to reach Abel.\n' +
               '  LINKEDIN   Opens Abel\'s LinkedIn profile.\n' +
               '  GITHUB     Opens Abel\'s GitHub profile.\n' +
               '  TYPE       Displays a text file, e.g.\n' +
               '             TYPE C:\\ABEL\\BIO.TXT\n' +
               '\nMS-DOS commands:\n' +
               '  CD         Shows or changes the directory.\n' +
               '  CLS        Clears the screen.\n' +
               '  DATE       Displays the date.\n' +
               '  DIR        Lists files and subdirectories.\n' +
               '  ECHO       Displays messages.\n' +
               '  EXIT       Quits the MS-DOS Prompt.\n' +
               '  HELP       Provides Help information.\n' +
               '  MEM        Displays used and free memory.\n' +
               '  START      Opens a file or program.\n' +
               '  TIME       Displays the time.\n' +
               '  VER        Displays the Windows version.\n' +
               '  VOL        Displays the disk volume label.\n\n');
      break;
    case 'WHOAMI':
      dosWhoami();
      break;
    case 'PROJECTS':
      if (args) dosOpenProject(args);
      else dosProjects();
      break;
    case 'OPEN':
    case 'START':
      dosStart(args);
      break;
    case 'TYPE':
      dosType(args);
      break;
    case 'RESUME':
      dosOpen('resume', 'Abel\'s resume');
      break;
    case 'CONTACT': {
      const P = dosPortfolio();
      if (P && P.email) dosPrint(`\nE-mail: ${P.email}\n`);
      dosOpen('contact', 'Contact');
      break;
    }
    case 'LINKEDIN':
    case 'GITHUB': {
      const P = dosPortfolio();
      const url = P && P.links ? P.links[name.toLowerCase()] : '';
      if (url) {
        dosPrint(`Opening ${url.replace(/^https?:\/\/(www\.)?/, '')}...\n\n`);
        dosOpenUrl(url);
      } else {
        dosPrint('Bad command or file name\n\n');
      }
      break;
    }
    case 'EXIT':
      closeWindow('msdos');
      return;
    case 'WIN':
      dosPrint('\nWindows is already running.\n\n');
      break;
    default:
      if (DOS_PROGRAMS[name] && WINDOW_DEFS[DOS_PROGRAMS[name]]) {
        dosOpen(DOS_PROGRAMS[name], null);
      } else {
        dosPrint('Bad command or file name\n\n');
      }
  }
}

function dosWhoami() {
  const P = dosPortfolio();
  const lines = P && P.dos && P.dos.whoami;
  if (!lines || !lines.length) { dosPrint('Bad command or file name\n\n'); return; }
  dosPrint('\n' + lines.join('\n') + '\n\n');
}

function dosProjects() {
  const P = dosPortfolio();
  const list = (P && P.projects) || [];
  if (!list.length) { dosPrint('\nNo projects found.\n\n'); return; }
  let s = '\n Abel\'s projects\n\n';
  list.forEach((p, i) => { s += `  ${String(i + 1).padStart(String(list.length).length, ' ')}. ${p.title}\n`; });
  dosPrint(s + '\nType OPEN <number> to open a project.\n\n');
}

// Project by number (1-based), id, 8.3 name or title.
function dosFindProject(arg) {
  const P = dosPortfolio();
  const list = (P && P.projects) || [];
  const a = String(arg || '').trim();
  if (/^\d+$/.test(a)) return list[parseInt(a, 10) - 1] || null;
  const key = a.toUpperCase().replace(/\.TXT$/, '').replace(/[^A-Z0-9~]/g, '');
  if (!key) return null;
  const taken = new Set();
  return list.find(p => {
    const short = dosShortName(p.id, taken);
    return short === key || String(p.id).toUpperCase().replace(/[^A-Z0-9]/g, '') === key ||
           String(p.title).toUpperCase().replace(/[^A-Z0-9]/g, '') === key;
  }) || null;
}

function dosOpenProject(arg) {
  const p = dosFindProject(arg);
  if (!p) { dosPrint('Invalid project. Type PROJECTS to see the list.\n\n'); return; }
  dosOpen('project-' + p.id, p.title);
}

function dosStart(arg) {
  if (!arg) { dosPrint('Required parameter missing\n\n'); return; }
  const file = dosResolveFile(arg);
  if (file && DOS_OPENS[file.path]) { dosOpen(DOS_OPENS[file.path], file.row[0] + '.' + file.row[1]); return; }
  const prog = arg.trim().toUpperCase().replace(/\.(EXE|COM)$/, '');
  if (DOS_PROGRAMS[prog] && WINDOW_DEFS[DOS_PROGRAMS[prog]]) { dosOpen(DOS_PROGRAMS[prog], null); return; }
  if (dosFindProject(arg)) { dosOpenProject(arg); return; }
  dosPrint(file ? 'Cannot open ' + file.row[0] + '.' + file.row[1] + '\n\n' : 'File not found\n\n');
}

function dosType(arg) {
  if (!arg) { dosPrint('Required parameter missing\n\n'); return; }
  const file = dosResolveFile(arg);
  if (!file) { dosPrint('File not found - ' + arg.trim().toUpperCase() + '\n\n'); return; }
  const text = DOS_FILES[file.path];
  dosPrint(text ? '\n' + text + '\n' : '\n');
}

// Open a window from a command. The phone keyboard is put away so the new
// window is not covered.
function dosOpen(type, label) {
  if (typeof openWindow === 'function') openWindow(type);
  const def = WINDOW_DEFS[type];
  const name = label || (def && def.title) || type;
  if (openWindows[type]) {
    dosPrint(`Opening ${name}...\n\n`);
    const input = document.getElementById('dos-input');
    if (input && document.activeElement === input) input.blur();
  } else {
    dosPrint(`Cannot open ${name}.\n\n`);
  }
}

function dosOpenUrl(url) {
  if (typeof openExternal === 'function') openExternal(url);
  else { const w = window.open(url, '_blank', 'noopener'); if (w) w.opener = null; }
  const input = document.getElementById('dos-input');
  if (input && isPhone()) input.blur();
}

function dosDir(arg) {
  const target = String(arg || '').split(/\s+/).filter(s => s && s[0] !== '/').join(' ');
  let path = dosCwd, entries;
  if (target) {
    const dir = dosResolveDir(target);
    if (dir) {
      path = dir;
    } else {
      const file = dosResolveFile(target);
      if (!file) { dosPrint('\n Volume in drive C is MS-DOS_6\n Volume Serial Number is 1A2B-3C4D\nFile not found\n\n'); return; }
      path = file.dir;
      entries = [file.row];
    }
  }
  if (!entries) entries = DOS_FS[path] || [];

  const p = n => String(n).padStart(2, '0');
  const d = new Date();
  const stamp = `${p(d.getMonth() + 1)}-${p(d.getDate())}-${String(d.getFullYear()).slice(2)}`;
  let h = d.getHours(); const ap = h >= 12 ? 'p' : 'a'; h = h % 12 || 12;
  const tm = `${String(h).padStart(2, ' ')}:${p(d.getMinutes())}${ap}`;

  let lines = `\n Volume in drive C is MS-DOS_6\n Volume Serial Number is 1A2B-3C4D\n Directory of ${path}\n\n`;
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

  // Dates line up in one column for directories and files, as in real DOS.
  const dirLine = n => `${pad(n, 8)}    ${'<DIR>'.padEnd(10, ' ')}  ${stamp}  ${tm}\n`;
  let files = 0, dirs = 0, bytes = 0;
  if (path !== 'C:\\' && entries === DOS_FS[path]) {
    lines += dirLine('.');
    lines += dirLine('..');
  }
  entries.forEach(r => {
    if (r[1] === '<DIR>') {
      dirs++;
      lines += dirLine(r[0]);
    } else {
      files++;
      bytes += parseInt(r[2].replace(/,/g, ''), 10) || 0;
      lines += `${pad(r[0], 8)} ${pad(r[1], 3)}${r[2].padStart(10, ' ')}  ${stamp}  ${tm}\n`;
    }
  });
  const grp = n => n.toLocaleString('en-US');
  lines += `${String(files).padStart(9, ' ')} file(s)${grp(bytes).padStart(12, ' ')} bytes\n`;
  lines += `${String(dirs).padStart(9, ' ')} dir(s)   2,147,483,648 bytes free\n\n`;
  dosPrint(lines);
}

function dosCd(arg) {
  if (!arg) { dosPrint(dosCwd + '\n\n'); return; }
  const dir = dosResolveDir(arg);
  if (dir) {
    dosCwd = dir;
    dosPrint('\n');
  } else {
    dosPrint('Invalid directory\n\n');
  }
}
