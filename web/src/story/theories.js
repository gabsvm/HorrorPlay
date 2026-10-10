// The case's open questions, as the notebook shows them under «Teorías». Each question has two or
// three explanations; the evidence for and against each one is read off the state, so a theory is
// never something the player has to declare to move on. A question appears only once its first
// piece of evidence does, and nothing here says "Thomas is the killer" before the story lets him
// think it (the flag `awake`, chapter IV).
//
// status: 'sin evaluar' (not enough yet), 'plausible', 'no demostrada' (the evidence does not reach
// it, or there is evidence against), 'refutada', 'sostenida'.
// Pure: evaluate(state) reads, never writes.

// a piece of evidence: a clue, a deduction or a flag, with how the notebook names it
const C = (id, note) => ({ kind: 'clue', id, note });
const D = (id, note) => ({ kind: 'ded', id, note });
const F = (id, note) => ({ kind: 'flag', id, note });

export const THEORIES = [
  {
    id: 'intruso',
    q: '¿Alguien entra en mi cuarto de noche, o salgo yo sin recordarlo?',
    hyps: [
      { id: 'intruso', text: 'Alguien entra por la ventana mientras duermo.',
        for: [C('ventana', 'barro en el alféizar'), C('botas', 'botas mojadas que dejé secas'), C('estuche', 'falta un bisturí del estuche')],
        against: [C('llave_pike', 'la puerta, cerrada por dentro'), C('expediente', 'la laguna de 1879')],
        rule: (n, s) => (s.flags.awake ? 'refutada' : n.against >= 2 ? 'no demostrada' : n.for ? 'plausible' : 'sin evaluar') },
      { id: 'yo', text: 'Salgo yo, y no lo recuerdo.',
        for: [C('botas', 'barro de río hasta dentro'), C('huellas', 'huellas de mi talla'), C('dedos', 'tinta en mis dedos al despertar'), C('expediente', 'ya me pasó en 1879')],
        against: [],
        rule: (n, s) => (s.flags.awake ? 'sostenida' : n.for >= 3 ? 'plausible' : 'sin evaluar') },
    ],
  },
  {
    id: 'brennan',
    q: '¿Brennan, o un barrio que necesita a un hombre con delantal?',
    hyps: [
      { id: 'brennan', text: 'Brennan lo hizo.',
        for: [C('brennan_zurdo', 'zurdo y con cuchillo'), D('d_brennan', 'coincide con el forense'), C('delantal', 'un delantal de cuero en Hanbury Street')],
        against: [F('br_alibi', 'trabajaba con tres hombres'), F('amelia1', 'el delantal era de John Richardson'), F('c1_done', 'Wren: «No fue él»')],
        rule: (n) => (n.against >= 2 ? 'no demostrada' : n.for >= 2 ? 'plausible' : n.for ? 'sin evaluar' : 'sin evaluar') },
      { id: 'prensa', text: 'La prensa y el barrio ya habían elegido culpable.',
        for: [C('delantal', '«Leather Apron» en los diarios'), F('amelia1', 'la casera lavó ese delantal'), F('br_alibi', 'Brennan tiene testigos')],
        against: [],
        rule: (n) => (n.for >= 2 ? 'plausible' : 'sin evaluar') },
    ],
  },
  {
    id: 'carta',
    q: '¿Quién escribió la carta: Greaves, alguien que imita, o alguien cercano a mí?',
    hyps: [
      { id: 'greaves', text: 'La escribió Greaves.',
        for: [C('letra', 'la J y las t se parecen a su receta'), C('greaves_sabe', 'sabe cosas de mí que no conté')],
        against: [F('hand_inconclusive', 'la muestra no basta para identificar a nadie'), C('expediente', 'su expediente me señala a mí, no a él')],
        rule: (n) => (n.against ? 'no demostrada' : n.for >= 2 ? 'plausible' : n.for ? 'sin evaluar' : 'sin evaluar') },
      { id: 'imitador', text: 'Alguien que se hace pasar por el asesino.',
        for: [C('carta', 'la carta circula en los periódicos'), C('delantal', 'repite lo de «Leather Apron» que ya leía todo el mundo')],
        against: [D('d_rojo', 'la tinta roja y los pliegos de mi mesa')],
        rule: (n) => (n.against ? 'no demostrada' : n.for >= 2 ? 'plausible' : 'sin evaluar') },
      { id: 'cercano', text: 'Alguien que entra en mi cuarto: la carta salió de mi mesa.',
        for: [C('dedos', 'tinta roja y pliegos que faltan'), D('d_rojo', 'la misma madrugada que la carta'), C('llave_pike', 'Pike tiene la otra llave')],
        against: [],
        rule: (n, s) => (s.flags.awake ? 'sostenida' : n.for >= 2 ? 'plausible' : 'sin evaluar') },
    ],
  },
  {
    id: 'horas',
    q: '¿Qué explica las horas que pierdo, y el agua?',
    hyps: [
      { id: 'laudano', text: 'El láudano y el cansancio.',
        for: [C('laudano', 'el frasco, casi vacío'), C('dedos', 'me dormí sobre el escritorio')],
        against: [C('expediente', 'en 1879 no tomaba láudano'), C('respuesta1879', 'una enfermera me oyó contestar')],
        rule: (n) => (n.against ? 'no demostrada' : n.for ? 'plausible' : 'sin evaluar') },
      { id: 'agua', text: 'Algo que vino del agua y me contesta por dentro.',
        for: [C('regla', 'lo que dicen en el río'), C('nat_voz', 'la voz de Nat en la sesión'), C('hospes', 'HOSPES'), C('aqui_estoy', 'la tiza de Goulston Street'), C('respuesta1879', '«Aquí estoy», en 1879')],
        against: [],
        rule: (n, s) => (s.flags.awake ? 'sostenida' : n.for >= 3 ? 'plausible' : 'sin evaluar') },
    ],
  },
];

export function holds(s, e) {
  if (e.kind === 'clue') return s.clues.includes(e.id);
  if (e.kind === 'ded') return s.deductions.includes(e.id);
  return !!s.flags[e.id];
}

// The visible questions, each hypothesis with its status and the evidence that is in.
export function evaluate(s) {
  const out = [];
  for (const t of THEORIES) {
    const hyps = t.hyps.map((h) => {
      const pro = h.for.filter((e) => holds(s, e)), con = h.against.filter((e) => holds(s, e));
      return { id: h.id, text: h.text, status: h.rule({ for: pro.length, against: con.length }, s), for: pro.map((e) => e.note), against: con.map((e) => e.note) };
    });
    if (hyps.some((h) => h.for.length || h.against.length)) out.push({ id: t.id, q: t.q, hyps });
  }
  return out;
}

// statuses only, for the save (state.investigation.hypotheses) and for the story to read later
export function statuses(s) {
  const out = {};
  for (const t of evaluate(s)) for (const h of t.hyps) out[`${t.id}.${h.id}`] = h.status;
  return out;
}
