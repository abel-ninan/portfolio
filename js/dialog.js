// ════════════════════════════════
//  SHUTDOWN / DIALOG
// ════════════════════════════════
function showShutdown() {
  let backdrop = document.getElementById('shutdown-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'shutdown-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0 0 40px 0;background:rgba(0,0,0,0.25);z-index:999;pointer-events:none;';
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
  const F = "'w95fa','MS Sans Serif',Tahoma,sans-serif";
  const btn = `min-width:72px;height:23px;background:#c0c0c0;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #fefefe,inset -2px -2px 0 #848584,inset 2px 2px 0 #dfdfdf;border:none;cursor:pointer;font-family:${F};font-size:13px;color:#000;`;
  const field = `flex:1;height:18px;border:none;box-shadow:inset -1px -1px 0 #dfdfdf,inset 1px 1px 0 #848584,inset -2px -2px 0 #fefefe,inset 2px 2px 0 #0a0a0a;padding:0 3px;font-family:${F};font-size:13px;background:#fff;outline:none;`;
  document.body.innerHTML = `
    <div style="background:#008080;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;">
      <div style="background:#c0c0c0;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #dfdfdf,inset -2px -2px 0 #848584,inset 2px 2px 0 #fefefe;width:440px;padding:3px;">
        <div style="background:#060084;color:#fff;font-family:${F};font-size:13px;font-weight:bold;padding:2px 5px;display:flex;align-items:center;height:22px;margin-bottom:0;">
          Welcome to Windows
        </div>
        <div style="display:flex;gap:0;padding:12px 10px 18px;">
          <div style="flex-shrink:0;width:52px;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;">
            <img src="img/login-icon.png" style="width:40px;height:36px;image-rendering:pixelated;">
          </div>
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
            <p style="margin:0 0 8px;font-family:${F};font-size:13px;">Type a user name and password to log on to Windows.</p>
            <div style="display:flex;align-items:center;gap:8px;">
              <label style="font-family:${F};font-size:13px;width:86px;flex-shrink:0;"><u>U</u>ser name:</label>
              <input id="login-user" type="text" value="Nat" style="${field}">
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <label style="font-family:${F};font-size:13px;width:86px;flex-shrink:0;"><u>P</u>assword:</label>
              <input id="login-pass" type="password" style="${field}">
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-left:10px;flex-shrink:0;">
            <button onclick="location.reload()" style="${btn}">OK</button>
            <button onclick="location.reload()" style="${btn}">Cancel</button>
          </div>
        </div>
      </div>
    </div>`;
  setTimeout(() => { const u = document.getElementById('login-user'); if (u) { u.focus(); u.select(); } }, 50);
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
        #dos-screen { background:#000; width:100vw; height:100vh; padding:12px 16px; font-family:'Courier New',Courier,monospace; font-size:16px; color:#aaaaaa; overflow:hidden; display:flex; flex-direction:column; cursor:text; box-sizing:border-box; }
        #dos-output { white-space:pre-wrap; word-break:break-all; }
        #dos-input-line { display:flex; align-items:center; }
        #dos-prompt { white-space:nowrap; }
        #dos-input { background:transparent; border:none; outline:none; color:#aaaaaa; font-family:'Courier New',Courier,monospace; font-size:16px; flex:1; caret-color:#aaaaaa; padding:0; margin:0; }
        @keyframes dosBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      </style>
      <div id="dos-screen" onclick="document.getElementById('dos-input').focus()">
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
        output.scrollTop = output.scrollHeight;
      }
    });

  } else {
    document.body.innerHTML = `
      <div style="background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;">
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
};

function doRun() {
  const input = document.getElementById('run-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;

  // Web address -> open Internet Explorer and navigate there.
  if (/^(https?:\/\/|www\.)/i.test(raw) || /^[\w-]+\.(com|net|org|io|dev|ca|co)(\/|$)/i.test(raw)) {
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

  // Normalize: lowercase, drop any path prefix and a trailing .exe/.com extension.
  const cmd = raw.toLowerCase()
    .replace(/^.*[\\/]/, '')
    .replace(/\.(exe|com|cpl|bat|scr)$/, '')
    .trim();

  const target = RUN_COMMANDS[cmd] || RUN_COMMANDS[raw.toLowerCase()];
  if (target) {
    openWindow(target);
    closeWindow('run');
    return;
  }

  // Unknown -> authentic Win95 "cannot find file" error (Run stays open).
  runError(raw);
}

function runError(name) {
  const F = "'w95fa','MS Sans Serif',Tahoma,sans-serif";
  const old = document.getElementById('run-error'); if (old) old.remove();
  const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const back = document.createElement('div');
  back.id = 'run-error';
  back.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;';
  const frame = 'background:#c0c0c0;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #fefefe,inset -2px -2px 0 #848584,inset 2px 2px 0 #dfdfdf;';
  back.innerHTML = `
    <div style="${frame}width:400px;padding:3px;font-family:${F};">
      <div style="background:#7f787f;color:#fff;font-size:13px;font-weight:bold;padding:3px 4px 3px 6px;display:flex;align-items:center;height:20px;">
        <span style="flex:1;">Run</span>
        <button onclick="document.getElementById('run-error').remove()" style="width:18px;height:16px;background:#c0c0c0;border:none;box-shadow:inset -1px -1px 0 #0a0a0a,inset 1px 1px 0 #fefefe,inset -2px -2px 0 #848584,inset 2px 2px 0 #dfdfdf;cursor:pointer;font-family:${F};font-size:11px;line-height:1;color:#000;">&#10005;</button>
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
  ok.onclick = dismiss;
  document.addEventListener('keydown', onKey);
  setTimeout(() => ok.focus(), 0);
}
