// Items, clues and deductions. Deductions marked `denial` are Thomas refusing the obvious;
// once the flag `awake` is set (chapter 4) the notebook strikes them and writes the truth.

const icon = (draw) => (ctx) => {
  ctx.clearRect(0, 0, 96, 96);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 6;
  draw(ctx);
  ctx.restore();
};

export const ITEMS = {
  penique: {
    name: 'Penique',
    icon: icon((c) => {
      const g = c.createRadialGradient(42, 40, 4, 48, 48, 26); g.addColorStop(0, '#d79a5a'); g.addColorStop(1, '#6a3a1c');
      c.fillStyle = g; c.beginPath(); c.arc(48, 48, 24, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#3a200e'; c.lineWidth = 2; c.beginPath(); c.arc(48, 48, 19, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#3a200e'; c.font = 'italic 14px Georgia'; c.textAlign = 'center'; c.fillText('1d', 48, 53);
    }),
    examine: async (G) => G.think('Un penique con la cara de la reina gastada de tanto pasar de mano en mano.'),
  },
  bisturi: {
    name: 'Bisturí',
    icon: icon((c) => {
      c.translate(48, 48); c.rotate(-0.7);
      c.fillStyle = '#6b5a44'; c.fillRect(-34, -4, 40, 8);
      c.fillStyle = '#c9d0d2'; c.beginPath(); c.moveTo(6, -4); c.lineTo(34, -1); c.lineTo(8, 5); c.closePath(); c.fill();
    }),
    examine: async (G) => {
      await G.think('Acero de Weiss, mango de ébano. Grabado en la virola: LONDON HOSPITAL — SALA DE DISECCIÓN.');
      if (G.flag('awake')) await G.think('Mis iniciales están raspadas, pero sigue notándose la T.');
      else await G.think('Hay un rasguño en el mango, como si alguien hubiera borrado unas iniciales.');
    },
  },
  peine: {
    name: 'Peine de Annie',
    icon: icon((c) => {
      c.fillStyle = '#7a6046'; c.fillRect(18, 34, 60, 12);
      for (let i = 0; i < 14; i++) c.fillRect(20 + i * 4.2, 46, 2.4, 18);
    }),
    examine: async (G) => {
      await G.think('Un peine de bolsillo con dos púas rotas. Estaba en el patio, colocado junto a sus otras cosas.');
      await G.think('Tendría que haberlo dejado con las pruebas, pero me lo guardé sin pensarlo.');
    },
  },
  tinta: {
    name: 'Tinta roja',
    icon: icon((c) => {
      c.fillStyle = '#20262a'; c.fillRect(30, 30, 36, 40); c.fillRect(38, 22, 20, 10);
      c.fillStyle = '#8e1b16'; c.fillRect(32, 48, 32, 20);
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(34, 32, 4, 34);
    }),
    examine: async (G) => {
      if (G.flag('tinta_vacia')) await G.think('Casi vacío. Lo compré hace una semana.');
      else await G.think('Tinta roja, para corregir los informes de los sargentos.');
    },
  },
  placa: {
    name: 'Placa de inspector',
    icon: icon((c) => {
      c.fillStyle = '#2a2018'; c.fillRect(20, 26, 56, 44);
      c.fillStyle = '#b08a4e'; c.beginPath(); c.arc(48, 46, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2a2018'; c.font = 'bold 10px Georgia'; c.textAlign = 'center'; c.fillText('H', 48, 50);
    }),
    examine: async (G) => G.think('Policía Metropolitana, División H. Inspector T. Ashgrove. La foto está tan borrosa que podría ser cualquiera.'),
  },
  llave: {
    name: 'Llave de latón',
    icon: icon((c) => {
      c.strokeStyle = '#b08a4e'; c.lineWidth = 6; c.beginPath(); c.arc(30, 48, 12, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#b08a4e'; c.fillRect(40, 45, 38, 6); c.fillRect(66, 51, 5, 10); c.fillRect(74, 51, 4, 7);
    }),
    examine: async (G) => G.think('Una llave pequeña de latón. Estaba en el cajón de Greaves.'),
  },
};

export const CLUES = {
  // Chapter 1
  botas: { tag: 'Mi cuarto · 31 ago', text: 'Me desperté con las botas empapadas y cubiertas de barro negro. No recuerdo haber salido.' },
  laudano: { tag: 'Mi cuarto · 31 ago', text: 'El frasco de láudano está casi vacío. Lo compré el martes.' },
  ronda: { tag: "Buck's Row", text: 'PC Neil pasó por aquí a las 3:15 y no vio a nadie. A las 3:45 la encontró. El asesino actuó entre dos rondas.' },
  silencio: { tag: "Buck's Row", text: 'Nadie oyó nada. La señora Green dormía a tres metros, detrás de esa ventana.' },
  zurdo: { tag: "Buck's Row · Dr. Llewellyn", text: 'Según el forense, los cortes van de izquierda a derecha: quien lo hizo es probablemente zurdo.' },
  anatomia: { tag: "Buck's Row · Dr. Llewellyn", text: 'El forense dice que el asesino tenía "cierta noción de anatomía".' },
  huellas: { tag: "Buck's Row", text: 'Huellas de barro negro, barro de río, que se alejan hacia Winthrop Street.' },
  brennan_zurdo: { tag: 'Desolladero de Barber', text: 'Silas Brennan afila el cuchillo con la mano izquierda. Lleva delantal de cuero.' },
  bisturi: { tag: 'Wren', text: 'Wren encontró un bisturí en la alcantarilla de Buck\'s Row. Lleva el sello del London Hospital.' },
  regla: { tag: 'Wren', text: '"Si el agua dice su nombre, no responda." Es lo que dicen los ribereños del Támesis.' },

  // Chapter 2
  delantal: { tag: '29 Hanbury St. · 8 sep', text: 'Un delantal de cuero mojado junto al grifo del patio. Los periódicos ya hablan de "Leather Apron".' },
  ordenados: { tag: '29 Hanbury St.', text: 'Sus pocas pertenencias estaban colocadas en fila a sus pies, con cuidado, como el instrumental en una mesa de disección.' },
  greaves_sabe: { tag: 'Dr. Greaves', text: 'Greaves sabía que duermo mal y que he vuelto al láudano. Nunca se lo he contado a nadie.' },
  reflejo: { tag: '29 Hanbury St.', text: 'En el cristal de la ventana vi a alguien detrás de mí. Cuando me giré no había nadie.' },
  alguien_detras: { tag: 'Madame Wexley', text: '"Hay alguien detrás de usted, inspector. Siempre ha estado ahí."' },
  nat_voz: { tag: 'Sesión de espiritismo', text: 'La voz habló como Nat. Sabía lo del foreshore. Sabía lo que contesté.' },

  // Chapter 3
  dedos: { tag: 'Mi cuarto · 27 sep', text: 'Me desperté sobre el escritorio a las 3:15, con los dedos manchados de rojo. El tintero de tinta roja estaba casi vacío.' },
  rapido: { tag: 'Mitre Square · 30 sep', text: 'El agente de la City me preguntó cómo había llegado tan rápido. Él la había encontrado hacía cuatro minutos.' },
  trozo: { tag: 'Mitre Square', text: 'Falta un trozo del delantal de Catherine Eddowes, cortado a cuchillo.' },
  aqui_estoy: { tag: 'Goulston St.', text: 'Junto al trozo de delantal, alguien escribió con tiza: HERE I AM. Es lo que yo contesté al agua.' },
  testigo: { tag: 'Goulston St.', text: 'Un testigo vio a un hombre con abrigo oscuro y bombín que llevaba una linterna "como las de la policía".' },
  carta: { tag: 'Prensa · 1 oct', text: 'La Central News publica una carta escrita con tinta roja y firmada: Jack the Ripper.' },
  estuche: { tag: 'Mi cuarto · 1 oct', text: 'Mi viejo estuche de disección, debajo de la cama. Falta un bisturí.' },

  // Chapter 4
  expediente: { tag: 'Dr. Greaves', text: 'Expediente "T. A.", 1879: fuga disociativa. El paciente despertó en la sala de disección con un bisturí en la mano izquierda.' },
  ficha: { tag: 'Yo', text: 'Thomas Ashgrove. 34 años. Zurdo. Cuatro años de medicina en el London Hospital. Inspector de la División H. Vive junto al Black Ditch.' },
};

// a + b -> deduction. `profile` adds a trait to the killer profile.
export const DEDUCTIONS = [
  { id: 'd_ronda', a: 'ronda', b: 'silencio', profile: 'Conoce las rondas de la policía', text: 'Actúa en el hueco entre dos rondas, sin hacer ruido. Sabe exactamente por dónde y cuándo pasan los agentes.' },
  { id: 'd_zurdo', a: 'zurdo', b: 'anatomia', profile: 'Zurdo, con nociones de anatomía', text: 'Un zurdo que sabe dónde cortar: un matarife, un carnicero... o un médico.' },
  { id: 'd_barro', a: 'botas', b: 'huellas', denial: true, text: 'Barro negro en las huellas y en mis botas. Todo Whitechapel está cubierto de ese barro.', truth: 'Las huellas son mías. Las seguí hasta mi propia puerta.' },
  { id: 'd_brennan', a: 'brennan_zurdo', b: 'zurdo', flag: 'sospecha_brennan', text: 'Brennan es zurdo, sabe usar el cuchillo y trabajaba a cien yardas. Es el primer sospechoso.' , truth: 'Brennan es zurdo. Yo también.' , denialLate: true },
  { id: 'd_bisturi', a: 'bisturi', b: 'anatomia', profile: 'Formación médica (London Hospital)', text: 'Un bisturí de la sala de disección del London Hospital. Quien lo perdió estudió allí.' },
  { id: 'd_delantal', a: 'delantal', b: 'brennan_zurdo', flag: 'acusar_brennan', text: 'Un delantal de cuero en Hanbury Street. Brennan lleva uno igual. "Leather Apron."', truth: 'El delantal era del hijo de la casera; ella misma lo había lavado. Brennan no tenía nada que ver, y yo lo sabía.', denialLate: true },
  { id: 'd_ordenados', a: 'ordenados', b: 'anatomia', profile: 'Metódico: trata a la víctima como a un paciente', text: 'No es furia, es método. La trata como a un paciente en la mesa de disección.' },
  { id: 'd_greaves', a: 'greaves_sabe', b: 'alguien_detras', flag: 'sospecha_greaves', text: 'Greaves y Wexley se conocen. Alguien le habló de Nat a esa mujer, y solo pudo ser Greaves.', truth: 'Nadie le habló de Nat a Wexley. La voz se lo dijo.', denialLate: true },
  { id: 'd_nat', a: 'nat_voz', b: 'regla', profile: 'Ronda el río', text: 'La voz del agua dijo mi nombre, igual que en 1866. Y yo contesté.' },
  { id: 'd_rojo', a: 'dedos', b: 'carta', denial: true, text: 'Tinta roja en mis dedos, tinta roja en la carta. Medio Londres corrige con tinta roja.', truth: 'Escribí esa carta. Le di un nombre.' },
  { id: 'd_rapido', a: 'rapido', b: 'ronda', profile: 'Llega a las escenas antes que la policía', text: 'Siempre está cerca. Llega antes que nadie.' },
  { id: 'd_testigo', a: 'testigo', b: 'trozo', profile: 'Abrigo oscuro, bombín, linterna de policía', text: 'Abrigo oscuro, bombín, una linterna de policía. Corta el delantal para limpiarse y lo deja a la vista.' },
  { id: 'd_estuche', a: 'estuche', b: 'bisturi', denial: true, text: 'Falta un bisturí de mi estuche. Lo perdí hace años, en la facultad.', truth: 'No lo perdí. Wren lo sacó de la alcantarilla de Buck\'s Row.' },
  { id: 'd_aqui', a: 'aqui_estoy', b: 'nat_voz', profile: 'Le respondió al agua', text: '"Here I am." Aquí estoy. Él también le contestó al agua.' },
  // final: the profile meets the man
  { id: 'f_zurdo', a: 'ficha', b: 'zurdo', flag: 'f1', text: 'Zurdo.', final: true },
  { id: 'f_anat', a: 'ficha', b: 'bisturi', flag: 'f2', text: 'El bisturí del London Hospital es mío.', final: true },
  { id: 'f_testigo', a: 'ficha', b: 'testigo', flag: 'f3', text: 'Abrigo oscuro, bombín y linterna de policía. Ese soy yo.', final: true },
  { id: 'f_ronda', a: 'ficha', b: 'ronda', flag: 'f4', text: 'Conozco las rondas porque las organizo yo.', final: true },
  { id: 'f_exp', a: 'ficha', b: 'expediente', flag: 'f5', text: 'T. A. Thomas Ashgrove.', final: true },
  { id: 'f_barro', a: 'ficha', b: 'huellas', flag: 'f6', text: 'Las huellas van del Ditch a Buck\'s Row, y de Buck\'s Row a mi puerta.', final: true },
];
