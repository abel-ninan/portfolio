// ════════════════════════════════
//  WINAMP  (classic 2.x player)
// ════════════════════════════════
const WINAMP = {
  open: false,
  ctx: null, audio: null, analyser: null, freqData: null,
  filters: null, preamp: null, panner: null,
  current: 3, playing: false, started: false,
  remaining: false,            // time display mode
  shuffle: false, repeat: false, eqOn: true,
  eqVisible: true, plVisible: true,
  peaks: [], mx: 0,
  visCanvas: null, marqueeEl: null,
  bands: [], preampEl: null,
  raf: null,
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

  win.classList.add('wa-focused');
  win.innerHTML = `
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP</div>
      <div class="wa-tb-btns">
        <button class="wa-tb-btn" title="Minimize" onclick="minimizeWindow('winamp')">${WA_GLYPH.min}</button>
        <button class="wa-tb-btn" title="Close" onclick="closeWindow('winamp')">${WA_GLYPH.close}</button>
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
        <input type="range" class="wa-slider wa-vol" id="wa-vol" min="0" max="100" value="80">
        <input type="range" class="wa-slider wa-bal" id="wa-bal" min="-100" max="100" value="0">
      </div>
      <div class="wa-toggles">
        <span class="wa-tg wa-on" id="wa-eq-btn">EQ</span>
        <span class="wa-tg wa-on" id="wa-pl-btn">PL</span>
        <span class="wa-spacer"></span>
        <span class="wa-tg" id="wa-shuffle">SHUFFLE</span>
        <span class="wa-tg" id="wa-repeat">REPEAT</span>
      </div>
      <input type="range" class="wa-slider wa-seek" id="wa-seek" min="0" max="1000" value="0">
      <div class="wa-transport">
        <button class="wa-tp" id="wa-prev"  title="Previous">${WA_GLYPH.prev}</button>
        <button class="wa-tp" id="wa-play"  title="Play">${WA_GLYPH.play}</button>
        <button class="wa-tp" id="wa-pause" title="Pause">${WA_GLYPH.pause}</button>
        <button class="wa-tp" id="wa-stop"  title="Stop">${WA_GLYPH.stop}</button>
        <button class="wa-tp" id="wa-next"  title="Next">${WA_GLYPH.next}</button>
        <button class="wa-tp wa-eject" id="wa-eject" title="Eject">${WA_GLYPH.eject}</button>
        <div class="wa-logo" title="Winamp"></div>
      </div>
    </div>`;

  const desktop = document.getElementById('desktop');
  const baseLeft = win.offsetLeft;
  let stackTop = win.offsetTop + win.offsetHeight;

  // ---- Equalizer panel ----
  const eq = document.createElement('div');
  eq.className = 'winamp wa-focused';
  eq.id = 'win-winampeq';
  eq.style.cssText = `left:${baseLeft}px;top:${stackTop}px;`;
  eq.innerHTML = `
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP EQUALIZER</div>
      <div class="wa-tb-btns"><button class="wa-tb-btn" title="Close" onclick="winampToggleEq()">${WA_GLYPH.close}</button></div>
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
          <input type="range" class="wa-eq-band" id="wa-preamp" min="0" max="100" value="50">
          <span class="wa-eq-lbl">PREAMP</span>
        </div>
        <div class="wa-eq-gap"></div>
        ${WA_FREQS.map((f, i) => `
          <div class="wa-eq-col">
            <input type="range" class="wa-eq-band" data-band="${i}" min="0" max="100" value="50">
            <span class="wa-eq-lbl">${WA_LABELS[i]}</span>
          </div>`).join('')}
      </div>
    </div>`;
  desktop.appendChild(eq);
  stackTop += eq.offsetHeight;

  // ---- Playlist panel ----
  const pl = document.createElement('div');
  pl.className = 'winamp wa-focused';
  pl.id = 'win-winamppl';
  pl.style.cssText = `left:${baseLeft}px;top:${stackTop}px;`;
  pl.innerHTML = `
    <div class="wa-titlebar">
      <div class="wa-title">WINAMP PLAYLIST</div>
      <div class="wa-tb-btns"><button class="wa-tb-btn" title="Close" onclick="winampTogglePl()">${WA_GLYPH.close}</button></div>
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
          <button class="wa-pl-mtp" onclick="winampPrev()" title="Previous">${WA_GLYPH.prev}</button>
          <button class="wa-pl-mtp" onclick="winampPlay()" title="Play">${WA_GLYPH.play}</button>
          <button class="wa-pl-mtp" onclick="winampPause()" title="Pause">${WA_GLYPH.pause}</button>
          <button class="wa-pl-mtp" onclick="winampStop()" title="Stop">${WA_GLYPH.stop}</button>
          <button class="wa-pl-mtp" onclick="winampNext(WINAMP.playing)" title="Next">${WA_GLYPH.next}</button>
        </span>
        <span class="wa-pl-opts">LIST<br>OPTS</span>
      </div>
    </div>`;
  desktop.appendChild(pl);

  // ---- refs ----
  WINAMP.visCanvas = win.querySelector('.wa-vis');
  WINAMP.marqueeEl = document.getElementById('wa-marquee');
  WINAMP.preampEl  = document.getElementById('wa-preamp');
  WINAMP.bands     = Array.from(eq.querySelectorAll('.wa-eq-band[data-band]'));

  // ---- audio element (created once) ----
  if (!WINAMP.audio) {
    WINAMP.audio = new Audio();
    WINAMP.audio.preload = 'metadata';
    WINAMP.audio.addEventListener('ended', () => {
      if (WINAMP.repeat) { WINAMP.audio.currentTime = 0; WINAMP.audio.play(); }
      else winampNext(true);
    });
  }
  WINAMP.audio.volume = 0.8;

  // ---- dragging (all three raise together) ----
  winampDrag(win, win.querySelector('.wa-titlebar'));
  winampDrag(eq,  eq.querySelector('.wa-titlebar'));
  winampDrag(pl,  pl.querySelector('.wa-titlebar'));

  // ---- wire controls ----
  win.querySelector('#wa-play').onclick  = () => winampPlay();
  win.querySelector('#wa-pause').onclick = () => winampPause();
  win.querySelector('#wa-stop').onclick  = () => winampStop();
  win.querySelector('#wa-prev').onclick  = () => winampPrev();
  win.querySelector('#wa-next').onclick  = () => winampNext(WINAMP.playing);
  win.querySelector('#wa-eject').onclick = () => { winampLoad(0, false); winampStop(); };

  win.querySelector('#wa-time').onclick = () => { WINAMP.remaining = !WINAMP.remaining; };
  win.querySelector('#wa-eq-btn').onclick = () => winampToggleEq();
  win.querySelector('#wa-pl-btn').onclick = () => winampTogglePl();
  win.querySelector('#wa-shuffle').onclick = (e) => { WINAMP.shuffle = !WINAMP.shuffle; e.target.classList.toggle('wa-on', WINAMP.shuffle); };
  win.querySelector('#wa-repeat').onclick  = (e) => { WINAMP.repeat  = !WINAMP.repeat;  e.target.classList.toggle('wa-on', WINAMP.repeat); };

  win.querySelector('#wa-vol').oninput = (e) => { WINAMP.audio.volume = e.target.value / 100; };
  win.querySelector('#wa-bal').oninput = (e) => { if (WINAMP.panner) WINAMP.panner.pan.value = e.target.value / 100; };
  const seek = win.querySelector('#wa-seek');
  seek.oninput = (e) => { const a = WINAMP.audio; if (a.duration) a.currentTime = e.target.value / 1000 * a.duration; };

  // EQ controls
  document.getElementById('wa-eq-on').onclick = (e) => { WINAMP.eqOn = !WINAMP.eqOn; e.target.classList.toggle('wa-on', WINAMP.eqOn); winampApplyEq(); };
  WINAMP.preampEl.oninput = () => winampApplyEq();
  WINAMP.bands.forEach(b => b.oninput = () => winampApplyEq());

  // ---- init view ----
  winampLoad(WINAMP.current, false);
  winampApplyEq();
  winampUpdatePlayState();
  winampRaise();

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

  let node = src;
  WINAMP.filters.forEach(f => { node.connect(f); node = f; });
  node.connect(WINAMP.preamp); node = WINAMP.preamp;
  if (WINAMP.panner) { node.connect(WINAMP.panner); node = WINAMP.panner; }
  node.connect(WINAMP.analyser);
  WINAMP.analyser.connect(ctx.destination);

  WINAMP.ctx = ctx;
  winampApplyEq();
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

function winampPlay() {
  winampInitAudio();
  const start = () => {
    if (!WINAMP.audio.src) winampLoad(WINAMP.current, false);
    const p = WINAMP.audio.play();
    if (p && p.catch) p.catch(err => console.warn('[winamp] playback was blocked:', err));
    WINAMP.playing = true; WINAMP.started = true;
    winampUpdatePlayState();
  };
  // Resume the context BEFORE playing — feeding a suspended graph yields silence.
  if (WINAMP.ctx && WINAMP.ctx.state === 'suspended') WINAMP.ctx.resume().then(start, start);
  else start();
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
    <div class="wa-pl-row${i === WINAMP.current ? ' wa-playing' : ''}" id="wa-pl-row-${i}"
         onclick="winampSelectRow(${i})" ondblclick="winampLoad(${i}, true)">
      <span class="wa-pl-name">${t.num}. ${t.artist} - ${t.title}</span>
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
function winampToggleEq() {
  WINAMP.eqVisible = !WINAMP.eqVisible;
  const p = document.getElementById('win-winampeq');
  if (p) p.style.display = WINAMP.eqVisible ? '' : 'none';
  const b = document.getElementById('wa-eq-btn');
  if (b) b.classList.toggle('wa-on', WINAMP.eqVisible);
}
function winampTogglePl() {
  WINAMP.plVisible = !WINAMP.plVisible;
  const p = document.getElementById('win-winamppl');
  if (p) p.style.display = WINAMP.plVisible ? '' : 'none';
  const b = document.getElementById('wa-pl-btn');
  if (b) b.classList.toggle('wa-on', WINAMP.plVisible);
}

function winampRaise() {
  focusWindow('winamp');
  ['win-winamp', 'win-winampeq', 'win-winamppl'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.zIndex = ++windowZIndex;
  });
}

function winampDrag(win, handle) {
  let sx, sy, sl, st, drag = false;
  const down = (cx, cy) => { drag = true; sx = cx; sy = cy; sl = win.offsetLeft; st = win.offsetTop; winampRaise(); };
  const move = (cx, cy) => {
    if (!drag) return;
    const d = document.getElementById('desktop');
    win.style.left = Math.max(0, Math.min(d.offsetWidth  - win.offsetWidth,  sl + cx - sx)) + 'px';
    win.style.top  = Math.max(0, Math.min(d.offsetHeight - win.offsetHeight, st + cy - sy)) + 'px';
  };
  handle.addEventListener('mousedown', e => { if (e.target.closest('.wa-tb-btn')) return; down(e.clientX, e.clientY); e.preventDefault(); });
  handle.addEventListener('touchstart', e => { if (e.target.closest('.wa-tb-btn')) return; down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  document.addEventListener('mousemove', e => move(e.clientX, e.clientY));
  document.addEventListener('touchmove', e => { if (drag) move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  document.addEventListener('mouseup', () => { drag = false; });
  document.addEventListener('touchend', () => { drag = false; });
  win.addEventListener('mousedown', winampRaise);
}

function winampCleanup() {
  WINAMP.open = false;
  if (WINAMP.raf) { cancelAnimationFrame(WINAMP.raf); WINAMP.raf = null; }
  if (WINAMP.audio) { WINAMP.audio.pause(); }
  WINAMP.playing = false; WINAMP.started = false;
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
  if (seek && a.duration && document.activeElement !== seek) {
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
