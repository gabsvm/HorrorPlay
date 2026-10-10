// The Black Ditch after V4-08. Its outfall is the place where the culvert comes out at the Thames: no
// visible text makes it an open river or a stream through Whitechapel. The 1888 first look gives the
// brick and, when the hearing is already strained, the sound falls away for a moment; no later look
// repeats it. The 1866 branch keeps its own line. The notebook line about the water says where it comes out.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { DEDUCTIONS } from '../../src/story/data.js';
import { perceptionBand } from '../../src/story/perception.js';
import { ok, eq } from './assert.mjs';

const BRICK = 'Ladrillo viejo. El agua sale a borbotones de debajo de la calle.';
const HEARING = 'El ruido se calla al acercarme.';
const NAT = 'La voz del agua dice nombres en la orilla, donde sale el Ditch. Quien la oye y contesta, cambia.';

// every file under web/src, as [relative path, text]
const SRC = (function list(dir) {
  return readdirSync(dir).flatMap((f) => {
    const u = new URL(f + (statSync(new URL(f, dir)).isDirectory() ? '/' : ''), dir);
    return statSync(u).isDirectory() ? list(u) : f.endsWith('.js') ? [[u.pathname.split('/src/')[1], readFileSync(u, 'utf8')]] : [];
  });
})(new URL('../../src/', import.meta.url));
const src = (name) => SRC.find(([f]) => f === name)[1];
const count = (s, t) => s.split(t).length - 1;

const fs = src('scenes/foreshore.js');
// the outfall hotspot, from its id to the next hotspot
const outfall = fs.slice(fs.indexOf("id: 'outfall'"), fs.indexOf("id: 'jetty'"));
const chapters = src('story/chapters.js');
const outfall1888 = chapters.slice(chapters.indexOf('async outfall1888(G)'), chapters.indexOf('async finaleWater(G)'));

export const tests = [
  ['ningún texto visible describe el Ditch como río o arroyo a cielo abierto en Whitechapel', () => {
    for (const [f, s] of SRC) ok(!/río abierto|arroyo|corre por Whitechapel/i.test(s), `${f} lo describe así`);
  }],
  ['el comentario de cabecera de foreshore.js dice que el culvert sale al Támesis', () => {
    ok(fs.split('\n')[0] === '// Limehouse foreshore at low tide, where the culvert of the Black Ditch comes out at the Thames.', 'cabecera distinta');
  }],
  ['el hotspot conserva su nombre', () => {
    ok(outfall.includes("name: 'Desagüe del Black Ditch'"), 'el nombre del hotspot cambió');
  }],
  ['la línea del ladrillo y la del ruido existen una sola vez, dentro del hotspot', () => {
    eq(count(fs, BRICK), 1, 'línea del ladrillo');
    eq(count(fs, HEARING), 1, 'línea del ruido');
    ok(outfall.includes(BRICK) && outfall.includes(HEARING), 'fuera del hotspot del desagüe');
  }],
  ['la rama de 1866 no tiene las líneas nuevas', () => {
    const branch = outfall.slice(outfall.indexOf('if (is1866(G)) {'), outfall.indexOf('} else {'));
    ok(branch.includes('El agua está tibia'), 'no encuentro la rama de 1866');
    ok(!branch.includes(BRICK) && !branch.includes(HEARING), 'la rama de 1866 dice una línea nueva');
  }],
  ['la primera mirada de 1888 se decide por la marca de seen del motor, sin flag nuevo', () => {
    ok(outfall.includes("G.state.seen?.['foreshore:outfall:1888']"), 'no usa seen del motor');
    ok(!outfall.includes('G.flag('), 'el hotspot lee o escribe un flag');
  }],
  ['el ruido solo se apaga con cordura strained o frayed, y con un efecto de audio existente', () => {
    ok(outfall.includes("perceptionBand(G.state.sanity) !== 'steady'"), 'la condición de cordura cambió');
    ok(outfall.includes('G.audio.setBeds({}, 0.3)') && outfall.includes('G.audio.setBeds(bed, 1.5)'), 'no usa setBeds para la caída');
    ok(!/flash|G\.red\(|G\.flash\(/.test(outfall), 'hay destellos en el hotspot');
  }],
  ['outfall1888 sigue igual: el brillo, después la comprobación del final y la voz', () => {
    ok(outfall1888.indexOf("G.flag('ditch_glow', true)") < outfall1888.indexOf('canEnterFinale'), 'el brillo ya no va primero');
    ok(outfall1888.indexOf('canEnterFinale') < outfall1888.indexOf('Ven al agua, Tommy.'), 'la voz no espera a canEnterFinale');
    eq(count(chapters, 'Ven al agua, Tommy.'), 1, 'la voz aparece más de una vez');
  }],
  ['la cordura en cada banda: steady no oye el ruido; strained y frayed sí', () => {
    eq(perceptionBand(100), 'steady');
    eq(perceptionBand(50), 'strained');
    eq(perceptionBand(20), 'frayed');
  }],
  ['d_nat dice dónde sale el agua, con el texto aprobado', () => {
    const d = DEDUCTIONS.find((x) => x.id === 'd_nat');
    ok(d, 'no existe d_nat');
    eq(d.text, NAT, 'texto de d_nat');
    eq(d.a, 'nat_voz', 'id a de d_nat');
    eq(d.b, 'regla', 'id b de d_nat');
  }],
];
