// Sound. Music, the Host, heartbeats and stings are synthesised; rain, the river, footsteps, doors,
// cloth and paper are short CC0 recordings (assets/audio, see CREDITS.md) layered over the synthesis.
// Every recorded sound has a procedural fallback, so the game sounds whole before (or without) them.
// Each scene sets the acoustics of its space (setSpace), the things in it that make a sound where they
// are (setEmitters: a fire, a grindstone, a clock), and the city beyond it (setCity: cabs going past,
// a far bell, a steamer on the river). Sounds with a place are panned and faded against the listener,
// who is Thomas.

const STEPS = {
  stone: ['step_stone0', 'step_stone1', 'step_stone2', 'step_stone3', 'step_stone4'],
  wood: ['step_wood0', 'step_wood1', 'step_wood2', 'step_wood3', 'step_wood4'],
  mud: ['step_mud0', 'step_mud1', 'step_mud2', 'step_mud3'],
};
const SAMPLES = ['rain', 'storm', 'river', 'step_gravel', ...STEPS.stone, ...STEPS.wood, ...STEPS.mud, 'door_open', 'door_close', 'creak1', 'creak2', 'creak3', 'cloth1', 'cloth2', 'leather',
  'book_open', 'book_close', 'book_flip1', 'book_flip2', 'latch', 'metal_click', 'knife'];
