// Thomas's own position on the case's open questions: which explanation he holds now, not which one
// the evidence proves (theories.js says that). The notebook's buttons write here; nothing else does.
// Pure: no DOM, and setPosition changes only the state it is given, and only investigation.positions
// and investigation.revisions. Scenes, the objective, the flags and the routes never move with it.
//
// A question appears only once its evidence is in (visible). While Thomas is awake a position is
// fixed: the notebook shows what he thought before, and nothing new is written. In the second reading
// (flags.second) the stance is not asked at all: nothing is shown and nothing is written. Each change is kept
// as a revision with the evidence that stood behind the chosen explanation at the time; the last
// REVISIONS_KEEP are kept.
import { THEORIES, holds } from './theories.js';

export const REVISIONS_KEEP = 20;

const hasClue = (s, id) => s.clues.includes(id);
const question = (q) => (Object.prototype.hasOwnProperty.call(QUESTIONS, q) ? QUESTIONS[q] : null);

// The questions the notebook can ask. `theory` is the theory (theories.js) whose explanations are the
// options; `visible` says when the question appears. buck_window appears with the clue ronda (F02).
export const QUESTIONS = {
  br_suspect: { theory: 'brennan', title: 'Qué pensé de Brennan',
    options: [['brennan', 'Pudo ser Brennan'], ['prensa', 'El barrio ya lo había elegido'], ['insuficiente', 'No hay bastante para decirlo']],
    visible: (s) => hasClue(s, 'brennan_zurdo') || hasClue(s, 'delantal') },
  letter_author: { theory: 'carta', title: '¿Quién escribió la carta?',
    options: [['greaves', 'Pudo escribirla Greaves'], ['cercano', 'Salió de mi cuarto'], ['insuficiente', 'No hay bastante para decirlo']],
    visible: (s) => hasClue(s, 'carta') },
  buck_window: { theory: 'rondas', title: 'Ventana de las rondas', options: [['firme', 'Firme'], ['compatible', 'Compatible, con margen'], ['insuficiente', 'Insuficiente']],
    visible: (s) => hasClue(s, 'ronda') },   // visible con la pista ronda (F02)
  // V4-06: the stance on one man for both events. It registers Thomas's view only: no flag, no ending, no FINAL_SOURCES.
  double_event: { theory: 'doble', title: '¿Son el mismo hombre?',
    options: [['vinculados', 'Probablemente, sí'], ['insuficiente', 'No hay bastante para decirlo'], ['no_relacionados', 'Por ahora, no']],
    visible: (s) => hasClue(s, 'berner_aviso') && hasClue(s, 'trozo') },
};

// What the closing of chapter one said about Brennan (flags.brennan_stance). The notebook shows it as
// read-only text under his question; it is never written to positions.
export const BRENNAN_STANCE_LABEL = { suspect: 'Hay que vigilarlo', clear: 'No hay nada contra él', unsure: 'Todavía no lo sé' };

// The saved positions, cleaned: a known question keeps its value only if that value is one of its
// options; an unknown question's key is kept as it is. Returns a new object and never changes its
// argument. normalizeState uses it, so a save with a stale or broken value loads without it.
export function sanitizePositions(positions) {
  const out = {};
  for (const [q, v] of Object.entries(positions)) {
    if (Object.prototype.hasOwnProperty.call(QUESTIONS, q)) {
      if (QUESTIONS[q].options.some(([o]) => o === v)) out[q] = v;
    } else {
      // defineProperty, so that a key such as "__proto__" from a save stays a plain key
      Object.defineProperty(out, q, { value: v, enumerable: true, writable: true, configurable: true });
    }
  }
  return out;
}

// The position on q, or null. Never changes the state.
export function readPosition(state, q) {
  return state.investigation?.positions?.[q] ?? null;
}

// The evidence behind an explanation: the clues, deductions and flags of its hypothesis that hold now.
// Each entry says on which side it stands: 'for:clue:<id>', 'for:ded:<id>', 'for:flag:<id>' when the
// hypothesis's `for` list has it, 'against:clue:<id>' and so on when it comes from `against`.
// "insuficiente" stands on nothing.
export function basisFor(state, q, option) {
  if (option === 'insuficiente') return [];
  const theory = THEORIES.find((t) => t.id === question(q)?.theory);
  const hyp = theory?.hyps.find((h) => h.id === option);
  if (!hyp) return [];
  return [
    ...hyp.for.filter((e) => holds(state, e)).map((e) => `for:${e.kind}:${e.id}`),
    ...hyp.against.filter((e) => holds(state, e)).map((e) => `against:${e.kind}:${e.id}`),
  ];
}

// Writes the position on q. Returns true only when something changed. Refused (false, nothing written)
// while awake or in the second reading, for a question that is not shown, for an option it does not
// have, or for the position it already has (so a repeated press adds no revision).
export function setPosition(state, q, option) {
  if (state.flags?.awake || state.flags?.second) return false;
  const Q = question(q);
  if (!Q || !Q.visible(state) || !Q.options.some(([v]) => v === option)) return false;
  const previous = readPosition(state, q);
  if (option === previous) return false;
  const inv = (state.investigation ??= {});
  const positions = inv.positions !== null && typeof inv.positions === 'object' && !Array.isArray(inv.positions) ? inv.positions : (inv.positions = {});
  const revisions = Array.isArray(inv.revisions) ? inv.revisions : (inv.revisions = []);
  positions[q] = option;
  revisions.push({ question: q, from: previous, to: option, chapter: state.chapter ?? null, basis: basisFor(state, q, option) });
  inv.revisions = revisions.slice(-REVISIONS_KEEP);
  return true;
}
