// Mitre Square after V4-06: the notice from Berner Street and the neighbour's witness, the City's line,
// the question «doble» (one man for both streets), and the words the scene and the game must not use.
// Reads the sources as text for the words and the file layout (tests/unit/goulston.test.mjs does the same).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { normalizeState, canLeaveMitre, finalSources, FINAL_SOURCES } from '../../src/story/progression.js';
import { evaluate, statuses, THEORIES } from '../../src/story/theories.js';
import { QUESTIONS, setPosition, readPosition } from '../../src/story/positions.js';
import { ok, eq } from './assert.mjs';

const st = (o = {}) => normalizeState({ chapter: 'c3', scene: 'mitre', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const clone = (x) => JSON.parse(JSON.stringify(x));
const fixture = (p) => JSON.parse(readFileSync(new URL(`../fixtures/${p}`, import.meta.url), 'utf8'));

// every file under web/src, as [relative path, text]
const SRC = (function list(dir) {
  return readdirSync(dir).flatMap((f) => {
    const u = new URL(f + (statSync(new URL(f, dir)).isDirectory() ? '/' : ''), dir);
    return statSync(u).isDirectory() ? list(u) : f.endsWith('.js') ? [[u.pathname.split('/src/')[1], readFileSync(u, 'utf8')]] : [];
  });
})(new URL('../../src/', import.meta.url));
const src = (name) => SRC.find(([f]) => f === name)[1];
// the scene's code, without its comments (comments are never shown to the player)
const codeOf = (text) => text.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
const FORBIDDEN_IN_SCENE = /Stride|Kelly|Gotemburgo|Long Liz|lúpulo|Duke.s Place|Ni de la City|Eddowes/;
const NAMES = /Stride|Long Liz|Gotemburgo|Kelly|Eddowes/;

export const tests = [
  // ------------------------------------------------------------ words
  ['mitre.js no dice en pantalla los nombres de la identificación', () => {
    const lines = codeOf(src('scenes/mitre.js')).split('\n').filter((l) => !l.includes("title: 'Catherine Eddowes'"));
    lines.forEach((l) => ok(!FORBIDDEN_IN_SCENE.test(l), `mitre.js: ${l.trim().slice(0, 90)}`));
    ok(src('scenes/mitre.js').includes("title: 'La mujer de Mitre Square', body: 'eddowes'"), 'el inspect conserva su clave interna y muestra un título sin nombre');
  }],
  ['el juego no contiene «Duke\'s Place» ni «Ni de la City» (ni en comentarios)', () => {
    for (const [f, s] of SRC) {
      ok(!/Duke.s Place/.test(s), `${f} nombra Duke's Place`);
      ok(!/Ni de la City/.test(s), `${f} tiene «Ni de la City»`);
    }
  }],
  ['Stride, Kelly y Eddowes solo aparecen donde deben', () => {
    const allowed = {
      'main.js': (l) => /existieron/.test(l),                              // créditos (main.js:57)
      'story/data.js': (l) => /Catherine Eddowes/.test(l),                 // pista trozo, anterior a V4-06
      'art/props.js': (l) => /Eddowes/.test(l),                            // comentario, anterior a V4-06
      'scenes/mitre.js': (l) => /^\s*\/\//.test(l) || /title: 'Catherine Eddowes'/.test(l),
    };
    for (const [f, s] of SRC) {
      if (f === 'story/chapters.js') continue;
      s.split('\n').forEach((l, i) => {
        if (NAMES.test(l)) ok(allowed[f]?.(l), `${f}:${i + 1}: ${l.trim().slice(0, 90)}`);
      });
    }
    // chapters.js: inside the clipping of October 1888 (between its heading and «Capítulo IV»), or the old Miller's Court card
    const lines = src('story/chapters.js').split('\n');
    const head = lines.findIndex((l) => l.includes('RECORTE DE PRENSA — OCTUBRE DE 1888'));
    const next = lines.findIndex((l, i) => i > head && l.includes("'Capítulo IV'"));
    ok(head > 0 && next > head, 'no encuentro el recorte y el capítulo IV');
    lines.forEach((l, i) => {
      if (!NAMES.test(l)) return;
      ok((i > head && i < next) || /Mary Jane Kelly/.test(l), `chapters.js:${i + 1}: ${l.trim().slice(0, 90)}`);
    });
  }],
  ['el recorte de octubre lleva el texto aprobado, una sola vez', () => {
    const C = src('story/chapters.js');
    eq(C.split('RECORTE DE PRENSA').length - 1, 1, 'recortes');
    ok(C.includes('<h3>RECORTE DE PRENSA — OCTUBRE DE 1888</h3>'), 'cabecera');
    ok(C.includes('<p>En la investigación de Berner Street, una compañera de pensión reconoció a la víctima: Elizabeth Stride, a quien llamaban «Long Liz», nacida cerca de Gotemburgo. Antes, otra mujer había jurado que era su hermana; se demostró que se equivocaba.</p>'), 'párrafo de Stride');
    ok(C.includes('<p>En el caso de Mitre Square, John Kelly reconoció a su compañera, Catherine Eddowes. Esa noche, al salir de la comisaría de Bishopsgate, ella había dado el nombre de Mary Ann Kelly.</p>'), 'párrafo de Kelly');
  }],
  ['las frases de Watkins son las aprobadas', () => {
    const M = src('scenes/mitre.js');
    for (const t of [
      'Paso aquí cada cuarto de hora. A la una y media, nada. A la una y cuarenta y cuatro, la vi.',
      'Falta una pieza del delantal. Se la llevó quien lo hizo.',
      'Un vecino de Church Passage dice que, hacia la una y media, vio a una pareja a la entrada del pasaje. Él, abrigo oscuro y bombín. Y una linterna, dice. No está seguro.',
      'No. Aquí nadie la conoce.',
      '¿Hay novedades de otras calles?',
      'Aviso de la Metropolitana: Berner Street, hacia la una. Una mujer en el patio de un club, con la garganta cortada. Sin nombre todavía.',
      'Aquí manda la City, inspector. Lo de Berner Street es de ustedes. Usted está aquí de favor.',
    ]) ok(M.includes(t), `falta: ${t.slice(0, 60)}`);
  }],
  ['los textos y el objeto del cuerpo siguen como estaban (kate, cara, cuello, vientre, delantal, pulso)', () => {
    const M = src('scenes/mitre.js');
    for (const t of ["id: 'cuello', x: 360, y: 337, r: 45, name: 'El cuello'", "id: 'vientre', x: 766, y: 398, r: 85, name: 'El vientre'", "id: 'delantal', x: 1110, y: 536, r: 70, name: 'El delantal'", "id: 'pulso', key: true, x: 903, y: 100, r: 55, name: 'La muñeca'", "id: 'cara', key: true, x: 253, y: 306, r: 60, name: 'La cara'"]) ok(M.includes(t), `cambió: ${t}`);
  }],
  // ------------------------------------------------------------ gates and the saves
  ['el camino antiguo sigue: con placa, trozo y testigo se puede salir (sin aviso ni ciudad)', () => {
    ok(canLeaveMitre(st({ flags: { mitre_badge: true }, clues: ['trozo', 'testigo'] })).ok, 'la salida se bloqueó');
  }],
  ['el aviso de Berner Street no es puerta de salida', () => {
    const r = canLeaveMitre(st({ flags: { mitre_badge: true }, clues: ['trozo', 'berner_aviso'] }));
    eq(r.missing.length, 1, 'faltaba solo el testigo');
    ok(!r.ok, 'con el aviso y sin testigo no se sale');
    ok(canLeaveMitre(st({ flags: { mitre_badge: true }, clues: ['trozo', 'testigo'] })).ok, 'el camino viejo sigue');
  }],
  ['los flags nuevos no existen por defecto', () => {
    eq(st().flags.mitre_city, undefined, 'mitre_city');
    ok(!st().clues.includes('berner_aviso'), 'berner_aviso');
    eq(normalizeState(fixture('legacy-c3-pre-v3.json')).flags.mitre_city, undefined, 'mitre_city en un guardado viejo');
  }],
  ['el juego no cambia de pistas, flags ni deducciones al normalizar un guardado sin el aviso', () => {
    const raw = fixture('saves-v1-baseline/c3.json');
    const s = normalizeState(clone(raw));
    eq(s.clues, raw.clues); eq(s.deductions, raw.deductions);
    ok(!s.clues.includes('berner_aviso'), 'no añade el aviso');
  }],
  // ------------------------------------------------------------ the question «doble»
  ['doble no aparece sin el aviso, aunque haya trozo y testigo', () => {
    const s = st({ clues: ['trozo', 'testigo'] });
    ok(!evaluate(s).some((t) => t.id === 'doble'), 'doble se ve con trozo y testigo sin aviso');
    ok(!evaluate(st({ clues: ['berner_aviso'] })).some((t) => t.id === 'doble'), 'doble se ve sin trozo');
  }],
  ['doble aparece con el aviso y el trozo; el aviso solo le da «no relacionados»', () => {
    const s = st({ clues: ['trozo', 'berner_aviso'] });
    const t = evaluate(s).find((x) => x.id === 'doble');
    ok(t, 'no aparece');
    const S = statuses(s);
    eq(S['doble.no_relacionados'], 'plausible');
    eq(S['doble.vinculados'], 'sin evaluar');
  }],
  ['con el aviso y el testigo, «vinculados» es plausible', () => {
    const S = statuses(st({ clues: ['trozo', 'berner_aviso', 'testigo'] }));
    eq(S['doble.vinculados'], 'plausible');
  }],
  ['las cinco teorías anteriores siguen en su orden, y doble no aparece en ningún guardado', () => {
    eq(THEORIES.map((t) => t.id), ['intruso', 'brennan', 'carta', 'horas', 'rondas', 'doble']);
    const FIX = new URL('../fixtures/', import.meta.url);
    const files = [];
    const walk = (dir) => { for (const f of readdirSync(dir)) { const u = new URL(f + (statSync(new URL(f, dir)).isDirectory() ? '/' : ''), dir); if (statSync(u).isDirectory()) walk(u); else if (f.endsWith('.json')) files.push(u); } };
    walk(FIX);
    ok(files.length >= 11, `guardados: ${files.length}`);
    for (const u of files) {
      const s = normalizeState(JSON.parse(readFileSync(u, 'utf8')));
      ok(!evaluate(s).some((t) => t.id === 'doble'), `doble aparece en ${u.pathname.split('/fixtures/')[1]}`);
    }
  }],
  ['doble nunca es sostenida, con cualquier combinación de pruebas y de la flag awake', () => {
    const pool = ['trozo', 'berner_aviso', 'testigo', 'trozo'];
    for (let mask = 0; mask < 16; mask++) for (const awake of [false, true]) {
      const clues = pool.filter((_, i) => mask & (1 << i));
      const S = statuses(st({ clues, flags: awake ? { awake: true } : {} }));
      for (const h of ['vinculados', 'no_relacionados']) ok(S[`doble.${h}`] !== 'sostenida', `${clues} awake=${awake} ${h}`);
    }
  }],
  ['doble no entra en las fuentes finales ni en el final', () => {
    eq(Object.keys(FINAL_SOURCES).sort(), ['f_anat', 'f_barro', 'f_exp', 'f_ronda', 'f_testigo', 'f_zurdo']);
    ok(!Object.values(FINAL_SOURCES).some((v) => /doble|berner/.test(String(v))), 'una fuente habla de doble');
    eq(finalSources(st({ clues: ['trozo', 'berner_aviso', 'testigo'] })), []);
  }],
  ['evaluar doble no escribe nada en el estado', () => {
    const s = st({ clues: ['trozo', 'berner_aviso', 'testigo'] });
    const before = clone(s);
    evaluate(s);
    eq(s, before);
  }],
  // ------------------------------------------------------------ the position «double_event»
  ['double_event aparece solo con el aviso y el trozo', () => {
    eq(QUESTIONS.double_event.visible(st({ clues: ['berner_aviso'] })), false, 'sin trozo');
    eq(QUESTIONS.double_event.visible(st({ clues: ['trozo', 'testigo'] })), false, 'sin aviso');
    eq(QUESTIONS.double_event.visible(st({ clues: ['trozo', 'berner_aviso'] })), true, 'con los dos');
  }],
  ['setPosition escribe double_event con su base; vinculados y no relacionados son distintos', () => {
    const s = st({ clues: ['trozo', 'berner_aviso', 'testigo'] });
    eq(setPosition(s, 'double_event', 'vinculados'), true);
    eq(readPosition(s, 'double_event'), 'vinculados');
    eq(s.investigation.revisions.at(-1).basis, ['for:clue:berner_aviso', 'for:clue:testigo']);
    eq(setPosition(s, 'double_event', 'no_relacionados'), true);
    eq(readPosition(s, 'double_event'), 'no_relacionados');
    eq(s.investigation.revisions.at(-1).basis, ['for:clue:berner_aviso']);
    eq(setPosition(s, 'double_event', 'insuficiente'), true);
    eq(s.investigation.revisions.at(-1).basis, []);
  }],
  ['double_event no se escribe con awake, con second ni sin ver la pregunta', () => {
    const base = ['trozo', 'berner_aviso'];
    eq(setPosition(st({ clues: base, flags: { awake: true } }), 'double_event', 'vinculados'), false, 'awake');
    eq(setPosition(st({ clues: base, flags: { second: true } }), 'double_event', 'vinculados'), false, 'second');
    eq(setPosition(st({ clues: ['berner_aviso'] }), 'double_event', 'vinculados'), false, 'no visible');
  }],
  ['elegir una postura de double_event no cambia las teorías', () => {
    const s = st({ clues: ['trozo', 'berner_aviso', 'testigo'] });
    const before = statuses(s);
    setPosition(s, 'double_event', 'vinculados');
    eq(statuses(s), before);
  }],
  ['ningún título visible de Mitre Square nombra a las víctimas', () => {
    const text = readFileSync(new URL('../../src/scenes/mitre.js', import.meta.url), 'utf8');
    const visible = text.split('\n').filter((l) => /title:|name:|G.say|G.think|G.doc|G.card/.test(l));
    for (const w of ['Eddowes', 'Kate', 'Stride', 'Kelly']) ok(!visible.some((l) => l.includes(w)), 'aparece ' + w + ' en un texto visible');
  }],
  ['la teoría doble no aparece sin el aviso de Berner Street', () => {
    const s = st({ clues: ['testigo', 'trozo'] });
    ok(!evaluate(s).some((t) => t.id === 'doble'), 'doble visible sin berner_aviso');
    const con = st({ clues: ['testigo', 'trozo', 'berner_aviso'] });
    ok(evaluate(con).some((t) => t.id === 'doble'), 'doble no aparece con el aviso');
  }],
];
