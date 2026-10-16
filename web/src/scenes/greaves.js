// Chapter 4 — Dr Greaves's study at the London Hospital, Whitechapel Road, 8 November 1888, night.
import * as A from '../art/paint.js';
import { QUESTIONS } from '../story/positions.js';
import { wallpaper, wainscot, floorboards, interiorWindow, desk, chair, rug, frame } from '../art/build.js';
import { drawProp, propSprite } from '../art/models.js';
import { Moths } from '../engine/life.js';
import { P } from '../art/palette.js';
import { rng } from '../art/noise.js';

const WIDTH = 1500, GROUND = 664;

// A skeleton drawn from bones, not from a stick: skull with jaw and sockets, the neck, collar bones, sternum with
// ribs on both sides, the spine as vertebrae, pelvis, arm and leg bones with their joints, hands and feet.
// Drawn for a figure 300 high and scaled to `h`; `ink` gives a line drawing (the anatomical chart), otherwise the
// bones are filled and edged so they read against the dark (the articulated skeleton). (QA-V5-017)
function boneFigure(ctx, { x, top, h, bone, edge, w = 3, ink = false }) {
  const k = h / 300;
  const X = (dx) => x + dx * k, Y = (dy) => top + dy * k;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const path = (pts) => { ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(X(a), Y(b)) : ctx.moveTo(X(a), Y(b)))); };
  const stroke = (pts, wd = w) => {
    path(pts);
    if (!ink) { ctx.strokeStyle = edge; ctx.lineWidth = wd * k + 2.4; ctx.stroke(); path(pts); }
    ctx.strokeStyle = bone; ctx.lineWidth = Math.max(1.2, wd * k); ctx.stroke();
  };
  const blob = (cx, cy, rx, ry, rot = 0) => {
    ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), rx * k, ry * k, rot, 0, Math.PI * 2);
    if (!ink) { ctx.fillStyle = bone; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.6; ctx.stroke(); } else { ctx.strokeStyle = bone; ctx.lineWidth = Math.max(1.2, 2 * k); ctx.stroke(); }
  };
  const hole = (cx, cy, r) => { ctx.fillStyle = ink ? bone : '#0a0a0a'; ctx.beginPath(); ctx.ellipse(X(cx), Y(cy), r * k, r * 1.15 * k, 0, 0, Math.PI * 2); ctx.fill(); };
  // spine behind the ribs
  stroke([[0, 56], [0, 176]], 4);
  for (let i = 0; i < 12; i++) blob(0, 62 + i * 9.6, 5.2, 3.4);
  // ribs: seven pairs, wide in the middle and narrowing to the waist, meeting the sternum
  for (let i = 0; i < 7; i++) {
    const y = 76 + i * 10.5, wid = 30 - Math.abs(i - 2.5) * 2.6 - (i > 4 ? (i - 4) * 3 : 0);
    for (const d of [-1, 1]) stroke([[d * 3, y], [d * wid * 0.55, y - 4], [d * wid, y + 7], [d * wid * 0.7, y + 17], [d * 5, y + 15]], 2.3);
  }
  stroke([[0, 70], [0, 124]], 4.6);                                // sternum
  stroke([[-30, 71], [-12, 66], [0, 68], [12, 66], [30, 71]], 3.4);   // collar bones
  // neck, skull and jaw
  for (let i = 0; i < 3; i++) blob(0, 49 + i * 4.6, 5, 2.2);
  blob(0, 20, 17, 19);                                              // cranium
  blob(0, 42, 10.5, 6.5);                                           // jaw
  hole(-6.5, 20, 4.2); hole(6.5, 20, 4.2);                          // sockets
  ctx.fillStyle = ink ? bone : '#0a0a0a'; ctx.beginPath(); ctx.moveTo(X(0), Y(26)); ctx.lineTo(X(-2.6), Y(33)); ctx.lineTo(X(2.6), Y(33)); ctx.fill();   // nasal cavity
  for (let i = -3; i <= 3; i++) { ctx.strokeStyle = ink ? bone : '#0a0a0a'; ctx.lineWidth = Math.max(0.8, 0.9 * k); ctx.beginPath(); ctx.moveTo(X(i * 2.5), Y(39)); ctx.lineTo(X(i * 2.5), Y(43)); ctx.stroke(); }   // teeth
  // arms: humerus, then the two bones of the forearm, a joint at the elbow and the hand
  for (const d of [-1, 1]) {
    stroke([[d * 31, 72], [d * 36, 128]], 3.6);
    blob(d * 36.5, 130, 4.2, 4.2);
    stroke([[d * 35, 134], [d * 40, 182]], 2.6); stroke([[d * 38, 133], [d * 44, 180]], 2.2);
    for (let f = 0; f < 4; f++) stroke([[d * 41.5, 184], [d * (40 + f * 3.4), 196 + (f % 2) * 3]], 1.6);
  }
  // pelvis
  for (const d of [-1, 1]) {
    path([[d * 3, 172], [d * 22, 176], [d * 28, 190], [d * 16, 206], [d * 4, 198]]);
    ctx.closePath();
    if (!ink) { ctx.fillStyle = bone; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.6; } else { ctx.strokeStyle = bone; ctx.lineWidth = Math.max(1.2, 2 * k); }
    ctx.stroke();
  }
  hole(0, 200, 3.4);
  // legs: femur, knee, tibia and the slimmer fibula, foot
  for (const d of [-1, 1]) {
    stroke([[d * 12, 204], [d * 15, 252]], 4.4);
    blob(d * 15.5, 254, 4.6, 4.6);
    stroke([[d * 15, 258], [d * 17, 296]], 3.4); stroke([[d * 19, 258], [d * 21, 294]], 1.8);
    stroke([[d * 17, 297], [d * 7, 298], [d * 24, 298]], 2.8);
  }
  ctx.restore();
}

