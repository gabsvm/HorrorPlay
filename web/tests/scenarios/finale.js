// Chapter four to the end, three times: each last act before Pike (surrender, warn Wren, tear the
// page) paired with a different way of meeting the water (keep quiet, the hand, answer), on both
// roads of 1866. Each act is seen happening and leaves its own trace in the epilogue; "not yet"
// at the water steps back; the water never claims to come in now; the name ends in Jack.
//   node web/tools/walk.mjs finale
import { scenario, fixture } from './harness.js';

const RUNS = [
  // [last act pick, intent, water pick, attitude, answered in 1866, what the gap left on him, Wren's line, the card]
  ['Deténgame', 'surrender', 'Callar', 'silent', false, /esposa cerrada/, /esposa puesta/, /esposa abierta en un cajón/],
  ['Proteja a Wren', 'warn_wren', 'Taparme', 'hand', true, /Barber, las cajas/, /me dio su silbato/i, /no volvió a dormir junto al Ditch/],
  ['Romper el folio', 'destroy_page', 'Responder', 'answer', false, /mitad de una firma/, /papel roto/, /folio roto/],
];

export async function run(opts) {
  return scenario(async ({ game, start, act, deduce, need, chain, expectScene, waitScene, flag, settle }) => {
    const snap = await fixture('saves-v1-baseline/c4.json');
    const seen = [];
    for (const [pick, intent, waterPick, attitude, answered, gap, wrenSays, card] of RUNS) {
      const s = JSON.parse(JSON.stringify(snap));
      s.flags.answered1866 = answered; s.flags.entry_year = answered ? 1866 : 1879;
      await start('c4', s);
      expectScene('greaves');
      await act('drawer', 'bisturi');
      let n = window.LOG.length;
      await act('cabinet', 'llave', ['Todavía no sé quién la escribió.', 'acusando', pick]);
      await waitScene('foreshore');
      expectScene('foreshore');
      let log = window.LOG.slice(n).join('\n');
      need(flag('final_intent') === intent, `Intención ${intent}`);
      need(/22:51/.test(log) && /2:30/.test(log), 'La laguna se muestra con el salto de hora');
      need(gap.test(log), `Lo que intentó sigue en él al despertar (${intent})`);
      if (intent === 'surrender') need(flag('pike_cuff') && /Las manos, Thomas/.test(log), 'La detención empieza antes de la laguna');
      if (intent === 'warn_wren') need(flag('wren_warned') && /Barber, Winthrop Street/.test(log), 'Pike repite el aviso: lo ha recibido');
      if (intent === 'destroy_page') need(flag('file_torn'), 'El folio queda roto');
      need(!new RegExp(answered ? 'Callé aquella noche' : 'Yo abrí la puerta').test(log), 'La llegada al agua respeta la respuesta de 1866');
      // the water before the evidence: back to the notebook
      await act('water');
      need(game.state.scene === 'foreshore', 'Sin pruebas suficientes no empieza el final');
      for (const c of ['zurdo', 'bisturi', 'testigo']) await deduce('ficha', c);
      need(flag('recognized'), 'Con tres pruebas independientes llega el reconocimiento, sin monólogo');
      // the sources are not the whole question: the water waits for the chain of the name (V5-03)
      await act('water');
      need(game.state.scene === 'foreshore' && !flag('water_reply_intent'), 'Sin ordenar la cadena del nombre el agua no se abre');
      await chain();
      need(flag('v5_name_chain') === 'reasoned', 'La cadena queda ordenada');
      // "not yet": he steps back, nothing is lost
      await act('water', null, ['Todavía no']);
      need(game.state.scene === 'foreshore' && flag('water_reply_intent') === 'unsure', '«Todavía no» devuelve al cuaderno');
      n = window.LOG.length;
      await act('water', null, [waterPick]);
      await waitScene('millers');
      for (let i = 0; i < 400 && !game.inMenu; i++) await new Promise((r) => setTimeout(r, 20));
      await settle();
      log = window.LOG.slice(n).join('\n');
      need(flag('water_reply_intent') === attitude, `Actitud ante el agua: ${attitude}`);
      need(!/entra ahora|ahora entro|te dejo entrar/i.test(log), 'El final no declara una entrada nueva');
      need(wrenSays.test(log), `Wren muestra lo que hizo Thomas (${intent})`);
      need(card.test(log), `El epílogo lo deja escrito (${intent})`);
      need(/\[firma: Jack\]/.test(log), 'La firma termina en Jack');
      need(game.inMenu, 'Vuelve al menú al terminar');
      seen.push(`${intent}/${attitude}/${answered ? 1866 : 1879}`);
    }
    return { seen };
  }, opts);
}
