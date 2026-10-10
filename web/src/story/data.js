// Items, clues and deductions. Deductions marked `denial` are Thomas refusing the obvious;
// once the flag `awake` is set (chapter 4) the notebook strikes them and writes the truth.
// Two readings: the first time through, Thomas reads every clue against himself as a frame (someone
// comes in by his window, uses his boots and his ink); in the second reading (flag `second`, after
// finishing) a clue may read as it really was (text2) and carries a note in the other hand (truth2).

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
    examine: async (G) => G.think('Policía Metropolitana, División H. Inspector T. Ashgrove. Mis iniciales están casi borradas por el roce.'),
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
  botas: { tag: 'Mi cuarto · 31 ago', text: 'Me desperté con las botas empapadas y cubiertas de barro negro. Anoche las dejé secas junto a la puerta.',
    text2: 'Me desperté con las botas empapadas y cubiertas de barro negro. No recuerdo haber salido.', truth2: 'Salí con ellas. Fui hasta Buck\'s Row y volví.' },
  ventana: { tag: 'Mi cuarto · 31 ago', text: 'La ventana estaba entornada y había barro negro en el alféizar. Anoche la cerré yo.',
    truth2: 'La abrí yo, desde dentro. Por la escalera me habría oído la señora Pell.' },
  laudano: { tag: 'Mi cuarto · 31 ago', text: 'El frasco de láudano está casi vacío. Lo compré el martes.', truth2: 'Lo bebo para no oír el agua. Ya no sirve.' },
  ronda: { tag: "Buck's Row · la hoja de rondas", text: 'Según la hoja, Thain alumbró la calle hacia las 3:30 y Cross llegó hacia las 3:40. Son horas de testimonio, no de reloj: la ventana es aproximada.',
    truth2: 'La hoja de rondas la firmé yo.' },
  silencio: { tag: "Buck's Row", text: 'Nadie oyó nada. La señora Green dormía a tres metros, detrás de esa ventana.', truth2: 'No gritó. Un policía no da miedo.' },
  zurdo: { tag: "Buck's Row · Dr. Llewellyn", text: 'Según el forense, los cortes van de izquierda a derecha y podrían ser obra de un zurdo.', truth2: 'Escribo con la izquierda.' },
  anatomia: { tag: "Buck's Row · Dr. Llewellyn", text: 'El forense cree que el asesino tenía alguna noción, tosca, de anatomía.', truth2: 'Cuatro años en la sala de disección.' },
  huellas: { tag: "Buck's Row", text: 'Huellas de barro negro, barro de río, que se alejan hacia Winthrop Street.', truth2: 'Del Ditch a Buck\'s Row, y de Buck\'s Row a mi puerta.' },
  brennan_zurdo: { tag: 'Desolladero de Barber', text: 'Silas Brennan afila el cuchillo con la mano izquierda. Lleva delantal de cuero.', truth2: 'Era zurdo, como yo. Me bastó.' },
  bisturi: { tag: 'Wren', text: 'Wren encontró un bisturí en la alcantarilla de Buck\'s Row. Lleva el sello del London Hospital.', truth2: 'Es el que falta en mi estuche.' },
  cuello: { tag: "Buck's Row · el cuerpo", text: 'Dos cortes en el cuello, de un lado a otro, hasta el hueso. No tiene heridas en las manos: no se defendió.', truth2: 'Como nos enseñaron en la sala de disección.' },
  regla: { tag: 'Wren', text: '"Si el agua dice su nombre, no responda." Es lo que dicen los ribereños del Támesis.', truth2: 'Si callé en 1866, respondí en 1879. La regla no falló.' },

  // Chapter 2
  delantal: { tag: '29 Hanbury St. · 8 sep', text: 'Un delantal de cuero mojado junto al grifo del patio. Los periódicos ya hablan de "Leather Apron".', truth2: 'Era del hijo de la casera. Lo supe y me callé.' },
  ordenados: { tag: '29 Hanbury St.', text: 'Sus pocas pertenencias estaban colocadas en fila a sus pies, con cuidado, como el instrumental en una mesa de disección.', truth2: 'Como en la mesa 3, en 1879.' },
  greaves_sabe: { tag: 'Dr. Greaves', text: 'Greaves sabía que duermo mal y que he vuelto al láudano. Nunca se lo he contado a nadie.', truth2: 'Lo sabe porque me trató.' },
  anillos: { tag: '29 Hanbury St. · el cuerpo', text: 'Había señales de que llevaba otros dos anillos de latón junto al que conserva. Las marcas siguen ahí. No estaban entre sus cosas.', truth2: 'Nunca aparecieron.' },
  falta: { tag: '29 Hanbury St. · el cuerpo', text: 'Le abrieron el vientre y se llevaron algo de dentro, con cortes limpios, de quien sabe lo que busca.', truth2: 'Sabía dónde buscar.' },
  reflejo: { tag: '29 Hanbury St.', text: 'En el cristal de la ventana vi a alguien detrás de mí. Cuando me giré no había nadie.', truth2: 'Era yo. El del cristal no se giró conmigo.' },
  alguien_detras: { tag: 'Madame Wexley', text: '"Hay alguien detrás de usted, inspector. Siempre ha estado ahí."', truth2: 'Dentro. No detrás.' },
  nat_voz: { tag: 'Sesión de espiritismo', text: (st) => (st.flags.answered1866 ? 'La voz habló como Nat. Sabía lo del foreshore. Sabía lo que contesté.' : 'La voz habló como Nat y sabía lo del foreshore. Dijo que yo había contestado. No contesté.'),
    text2: 'La voz habló como Nat. Sabía lo del foreshore. Sabía lo que contesté.', truth2: 'La voz conocía mi respuesta. Si no fue en 1866, fue en 1879.' },
  hospes: { tag: 'Sesión de espiritismo', text: 'En la oscuridad, la mesa golpeó una palabra latina: HOSPES. El que recibe y el que es recibido; el anfitrión y el huésped.',
    truth2: 'Me lo decía a mí. Yo soy la casa.' },

  // Chapter 3
  dedos: { tag: 'Mi cuarto · 25 sep', text: 'Me desperté sobre el escritorio a las 3:15. El tintero rojo estaba volcado, la ventana abierta y faltaban tres pliegos de papel de cartas.',
    text2: 'Me desperté sobre el escritorio a las 3:15, con los dedos de la mano izquierda manchados de rojo. El tintero de tinta roja estaba casi vacío.', truth2: 'La ventana la abrí yo, al volver.' },
  llave_pike: { tag: 'Mi cuarto · 25 sep', text: 'La puerta estaba cerrada con llave. Solo hay otra llave de este cuarto: la que guarda Pike, por si me necesitan de noche.', truth2: 'Pike nunca la usó.' },
  rapido: { tag: 'Mitre Square · 30 sep', text: 'El agente de la City me preguntó cómo había llegado tan rápido. Él la había encontrado hacía cuatro minutos.', truth2: 'Llegué antes porque no me había ido.' },
  trozo: { tag: 'Mitre Square', text: 'Falta un trozo del delantal de Catherine Eddowes, cortado a cuchillo.', truth2: 'Lo corté para limpiarme las manos.' },
  marcas: { tag: 'Mitre Square · el cuerpo', text: 'Cortes en los párpados y una V en cada mejilla. No sirven para matar. Son una firma.', truth2: 'Las hice despacio.' },
  guantes: { tag: 'Mitre Square', text: 'Le busqué el pulso. Al levantarme, mis guantes estaban pegajosos de su sangre.',
    text2: 'Al levantarme del cuerpo, mis guantes estaban pegajosos. Y la sangre del dorso ya estaba seca.', truth2: 'Cuando Watkins la encontró, la sangre de mis guantes ya se había secado.' },
  aqui_estoy: { tag: 'Goulston St.', text: (st) => (st.flags.answered1866 ? 'Junto al trozo de delantal, alguien escribió con tiza: HERE I AM. Aquí estoy. Es lo que contesté al agua.' : 'Junto al trozo de delantal, alguien escribió con tiza: HERE I AM. Aquí estoy. Lo que el agua quería oírme decir.'),
    text2: 'Junto al trozo de delantal, alguien escribió con tiza: HERE I AM. Es lo que yo contesté al agua.', truth2: 'Con mi letra inclinada.' },
  testigo: { tag: 'Mitre Square', text: 'Un testigo vio a un hombre con abrigo oscuro y bombín que llevaba una linterna "como las de la policía".', truth2: 'Como yo.' },
  carta: { tag: 'Prensa · 1 oct', text: 'Una carta fechada el 25 y recibida por la Central News el 27 circula bajo la firma «Jack the Ripper». Está escrita con tinta roja.', truth2: 'La escribí durante las horas perdidas de la noche del 24 al 25.' },
  letra: { tag: 'La carta', text: 'El remate de la J y la unión de las t recuerdan a la receta de Greaves. La semejanza no prueba autoría.',
    truth2: 'Mis apuntes de anatomía tienen los mismos gestos: Greaves me enseñó a escribir así.' },
  estuche: { tag: 'Mi cuarto · 1 oct', text: 'Mi viejo estuche de disección, debajo de la cama. Falta un bisturí.', truth2: 'No me lo robaron.' },

  // Chapter 4
  expediente: { tag: 'Dr. Greaves', text: 'Expediente «T. A.», 1879: episodios de amnesia. Lo hallaron en la sala de disección con un bisturí; una enfermera oyó «Aquí estoy» junto al lavadero. Una nota posterior de 1888 compara el cuadro con la fuga disociativa.' },
  respuesta1879: { tag: 'Expediente · 1879', text: 'La enfermera Bell oyó «Aquí estoy» durante la laguna de 1879, junto al lavadero.', truth2: 'Si callé en 1866, aquella noche no callé.' },
  ficha: { tag: 'Yo', text: 'Thomas Ashgrove. 34 años. Zurdo. Cuatro años de medicina en el London Hospital. Inspector de la División H. Vive junto al Black Ditch.' },
};

