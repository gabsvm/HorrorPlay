// The whole script, read out of the game, for rewriting it: every line said or thought, every choice,
// document and objective, under the scene and the thing in it that triggers them, with the
// conditions that decide which lines play.
//   node web/tools/script/export.mjs [OUT.md]      (default: web/GUION.md)
// Run `npm i` in this folder once (it needs acorn).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.join(HERE, '../..');
const SRC = path.join(WEB, 'src');
const OUT = process.argv[2] || path.join(WEB, 'GUION.md');

// the order the player meets them in
const SCENES = [
  ['room', 'El cuarto de Thomas (Thrawl Street)'],
  ['bucks_row', "Buck's Row (Mary Ann Nichols)"],
  ['knackers', 'El desolladero de Barber (Winthrop Street)'],
  ['foreshore', 'La orilla del Támesis, el Black Ditch (Limehouse)'],
  ['hanbury', 'Hanbury Street, 29 (Annie Chapman)'],
  ['greaves', 'La consulta del Dr. Greaves (London Hospital)'],
  ['seance', 'La sesión de Madame Wexley'],
  ['millers', "Miller's Court / Whitechapel Road"],
  ['mitre', 'Mitre Square (Catherine Eddowes)'],
  ['goulston', 'Goulston Street (el grafito)'],
  ['alleys', 'La persecución por los callejones'],
];
const VERBS = { act: 'Al interactuar', use: 'Al usar un objeto sobre ello', look: 'Al mirarlo', enter: 'Al entrar en la escena', exit: 'Al salir', examine: 'Al examinarlo en el inventario', hint: 'Pista (botón de ayuda)' };
const SPEAKER = { Ashgrove: 'Thomas', Thomas: 'Thomas' };

const out = [];
const put = (depth, s) => out.push(`${'  '.repeat(depth)}- ${s}`);
let code = '';

const clean = (t) => String(t).replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const src = (n) => code.slice(n.start, n.end).replace(/\bG\.(game\.)?/g, '').replace(/\s+/g, ' ');
const children = (n) => {
  const kids = [];
  for (const [k, v] of Object.entries(n)) {
    if (k === 'loc') continue;
    if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === 'string' && kids.push(x));
    else if (v && typeof v.type === 'string') kids.push(v);
  }
  return kids.sort((a, b) => a.start - b.start);
};
const prop = (obj, k) => obj && obj.type === 'ObjectExpression' && obj.properties.find((p) => p.key && (p.key.name === k || p.key.value === k));
const str = (n) => (n && n.type === 'Literal' && typeof n.value === 'string' ? n.value : n && n.type === 'TemplateLiteral' ? n.quasis.map((q, i) => q.value.cooked + (n.expressions[i] ? `{${src(n.expressions[i])}}` : '')).join('') : null);

// what a name holds where it is used: its nearest declaration above (const x = ..., for (const x of [...]))
let binds = new Map();
function bindAll(ast) {
  binds = new Map();
  const visit = (n) => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) (binds.get(n.id.name) || binds.set(n.id.name, []).get(n.id.name)).push({ at: n.start, v: n.init });
    if (n.type === 'ForOfStatement' && n.left.type === 'VariableDeclaration' && n.left.declarations[0].id.type === 'Identifier') (binds.get(n.left.declarations[0].id.name) || binds.set(n.left.declarations[0].id.name, []).get(n.left.declarations[0].id.name)).push({ at: n.start, v: n.right, each: true });
    for (const k of children(n)) visit(k);
  };
  visit(ast);
}
function resolve(n) {
  const all = (binds.get(n.name) || []).filter((b) => b.at < n.start);
  if (!all.length) return null;
  const b = all.reduce((x, y) => (y.at > x.at ? y : x));
  if (!b.each) return b.v;
  const list = b.v.type === 'Identifier' ? resolve(b.v) || b.v : b.v;
  return list.type === 'ArrayExpression' ? { type: 'ArrayExpression', elements: list.elements, start: list.start, end: list.end, each: true } : list;
}

