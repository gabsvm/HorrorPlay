// Thomas's rented room, Thrawl Street. Revisited in chapters 1 and 3; what is in it changes.
import * as A from '../art/paint.js';
import { coatOnPeg, bowlerOnPeg, bullseyeLantern, bootsPair, newspaper, bottle, dissectionCase } from '../art/props.js';
import { wallpaper, wainscot, floorboards, rug, interiorWindow, bed, desk, chair, bookcase } from '../art/build.js';
import { Moths } from '../engine/life.js';
import { P } from '../art/palette.js';
import { drawProp } from '../art/models.js';

const WIDTH = 1500, GROUND = 662;

const phase = (G) => G.state.flags.room_phase || 'c1';

export default {
  id: 'room',
  width: WIDTH,
  groundY: GROUND,
  walk: [210, 1380],
  spawn: 760,
  surface: 'wood',
  indoor: true,
  reflectY: GROUND + 6,
  wet: 0.35,
  ambient: [0.05, 0.05, 0.06],
  fog: { density: 0.18, amount: 0.25, color: [0.3, 0.32, 0.34], speed: 3, ground: 0.2 },
  rain: 0,
  beds: { rain: 0.22, room: 0.4 },
  music: null,

  build(R) {
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      ctx.fillStyle = '#0b0a09'; ctx.fillRect(0, 0, WIDTH, 720);
      wallpaper(ctx, 0, 40, WIDTH, GROUND - 160, { seed: 21 });
      wainscot(ctx, 0, GROUND - 120, WIDTH, 120);
      // low ceiling: joists, a water stain, a crack running to the window
      ctx.fillStyle = '#100d0b'; ctx.fillRect(0, 0, WIDTH, 46);
      for (let x = 30; x < WIDTH; x += 160) { ctx.fillStyle = '#1a1410'; ctx.fillRect(x, 0, 26, 46); ctx.fillStyle = 'rgba(255,230,200,0.06)'; ctx.fillRect(x, 0, 3, 46); }
      ctx.fillStyle = '#1e1813'; ctx.fillRect(0, 40, WIDTH, 10);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(620, 52); ctx.lineTo(700, 90); ctx.lineTo(690, 140); ctx.lineTo(760, 170); ctx.lineTo(820, 260); ctx.stroke();
      const g = ctx.createRadialGradient(760, 60, 4, 760, 60, 90); g.addColorStop(0, 'rgba(40,34,20,0.6)'); g.addColorStop(1, 'rgba(40,34,20,0)'); ctx.fillStyle = g; ctx.fillRect(670, 40, 180, 120);
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6);
      rug(ctx, 520, GROUND + 8, 460, 46);
      // door with a bolt and a calendar beside it
      A.door(ctx, 70, GROUND - 270, 120, 270, { color: '#2c2016', steps: 0, fanlight: false, scraper: false, knocker: false });
      ctx.fillStyle = '#b08a4e'; ctx.beginPath(); ctx.arc(170, GROUND - 130, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8a860'; ctx.fillRect(80, GROUND - 3, 100, 3);                 // light from the landing under the door
      ctx.fillStyle = P.iron; ctx.fillRect(150, GROUND - 200, 30, 6); ctx.fillRect(176, GROUND - 204, 6, 14);
      ctx.fillStyle = '#c9bc98'; ctx.fillRect(210, GROUND - 470, 54, 72); ctx.fillStyle = '#7a1a14'; ctx.fillRect(210, GROUND - 470, 54, 16);
      ctx.font = '600 11px Georgia, serif'; ctx.fillStyle = '#e6dcc0'; ctx.textAlign = 'center'; ctx.fillText('1888', 237, GROUND - 458);
      ctx.fillStyle = 'rgba(40,30,20,0.5)'; for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) ctx.fillRect(214 + k * 8, GROUND - 446 + i * 10, 5, 5);
      // coat hooks
      ctx.fillStyle = '#1a1410'; ctx.fillRect(236, GROUND - 330, 110, 10);
      ctx.fillStyle = '#6b5a3a'; ctx.fillRect(256, GROUND - 322, 5, 16); ctx.fillRect(316, GROUND - 322, 5, 16);
      // washstand: marble top, jug in basin, soap dish, a razor strop; the sheet over the mirror
      if (!drawProp(ctx, 'washstand', 400, GROUND)) {
      ctx.fillStyle = '#2a2018'; ctx.fillRect(400, GROUND - 120, 130, 14); ctx.fillRect(408, GROUND - 106, 10, 106); ctx.fillRect(512, GROUND - 106, 10, 106); ctx.fillRect(408, GROUND - 40, 114, 6);
      ctx.fillStyle = '#8a8478'; ctx.fillRect(398, GROUND - 124, 134, 6);
      ctx.fillStyle = '#d6cfc0'; ctx.beginPath(); ctx.ellipse(465, GROUND - 126, 38, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9c1ae'; ctx.beginPath(); ctx.moveTo(452, GROUND - 126); ctx.lineTo(448, GROUND - 160); ctx.lineTo(472, GROUND - 166); ctx.lineTo(480, GROUND - 126); ctx.fill();
      ctx.fillStyle = 'rgba(80,110,140,0.5)'; ctx.fillRect(452, GROUND - 150, 26, 4);
      ctx.fillStyle = '#4a3420'; ctx.fillRect(522, GROUND - 260, 6, 60);
      ctx.fillStyle = '#1a1410'; ctx.fillRect(420, GROUND - 330, 90, 150);
      ctx.fillStyle = '#9a917c';
      ctx.beginPath(); ctx.moveTo(410, GROUND - 336); ctx.lineTo(520, GROUND - 336); ctx.quadraticCurveTo(528, GROUND - 240, 516, GROUND - 168); ctx.quadraticCurveTo(470, GROUND - 180, 414, GROUND - 166); ctx.quadraticCurveTo(402, GROUND - 250, 410, GROUND - 336); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
      for (const fx of [440, 468, 494]) { ctx.beginPath(); ctx.moveTo(fx, GROUND - 330); ctx.quadraticCurveTo(fx + 4, GROUND - 250, fx - 2, GROUND - 176); ctx.stroke(); }
      A.stain(ctx, 404, GROUND - 336, 124, 170, { seed: 33, alpha: 0.5 });
      }
      // a framed photograph over the bed: two boys on the Limehouse steps
      ctx.fillStyle = '#3a2a16'; ctx.fillRect(680, GROUND - 400, 110, 84); ctx.fillStyle = '#6a5428'; ctx.fillRect(680, GROUND - 400, 110, 3);
      A.vgrad(ctx, 688, GROUND - 392, 94, 68, [[0, '#8a8272'], [1, '#5a544a']]);
      ctx.fillStyle = '#2a2622';
      ctx.beginPath(); ctx.ellipse(716, GROUND - 368, 7, 8, 0, 0, Math.PI * 2); ctx.ellipse(752, GROUND - 364, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(706, GROUND - 360, 20, 30); ctx.fillRect(744, GROUND - 357, 16, 27);
      A.stain(ctx, 688, GROUND - 392, 94, 68, { seed: 61, alpha: 0.5 });
      // bed, a trunk at its foot and a chamber pot beneath
      if (!bed(ctx, 590, GROUND, 330)) { ctx.fillStyle = '#e0d8c8'; ctx.beginPath(); ctx.ellipse(700, GROUND - 8, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); }
      // window
      const win = interiorWindow(ctx, 990, 190, 160, 230);
      lights.push({ id: 'window', x: win.x, y: win.y + 40, r: 360, color: [0.32, 0.4, 0.5], intensity: 0.55, halo: 0, reflect: false, shaft: true, shaftY0: 196, shaftW0: 72, shaftW: 120, shaftSkew: -330, shaftK: 0.55 });
      // desk, chair, shelf of books, a pile of old newspapers
      desk(ctx, 1190, GROUND, 230);
      chair(ctx, 1150, GROUND, 1);
      bookcase(ctx, 1176, GROUND - 400, 170, 80, 12);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#a89c7e' : '#968a6c'; ctx.fillRect(1430 - i * 2, GROUND - 14 - i * 8, 60, 8); }
      // clock
      ctx.fillStyle = '#20170f'; ctx.fillRect(1366, GROUND - 474, 60, 92); ctx.beginPath(); ctx.moveTo(1362, GROUND - 474); ctx.lineTo(1396, GROUND - 496); ctx.lineTo(1430, GROUND - 474); ctx.fill();
      ctx.fillStyle = '#c9bc98'; ctx.beginPath(); ctx.arc(1396, GROUND - 440, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#20170f'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#20170f'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ctx.fillRect(1396 + Math.cos(a) * 17 - 1, GROUND - 440 + Math.sin(a) * 17 - 1, 2, 2); }
      ctx.fillStyle = '#0e0b08'; ctx.fillRect(1376, GROUND - 414, 40, 30);
      // map of Whitechapel pinned to the wall, with pins
      ctx.fillStyle = '#b4a47e'; ctx.fillRect(1206, GROUND - 520, 130, 96);
      ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(1206, GROUND - 520 + i * 13); ctx.lineTo(1336, GROUND - 512 + i * 11); ctx.stroke(); }
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(1216 + i * 22, GROUND - 520); ctx.lineTo(1206 + i * 24, GROUND - 424); ctx.stroke(); }
      ctx.fillStyle = 'rgba(40,60,80,0.4)'; ctx.beginPath(); ctx.moveTo(1206, GROUND - 440); ctx.quadraticCurveTo(1270, GROUND - 450, 1336, GROUND - 432); ctx.lineTo(1336, GROUND - 424); ctx.lineTo(1206, GROUND - 424); ctx.fill();
      for (const [px, py] of [[1240, GROUND - 480], [1262, GROUND - 470], [1288, GROUND - 486], [1300, GROUND - 462], [1252, GROUND - 452]]) { ctx.fillStyle = '#a3170f'; ctx.fillRect(px, py, 5, 5); }
      A.stain(ctx, 1206, GROUND - 520, 130, 96, { seed: 4, alpha: 0.4 });
    });
    lights.push({ id: 'landing', x: 150, y: GROUND - 4, r: 380, color: [0.95, 0.7, 0.42], intensity: 0.6, flicker: 0.05, halo: 18, haloK: 0.5, reflect: false });
    lights.push({ id: 'candle', x: 1300, y: GROUND - 150, r: 560, color: P.candle, intensity: 1.0, flicker: 0.22, halo: 70 });
    lights.push({ id: 'street', x: 1070, y: 260, r: 120, color: P.gas, intensity: 0.4, halo: 30, haloK: 0.4, reflect: false });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, 70, 720);
      ctx.fillRect(1700, 600, 90, 120); ctx.fillRect(1690, 590, 110, 14);
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  makeLife() {
    return [new Moths({ x: 1300, y: GROUND - 160, n: 2 })];
  },

  drawNear(ctx, t) {
    const G = this.G;
    const p = G ? phase(G) : 'c1';
    // desk: papers covered in his left-leaning hand, a pen, ink wells, a candle with wax runs
    ctx.fillStyle = '#c4b48c'; ctx.fillRect(1230, GROUND - 104, 70, 8);
    ctx.fillStyle = '#d8ccaa'; ctx.save(); ctx.translate(1290, GROUND - 100); ctx.rotate(0.08); ctx.fillRect(0, -4, 60, 6); ctx.restore();
    ctx.fillStyle = 'rgba(40,30,20,0.6)'; ctx.fillRect(1236, GROUND - 102, 50, 1.5);
    ctx.fillStyle = '#1a1410'; ctx.save(); ctx.translate(1262, GROUND - 106); ctx.rotate(-0.5); ctx.fillRect(0, 0, 30, 2.5); ctx.restore();
    ctx.fillStyle = '#121416'; ctx.fillRect(1320, GROUND - 116, 16, 16); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(1322, GROUND - 114, 3, 10);
    if (!G?.has('tinta')) {
      ctx.fillStyle = '#121416'; ctx.fillRect(1342, GROUND - 116, 16, 16);
      ctx.fillStyle = G?.flag('tinta_vacia') ? '#3a0a08' : '#7e1510'; ctx.fillRect(1344, G?.flag('tinta_vacia') ? GROUND - 104 : GROUND - 112, 12, G?.flag('tinta_vacia') ? 4 : 10);
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(1344, GROUND - 114, 3, 10);
      if (G?.flag('tinta_vacia')) { ctx.fillStyle = '#6a1210'; ctx.fillRect(1330, GROUND - 99, 30, 3); ctx.fillRect(1356, GROUND - 98, 4, 10); }
    }
    ctx.fillStyle = '#e4d8bc'; ctx.fillRect(1296, GROUND - 136, 9, 34);
    ctx.fillRect(1293, GROUND - 120, 4, 10); ctx.fillRect(1304, GROUND - 128, 3, 14);
    ctx.fillStyle = '#5a4a30'; ctx.fillRect(1288, GROUND - 104, 25, 4);
    ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.ellipse(1300.5, GROUND - 143 + Math.sin(t * 9) * 0.8, 3.2, 7.5, Math.sin(t * 5) * 0.08, 0, Math.PI * 2); ctx.fill();
    // laudanum bottle with a paper label
    bottle(ctx, 1392, GROUND - 100);
    // clock hands and pendulum
    const hands = G?.state.clockHands || [3, 40];
    const cx = 1396, cy = GROUND - 440;
    ctx.strokeStyle = '#141210'; ctx.lineWidth = 3;
    const ha = ((hands[0] % 12) + hands[1] / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = hands[1] / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * 11, cy + Math.sin(ha) * 11); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * 17, cy + Math.sin(ma) * 17); ctx.stroke();
    const sw = Math.sin(t * Math.PI) * 9;
    ctx.strokeStyle = '#8a7444'; ctx.beginPath(); ctx.moveTo(cx, cy + 24); ctx.lineTo(cx + sw, cy + 52); ctx.stroke();
    ctx.fillStyle = '#9a8350'; ctx.beginPath(); ctx.arc(cx + sw, cy + 54, 5, 0, Math.PI * 2); ctx.fill();
    // coat, bowler and lantern on the hooks
    if (!G?.flag('coat_on')) { coatOnPeg(ctx, 260, GROUND - 314); bowlerOnPeg(ctx, 318, GROUND - 312); }
    if (!G?.flag('lantern_taken')) { ctx.fillStyle = '#6b5a3a'; ctx.fillRect(330, GROUND - 300, 4, 8); bullseyeLantern(ctx, 332, GROUND - 288); }
    // boots by the door, wet and black, leaking a puddle of river mud
    if (p === 'c1' && !G?.flag('boots_on')) bootsPair(ctx, 212, GROUND);
    if (p === 'c3b' && !G?.flag('paper_read')) newspaper(ctx, 196, GROUND + 14, -0.1);
    if (p === 'c3b') dissectionCase(ctx, 816, GROUND - 2);
    // by chapter three the face of the older boy in the photograph has been scratched away
    if (p !== 'c1') { ctx.fillStyle = '#c9c0ae'; ctx.fillRect(709, GROUND - 377, 14, 16); ctx.strokeStyle = '#7a7060'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(708 + i * 4, GROUND - 378); ctx.lineTo(712 + i * 3, GROUND - 361); ctx.stroke(); } }
  },

  drawGlow(ctx, t) {
    // rain running down the window glass
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = 'rgb(70,90,100)';
    for (let i = 0; i < 9; i++) {
      const x = 996 + ((i * 37) % 150), y = 196 + ((t * (40 + i * 7) + i * 50) % 220);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y + 14); ctx.stroke();
    }
    ctx.restore();
  },

  enter(G) { this.G = G; },

  hotspots: [
    {
      id: 'door', name: 'Puerta', cursor: 'exit', rect: [60, GROUND - 280, 140, 280], walk: 230, face: -1,
      act: async (G) => {
        const p = phase(G);
        if (p === 'c1') {
          const missing = [!G.flag('coat_on') && 'el abrigo', !G.flag('boots_on') && 'las botas', !G.flag('lantern_taken') && 'la linterna'].filter(Boolean);
          if (missing.length) {
            const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} y ${missing[missing.length - 1]}`;
            await G.think(`No puedo salir así. Me falta ${list}. Está todo junto a la puerta.`);
            return;
          }
          await G.game.chapterHooks.leaveRoomC1(G);
        } else if (p === 'c3a') {
          await G.think('Pasan de las tres. No tengo adónde ir a estas horas.');
        } else if (p === 'c3b') {
          if (!G.flag('paper_read')) { await G.think('Hay un periódico bajo la puerta. La señora Pell lo deja ahí cuando no le pago a tiempo.'); return; }
          await G.game.chapterHooks.leaveRoomC3b(G);
        }
      },
    },
    {
      id: 'paper', name: 'Periódico', when: (G) => phase(G) === 'c3b' && !G.flag('paper_read'), rect: [180, GROUND + 4, 110, 40], walk: 260, face: -1,
      act: async (G) => G.game.chapterHooks.readPaper(G),
    },
    {
      id: 'boots', name: 'Botas', when: (G) => phase(G) === 'c1' && !G.flag('boots_on'), rect: [200, GROUND - 40, 90, 50], walk: 300, face: -1,
      act: async (G) => {
        G.player.pose = 'kneel';
        await G.think('Están empapadas, y tienen barro negro hasta los cordones. Huelen a río.');
        await G.think('Me acosté a las once. No recuerdo haber salido.');
        G.clue('botas');
        G.player.pose = null;
        await G.think('Me las pongo. Están frías por dentro.');
        G.flag('boots_on', true);
        G.sanity(-3);
      },
    },
    {
      id: 'coat', name: 'Abrigo y bombín', when: (G) => !G.flag('coat_on'), rect: [220, GROUND - 340, 130, 190], walk: 300, face: -1,
      act: async (G) => {
        G.flag('coat_on', true);
        G.audio.paper();
        await G.think('El abrigo todavía está húmedo en los puños.');
        if (!G.has('placa')) G.give('placa');
        if (!G.has('penique') && !G.flag('penique_given')) G.give('penique');
        await G.think('En el bolsillo, la placa de la División H y un penique.');
      },
    },
    {
      id: 'lantern', name: 'Linterna de ojo de buey', when: (G) => !G.flag('lantern_taken'), rect: [312, GROUND - 304, 46, 54], walk: 320, face: -1,
      act: async (G) => {
        G.flag('lantern_taken', true);
        G.audio.match();
        G.player.lanternOn = true;
        await G.think('La linterna del servicio. La mecha está quemada, como si la hubiera tenido encendida toda la noche.');
      },
    },
    {
      id: 'mirror', name: 'Espejo cubierto', rect: [404, GROUND - 340, 124, 180], walk: 470, face: -1,
      act: async (G) => {
        const n = (G.state.flags.mirror_n || 0) + 1; G.state.flags.mirror_n = n;
        const lines = [
          'La sábana sigue ahí desde la semana pasada. Me corté afeitándome; la luz es mala.',
          'Prefiero no mirar.',
          'No.',
        ];
        await G.think(lines[Math.min(n - 1, lines.length - 1)]);
        if (n >= 3) { G.audio.whisper(1.4, 0.1); G.sanity(-2); }
      },
    },
    {
      id: 'bed', name: 'Cama', rect: [590, GROUND - 120, 330, 120], walk: 740,
      act: async (G) => {
        const p = phase(G);
        if (p === 'c3a' && G.flag('woke_c3')) { await G.game.chapterHooks.sleepC3a(G); return; }
        if (p === 'c3b') {
          G.player.pose = 'kneel';
          await G.think('Debajo de la cama está mi viejo estuche de disección. Lo abro.');
          await G.think('Seis huecos de terciopelo y cinco bisturís. Falta el del mango de ébano.');
          G.player.pose = null;
          G.clue('estuche');
          G.sanity(-4);
          if (G.flag('paper_read')) G.objective('Salir.');
          return;
        }
        await G.think('Las sábanas están revueltas y hay barro en el borde del colchón.');
      },
    },
    {
      id: 'photo', name: 'Fotografía', rect: [676, GROUND - 404, 118, 92], walk: 740,
      act: async (G) => {
        const p = phase(G);
        if (p === 'c1') {
          await G.think('Nat y yo en las escaleras de Limehouse, el verano antes del cólera. Él tenía nueve años y yo doce.');
          await G.think('Es la única fotografía que nos hicieron.');
        } else {
          await G.think('Alguien ha rascado la cara del niño mayor con la punta de algo afilado. La de Nat está intacta.');
          await G.think('La del niño mayor es la mía.');
          G.sanity(-4); G.audio.whisper(1.2, 0.08);
        }
      },
    },
    {
      id: 'window', name: 'Ventana', rect: [970, 170, 200, 270], walk: 1060, face: -1,
      act: async (G) => {
        const p = phase(G);
        if (p === 'c1') await G.think('Thrawl Street bajo la lluvia. Abajo, la cerería. Más allá, el olor del Ditch.');
        else if (p === 'c3a') await G.think('No pasa nadie. El cristal está empañado por dentro, como si alguien hubiera estado respirando contra él.');
        else await G.think('Unos chicos vocean el periódico en la esquina. Gritan un nombre que no entiendo.');
      },
    },
    {
      id: 'desk', name: 'Escritorio', rect: [1190, GROUND - 130, 230, 130], walk: 1180, face: 1,
      act: async (G) => {
        const p = phase(G);
        if (p === 'c1') {
          if (!G.has('penique') && !G.flag('penique_given')) { G.give('penique'); await G.think('Un penique suelto entre los informes.'); }
          if (!G.has('placa')) G.give('placa');
          if (!G.flag('saw_red_ink')) { G.flag('saw_red_ink', true); await G.think('Los dos tinteros: el negro para los informes y el rojo para corregir los de los sargentos.'); }
          else await G.think('Informes atrasados. Robos, borracheras, una mujer que se cayó al canal.');
        } else if (p === 'c3a') {
          if (!G.flag('woke_c3')) await G.game.chapterHooks.writeC3a(G);
          else await G.think('El informe está terminado y la letra es mía, pero no recuerdo haber escrito las últimas páginas. Falta papel de cartas.');
        } else {
          await G.think('El tintero rojo está casi vacío y el plumín, doblado.');
        }
      },
    },
    {
      id: 'laudano', name: 'Frasco de láudano', rect: [1372, GROUND - 146, 40, 50], walk: 1300,
      act: async (G) => {
        if (!G.hasClue('laudano')) { G.clue('laudano'); await G.think('Láudano, para dormir. Casi vacío. Lo compré el martes.'); }
        else if (!G.flag('drank')) {
          const c = await G.choice(['Un trago. Solo uno.', 'Dejarlo.']);
          if (c === 0) { G.flag('drank', true); G.sanity(+8); G.audio.drip(); await G.think('El amargor me calma. Las manos dejan de temblar.'); }
        } else await G.think('Ya no queda casi nada.');
      },
    },
    {
      id: 'clock', name: 'Reloj', rect: [1360, GROUND - 476, 70, 100], walk: 1340,
      act: async (G) => {
        const h = G.state.clockHands || [3, 40];
        await G.think(`Las ${h[0]}:${String(h[1]).padStart(2, '0')}. ${phase(G) === 'c1' ? 'Me acosté a las once. Me parece que hace un momento.' : 'Va bien. Nunca atrasa.'}`);
      },
    },
    {
      id: 'map', name: 'Mapa de Whitechapel', rect: [1200, GROUND - 526, 140, 106], walk: 1260,
      act: async (G) => {
        await G.think('El mapa de la división, lleno de alfileres. Los rojos marcan las agresiones de este año.');
        if (G.state.chapter === 'c3' || G.state.chapter === 'c4') await G.think('Todos los alfileres rojos están a menos de diez minutos de esta habitación.');
      },
    },
  ],
};
