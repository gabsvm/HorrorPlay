// Goulston Street after V4-05. The inscription on the jamb is a fact of the wall: it is drawn as
// unreadable strokes, and the clue `goulston_historic` says who did not write it, what was done with it
// at dawn, and nothing that proves anything. The words Thomas believes he read (`aqui_estoy`) are his
// perception, and no line of recognition sits next to the historic inscription.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { normalizeState, canLeaveMitre, FINAL_SOURCES } from '../../src/story/progression.js';
import { THEORIES } from '../../src/story/theories.js';
import { CLUES, DEDUCTIONS } from '../../src/story/data.js';
import { ok, eq } from './assert.mjs';

const st = (o = {}) => normalizeState({ chapter: 'c3', scene: 'goulston', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
// the text the notebook shows for a clue: the second reading uses text2 when there is one
const textOf = (id, s, second = false) => { const c = CLUES[id]; return second && c.text2 ? c.text2 : typeof c.text === 'function' ? c.text(s) : c.text; };
// Only hashes of the historical insult's words are kept here, so the repository never holds them.
const BANNED = new Set([
  'f091c5ccc56804d00b293f8006c8180494790464057e7ad898571accc2e70f16',
  '9d6b30c09cde0f72c7fe1b16021c5593f178b6dcddbd22178e610320ad1bb111',
]);
const RECOGNITION = /reconozc|reconoc|mi letra|creo leer|creí leer|lo escribí|lo dije|\byo\b|\bmía\b|\bmío\b/i;

// every file under web/src, as [relative path, text]
const SRC = (function list(dir) {
  return readdirSync(dir).flatMap((f) => {
    const u = new URL(f + (statSync(new URL(f, dir)).isDirectory() ? '/' : ''), dir);
    return statSync(u).isDirectory() ? list(u) : f.endsWith('.js') ? [[u.pathname.split('/src/')[1], readFileSync(u, 'utf8')]] : [];
  });
})(new URL('../../src/', import.meta.url));
const src = (name) => SRC.find(([f]) => f === name)[1];
const goulston = src('scenes/goulston.js');
const block = (name) => {
  const m = new RegExp(`\\n  ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n  \\},?\\n`).exec(goulston);
  return m ? m[0] : '';
};

export const tests = [
  ['drawNear y drawGlow no dibujan la frase: la jamba tiene trazos ilegibles', () => {
    ok(block('drawNear').length > 0, 'no encuentro drawNear');
    ok(!block('drawNear').includes('HERE I AM'), 'drawNear dibuja HERE I AM');
    ok(!block('drawGlow').includes('HERE I AM'), 'drawGlow dibuja HERE I AM');
    ok(!/drawGlow/.test(goulston), 'la jamba no debe tener brillo (drawGlow)');
    ok(/function chalkScrawl/.test(goulston) && block('drawNear').includes('chalkScrawl('), 'drawNear no llama a chalkScrawl');
  }],
  ['cada aparición de «HERE I AM» en src es un texto de percepción o la visión', () => {
    for (const [f, s] of SRC) {
      s.split('\n').forEach((line, i) => {
        if (!/here i am/i.test(line)) return;
        if (f === 'art/bodies.js') {
          // the vision's picture: only inside paintChalk
          const a = s.indexOf('function paintChalk'), b = s.indexOf('export function paintVision');
          ok(a >= 0 && b > a && s.indexOf(line) > a && s.indexOf(line) < b, `${f}:${i + 1} fuera de la visión`);
          return;
        }
        ok(/creí leer|creo leer/.test(line), `${f}:${i + 1} «HERE I AM» sin verbo de percepción`);
      });
    }
  }],
  ['el juego no contiene la frase de la carta ni su insulto (palabras del insulto: 0)', () => {
    for (const [f, s] of SRC) {
      for (const w of s.toLowerCase().match(/\p{L}+/gu) || []) {
        const h = createHash('sha256').update(w).digest('hex');
        ok(!BANNED.has(h), `${f} contiene una palabra prohibida`);
      }
    }
  }],
  ['goulston_historic: sin paper_read no menciona el borrado; con paper_read sí', () => {
    const plain = textOf('goulston_historic', st({ flags: {} }));
    const read = textOf('goulston_historic', st({ flags: { paper_read: true } }));
    ok(!/borr/i.test(plain), 'sin paper_read se menciona el borrado');
    ok(/Al amanecer la borraron por orden de la jefatura, por miedo a disturbios contra los judíos\./.test(read), 'con paper_read falta el borrado');
    ok(read.startsWith(plain), 'el borrado se añade al final del texto base');
    ok(CLUES.goulston_historic.text2 === undefined, 'la segunda lectura usa el mismo texto que la primera');
  }],
  ['goulston_historic: ninguna línea de reconocimiento en su texto', () => {
    const c = CLUES.goulston_historic;
    for (const s of [st({ flags: {} }), st({ flags: { paper_read: true } })]) {
      ok(!RECOGNITION.test(textOf('goulston_historic', s)), 'el texto reconoce autoría');
      ok(!RECOGNITION.test(textOf('goulston_historic', s, true)), 'la segunda lectura reconoce autoría');
    }
    ok(!RECOGNITION.test(c.truth2), 'la nota truth2 reconoce autoría');
    ok(!c.tag.includes('Identific') && !/tinta|letra/i.test(c.tag), 'la etiqueta identifica');
    eq(c.tag, 'Goulston St. · informe', 'etiqueta');
  }],
  ['goulston_historic no es prueba de ninguna hipótesis, ni deducción, ni salida de Mitre', () => {
    const ev = THEORIES.flatMap((t) => t.hyps.flatMap((h) => [...h.for, ...h.against]));
    ok(!ev.some((e) => e.id === 'goulston_historic'), 'está como evidencia en theories.js');
    ok(!Object.keys(FINAL_SOURCES).some((k) => FINAL_SOURCES[k] === 'goulston_historic'), 'FINAL_SOURCES');
    ok(!DEDUCTIONS.some((d) => d.a === 'goulston_historic' || d.b === 'goulston_historic'), 'es parte de una deducción');
    const base = st({ flags: { mitre_badge: true }, clues: ['trozo'] });
    const withHist = st({ flags: { mitre_badge: true }, clues: ['trozo', 'goulston_historic'] });
    eq(canLeaveMitre(withHist).missing, canLeaveMitre(base).missing, 'canLeaveMitre cambia con la pista');
    const full = st({ flags: { mitre_badge: true }, clues: ['trozo', 'testigo'] });
    const fullHist = st({ flags: { mitre_badge: true }, clues: ['trozo', 'testigo', 'goulston_historic'] });
    ok(canLeaveMitre(full).ok && canLeaveMitre(fullHist).ok, 'la salida de Mitre no depende de la pista');
  }],
  ['aqui_estoy: lo que Thomas cree leer, con y sin answered1866; la segunda lectura igual', () => {
    eq(textOf('aqui_estoy', st({ flags: { answered1866: true } })), 'En la pared mojada de Goulston Street creí leer HERE I AM. Aquí estoy. Es lo que contesté al agua.', 'answered1866');
    eq(textOf('aqui_estoy', st({ flags: {} })), 'En la pared mojada de Goulston Street creí leer HERE I AM. Aquí estoy. Lo que el agua quería oírme decir.', 'sin answered1866');
    eq(textOf('aqui_estoy', st({ flags: {} }), true), 'En la pared mojada creí leer HERE I AM. Es lo que yo contesté al agua.', 'text2');
    eq(CLUES.aqui_estoy.truth2, 'Con mi letra inclinada.', 'truth2');
    eq(CLUES.aqui_estoy.tag, 'Goulston St.', 'etiqueta sin cambio');
  }],
  ['d_aqui: texto exacto', () => {
    const d = DEDUCTIONS.find((x) => x.id === 'd_aqui');
    eq(d.text, 'Lo que creí leer en Goulston Street repite la frase de la voz. Es un vínculo sugestivo, no una prueba de quién escribió nada.', 'd_aqui');
    eq(d.a, 'aqui_estoy', 'pista a');
  }],
  ['horas: la nota de aqui_estoy es «lo que creí leer en Goulston Street», y nada más cambia', () => {
    const horas = THEORIES.find((t) => t.id === 'horas').hyps.find((h) => h.id === 'agua');
    const notes = horas.for.filter((e) => e.id === 'aqui_estoy').map((e) => e.note);
    eq(notes, ['lo que creí leer en Goulston Street'], 'nota');
    eq(horas.for.map((e) => e.note), ['lo que dicen en el río', 'la voz de Nat en la sesión', 'HOSPES', 'lo que creí leer en Goulston Street', '«Aquí estoy», en 1879'], 'resto de notas');
  }],
  ['las pistas de la escena siguen existiendo (goulston_historic nueva, aqui_estoy conservada)', () => {
    ok(CLUES.goulston_historic && CLUES.aqui_estoy, 'faltan pistas');
  }],
  ['goulston_historic no lleva verdad de segunda lectura ni primera persona', () => {
    const c = CLUES.goulston_historic;
    ok(c && c.truth2 === undefined, 'la pista histórica no tiene truth2');
    ok(c && c.text2 === undefined, 'la pista histórica no tiene text2');
    const t = c.text({ flags: { paper_read: true } });
    ok(!/(yo|me|mi|mí)/i.test(t), 'el texto histórico no habla en primera persona');
  }],
];
