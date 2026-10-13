// What the story needs before it moves on, asked of the saved state alone.
// Every function here is pure: it reads a state and answers, it never changes it. Scenes and the
// hint call these instead of writing their own gates, and tests/unit checks them directly.
// Each `can*` answers { ok, missing }, where `missing` lists what is still lacking, in the order a
// player would naturally get it, as short phrases the hint and the objective can use.

import { REVISIONS_KEEP, sanitizePositions } from './positions.js';

const clue = (s, id) => s.clues.includes(id);
const ded = (s, id) => s.deductions.includes(id);
const flag = (s, k) => !!s.flags[k];
const result = (missing) => ({ ok: missing.length === 0, missing });

// ------------------------------------------------------------ saves
// Old saves keep working: fill whatever a newer version expects, never drop or rename what is there.
// Idempotent, and it returns the same object it was given.
export function normalizeState(s) {
  if (!s || typeof s !== 'object') return s;
  s.flags ??= {};
  for (const k of ['items', 'clues', 'deductions', 'profile']) s[k] = Array.isArray(s[k]) ? [...new Set(s[k])] : [];
  s.seen ??= {};
  // the topics heard in each conversation, by "scene:npc" (G.talk): lists of topic ids, no repeats
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  s.conversationSeen = isObj(s.conversationSeen) ? s.conversationSeen : {};
  for (const [k, v] of Object.entries(s.conversationSeen)) {
    if (Array.isArray(v)) s.conversationSeen[k] = [...new Set(v.filter((x) => typeof x === 'string'))];
    else delete s.conversationSeen[k];
  }
  s.sanity = typeof s.sanity === 'number' && isFinite(s.sanity) ? Math.max(0, Math.min(100, s.sanity)) : 100;
  s.investigation ??= {};
  s.investigation.hypotheses ??= {};
  s.investigation.routes ??= {};
  s.investigation.evaluations ??= {};
  // the player's positions on the open questions (positions.js): an object; a known question keeps only
  // one of its options, unknown keys are kept; the revisions are an array, capped as setPosition caps them
  const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  s.investigation.positions = plain(s.investigation.positions) ? sanitizePositions(s.investigation.positions) : {};
  s.investigation.revisions = Array.isArray(s.investigation.revisions) ? s.investigation.revisions.slice(-REVISIONS_KEEP) : [];
  // the year of entry follows from what the boy answered, for saves from before it was recorded
  if (s.flags.entry_year == null && s.flags.answered1866 != null) s.flags.entry_year = s.flags.answered1866 ? 1866 : 1879;
  // the comb: a save from before custody was recorded had it in his pocket, or on Wexley's table
  if (s.flags.peine_taken && !s.flags.comb_custody) s.flags.comb_custody = 'thomas';
  // Wren's «No fue él» is said only when the night closes with Brennan (chapters.js, endC1): a save closed
  // that way has it too. Only ever sets the flag, never clears it; a save from before V3 has no route, so no flag.
  if (s.investigation.routes.c1?.closedAt === 'knackers') s.flags.v4_wren_not_him = true;
  return s;
}

// ------------------------------------------------------------ chapter I
// The night can be closed when Thomas has (a) the case from Pike (what the surgeon said), (b) met Wren
// and has the scalpel she found, and (c) at least one conclusion that rests on evidence. Suspecting
// Brennan is one such conclusion; it is never required.
export const C1_CONCLUSIONS = ['d_bisturi', 'd_zurdo', 'd_ronda', 'd_confianza', 'd_brennan'];

export function canFinishC1(s) {
  const missing = [];
  if (!clue(s, 'zurdo')) missing.push('saber qué dijo el forense (Pike)');
  if (!flag(s, 'wren_met')) missing.push('hablar con la niña de las cajas del desolladero');
  else if (!clue(s, 'bisturi')) missing.push('conseguir lo que Wren encontró en la rejilla');
  if (!C1_CONCLUSIONS.some((d) => ded(s, d))) missing.push('sacar en el cuaderno al menos una conclusión con pruebas');
  return result(missing);
}

// ------------------------------------------------------------ chapter II
// Leaving 29 Hanbury Street: the apron seen, Greaves met (his knowing about the laudanum), and a
// decision taken about the comb, whoever keeps it.
export function canLeaveHanbury(s) {
  const missing = [];
  if (!clue(s, 'delantal')) missing.push('mirar el delantal junto al grifo');
  if (!flag(s, 'greaves_met')) missing.push('hablar con el médico');
  if (!flag(s, 'peine_taken')) missing.push('mirar lo que hay junto a la valla, a los pies de Annie');
  return result(missing);
}

