// ════════════════════════════════
//  WINAMP  (classic 2.x player)
// ════════════════════════════════
// Three bare panels in #desktop: #win-winamp (created by openWindow), plus
// #win-winampeq and #win-winamppl. Each panel's skin sits in a .wa-inner
// wrapper.
//   desktop  panels drag independently, exactly as the original
//   phone    winampLayout() scales every skin with a transform so the visible
//            panels fit the screen (one column, or two side by side in
//            landscape), sizes each panel to match, and drags them as a
//            group. Panels that would get too small are hidden; the EQ / PL
//            buttons bring them back. Sliders follow a finger anywhere near
//            them (winampSliderDown), and tiny buttons get invisible hit areas.
const WINAMP = {
  open: false,
  ctx: null, audio: null, analyser: null, freqData: null,
  filters: null, preamp: null, panner: null, volGain: null,
  current: 3, playing: false, started: false,
  remaining: false,            // time display mode
  shuffle: false, repeat: false, eqOn: true,
  eqVisible: true, plVisible: true,
  volume: 0.8,
  peaks: [], mx: 0,
  visCanvas: null, marqueeEl: null,
  bands: [], preampEl: null,
  raf: null,
  phone: false,                // panels are laid out by winampLayout()
  phonePos: null,              // group position after the user dragged it (phones)
  slide: null,                 // slider being dragged by finger
  seeking: false,
  deskH: null,                 // unscaled panel heights, for re-stacking on desktop
  ro: null, shown: false,
  // Listed names/durations match the target skin (titles & artist names aren't copyrightable);
  // actual playable audio is the bundled CC0 chiptunes, cycled across the entries.
  tracks: [
    { num: 1, artist: 'Mori Calliope', title: 'Go-Getters',    file: 'audio/chiptune1.mp3', dur: 195, kbps: 128, khz: 48 },
    { num: 2, artist: 'CircusP',       title: 'Goodbye',        file: 'audio/chiptune2.mp3', dur: 204, kbps: 128, khz: 48 },
    { num: 3, artist: 'ArnaLee',       title: 'Siren',          file: 'audio/chiptune3.mp3', dur: 242, kbps: 128, khz: 48 },
    { num: 4, artist: 'Crusher-P',     title: 'Echo',           file: 'audio/chiptune1.mp3', dur: 230, kbps: 128, khz: 48 },
    { num: 5, artist: 'M83',           title: 'Midnight City',  file: 'audio/chiptune2.mp3', dur: 243, kbps: 128, khz: 48 },
    { num: 6, artist: 'Sunnexo',       title: 'Please Wait',    file: 'audio/chiptune3.mp3', dur: 255, kbps: 128, khz: 48 },
    { num: 7, artist: 'Omaru Polka',   title: 'Persona',        file: 'audio/chiptune1.mp3', dur: 296, kbps: 128, khz: 48 },
  ],
};

const WA_FREQS  = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
const WA_LABELS = ['70', '180', '320', '600', '1K', '3K', '6K', '12K', '14K', '16K'];

const WA_PANEL_IDS  = ['win-winamp', 'win-winampeq', 'win-winamppl'];
const WA_INNER_W    = 344;  // skin width: 350px panel minus 2px padding + 1px border per side
const WA_FRAME      = 6;    // that padding + border, both sides
const WA_MARGIN     = 8;    // gap to the screen edges on phones
const WA_MIN_SCALE  = 0.72; // below this a panel is hidden instead of shrunk further
const WA_MAX_SCALE  = 1.35;

// ---- glyphs ----
const WA_GLYPH = {
  prev:  `<svg width="14" height="10" viewBox="0 0 14 10"><rect x="2" y="1" width="1.6" height="8" fill="#15151c"/><polygon points="9,1 9,9 4,5" fill="#15151c"/><polygon points="13,1 13,9 8,5" fill="#15151c"/></svg>`,
  play:  `<svg width="14" height="10" viewBox="0 0 14 10"><polygon points="3,1 3,9 12,5" fill="#15151c"/></svg>`,
  pause: `<svg width="14" height="10" viewBox="0 0 14 10"><rect x="3" y="1" width="3" height="8" fill="#15151c"/><rect x="8" y="1" width="3" height="8" fill="#15151c"/></svg>`,
  stop:  `<svg width="14" height="10" viewBox="0 0 14 10"><rect x="3" y="1" width="8" height="8" fill="#15151c"/></svg>`,
  next:  `<svg width="14" height="10" viewBox="0 0 14 10"><polygon points="1,1 1,9 6,5" fill="#15151c"/><polygon points="5,1 5,9 10,5" fill="#15151c"/><rect x="10.4" y="1" width="1.6" height="8" fill="#15151c"/></svg>`,
  eject: `<svg width="12" height="10" viewBox="0 0 12 10"><polygon points="6,1 1,6 11,6" fill="#15151c"/><rect x="1" y="7.5" width="10" height="1.8" fill="#15151c"/></svg>`,
  min:   `<svg width="7" height="7" viewBox="0 0 7 7"><rect x="0" y="5" width="7" height="1.6" fill="#c8c8d4"/></svg>`,
  close: `<svg width="7" height="7" viewBox="0 0 7 7"><path d="M0,0 L7,7 M7,0 L0,7" stroke="#c8c8d4" stroke-width="1.4"/></svg>`,
};