// what an argument says: a string, both readings of G.two, both arms of a condition
function variants(n) {
  if (!n) return [];
  const s = str(n);
  if (s != null) return [['', s]];
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.property.name === 'two') {
    return [...variants(n.arguments[0]).map(([c, t]) => [`1ª lectura${c ? ', ' + c : ''}`, t]), ...variants(n.arguments[1]).map(([c, t]) => [`2ª lectura${c ? ', ' + c : ''}`, t])];
  }
  if (n.type === 'ConditionalExpression') {
    return [...variants(n.consequent).map(([c, t]) => [`si ${src(n.test)}${c ? '; ' + c : ''}`, t]), ...variants(n.alternate).map(([c, t]) => [`si no${c ? '; ' + c : ''}`, t])];
  }
  if (n.type === 'LogicalExpression') return [...variants(n.left), ...variants(n.right)];
  if (n.type === 'Identifier') { const r = resolve(n); return r ? variants(r) : [['', `{${src(n)}}`]]; }
  if (n.type === 'ArrayExpression') return n.elements.flatMap((e, i) => variants(e).map(([c, t]) => [n.each ? c : `vez ${i + 1}${c ? ', ' + c : ''}`, t]));
  if (n.type === 'ObjectExpression') return n.properties.flatMap((p) => variants(p.value).map(([c, t]) => [`para "${p.key.value ?? p.key.name}"${c ? ', ' + c : ''}`, t]));
  if (n.type === 'MemberExpression') {
    const o = n.object.type === 'Identifier' ? resolve(n.object) : n.object;
    if (o && !n.computed && o.type === 'ArrayExpression') return o.elements.flatMap((e) => (prop(e, n.property.name) ? variants(prop(e, n.property.name).value) : []));
    if (o && n.computed && o.type !== 'Identifier') return variants(o);
    return [['', `{${src(n)}}`]];
  }
  return [['', `{${src(n)}}`]];
}

function line(depth, who, n, style) {
  for (const [cond, t] of variants(n)) {
    const tag = cond ? ` _(${cond})_` : '';
    if (style === 'thought') put(depth, `*Thomas (piensa):* ${clean(t)}${tag}`);
    else if (style === 'voice') put(depth, `**${who || 'La voz'} (la voz):** _${clean(t)}_${tag}`);
    else put(depth, `**${SPEAKER[who] || who || '—'}:** ${clean(t)}${tag}`);
  }
}

