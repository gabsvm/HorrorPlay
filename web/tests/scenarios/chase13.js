// Thomas's clothes after the chase (V4-13): in the room of chapter one after the run (room_phase 'c3b')
// the coat, the bowler and the lantern hang on the pegs and he has none of them on. Any other place,
// and any other phase, he is dressed as before. Nothing is stored: the clothes follow the place.
//   node web/tools/walk.mjs chase13
import { scenario } from './harness.js';

export async function run(opts) {
  return scenario(async ({ game, need, settle }) => {
    const p = game.player;
    game.state.flags.room_phase = 'c3b';
    game.dressFor('room');
    need(p.hat === 'none' && p.lantern === false, 'en c3b Thomas no lleva bombín ni linterna');
    need(p.coat !== '#23262b', 'en c3b no lleva el abrigo puesto');
    game.dressFor('foreshore');
    need(p.hat === 'bowler' && p.lantern === true && p.coat === '#23262b', 'fuera de la habitación vuelve a vestirse');
    game.state.flags.room_phase = 'c3a';
    game.dressFor('room');
    need(p.hat === 'bowler' && p.lantern === true, 'en otra fase de la habitación va vestido');
    game.state.flags.room_phase = 'c3b';
    game.dressFor('room');
    game.state.flags.room_phase = 'c4';
    game.dressFor('room');
    need(p.hat === 'bowler', 'al pasar a c4 la ropa vuelve al actor');
    // the prologue's child keeps his own look when the scene changes (no adult clothes on him)
    game.state.chapter = 'prologue';
    p.hat = 'cap'; p.coat = '#3a342c'; p.lantern = false;
    game.dressFor('foreshore');
    need(p.hat === 'cap' && p.coat === '#3a342c' && p.lantern === false, 'el niño del prólogo pierde su aspecto al cambiar de escena');
    game.state.chapter = 'c1';
    // the bandage: only after the injured run
    game.state.flags.chase_outcome = 'injured';
    game.dressFor('foreshore');
    need(p.bandaged === true && p.model === null, 'la venda no aparece tras la ruta herida');
    game.state.flags.chase_outcome = 'clean';
    game.dressFor('foreshore');
    need(p.bandaged === false, 'la venda aparece tras una ruta limpia');
    game.state.flags.chase_outcome = undefined;
    // a save made in the room after the chase: resuming there, he has nothing on; resuming after the room, he is dressed
    const st = JSON.parse(JSON.stringify(game.state));
    st.chapter = 'c3'; st.scene = 'room'; st.flags.room_phase = 'c3b';
    await game.resume({ state: st, x: 700, facing: -1 });
    await settle();
    need(p.hat === 'none' && p.lantern === false, 'reanudar en c3b devuelve al personaje sin bombín ni linterna');
    const st2 = JSON.parse(JSON.stringify(game.state));
    st2.chapter = 'c4'; st2.scene = 'foreshore'; st2.flags.room_phase = 'c4';
    await game.resume({ state: st2, x: 300, facing: 1 });
    await settle();
    need(p.hat === 'bowler' && p.lantern === true, 'reanudar después de la habitación devuelve la ropa');
    return {};
  }, opts);
}