function waFormat(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
// Big LCD display: zero-padded minutes, e.g. 01:51
function waFormatLCD(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(sec / 60), s = sec % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

// ════════════════════════════════
//  BUILD  (win === the bare .winamp element)
// ════════════════════════════════
function buildWinampWindow(win, type) {
  WINAMP.open = true;
  WINAMP.peaks = new Array(19).fill(0);
  WINAMP.eqVisible = true;
  WINAMP.plVisible = true;
  WINAMP.phone = false;
  WINAMP.phonePos = null;
  WINAMP.slide = null;
  WINAMP.seeking = false;

  win.classList.add('wa-focused');
  win.innerHTML = `<div class="wa-inner">
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP</div>
      <div class="wa-tb-btns">
        <button class="wa-tb-btn" id="wa-min" title="Minimize" aria-label="Minimize">${WA_GLYPH.min}</button>
        <button class="wa-tb-btn" id="wa-close" title="Close" aria-label="Close">${WA_GLYPH.close}</button>
      </div>
    </div>
    <div class="wa-main-body">
      <div class="wa-display wa-inset">
        <canvas class="wa-vis" width="76" height="38"></canvas>
        <div class="wa-display-right">
          <div class="wa-timerow">
            <span class="wa-playind" id="wa-playind"></span>
            <div class="wa-time" id="wa-time" title="Click to toggle remaining time">00:00</div>
          </div>
          <div class="wa-meta">
            <span class="wa-kbps"><b id="wa-kbps">128</b> kbps</span>
            <span class="wa-khz"><b id="wa-khz">44</b> kHz</span>
            <span class="wa-mono" id="wa-mono">mono</span>
            <span class="wa-stereo wa-on" id="wa-stereo">stereo</span>
          </div>
          <div class="wa-title-scroll"><span id="wa-marquee"></span></div>
        </div>
      </div>
      <div class="wa-sliders">
        <input type="range" class="wa-slider wa-vol" id="wa-vol" min="0" max="100" value="${Math.round(WINAMP.volume * 100)}" aria-label="Volume">
        <input type="range" class="wa-slider wa-bal" id="wa-bal" min="-100" max="100" value="0" aria-label="Balance">
      </div>
      <div class="wa-toggles">
        <span class="wa-tg wa-on" id="wa-eq-btn">EQ</span>
        <span class="wa-tg wa-on" id="wa-pl-btn">PL</span>
        <span class="wa-spacer"></span>
        <span class="wa-tg" id="wa-shuffle">SHUFFLE</span>
        <span class="wa-tg" id="wa-repeat">REPEAT</span>
      </div>
      <input type="range" class="wa-slider wa-seek" id="wa-seek" min="0" max="1000" value="0" aria-label="Seek">
      <div class="wa-transport">
        <button class="wa-tp" id="wa-prev"  title="Previous">${WA_GLYPH.prev}</button>
        <button class="wa-tp" id="wa-play"  title="Play">${WA_GLYPH.play}</button>
        <button class="wa-tp" id="wa-pause" title="Pause">${WA_GLYPH.pause}</button>
        <button class="wa-tp" id="wa-stop"  title="Stop">${WA_GLYPH.stop}</button>
        <button class="wa-tp" id="wa-next"  title="Next">${WA_GLYPH.next}</button>
        <button class="wa-tp wa-eject" id="wa-eject" title="Eject">${WA_GLYPH.eject}</button>
        <div class="wa-logo" title="Winamp"></div>
      </div>
    </div></div>`;

  const desktop = document.getElementById('desktop');
  const baseLeft = win.offsetLeft;
  let stackTop = win.offsetTop + win.offsetHeight;

  // ---- Equalizer panel ----
  const eq = document.createElement('div');
  eq.className = 'winamp wa-focused';
  eq.id = 'win-winampeq';
  eq.style.cssText = `left:${baseLeft}px;top:${stackTop}px;`;
  eq.innerHTML = `<div class="wa-inner">
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP EQUALIZER</div>
      <div class="wa-tb-btns"><button class="wa-tb-btn" id="wa-eq-close" title="Close" aria-label="Close equalizer">${WA_GLYPH.close}</button></div>
    </div>
    <div class="wa-eq-body">
      <div class="wa-eq-top">
        <div style="display:flex;flex-direction:column;gap:3px;">
          <span class="wa-tg wa-on" id="wa-eq-on">ON</span>
          <span class="wa-tg" id="wa-eq-auto">AUTO</span>
        </div>
        <canvas class="wa-eq-graph wa-inset" id="wa-eq-graph" width="110" height="38"></canvas>
        <span class="wa-tg" id="wa-eq-presets">PRESETS</span>
      </div>
      <div class="wa-eq-sliders">
        <div class="wa-eq-db">
          <span>+12 db</span><span>+0 db</span><span>-12 db</span>
        </div>
        <div class="wa-eq-col wa-eq-pre">
          <input type="range" class="wa-eq-band" id="wa-preamp" min="0" max="100" value="50" aria-label="Preamp">
          <span class="wa-eq-lbl">PREAMP</span>
        </div>
        <div class="wa-eq-gap"></div>
        ${WA_FREQS.map((f, i) => `
          <div class="wa-eq-col">
            <input type="range" class="wa-eq-band" data-band="${i}" min="0" max="100" value="50" aria-label="${WA_LABELS[i]} Hz">
            <span class="wa-eq-lbl">${WA_LABELS[i]}</span>
          </div>`).join('')}
      </div>
    </div></div>`;
  desktop.appendChild(eq);
  stackTop += eq.offsetHeight;

  // ---- Playlist panel ----
  const pl = document.createElement('div');
  pl.className = 'winamp wa-focused';
  pl.id = 'win-winamppl';
  pl.style.cssText = `left:${baseLeft}px;top:${stackTop}px;`;
  pl.innerHTML = `<div class="wa-inner">
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP PLAYLIST</div>
      <div class="wa-tb-btns"><button class="wa-tb-btn" id="wa-pl-close" title="Close" aria-label="Close playlist">${WA_GLYPH.close}</button></div>
    </div>
    <div class="wa-pl-body">
      <div class="wa-pl-list" id="wa-pl-list"></div>
      <div class="wa-pl-foot">
        <span class="wa-pl-btn">ADD</span>
        <span class="wa-pl-btn">REM</span>
        <span class="wa-pl-btn">SEL</span>
        <span class="wa-pl-btn">MISC</span>
        <span class="wa-pl-total" id="wa-pl-total">0:00 / 0:00</span>
        <span class="wa-pl-mini">
          <button class="wa-pl-mtp" data-wa="prev" title="Previous">${WA_GLYPH.prev}</button>
          <button class="wa-pl-mtp" data-wa="play" title="Play">${WA_GLYPH.play}</button>
          <button class="wa-pl-mtp" data-wa="pause" title="Pause">${WA_GLYPH.pause}</button>
          <button class="wa-pl-mtp" data-wa="stop" title="Stop">${WA_GLYPH.stop}</button>
          <button class="wa-pl-mtp" data-wa="next" title="Next">${WA_GLYPH.next}</button>
        </span>
        <span class="wa-pl-opts">LIST<br>OPTS</span>
      </div>
    </div></div>`;
  desktop.appendChild(pl);

  // Unscaled heights, used to stack the panels again after phone mode.
  WINAMP.deskH = { main: win.offsetHeight, eq: eq.offsetHeight };

  // ---- refs ----
  WINAMP.visCanvas = win.querySelector('.wa-vis');
  WINAMP.marqueeEl = document.getElementById('wa-marquee');
  WINAMP.preampEl  = document.getElementById('wa-preamp');
  WINAMP.bands     = Array.from(eq.querySelectorAll('.wa-eq-band[data-band]'));

  // ---- audio element (created once; it only plays after a click / tap) ----
  if (!WINAMP.audio) {
    WINAMP.audio = new Audio();
    WINAMP.audio.preload = 'metadata';
    WINAMP.audio.addEventListener('ended', () => {
      if (WINAMP.repeat) { WINAMP.audio.currentTime = 0; WINAMP.audio.play(); }
      else winampNext(true);
    });
  }
  winampSetVolume(WINAMP.volume);

  // ---- dragging, raising and finger sliders (all three panels) ----
  [win, eq, pl].forEach(p => {
    winampDrag(p, p.querySelector('.wa-titlebar'));
    p.addEventListener('pointerdown', winampRaise);
    p.addEventListener('pointerdown', winampSliderDown);
    p.addEventListener('pointermove', winampSliderMove);
    p.addEventListener('pointerup', winampSliderUp);
    p.addEventListener('pointercancel', winampSliderUp);
    p.addEventListener('touchstart', winampSliderTouch, { passive: false });
  });

  // ---- wire controls ----
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  on('wa-min',   () => minimizeWindow('winamp'));
  on('wa-close', () => closeWindow('winamp'));
  on('wa-eq-close', () => winampToggleEq());
  on('wa-pl-close', () => winampTogglePl());

  on('wa-play',  () => winampPlay());
  on('wa-pause', () => winampPause());
  on('wa-stop',  () => winampStop());
  on('wa-prev',  () => winampPrev());
  on('wa-next',  () => winampNext(WINAMP.playing));
  on('wa-eject', () => { winampLoad(0, false); winampStop(); });

  on('wa-time',    () => { WINAMP.remaining = !WINAMP.remaining; });
  on('wa-eq-btn',  () => winampToggleEq());
  on('wa-pl-btn',  () => winampTogglePl());
  on('wa-shuffle', e => { WINAMP.shuffle = !WINAMP.shuffle; e.currentTarget.classList.toggle('wa-on', WINAMP.shuffle); });
  on('wa-repeat',  e => { WINAMP.repeat  = !WINAMP.repeat;  e.currentTarget.classList.toggle('wa-on', WINAMP.repeat); });

  pl.querySelector('.wa-pl-mini').addEventListener('click', e => {
    const b = e.target.closest('[data-wa]');
    if (!b) return;
    const act = b.dataset.wa;
    if (act === 'prev') winampPrev();
    else if (act === 'play') winampPlay();
    else if (act === 'pause') winampPause();
    else if (act === 'stop') winampStop();
    else if (act === 'next') winampNext(WINAMP.playing);
  });

  // Playlist: click selects, double-click plays. js/desktop.js turns a single
  // click / tap on a .wa-pl-row into that double-click, so one tap plays.
  const list = document.getElementById('wa-pl-list');
  list.addEventListener('click', e => {
    const row = e.target.closest('.wa-pl-row');
    if (row) winampSelectRow(+row.dataset.track);
  });
  list.addEventListener('dblclick', e => {
    const row = e.target.closest('.wa-pl-row');
    if (row) winampLoad(+row.dataset.track, true);
  });

  document.getElementById('wa-vol').addEventListener('input', e => winampSetVolume(e.target.value / 100));
  document.getElementById('wa-bal').addEventListener('input', e => { if (WINAMP.panner) WINAMP.panner.pan.value = e.target.value / 100; });
  document.getElementById('wa-seek').addEventListener('input', e => {
    const a = WINAMP.audio;
    if (a.duration) a.currentTime = e.target.value / 1000 * a.duration;
  });

  // EQ controls
  on('wa-eq-on', e => { WINAMP.eqOn = !WINAMP.eqOn; e.currentTarget.classList.toggle('wa-on', WINAMP.eqOn); winampApplyEq(); });
  WINAMP.preampEl.addEventListener('input', () => winampApplyEq());
  WINAMP.bands.forEach(b => b.addEventListener('input', () => winampApplyEq()));

  // ---- init view ----
  winampLoad(WINAMP.current, false);
  winampApplyEq();
  winampUpdatePlayState();
  winampRaise();

  // Phones: fit the panels to the screen now, and again whenever Winamp is
  // restored from the taskbar (its size goes from 0 back to real).
  winampLayout();
  if (WINAMP.ro) WINAMP.ro.disconnect();
  WINAMP.shown = true;
  WINAMP.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    const shown = win.offsetWidth > 0;
    if (shown && !WINAMP.shown) requestAnimationFrame(() => winampLayout());
    WINAMP.shown = shown;
  }) : null;
  if (WINAMP.ro) WINAMP.ro.observe(win);

  if (WINAMP.raf) cancelAnimationFrame(WINAMP.raf);
  WINAMP.raf = requestAnimationFrame(winampTick);
}

