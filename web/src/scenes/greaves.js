// Chapter 4 — Dr Greaves's study at the London Hospital, Whitechapel Road, 8 November 1888, night.
import * as A from '../art/paint.js';
import { wallpaper, wainscot, floorboards, interiorWindow, desk, chair, rug } from '../art/build.js';
import { P } from '../art/palette.js';
import { rng } from '../art/noise.js';

const WIDTH = 1500, GROUND = 664;

export default {
  id: 'greaves',
  width: WIDTH,
  groundY: GROUND,
  walk: [200, 1340],
  spawn: 230,
  playerH: 252,
  surface: 'wood',
  indoor: true,
  lantern: false,
  ambient: [0.03, 0.035, 0.04],
  fog: { density: 0.2, amount: 0.3, color: [0.34, 0.4, 0.38], speed: 2, ground: 0.15 },
  rain: 0,
  beds: { room: 0.45, rain: 0.15, drone: 0.15 },
  music: null,
  date: '8 de noviembre de 1888',

  build(R) {
    const lights = [];
    const near = R.paintLayer(WIDTH, (ctx) => {
      ctx.fillStyle = '#080908'; ctx.fillRect(0, 0, WIDTH, 720);
      wallpaper(ctx, 0, 30, WIDTH, GROUND - 150, { seed: 71, base: '#2c3a32', stripe: '#24322a', damp: 0.3 });
      wainscot(ctx, 0, GROUND - 120, WIDTH, 120);
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6, { color: '#33251a' });
      rug(ctx, 560, GROUND + 6, 520, 48);
      A.door(ctx, 80, GROUND - 280, 124, 280, { color: '#2a1d14', steps: 0 });
      ctx.fillStyle = '#c9bc98'; ctx.fillRect(110, GROUND - 230, 64, 20); ctx.fillStyle = '#2a2016'; ctx.font = '11px Georgia'; ctx.textAlign = 'center'; ctx.fillText('DR. L. GREAVES', 142, GROUND - 216);
      // shelves of specimen jars
      ctx.fillStyle = '#1c140e'; for (let s = 0; s < 4; s++) ctx.fillRect(300, 170 + s * 100, 300, 10);
      const r = rng(5);
      for (let s = 0; s < 4; s++) for (let i = 0; i < 7; i++) {
        const jx = 310 + i * 41, jy = 170 + s * 100, jh = r.range(46, 78);
        ctx.fillStyle = `rgba(${r.int(70, 95)},${r.int(78, 96)},${r.int(48, 62)},0.75)`;
        ctx.fillRect(jx, jy - jh, 32, jh);
        ctx.fillStyle = 'rgba(40,30,20,0.85)'; ctx.beginPath(); ctx.ellipse(jx + 16, jy - jh * 0.45, 9, jh * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#2a2016'; ctx.fillRect(jx - 2, jy - jh - 6, 36, 7);
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(jx + 4, jy - jh + 4, 3, jh - 8);
      }
      // anatomical chart
      ctx.fillStyle = '#c6b892'; ctx.fillRect(660, 140, 150, 230);
      ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(735, 180, 16, 0, Math.PI * 2); ctx.moveTo(735, 196); ctx.lineTo(735, 290); ctx.moveTo(700, 220); ctx.lineTo(770, 220); ctx.moveTo(735, 290); ctx.lineTo(710, 350); ctx.moveTo(735, 290); ctx.lineTo(760, 350); ctx.stroke();
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(718, 228 + i * 10); ctx.quadraticCurveTo(735, 234 + i * 10, 752, 228 + i * 10); ctx.stroke(); }
      A.stain(ctx, 660, 140, 150, 230, { seed: 3, alpha: 0.5 });
      // window onto Whitechapel Road
      const win = interiorWindow(ctx, 860, 160, 170, 240);
      lights.push({ x: win.x, y: win.y, r: 300, color: [0.3, 0.38, 0.45], intensity: 0.4, halo: 0, reflect: false });
      // locked glass-fronted cabinet
      ctx.fillStyle = '#1e140c'; ctx.fillRect(1240, GROUND - 400, 180, 400);
      ctx.fillStyle = 'rgba(30,40,40,0.9)'; ctx.fillRect(1254, GROUND - 386, 152, 220);
      for (let s = 0; s < 3; s++) { ctx.fillStyle = '#2a1e14'; ctx.fillRect(1254, GROUND - 316 + s * 70, 152, 6); for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#5a4a30', '#3a2a20', '#6a5a3a'][i % 3]; ctx.fillRect(1260 + i * 24, GROUND - 360 + s * 70, 18, 44); } }
      ctx.fillStyle = '#1e140c'; ctx.fillRect(1328, GROUND - 386, 4, 220);
      ctx.fillStyle = '#b08a4e'; ctx.fillRect(1322, GROUND - 270, 16, 10);
      ctx.fillStyle = '#171009'; ctx.fillRect(1254, GROUND - 150, 152, 140);
      // skeleton on its stand
      ctx.strokeStyle = '#b8ad94'; ctx.lineWidth = 4;
      const sx = 1140;
      ctx.beginPath(); ctx.arc(sx, GROUND - 300, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, GROUND - 284); ctx.lineTo(sx, GROUND - 160); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx, GROUND - 260 + i * 12, 24 - i * 2, 4, 0, 0, Math.PI); ctx.stroke(); }
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx - 26, GROUND - 270); ctx.lineTo(sx - 34, GROUND - 190); ctx.moveTo(sx + 26, GROUND - 270); ctx.lineTo(sx + 34, GROUND - 190);
      ctx.moveTo(sx - 10, GROUND - 160); ctx.lineTo(sx - 16, GROUND - 40); ctx.moveTo(sx + 10, GROUND - 160); ctx.lineTo(sx + 16, GROUND - 40); ctx.stroke();
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(sx - 3, GROUND - 330, 6, 330); ctx.fillRect(sx - 30, GROUND - 6, 60, 6);
      desk(ctx, 560, GROUND, 300);
      chair(ctx, 880, GROUND, -1);
      ctx.fillStyle = '#d4c6a0'; ctx.fillRect(620, GROUND - 104, 90, 8); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(780, GROUND - 112, 20, 16);
      // green-shaded desk lamp
      ctx.fillStyle = '#6a5a30'; ctx.fillRect(700, GROUND - 150, 6, 50); ctx.fillRect(686, GROUND - 100, 34, 6);
      ctx.fillStyle = '#1f5a3e'; ctx.beginPath(); ctx.moveTo(672, GROUND - 150); ctx.lineTo(734, GROUND - 150); ctx.lineTo(722, GROUND - 170); ctx.lineTo(684, GROUND - 170); ctx.fill();
    });
    lights.push({ id: 'lamp', x: 703, y: GROUND - 140, r: 560, color: [0.95, 0.85, 0.55], intensity: 1.0, flicker: 0.04, halo: 50 });
    lights.push({ id: 'gas', x: 260, y: 190, r: 360, color: P.gas, intensity: 0.45, flicker: 0.08, halo: 40 });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#040404'; ctx.fillRect(0, 0, 60, 720); ctx.fillRect(1700, 0, 100, 720);
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  async enter(G) {
    this.G = G;
    if (G.flag('gr_intro')) return;
    G.flag('gr_intro', true);
    G.date('8 de noviembre de 1888', '22:40');
    await G.walk(420);
    if (G.flag('sospecha_greaves')) await G.think('Greaves no está. Si es él, aquí habrá algo que lo demuestre.');
    else await G.think('Greaves no está. Me dijo que viniera si necesitaba algo para dormir. Pero no he venido a eso.');
    await G.think('La puerta estaba cerrada con llave. No recuerdo haberla forzado, pero el marco está astillado.');
    G.sanity(-3);
  },

  hotspots: [
    {
      id: 'drawer', name: 'Cajón del escritorio', rect: [560, GROUND - 100, 300, 100], walk: 600, face: 1,
      act: async (G) => {
        if (G.flag('drawer_open')) { await G.think('Ya está abierto. Solo había recetas y la llave.'); return; }
        await G.think('Está cerrado con llave. Con algo fino podría forzar la cerradura.');
      },
      use: async (G, item) => {
        if (item !== 'bisturi' || G.flag('drawer_open')) return false;
        G.player.pose = 'reach';
        G.audio.tick(); await G.wait(300); G.audio.tick(); await G.wait(300); G.audio.thud();
        G.player.pose = null;
        G.flag('drawer_open', true);
        await G.think('El bisturí entra en la cerradura como si la conociera. Dentro hay recetas de cloral y una llave pequeña de latón.');
        await G.think('Lo he hecho con la izquierda, sin pensar.');
        G.give('llave');
        return true;
      },
    },
    {
      id: 'cabinet', name: 'Vitrina cerrada', rect: [1240, GROUND - 400, 180, 400], walk: 1220, face: 1,
      act: async (G) => {
        if (G.flag('cabinet_open')) { await G.game.chapterHooks.readFile(G); return; }
        await G.think('Expedientes clínicos ordenados por año, detrás de un cristal cerrado con llave. Hay uno de 1879.');
      },
      use: async (G, item) => {
        if (item !== 'llave') return false;
        G.take('llave');
        G.flag('cabinet_open', true);
        G.audio.door();
        await G.think('La llave gira. Saco el expediente de 1879.');
        await G.game.chapterHooks.readFile(G);
        return true;
      },
    },
    {
      id: 'jars', name: 'Frascos de especímenes', rect: [300, 80, 300, 380], walk: 450,
      act: async (G) => { await G.think('Órganos en formol con etiquetas escritas a mano. En uno de ellos pone "Ahogado, Limehouse, 1866".'); G.sanity(-4); G.audio.whisper(1, 0.07); },
    },
    {
      id: 'chart', name: 'Lámina anatómica', rect: [660, 140, 150, 230], walk: 735,
      act: async (G) => { await G.think('Yo me la sabía de memoria. Todavía me la sé: cada órgano, cada arteria y qué se corta primero.'); },
    },
    {
      id: 'skeleton', name: 'Esqueleto', rect: [1100, GROUND - 330, 80, 330], walk: 1060,
      act: async (G) => { await G.think('Los estudiantes lo llaman "el señor Bones". Una vez me quedé dormido en la sala de disección, al lado de uno como este, y al despertar...'); await G.think('No recuerdo al despertar.'); },
    },
    {
      id: 'window', name: 'Ventana', rect: [840, 140, 210, 280], walk: 940,
      act: async (G) => { await G.think('Whitechapel Road. Hay grupos de vigilancia vecinal con faroles y palos en cada esquina. Buscan a un hombre con abrigo oscuro.'); },
    },
    {
      id: 'door', name: 'Puerta', cursor: 'exit', rect: [70, GROUND - 290, 150, 290], walk: 230, face: -1,
      act: async (G) => {
        if (!G.flag('file_read')) { await G.think('No me voy de aquí sin saber qué sabe Greaves.'); return; }
        await G.think('Afuera se oyen pasos. Alguien sube la escalera.');
      },
    },
  ],
};