// What the drawer holds once it is open: a note from Scotland Yard, copied to Greaves. It is found
// with the key and it is still there every time the drawer is looked at again.
const NOTA_SWANSON = `<h3>SCOTLAND YARD — NOTA DEL INSPECTOR JEFE D. S. SWANSON</h3>
        <p class="small">19 de octubre de 1888 · Copia al Dr. L. Greaves, por consulta.</p>
        <p class="hand">«Al principio el doctor creyó que las heridas las había causado una persona zurda; ahora lo duda.»</p>`;

// Specimen jars: five sprites share the 28 shelf jars (tall/squat plus
// round/thin/wide), so each jar is drawn from a cached copy veiled with its
// own olive tone. The veil reuses the rng values of the procedural fallback
// (which stays untouched for when the sprites are missing), keeping the
// shelf as dark and varied as the original.
const JAR_VEIL = 0.6;
const JAR_NAMES = ['greaves_jar_tall', 'greaves_jar_squat', 'greaves_jar_round', 'greaves_jar_thin', 'greaves_jar_wide'];
const jarTints = new Map();
function drawJarTinted(ctx, name, x, y, sy, cR, cG, cB) {
  const p = propSprite(name);
  if (!p) return false;
  // Quantized tints bound the cache: one entry per variant and tint step,
  // shared by every jar. The static layer is painted once, so no canvas is
  // ever allocated per frame.
  const qR = cR & ~3, qG = cG & ~3, qB = cB & ~3;
  const key = name + '|' + qR + ',' + qG + ',' + qB;
  let t = jarTints.get(key);
  if (!t) {
    t = document.createElement('canvas');
    t.width = p.img.naturalWidth || p.w;
    t.height = p.img.naturalHeight || p.h;
    const g = t.getContext('2d');
    g.drawImage(p.img, 0, 0, t.width, t.height);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(' + qR + ',' + qG + ',' + qB + ',' + JAR_VEIL + ')';
    g.fillRect(0, 0, t.width, t.height);
    jarTints.set(key, t);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, sy);
  ctx.drawImage(t, -p.ax, -p.ay);
  ctx.restore();
  return true;
}