import { prefs } from './prefs.js';
import { buzz } from './haptics.js';

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.beds = {};
    this.music = null;
    this.muted = false;
  }

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = 0.9 * prefs.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    // everything sends to this bus; the space's convolver behind it is swapped as scenes change
    this.reverb = ctx.createGain();
    this.wet = ctx.createGain(); this.wet.gain.value = 0.45;
    this.wet.connect(this.master);
    this.listener = 0;
    this.setSpace(this.wantSpace || 'street', 0.01);
    this.noise = this.noiseBuffer(4);
    this.brown = this.noiseBuffer(4, true);
    this.loadSamples();
    // whatever the scene asked for before the first click can start now
    if (this.wantBeds) this.setBeds(this.wantBeds, 1.5);
    if (this.wantMusic) this.playMusic(this.wantMusic);
    if (this.wantEmitters) this.setEmitters(this.wantEmitters);
    if (this.wantCity) this.setCity(this.wantCity);
  }

  setVolume(v) {
    if (this.ctx) this.master.gain.setTargetAtTime(0.9 * v, this.ctx.currentTime, 0.05);
  }

  // ------------------------------------------------------------ recordings
  loadSamples() {
    this.samples = {};
    this._waiting = {};
    const embedded = window.__SAMPLES || {};
    for (const n of SAMPLES) {
      // the single-file build carries them as data URIs, decoded here so no fetch policy can block them
      const data = embedded[n];
      const bytes = data
        ? Promise.resolve(Uint8Array.from(atob(data.slice(data.indexOf(',') + 1)), (c) => c.charCodeAt(0)).buffer)
        : fetch(`assets/audio/${n}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)));
      bytes
        .then((b) => this.ctx.decodeAudioData(b))
        .then((buf) => { this.samples[n] = buf; (this._waiting[n] || []).forEach((f) => f(buf)); delete this._waiting[n]; })
        .catch(() => {});
    }
  }

  // run `fn(buffer)` as soon as a recording is ready (now, if it already is)
  whenSample(n, fn) {
    if (this.samples?.[n]) fn(this.samples[n]);
    else if (this._waiting) (this._waiting[n] ||= []).push(fn);
  }

  // a one-shot recording; returns false when it is not loaded so callers can fall back
  play(n, { vol = 0.5, rate = 1, rev = 0.15, delay = 0, pan = 0 } = {}) {
    const buf = this.ctx && this.samples?.[n];
    if (!buf) return false;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
    const g = ctx.createGain(); g.gain.value = vol;
    let out = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p; }
    s.connect(g); out.connect(this.master);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; out.connect(r).connect(this.reverb); }
    s.start(t);
    return true;
  }

  // a looping recording feeding a bed; the loop points skip the codec's padding at both ends
  loopSample(n, target, vol, { rate = 1, filter = null } = {}) {
    this.whenSample(n, (buf) => {
      const ctx = this.ctx;
      const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate;
      const pad = Math.min(0.03, buf.duration / 4);
      s.loopStart = pad; s.loopEnd = buf.duration - pad;
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + 1.5);
      if (filter) s.connect(filter).connect(g); else s.connect(g);
      g.connect(target);
      s.start(0, pad + Math.random() * buf.duration * 0.8);
    });
  }

  pick(names) { return names[Math.floor(Math.random() * names.length)]; }

  noiseBuffer(sec, brown = false) {
    const ctx = this.ctx, n = ctx.sampleRate * sec;
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
    }
    return b;
  }

  // A room's answer: noise dying away, with an early slap off the nearest wall and the high end
  // soaked up by soft rooms (damp 0..1).
  impulse(sec, decay, { slap = 0, damp = 0 } = {}) {
    const ctx = this.ctx, n = ctx.sampleRate * sec;
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const v = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
        lp += (v - lp) * (1 - damp * 0.85);
        d[i] = lp;
      }
      if (slap) {
        const at = Math.floor(slap * ctx.sampleRate) + ch * 37;
        for (let k = 0; k < 90 && at + k < n; k++) d[at + k] += (Math.random() * 2 - 1) * 0.55 * (1 - k / 90);
      }
    }
    return b;
  }

  // ------------------------------------------------------------ continuous beds
  bed(name, level, fadeSec = 2) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (!this.beds[name]) {
      if (level <= 0) return;
      this.beds[name] = this.makeBed(name);
    }
    const g = this.beds[name].gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(level, now + fadeSec);
  }

  setBeds(map, fadeSec = 2) {
    this.wantBeds = map;
    for (const k of Object.keys(this.beds)) if (!(k in map)) this.bed(k, 0, fadeSec);
    for (const [k, v] of Object.entries(map)) this.bed(k, v, fadeSec);
  }

  makeBed(name) {
    const ctx = this.ctx;
    const gain = ctx.createGain(); gain.gain.value = 0;
    gain.connect(this.master);
    const src = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 3); return s; };
    const lfo = (freq, amt, target) => { const o = ctx.createOscillator(); o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = amt; o.connect(g).connect(target); o.start(); return o; };
    if (name === 'rain') {
      const s = src(this.noise);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.value = 0.16;
      s.connect(hp).connect(lp).connect(g).connect(gain);
      this.whenSample('rain', () => g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2));
      this.loopSample('rain', gain, 0.75);
      this.loopSample('storm', gain, 0.28);
      // gutter drip layer
      const s2 = src(this.brown);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 400; bp.Q.value = 0.7;
      const g2 = ctx.createGain(); g2.gain.value = 0.25;
      s2.connect(bp).connect(g2).connect(gain);
    } else if (name === 'wind') {
      const s = src(this.noise);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 1.4;
      lfo(0.07, 220, bp.frequency);
      const g = ctx.createGain(); g.gain.value = 0.22;
      lfo(0.11, 0.12, g.gain);
      s.connect(bp).connect(g).connect(gain);
    } else if (name === 'river') {
      const s = src(this.brown);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520;
      const g = ctx.createGain(); g.gain.value = 0.5;
      lfo(0.18, 0.25, g.gain);
      s.connect(lp).connect(g).connect(gain);
      const s2 = src(this.noise);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3;
      const g2 = ctx.createGain(); g2.gain.value = 0.03; lfo(0.4, 0.03, g2.gain);
      s2.connect(bp).connect(g2).connect(gain);
      // water lapping at the piles, slowed and darkened so its short loop does not tick
      const wlp = ctx.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 1400;
      this.loopSample('river', gain, 0.22, { rate: 0.8, filter: wlp });
    } else if (name === 'room') {
      const s = src(this.brown);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = 0.35;
      s.connect(lp).connect(g).connect(gain);
      const o = ctx.createOscillator(); o.frequency.value = 50; const og = ctx.createGain(); og.gain.value = 0.012;
      o.connect(og).connect(gain); o.start();
      // an old house settling: a board creaks somewhere, now and then
      const timer = setInterval(() => {
        const v = gain.gain.value;
        if (v > 0.05 && Math.random() < 0.35) this.play(this.pick(['creak1', 'creak2', 'creak3']), { vol: Math.min(0.3, v * 0.35), rate: 0.8 + Math.random() * 0.3, rev: 0.6, pan: Math.random() * 1.6 - 0.8 });
      }, 7000);
      return { gain, timer };
    } else if (name === 'crowd') {
      const s = src(this.noise);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.9;
      const g = ctx.createGain(); g.gain.value = 0.12; lfo(0.6, 0.06, g.gain); lfo(0.23, 0.05, g.gain);
      s.connect(bp).connect(g).connect(gain);
    } else if (name === 'drone') {
      // the Host: a low cluster that beats against itself
      const freqs = [41.2, 43.65, 61.7, 82.4 * 1.007];
      freqs.forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160 + i * 40; lfo(0.03 + i * 0.01, 60, lp.frequency);
        const g = ctx.createGain(); g.gain.value = 0.07;
        o.connect(lp).connect(g).connect(gain); o.start();
      });
      const s = src(this.noise);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 8; lfo(0.05, 900, bp.frequency);
      const g = ctx.createGain(); g.gain.value = 0.025;
      s.connect(bp).connect(g).connect(gain); g.connect(this.reverb);
    } else if (name === 'heart') {
      const timer = setInterval(() => { if (gain.gain.value > 0.01) this.heartbeat(gain.gain.value); }, 1050);
      return { gain, timer };
    }
    return { gain };
  }

  // ------------------------------------------------------------ music
  // Three scored moods, scheduled on the audio clock:
  //   dread  : bowed strings moving through Am - F - Dm - E, with a glassy harmonic now and then
  //   memory : an out-of-tune music box playing Nat's tune, slowing down like a spring running out
  //   chase  : a pulse, ticking metal and string stabs a semitone apart
  playMusic(mood) {
    this.wantMusic = mood;
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (this.music) {
      clearInterval(this.music.timer);
      const old = this.music.bus;
      old.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.setValueAtTime(old.gain.value, ctx.currentTime);
      old.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
      setTimeout(() => old.disconnect(), 3000);
      this.music = null;
    }
    if (!mood) return;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    bus.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.8; bus.connect(send).connect(this.reverb);
    const stepDur = mood === 'dread' ? 8 : mood === 'memory' ? 0.42 : 60 / 140 / 2;
    let next = ctx.currentTime + 0.15, step = 0;
    const timer = setInterval(() => {
      while (next < ctx.currentTime + 0.8) {
        if (mood === 'dread') this.dreadStep(bus, step, next, stepDur);
        else if (mood === 'memory') next += this.memoryStep(bus, step, next) - stepDur;
        else this.chaseStep(bus, step, next);
        next += stepDur; step++;
      }
    }, 120);
    this.music = { timer, bus };
  }

  strings(bus, freqs, t, dur, vol = 0.028) {
    const ctx = this.ctx;
    for (const f of freqs) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
      g.gain.linearRampToValueAtTime(vol * 0.8, t + dur * 0.8);
      g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.5);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700 + f; lp.Q.value = 0.7;
      g.connect(lp).connect(bus);
      for (const d of [-0.004, 0.005]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * (1 + d);
        const vib = ctx.createOscillator(); vib.frequency.value = 4.6 + Math.random(); const vg = ctx.createGain(); vg.gain.value = f * 0.004;
        vib.connect(vg).connect(o.frequency);
        o.connect(g); o.start(t); o.stop(t + dur + 1.6); vib.start(t); vib.stop(t + dur + 1.6);
      }
    }
  }

  dreadStep(bus, step, t, dur) {
    const chords = [
      [110, 130.8, 164.8],   // A minor
      [87.3, 130.8, 174.6],  // F
      [73.4, 110, 174.6],    // D minor
      [82.4, 123.5, 207.7],  // E major: the leading tone that never resolves
    ];
    const c = chords[step % chords.length];
    this.strings(bus, c, t, dur);
    this.strings(bus, [c[0] / 2], t, dur, 0.04);
    if (step % 2 === 1) {
      const ctx = this.ctx, f = c[2] * 4;
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 2); g.gain.linearRampToValueAtTime(0.012, t + 4); g.gain.linearRampToValueAtTime(0.0001, t + 7.5);
      const tr = ctx.createOscillator(); tr.frequency.value = 6; const tg = ctx.createGain(); tg.gain.value = 0.006; tr.connect(tg).connect(g.gain);
      o.connect(g).connect(bus); o.start(t + 2); o.stop(t + 8); tr.start(t + 2); tr.stop(t + 8);
    }
  }

  // returns the duration of this note so the box can slow down
  memoryStep(bus, step, t) {
    const N = { E4: 329.6, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, G5: 784, A5: 880 };
    const tune = [
      ['A4', 1], ['C5', 1], ['E5', 1], ['A5', 2], ['G5', 1], ['E5', 1], ['C5', 1], ['D5', 2],
      ['E5', 1], ['D5', 1], ['C5', 1], ['B4', 1], ['C5', 1], ['A4', 2], ['E4', 1], ['G4', 1], ['A4', 3], [null, 4],
    ];
    const [n, beats] = tune[step % tune.length];
    const loop = Math.floor(step / tune.length);
    const beat = 0.42 * (1 + (step % tune.length) * 0.012 + loop * 0.05); // the spring winds down
    if (n) {
      const ctx = this.ctx, f = N[n] * (1 + (Math.random() - 0.5) * 0.01) * (1 - loop * 0.004);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      g.connect(bus);
      [[1, 1], [3.0, 0.25], [5.4, 0.08]].forEach(([h, a]) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * h;
        const og = ctx.createGain(); og.gain.value = a; o.connect(og).connect(g); o.start(t); o.stop(t + 1.7);
      });
      if (step % 4 === 0) this.strings(bus, [N[n] / 4], t, beat * 4, 0.012);
    }
    return beats * beat;
  }

  chaseStep(bus, step, t) {
    const ctx = this.ctx;
    const s = step % 16;
    if (s === 0 || s === 3 || s === 6 || s === 10 || s === 12) {
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.32);
    }
    // ticking metal
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const hg = ctx.createGain(); hg.gain.setValueAtTime(0.0001, t); hg.gain.exponentialRampToValueAtTime(s % 2 ? 0.025 : 0.05, t + 0.002); hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(hp).connect(hg).connect(bus); src.start(t, Math.random()); src.stop(t + 0.06);
    if (s === 0) this.strings(bus, [110, 116.5], t, 1.6, 0.03);
    if (s === 8) this.strings(bus, [155.6, 164.8], t, 1.2, 0.026);
  }

  piano(freq, vol = 0.1) {
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0008, t + 4.5);
    g.connect(this.master); g.connect(this.reverb);
    [1, 2.003, 3.01, 4.2].forEach((h, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * h * (1 + (Math.random() - 0.5) * 0.004);
      const og = ctx.createGain(); og.gain.value = [1, 0.4, 0.15, 0.06][i];
      o.connect(og).connect(g); o.start(t); o.stop(t + 5);
    });
  }

  // ------------------------------------------------------------ one-shots
  env(node, t, a, peak, d) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  noiseHit({ freq = 800, q = 1, type = 'bandpass', vol = 0.3, a = 0.005, d = 0.12, rev = 0.2, buf, pan = 0, dest = null, at = 0 } = {}) {
    if (!this.ctx || vol <= 0.0002) return;
    const ctx = this.ctx, t = ctx.currentTime + at;
    const s = ctx.createBufferSource(); s.buffer = buf || this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); this.env(g, t, a, vol, d);
    let out = s.connect(f).connect(g);
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; out = out.connect(p); }
    out.connect(dest || this.master);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; out.connect(r).connect(this.reverb); }
    s.start(t, Math.random() * 2); s.stop(t + a + d + 0.1);
  }

  // How a sound at x reaches Thomas: fainter with distance, panned to its side. x null: here.
  spatial(x, reach = 1100) {
    if (x == null) return { gain: 1, pan: 0 };
    const dx = x - this.listener, k = Math.max(0, 1 - Math.abs(dx) / reach);
    return { gain: Math.pow(k, 1.4), pan: Math.max(-0.85, Math.min(0.85, dx / 700)) };
  }

  // a footfall: never the same recording twice in a row, a little pitch and level drift, lighter for a child
  // gain and pan place it: someone else's steps, further off (see spatial)
  step(surface = 'stone', weight = 1, { gain = 1, pan = 0 } = {}) {
    if (gain < 0.02) return;
    const set = STEPS[surface] || STEPS.stone;
    let pick = this.pick(set);
    if (pick === this._lastStep) pick = set[(set.indexOf(pick) + 1) % set.length];
    this._lastStep = pick;
    const r = (0.92 + Math.random() * 0.16) * (weight < 0.8 ? 1.12 : 1), v = (0.85 + Math.random() * 0.3) * Math.min(1, weight + 0.15) * gain;
    if (surface === 'mud' && this.play(pick, { vol: 0.6 * v, rate: r, rev: 0.05, pan })) {
      // the wet suck as the boot comes out of the mud
      this.noiseHit({ freq: 320, q: 0.9, vol: 0.07 * v, a: 0.04, d: 0.2, type: 'lowpass', buf: this.brown, rev: 0.03, pan });
      return;
    }
    if (surface === 'wood' && this.play(pick, { vol: 0.3 * v, rate: r, rev: 0.2, pan })) return;
    if (surface !== 'wood' && surface !== 'mud' && this.play(pick, { vol: 0.42 * v, rate: r, rev: 0.25, pan })) {
      if (Math.random() < 0.25) this.play('step_gravel', { vol: 0.08 * v, rate: r, rev: 0.1, pan });
      this.noiseHit({ freq: 3500, q: 0.6, vol: 0.025 * v, a: 0.01, d: 0.12, type: 'highpass', rev: 0.1, pan }); // wet street
      return;
    }
    if (surface === 'wood') this.noiseHit({ freq: 260, q: 2, vol: 0.22 * gain, d: 0.09, rev: 0.15, buf: this.brown, pan });
    else if (surface === 'mud') this.noiseHit({ freq: 500, q: 0.8, vol: 0.18 * gain, d: 0.18, type: 'lowpass', rev: 0.1, pan });
    else {
      this.noiseHit({ freq: 1400 + Math.random() * 500, q: 1.6, vol: 0.11 * gain, d: 0.06, rev: 0.25, pan });
      this.noiseHit({ freq: 3500, q: 0.6, vol: 0.04 * gain, a: 0.01, d: 0.14, type: 'highpass', rev: 0.1, pan }); // wet splash
    }
  }

  bell(freq = 196, vol = 0.32) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); g.connect(this.master); g.connect(this.reverb);
    [0.5, 1, 1.19, 1.56, 2, 2.51, 2.66, 3.01].forEach((h, i) => {
      const o = ctx.createOscillator(); o.frequency.value = freq * h;
      const og = ctx.createGain(); this.env(og, t, 0.004, vol * [0.5, 1, 0.6, 0.35, 0.4, 0.2, 0.18, 0.12][i], 6 - i * 0.5);
      o.connect(og).connect(g); o.start(t); o.stop(t + 7);
    });
  }

  heartbeat(level = 1) {
    buzz([18, 240, 12]);
    if (!this.ctx) return;
    const ctx = this.ctx;
    [0, 0.26].forEach((dt, i) => {
      const t = ctx.currentTime + dt;
      const o = ctx.createOscillator(); o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.14);
      const g = ctx.createGain(); this.env(g, t, 0.01, (i ? 0.35 : 0.5) * level, 0.18);
      o.connect(g).connect(this.master); o.start(t); o.stop(t + 0.3);
    });
  }

  whisper(dur = 1.6, vol = 0.12) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 9;
    const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 7;
    // formant glide makes the noise "speak"
    for (let k = 0; k < dur * 6; k++) {
      f1.frequency.setValueAtTime(400 + Math.random() * 900, t + k / 6);
      f2.frequency.setValueAtTime(1300 + Math.random() * 1600, t + k / 6);
    }
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t);
    for (let k = 0; k < dur * 4; k++) g.gain.linearRampToValueAtTime(vol * (0.3 + Math.random() * 0.7), t + k / 4 + 0.1);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const mix = ctx.createGain();
    s.connect(f1).connect(mix); s.connect(f2).connect(mix);
    let out = mix.connect(g);
    if (pan) { pan.pan.value = Math.random() * 1.6 - 0.8; out = out.connect(pan); }
    out.connect(this.master); out.connect(this.reverb);
    s.start(t, Math.random() * 2); s.stop(t + dur + 0.2);
  }

  whistle(vol = 0.12, far = false) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); this.env(g, t, 0.02, vol, 0.9);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = far ? 1600 : 5000;
    [2100, 2460].forEach((f) => {
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      const tr = ctx.createOscillator(); tr.frequency.value = 28; const tg = ctx.createGain(); tg.gain.value = 60; tr.connect(tg).connect(o.frequency); tr.start(t); tr.stop(t + 1);
      const og = ctx.createGain(); og.gain.value = 0.2; o.connect(og).connect(lp); o.start(t); o.stop(t + 1);
    });
    lp.connect(g).connect(this.master); g.connect(this.reverb);
  }

  sting(vol = 0.25) {
    if (vol >= 0.15) buzz(vol >= 0.3 ? [40, 60, 90] : 45);
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); this.env(g, t, 0.02, vol, 3);
    g.connect(this.master); g.connect(this.reverb);
    [92.5, 98, 138.6, 196, 207.7, 293.7].forEach((f) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.frequency.linearRampToValueAtTime(f * 0.97, t + 3);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, t); lp.frequency.exponentialRampToValueAtTime(200, t + 3);
      const og = ctx.createGain(); og.gain.value = 0.08;
      o.connect(lp).connect(og).connect(g); o.start(t); o.stop(t + 3.2);
    });
    this.noiseHit({ freq: 120, type: 'lowpass', vol: 0.5, d: 1.2, buf: this.brown, rev: 0.6 });
  }

  click() { this.noiseHit({ freq: 3000, q: 4, vol: 0.05, d: 0.03, rev: 0 }); }
  paper() { if (this.play(this.pick(['book_flip1', 'book_flip2']), { vol: 0.35, rate: 0.95 + Math.random() * 0.15, rev: 0.05 })) return; this.noiseHit({ freq: 4200, q: 0.8, vol: 0.12, a: 0.03, d: 0.25, type: 'highpass', rev: 0.05 }); }
  pen() { for (let i = 0; i < 6; i++) setTimeout(() => this.noiseHit({ freq: 5000 + Math.random() * 2000, q: 3, vol: 0.04, d: 0.05, rev: 0 }), i * 70); }
  door() {
    if (this.play('door_open', { vol: 0.6, rev: 0.4 })) { this.play('door_close', { vol: 0.5, rev: 0.45, delay: 1.1 }); return; }
    this.noiseHit({ freq: 160, q: 1, vol: 0.4, d: 0.3, buf: this.brown, rev: 0.4 });
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(240, t + 0.7);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6;
    const g = ctx.createGain(); this.env(g, t, 0.08, 0.04, 0.6);
    o.connect(bp).connect(g).connect(this.master); o.start(t); o.stop(t + 0.8);
  }
  // a knuckle on the séance table: one rap, felt in the hand
  rap() { buzz(25); this.noiseHit({ freq: 180 + Math.random() * 40, q: 2, vol: 0.5, d: 0.08, buf: this.brown, rev: 0.35 }); this.noiseHit({ freq: 1400, q: 3, vol: 0.06, d: 0.02, rev: 0.2 }); }
  knock() { [0, 0.22, 0.44].forEach((d) => setTimeout(() => this.noiseHit({ freq: 140, q: 1.5, vol: 0.6, d: 0.12, buf: this.brown, rev: 0.4 }), d * 1000)); }
  drip(x = null) { const s = this.spatial(x, 700); this.noiseHit({ freq: 1800 + Math.random() * 900, q: 14, vol: 0.12 * s.gain, d: 0.08, rev: 0.6, pan: s.pan }); }
  splash() { this.noiseHit({ freq: 700, q: 0.5, vol: 0.4, a: 0.01, d: 0.6, type: 'lowpass', rev: 0.4 }); }
  thud() { buzz(55); this.noiseHit({ freq: 90, type: 'lowpass', vol: 0.7, d: 0.4, buf: this.brown, rev: 0.3 }); }
  match() { this.noiseHit({ freq: 2500, q: 0.7, vol: 0.18, a: 0.01, d: 0.4, rev: 0.1 }); }
  // picking something up: cloth and leather, then the object going into a pocket
  pickup() { if (this.play(this.pick(['cloth1', 'cloth2']), { vol: 0.45, rev: 0.05 })) { this.play('leather', { vol: 0.35, delay: 0.25, rev: 0.05 }); return; } this.paper(); }
  bookOpen() { if (!this.play('book_open', { vol: 0.45, rev: 0.05 })) this.paper(); }
  bookClose() { if (!this.play('book_close', { vol: 0.45, rev: 0.05 })) this.paper(); }
  latch() { if (!this.play('latch', { vol: 0.5, rev: 0.3 })) this.click(); }
  knife() { if (!this.play('knife', { vol: 0.5, rev: 0.35 })) this.sting(0.2); }
  tick() { this.noiseHit({ freq: 3800, q: 8, vol: 0.06, d: 0.02, rev: 0.1 }); }

  // ------------------------------------------------------------ the space
  // How each kind of place answers: length of the tail, how fast it dies, the slap off the nearest
  // wall, how much soft stuff soaks up the top, and how much of it we hear.
  setSpace(name, fade = 1.2) {
    this.wantSpace = name;
    if (!this.ctx || this.space === name) return;
    this.space = name;
    const SPACES = {
      room: [0.5, 4, 0.012, 0.6, 0.3],        // a small rented room: wood, a bed, close walls
      parlour: [0.8, 3.6, 0.018, 0.75, 0.3],  // velvet and drapes
      office: [0.7, 3.8, 0.015, 0.5, 0.28],
      street: [1.9, 3.2, 0.07, 0.25, 0.4],    // terraced brick both sides
      alley: [1.2, 3.6, 0.035, 0.2, 0.48],    // narrow, hard and wet
      yard: [1.5, 3.0, 0.05, 0.3, 0.38],
      river: [2.8, 2.4, 0, 0.35, 0.26],       // open water: long and faint, nothing near to answer
    };
    const [sec, decay, slap, damp, wet] = SPACES[name] || SPACES.street;
    const ctx = this.ctx, now = ctx.currentTime;
    const conv = ctx.createConvolver();
    conv.buffer = this.impulse(sec, decay, { slap, damp });
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(1, now + fade);
    this.reverb.connect(conv); conv.connect(g).connect(this.wet);
    this.wet.gain.setTargetAtTime(wet, now, fade / 3);
    const old = this.conv;
    if (old) {
      old.g.gain.cancelScheduledValues(now); old.g.gain.setValueAtTime(old.g.gain.value, now); old.g.gain.linearRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => { try { this.reverb.disconnect(old.conv); old.g.disconnect(); } catch (e) { /* already gone */ } }, fade * 1000 + 600);
    }
    this.conv = { conv, g };
  }

  // ------------------------------------------------------------ things that sound where they are
  // list: [{ kind, x, vol, reach, when(G) }]. kinds: fire, grind, clock, gas.
  setEmitters(list) {
    this.wantEmitters = list;
    if (!this.ctx) return;
    for (const e of this.emitters || []) this.dropEmitter(e);
    this.emitters = list.map((d) => this.makeEmitter(d)).filter(Boolean);
  }

  makeEmitter(d) {
    const ctx = this.ctx;
    const input = ctx.createGain(), out = ctx.createGain(); out.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    let tail = input.connect(out);
    if (pan) tail = tail.connect(pan);
    tail.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.3; tail.connect(send).connect(this.reverb);
    const e = { ...d, input, out, pan, sources: [], timers: [] };
    const loop = (buf) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, Math.random() * 3); e.sources.push(s); return s; };
    const filt = (type, f, q = 1) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    const lfo = (freq, amt, param) => { const o = ctx.createOscillator(); o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = amt; o.connect(g).connect(param); o.start(); e.sources.push(o); };
    if (d.kind === 'fire') {
      // the roar of the coals, and the crackle of wet wood spitting
      const g = ctx.createGain(); g.gain.value = 0.35; lfo(0.31, 0.12, g.gain);
      loop(this.brown).connect(filt('lowpass', 420)).connect(g).connect(input);
      e.timers.push(setInterval(() => {
        if (out.gain.value < 0.01) return;
        for (let k = 0; k < 3; k++) if (Math.random() < 0.45) this.noiseHit({ freq: 1500 + Math.random() * 3000, q: 2 + Math.random() * 3, vol: 0.05 + Math.random() * 0.1, d: 0.01 + Math.random() * 0.03, rev: 0, dest: input, at: Math.random() * 0.09 });
      }, 90));
    } else if (d.kind === 'grind') {
      // steel on a turning stone: a rasp that pulses with the wheel, and a thin whine over it
      const g = ctx.createGain(); g.gain.value = 0.18; lfo(6.5, 0.12, g.gain);
      loop(this.noise).connect(filt('bandpass', 3200, 2.5)).connect(g).connect(input);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1860; lfo(6.5, 40, o.frequency);
      const og = ctx.createGain(); og.gain.value = 0.012; o.connect(og).connect(input); o.start(); e.sources.push(o);
    } else if (d.kind === 'clock') {
      let tock = false;
      e.timers.push(setInterval(() => {
        if (out.gain.value < 0.01) return;
        tock = !tock;
        this.noiseHit({ freq: tock ? 2400 : 3600, q: 9, vol: 0.09, d: 0.025, rev: 0, dest: input });
      }, 520));
    } else if (d.kind === 'gas') {
      // a street lamp's mantle hissing
      const g = ctx.createGain(); g.gain.value = 0.05; lfo(0.7, 0.012, g.gain);
      loop(this.noise).connect(filt('highpass', 5200)).connect(g).connect(input);
    } else return null;
    return e;
  }

  dropEmitter(e) {
    for (const t of e.timers) clearInterval(t);
    for (const s of e.sources) { try { s.stop(); } catch (err) { /* never started */ } }
    const now = this.ctx.currentTime;
    e.out.gain.cancelScheduledValues(now); e.out.gain.setTargetAtTime(0, now, 0.2);
    setTimeout(() => e.out.disconnect(), 1200);
  }

  // every frame: fade and pan each emitter for where Thomas stands (and whether it is going at all)
  updateEmitters(G) {
    if (!this.ctx || !this.emitters) return;
    const now = this.ctx.currentTime;
    for (const e of this.emitters) {
      const s = this.spatial(e.x, e.reach || 1000);
      const on = e.when ? !!e.when(G) : true;
      e.out.gain.setTargetAtTime(on ? (e.vol ?? 1) * s.gain : 0, now, 0.15);
      if (e.pan) e.pan.pan.setTargetAtTime(s.pan, now, 0.15);
    }
  }

  // ------------------------------------------------------------ the city beyond the scene
  // cfg: { cab, bell, ship, muffle }: how often each is heard (0 never, 1 now and then); muffle
  // when we are indoors and it comes through the window glass.
  setCity(cfg) {
    this.wantCity = cfg;
    if (!this.ctx) return;
    for (const t of this.cityTimers || []) clearTimeout(t);
    this.cityTimers = [];
    if (this.cityBus) { const old = this.cityBus; old.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4); setTimeout(() => old.disconnect(), 2000); }
    this.cityBus = null;
    if (!cfg) return;
    const ctx = this.ctx;
    const bus = ctx.createGain(); bus.gain.value = cfg.muffle ? 0.45 : 1;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cfg.muffle ? 520 : 2400;
    lp.connect(bus); bus.connect(this.master);
    const send = ctx.createGain(); send.gain.value = 0.5; bus.connect(send).connect(this.reverb);
    this.cityBus = bus; this.cityIn = lp;
    const every = (kind, lo, hi, first) => {
      const go = (delay) => this.cityTimers.push(setTimeout(() => { if (this.cityBus === bus) { this[kind](); go(lo + Math.random() * (hi - lo)); } }, delay * 1000));
      go(first + Math.random() * first);
    };
    if (cfg.cab) every('cab', 40 / cfg.cab, 90 / cfg.cab, 10);
    if (cfg.bell) every('farBell', 80 / cfg.bell, 150 / cfg.bell, 25);
    if (cfg.ship) every('shipHorn', 50 / cfg.ship, 110 / cfg.ship, 15);
  }

  // a hansom going by in the next street: iron tyres on the setts, a horse at a trot, left to right
  cab() {
    if (!this.ctx || !this.cityIn) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = 8 + Math.random() * 3, dir = Math.random() < 0.5 ? 1 : -1;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + dur * 0.45); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.setValueAtTime(-0.9 * dir, t); p.pan.linearRampToValueAtTime(0.9 * dir, t + dur); g.connect(p); out = p; }
    out.connect(this.cityIn);
    const wheels = ctx.createBufferSource(); wheels.buffer = this.brown;
    const wl = ctx.createBiquadFilter(); wl.type = 'lowpass'; wl.frequency.value = 160;
    const wg = ctx.createGain(); wg.gain.value = 0.5; wheels.connect(wl).connect(wg).connect(g); wheels.start(t, Math.random() * 2); wheels.stop(t + dur);
    const rattle = ctx.createBufferSource(); rattle.buffer = this.noise;
    const rb = ctx.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = 1100; rb.Q.value = 1.5;
    const rg = ctx.createGain(); rg.gain.value = 0.05; rattle.connect(rb).connect(rg).connect(g); rattle.start(t, Math.random() * 2); rattle.stop(t + dur);
    // the trot: clip-clop, clip-clop
    for (let k = 0, at = 0.2; at < dur - 0.2; k++) {
      this.noiseHit({ freq: 700 + Math.random() * 300, q: 1.4, vol: 0.32, d: 0.05, rev: 0, buf: this.brown, dest: g, at });
      at += k % 2 ? 0.34 : 0.17;
    }
  }

  // Christ Church across the rooftops: one stroke, then the hum dying away
  farBell() {
    if (!this.ctx || !this.cityIn) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const g = ctx.createGain(); g.connect(this.cityIn);
    [0.5, 1, 1.19, 1.56, 2, 2.66].forEach((h, i) => {
      const o = ctx.createOscillator(); o.frequency.value = 138.6 * h;
      const og = ctx.createGain(); this.env(og, t, 0.006, 0.09 * [0.6, 1, 0.5, 0.3, 0.3, 0.12][i], 7 - i * 0.6);
      o.connect(og).connect(g); o.start(t); o.stop(t + 8);
    });
  }

  // a steamer feeling its way down the river in the fog
  shipHorn() {
    if (!this.ctx || !this.cityIn) return;
    const ctx = this.ctx, t = ctx.currentTime, dur = 2.6 + Math.random();
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.4); g.gain.setValueAtTime(0.09, t + dur - 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    lp.connect(g).connect(this.cityIn);
    [[98, 'sawtooth'], [146.8, 'square'], [98.6, 'sawtooth']].forEach(([f, type]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(lp); o.start(t); o.stop(t + dur);
    });
  }
}

export const audio = new AudioEngine();
