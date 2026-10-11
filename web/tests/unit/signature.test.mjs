// The ending's signature always comes out as the target, whatever was written.
import { morphFrames } from '../../src/engine/signature.js';
import { ok, eq } from './assert.mjs';

const last = (a) => a[a.length - 1];

export const tests = [
  ['un nombre largo acaba en Jack', () => eq(last(morphFrames('Thomas Ashgrove', 'Jack')), 'Jack')],
  ['vacío acaba en Jack', () => { const f = morphFrames('', 'Jack'); eq(last(f), 'Jack'); eq(f, ['J', 'Ja', 'Jac', 'Jack']); }],
  ['null acaba en Jack', () => eq(last(morphFrames(null, 'Jack')), 'Jack')],
  ['más corto que el objetivo', () => eq(last(morphFrames('Tom', 'Jack')), 'Jack')],
  ['acentos y emoji se borran por letra, sin romper caracteres', () => {
    const f = morphFrames('Ñandú 🌊🌊 Ömer', 'Jack');
    eq(last(f), 'Jack');
    for (const s of f) ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(s), `surrogate partido en «${s}»`);
  }],
  ['ya escrito Jack: queda Jack', () => eq(last(morphFrames('Jack', 'Jack')), 'Jack')],
  ['un trazo por letra: la longitud de la animación es razonable', () => ok(morphFrames('x'.repeat(40), 'Jack').length <= 40 + 4)],
  ['acentos, Unicode, emoji y espacios terminan en Jack', () => { for (const t of ['Ñoño ünïcode', '😀🙂', '   ', 'José María Ángel']) eq(last(morphFrames(t, 'Jack')), 'Jack', t); }],
  ['un texto muy largo también acaba en Jack', () => eq(last(morphFrames('a'.repeat(80), 'Jack')), 'Jack')],
];