// ════════════════════════════════
//  AUDIO GRAPH
// ════════════════════════════════
function winampInitAudio() {
  if (WINAMP.ctx || WINAMP.noWebAudio) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  // A MediaElementSource fed from a file:// page is treated as opaque/cross-origin and
  // outputs SILENCE through the graph (the element advances, but speakers get nothing).
  // So when running from local files we skip Web Audio and play the <audio> directly.
  if (!AC || location.protocol === 'file:') {
    WINAMP.noWebAudio = true;
    if (location.protocol === 'file:') console.warn('[winamp] file:// detected — using direct playback (serve over http for the live spectrum analyzer + EQ).');
    return;
  }
  let ctx, src;
  try {
    ctx = new AC();
    src = ctx.createMediaElementSource(WINAMP.audio);
  } catch (e) {
    console.warn('[winamp] Web Audio unavailable, falling back to direct playback:', e);
    WINAMP.noWebAudio = true;
    return;
  }

  WINAMP.filters = WA_FREQS.map(f => {
    const b = ctx.createBiquadFilter();
    b.type = 'peaking'; b.frequency.value = f; b.Q.value = 1.0; b.gain.value = 0;
    return b;
  });
  WINAMP.preamp = ctx.createGain();
  WINAMP.panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  WINAMP.analyser = ctx.createAnalyser();
  WINAMP.analyser.fftSize = 256;
  WINAMP.analyser.smoothingTimeConstant = 0.78;
  WINAMP.freqData = new Uint8Array(WINAMP.analyser.frequencyBinCount);
  // Volume as a gain node: iOS ignores <audio>.volume.
  WINAMP.volGain = ctx.createGain();

  let node = src;
  WINAMP.filters.forEach(f => { node.connect(f); node = f; });
  node.connect(WINAMP.preamp); node = WINAMP.preamp;
  if (WINAMP.panner) { node.connect(WINAMP.panner); node = WINAMP.panner; }
  node.connect(WINAMP.analyser);
  WINAMP.analyser.connect(WINAMP.volGain);
  WINAMP.volGain.connect(ctx.destination);

  WINAMP.ctx = ctx;
  winampSetVolume(WINAMP.volume);
  const bal = document.getElementById('wa-bal');
  if (bal && WINAMP.panner) WINAMP.panner.pan.value = bal.value / 100;
  winampApplyEq();
}

