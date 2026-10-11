// The ending's matrix (V4-14): both roads of 1866/1879 × the three last acts before Pike × the three ways of
// meeting the water × three sanity bands. The factors are covered in full pairs: the 18 runs are the nine
// rows of an orthogonal array of three levels for (act, water, sanity), each taken on both roads. Each run
// reaches the end, the name ends in Jack, and nothing is claimed as a new entry into 1888.
//   node web/tools/walk.mjs finale14
import { scenario, fixture } from './harness.js';

const ACTS = [
  { pick: 'Deténgame', intent: 'surrender', gap: /esposa cerrada/, wren: /esposa puesta/, card: /esposa abierta en un cajón/ },
  { pick: 'Proteja a Wren', intent: 'warn_wren', gap: /Barber, las cajas/, wren: /me dio su silbato/i, card: /no volvió a dormir junto al Ditch/ },
  { pick: 'Romper el folio', intent: 'destroy_page', gap: /mitad de una firma/, wren: /papel roto/, card: /folio roto/ },
];
const WATER = [
  { pick: 'Callar', attitude: 'silent' },
  { pick: 'Taparme', attitude: 'hand' },
  { pick: 'Responder', attitude: 'answer' },
];
const BANDS = [100, 50, 10];   // steady, strained, frayed

// the nine rows of an orthogonal array L9(3^3): every pair of the three factors meets every pair of levels
const L9 = [];
for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) L9.push([a, b, (a + b) % 3]);

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, expectScene, waitScene, flag, settle }) => {
    const snap = await fixture('saves-v1-baseline/c4.json');
    const seen = [];
    for (const answered of [true, false]) {
      for (const [ai, wi, bi] of L9) {
        const A = ACTS[ai], W = WATER[wi], sanity = BANDS[bi];
        const s = JSON.parse(JSON.stringify(snap));
        s.flags.answered1866 = answered;
        s.flags.entry_year = answered ? 1866 : 1879;
        s.sanity = sanity;
        await start('c4', s);
        expectScene('greaves');
        await act('drawer', 'bisturi');
        let n = window.LOG.length;
        await act('cabinet', 'llave', ['acusando', A.pick]);
        await waitScene('foreshore');
        expectScene('foreshore');
        let log = window.LOG.slice(n).join('\n');
        const label = `${answered ? 1866 : 1879}/${A.intent}/${W.attitude}/${sanity}`;
        need(flag('final_intent') === A.intent, `Intención ${label}`);
        need(A.gap.test(log), `Lo que intentó sigue en él al despertar (${label})`);
        need(!new RegExp(answered ? 'Callé aquella noche' : 'Yo abrí la puerta').test(log), `La llegada al agua respeta 1866 (${label})`);
        await act('water');
        need(game.state.scene === 'foreshore', `Sin pruebas suficientes no empieza el final (${label})`);
        for (const c of ['zurdo', 'bisturi', 'testigo']) await deduce('ficha', c);
        need(flag('recognized'), `Con tres pruebas independientes llega el reconocimiento (${label})`);
        n = window.LOG.length;
        await act('water', null, [W.pick]);
        await waitScene('millers');
        for (let i = 0; i < 400 && !game.inMenu; i++) await new Promise((r) => setTimeout(r, 20));
        await settle();
        log = window.LOG.slice(n).join('\n');
        need(flag('water_reply_intent') === W.attitude, `Actitud ante el agua (${label})`);
        need(!/entra ahora|ahora entro|te dejo entrar/i.test(log), `El final no declara una entrada nueva (${label})`);
        need(A.wren.test(log), `Wren muestra lo que hizo Thomas (${label})`);
        need(A.card.test(log), `El epílogo lo deja escrito (${label})`);
        need(/\[firma: Jack\]/.test(log), `La firma termina en Jack (${label})`);
        need(game.inMenu, `Vuelve al menú al terminar (${label})`);
        seen.push(label);
      }
    }
    return { runs: seen.length, seen };
  }, opts);
}
