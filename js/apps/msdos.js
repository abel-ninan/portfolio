
// ════════════════════════════════
//  MS-DOS PROMPT
// ════════════════════════════════
let dosScroll = '';
let dosBuffer = '';
let dosCwd = 'C:\\WINDOWS';
let dosHistory = [];
let dosHistIdx = 0;

const DOS_FS = {
  'C:\\': [
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
  dosScroll = 'Microsoft(R) Windows 95\n   (C)Copyright Microsoft Corp 1981-1996.\n\n';
  dosBuffer = '';
  dosCwd = 'C:\\WINDOWS';
  dosHistory = [];
  dosHistIdx = 0;

  container.innerHTML = `
    <div class="dos-toolbar">
      <div class="dos-combo">
        <span class="dos-combo-txt">Auto</span>
        <button class="dos-combo-btn"><svg width="7" height="4" viewBox="0 0 7 4"><polygon points="0,0 7,0 3.5,4" fill="#000"/></svg></button>
      </div>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Mark">${DOS_TB_BTN.mark}</button>
      <button class="dos-tb-btn" title="Copy">${DOS_TB_BTN.copy}</button>
      <button class="dos-tb-btn" title="Paste">${DOS_TB_BTN.paste}</button>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Full Screen">${DOS_TB_BTN.full}</button>
      <button class="dos-tb-btn" title="Properties">${DOS_TB_BTN.props}</button>
      <div class="dos-tb-sep"></div>
      <button class="dos-tb-btn" title="Font">${DOS_TB_BTN.font}</button>
    </div>
    <div class="notepad-edit-row">
      <div class="dos-screen" id="dos-screen" tabindex="0"><span id="dos-out"></span><span id="dos-curline"></span></div>
      <div class="notepad-vscroll">
        <button class="notepad-scroll-btn notepad-scroll-up" id="dos-vup"></button>
        <div class="notepad-vtrack" id="dos-vtrack"><div class="notepad-vthumb" id="dos-vthumb"></div></div>
        <button class="notepad-scroll-btn notepad-scroll-down" id="dos-vdown"></button>
        <div style="width:22px;height:16px;flex-shrink:0;background:var(--c-gray-200);"></div>
      </div>
    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;background:var(--c-material);';

  const screen = container.querySelector('#dos-screen');
  screen.addEventListener('keydown', dosKey);
  screen.addEventListener('mousedown', () => setTimeout(() => screen.focus(), 0));

  // Custom Win95 scrollbar (same widget as Notepad), driving the console scroll.
  const vup = container.querySelector('#dos-vup');
  const vdown = container.querySelector('#dos-vdown');
  const vthumb = container.querySelector('#dos-vthumb');
  const vtrack = container.querySelector('#dos-vtrack');
  vup.addEventListener('click', () => { screen.scrollTop -= 32; dosUpdateVScroll(); });
  vdown.addEventListener('click', () => { screen.scrollTop += 32; dosUpdateVScroll(); });
  screen.addEventListener('wheel', e => { e.preventDefault(); screen.scrollTop += e.deltaY; dosUpdateVScroll(); }, { passive: false });

  let vDrag = false, vDragY = 0, vScrollT = 0;
  vthumb.addEventListener('mousedown', e => { vDrag = true; vDragY = e.clientY; vScrollT = screen.scrollTop; e.preventDefault(); e.stopPropagation(); });
  document.addEventListener('mousemove', e => {
    if (!vDrag) return;
    const scrollable = screen.scrollHeight - screen.clientHeight;
    screen.scrollTop = vScrollT + (e.clientY - vDragY) * (scrollable / (vtrack.clientHeight - vthumb.offsetHeight));
    dosUpdateVScroll();
  });
  document.addEventListener('mouseup', () => { vDrag = false; });

  dosRender();
  setTimeout(() => { screen.focus(); dosUpdateVScroll(); }, 50);
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

function dosRender() {
  const out = document.getElementById('dos-out');
  const line = document.getElementById('dos-curline');
  const screen = document.getElementById('dos-screen');
  if (!out || !line) return;
  out.textContent = dosScroll;
  line.innerHTML = dosEscape(dosCwd + '>' + dosBuffer) + '<span class="dos-cursor"></span>';
  if (screen) screen.scrollTop = screen.scrollHeight;
  dosUpdateVScroll();
}

function dosPrint(s) { dosScroll += s; }

function dosKey(e) {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === 'Enter') {
    dosScroll += dosCwd + '>' + dosBuffer + '\n';
    const cmd = dosBuffer;
    dosBuffer = '';
    dosExec(cmd);
    dosRender();
  } else if (e.key === 'Backspace') {
    dosBuffer = dosBuffer.slice(0, -1);
    dosRender();
  } else if (e.key === 'ArrowUp') {
    if (dosHistIdx > 0) { dosHistIdx--; dosBuffer = dosHistory[dosHistIdx] || ''; dosRender(); }
  } else if (e.key === 'ArrowDown') {
    if (dosHistIdx < dosHistory.length) { dosHistIdx++; dosBuffer = dosHistory[dosHistIdx] || ''; dosRender(); }
  } else if (e.key.length === 1) {
    dosBuffer += e.key;
    dosRender();
  } else {
    return;
  }
  e.preventDefault();
}

function dosDirsIn(path) {
  return (DOS_FS[path] || []).filter(r => r[1] === '<DIR>').map(r => r[0]);
}

function dosExec(raw) {
  const cmd = raw.trim();
  if (!cmd) return;
  dosHistory.push(cmd);
  dosHistIdx = dosHistory.length;

  const sp = cmd.search(/\s/);
  const name = (sp < 0 ? cmd : cmd.slice(0, sp)).toUpperCase();
  const args = sp < 0 ? '' : cmd.slice(sp + 1).trim();

  switch (name) {
    case 'CLS':
      dosScroll = '';
      break;
    case 'VER':
      dosPrint('\nWindows 95. [Version 4.00.950]\n\n');
      break;
    case 'DIR':
      dosDir();
      break;
    case 'CD':
    case 'CHDIR':
      dosCd(args);
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
      dosPrint('\nAvailable commands:\n' +
               '  CD       Displays or changes the current directory.\n' +
               '  CLS      Clears the screen.\n' +
               '  DATE     Displays the date.\n' +
               '  DIR      Displays a list of files and subdirectories.\n' +
               '  ECHO     Displays messages.\n' +
               '  EXIT     Quits the MS-DOS Prompt.\n' +
               '  HELP     Provides Help information.\n' +
               '  MEM      Displays the amount of used and free memory.\n' +
               '  TIME     Displays the time.\n' +
               '  VER      Displays the Windows version.\n' +
               '  VOL      Displays the disk volume label.\n\n');
      break;
    case 'EXIT':
      closeWindow('msdos');
      return;
    case 'WIN':
      dosPrint('\nWindows is already running.\n\n');
      break;
    default:
      dosPrint('Bad command or file name\n\n');
  }
}

function dosDir() {
  const entries = DOS_FS[dosCwd] || [];
  const p = n => String(n).padStart(2, '0');
  const d = new Date();
  const stamp = `${p(d.getMonth() + 1)}-${p(d.getDate())}-${String(d.getFullYear()).slice(2)}`;
  let h = d.getHours(); const ap = h >= 12 ? 'p' : 'a'; h = h % 12 || 12;
  const tm = `${String(h).padStart(2, ' ')}:${p(d.getMinutes())}${ap}`;

  let lines = `\n Volume in drive C is MS-DOS_6\n Volume Serial Number is 1A2B-3C4D\n Directory of ${dosCwd}\n\n`;
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

  if (dosCwd !== 'C:\\') {
    lines += `.            <DIR>        ${stamp}  ${tm}\n`;
    lines += `..           <DIR>        ${stamp}  ${tm}\n`;
  }
  let files = 0, dirs = 0, bytes = 0;
  entries.forEach(r => {
    if (r[1] === '<DIR>') {
      dirs++;
      lines += `${pad(r[0], 8)}     <DIR>        ${stamp}  ${tm}\n`;
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
  const a = arg.toUpperCase().replace(/\//g, '\\');
  if (a === '\\') { dosCwd = 'C:\\'; dosPrint('\n'); return; }
  if (a === '..') {
    if (dosCwd !== 'C:\\') dosCwd = 'C:\\';
    dosPrint('\n');
    return;
  }
  if (a === '.') { dosPrint('\n'); return; }
  const dirs = dosDirsIn(dosCwd).map(s => s.toUpperCase());
  if (dirs.includes(a)) {
    dosCwd = (dosCwd === 'C:\\' ? 'C:\\' : dosCwd + '\\') + a;
    // only C:\WINDOWS is a known listed dir beyond root
    if (a === 'WINDOWS') dosCwd = 'C:\\WINDOWS';
    dosPrint('\n');
  } else {
    dosPrint('Invalid directory\n\n');
  }
}
