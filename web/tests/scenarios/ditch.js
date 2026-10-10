// The Black Ditch at its outfall, after V4-08. In 1888 the first look gives the brick and, when the
// hearing is strained or frayed, the sound falls away for a moment (audio only); no later look repeats
// it, and the same state comes out of every band except for the sanity itself. The voice asks for the
// water only when the evidence is enough. 1866 keeps its own line and nothing new.
//   node web/tools/walk.mjs ditch
import { scenario, fixture } from './harness.js';

const BRICK = 'Ladrillo viejo. El agua sale a borbotones de debajo de la calle.';
const HEARING = 'El ruido se calla al acercarme.';
const READY = ['f_zurdo', 'f_anat', 'f_testigo'];   // three independent sources: canEnterFinale is met
const count = (s, t) => s.split(t).length - 1;

export async function run(opts) {
  return scenario(async ({ game, settle, act, expectScene, need, flag }) => {
    const audio = game.G.audio;

    // the foreshore, as a player would find it after a save: no chapter script runs on entry
    const base = async ({ fs = true, sanity = 100, deductions = [] } = {}) => {
      const s = await fixture('saves-v1-baseline/c1.json');
      s.flags.fs_1888 = fs;
      s.chapter = fs ? 'c4' : 'c1';
      s.sanity = sanity;
      s.deductions = deductions;
      delete s.seen['foreshore:outfall'];
      delete s.seen['foreshore:outfall:1888'];
      return s;
    };
    const enter = async (o) => {
      game.inMenu = false;
      game.ui.hideMenu();
      await game.resume({ state: await base(o), x: 520, facing: 1 });
      await settle();
      expectScene('foreshore');
    };
    // enter, then look at the outfall `times` times; record what was said and every change of the beds
    const looks = async (o, times = 1) => {
      await enter(o);
      const glowBefore = !!flag('ditch_glow');
      const bedsBefore = JSON.stringify(audio.wantBeds || {});
      const n = window.LOG.length;
      const calls = [];
      const orig = audio.setBeds;
      audio.setBeds = function (m, f) { calls.push(JSON.stringify(m)); return orig.call(this, m, f); };
      try {
        for (let i = 0; i < times; i++) await act('outfall');
      } finally { audio.setBeds = orig; }
      const log = window.LOG.slice(n).join('\n');
      return {
        log, calls, glowBefore, glowAfter: !!flag('ditch_glow'), bedsBefore, bedsAfter: JSON.stringify(audio.wantBeds || {}),
        seen: !!game.state.seen['foreshore:outfall:1888'],
        // what the save keeps of the scene, without the sanity (the only thing the bands are allowed to change)
        keep: JSON.stringify({ flags: game.state.flags, clues: game.state.clues, deductions: game.state.deductions, items: game.state.items, seen: game.state.seen }),
      };
    };

    // ---- 1888, steady hearing: the brick once, no sound change, the glow as before
    const steady = await looks({ sanity: 100 }, 2);
    need(!steady.glowBefore && steady.glowAfter, 'ditch_glow se activa con la interacción');
    need(steady.log.includes(BRICK), `Primera mirada 1888 sin el ladrillo:\n${steady.log}`);
    need(count(steady.log, BRICK) === 1, 'El ladrillo aparece en la primera mirada y no en la segunda');

    // ---- 1888 after a look in 1866 at the same outfall: the 1866 mark does not hide the first look of 1888
    game.inMenu = false;
    game.ui.hideMenu();
    const st66 = await base({ sanity: 100 });
    st66.seen['foreshore:outfall'] = true;
    await game.resume({ state: st66, x: 520, facing: 1 });
    await settle();
    expectScene('foreshore');
    const n66 = window.LOG.length;
    await act('outfall');
    const log66 = window.LOG.slice(n66).join('\n');
    need(log66.includes(BRICK), 'tras mirar en 1866, la primera mirada de 1888 sigue dando el ladrillo');
    need(count(log66, BRICK) === 1, 'el ladrillo sale una sola vez');
    need(!steady.log.includes(HEARING), 'Con cordura alta no se oye la segunda línea');
    need(steady.calls.length === 0, 'Con cordura alta no cambian los fondos sonoros');
    need(steady.seen, 'La marca seen del desagüe queda puesta');
    need(!/Ven al agua/.test(steady.log), 'La voz no sale sin las tres fuentes');
    need(/Todavía no/.test(steady.log), 'Sin las tres fuentes, la comprobación del final responde «Todavía no»');

    // ---- 1888, strained and frayed: both lines, and the beds fall away and come back to the same map
    for (const sanity of [50, 20]) {
      const r = await looks({ sanity }, 2);
      need(r.log.includes(BRICK) && r.log.includes(HEARING), `Con cordura ${sanity} faltan las dos líneas:\n${r.log}`);
      need(count(r.log, HEARING) === 1 && count(r.log, BRICK) === 1, `Con cordura ${sanity} las líneas se repiten`);
      need(r.calls.length === 2 && r.calls[0] === '{}' && r.calls[1] === r.bedsBefore, `Con cordura ${sanity}: caída y vuelta de los fondos: ${JSON.stringify(r.calls)}`);
      need(r.bedsAfter === r.bedsBefore, `Con cordura ${sanity} los fondos quedan como estaban`);
      need(r.keep === steady.keep, `Con cordura ${sanity} el estado guardado no coincide con el de cordura alta`);
    }

    // ---- the voice: only when the evidence is enough, in every band
    for (const sanity of [100, 50]) {
      const r = await looks({ sanity, deductions: READY }, 1);
      need(/Ven al agua, Tommy\./.test(r.log), `Con las tres fuentes y cordura ${sanity} sale la voz`);
      need(!/Todavía no/.test(r.log), `Con las tres fuentes no sale «Todavía no» (cordura ${sanity})`);
      need((r.log.includes(HEARING)) === (sanity !== 100), `La línea del ruido depende de la banda (cordura ${sanity})`);
    }

    // ---- 1866: its own line, nothing new, no sound change whatever the hearing
    const old = await looks({ fs: false, sanity: 50 }, 1);
    need(old.log.includes('El agua está tibia'), `1866 sin su línea:\n${old.log}`);
    need(!old.log.includes(BRICK) && !old.log.includes(HEARING), '1866 dice una línea nueva');
    need(old.calls.length === 0 && !old.glowAfter, '1866 no cambia los fondos ni enciende el brillo');
  }, opts);
}