function winampSetVolume(v) {
  WINAMP.volume = Math.max(0, Math.min(1, v));
  if (WINAMP.volGain) {
    WINAMP.volGain.gain.value = WINAMP.volume;
    if (WINAMP.audio) WINAMP.audio.volume = 1;
  } else if (WINAMP.audio) {
    WINAMP.audio.volume = WINAMP.volume;
  }
}

function winampApplyEq() {
  const on = WINAMP.eqOn;
  if (WINAMP.filters) {
    WINAMP.bands.forEach((s, i) => {
      WINAMP.filters[i].gain.value = on ? (s.value - 50) / 50 * 12 : 0;
    });
    if (WINAMP.preamp) {
      const pdb = on ? (WINAMP.preampEl.value - 50) / 50 * 12 : 0;
      WINAMP.preamp.gain.value = Math.pow(10, pdb / 20);
    }
  }
  winampDrawEqGraph();
}

// ════════════════════════════════
//  TRANSPORT
// ════════════════════════════════
function winampLoad(i, autoplay) {
  const t = WINAMP.tracks[i];
  if (!t) return;
  WINAMP.current = i;
  WINAMP.audio.src = t.file;
  const kb = document.getElementById('wa-kbps'); if (kb) kb.textContent = t.kbps;
  const kz = document.getElementById('wa-khz');  if (kz) kz.textContent = t.khz;
  winampSetMarquee(`${t.num}. ${t.artist} - ${t.title}  (${waFormat(t.dur)})`);
  winampRenderPlaylist();
  if (autoplay) winampPlay();
  else winampUpdatePlayState();
}

