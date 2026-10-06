// Runs every sound and every music mood against a strict fake Web Audio graph.
//   node web/tools/audio-smoke.mjs
const problems = [];
const param = (name) => {
  const p = { value: 0 };
  for (const fn of ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues', 'setTargetAtTime']) {
    p[fn] = (v, t) => {
      if (!Number.isFinite(v) || (t !== undefined && !Number.isFinite(t))) problems.push(`${name}.${fn}(${v}, ${t})`);
      if (fn === 'exponentialRampToValueAtTime' && v <= 0) problems.push(`${name}.exponentialRamp to ${v}`);
      p.value = v;
    };
  }
  return p;
};
const node = (kind) => {
  const n = { kind, connect: (d) => d, disconnect() {}, start() {}, stop() {} };
  for (const k of ['gain', 'frequency', 'Q', 'pan', 'detune', 'playbackRate']) n[k] = param(`${kind}.${k}`);
  return n;
};
class FakeCtx {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = node('dest'); }
  resume() {}
  createGain() { return node('gain'); }
  createOscillator() { return node('osc'); }
  createBiquadFilter() { return node('filter'); }
  createBufferSource() { return node('src'); }
  createConvolver() { return node('conv'); }
  createDynamicsCompressor() { const n = node('comp'); n.threshold = param('t'); n.ratio = param('r'); return n; }
  createStereoPanner() { return node('pan'); }
  createBuffer(ch, n) { return { getChannelData: () => new Float32Array(n) }; }
  decodeAudioData() { return Promise.resolve({ duration: 2 }); }
}
globalThis.window = { AudioContext: FakeCtx };
// recordings: every fetch answers, so both the sample path and (before it resolves) the fallback run
globalThis.fetch = () => Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) });
const timers = [];
globalThis.setInterval = (fn) => { timers.push(fn); return timers.length; };
globalThis.clearInterval = () => {};
globalThis.setTimeout = (fn) => { fn(); return 0; };
const { audio } = await import('../src/engine/audio.js');
audio.init();
for (const b of ['rain', 'wind', 'river', 'room', 'crowd', 'drone', 'heart']) audio.bed(b, 0.4, 1);
const ALL = ['step', 'bell', 'heartbeat', 'whisper', 'whistle', 'sting', 'click', 'paper', 'pen', 'door', 'knock', 'drip', 'splash', 'thud', 'match', 'tick', 'pickup', 'bookOpen', 'bookClose', 'latch', 'knife'];
for (const f of ALL) audio[f]();
await new Promise((r) => r()); for (let i = 0; i < 30; i++) await Promise.resolve();
if (Object.keys(audio.samples).length < 20) problems.push(`solo ${Object.keys(audio.samples).length} grabaciones cargadas`);
for (const f of ALL) audio[f]();
for (const s of ['wood', 'mud', 'stone']) audio.step(s);
for (const b of ['rain', 'river', 'room']) audio.bed(b, 0.5, 1);
for (const mood of ['dread', 'memory', 'chase', null]) {
  audio.playMusic(mood);
  // advance the audio clock and fire the scheduler many times
  for (let i = 0; i < 400; i++) { audio.ctx.currentTime += 0.12; for (const t of timers.slice(-1)) t(); }
}
if (problems.length) { console.log([...new Set(problems)].slice(0, 20).join('\n')); process.exit(1); }
console.log('Audio sin problemas.');