// The séance itself needs the comb on the table (or, if Pike has it, Annie described aloud) and
// the raps already read: the scare is the reward, not the step before a puzzle.
export function canStartSeance(s) {
  const missing = [];
  if (!clue(s, 'hospes')) missing.push(flag(s, 'raps_heard') ? 'leer los golpes de la mesa con la tabla de la pared' : 'escuchar a la mesa');
  if (!flag(s, 'peine_taken')) missing.push('traer algo de Annie');
  return result(missing);
}

export function canLeaveSeance(s) {
  return result(flag(s, 'seance_done') ? [] : ['terminar la sesión']);
}

// ------------------------------------------------------------ chapter III
export function canLeaveMitre(s) {
  const missing = [];
  if (!flag(s, 'mitre_badge')) missing.push('enseñar la placa al agente de la City');
  if (!clue(s, 'trozo')) missing.push('saber qué le falta a la víctima (el delantal)');
  if (!clue(s, 'testigo')) missing.push('preguntar si alguien vio algo');
  return result(missing);
}

export function canLeaveRoomC3b(s) {
  const missing = [];
  if (!flag(s, 'paper_read')) missing.push('leer el periódico');
  if (!clue(s, 'letra')) missing.push('comparar la letra de la carta con las del escritorio');
  if (!clue(s, 'estuche')) missing.push('mirar debajo de la cama');
  return result(missing);
}

// ------------------------------------------------------------ chapter IV
// The water opens only when Thomas's own file matches the killer's profile on at least three
// INDEPENDENT sources. Two findings from the same source count once, and a match that is merely
// compatible (the mud) proves nothing on its own.
export const FINAL_SOURCES = {
  f_zurdo: 'forense',        // the surgeon's reading of the cuts
  f_anat: 'objeto',          // the scalpel in the drain
  f_testigo: 'testigo',      // a neighbour in Church Passage
  f_ronda: 'registro',       // the signed beat sheet
  f_exp: 'expediente',       // the hospital file
  f_barro: null,             // compatible, not demonstrative
};

export function finalSources(s) {
  return [...new Set(s.deductions.map((d) => FINAL_SOURCES[d]).filter(Boolean))];
}

export function canEnterFinale(s) {
  const n = finalSources(s).length;
  return result(n >= 3 ? [] : [`relacionar mi ficha con ${3 - n} prueba${3 - n === 1 ? '' : 's'} independiente${3 - n === 1 ? '' : 's'} más`]);
}

// ------------------------------------------------------------ the open question
// What the case asks of the player right now: the gate of the place they are in, if it is not met.
export function currentGate(s) {
  const sc = s.scene, ch = s.chapter, phase = s.flags.room_phase;
  if (ch === 'c1' && (sc === 'bucks_row' || sc === 'knackers') && !flag(s, 'c1_done')) return canFinishC1(s);
  if (sc === 'hanbury') return canLeaveHanbury(s);
  if (sc === 'seance') return flag(s, 'seance_done') ? canLeaveSeance(s) : canStartSeance(s);
  if (sc === 'mitre') return canLeaveMitre(s);
  if (sc === 'room' && phase === 'c3b') return canLeaveRoomC3b(s);
  if (sc === 'foreshore' && flag(s, 'awake')) return canEnterFinale(s);
  return null;
}

// The deductions that would move the current gate, in the order the hint should offer them. Only
// the notebook gates have any (chapter I's conclusion, the finale's sources); suspecting Brennan
// comes last, because it is never required.
export function gateDeductions(s) {
  const sc = s.scene;
  if (s.chapter === 'c1' && (sc === 'bucks_row' || sc === 'knackers') && !flag(s, 'c1_done')) {
    return canFinishC1(s).ok || C1_CONCLUSIONS.some((d) => ded(s, d)) ? [] : C1_CONCLUSIONS;
  }
  if (sc === 'foreshore' && flag(s, 'awake')) {
    const have = new Set(finalSources(s));
    return Object.keys(FINAL_SOURCES).filter((d) => FINAL_SOURCES[d] && !have.has(FINAL_SOURCES[d]) && !ded(s, d));
  }
  return [];
}