// a + b -> deduction. `profile` adds a trait to the killer profile.
export const DEDUCTIONS = [
  { id: 'd_ronda', a: 'ronda', b: 'silencio', profile: 'Conoce las rondas de la policía', text: 'Las horas declaradas dejan un hueco de unos diez minutos. Tal vez conocía las rondas; la precisión también admite el azar.' },
  { id: 'd_zurdo', a: 'zurdo', b: 'anatomia', profile: 'Quizá zurdo, quizá con nociones de anatomía', text: 'Si el forense acierta, un zurdo que sabe dónde cortar: un matarife, un carnicero... o un médico. Técnica no es lo mismo que estudios.' },
  { id: 'd_barro', kind: 'hipotesis', a: 'botas', b: 'ventana', denial: true, text: 'Las botas estaban mojadas y la ventana abierta. ¿Alguien pasó por aquí durante la noche? ¿Cómo se explica el barro?', truth: 'Nadie entra. Salgo yo.' },
  { id: 'd_brennan', kind: 'hipotesis', a: 'brennan_zurdo', b: 'zurdo', flag: 'sospecha_brennan', text: 'Brennan coincide con la lateralidad atribuida al asesino y trabaja cerca. Su coartada requiere verificación. No es prueba de culpabilidad.' , truth: 'Brennan es zurdo. Yo también.' , denialLate: true },
  { id: 'd_bisturi', a: 'bisturi', b: 'anatomia', profile: 'Formación médica (London Hospital)', text: 'Un bisturí de la sala de disección del London Hospital. Quien lo perdió estudió allí.' },
  { id: 'd_delantal', kind: 'hipotesis', a: 'delantal', b: 'brennan_zurdo', flag: 'acusar_brennan', text: 'El delantal del patio se parece al de Brennan, pero la casera declaró que pertenece a su hijo. Aún no hay vínculo con Brennan.', truth: 'El delantal era del hijo de la casera; ella misma lo había lavado. Brennan no tenía nada que ver, y yo lo sabía.', denialLate: true },
  { id: 'd_ordenados', a: 'ordenados', b: 'anatomia', profile: 'Metódico: trata a la víctima como a un paciente', text: 'No es furia, es método. La trata como a un paciente en la mesa de disección.' },
  { id: 'd_greaves', kind: 'hipotesis', a: 'greaves_sabe', b: 'alguien_detras', flag: 'sospecha_greaves', text: 'Greaves sabe de mi pasado y Wexley habló con la voz de Nat. ¿Hubo intercambio de información o una causa que no comprendo?', truth: 'Nadie le habló de Nat a Wexley. La voz se lo dijo.', denialLate: true },
  { id: 'd_nat', a: 'nat_voz', b: 'regla', profile: 'Ronda el río', text: 'La voz del agua dice nombres en la orilla del Ditch. Quien la oye y contesta, cambia.' },
  { id: 'd_hospes', a: 'hospes', b: 'regla', text: 'El agua llama, alguien contesta, y desde entonces hay un anfitrión y un huésped. Wexley no hablaba de espíritus: hablaba del Ditch.' },
  { id: 'd_rojo', kind: 'inferencia', a: 'dedos', b: 'carta', denial: true, text: 'La carta fechada el 25 está escrita en rojo. La misma madrugada faltaron hojas de mi escritorio. Es posible que se escribiera aquí.', truth: 'Escribí esa carta. Le di un nombre.' },
  { id: 'd_pike', kind: 'hipotesis', a: 'llave_pike', b: 'testigo', flag: 'sospecha_pike', denialLate: true, text: 'Pike tiene una llave, viste como el testigo describe y registra mis horarios. También podría estar investigándome. ¿Qué explicación encaja con los hechos?', truth: 'Pike apuntaba dónde estaba yo porque tenía miedo de saberlo.' },
  { id: 'd_letra', kind: 'hipotesis', a: 'letra', b: 'greaves_sabe', flag: 'sospecha_greaves', denialLate: true, text: 'La letra recuerda la de Greaves y él conoce mi historial. Tengo motivos para preguntarle por el pasado, no pruebas de que redactara la carta.', truth: 'Escribo como él porque me enseñó él.' },
  { id: 'd_rapido', a: 'rapido', b: 'ronda', profile: 'Llega a las escenas antes que la policía', text: 'Siempre está cerca. Llega antes que nadie.' },
  { id: 'd_testigo', a: 'testigo', b: 'trozo', profile: 'Abrigo oscuro, bombín, linterna de policía', text: 'El testigo describe un abrigo oscuro, un bombín y una linterna similar a la policial. El trozo del delantal fue hallado después; no sabemos quién lo dejó.' },
  { id: 'd_estuche', kind: 'hipotesis', a: 'estuche', b: 'bisturi', denial: true, text: 'Un bisturí idéntico al del estuche faltante apareció junto a Buck\'s Row. No sé quién lo sacó de mi cuarto.', truth: 'No me lo robaron. Wren lo sacó de la alcantarilla de Buck\'s Row.' },
  { id: 'd_aqui', a: 'aqui_estoy', b: 'nat_voz', profile: 'Le respondió al agua', text: '«Here I am». La inscripción repite la frase de la voz. Es un vínculo sugestivo, no una identificación de la persona que escribió la tiza.' },
  { id: 'd_confianza', a: 'cuello', b: 'silencio', profile: 'Ella no le tuvo miedo', text: 'No hubo gritos ni arañazos defensivos según los testigos y el examen. Puede que el atacante se acercara sin despertar alarma; un uniforme explicaría esa confianza, pero no la prueba.', truth: 'No me tuvo miedo. Le enseñé la placa.', denialLate: true },
  { id: 'd_trofeo', a: 'anillos', b: 'falta', profile: 'Se lleva recuerdos', text: 'Los anillos, y lo que le sacó del vientre. Se lleva algo de cada una.' },
  { id: 'd_firma', a: 'marcas', b: 'ordenados', profile: 'Firma su trabajo', text: 'Las cosas en fila, las marcas en la cara: quiere que se sepa que es el mismo, y que lo hace con calma.' },
  { id: 'd_guantes', kind: 'inferencia', a: 'guantes', b: 'rapido', denial: true, text: 'Los guantes se mancharon al tocar el cuerpo; el origen y la antigüedad de la sangre necesitan comprobarse.', truth: 'La sangre de mis guantes ya estaba seca cuando Watkins la encontró.' },
  // final: the profile meets the man
  { id: 'f_zurdo', a: 'ficha', b: 'zurdo', flag: 'f1', text: 'El forense creyó ver a un zurdo. Yo escribo con la izquierda.', final: true },
  { id: 'f_anat', a: 'ficha', b: 'bisturi', flag: 'f2', text: 'El bisturí del London Hospital es mío.', final: true },
  { id: 'f_testigo', a: 'ficha', b: 'testigo', flag: 'f3', text: 'Abrigo oscuro, bombín y linterna de policía. Ese soy yo.', final: true },
  { id: 'f_ronda', a: 'ficha', b: 'ronda', flag: 'f4', text: 'Conozco las rondas porque las firmo yo.', final: true },
  { id: 'f_exp', a: 'ficha', b: 'expediente', flag: 'f5', text: 'T. A. Thomas Ashgrove.', final: true },
  { id: 'f_barro', a: 'ficha', b: 'huellas', flag: 'f6', text: 'El barro, mi residencia y las huellas son compatibles; no hay un seguimiento continuo demostrado hasta mi puerta.', final: true },
];
