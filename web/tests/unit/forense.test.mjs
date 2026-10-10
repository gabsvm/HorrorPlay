// The forense's reading of the cuts (zurdo, anatomia, d_zurdo, f_zurdo), the chronology of the note in
// Greaves's drawer, and Brennan corrected in the notebook. The texts are read as the story gives them.
import { CLUES, DEDUCTIONS } from '../../src/story/data.js';
import { normalizeState, canFinishC1, canEnterFinale, finalSources } from '../../src/story/progression.js';
import { setPosition, readPosition } from '../../src/story/positions.js';
import { statuses } from '../../src/story/theories.js';
import { ok, eq } from './assert.mjs';
import { readFileSync, readdirSync } from 'node:fs';

const st = (o = {}) => normalizeState({ chapter: 'c1', scene: 'knackers', flags: {}, items: [], clues: [], deductions: [], profile: [], sanity: 100, ...o });
const src = (p) => readFileSync(new URL(`../../src/${p}`, import.meta.url), 'utf8');
const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : [new URL(e.name, dir)]));
const SRC_JS = walk(new URL('../../src/', import.meta.url)).filter((u) => u.pathname.endsWith('.js'));
// the source files (relative to src/) whose text matches re
const hits = (re) => SRC_JS.filter((u) => re.test(readFileSync(u, 'utf8'))).map((u) => u.pathname.split('/src/')[1]);

export const tests = [
  // ------------------------------------------------------------ texts
  ['los textos del forense y de sus deducciones son los aprobados, con el mismo efecto', () => {
    eq(CLUES.zurdo.text, 'Según el forense, los cortes van de izquierda a derecha y podrían ser obra de un zurdo.');
    eq(CLUES.anatomia.text, 'El forense cree que el asesino tenía alguna noción, tosca, de anatomía.');
    const d = DEDUCTIONS.find((x) => x.id === 'd_zurdo');
    eq([d.a, d.b, d.flag ?? null, d.denial ?? false], ['zurdo', 'anatomia', null, false], 'd_zurdo sigue uniendo zurdo y anatomía, sin flag');
    eq(d.text, 'Si el forense acierta, un zurdo que sabe dónde cortar: un matarife, un carnicero... o un médico. Técnica no es lo mismo que estudios.');
    eq(d.profile, 'Quizá zurdo, quizá con nociones de anatomía');
    eq(DEDUCTIONS.find((x) => x.id === 'f_zurdo').text, 'El forense creyó ver a un zurdo. Yo escribo con la izquierda.');
  }],
  ['la línea de Pike y la de Greaves dicen lo aprobado', () => {
    ok(src('scenes/bucks_row.js').includes("G.say('Pike', 'Llewellyn cree que los cortes podrían ser de un zurdo.')"), 'Pike');
    ok(!src('scenes/bucks_row.js').includes('los cortes los hizo un zurdo'), 'Pike: texto antiguo');
    ok(src('scenes/hanbury.js').includes("G.say('Greaves', 'Parece trabajo de alguien acostumbrado a la disección.')"), 'Greaves');
    ok(!src('scenes/hanbury.js').includes('Es trabajo de alguien acostumbrado'), 'Greaves: texto antiguo');
  }],
  // ------------------------------------------------------------ chronology
  ['cronología: Swanson y el 19 de octubre solo aparecen en la nota del cajón de Greaves', () => {
    eq(hits(/swanson/i), ['scenes/greaves.js'], 'Swanson');
    eq(hits(/19 de octubre/), ['scenes/greaves.js'], '19 de octubre');
    ok(src('scenes/greaves.js').includes('NOTA DEL INSPECTOR JEFE D. S. SWANSON'), 'cargo: inspector jefe');
  }],
  ['la signatura HO 144 no aparece en el juego', () => {
    eq(hits(/HO 144/), []);
  }],
  // ------------------------------------------------------------ chapter I and the finale
  ['d_zurdo sigue contando para cerrar el primer capítulo', () => {
    ok(canFinishC1(st({ clues: ['zurdo', 'bisturi'], deductions: ['d_zurdo'], flags: { wren_met: true } })).ok);
  }],
  ['f_zurdo es una fuente más: el final pide tres fuentes distintas, con o sin el forense', () => {
    eq(finalSources(st({ deductions: ['f_zurdo'] })), ['forense']);
    const enough = [
      ['f_zurdo', 'f_anat', 'f_exp'],       // forense, objeto, expediente
      ['f_zurdo', 'f_anat', 'f_testigo'],   // forense, objeto, testigo
      ['f_zurdo', 'f_ronda', 'f_exp'],      // forense, registro, expediente
      ['f_anat', 'f_testigo', 'f_ronda'],   // sin el forense: objeto, testigo, registro
      ['f_anat', 'f_exp', 'f_testigo'],     // sin el forense: objeto, expediente, testigo
    ];
    for (const d of enough) ok(canEnterFinale(st({ deductions: d })).ok, `basta: ${d.join('+')}`);
    const short = [
      ['f_zurdo', 'f_anat'],                // dos fuentes
      ['f_zurdo', 'f_barro', 'f_anat'],     // el barro no cuenta
      ['f_zurdo', 'f_zurdo', 'f_anat'],     // la misma fuente dos veces
      ['f_anat', 'f_testigo', 'f_barro'],   // dos fuentes y el barro
      ['f_testigo', 'f_ronda'],             // dos fuentes sin el forense
    ];
    for (const d of short) ok(!canEnterFinale(st({ deductions: d })).ok, `no basta: ${d.join('+')}`);
  }],
  // ------------------------------------------------------------ Brennan, corrected
  ['Brennan se corrige en el cuaderno: la revisión guarda la base de la postura anterior', () => {
    const s = st({ chapter: 'c2', clues: ['brennan_zurdo', 'delantal'], deductions: ['d_brennan'] });
    const before = statuses(s);
    eq(setPosition(s, 'br_suspect', 'brennan'), true, 'primera postura');
    eq(setPosition(s, 'br_suspect', 'insuficiente'), true, 'la corrección se escribe');
    const r = s.investigation.revisions;
    eq(r.length, 2, 'dos revisiones');
    eq([r[0].question, r[0].from, r[0].to], ['br_suspect', null, 'brennan']);
    ok(r[0].basis.includes('for:clue:brennan_zurdo') && r[0].basis.includes('for:ded:d_brennan'), `la primera se apoya en lo que había: ${r[0].basis}`);
    eq([r[1].from, r[1].to, r[1].basis], ['brennan', 'insuficiente', []], 'la corrección no se apoya en nada');
    eq(readPosition(s, 'br_suspect'), 'insuficiente');
    eq(statuses(s), before, 'la postura no mueve las teorías');
  }],
  ['la nota de Swanson no afirma caso ni cita signaturas de archivo', () => {
    const text = src('scenes/greaves.js');
    ok(!text.includes("Asunto: Buck's Row (Nichols)"), 'la atribución al caso no está confirmada');
    ok(!text.includes('HO 144'), 'la signatura moderna de archivo no va en el juego');
  }],
];
