// Thomas's rented room, Thrawl Street. Revisited in chapters 1 and 3; what is in it changes.
import * as A from '../art/paint.js';
import { wallpaper, wainscot, floorboards, rug, interiorWindow, bed, desk, chair } from '../art/build.js';
import { P } from '../art/palette.js';

const WIDTH = 1500, GROUND = 662;

const phase = (G) => G.state.flags.room_phase || 'c1';

export default {
  id: 'room',
  width: WIDTH,
  groundY: GROUND,
  walk: [210, 1380],
  spawn: 760,
  playerH: 252,
  surface: 'wood',
  indoor: true,
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
      // ceiling beam & cornice
      ctx.fillStyle = '#100d0b'; ctx.fillRect(0, 0, WIDTH, 46);
      ctx.fillStyle = '#1e1813'; ctx.fillRect(0, 40, WIDTH, 10);
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6);
      rug(ctx, 520, GROUND + 8, 460, 46);
      // door (left)
      A.door(ctx, 70, GROUND - 270, 120, 270, { color: '#2c2016', steps: 0 });
      ctx.fillStyle = '#b08a4e'; ctx.beginPath(); ctx.arc(170, GROUND - 130, 5, 0, Math.PI * 2); ctx.fill();
      // coat hooks
      ctx.fillStyle = '#1a1410'; ctx.fillRect(236, GROUND - 330, 110, 10);
      ctx.fillStyle = '#6b5a3a'; ctx.fillRect(256, GROUND - 322, 5, 16); ctx.fillRect(316, GROUND - 322, 5, 16);
      // washstand with a sheet over the mirror
      ctx.fillStyle = '#2a2018'; ctx.fillRect(400, GROUND - 120, 130, 14); ctx.fillRect(408, GROUND - 106, 10, 106); ctx.fillRect(512, GROUND - 106, 10, 106);
      ctx.fillStyle = '#d6cfc0'; ctx.beginPath(); ctx.ellipse(465, GROUND - 126, 38, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9c1ae'; ctx.fillRect(452, GROUND - 160, 26, 34);
      ctx.fillStyle = '#1a1410'; ctx.fillRect(420, GROUND - 330, 90, 150);
      ctx.fillStyle = '#9a917c';
      ctx.beginPath(); ctx.moveTo(410, GROUND - 336); ctx.lineTo(520, GROUND - 336); ctx.quadraticCurveTo(528, GROUND - 240, 516, GROUND - 168); ctx.quadraticCurveTo(470, GROUND - 180, 414, GROUND - 166); ctx.quadraticCurveTo(402, GROUND - 250, 410, GROUND - 336); ctx.fill();
      A.stain(ctx, 404, GROUND - 336, 124, 170, { seed: 33, alpha: 0.5 });
      // bed
      bed(ctx, 590, GROUND, 330);
      // window
      const win = interiorWindow(ctx, 990, 190, 160, 230);
      lights.push({ id: 'window', x: win.x, y: win.y + 40, r: 360, color: [0.32, 0.4, 0.5], intensity: 0.55, halo: 0, reflect: false });
      // desk, chair, shelf
      desk(ctx, 1190, GROUND, 230);
      chair(ctx, 1150, GROUND, 1);
      ctx.fillStyle = '#1e1610'; ctx.fillRect(1180, GROUND - 330, 250, 10);
      const r = [0.8, 0.6, 1.0, 0.7, 0.9, 0.75, 0.65];
      for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#3a1a14', '#22301e', '#2a2430', '#4a3a20'][i % 4]; ctx.fillRect(1190 + i * 18, GROUND - 330 - 70 * r[i % 7], 15, 70 * r[i % 7]); }
      // clock
      ctx.fillStyle = '#20170f'; ctx.fillRect(1366, GROUND - 470, 60, 84);
      ctx.fillStyle = '#c9bc98'; ctx.beginPath(); ctx.arc(1396, GROUND - 440, 22, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#20170f'; ctx.lineWidth = 2; ctx.stroke();
      // map of Whitechapel pinned to the wall
      ctx.fillStyle = '#b4a47e'; ctx.fillRect(1206, GROUND - 520, 130, 96);
      ctx.strokeStyle = 'rgba(40,30,20,0.5)'; ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(1206, GROUND - 520 + i * 13); ctx.lineTo(1336, GROUND - 512 + i * 11); ctx.stroke(); }
      A.stain(ctx, 1206, GROUND - 520, 130, 96, { seed: 4, alpha: 0.4 });
    });
    lights.push({ id: 'candle', x: 1300, y: GROUND - 150, r: 560, color: P.candle, intensity: 1.0, flicker: 0.22, halo: 70 });
    lights.push({ id: 'street', x: 1070, y: 260, r: 120, color: P.gas, intensity: 0.4, halo: 30, haloK: 0.4, reflect: false });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#050403';
      ctx.fillRect(0, 0, 70, 720);
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  drawNear(ctx, t) {
    const G = this.G;
    const p = G ? phase(G) : 'c1';
    // desk top objects
    ctx.fillStyle = '#c4b48c'; ctx.fillRect(1230, GROUND - 104, 70, 8); // papers
    ctx.fillStyle = '#d8ccaa'; ctx.save(); ctx.translate(1290, GROUND - 100); ctx.rotate(0.08); ctx.fillRect(0, -4, 60, 6); ctx.restore();
    // ink wells: black and red
    ctx.fillStyle = '#121416'; ctx.fillRect(1320, GROUND - 116, 16, 16);
    if (!G?.has('tinta')) { ctx.fillStyle = '#121416'; ctx.fillRect(1342, GROUND - 116, 16, 16); ctx.fillStyle = G?.flag('tinta_vacia') ? '#3a0a08' : '#7e1510'; ctx.fillRect(1344, G?.flag('tinta_vacia') ? GROUND - 104 : GROUND - 112, 12, G?.flag('tinta_vacia') ? 4 : 10); }
    // candle
    ctx.fillStyle = '#e4d8bc'; ctx.fillRect(1296, GROUND - 136, 9, 34);
    ctx.fillStyle = '#ffd38a'; ctx.beginPath(); ctx.ellipse(1300.5, GROUND - 142 + Math.sin(t * 9) * 0.6, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
    // laudanum
    ctx.fillStyle = '#2e1c10'; ctx.fillRect(1386, GROUND - 124, 12, 24); ctx.fillRect(1389, GROUND - 130, 6, 6);
    // clock hands
    const hands = G?.state.clockHands || [3, 40];
    const cx = 1396, cy = GROUND - 440;
    ctx.strokeStyle = '#141210'; ctx.lineWidth = 2.5;
    const ha = ((hands[0] % 12) + hands[1] / 60) / 12 * Math.PI * 2 - Math.PI / 2, ma = hands[1] / 60 * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * 11, cy + Math.sin(ha) * 11); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * 17, cy + Math.sin(ma) * 17); ctx.stroke();
    ctx.fillStyle = '#6b5a3a'; ctx.fillRect(cx - 1, cy + 24, 2, 30 + Math.sin(t * 3) * 0); // pendulum rod
    ctx.beginPath(); ctx.arc(cx + Math.sin(t * Math.PI) * 10, cy + 56, 5, 0, Math.PI * 2); ctx.fill();
    // coat and lantern on the hooks
    if (!G?.flag('coat_on')) {
      ctx.fillStyle = '#24262a';
      ctx.beginPath(); ctx.moveTo(250, GROUND - 312); ctx.lineTo(276, GROUND - 312); ctx.lineTo(292, GROUND - 160); ctx.lineTo(236, GROUND - 160); ctx.fill();
      ctx.fillStyle = '#111214'; ctx.beginPath(); ctx.ellipse(318, GROUND - 316, 18, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(318, GROUND - 320, 12, Math.PI, 0); ctx.fill();
    }
    if (!G?.flag('lantern_taken')) {
      ctx.fillStyle = '#2a2420'; ctx.fillRect(306, GROUND - 300, 22, 28); ctx.fillStyle = '#4a3a20'; ctx.beginPath(); ctx.arc(328, GROUND - 286, 6, 0, Math.PI * 2); ctx.fill();
    }
    // boots by the door, wet and black
    if (p === 'c1' && !G?.flag('boots_on')) {
      ctx.fillStyle = '#0e0d0c';
      ctx.fillRect(210, GROUND - 30, 22, 30); ctx.fillRect(210, GROUND - 6, 34, 8);
      ctx.fillRect(244, GROUND - 28, 22, 28); ctx.fillRect(244, GROUND - 4, 34, 8);
      ctx.fillStyle = 'rgba(20,24,20,0.85)'; ctx.beginPath(); ctx.ellipse(240, GROUND + 6, 50, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    // newspaper slipped under the door
    if (p === 'c3b' && !G?.flag('paper_read')) { ctx.fillStyle = '#b8ab8a'; ctx.save(); ctx.translate(200, GROUND + 18); ctx.rotate(-0.12); ctx.fillRect(0, 0, 70, 16); ctx.restore(); }
    // dissection case under the bed
    if (p === 'c3b') { ctx.fillStyle = '#2a1a12'; ctx.fillRect(820, GROUND - 22, 80, 20); ctx.fillStyle = '#7d6b48'; ctx.fillRect(856, GROUND - 16, 8, 4); }
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
          if (!G.flag('lantern_taken') || !G.flag('coat_on') || !G.flag('boots_on')) {
            await G.think('No puedo salir así. Me falta el abrigo, las botas y la linterna.');
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
      id: 'coat', name: 'Abrigo y bombín', when: (G) => !G.flag('coat_on'), rect: [230, GROUND - 340, 75, 190], walk: 300, face: -1,
      act: async (G) => {
        G.flag('coat_on', true);
        G.audio.paper();
        await G.think('El abrigo todavía está húmedo en los puños.');
      },
    },
    {
      id: 'lantern', name: 'Linterna de ojo de buey', when: (G) => !G.flag('lantern_taken'), rect: [300, GROUND - 306, 40, 40], walk: 320, face: -1,
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
      id: 'laudano', name: 'Frasco de láudano', rect: [1380, GROUND - 134, 24, 36], walk: 1300,
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
