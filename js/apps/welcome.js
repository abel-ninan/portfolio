// ════════════════════════════════
//  WELCOME
// ════════════════════════════════
const TIPS = [
  { text: "To open a program, you just click the Start button, and then click the program's icon." },
  { text: "You can use Windows Explorer to see all the files on your computer." },
  { text: "To find a file, click the Start button, point to Find, and then click Files or Folders." },
  { text: "To adjust the volume, double-click the speaker icon in the taskbar." },
  { text: "You can drag icons on the desktop to rearrange them however you like." },
  { text: "Right-click the desktop to change your wallpaper and display settings." },
];
let tipIndex = 0;

const MONITOR_SVG = `<svg width="130" height="110" viewBox="0 0 130 110" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <!-- Monitor outer body -->
  <rect x="4" y="4" width="100" height="76" rx="4" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
  <rect x="4" y="4" width="100" height="2" fill="#dfdfdf"/>
  <rect x="4" y="4" width="2" height="76" fill="#dfdfdf"/>
  <rect x="103" y="4" width="1" height="76" fill="#808080"/>
  <rect x="4" y="79" width="100" height="1" fill="#808080"/>
  <!-- Screen bezel (inset) -->
  <rect x="10" y="10" width="88" height="62" fill="#404040"/>
  <rect x="10" y="10" width="88" height="1" fill="#606060"/>
  <rect x="10" y="10" width="1" height="62" fill="#606060"/>
  <!-- Screen -->
  <rect x="13" y="13" width="82" height="56" fill="#008080"/>
  <!-- Taskbar on screen -->
  <rect x="13" y="60" width="82" height="9" fill="#c0c0c0"/>
  <!-- Start button on screen -->
  <rect x="15" y="61" width="18" height="7" fill="#c0c0c0" stroke="#808080" stroke-width="0.5"/>
  <!-- Cursor arrow (pointing down-left) -->
  <polygon points="32,20 32,42 37,37 40,44 43,43 40,36 46,36" fill="#00e5e5"/>
  <polygon points="32,20 32,42 37,37 40,44 43,43 40,36 46,36" fill="none" stroke="#000" stroke-width="0.5"/>
  <!-- Monitor bottom strip -->
  <rect x="4" y="80" width="100" height="6" rx="0" fill="#b0b0b0" stroke="#808080" stroke-width="0.5"/>
  <!-- Power LED -->
  <rect x="93" y="82" width="4" height="2" fill="#00cc00"/>
  <!-- Neck -->
  <rect x="44" y="86" width="20" height="8" fill="#a8a8a8" stroke="#808080" stroke-width="0.5"/>
  <!-- Base -->
  <rect x="28" y="94" width="52" height="8" rx="2" fill="#a8a8a8" stroke="#808080" stroke-width="0.5"/>
  <rect x="28" y="94" width="52" height="1" fill="#c0c0c0"/>
</svg>`;

function buildWelcomeWindow(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;font-family:'w95fa','MS Sans Serif',Tahoma,sans-serif;background:var(--c-material);">

      <!-- Header: grey background -->
      <div style="padding:10px 14px 6px;flex-shrink:0;">
        <span style="font-size:22px;font-weight:normal;color:#000;">Welcome to </span><span style="font-size:22px;font-weight:900;color:#000;-webkit-text-stroke:0.8px #000;">Windows</span><span style="font-size:22px;font-weight:normal;color:#fff;">95</span>
      </div>

      <!-- Main row: yellow box + buttons -->
      <div style="display:flex;flex:1;padding:0 8px 8px;gap:8px;align-items:stretch;min-height:0;overflow:hidden;">

        <!-- Yellow sunken box: headshot left, text right -->
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;align-items:center;background:#ffff99;border:2px solid;border-top-color:var(--c-border-dark);border-left-color:var(--c-border-dark);border-bottom-color:var(--c-border-lightest);border-right-color:var(--c-border-lightest);box-shadow:inset 1px 1px 0 var(--c-border-darkest);padding:12px;min-height:0;">
          <div style="width:100%;">
            <div style="font-size:14px;font-weight:bold;margin-bottom:6px;">Welcome to my Windows 95 portfolio website.</div>
            <div style="font-size:12px;line-height:1.6;">I decided to vibe code this nostalgic portfolio website with Claude Code. I hope you enjoy it!</div>
          </div>
          <img src="img/headshot.png" style="width:140px;height:140px;image-rendering:pixelated;display:block;flex-shrink:0;">
        </div>

        <!-- Right: buttons -->
        <div style="display:flex;flex-direction:column;gap:4px;width:130px;flex-shrink:0;">
          <button class="dialog-btn" style="width:100%;">What's <u>N</u>ew</button>
          <button class="dialog-btn" style="width:100%;"><u>O</u>nline Registration</button>
          <div style="flex:1;"></div>
          <div style="height:1px;background:var(--c-border-dark);margin-bottom:2px;box-shadow:0 1px 0 var(--c-border-lightest);"></div>
          <div style="height:30px;"></div>
          <button class="dialog-btn" style="width:100%;" onclick="closeWindow('welcome')"><u>C</u>lose</button>
        </div>

      </div>
    </div>
  `;
  container.style.cssText = 'display:flex;flex-direction:column;overflow:hidden;';
}
