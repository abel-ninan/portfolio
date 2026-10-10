// ════════════════════════════════
//  SHUTDOWN / DIALOG
// ════════════════════════════════
// Win95 Shut Down is system-modal: the whole screen, taskbar included, is
// dimmed, and a click anywhere else just brings the dialog back to the front.
function showShutdown() {
  let backdrop = document.getElementById('shutdown-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'shutdown-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.25);z-index:10001;';
    backdrop.addEventListener('click', e => {
      e.stopPropagation();
      if (openWindows.shutdown) focusWindow('shutdown');
    });
    backdrop.addEventListener('contextmenu', e => e.preventDefault());
    document.body.appendChild(backdrop);
  }
  backdrop.style.display = '';
  openWindow('shutdown');
}
function hideDialog() {
  closeWindow('shutdown');
  const backdrop = document.getElementById('shutdown-backdrop');
  if (backdrop) backdrop.remove();
}
function doLogoff() {
  document.body.innerHTML = `
    <div class="logon-screen">
      <div class="logon-box" role="dialog" aria-labelledby="logon-title">
        <div class="logon-title" id="logon-title">Welcome to Windows</div>
        <form class="logon-body" id="logon-form" autocomplete="off">
          <div class="logon-icon">
            <img src="img/login-icon.png" alt="">
          </div>
          <div class="logon-fields">
            <p>Type a user name and password to log on to Windows.</p>
            <div class="logon-row">
              <label for="login-user"><u>U</u>ser name:</label>
              <input id="login-user" class="logon-field" type="text" value="Abel" autocapitalize="off" autocorrect="off" spellcheck="false">
            </div>
            <div class="logon-row">
              <label for="login-pass"><u>P</u>assword:</label>
              <input id="login-pass" class="logon-field" type="password">
            </div>
          </div>
          <div class="logon-buttons">
            <button type="submit" class="logon-btn">OK</button>
            <button type="button" class="logon-btn" id="logon-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>`;
  // Any answer logs back on (reloads the desktop).
  document.getElementById('logon-form').addEventListener('submit', e => { e.preventDefault(); location.reload(); });
  document.getElementById('logon-cancel').addEventListener('click', () => location.reload());
  // No auto-focus on phones: it would pop the keyboard over the dialog.
  if (!isPhone()) setTimeout(() => { const u = document.getElementById('login-user'); if (u) { u.focus(); u.select(); } }, 50);
}