export default {
  id: 'greaves',
  width: WIDTH,
  groundY: GROUND,
  walk: [200, 1340],
  spawn: 230,
  surface: 'wood',
  space: 'office',
  indoor: true,
  reflectY: GROUND + 6,
  wet: 0.35,
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
      ctx.fillStyle = '#0c0d0c'; ctx.fillRect(0, 0, WIDTH, 30); ctx.fillStyle = '#3a3428'; ctx.fillRect(0, 26, WIDTH, 6);
      floorboards(ctx, 0, GROUND - 6, WIDTH, 720 - GROUND + 6, { color: '#33251a' });
      rug(ctx, 560, GROUND + 6, 520, 48);
      // door with a brass name plate
      A.door(ctx, 80, GROUND - 280, 124, 280, { color: '#2a1d14', steps: 0, fanlight: false, scraper: false });
      ctx.fillStyle = '#c9bc98'; ctx.fillRect(110, GROUND - 232, 64, 22); ctx.strokeStyle = '#7a6440'; ctx.lineWidth = 2; ctx.strokeRect(110, GROUND - 232, 64, 22);
      ctx.fillStyle = '#2a2016'; ctx.font = '600 10px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('DR. L. GREAVES', 142, GROUND - 217);
      // diplomas
      frame(ctx, 236, 120, 46, 34, { seed: 3, kind: 'landscape' }); frame(ctx, 236, 176, 46, 34, { seed: 4, kind: 'landscape' });
      // shelves of specimen jars, labelled in a careful hand
      ctx.fillStyle = '#1c140e'; for (let s = 0; s < 4; s++) { ctx.fillRect(300, 170 + s * 100, 300, 10); ctx.fillStyle = 'rgba(255,230,200,0.07)'; ctx.fillRect(300, 170 + s * 100, 300, 2); ctx.fillStyle = '#1c140e'; }
      const r = rng(5);
      let prevJar = -1;
      for (let s = 0; s < 4; s++) for (let i = 0; i < 7; i++) {
        const jx = 310 + i * 41, jy = 170 + s * 100, jh = r.range(46, 78);
        const cR = r.int(70, 95), cG = r.int(78, 96), cB = r.int(48, 62), tilt = r.range(-0.3, 0.3);
        // Deterministic pick from the same rng(5) stream (same run/resume:
        // same jars; no Math.random, nothing time-based). A repeated pick
        // steps aside, so neighbours never read as clones.
        let vi = r.int(0, JAR_NAMES.length - 1);
        if (vi === prevJar) vi = (vi + 1 + r.int(0, JAR_NAMES.length - 2)) % JAR_NAMES.length;
        prevJar = vi;
        // The glass body below the lid (index body) is what jh measures, so
        // every silhouette stands on its shelf board like the old rect.
        const pJar = propSprite(JAR_NAMES[vi]);
        const sy = jh / ((pJar && pJar.body) || 50);
        if (!drawJarTinted(ctx, JAR_NAMES[vi], jx + 16, jy + 4 * sy, sy, cR, cG, cB)) {
          ctx.fillStyle = `rgba(${cR},${cG},${cB},0.8)`;
          ctx.fillRect(jx, jy - jh, 32, jh);
          ctx.fillStyle = 'rgba(40,30,20,0.85)'; ctx.beginPath(); ctx.ellipse(jx + 16, jy - jh * 0.45, 9, jh * 0.22, tilt, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#2a2016'; ctx.fillRect(jx - 2, jy - jh - 6, 36, 7);
          ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(jx + 4, jy - jh + 4, 3, jh - 8);
          ctx.fillStyle = '#c9bc98'; ctx.fillRect(jx + 8, jy - 20, 16, 10); ctx.fillStyle = 'rgba(40,30,20,0.6)'; ctx.fillRect(jx + 10, jy - 16, 12, 1.5);
        }
      }
      // anatomical chart
      ctx.fillStyle = '#c6b892'; ctx.fillRect(660, 140, 150, 230);
      ctx.fillStyle = '#4a3a1e'; ctx.fillRect(656, 136, 158, 6); ctx.fillRect(656, 368, 158, 6);
      boneFigure(ctx, { x: 733, top: 152, h: 208, bone: '#5a3a2a', w: 3, ink: true });
      ctx.fillStyle = '#8a2a1e'; ctx.beginPath(); ctx.ellipse(739, 214, 5.5, 7.5, 0.3, 0, Math.PI * 2); ctx.fill();   // the heart, on his left
      ctx.strokeStyle = 'rgba(40,30,20,0.6)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(770, 190 + i * 24); ctx.lineTo(800, 190 + i * 24); ctx.stroke(); }
      A.stain(ctx, 660, 140, 150, 230, { seed: 3, alpha: 0.5 });
      // window onto Whitechapel Road
      const win = interiorWindow(ctx, 860, 160, 170, 240);
      lights.push({ x: win.x, y: win.y, r: 300, color: [0.3, 0.38, 0.45], intensity: 0.4, halo: 0, reflect: false, shaft: true, shaftY0: 166, shaftW0: 78, shaftW: 120, shaftSkew: -280, shaftK: 0.5 });
      // locked glass-fronted cabinet of case files
      if (!drawProp(ctx, 'greaves_cabinet', 1330, GROUND - 10)) {
        ctx.fillStyle = '#1e140c'; ctx.fillRect(1240, GROUND - 400, 180, 400);
        ctx.fillStyle = '#2a1e14'; ctx.fillRect(1232, GROUND - 410, 196, 12);
        ctx.fillStyle = 'rgba(30,40,40,0.9)'; ctx.fillRect(1254, GROUND - 386, 152, 220);
        for (let s = 0; s < 3; s++) {
          ctx.fillStyle = '#2a1e14'; ctx.fillRect(1254, GROUND - 316 + s * 70, 152, 6);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#5a4a30', '#3a2a20', '#6a5a3a'][i % 3]; ctx.fillRect(1260 + i * 24, GROUND - 360 + s * 70, 18, 44); ctx.fillStyle = '#c9bc98'; ctx.fillRect(1263 + i * 24, GROUND - 350 + s * 70, 12, 6); }
        }
        ctx.fillStyle = 'rgba(180,200,210,0.12)'; ctx.beginPath(); ctx.moveTo(1260, GROUND - 386); ctx.lineTo(1300, GROUND - 386); ctx.lineTo(1260, GROUND - 300); ctx.fill();
        ctx.fillStyle = '#1e140c'; ctx.fillRect(1328, GROUND - 386, 4, 220);
        ctx.fillStyle = '#b08a4e'; ctx.fillRect(1322, GROUND - 270, 16, 10);
        ctx.fillStyle = '#171009'; ctx.fillRect(1254, GROUND - 150, 152, 140);
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(1260, GROUND - 144, 68, 128); ctx.fillRect(1332, GROUND - 144, 68, 128);
      }
      // articulated skeleton on its stand: the pole behind, then the bones
      const sx = 1140;
      ctx.fillStyle = '#1a1a1a'; ctx.fillRect(sx - 3, GROUND - 336, 6, 330); ctx.fillRect(sx - 30, GROUND - 6, 60, 6); ctx.fillRect(sx - 3, GROUND - 342, 26, 4);
      boneFigure(ctx, { x: sx, top: GROUND - 332, h: 306, bone: '#c4b8a0', edge: '#0a0a0a', w: 3 });
      // desk: microscope, a skull used as a paperweight, case notes, the green-shaded lamp
      desk(ctx, 560, GROUND, 300);
      chair(ctx, 880, GROUND, -1);
      ctx.fillStyle = '#d4c6a0'; ctx.fillRect(620, GROUND - 104, 90, 8); ctx.fillRect(626, GROUND - 108, 70, 4);
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(780, GROUND - 112, 20, 16);
      if (!drawProp(ctx, 'greaves_microscope', 827, GROUND - 98)) {
        ctx.fillStyle = '#3a3428'; ctx.fillRect(812, GROUND - 104, 30, 6); ctx.fillRect(822, GROUND - 150, 8, 48); ctx.fillRect(818, GROUND - 156, 22, 10);
        ctx.save(); ctx.translate(826, GROUND - 140); ctx.rotate(-0.3); ctx.fillStyle = '#9a8350'; ctx.fillRect(0, -16, 8, 26); ctx.restore();
      }
      if (!drawProp(ctx, 'greaves_skull', 752, GROUND - 99)) {
        ctx.fillStyle = '#c4b8a0'; ctx.beginPath(); ctx.ellipse(752, GROUND - 112, 14, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(744, GROUND - 106, 16, 8);
        ctx.fillStyle = '#1a1612'; ctx.beginPath(); ctx.ellipse(752, GROUND - 112, 3.5, 3.5, 0, 0, Math.PI * 2); ctx.ellipse(760, GROUND - 112, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#6a5a30'; ctx.fillRect(700, GROUND - 150, 6, 50); ctx.fillRect(686, GROUND - 100, 34, 6);
      ctx.fillStyle = '#1f5a3e'; ctx.beginPath(); ctx.moveTo(672, GROUND - 150); ctx.lineTo(734, GROUND - 150); ctx.lineTo(722, GROUND - 170); ctx.lineTo(684, GROUND - 170); ctx.fill();
      ctx.fillStyle = 'rgba(160,255,200,0.2)'; ctx.fillRect(684, GROUND - 168, 38, 3);
      // a second gas bracket above the case files
      ctx.fillStyle = '#4a3e28'; ctx.fillRect(1318, GROUND - 426, 24, 6); ctx.fillRect(1328, GROUND - 436, 4, 12);
      ctx.fillStyle = '#e8d4a0'; ctx.beginPath(); ctx.ellipse(1330, GROUND - 442, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
      // gas bracket on the wall by the door
      ctx.fillStyle = '#4a3e28'; ctx.fillRect(250, 196, 24, 6); ctx.fillRect(266, 186, 4, 12);
      ctx.fillStyle = '#e8d4a0'; ctx.beginPath(); ctx.ellipse(268, 182, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    });
    lights.push({ id: 'lamp', x: 703, y: GROUND - 140, r: 560, color: [0.95, 0.85, 0.55], intensity: 1.0, flicker: 0.04, halo: 50 });
    lights.push({ id: 'gas', x: 268, y: 182, r: 360, color: P.gas, intensity: 0.45, flicker: 0.08, halo: 40 });
    lights.push({ id: 'gas2', x: 1330, y: GROUND - 440, r: 380, color: P.gas, intensity: 0.5, flicker: 0.08, halo: 34 });
    const fg = R.paintLayer(WIDTH * 1.2, (ctx) => {
      ctx.fillStyle = '#040404'; ctx.fillRect(0, 0, 60, 720); ctx.fillRect(1700, 0, 100, 720);
    });
    return { layers: [{ canvas: near, parallax: 1, kind: 'near' }, { canvas: fg, parallax: 1.2, kind: 'fg' }], lights };
  },

  makeLife() {
    return [new Moths({ x: 703, y: GROUND - 175, n: 3 })];
  },

  async enter(G) {
    this.G = G;
    if (G.flag('gr_intro')) return;
    G.flag('gr_intro', true);
    G.date('8 de noviembre de 1888', '22:40');
    await G.walk(420);
    if (G.flag('sospecha_greaves')) await G.think('Si Greaves me miente, guarda aquí la prueba.');
    else await G.think('Vine por una respuesta, no por otra dosis.');
    G.sanity(-3);
  },

  hotspots: [
    {
      id: 'drawer', name: 'Cajón del escritorio', rect: [560, GROUND - 100, 300, 100], walk: 600, face: 1,
      act: async (G) => {
        if (G.flag('drawer_open')) { await G.doc(NOTA_SWANSON); return; }   // open: the note is still in it
        await G.think('La cerradura es pequeña. Necesito algo fino.');
      },
      use: async (G, item) => {
        if (item !== 'bisturi' || G.flag('drawer_open')) return false;
        G.player.pose = 'reach';
        G.audio.tick(); await G.wait(300); G.audio.tick(); await G.wait(300); G.audio.thud();
        G.player.pose = null;
        G.flag('drawer_open', true);
        await G.think('Ni siquiera tuve que probar dos veces.');
        G.give('llave');
        await G.doc(NOTA_SWANSON);
        return true;
      },
    },
    {
      id: 'cabinet', name: 'Vitrina cerrada', rect: [1240, GROUND - 400, 180, 400], walk: 1220, face: 1,
      act: async (G) => {
        if (G.flag('cabinet_open')) { await G.game.chapterHooks.readFile(G); return; }
        await G.think('Expedientes por año. El de 1879 está apartado.');
      },
      use: async (G, item) => {
        if (item !== 'llave') return false;
        G.take('llave');
        G.flag('cabinet_open', true);
        G.audio.door();
        // before he shows the file: Thomas's own reading of the letter, a posture (positions.js), no flag and no gate
        const Q = QUESTIONS.letter_author;
        if (!G.second() && !G.flag('awake') && Q.visible(G.state)) {
          // V5-02: «Pude escribirla yo» is one more answer, offered with the lost night's evidence in the notebook
          const answers = [['Todavía no sé quién la escribió.', 'insuficiente'], ['La carta pudo escribirla Greaves.', 'greaves'], ['Alguien que entra en mi cuarto.', 'cercano'],
            ...(Q.optionOk(G.state, 'yo') ? [['Pude escribirla yo.', 'yo']] : [])];
          const c = await G.choice(answers.map((a) => a[0]));
          const value = answers[c][1];
          G.game.setPosition('letter_author', value);
        }
        await G.game.chapterHooks.readFile(G);
        return true;
      },
    },
    {
      id: 'jars', name: 'Frascos de especímenes', rect: [300, 80, 300, 380], walk: 450,
      act: async (G) => { G.sanityOnce('jars', -4); G.audio.whisper(1, 0.07); G.red(0.25); },   // a label: Limehouse, 1866. Nothing said
    },
    {
      id: 'chart', name: 'Lámina anatómica', rect: [660, 140, 150, 230], walk: 735,
      act: async (G) => { await G.think('Puedo señalar cada arteria sin mirar.'); },
    },
    {
      id: 'skeleton', name: 'Esqueleto', rect: [1100, GROUND - 330, 80, 330], walk: 1060,
      act: async (G) => {
        if (G.second() && !G.flag('s2_1879')) {
          // the second reading: the dissecting room, March 1879, for a few frames
          G.flag('s2_1879', true);
          await G.vision('hands');
          G.red(0.4);
          await G.think('La mesa 3. Marzo de 1879. La enfermera junto al lavadero. Ahora lo veo entero.');
          return;
        }
        await G.think('El sueño terminó aquí, en otra mesa. El resto está borrado.');
      },
    },
    {
      id: 'door', name: 'Puerta', cursor: 'exit', rect: [70, GROUND - 290, 150, 290], walk: 230, face: -1,
      act: async (G) => {
        if (!G.flag('file_read')) { await G.think('Sin el expediente no salgo.'); return; }
        if (!G.flag('greaves_done')) { await G.game.chapterHooks.readFile(G); return; }   // interrupted (e.g. by a save): resume the confrontation

      },
    },
  ],
};
