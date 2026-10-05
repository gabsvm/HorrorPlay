// Procedural sound: no recorded assets, everything is synthesised so the whole soundscape is ours.

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
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(3.2, 2.6);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.45;
    this.reverb.connect(this.wet).connect(this.master);
    this.noise = this.noiseBuffer(4);
    this.brown = this.noiseBuffer(4, true);
  }

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

  impulse(sec, decay) {
    const ctx = this.ctx, n = ctx.sampleRate * sec;
    const b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
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
    } else if (name === 'room') {
      const s = src(this.brown);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180;
      const g = ctx.createGain(); g.gain.value = 0.35;
      s.connect(lp).connect(g).connect(gain);
      const o = ctx.createOscillator(); o.frequency.value = 50; const og = ctx.createGain(); og.gain.value = 0.012;
      o.connect(og).connect(gain); o.start();
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

  // ------------------------------------------------------------ music: sparse, detuned piano-like notes over the beds
  playMusic(mood) {
    if (!this.ctx) return;
    if (this.music) { clearInterval(this.music.timer); this.music = null; }
    if (!mood) return;
    const scales = {
      dread: [110, 116.5, 130.8, 146.8, 155.6, 174.6, 220, 233.1],
      memory: [196, 220, 246.9, 261.6, 293.7, 329.6, 392],
      chase: [98, 103.8, 146.8, 155.6],
    };
    const notes = scales[mood] || scales.dread;
    const every = mood === 'chase' ? 420 : mood === 'memory' ? 1600 : 2600;
    const timer = setInterval(() => {
      if (Math.random() < (mood === 'chase' ? 0.9 : 0.55)) this.piano(notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.2 ? 2 : 1), mood === 'chase' ? 0.06 : 0.09);
      if (mood !== 'memory' && Math.random() < 0.15) this.piano(notes[0] / 2, 0.08);
    }, every);
    this.music = { timer };
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

  noiseHit({ freq = 800, q = 1, type = 'bandpass', vol = 0.3, a = 0.005, d = 0.12, rev = 0.2, buf } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = buf || this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); this.env(g, t, a, vol, d);
    s.connect(f).connect(g).connect(this.master);
    if (rev) { const r = ctx.createGain(); r.gain.value = rev; g.connect(r).connect(this.reverb); }
    s.start(t, Math.random() * 2); s.stop(t + a + d + 0.1);
  }

  step(surface = 'stone') {
    if (surface === 'wood') this.noiseHit({ freq: 260, q: 2, vol: 0.22, d: 0.09, rev: 0.15, buf: this.brown });
    else if (surface === 'mud') this.noiseHit({ freq: 500, q: 0.8, vol: 0.18, d: 0.18, type: 'lowpass', rev: 0.1 });
    else {
      this.noiseHit({ freq: 1400 + Math.random() * 500, q: 1.6, vol: 0.11, d: 0.06, rev: 0.25 });
      this.noiseHit({ freq: 3500, q: 0.6, vol: 0.04, a: 0.01, d: 0.14, type: 'highpass', rev: 0.1 }); // wet splash
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
  paper() { this.noiseHit({ freq: 4200, q: 0.8, vol: 0.12, a: 0.03, d: 0.25, type: 'highpass', rev: 0.05 }); }
  pen() { for (let i = 0; i < 6; i++) setTimeout(() => this.noiseHit({ freq: 5000 + Math.random() * 2000, q: 3, vol: 0.04, d: 0.05, rev: 0 }), i * 70); }
  door() {
    this.noiseHit({ freq: 160, q: 1, vol: 0.4, d: 0.3, buf: this.brown, rev: 0.4 });
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(320, t); o.frequency.linearRampToValueAtTime(240, t + 0.7);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6;
    const g = ctx.createGain(); this.env(g, t, 0.08, 0.04, 0.6);
    o.connect(bp).connect(g).connect(this.master); o.start(t); o.stop(t + 0.8);
  }
  knock() { [0, 0.22, 0.44].forEach((d) => setTimeout(() => this.noiseHit({ freq: 140, q: 1.5, vol: 0.6, d: 0.12, buf: this.brown, rev: 0.4 }), d * 1000)); }
  drip() { this.noiseHit({ freq: 1800 + Math.random() * 900, q: 14, vol: 0.12, d: 0.08, rev: 0.6 }); }
  splash() { this.noiseHit({ freq: 700, q: 0.5, vol: 0.4, a: 0.01, d: 0.6, type: 'lowpass', rev: 0.4 }); }
  thud() { this.noiseHit({ freq: 90, type: 'lowpass', vol: 0.7, d: 0.4, buf: this.brown, rev: 0.3 }); }
  match() { this.noiseHit({ freq: 2500, q: 0.7, vol: 0.18, a: 0.01, d: 0.4, rev: 0.1 }); }
  tick() { this.noiseHit({ freq: 3800, q: 8, vol: 0.06, d: 0.02, rev: 0.1 }); }
}

export const audio = new AudioEngine();
