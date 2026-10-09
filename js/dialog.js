// ════════════════════════════════
//  SHUTDOWN / DIALOG
// ════════════════════════════════
function showShutdown() {
  let backdrop = document.getElementById('shutdown-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'shutdown-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0 0 var(--taskbar-total, 40px) 0;background:rgba(0,0,0,0.25);z-index:999;pointer-events:none;';
    document.body.appendChild(backdrop);
  }
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
        #dos-output { white-space:pre-wrap; word-break:break-all; }
        #dos-input-line { display:flex; align-items:center; }
        #dos-prompt { white-space:nowrap; }
        #dos-input { background:transparent; border:none; outline:none; color:#aaaaaa; font-family:'Courier New',Courier,monospace; font-size:16px; flex:1; caret-color:#aaaaaa; padding:0; margin:0; }
        @keyframes dosBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      </style>
      <div id="dos-screen">
        <div id="dos-output">Microsoft(R) MS-DOS(R) Version 7.0
           (C)Copyright Microsoft Corp 1981-1995.

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

      const key = cmd.toLowerCase().split(' ')[0];
      const response = responses.hasOwnProperty(key) ? responses[key] : (cmd ? 'Bad command or file name\n' : '');

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
    document.body.innerHTML = `
      <div style="background:#000;width:100%;height:100vh;height:var(--app-height, 100vh);height:100dvh;display:flex;align-items:center;justify-content:center;">
        <img src="img/shutdown-screen.jpg" style="max-width:100%;max-height:100%;display:block;">
      </div>`;
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
  const F = "'w95fa','MS Sans Serif',Tahoma,sans-serif";
  const old = document.getElementById('run-error'); if (old) old.remove();
  const safe = escapeHTML(name);

  const back = document.createElement('div');
  back.id = 'run-error';
  back.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;';
  const frame = 'background:#c0c0c0;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #fefefe,inset -2px -2px 0 #848584,inset 2px 2px 0 #dfdfdf;';
  back.innerHTML = `
    <div style="${frame}width:400px;max-width:calc(100vw - 16px);padding:3px;font-family:${F};">
      <div style="background:#7f787f;color:#fff;font-size:13px;font-weight:bold;padding:3px 4px 3px 6px;display:flex;align-items:center;height:20px;">
        <span style="flex:1;">Run</span>
        <button id="run-error-x" aria-label="Close" style="width:18px;height:16px;background:#c0c0c0;border:none;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #fefefe,inset -2px -2px 0 #848584,inset 2px 2px 0 #dfdfdf;cursor:pointer;font-family:${F};font-size:11px;line-height:1;color:#000;">&#10005;</button>
      </div>
      <div style="display:flex;gap:14px;padding:18px 16px 14px;align-items:flex-start;">
        <svg width="32" height="32" viewBox="0 0 32 32" style="flex-shrink:0;">
          <circle cx="16" cy="16" r="14" fill="#d40000" stroke="#7a0000" stroke-width="1"/>
          <path d="M10,10 L22,22 M22,10 L10,22" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>
        </svg>
        <p style="font-size:13px;line-height:1.5;flex:1;margin:2px 0 0;">Cannot find the file '${safe}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.</p>
      </div>
      <div style="display:flex;justify-content:center;padding:0 0 16px;">
        <button class="dialog-btn" id="run-error-ok" style="min-width:75px;">OK</button>
      </div>
    </div>`;
  document.body.appendChild(back);

  const ok = document.getElementById('run-error-ok');
  const dismiss = () => { back.remove(); document.removeEventListener('keydown', onKey); const ri = document.getElementById('run-input'); if (ri) ri.focus(); };
  const onKey = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); dismiss(); } };
  ok.addEventListener('click', dismiss);
  document.getElementById('run-error-x').addEventListener('click', dismiss);
  // Next tick: the Enter that ran the command is still bubbling and would close it at once.
  setTimeout(() => {
    if (!back.isConnected) return;
    document.addEventListener('keydown', onKey);
    ok.focus();
  }, 0);
}
