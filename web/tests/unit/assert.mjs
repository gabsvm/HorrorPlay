// A handful of assertions, so the unit tests need nothing installed.
export function ok(cond, msg = 'se esperaba verdadero') { if (!cond) throw new Error(msg); }
export function eq(a, b, msg = '') {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg}${msg ? ': ' : ''}${A} ≠ ${B}`);
}
