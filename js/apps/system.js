// ════════════════════════════════
//  SHUT DOWN + RUN
// ════════════════════════════════
function buildShutdownWindow(container) {
  container.innerHTML = `
    <div style="display:flex;gap:14px;padding:14px 16px 0;align-items:flex-start;">
      <img src="img/shutdown.ico" style="width:41px;height:41px;image-rendering:pixelated;flex-shrink:0;margin-top:2px;">
      <div style="flex:1;">
        <p style="margin-bottom:10px;font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;">Are you sure you want to:</p>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;cursor:pointer;">
            <input type="radio" name="shutdown-opt" value="shutdown" checked style="cursor:pointer;accent-color:#000080;flex-shrink:0;">
            <span><u>S</u>hut down the computer?</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;cursor:pointer;">
            <input type="radio" name="shutdown-opt" value="restart" style="cursor:pointer;accent-color:#000080;flex-shrink:0;">
            <span><u>R</u>estart the computer?</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;cursor:pointer;">
            <input type="radio" name="shutdown-opt" value="msdos" style="cursor:pointer;accent-color:#000080;flex-shrink:0;">
            <span>Restart the computer in <u>M</u>S-DOS mode?</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;cursor:pointer;">
            <input type="radio" name="shutdown-opt" value="logoff" style="cursor:pointer;accent-color:#000080;flex-shrink:0;">
            <span><u>C</u>lose all programs and log on as a different user?</span>
          </label>
        </div>
      </div>
    </div>
    <div style="display:flex;justify-content:center;gap:8px;padding:30px 14px 12px;">
      <button class="dialog-btn" onclick="doShutdownAction()"><u>Y</u>es</button>
      <button class="dialog-btn" onclick="closeWindow('shutdown')"><u>N</u>o</button>
      <button class="dialog-btn" onclick="closeWindow('shutdown')"><u>H</u>elp</button>

    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;';
}

function buildRunWindow(container) {
  const f = "font-size:12px;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;";
  const comboStyle = `
    flex:1;display:flex;flex-direction:row;justify-content:flex-end;align-items:center;
    padding:2px 2px 2px 5px;height:22px;
    background:#ffffff;border:none;
    box-shadow:inset -1px -1px 0px #ffffff, inset 1px 1px 0px #808080, inset -2px -2px 0px #c1c1c1, inset 2px 2px 0px #000000;
  `;
  const inputStyle = `
    flex:1;height:100%;${f}
    padding:0;border:none;background:transparent;outline:none;
  `;
  const dropBtnStyle = `
    width:16px;align-self:stretch;flex-shrink:0;
    background:#c0c0c0;cursor:pointer;border:none;
    box-shadow:inset -1px -1px 0px #000000, inset 1px 1px 0px #c1c1c1, inset -2px -2px 0px #818181, inset 2px 2px 0px #ffffff;
    display:flex;align-items:center;justify-content:center;padding:0;position:relative;
  `;
  container.innerHTML = `
    <div style="display:flex;gap:12px;padding:14px 14px 10px;align-items:flex-start;">
      <img src="img/run.ico" style="width:38px;height:38px;image-rendering:pixelated;flex-shrink:0;margin-top:2px;">
      <p style="${f}line-height:1.5;">Type the name of a program, folder, or document, and Windows will open it for you.</p>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:0 14px 12px;">
      <label style="${f}white-space:nowrap;">Open:</label>
      <div style="${comboStyle}">
        <input type="text" id="run-input" style="${inputStyle}" onkeydown="if(event.key==='Enter')doRun()">
        <button style="${dropBtnStyle}"><svg width="7" height="4" viewBox="0 0 7 4" style="display:block;"><polygon points="0,0 7,0 3.5,4" fill="#000000"/></svg></button>
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:6px;padding:5px 14px 24px;">
      <button class="dialog-btn" onclick="doRun()"><u>O</u>K</button>
      <button class="dialog-btn" onclick="closeWindow('run')"><u>C</u>ancel</button>
      <button class="dialog-btn"><u>B</u>rowse...</button>
    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;';
}