// Only ever called from a click / tap, so browsers allow the audio to start.
function winampPlay() {
  winampInitAudio();
  // Resume a suspended graph and start the element in the same gesture
  // (iOS only allows play() inside it); sound flows once the graph resumes.
  if (WINAMP.ctx && WINAMP.ctx.state === 'suspended') {
    const r = WINAMP.ctx.resume();
    if (r && r.catch) r.catch(() => {});
  }
  if (!WINAMP.audio.src) winampLoad(WINAMP.current, false);
  const p = WINAMP.audio.play();
  if (p && p.catch) p.catch(err => console.warn('[winamp] playback was blocked:', err));
  WINAMP.playing = true; WINAMP.started = true;
  winampUpdatePlayState();
}

function winampPause() {
  WINAMP.audio.pause();
  WINAMP.playing = false;
  winampUpdatePlayState();
}

function winampStop() {
  WINAMP.audio.pause();
  WINAMP.audio.currentTime = 0;
  WINAMP.playing = false; WINAMP.started = false;
  winampUpdatePlayState();
}

function winampNext(autoplay) {
  let i;
  if (WINAMP.shuffle) {
    do { i = Math.floor(Math.random() * WINAMP.tracks.length); }
    while (WINAMP.tracks.length > 1 && i === WINAMP.current);
  } else {
    i = (WINAMP.current + 1) % WINAMP.tracks.length;
  }
  winampLoad(i, autoplay);
}

function winampPrev() {
  const i = (WINAMP.current - 1 + WINAMP.tracks.length) % WINAMP.tracks.length;
  winampLoad(i, WINAMP.playing);
}

function winampUpdatePlayState() {
  const t = document.getElementById('wa-time');
  if (t) t.classList.toggle('wa-paused', WINAMP.started && !WINAMP.playing);
  const ind = document.getElementById('wa-playind');
  if (ind) ind.className = 'wa-playind' + (WINAMP.playing ? ' wa-ind-play' : WINAMP.started ? ' wa-ind-pause' : ' wa-ind-stop');
  WINAMP.tracks.forEach((_, i) => {
    const row = document.getElementById('wa-pl-row-' + i);
    if (row) row.classList.toggle('wa-playing', i === WINAMP.current);
  });
}

// ════════════════════════════════
//  PLAYLIST
// ════════════════════════════════
function winampRenderPlaylist() {
  const list = document.getElementById('wa-pl-list');
  if (!list) return;
  list.innerHTML = WINAMP.tracks.map((t, i) => `
    <div class="wa-pl-row${i === WINAMP.current ? ' wa-playing' : ''}" id="wa-pl-row-${i}" data-track="${i}">
      <span class="wa-pl-name">${t.num}. ${escapeHTML(t.artist)} - ${escapeHTML(t.title)}</span>
      <span class="wa-pl-dur">${waFormat(t.dur)}</span>
    </div>`).join('');
  const total = WINAMP.tracks.reduce((a, t) => a + t.dur, 0);
  const el = document.getElementById('wa-pl-total');
  if (el) el.textContent = `${waFormat(WINAMP.audio ? WINAMP.audio.currentTime : 0)} / ${waFormat(total)}`;
}

function winampSelectRow(i) {
  document.querySelectorAll('.wa-pl-row').forEach((r, idx) => r.classList.toggle('wa-selected', idx === i));
}

// ════════════════════════════════
//  PANELS  (show / hide / focus / drag)
// ════════════════════════════════
function winampSetEqVisible(on) {
  WINAMP.eqVisible = on;
  const p = document.getElementById('win-winampeq');
  if (p) p.style.display = on ? '' : 'none';
  const b = document.getElementById('wa-eq-btn');
  if (b) b.classList.toggle('wa-on', on);
}
function winampSetPlVisible(on) {
  WINAMP.plVisible = on;
  const p = document.getElementById('win-winamppl');
  if (p) p.style.display = on ? '' : 'none';
  const b = document.getElementById('wa-pl-btn');
  if (b) b.classList.toggle('wa-on', on);
}
function winampToggleEq() {
  winampSetEqVisible(!WINAMP.eqVisible);
  if (WINAMP.phone) winampLayout(WINAMP.eqVisible ? 'win-winampeq' : null);
}
function winampTogglePl() {
  winampSetPlVisible(!WINAMP.plVisible);
  if (WINAMP.phone) winampLayout(WINAMP.plVisible ? 'win-winamppl' : null);
}

function winampPanels() {
  return WA_PANEL_IDS.map(id => document.getElementById(id)).filter(Boolean);
}
function winampVisiblePanels() {
  return winampPanels().filter(p => p.style.display !== 'none');
}

