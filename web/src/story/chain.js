// V5-03 «La cadena del nombre»: the second question of the case. The first asks what Thomas's body did;
// this one asks what the signature on the letter is for. It is a short exercise of provenance, not of
// trivia: what existed first, what is a copy of what, and who knows the man against who knows only the name.
// It rests on nothing supernatural. The letter is not rewritten by anyone, and nobody who reads, hears or
// says the name is changed by it (STORY_BIBLE rules 1 and 4 of V5).
//
// Pure data and pure functions: the notebook page (ui.js) and the script (chapters.js nameChain) read it.
// The flag `v5_name_chain` is the only state: absent while unsolved, 'reasoned' once the player has
// ordered the links. No clue is required to open it: a player who reaches the foreshore from an old save
// gets the same three papers recapped (the recap carries every fact the questions need).

export const CHAIN_FLAG = 'v5_name_chain';

export const CHAIN_LINKS = [
  { id: 'mano', title: 'La mano', clue: 'dedos',
    note: 'Tres pliegos que faltan de mi mesa, tinta roja en los dedos y el reloj en las 3:15 del 25: la noche que perdí.',
    shows: 'Que esa noche tuve papel y tinta roja a mano, y que no la recuerdo.',
    notShows: 'Que la escribí. No tengo el original ni su trazo.' },
  { id: 'firma', title: 'La firma', clue: 'carta',
    note: 'Carta fechada el 25, recibida por la Central News el 27 e impresa el 1 de octubre. Tengo un resumen del periódico y una copia de los inspectores.',
    shows: 'Desde cuándo el seudónimo está en un papel, y cuándo salió a la calle.',
    notShows: 'Quién la escribió.' },
  { id: 'eco', title: 'El eco', clue: 'eco',
    note: 'Tres desconocidos, en la calle, dicen «Jack» sin conocerme.',
    shows: 'Que el nombre circula sin el hombre.',
    notShows: 'Que me hayan visto: repiten lo que han leído.' },
];

// Each question: `ask`, the options, the index of the right one, what a wrong one gets as an answer
// (`miss`, same order, null for the right one) and `help`, said after two misses on the same question.
export const CHAIN_QUESTIONS = [
  { ask: '¿En qué orden pasó todo?',
    options: ['Se escribió el 27, la Central News la recibió el 25 y la calle la repite desde el 1.',
      'Se escribió el 25, la Central News la recibió el 27 y la calle la repite desde el 1.',
      'Se escribió el 25, la calle la repite desde el 27 y la Central News la recibe el 1.'],
    right: 1,
    miss: ['No se recibe lo que todavía no está escrito.', null, 'La calle no pudo repetir el 27 lo que el periódico imprimió el 1.'],
    help: 'Primero la fecha que escribe, después la que recibe, después la que se oye en la calle.' },
  { ask: 'La copia de los inspectores y el recorte del periódico: ¿qué relación tienen?',
    options: ['Son dos confirmaciones: la policía y el periódico la tuvieron por separado.',
      'Salen de la misma carta: la policía la copió y el periódico la imprimió.',
      'La copia sale del recorte, y el recorte de lo que se dice en la calle.'],
    right: 1,
    miss: ['Los dos reciben la misma carta de la Central News. No se confirman: se repiten.', null, 'La calle lo leyó después, el 1 de octubre: no puede ser el origen.'],
    help: 'Un papel que desciende de otro no es una segunda fuente: es el mismo papel visto otra vez.' },
  { ask: '¿De dónde sale lo que dicen los tres de la calle?',
    options: ['Del recorte del periódico: lo leen y lo repiten sin haber visto a nadie.',
      'De alguien que sabe quién la escribió y se lo ha contado a la calle.',
      'De la copia de los inspectores, que alguien ha dejado salir de la comisaría.'],
    right: 0,
    miss: [null, 'Ninguno sabe quién fue: dicen el nombre como quien repite un titular.', 'Nada indica que la copia haya salido de la comisaría. El recorte basta.'],
    help: 'La calle habla de lo que lee, y lo que lee es el recorte.' },
];

// the order the player has just derived, shown once: what each paper comes from, and who ever saw the man
export const PROVENANCE = `<h3>De dónde sale cada papel</h3>
  <p class="hand">La mano (noche del 24 al 25) → la carta, fechada el 25</p>
  <p class="hand">→ Central News, el 27 → <b>copia de la policía</b> y <b>texto impreso</b> (1 de octubre): una sola carta, vista dos veces</p>
  <p class="hand">→ la calle, que lee el recorte: <b>el nombre sin el hombre</b></p>
  <p class="small">Quien escribió no firmó con su nombre.</p>`;

export const chainDone = (s) => s.flags?.[CHAIN_FLAG] === 'reasoned';

// The page's view: each link, whether the notebook holds its clue, and whether the exercise is open.
// Open from the 1st of October once the street was heard, and always once awake (the foreshore).
export function chainView(s) {
  const clues = s.clues || [];
  return {
    open: clues.includes('eco') || !!s.flags?.awake,   // readable from the street on
    canOrder: !!s.flags?.awake,                         // the exercise itself comes after the file: it answers the first question
    done: chainDone(s),
    links: CHAIN_LINKS.map((l) => ({ ...l, held: clues.includes(l.clue) })),
  };
}

// what Thomas concludes, once it is ordered: not a theory of the supernatural, an order of events
export const CHAIN_CONCLUSION = [
  'Primero hubo una mano. Después, una firma. Después, la calle.',
  'La carta no le dio solo un nombre al asesino. Le dio un lugar en la ciudad.',
];