function call(n, depth) {
  const c = n.callee;
  if (c.type !== 'MemberExpression' || c.property.type !== 'Identifier') return false;
  const f = c.property.name, a = n.arguments;
  const target = src(c.object);
  if (f === 'say' && target !== 'game.ui' && target !== 'ui') {
    const st = prop(a[2], 'style');
    for (const [, who] of variants(a[0])) line(depth, who, a[1], st && st.value.value);
    return true;
  }
  if (f === 'think' || f === 'narrate') { line(depth, '', a[0], 'thought'); return true; }
  if (f === 'voice') { const nm = prop(a[1], 'name'); line(depth, nm ? str(nm.value) : '', a[0], 'voice'); return true; }
  if (f === 'choice' && a[0]) {
    // the options, or every list of options the argument can be (one per junction of a chase, say)
    let lists = [a[0]];
    let prompts = [];   // the question over each list, when the choice is given one (a chase junction's q)
    if (a[0].type === 'Identifier') lists = [resolve(a[0]) || a[0]];
    if (a[0].type === 'MemberExpression' && !a[0].computed) {
      const o = a[0].object.type === 'Identifier' ? resolve(a[0].object) : null;
      if (o && o.type === 'ArrayExpression') {
        lists = o.elements.map((e) => prop(e, a[0].property.name)?.value).filter(Boolean);
        prompts = o.elements.map((e) => { const q = prop(e, 'q')?.value; return q ? str(q) : null; });
      }
    }
    // both readings, or both arms of a condition, are two separate menus
    lists = lists.flatMap((l) => (l.type === 'ConditionalExpression' ? [l.consequent, l.alternate]
      : l.type === 'CallExpression' && l.callee.property && l.callee.property.name === 'two' ? l.arguments : [l]));
    // a menu built as it goes: opts = [[label, key], ...] and opts.push([label, key]) under conditions
    if (lists.length === 1 && lists[0].type === 'CallExpression' && lists[0].callee.property?.name === 'map' && lists[0].callee.object.type === 'Identifier') {
      const name = lists[0].callee.object.name, decl = resolve(lists[0].callee.object);
      if (decl && decl.type === 'ArrayExpression') {
        const items = decl.elements.map((e) => [e.elements ? str(e.elements[0]) : null, '']);
        const body = code.slice(decl.end, n.start);
        const re = new RegExp(String.raw`(?:if \((.*?)\)\s*)?` + name + String.raw`\.push\(\[\s*(['"])((?:\.|(?!\2).)*)\2`, 'g');
        for (const m of body.matchAll(re)) items.push([m[3].replace(/\'/g, "'"), m[1] ? m[1].replace(/\bG\.(game\.)?/g, '') : '']);
        put(depth, '> **Menú de conversación** (las opciones que aparecen según lo ya hecho):');
        items.filter(([t]) => t).forEach(([t, c]) => put(depth + 1, `${clean(t)}${c ? ` _(si ${c})_` : ''}`));
        return true;
      }
    }
    for (const [i, l] of lists.entries()) {
      if (prompts[i]) put(depth, `> **Pregunta:** ${clean(prompts[i])}`);
      const opts = l.type === 'ArrayExpression' ? l.elements.map((e, i) => `${i + 1}) ${variants(e).map(([, t]) => clean(t)).join(' | ')}`) : [`(se arman en el momento: ${src(l)})`];
      put(depth, `> **Elección:** ${opts.join('  ·  ')}`);
    }
    return true;
  }
  if (f === 'doc' && a[0]) { put(depth, `[Documento] ${variants(a[0]).map(([, t]) => clean(t)).join(' | ')}`); return true; }
  if (f === 'card') { put(depth, `[Rótulo] ${a.slice(1, 3).map((x) => variants(x).map(([, t]) => clean(t)).join(' | ')).filter(Boolean).join(' — ')}`); return true; }
  if (f === 'objective' && a[0]) { put(depth, `[Objetivo] ${variants(a[0]).map(([, t]) => clean(t)).join(' | ')}`); return true; }
  if (f === 'clue' && a[0]) { put(depth, `[+ Pista al cuaderno: ${str(a[0]) ?? src(a[0])}]`); return true; }
  if (f === 'give' && a[0]) { put(depth, `[+ Objeto: ${str(a[0]) ?? src(a[0])}]`); return true; }
  if (f === 'goto' && a[0]) { put(depth, `[→ Escena: ${str(a[0]) ?? src(a[0])}]`); return true; }
  if (f === 'vision' && a[0]) { put(depth, `[Visión: ${str(a[0]) ?? src(a[0])}]`); return true; }
  if (f === 'toast' && a[0]) { put(depth, `[Aviso] ${variants(a[0]).map(([, t]) => clean(t)).join(' | ')}`); return true; }
  return false;
}

// walk in source order, writing what the player would read and the conditions around it
function walk(n, depth) {
  if (!n) return;
  if (n.type === 'IfStatement') {
    const before = out.length;
    put(depth, `_Si ${src(n.test)}:_`);
    const mark = out.length;
    walk(n.consequent, depth + 1);
    if (out.length === mark) out.length = before;   // nothing said inside: no need for the condition
    if (n.alternate) {
      const b2 = out.length;
      put(depth, n.alternate.type === 'IfStatement' ? '_Si no:_' : '_Si no:_');
      const m2 = out.length;
      walk(n.alternate, depth + 1);
      if (out.length === m2) out.length = b2;
    }
    return;
  }
  if (n.type === 'CallExpression' && call(n, depth)) return;
  if (n.type === 'ObjectExpression' && prop(n, 'id') && prop(n, 'name')) { hotspot(n, depth); return; }
  for (const k of children(n)) walk(k, depth);
}

function hotspot(n, depth) {
  const name = variants(prop(n, 'name').value).map(([, t]) => clean(t)).join(' / ');
  const id = str(prop(n, 'id').value);
  const when = prop(n, 'when');
  out.push('', `${'#'.repeat(Math.min(5, 4 + depth))} ${name} \`${id}\``);
  if (when) out.push(`_Aparece si: ${src(when.value.body || when.value)}_`);
  const before = out.length;
  for (const p of n.properties) {
    if (!p.key || !VERBS[p.key.name] || p.key.name === 'hint') continue;
    out.push(`**${VERBS[p.key.name]}:**`);
    const mark = out.length;
    walk(p.value, 0);
    if (out.length === mark) out.push('- _(sin texto)_');
  }
  if (out.length === before) out.push('_(sin interacción con texto)_');
}

function scene(file, title) {
  const p = path.join(SRC, 'scenes', `${file}.js`);
  if (!fs.existsSync(p)) return;
  code = fs.readFileSync(p, 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  bindAll(ast);
  const start = out.length;
  out.push('', `## ${title}`, `_Archivo: src/scenes/${file}.js_`);
  const def = ast.body.find((b) => b.type === 'ExportDefaultDeclaration');
  const obj = def && def.declaration;
  // the scene's own moments (entering it, the hint), then each thing in it
  for (const p of (obj && obj.properties) || []) {
    const key = p.key && p.key.name;
    if (['enter', 'exit'].includes(key) || p.kind === 'init' && key === 'enter') {
      out.push('', `### ${VERBS[key]}`);
      const mark = out.length; walk(p.value, 0); if (out.length === mark) out.push('_(sin texto)_');
    }
    if (key === 'hint') { const v = variants(p.value.body || p.value).filter(([, t]) => t !== '{null}'); if (v.length) { out.push('', '### Pista (botón de ayuda)'); v.forEach(([c, t]) => put(0, `${clean(t)}${c ? ` _(${c})_` : ''}`)); } }
  }
  for (const p of (obj && obj.properties) || []) {
    const key = p.key && p.key.name;
    if (['enter', 'exit', 'hint'].includes(key)) continue;
    const mark = out.length;
    out.push('', `### ${key === 'hotspots' ? 'Cosas con las que se interactúa' : `\`${key}\``}`);
    const m2 = out.length;
    walk(p.value, 0);
    if (out.length === m2) out.length = mark;
  }
  // helpers outside the scene object (e.g. paying Wren)
  for (const b of ast.body) {
    if (b.type !== 'FunctionDeclaration') continue;
    const mark = out.length;
    out.push('', `### Secuencia \`${b.id.name}\``);
    const m2 = out.length; walk(b.body, 0); if (out.length === m2) out.length = mark;
  }
  if (!out.slice(start).some((l) => /^\s*- /.test(l))) out.length = start;   // no words in it (art, a corridor)
}

function chapters() {
  code = fs.readFileSync(path.join(SRC, 'story', 'chapters.js'), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  bindAll(ast);
  out.push('', '## Secuencias de la historia (capítulos, transiciones, final)', '_Archivo: src/story/chapters.js. Cada una la dispara una escena o un objeto en el momento indicado por su nombre._');
  const fn = ast.body.find((b) => b.type === 'ExportNamedDeclaration' && b.declaration.id && b.declaration.id.name === 'makeChapters');
  const walkObj = (n) => {
    if (!n) return;
    if (n.type === 'ObjectExpression' && n.properties.some((p) => p.value && /Function/.test(p.value.type))) {
      for (const p of n.properties) {
        if (!p.value || !/Function/.test(p.value.type)) continue;
        const mark = out.length;
        out.push('', `### \`${p.key.name}\``);
        const m2 = out.length; walk(p.value.body, 0); if (out.length === m2) out.length = mark;
      }
      return;
    }
    for (const k of children(n)) walkObj(k);
  };
  walkObj(fn);
}

function intro() {
  code = fs.readFileSync(path.join(SRC, 'story', 'intro.js'), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  bindAll(ast);
  out.push('', '## Introducción (antes del prólogo)', '_Archivo: src/story/intro.js. Ficha policial del cuaderno, tres líneas sobre Whitechapel y la primera página._');
  for (const b of ast.body) {
    if (b.type !== 'VariableDeclaration') continue;
    for (const d of b.declarations) {
      const ts = [];
      const grab = (n) => { const s = str(n); if (s != null && s.length > 2 && /\s/.test(s)) ts.push(s); else if (n && typeof n === 'object') for (const k of children(n)) grab(k); };
      grab(d.init);
      ts.forEach((t) => put(0, clean(t)));
    }
  }
}

function data() {
  code = fs.readFileSync(path.join(SRC, 'story', 'data.js'), 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  bindAll(ast);
  const exp = (name) => ast.body.find((b) => b.type === 'ExportNamedDeclaration' && b.declaration.declarations && b.declaration.declarations[0].id.name === name)?.declaration.declarations[0].init;
  out.push('', '## El cuaderno: objetos, pistas y deducciones', '_Archivo: src/story/data.js. `text` es lo que se lee en la primera partida; `text2` y `truth2`, lo que cambia o se añade en la segunda lectura._');
  const LABEL = { profile: 'Rasgo del perfil', truth: 'Verdad (2ª lectura)', name: 'Nombre', desc: 'Descripción', text: 'Texto', text2: 'Texto (2ª lectura)', truth2: 'Verdad (2ª lectura)', tag: 'Dónde', wrong: 'Si se usa donde no va', q: 'Pregunta', a: 'Respuesta', label: 'Etiqueta' };
  for (const name of ['ITEMS', 'CLUES', 'DEDUCTIONS', 'PROFILE', 'FINALS']) {
    const obj = exp(name);
    if (!obj) continue;
    out.push('', `### ${name === 'ITEMS' ? 'Objetos' : name === 'CLUES' ? 'Pistas' : name === 'DEDUCTIONS' ? 'Deducciones (unir dos pistas)' : name}`);
    const entries = obj.type === 'ObjectExpression' ? obj.properties.map((p) => [p.key.name ?? p.key.value, p.value]) : obj.elements.map((e, i) => [str(prop(e, 'id')?.value) || String(i + 1), e]);
    for (const [k, v] of entries) {
      out.push('', `**\`${k}\`**`);
      if (v.type !== 'ObjectExpression') continue;
      for (const p of v.properties) {
        const key = p.key && (p.key.name ?? p.key.value);
        if (/Function/.test(p.value.type)) { const mark = out.length; walk(p.value.body, 1); if (out.length > mark) out.splice(mark, 0, `- ${VERBS[key] || key}:`); continue; }
        const v2 = variants(p.value).filter(([, t]) => !/^\{/.test(t));
        if (key === 'id') continue;
        if (key === 'a') { put(0, `Une las pistas: \`${str(p.value)}\` + \`${str(prop(v, 'b')?.value)}\``); continue; }
        if (v2.length && LABEL[key]) v2.forEach(([c, t]) => put(0, `${LABEL[key]}: ${clean(t)}${c ? ` _(${c})_` : ''}`));
      }
    }
  }
}

// ------------------------------------------------------------------------------------------ write
const bible = fs.readFileSync(path.join(WEB, 'STORY_BIBLE.md'), 'utf8').replace(/^# .*\n/, '');
out.push(
  '# El Huésped — guion completo',
  '',
  `_Generado desde el código del juego (${new Date().toISOString().slice(0, 10)}) con \`node web/tools/script/export.mjs\`. Es todo lo que el jugador puede leer: diálogos, pensamientos de Thomas, elecciones, documentos, objetivos y el cuaderno._`,
  '',
  '## Cómo está hecho el juego (para reescribirlo)',
  '',
  '- **Género:** aventura de apuntar y hacer clic, de terror y misterio, en 2D con escenarios pintados en pixel art. Whitechapel, otoño de 1888. Unos 30–45 minutos.',
  '- **Cómo se juega:** Thomas camina por cada escena. Las cosas con las que se puede interactuar (abajo, en cada escena, con su nombre en pantalla y su `id` interno) responden a un clic: casi siempre con un pensamiento de Thomas o una conversación. Se pueden usar objetos del inventario sobre ellas.',
  '- **El cuaderno (tecla N):** guarda las pistas. El jugador une dos pistas que encajan para hacer una **deducción**; las deducciones hacen avanzar la historia y construyen el perfil del asesino.',
  '- **Dos lecturas:** al terminar el juego se desbloquea una segunda partida. Las líneas marcadas _(1ª lectura)_ y _(2ª lectura)_ son la misma escena contada como Thomas la cree y como fue. La segunda no debe ser obvia en la primera.',
  '- **Cordura:** algunas cosas la bajan (efectos visuales, la voz). No cambia el texto salvo donde se indica.',
  '- **Formato del guion:** `**Personaje:**` es diálogo hablado; `*Thomas (piensa):*` es un pensamiento (texto en cursiva, sin nombre en pantalla); `(la voz)` es la voz del agua o de alguien poseído. `_Si …:_` son condiciones del código (flags del estado de la partida: `flag(\'x\')` es algo que ya pasó, `hasClue(\'x\')` una pista ya obtenida, `has(\'x\')` un objeto en el inventario, `second()` la segunda partida). `> Elección` son las opciones que elige el jugador. `[…]` son efectos: pista nueva, objeto, documento en pantalla, cambio de escena, objetivo.',
  '- **Capítulos en las condiciones:** `p === \'c1\'` (o `phase(G)`) es el capítulo en curso: `c1` 31 de agosto (Nichols), `c2` 8 de septiembre (Chapman), `c3a`/`c3b` la noche del doble crimen y los días después, `c4` el final.',
  '- **Al reescribir:** se puede cambiar cualquier texto, quitar interacciones que solo describen (o dejarlas sin texto) y fusionar conversaciones. Conviene mantener los `id` de las cosas y de las pistas, o indicar los nuevos, para poder pasarlo al juego.',
  '',
  '## Contexto: la biblia de la historia',
  bible.replace(/^## /gm, '### ').replace(/^### (?=\d)/gm, '### '),
);
intro();
for (const [f, t] of SCENES) scene(f, t);
const listed = new Set(SCENES.map(([f]) => f));
for (const f of fs.readdirSync(path.join(SRC, 'scenes')).map((x) => x.replace(/\.js$/, '')).filter((f) => !listed.has(f))) scene(f, f);
chapters();
data();
fs.writeFileSync(OUT, out.join('\n') + '\n');
const said = out.filter((l) => /^\s*- (\*\*|\*Thomas)/.test(l)).length;
console.log(`${OUT}: ${out.length} lines, ${said} spoken or thought`);
