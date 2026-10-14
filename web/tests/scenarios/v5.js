// V5: the suspicion of one's own hand reaches Greaves's cabinet as a posture (and the file, as before), and the
// chain of the name is ordered on the foreshore: wrong answers are answered, two misses bring the help, four
// close the question, «dejarlo» costs nothing, a review costs nothing, an old save still gets the street.
//   node web/tools/walk.mjs v5
import { scenario, fixture } from './harness.js';

const CHAIN_HELP = 'Tres fechas: el 25, el 27 y el 1 de octubre.';

export async function run(opts) {
  return scenario(async ({ game, start, act, need, expectScene, waitScene, flag, settle, chain }) => {
    // ---- the posture «yo» at the cabinet, and Greaves answers it
    const snap = await fixture('saves-v1-baseline/c4.json');
    need(!snap.clues.includes('eco'), 'el guardado de prueba no trae «eco»');
    await start('c4', JSON.parse(JSON.stringify(snap)));
    expectScene('greaves');
    need(game.state.clues.includes('eco'), 'un guardado del capítulo IV con la carta recibe «eco» al cargar');
    await act('drawer', 'bisturi');
    let n = window.LOG.length;
    await act('cabinet', 'llave', ['Pude escribirla yo', 'acusando', 'Deténgame']);
    await waitScene('foreshore');
    let log = window.LOG.slice(n).join('\n');
    need(game.state.investigation.positions.letter_author === 'yo', 'la postura «yo» queda escrita');
    need(game.state.investigation.revisions.length === 1, 'una sola revisión');
    need(flag('final_intent') === 'surrender', 'la postura no cambia la intención final');
    need(!!game.state.flags.sospecha_greaves === !!snap.flags.sospecha_greaves, 'la postura propia no cambia la sospecha de Greaves');
    need(/ya has pensado en tu propia mano/.test(log), 'Greaves responde a la sospecha de su propia mano');
    need(/Ya había pensado en mi propia mano/.test(log), 'Thomas contesta a su propia sospecha al despertar');
    need(/Mi mano izquierda se ha cerrado sobre algo que no tengo/.test(log), 'el cuerpo recuerda antes del agua');
    expectScene('foreshore');
    need(flag('awake') && !flag('recognized'), 'despierto, sin reconocimiento todavía');

    // ---- the chain: nothing is lost by leaving, nothing by missing
    game.state.sanity = 60;   // the fixture arrives worn out; leave room to see the cost
    const sanity0 = game.state.sanity;
    // the notebook's button path: the page closes, and closing it starts the script
    window.PICKS = ['Dejarlo'];
    game.pendingChain = true;
    n = window.LOG.length;
    await game.onNotebookClosed();
    await settle();
    log = window.LOG.slice(n).join(' ');
    need(game.pendingChain === false && /Los papeles no se van/.test(log), 'cerrar el cuaderno con la petición arranca la cadena, y dejarla no cuesta');
    need(!flag('v5_name_chain') && game.state.sanity === sanity0, 'dejarla no la resuelve ni cuesta cordura');

    n = window.LOG.length;
    await chain([0, 1, 'Dejarlo']);   // Q1: a miss, then right; Q2: leave it for later
    log = window.LOG.slice(n).join(' ');
    need(/La carta está fechada el 25/.test(log), 'el error de la primera pregunta se contesta');
    need(!flag('v5_name_chain') && game.state.sanity === sanity0, 'dejarla a mitad no resuelve ni cuesta');

    // Q1: two misses (the help comes), look again, right; Q2: four misses (Thomas says it and closes it); Q3: right
    n = window.LOG.length;
    await chain([2, 0, 3, 1, 0, 1, 0, 1, 0]);
    log = window.LOG.slice(n).join(' ');
    need(log.includes(CHAIN_HELP), 'dos fallos traen la ayuda de la primera pregunta');
    need(log.includes('Una copia y un resumen de la misma carta cuentan una sola vez.'), 'dos fallos traen la ayuda de la segunda');
    need(log.includes('No: son la misma carta copiada'), 'tras cuatro fallos Thomas dice la respuesta y la pregunta se cierra');
    need(flag('v5_name_chain') === 'reasoned', 'la cadena queda ordenada');
    need(game.state.investigation.evaluations.chain.misses === 6, 'se cuentan los fallos');
    need(game.state.sanity === sanity0 - 3, 'cuesta lo mismo con seis fallos que con ninguno: 3');
    need(/Primero hubo una mano. Después, una firma/.test(log) && /Le dio un lugar en la ciudad/.test(log), 'Thomas dice el orden, no una teoría');
    need(/Al «Thomas» contesté en 1879/.test(log), 'el eco del prólogo cambia con la ruta (calló en 1866)');
    need(!/entra(r|n)?|poseíd|contagi/i.test(log), `ninguna palabra de contagio: ${(log.match(/.{0,30}(entra(r|n)?|poseíd|contagi).{0,30}/i) || [])[0]}`);
    need(game.state.clues.includes('eco'), 'la pista de la calle consta');

    // a review is free and asks nothing
    const sanity1 = game.state.sanity;
    n = window.LOG.length;
    await chain([]);
    log = window.LOG.slice(n).join(' ');
    need(game.state.sanity === sanity1 && /Primero hubo una mano/.test(log) && !/  > /.test(log), 'repasarla no cuesta ni pregunta');

    // ---- the second reading orders the same chain
    const sec = await fixture('saves-v1-baseline-second/c4.json');
    await start('c4', JSON.parse(JSON.stringify(sec)), { second: true });
    expectScene('greaves');
    await act('drawer', 'bisturi');
    await act('cabinet', 'llave', ['acusando', 'Deténgame']);
    await waitScene('foreshore');
    await chain();
    need(flag('v5_name_chain') === 'reasoned', 'la segunda lectura ordena la misma cadena');
    return { sanity0 };
  }, opts);
}
