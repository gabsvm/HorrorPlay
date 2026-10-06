// Items, clues and deductions. Deductions marked `denial` are Thomas refusing the obvious;
// once the flag `awake` is set (chapter 4) the notebook strikes them and writes the truth.

// Inventory icons are drawn at 96x96 and reduced to 48x48 pixel art by the UI.
const TAU = Math.PI * 2;
const icon = (draw) => (ctx) => {
  ctx.clearRect(0, 0, 96, 96);
  ctx.save();
  draw(ctx);
  ctx.restore();
};
const shine = (c, x, y, w, h) => { c.fillStyle = 'rgba(255,250,235,0.55)'; c.fillRect(x, y, w, h); };

export const ITEMS = {
  penique: {
    name: 'Penique',
    icon: icon((c) => {
      c.fillStyle = '#3a200e'; c.beginPath(); c.arc(50, 50, 30, 0, TAU); c.fill();
      const g = c.createRadialGradient(40, 38, 4, 48, 48, 30); g.addColorStop(0, '#e8a868'); g.addColorStop(0.6, '#a8622c'); g.addColorStop(1, '#5a2e12');
      c.fillStyle = g; c.beginPath(); c.arc(48, 48, 28, 0, TAU); c.fill();
      c.strokeStyle = '#6a3a18'; c.lineWidth = 3; c.beginPath(); c.arc(48, 48, 22, 0, TAU); c.stroke();
      // Victoria's worn profile
      c.fillStyle = '#7a4420';
      c.beginPath(); c.ellipse(50, 46, 9, 11, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(58, 44); c.lineTo(63, 49); c.lineTo(57, 51); c.fill();
      c.fillRect(40, 54, 18, 10); c.beginPath(); c.ellipse(44, 40, 6, 8, -0.4, 0, TAU); c.fill();
      shine(c, 32, 34, 8, 4);
    }),
    examine: async (G) => G.think('Un penique con la cara de la reina gastada de tanto pasar de mano en mano.'),
  },
  bisturi: {
    name: 'Bisturí',
    icon: icon((c) => {
      c.translate(48, 50); c.rotate(-0.72);
      c.fillStyle = '#120d0a'; c.fillRect(-40, -7, 46, 14);
      c.fillStyle = '#2a1e16'; c.fillRect(-38, -5, 42, 4);
      c.fillStyle = '#b8a060'; c.fillRect(4, -6, 7, 12);
      c.fillStyle = '#8a9498'; c.beginPath(); c.moveTo(11, -5); c.lineTo(38, -2); c.quadraticCurveTo(44, 2, 34, 5); c.lineTo(11, 5); c.closePath(); c.fill();
      c.fillStyle = '#dfe6e8'; c.beginPath(); c.moveTo(11, -5); c.lineTo(38, -2); c.lineTo(11, -1); c.closePath(); c.fill();
      c.fillStyle = 'rgba(120,20,16,0.7)'; c.fillRect(24, 1, 8, 3);
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
      c.translate(48, 48); c.rotate(-0.15);
      c.fillStyle = '#3a2618'; c.fillRect(-32, -14, 64, 16);
      c.fillStyle = '#8a6a48'; c.fillRect(-30, -12, 60, 12);
      shine(c, -26, -11, 40, 2);
      c.fillStyle = '#7a5c3c';
      for (let i = 0; i < 14; i++) { if (i === 4 || i === 9) { c.fillRect(-29 + i * 4.3, 0, 3, 6); continue; } c.fillRect(-29 + i * 4.3, 0, 3, 20); }
    }),
    examine: async (G) => {
      await G.think('Un peine de bolsillo con dos púas rotas. Estaba en el patio, colocado junto a sus otras cosas.');
      await G.think('Tendría que haberlo dejado con las pruebas, pero me lo guardé sin pensarlo.');
    },
  },
  tinta: {
    name: 'Tinta roja',
    icon: icon((c) => {
      c.fillStyle = '#0e1214'; c.fillRect(26, 34, 44, 44); c.fillRect(36, 22, 24, 14);
      c.fillStyle = '#20282c'; c.fillRect(28, 36, 40, 40); c.fillRect(38, 24, 20, 12);
      c.fillStyle = '#8e1b16'; c.fillRect(30, 52, 36, 22);
      c.fillStyle = '#c9bc98'; c.fillRect(34, 42, 28, 10); c.fillStyle = '#5a1a14'; c.fillRect(38, 45, 20, 2); c.fillRect(38, 48, 14, 2);
      shine(c, 31, 38, 4, 34);
      c.fillStyle = '#8e1b16'; c.fillRect(58, 76, 10, 6);
    }),
    examine: async (G) => {
      if (G.flag('tinta_vacia')) await G.think('Casi vacío. Lo compré hace una semana.');
      else await G.think('Tinta roja, para corregir los informes de los sargentos.');
    },
  },
  placa: {
    name: 'Placa de inspector',
    icon: icon((c) => {
      c.fillStyle = '#140e0a'; c.fillRect(16, 22, 64, 52);
      c.fillStyle = '#2e2018'; c.fillRect(18, 24, 60, 48);
      c.strokeStyle = '#5a4430'; c.lineWidth = 2; c.strokeRect(22, 28, 52, 40);
      // the crowned star of the Metropolitan Police
      c.fillStyle = '#c9a24a';
      c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, r = i % 2 ? 9 : 15; c.lineTo(48 + Math.cos(a) * r, 50 + Math.sin(a) * r); } c.closePath(); c.fill();
      c.fillRect(42, 30, 12, 5); c.fillRect(44, 27, 2, 3); c.fillRect(48, 26, 2, 4); c.fillRect(52, 27, 2, 3);
      c.fillStyle = '#2e2018'; c.beginPath(); c.arc(48, 50, 6, 0, TAU); c.fill();
      c.fillStyle = '#c9a24a'; c.font = 'bold 9px Georgia'; c.textAlign = 'center'; c.fillText('H', 48, 53);
      shine(c, 40, 40, 5, 2);
    }),
    examine: async (G) => G.think('Policía Metropolitana, División H. Inspector T. Ashgrove. La foto está tan borrosa que podría ser cualquiera.'),
  },
  llave: {
    name: 'Llave de latón',
    icon: icon((c) => {
      c.translate(48, 48); c.rotate(-0.4);
      c.strokeStyle = '#5a4018'; c.lineWidth = 9; c.beginPath(); c.arc(-20, 0, 13, 0, TAU); c.stroke();
      c.strokeStyle = '#c9a24a'; c.lineWidth = 6; c.beginPath(); c.arc(-20, 0, 13, 0, TAU); c.stroke();
      c.fillStyle = '#5a4018'; c.fillRect(-8, -4, 44, 9);
      c.fillStyle = '#c9a24a'; c.fillRect(-8, -3, 44, 6); c.fillRect(24, 3, 6, 12); c.fillRect(32, 3, 5, 8);
      shine(c, -4, -3, 26, 2);
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