// Bring all three panels to the front together (only when something else
// is above them, so z-index does not climb on every tap).
function winampRaise() {
  if (!document.getElementById('win-winamp')) return;
  focusWindow('winamp');
  const parts = ['win-winampeq', 'win-winamppl', 'win-winamp'].map(id => document.getElementById(id)).filter(Boolean);
  const onTop = parts.every((p, i) => +p.style.zIndex === windowZIndex - (parts.length - 1 - i));
  if (!onTop) parts.forEach(p => { p.style.zIndex = ++windowZIndex; });
}

// Title-bar drag with pointer capture (mouse, pen and touch). Desktop drags
// one panel; phones drag the whole stack. Always kept inside the desktop.
function winampDrag(panel, handle) {
  let drag = null;
  handle.addEventListener('pointerdown', e => {
    if (e.button > 0 || e.target.closest('.wa-tb-btn')) return;
    const parts = WINAMP.phone ? winampVisiblePanels() : [panel];
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY,
      parts: parts.map(p => ({ p, l: p.offsetLeft, t: p.offsetTop, w: p.offsetWidth, h: p.offsetHeight })),
    };
    try { handle.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  handle.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = getDesktopSize();
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    drag.parts.forEach(o => {
      l = Math.min(l, o.l); t = Math.min(t, o.t);
      r = Math.max(r, o.l + o.w); b = Math.max(b, o.t + o.h);
    });
    const dx = Math.max(-l, Math.min(d.w - r, e.clientX - drag.x));
    const dy = Math.max(-t, Math.min(d.h - b, e.clientY - drag.y));
    drag.parts.forEach(o => {
      o.p.style.left = (o.l + dx) + 'px';
      o.p.style.top  = (o.t + dy) + 'px';
    });
    if (WINAMP.phone) WINAMP.phonePos = { x: l + dx, y: t + dy };
  });
  const end = e => { if (drag && e.pointerId === drag.id) drag = null; };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
}

// ════════════════════════════════
//  PHONE LAYOUT
// ════════════════════════════════
// Best arrangement of the visible panels: one column, or (landscape) the
// player column beside the last panel. Returns { cols, scale }.
function winampPlan(panels, dw, dh) {
  const aw = dw - WA_MARGIN * 2, ah = dh - WA_MARGIN * 2;
  const innerH = p => p.firstElementChild.offsetHeight;
  const colScale = (col, maxS) =>
    Math.min(maxS, (ah - WA_FRAME * col.length) / col.reduce((s, p) => s + innerH(p), 0));

  let best = { cols: [panels], scale: Math.min(WA_MAX_SCALE, colScale(panels, (aw - WA_FRAME) / WA_INNER_W)) };
  if (panels.length > 1) {
    const cols = [panels.slice(0, -1), panels.slice(-1)];
    const maxS = Math.min(WA_MAX_SCALE, (aw - WA_FRAME * 2) / (WA_INNER_W * 2));
    const s = Math.min(colScale(cols[0], maxS), colScale(cols[1], maxS));
    if (s > best.scale + 0.01) best = { cols, scale: s };
  }
  return best;
}

// keep: id of a panel the user just turned on (hidden last if space runs out).
function winampLayout(keep) {
  const main = document.getElementById('win-winamp');
  if (!main || !WINAMP.open) return;
  if (!isPhone()) { if (WINAMP.phone) winampLeavePhone(); return; }
  if (main.style.display === 'none') return; // minimized: laid out again on restore

  WINAMP.phone = true;
  const all = winampPanels();
  all.forEach(p => p.classList.add('wa-scaled'));
  const { w: dw, h: dh } = getDesktopSize();

  // Shrink to fit; if that gets too small, hide the playlist, then the EQ.
  let plan;
  for (;;) {
    const vis = winampVisiblePanels();
    plan = winampPlan(vis, dw, dh);
    if (plan.scale >= WA_MIN_SCALE || vis.length < 2) break;
    const order = keep === 'win-winamppl' ? ['win-winampeq', 'win-winamppl'] : ['win-winamppl', 'win-winampeq'];
    const victim = order.find(id => id !== keep && vis.some(p => p.id === id));
    if (!victim) break;
    if (victim === 'win-winampeq') winampSetEqVisible(false);
    else winampSetPlVisible(false);
  }

  const colW = Math.floor(WA_INNER_W * Math.max(0.3, plan.scale) + WA_FRAME);
  const s = (colW - WA_FRAME) / WA_INNER_W;
  const sized = plan.cols.map(col => col.map(p => ({ p, h: Math.round(p.firstElementChild.offsetHeight * s + WA_FRAME) })));
  const groupW = colW * plan.cols.length;
  const groupH = Math.max.apply(null, sized.map(col => col.reduce((sum, o) => sum + o.h, 0)));

  const pos = WINAMP.phonePos || { x: (dw - groupW) / 2, y: WA_MARGIN };
  const x = Math.round(Math.max(0, Math.min(dw - groupW, pos.x)));
  const y = Math.round(Math.max(0, Math.min(dh - groupH, pos.y)));

  // Hidden panels get the same scale, so they are ready when shown.
  all.forEach(p => {
    p.firstElementChild.style.transform = `scale(${s})`;
    p.style.width = colW + 'px';
  });
  sized.forEach((col, ci) => {
    let top = y;
    col.forEach(o => {
      o.p.style.height = o.h + 'px';
      o.p.style.left = (x + ci * colW) + 'px';
      o.p.style.top = top + 'px';
      top += o.h;
    });
  });
  WINAMP.scale = s;
}

