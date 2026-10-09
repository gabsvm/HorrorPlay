// The voice script: every line the game can speak, read out of the source.
//   node web/tools/voices/extract.mjs
// Walks src/ for G.say / G.think / G.voice / G.narrate (and the two readings inside them, G.two),
// keys each line as the game will (src/engine/voicekey.js) and writes tools/voices/script.json:
// [{ id, speaker, es, en, at }], keeping the English already written in en.json. Lines built at run
// time (template strings with values) cannot be recorded ahead and are listed as skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { lineKey, speakerOf, plainOf } from '../../src/engine/voicekey.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '../../src');
const files = [];
(function scan(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) scan(p); else if (f.name.endsWith('.js')) files.push(p);
  }
})(SRC);

// how a line is to be pronounced, where spelling it out reads it wrong (initials, odd names)
const say = fs.existsSync(path.join(HERE, 'say.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'say.json'), 'utf8')) : {};
const en = fs.existsSync(path.join(HERE, 'en.json')) ? JSON.parse(fs.readFileSync(path.join(HERE, 'en.json'), 'utf8')) : {};
const lines = new Map();
const skipped = [];

// what a name can hold, file-wide: const x = ..., and for (const x of [...])
let binds = new Map();
let here = 0;   // where the call being read is: a name means its nearest declaration above it
function bind(name, v) { if (!binds.has(name)) binds.set(name, []); binds.get(name).push(v); }
function values(n) {
  if (!n) return [];
  if (n.type === 'Identifier') return (binds.get(n.name) || []).filter((b, _, all) => b.pos === Math.max(...all.filter((x) => x.pos < here).map((x) => x.pos))).flatMap((b) => (b.of ? values(b.of).flatMap(items) : values(b.init)));
  if (n.type === 'MemberExpression') {
    const objs = values(n.object);
    if (n.computed) return objs.flatMap(items);
    return objs.filter((o) => o.type === 'ObjectExpression').map((o) => prop(o, n.property.name)).filter(Boolean).map((p) => p.value);
  }
  return [n];
}
function items(n) {
  if (n.type === 'ArrayExpression') return n.elements;
  if (n.type === 'ObjectExpression') return n.properties.map((p) => p.value);
  return [];
}

// the strings an expression can come to: both readings, both arms of a condition, a line picked from a list
function texts(n) {
  if (!n) return null;
  if (n.type === 'Identifier' || n.type === 'MemberExpression') {
    const vs = values(n);
    if (!vs.length || vs.some((v) => v === n)) return null;
    const ts = vs.map(texts);
    return ts.every(Boolean) ? ts.flat() : null;
  }
  if (n.type === 'Literal' && typeof n.value === 'string') return [n.value];
  if (n.type === 'TemplateLiteral' && !n.expressions.length) return [n.quasis[0].value.cooked];
  if (n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.property.name === 'two') {
    const a = texts(n.arguments[0]), b = texts(n.arguments[1]);
    return a && b ? [...a, ...b] : null;
  }
  if (n.type === 'ConditionalExpression') {
    const a = texts(n.consequent), b = texts(n.alternate);
    return a && b ? [...a, ...b] : null;
  }
  if (n.type === 'LogicalExpression') {
    const b = texts(n.right), a = texts(n.left);
    return b ? [...(a || []), ...b] : null;
  }
  return null;
}
function add(name, style, t, at) {
  const es = plainOf(t);
  if (!es) return;
  const id = lineKey(name, style, t);
  if (!lines.has(id)) lines.set(id, { id, speaker: speakerOf(name, style), es, en: en[id] || '', ...(say[id] ? { say: say[id] } : {}), at });
}
const prop = (obj, k) => obj && obj.type === 'ObjectExpression' && obj.properties.find((p) => p.key && (p.key.name === k || p.key.value === k));

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  const rel = path.relative(SRC, file).replace(/\\/g, '/');
  binds = new Map();
  walk.full(ast, (n) => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) bind(n.id.name, { init: n.init, pos: n.start });
    if (n.type === 'ForOfStatement' && n.left.type === 'VariableDeclaration' && n.left.declarations[0].id.type === 'Identifier') bind(n.left.declarations[0].id.name, { of: n.right, pos: n.start });
    // an item used where it does not go: Thomas says its 'wrong' line (engine/game.js)
    if (n.type === 'Property' && n.key && n.key.name === 'wrong' && n.value.type === 'Literal') add('', 'thought', n.value.value, `${rel}:${n.loc.start.line}`);
  });
  walk.full(ast, (n) => {
    if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression' || n.callee.property.type !== 'Identifier') return;
    const verb = n.callee.property.name;
    if (!['say', 'think', 'voice', 'narrate'].includes(verb)) return;
    if (verb === 'say' && n.callee.object.type === 'MemberExpression') return;   // game.ui.say: the engine itself
    const at = `${rel}:${n.loc.start.line}`;
    here = n.start;
    let names = [''], style = '', textNode;
    if (verb === 'say') {
      names = texts(n.arguments[0]);
      textNode = n.arguments[1];
      const st = prop(n.arguments[2], 'style');
      if (st) style = st.value.value;
    } else if (verb === 'voice') {
      const nm = prop(n.arguments[1], 'name');
      names = nm ? texts(nm.value) : [''];
      style = 'voice';
      textNode = n.arguments[0];
    } else {
      style = 'thought';
      textNode = n.arguments[0];
    }
    const ts = texts(textNode);
    if (!names || !ts) { skipped.push(`${at}  ${code.slice(n.start, Math.min(n.end, n.start + 110)).replace(/\s+/g, ' ')}`); return; }
    for (const name of names) for (const t of ts) add(name, style, t, at);
  });
}

const out = [...lines.values()];
fs.writeFileSync(path.join(HERE, 'script.json'), JSON.stringify(out, null, 1));
const by = {};
for (const l of out) by[l.speaker] = (by[l.speaker] || 0) + 1;
console.log(`${out.length} lines, ${out.reduce((s, l) => s + l.es.length, 0)} chars, ${out.filter((l) => l.en).length} in English`);
console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
if (skipped.length) console.log(`\nskipped (built at run time):\n${skipped.join('\n')}`);