function doShutdownAction() {
  const opt = (document.querySelector('input[name="shutdown-opt"]:checked') || {}).value || 'shutdown';
  closeWindow('shutdown');
  const backdrop = document.getElementById('shutdown-backdrop');
  if (backdrop) backdrop.remove();
  if (opt === 'restart') {
    reboot();
  } else if (opt === 'logoff') {
    doLogoff();
  } else if (opt === 'msdos') {
    document.body.innerHTML = `
      <style>
        #dos-screen { background:#000; width:100%; height:100vh; height:var(--app-height, 100vh); height:100dvh; padding:12px 16px; padding-bottom:calc(12px + env(safe-area-inset-bottom, 0px)); font-family:'Courier New',Courier,monospace; font-size:16px; color:#aaaaaa; overflow-x:hidden; overflow-y:auto; display:flex; flex-direction:column; cursor:text; box-sizing:border-box; }
        #dos-output { white-space:pre-wrap; word-break:normal; overflow-wrap:anywhere; }
        #dos-input-line { display:flex; align-items:center; }
        #dos-prompt { white-space:nowrap; }
        #dos-input { background:transparent; border:none; outline:none; color:#aaaaaa; font-family:'Courier New',Courier,monospace; font-size:16px; flex:1; caret-color:#aaaaaa; padding:0; margin:0; }
        @keyframes dosBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      </style>
      <div id="dos-screen">
        <div id="dos-output">Microsoft(R) MS-DOS(R) Version 7.0
   (C)Copyright Microsoft Corp 1981-1995.

Type EXIT and press ENTER to return to Windows.

</div>
        <div id="dos-input-line">
          <span id="dos-prompt">C:\\&gt;</span>
          <input id="dos-input" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        </div>
      </div>`;

    const input = document.getElementById('dos-input');
    const output = document.getElementById('dos-output');
    document.getElementById('dos-screen').addEventListener('click', () => input.focus());
    input.focus();

    input.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim();
      input.value = '';
      const line = 'C:\\>' + cmd + '\n';

      const responses = {
        '': '',
        'cls': '__CLEAR__',
        'ver': 'MS-DOS Version 7.0\n',
        'dir': ' Volume in drive C has no label\n Volume Serial Number is 1A2B-3C4D\n\n Directory of C:\\\n\nWINDOWS      <DIR>        03-14-96  12:00p\nCOMMAND  COM       54,619  03-14-96  12:00p\nCONFIG   SYS          256  03-14-96  12:00p\nAUTOEXEC BAT          128  03-14-96  12:00p\n         2 file(s)         54,875 bytes\n         1 dir(s)     524,288,000 bytes free\n',
        'help': 'For more information on a specific command, type HELP command-name\nCLS       COMMAND   DIR       ECHO      EXIT\nMEM       TIME      VER       VOL\n',
        'mem': '655,360 bytes total conventional memory\n655,360 bytes available to MS-DOS\n619,264 largest executable program size\n\n7,340,032 bytes total contiguous extended memory\n        0 bytes available contiguous extended memory\n6,553,600 bytes available XMS memory\n  MS-DOS resident in High Memory Area\n',
        'time': 'Current time is ' + new Date().toLocaleTimeString() + '\nEnter new time: ',
        'date': 'Current date is ' + new Date().toLocaleDateString('en-US',{weekday:'short',month:'2-digit',day:'2-digit',year:'numeric'}) + '\nEnter new date (mm-dd-yy): ',
        'vol':  'Volume in drive C has no label\nVolume Serial Number is 1A2B-3C4D\n',
        'exit': '__EXIT__',
        'win':  '__EXIT__',
      };

      const key = cmd.toLowerCase().split(/\s+/)[0];
      const args = cmd.slice(key.length).trim();
      let response = responses.hasOwnProperty(key) ? responses[key] : (cmd ? 'Bad command or file name\n' : '');
      // ECHO prints its text; COMMAND starts a new command interpreter (its banner).
      if (key === 'echo') response = (args ? args.replace(/^[.:]/, '') : 'ECHO is on.') + '\n';
      if (key === 'command') response = '\nMicrosoft(R) Windows 95\n   (C)Copyright Microsoft Corp 1981-1995.\n';

      if (response === '__CLEAR__') {
        output.textContent = '';
      } else if (response === '__EXIT__') {
        output.textContent += line;
        output.textContent += 'Restarting Windows 95...\n';
        setTimeout(() => location.reload(), 1200);
      } else {
        output.textContent += line + response + '\n';
        const dos = document.getElementById('dos-screen');
        dos.scrollTop = dos.scrollHeight;
      }
    });

  } else {
    // "It's now safe to turn off your computer." A click, tap or key starts
    // Windows again, so a visitor (in an in-app browser without a reload
    // button, say) is never stuck here; a hint fades in after a moment.
    const verb = isPhone() ? 'Tap' : 'Click';
    document.body.innerHTML = `
      <div id="shutdown-screen" role="button" tabindex="0" aria-label="It's now safe to turn off your computer. ${verb} to restart Windows."
           style="position:relative;background:#000;width:100%;height:100vh;height:var(--app-height, 100vh);height:100dvh;display:flex;align-items:center;justify-content:center;cursor:pointer;outline:none;">
        <img src="img/shutdown-screen.jpg" alt="" style="max-width:100%;max-height:100%;display:block;">
        <p id="shutdown-hint" style="position:absolute;left:0;right:0;bottom:calc(16px + env(safe-area-inset-bottom, 0px));margin:0;text-align:center;font-family:'w95fa','MS Sans Serif',sans-serif;font-size:16px;color:#c0c0c0;opacity:0;transition:opacity 1s ease;pointer-events:none;">${verb} to restart Windows</p>
      </div>`;
    const screen = document.getElementById('shutdown-screen');
    const shownAt = Date.now();
    const restart = () => {
      if (Date.now() - shownAt < 500) return; // the click or key that chose Yes
      location.reload();
    };
    screen.addEventListener('click', restart);
    document.addEventListener('keydown', restart);
    setTimeout(() => { const hint = document.getElementById('shutdown-hint'); if (hint) hint.style.opacity = '1'; }, 2500);
  }
}