// Back to the desktop: unscaled panels stacked under the player again.
function winampLeavePhone() {
  WINAMP.phone = false;
  WINAMP.phonePos = null;
  const main = document.getElementById('win-winamp');
  const eq = document.getElementById('win-winampeq');
  const pl = document.getElementById('win-winamppl');
  winampPanels().forEach(p => {
    p.classList.remove('wa-scaled');
    p.style.width = '';
    p.style.height = '';
    p.firstElementChild.style.transform = '';
  });
  const { w: dw } = getDesktopSize();
  const x = Math.max(20, Math.round((dw - 350) / 2)), y = 28; // as in WINDOW_DEFS.winamp.getPos
  const h = WINAMP.deskH || { main: main.offsetHeight, eq: eq ? eq.offsetHeight : 0 };
  main.style.left = x + 'px'; main.style.top = y + 'px';
  if (eq) { eq.style.left = x + 'px'; eq.style.top = (y + h.main) + 'px'; }
  if (pl) { pl.style.left = x + 'px'; pl.style.top = (y + h.main + h.eq) + 'px'; }
  if (typeof fitWindow === 'function') fitWindow('winamp', { group: true });
}

// Re-fit after rotation, resize or a phone <-> desktop switch. Runs after the
// window manager's own refit in the same frame (its listener is added first).
let waViewportRaf = 0;
function winampOnViewportChange() {
  if (!WINAMP.open || waViewportRaf) return;
  waViewportRaf = requestAnimationFrame(() => {
    waViewportRaf = 0;
    const d = getDesktopSize();
    if (WINAMP.deskSize && (d.w !== WINAMP.deskSize.w || d.h !== WINAMP.deskSize.h)) WINAMP.phonePos = null;
    WINAMP.deskSize = d;
    winampLayout();
  });
}
window.addEventListener('resize', winampOnViewportChange);
window.addEventListener('orientationchange', () => {
  winampOnViewportChange();
  setTimeout(winampOnViewportChange, 350); // iOS reports the new size late
});
if (window.visualViewport) window.visualViewport.addEventListener('resize', winampOnViewportChange);

// ════════════════════════════════
//  FINGER SLIDERS  (phones)
// ════════════════════════════════
// On phones the panel moves the slider nearest to the finger (tap to jump,
// drag to slide), so the 10px thumbs never have to be hit exactly. The
// range inputs' own touch handling is switched off while that happens.
function winampSliderAt(panel, x, y) {
  let best = null, bestD = Infinity;
  panel.querySelectorAll('input[type="range"]').forEach(s => {
    const r = s.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const vertical = s.classList.contains('wa-eq-band');
    const padX = vertical ? 7 : 4, padY = vertical ? 4 : 9;
    if (x < r.left - padX || x > r.right + padX || y < r.top - padY || y > r.bottom + padY) return;
    const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom);
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = s; }
  });
  return best;
}

