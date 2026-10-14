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
    shows: 'Que pude escribirla yo, y que el papel y la tinta eran míos.',
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
  { ask: '¿Qué pasó primero?',
    options: ['La calle dijo «Jack» desde el 25 y después alguien escribió la carta.',
      'Se escribió el 25, la Central News la recibió el 27 y la calle la repite desde el 1.',
      'La Central News la recibió el 27 y entonces alguien la escribió.'],
    right: 1,
    miss: ['La carta está fechada el 25. La calle lo dice desde el 1 de octubre.', null, 'No se recibe lo que no está escrito. La fecha es del 25.'],
    help: 'Tres fechas: el 25, el 27 y el 1 de octubre. Primero la que escribe, después la que recibe, después la que se oye.' },
  { ask: 'La copia de los inspectores y el recorte del periódico: ¿son dos fuentes distintas sobre quién la escribió?',
    options: ['Sí: cada uno confirma al otro.',
      'Sí: el periódico la imprimió sin que la policía se lo pidiera.',
      'No: son la misma carta copiada, y ninguna dice quién la escribió.'],
    right: 2,
    miss: ['Los dos descienden de la misma carta. No se confirman: se repiten.', 'Que otro la imprima no la convierte en otra carta.', null],
    help: 'Una copia y un resumen de la misma carta cuentan una sola vez.' },
  { ask: 'Los tres de la calle dicen «Jack». ¿Qué prueba eso?',
    options: ['Que el nombre circula sin el hombre: nadie necesita haberlo visto.',
      'Que me conocen y están a punto de delatarme a la policía.',
      'Que alguien más tiene que haber escrito la carta de verdad.'],
    right: 0,
    miss: [null, 'Ninguno me ha mirado siquiera.', 'La calle repite lo que lee: no prueba quién escribió.'],
    help: 'Ninguno me conoce. Lo que repiten es el nombre, no al hombre.' },
];

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
  'Primero hubo una mano. Después, una firma. Ahora nadie necesita haberlo visto para hablar de él.',
  'La carta no le dio solo un nombre al asesino. Le dio un lugar en la ciudad.',
];
