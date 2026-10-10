// Brennan in the real game (V4-04). (a) Closing the night with Brennan says «No fue él» and the notebook
// cites it; closing with Pike does not. (b) A save in the middle of talking with Brennan resumes without
// repeating the alibi or duplicating flags, clues or deductions. (c) The mob: every posture against every
// outcome it offers (suspect / clear / unsure; severe only with the apron or with «hay que vigilarlo»;
// injured and protected always), each one resolved, with the lines of the accusation read back.
//   node web/tools/walk.mjs brennan
import { scenario, fixture } from './harness.js';

const clone = (x) => JSON.parse(JSON.stringify(x));
const WREN = 'Wren: «No fue él»';

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, settle, flag, clue }) => {
    const { Game } = await import('../../src/engine/game.js');
    const { evaluate } = await import('../../src/story/theories.js');
    // the evidence against Brennan as the notebook names it now (the theory is absent until some clue shows)
    const brennanNotes = () => {
      const t = evaluate(game.state).find((x) => x.id === 'brennan');
      return t ? t.hyps.find((h) => h.id === 'brennan').against : [];
    };

    // the night up to Wren's scalpel, with the surgeon's reading and a conclusion (d_bisturi)
    const toKnackersWithScalpel = async () => {
      await start('c1', await fixture('saves-v1-baseline/c1.json'));
      await act('coat'); await act('boots'); await act('lantern'); await act('door'); expectScene('bucks_row');
      await act('pike', null, ['médico']);
      await act('pike', null, ['trabaja de noche']);
      await act('west'); expectScene('knackers');
      await act('wren', null, ['Dejarle el penique', 'Por qué']);
      need(clue('bisturi'), 'Falta el bisturí');
      await deduce('bisturi', 'anatomia');
    };

    // (a) closing with Brennan: Wren says it, the notebook cites it
    await toKnackersWithScalpel();
    let n = window.LOG.length;
    need(!brennanNotes().includes(WREN), 'antes de cerrar la noche no hay prueba de Wren');
    await act('brennan', null, ['Esto es todo', 'todavía no lo sé']);
    await waitScene('hanbury'); expectScene('hanbury');
    const withBrennan = window.LOG.slice(n).join('\n');
    need(/Wren: No fue él\./.test(withBrennan), 'cerrada con Brennan, Wren dice «No fue él»');
    need(flag('v4_wren_not_him') === true, 'cerrada con Brennan, queda el flag');
    need(game.state.investigation.routes.c1.closedAt === 'knackers', 'la ruta dice que se cerró en el desolladero');
    need(brennanNotes().includes(WREN), 'cerrada con Brennan, el cuaderno cita a Wren');

    // ... and closing with Pike: no line, no flag, no citation
    await toKnackersWithScalpel();
    await act('east'); expectScene('bucks_row');
    n = window.LOG.length;
    await act('pike', null, ['Cerramos por esta noche', 'todavía no lo sé']);
    await waitScene('hanbury'); expectScene('hanbury');
    need(!/No fue él/.test(window.LOG.slice(n).join('\n')), 'cerrada con Pike, Wren no dice «No fue él»');
    need(!flag('v4_wren_not_him'), 'cerrada con Pike, no hay flag');
    need(game.state.investigation.routes.c1.closedAt === 'bucks_row', 'la ruta dice que se cerró en Buck\'s Row');
    need(!brennanNotes().includes(WREN), 'cerrada con Pike, el cuaderno no cita a Wren');

    // (b) a save in the middle of Brennan's talk: the alibi is said once, and resuming keeps everything
    await toKnackersWithScalpel();
    await act('brennan', null, ['¿Dónde estaba a las tres']);
    need(flag('br_alibi') && !flag('br_heard'), 'la coartada está dada y lo que oyeron no');
    const flagsBefore = clone(game.state.flags), cluesBefore = clone(game.state.clues), dedBefore = clone(game.state.deductions);
    game.save();
    window.FAST = false; game.autosave(); window.FAST = true;
    const r = Game.loadResume();
    need(r && r.state.flags.br_alibi === true, 'el punto de reanudación guarda la coartada');
    n = window.LOG.length;
    await game.resume(r);
    await settle();
    expectScene('knackers');
    need(JSON.stringify(game.state.flags) === JSON.stringify(flagsBefore), 'reanudar no cambia las banderas');
    need(JSON.stringify(game.state.clues) === JSON.stringify(cluesBefore), 'reanudar no cambia las pistas');
    need(JSON.stringify(game.state.deductions) === JSON.stringify(dedBefore), 'reanudar no cambia las deducciones');
    need(!window.LOG.slice(n).join('\n').includes('Con tres hombres'), 'reanudar no repite la coartada');
    await act('brennan', null, ['¿No oyeron nada']);
    const afterTalk = window.LOG.slice(n).join('\n');
    need(!afterTalk.includes('Con tres hombres'), 'hablar de lo que oyeron no repite la coartada');
    need(flag('br_heard') && flag('br_alibi'), 'las dos banderas quedan puestas una vez');
    need(new Set(game.state.clues).size === game.state.clues.length, 'ninguna pista repetida');
    need(new Set(game.state.deductions).size === game.state.deductions.length, 'ninguna deducción repetida');

    // (c) the mob. The shortest way to Barber's yard after the séance, as in the mob scenario
    await start('c2', await fixture('saves-v1-baseline/c2.json'));
    await act('greaves', null, ['corte']); await act('apron'); await act('amelia');
    await act('comb', null, ['Guardármelo']);
    await act('passage'); expectScene('seance');
    await act('chart'); await act('table'); await act('table');
    await act('table', 'peine');
    need(flag('seance_done') && clue('hospes'), 'Sesión y golpes hechos');
    const before = clone(game.state);

    const LABEL = { injured: 'Pedir que se disperse', protected: 'escolten', severe: 'Acusar' };
    const REPLY = { injured: 'No me dejaron', protected: 'Era lo que había', severe: 'Lo sospechaba' };
    const DENIED = /culpable|es el asesino|lo hizo|demostrad|confes|prueba de que/i;
    const extra = { matrix: [], severeLines: {} };

    const runMob = async ({ stance, deduced, outcome, amelia }) => {
      const tag = `${stance}/${deduced ? 'con delantal' : 'sin delantal'}/${outcome}/${amelia ? 'con amelia1' : 'sin amelia1'}`;
      game.state = clone(before);
      game.state.flags.brennan_stance = stance;
      if (amelia) game.state.flags.amelia1 = true; else delete game.state.flags.amelia1;
      if (deduced) {
        if (!game.state.deductions.includes('d_delantal')) { game.state.clues.push('brennan_zurdo'); await deduce('delantal', 'brennan_zurdo'); }
      } else game.state.deductions = game.state.deductions.filter((d) => d !== 'd_delantal');
      await game.goto('seance', { x: 240, noEnter: true });
      const from = window.LOG.length;
      await act('door', null, [LABEL[outcome], REPLY[outcome]]);
      await waitScene('room');
      const log = window.LOG.slice(from);
      const text = log.join('\n');
      need(game.state.scene === 'room', `${tag}: no llega a la habitación (softlock en ${game.state.scene})`);
      need(game.state.flags.brennan_outcome === outcome, `${tag}: el desenlace fue ${game.state.flags.brennan_outcome}`);
      need(!!game.state.flags.wren_mob_reply, `${tag}: la respuesta a Wren debe guardarse`);
      if (outcome === 'protected') need(!/no tenía nada contra él|Lo dijo tarde/.test(text), `${tag}: Wren no puede culpar a quien lo protegió`);
      if (outcome !== 'severe') need(!/Acusar a Brennan/.test(text), `${tag}: sin acusación no se ofrece acusar`);
      if (outcome === 'severe') {
        // the accusation: no line of it calls Brennan guilty as a fact; the apron line only when amelia1
        need(!log.some((l) => DENIED.test(l)), `${tag}: una línea de la acusación afirma la culpa como demostrada`);
        need(/El delantal lo lavó/.test(text) === amelia, `${tag}: la línea del delantal solo con amelia1`);
        extra.severeLines[amelia ? 'conAmelia1' : 'sinAmelia1'] = log;
      }
      extra.matrix.push(tag);
    };

    // every posture; severe only where it is offered (the apron deduced, or «hay que vigilarlo»)
    for (const stance of ['suspect', 'clear', 'unsure']) {
      for (const deduced of [true, false]) {
        const outcomes = ['injured', 'protected'];
        if (deduced || stance === 'suspect') outcomes.unshift('severe');
        for (const outcome of outcomes) {
          for (const amelia of outcome === 'severe' ? [true, false] : [true]) {
            await runMob({ stance, deduced, outcome, amelia });
          }
        }
      }
    }
    // suspect: 4 + 4; clear and unsure with the apron: 4 each; without it: 2 each
    need(extra.matrix.length === 20, `combinaciones recorridas: ${extra.matrix.length}`);
    return extra;
  }, opts);
}