function winampSliderSet(s, x, y) {
  const r = s.getBoundingClientRect();
  const vertical = s.classList.contains('wa-eq-band');
  const k = vertical ? r.height / (s.offsetHeight || r.height) : r.width / (s.offsetWidth || r.width);
  const thumb = (vertical ? 6 : s.id === 'wa-seek' ? 24 : 10) * k;
  const len = (vertical ? r.height : r.width) - thumb;
  let t = vertical ? (r.bottom - thumb / 2 - y) / len : (x - r.left - thumb / 2) / len;
  t = Math.max(0, Math.min(1, t));
  const min = +s.min, max = +s.max;
  const v = Math.round(min + t * (max - min));
  if (+s.value !== v) {
    s.value = v;
    s.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function winampSliderDown(e) {
  if (!document.body.classList.contains('is-phone') || e.button > 0) return;
  if (e.target.closest('button, .wa-tg, .wa-titlebar, .wa-pl-row, .wa-pl-btn, .wa-pl-opts, .wa-time')) return;
  const panel = e.currentTarget;
  const s = winampSliderAt(panel, e.clientX, e.clientY);
  if (!s) return;
  e.preventDefault();
  try { panel.setPointerCapture(e.pointerId); } catch (err) {}
  WINAMP.slide = { id: e.pointerId, s };
  WINAMP.seeking = s.id === 'wa-seek';
  winampSliderSet(s, e.clientX, e.clientY);
}
function winampSliderTouch(e) {
  if (WINAMP.slide && e.cancelable) e.preventDefault();
}
function winampSliderMove(e) {
  const d = WINAMP.slide;
  if (!d || e.pointerId !== d.id) return;
  winampSliderSet(d.s, e.clientX, e.clientY);
}
function winampSliderUp(e) {
  const d = WINAMP.slide;
  if (!d || e.pointerId !== d.id) return;
  WINAMP.slide = null;
  WINAMP.seeking = false;
}

function winampCleanup() {
  WINAMP.open = false;
  if (WINAMP.raf) { cancelAnimationFrame(WINAMP.raf); WINAMP.raf = null; }
  if (WINAMP.ro) { WINAMP.ro.disconnect(); WINAMP.ro = null; }
  if (WINAMP.audio) { WINAMP.audio.pause(); }
  WINAMP.playing = false; WINAMP.started = false;
  WINAMP.phone = false; WINAMP.phonePos = null; WINAMP.slide = null; WINAMP.seeking = false;
  ['win-winampeq', 'win-winamppl'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });
}

// ════════════════════════════════
//  RENDER LOOP
// ════════════════════════════════
function winampTick() {
  if (!WINAMP.open) return;
  winampDrawSpectrum();
  winampUpdateTime();
  winampScrollMarquee();
  WINAMP.raf = requestAnimationFrame(winampTick);
}

function winampUpdateTime() {
  const a = WINAMP.audio;
  const timeEl = document.getElementById('wa-time');
  if (timeEl) {
    let val = a.currentTime || 0;
    if (WINAMP.remaining && a.duration) timeEl.textContent = '-' + waFormatLCD(a.duration - val);
    else timeEl.textContent = waFormatLCD(val);
  }
  const seek = document.getElementById('wa-seek');
  if (seek && a.duration && !WINAMP.seeking && document.activeElement !== seek) {
    seek.value = (a.currentTime / a.duration * 1000) | 0;
  }
  const total = document.getElementById('wa-pl-total');
  if (total) {
    const sum = WINAMP.tracks.reduce((acc, t) => acc + t.dur, 0);
    total.textContent = `${waFormat(a.currentTime)} / ${waFormat(sum)}`;
  }
  // stereo indicator follows playback
  const st = document.getElementById('wa-stereo');
  if (st) st.classList.toggle('wa-on', WINAMP.playing);
}

function winampSetMarquee(text) {
  if (WINAMP.marqueeEl) WINAMP.marqueeEl.textContent = text;
  WINAMP.mx = 0;
}

function winampScrollMarquee() {
  const s = WINAMP.marqueeEl;
  if (!s) return;
  const cont = s.parentElement;
  if (s.scrollWidth > cont.clientWidth + 4) {
    WINAMP.mx += 0.4;
    if (WINAMP.mx > s.scrollWidth) WINAMP.mx = -cont.clientWidth;
    s.style.transform = `translateX(${-WINAMP.mx}px)`;
  } else {
    s.style.transform = '';
  }
}

function winampDrawSpectrum() {
  const cv = WINAMP.visCanvas;
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 76, H = 38, N = 19;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const data = WINAMP.freqData;
  if (WINAMP.analyser) WINAMP.analyser.getByteFrequencyData(data);
  if (!WINAMP.simBars) WINAMP.simBars = new Array(N).fill(0);

  const grad = ctx.createLinearGradient(0, H, 0, 0);
  grad.addColorStop(0, '#1f8f24');
  grad.addColorStop(0.5, '#54d72e');
  grad.addColorStop(0.8, '#e7d22a');
  grad.addColorStop(1, '#e23b2a');

  for (let i = 0; i < N; i++) {
    let v = 0;
    if (WINAMP.analyser) {
      const lo = Math.floor(i / N * 96);
      const hi = Math.max(lo + 1, Math.floor((i + 1) / N * 96));
      let s = 0;
      for (let b = lo; b < hi; b++) s += data[b];
      v = (s / (hi - lo)) / 255;
      v = Math.pow(v, 0.85);
    } else if (WINAMP.playing) {
      // No real FFT (direct-playback / file:// mode): simulated bass-weighted bounce.
      const target = Math.max(0, 0.9 - (i / N) * 0.55) * (0.3 + Math.random() * 0.7);
      WINAMP.simBars[i] += (target - WINAMP.simBars[i]) * 0.35;
      v = WINAMP.simBars[i];
    } else {
      WINAMP.simBars[i] *= 0.8;
      v = WINAMP.simBars[i];
    }
    const h = Math.min(H, v * H * 1.15);
    const x = i * 4 + 1, w = 3;
    ctx.fillStyle = grad;
    ctx.fillRect(x, H - h, w, h);

    let pk = WINAMP.peaks[i] || 0;
    if (h >= pk) pk = h; else pk = Math.max(0, pk - 0.7);
    WINAMP.peaks[i] = pk;
    if (pk > 1) { ctx.fillStyle = '#9affa0'; ctx.fillRect(x, H - pk - 1, w, 1); }
  }
}

function winampDrawEqGraph() {
  const cv = document.getElementById('wa-eq-graph');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const W = 110, H = 38, mid = H / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // center line
  ctx.strokeStyle = '#114a11';
  ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

  const pre = (WINAMP.preampEl ? (WINAMP.preampEl.value - 50) / 50 : 0);
  const pts = WINAMP.bands.map((s, i) => {
    const v = (s.value - 50) / 50 + pre * 0.5;        // -1.5 .. 1.5
    const x = (i + 0.5) / WINAMP.bands.length * W;
    const y = mid - Math.max(-1, Math.min(1, v)) * (mid - 3);
    return [x, y];
  });

  ctx.strokeStyle = '#18e018';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) ctx.moveTo(0, p[1]);
    ctx.lineTo(p[0], p[1]);
    if (i === pts.length - 1) ctx.lineTo(W, p[1]);
  });
  ctx.stroke();
}
