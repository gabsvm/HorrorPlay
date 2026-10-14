// Development metrics, opt-in with ?metrics in the address: how long until the first input, how
// long the player sits through cinematics, clicks that do nothing, puzzle attempts, hints asked,
// time per chapter. Nothing is sent anywhere and nothing personal is kept: it lives in memory,
// is printed to the console at every chapter change, and `window.__metrics()` returns it.
const ON = typeof location !== 'undefined' && /[?&]metrics\b/.test(location.search || '');

const m = {
  started: typeof performance !== 'undefined' ? performance.now() : 0,
  firstInput: null,
  cinematicMs: 0,
  invalidClicks: 0,
  movesWithItem: 0,
  quality: [],         // automatic quality changes: { to, at, cost, interval }
  wrongItems: 0,
  hints: 0,
  chapters: {},        // id -> { start, ms }
  current: null,
};

export const metrics = {
  on: ON,
  input() { if (ON && m.firstInput == null) m.firstInput = Math.round(performance.now() - m.started); },
  cinematic(ms) { if (ON) m.cinematicMs += ms; },
  invalidClick() { if (ON) m.invalidClicks++; },
  moveWithItem() { if (ON) m.movesWithItem++; },
  quality(to, cost, iv) { if (ON) m.quality.push({ to, at: Math.round(performance.now() - m.started), cost: +(cost || 0).toFixed(1), interval: +(iv || 0).toFixed(1) }); },
  wrongItem() { if (ON) m.wrongItems++; },
  hint() { if (ON) m.hints++; },
  chapter(id, state) {
    if (!ON) return;
    const now = performance.now();
    if (m.current && m.chapters[m.current]) m.chapters[m.current].ms = Math.round(now - m.chapters[m.current].start);
    m.current = id;
    m.chapters[id] = { start: now, ms: null };
    console.info('[métricas]', JSON.stringify(metrics.report(state)));
  },
  report(state) {
    const ev = state?.investigation?.evaluations || {};
    return {
      primerControlMs: m.firstInput,
      cinematicasMs: Math.round(m.cinematicMs),
      clicsSinEfecto: m.invalidClicks,
      pasosConObjeto: m.movesWithItem,
      cambiosDeCalidad: m.quality,
      objetosMalUsados: m.wrongItems,
      ayudasPedidas: m.hints,
      intentosRondas: ev.beats ? ev.beats.misses + 1 : null,
      intentosGolpes: ev.raps ? (ev.raps.misses || 0) + 1 : null,
      msPorCapitulo: Object.fromEntries(Object.entries(m.chapters).map(([k, v]) => [k, v.ms ?? Math.round(performance.now() - v.start)])),
    };
  },
};

if (ON && typeof window !== 'undefined') window.__metrics = () => metrics.report(window.game?.state);