// Maps a typed command -> a window type registered in WINDOW_DEFS.
const RUN_COMMANDS = {
  // MS-DOS Prompt
  'cmd': 'msdos', 'command': 'msdos', 'command.com': 'msdos', 'msdos': 'msdos',
  // Notepad
  'notepad': 'notepad',
  // Paint
  'mspaint': 'paint', 'pbrush': 'paint', 'paint': 'paint', 'ms paint': 'paint',
  // Internet Explorer
  'iexplore': 'ie', 'iexplorer': 'ie', 'ie': 'ie', 'internet': 'ie', 'internet explorer': 'ie',
  // Explorer / My Computer / My Files
  'explorer': 'computer', 'mycomputer': 'computer', 'my computer': 'computer',
  'files': 'files', 'my files': 'files',
  // Control Panel
  'control': 'controlpanel', 'control panel': 'controlpanel',
  // Games / tools
  'winmine': 'minesweeper', 'minesweeper': 'minesweeper',
  'defrag': 'defrag', 'dfrg': 'defrag',
  // Misc
  'winamp': 'winamp',
  'welcome': 'welcome',
  'recycle': 'recycle', 'recycle bin': 'recycle',
  // Portfolio
  'resume': 'resume', 'cv': 'resume', 'resume.doc': 'resume', 'wordpad': 'resume', 'write': 'resume',
  'skills': 'skills', 'skills.doc': 'skills',
  'projects': 'projects', 'my projects': 'projects', 'portfolio': 'projects',
  'contact': 'contact', 'contact me': 'contact', 'email': 'contact', 'mail': 'contact', 'msimn': 'contact', 'outlook': 'contact',
  'bio': 'bio', 'about': 'bio', 'abel': 'bio',
  'documents': 'documents', 'photos': 'photos',
  'certifications': 'certifications', 'certifications.txt': 'certifications', 'certs': 'certifications',
  // Web shortcuts: open the profile in a new tab, then Run just closes
  // ('shortcut' is not a window type, so openWindow ignores it).
  get 'linkedin'() { openExternal(PORTFOLIO.links.linkedin); return 'shortcut'; },
  get 'github'() { openExternal(PORTFOLIO.links.github); return 'shortcut'; },
};

function doRun() {
  const input = document.getElementById('run-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;

  // Looked up with hasOwnProperty first: reading the linkedin / github
  // entries opens a tab, so they are only read once a command matched.
  const lower = raw.toLowerCase();
  const runTarget = key => (Object.prototype.hasOwnProperty.call(RUN_COMMANDS, key) ? RUN_COMMANDS[key] : null);
  const openTarget = target => {
    openWindow(target);
    closeWindow('run');
  };

  // An exact program name first, so command.com is not taken for a web address.
  let target = runTarget(lower);
  if (target) { openTarget(target); return; }

  // Web address (www.x, https://x, x.com/..., en.wikipedia.org/...) ->
  // open Internet Explorer and navigate there.
  if (/^(https?:\/\/|www\.)/i.test(raw) ||
      /^([a-z0-9-]+\.)+(com|net|org|io|dev|ca|co|edu|gov|us|uk|ai|app|me|tv|info|gg|xyz)(:\d+)?([\/?#]\S*)?$/i.test(raw)) {
    openWindow('ie');
    setTimeout(() => { if (typeof ieLoad === 'function') ieLoad(raw); }, 60);
    closeWindow('run');
    return;
  }

  // A drive or path (c:, c:\, \, .) opens Explorer / My Computer.
  if (/^[a-z]:\\?$|^\\$|^\.$/i.test(raw)) {
    openWindow('computer');
    closeWindow('run');
    return;
  }

  // Normalize: drop any path prefix and a trailing .exe/.com extension.
  const cmd = lower
    .replace(/^.*[\\/]/, '')
    .replace(/\.(exe|com|cpl|bat|scr)$/, '')
    .trim();

  target = runTarget(cmd);
  if (target) { openTarget(target); return; }

  // Unknown -> authentic Win95 "cannot find file" error (Run stays open).
  runError(raw);
}

function runError(name) {
  showMessageBox({
    id: 'run-error',
    title: 'Run',
    icon: 'error',
    owner: 'run',
    text: `Cannot find the file '${name}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.`,
    onClose: () => { const ri = document.getElementById('run-input'); if (ri) ri.focus(); },
  });
}

// ════════════════════════════════
//  MESSAGE BOX
// ════════════════════════════════
// A Win95 message box in front of everything (Run errors, Defrag's legend,
// the empty drives in My Computer). The window it belongs to (opts.owner) looks
// inactive while it is up and gets the focus back after.
//   opts: { id, title, text | html, icon: 'info' | 'error' | 'warn' | null,
//           buttons: [{ label, run }], owner, onClose }
// Enter picks the focused (first) button; Escape and the title-bar X the last.
const MSGBOX_ICONS = {
  info: `<svg class="msgbox-icon" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16,2C8,2,2,7.5,2,14c0,4,2.3,7.5,6,9.7L6,30l8-5c0.7,0.1,1.3,0.1,2,0.1c8,0,14-5.5,14-12S24,2,16,2Z" fill="#fff" stroke="#000" stroke-width="1"/>
    <circle cx="16" cy="8.5" r="2.2" fill="#0000ff"/><rect x="14" y="12" width="4" height="10" fill="#0000ff"/></svg>`,
  error: `<svg class="msgbox-icon" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="14" fill="#ff0000" stroke="#800000" stroke-width="1"/>
    <path d="M10,10 L22,22 M22,10 L10,22" stroke="#fff" stroke-width="3.5"/></svg>`,
  warn: `<svg class="msgbox-icon" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
    <path d="M16,2L30.5,29H1.5Z" fill="#ffff00" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="14.25" y="10" width="3.5" height="11" fill="#000"/><rect x="14.25" y="23" width="3.5" height="3.5" fill="#000"/></svg>`,
};

function showMessageBox(opts) {
  const o = opts || {};
  const id = o.id || 'msgbox';
  const old = document.getElementById(id);
  if (old) old.remove();
  const buttons = o.buttons && o.buttons.length ? o.buttons : [{ label: 'OK' }];
  const icon = o.icon === null ? '' : (MSGBOX_ICONS[o.icon] || MSGBOX_ICONS.info);

  const back = document.createElement('div');
  back.id = id;
  back.className = 'msgbox-backdrop';
  if (o.owner) back.dataset.owner = o.owner; // closed with that window (closeWindow)
  back.innerHTML = `
    <div class="window active msgbox" role="alertdialog" aria-modal="true" aria-labelledby="${id}-title" aria-describedby="${id}-text">
      <div class="window-titlebar">
        <span class="window-title" id="${id}-title"></span>
        <div class="window-controls">
          <button class="win-btn win-btn-close" id="${id}-x" title="Close" aria-label="Close">
            <img src="img/close-icon.png" alt="" style="width:14px;height:14px;image-rendering:pixelated;display:block;">
          </button>
        </div>
      </div>
      <div class="msgbox-body">${icon}<div class="msgbox-text" id="${id}-text"></div></div>
      <div class="msgbox-footer">${buttons.map((b, i) =>
        `<button class="dialog-btn msgbox-btn" data-i="${i}"${i === 0 ? ` id="${id}-ok"` : ''}>${b.label}</button>`).join('')}</div>
    </div>`;
  back.querySelector('.window-title').textContent = o.title || 'Windows';
  const textEl = back.querySelector('.msgbox-text');
  if (o.html) textEl.innerHTML = o.html; else textEl.textContent = o.text || '';
  document.body.appendChild(back);
  document.querySelectorAll('#desktop .window.active').forEach(w => w.classList.remove('active'));

  let done = false;
  const close = i => {
    if (done) return;
    done = true;
    back.remove();
    document.removeEventListener('keydown', onKey, true);
    if (o.owner && openWindows[o.owner]) focusWindow(o.owner);
    const b = buttons[i];
    if (b && typeof b.run === 'function') b.run();
    if (typeof o.onClose === 'function') o.onClose(i);
  };
  const onKey = e => {
    if (e.key !== 'Escape' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    const btn = e.target instanceof Element && e.target.closest('.msgbox-btn');
    close(e.key === 'Escape' ? buttons.length - 1 : (btn && back.contains(btn) ? +btn.dataset.i : 0));
  };
  back.querySelector('.msgbox-footer').addEventListener('click', e => {
    const btn = e.target.closest('.msgbox-btn');
    if (btn) close(+btn.dataset.i);
  });
  back.querySelector('.win-btn-close').addEventListener('click', () => close(buttons.length - 1));
  back._cancel = () => { // its window closed: go away without running anything
    done = true;
    back.remove();
    document.removeEventListener('keydown', onKey, true);
  };
  back.addEventListener('contextmenu', e => e.preventDefault());
  // Next tick: the Enter that opened the box is still being handled.
  setTimeout(() => {
    if (!back.isConnected) return;
    document.addEventListener('keydown', onKey, true);
    back.querySelector('.msgbox-btn').focus({ preventScroll: true });
  }, 0);
  return back;
}
