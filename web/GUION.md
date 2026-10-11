# El Huésped — guion completo

_Generado desde el código del juego (2026-10-11) con `node web/tools/script/export.mjs`. Es todo lo que el jugador puede leer: diálogos, pensamientos de Thomas, elecciones, documentos, objetivos y el cuaderno._

## Cómo está hecho el juego (para reescribirlo)

- **Género:** aventura de apuntar y hacer clic, de terror y misterio, en 2D con escenarios pintados en pixel art. Whitechapel, otoño de 1888. Unos 30–45 minutos.
- **Cómo se juega:** Thomas camina por cada escena. Las cosas con las que se puede interactuar (abajo, en cada escena, con su nombre en pantalla y su `id` interno) responden a un clic: casi siempre con un pensamiento de Thomas o una conversación. Se pueden usar objetos del inventario sobre ellas.
- **El cuaderno (tecla N):** guarda las pistas. El jugador une dos pistas que encajan para hacer una **deducción**; las deducciones hacen avanzar la historia y construyen el perfil del asesino.
- **Dos lecturas:** al terminar el juego se desbloquea una segunda partida. Las líneas marcadas _(1ª lectura)_ y _(2ª lectura)_ son la misma escena contada como Thomas la cree y como fue. La segunda no debe ser obvia en la primera.
- **Cordura:** algunas cosas la bajan (efectos visuales, la voz). No cambia el texto salvo donde se indica.
- **Formato del guion:** `**Personaje:**` es diálogo hablado; `*Thomas (piensa):*` es un pensamiento (texto en cursiva, sin nombre en pantalla); `(la voz)` es la voz del agua o de alguien poseído. `_Si …:_` son condiciones del código (flags del estado de la partida: `flag('x')` es algo que ya pasó, `hasClue('x')` una pista ya obtenida, `has('x')` un objeto en el inventario, `second()` la segunda partida). `> Elección` son las opciones que elige el jugador. `[…]` son efectos: pista nueva, objeto, documento en pantalla, cambio de escena, objetivo.
- **Capítulos en las condiciones:** `p === 'c1'` (o `phase(G)`) es el capítulo en curso: `c1` 31 de agosto (Nichols), `c2` 8 de septiembre (Chapman), `c3a`/`c3b` la noche del doble crimen y los días después, `c4` el final.
- **Al reescribir:** se puede cambiar cualquier texto, quitar interacciones que solo describen (o dejarlas sin texto) y fusionar conversaciones. Conviene mantener los `id` de las cosas y de las pistas, o indicar los nuevos, para poder pasarlo al juego.

## Contexto: la biblia de la historia
# EL HUÉSPED — Whitechapel, 1888

> *Hospes* (lat.): el que recibe y el que es recibido. Anfitrión y huésped son la misma palabra.

Biblia narrativa del juego. Todo lo que se escriba o se diseñe sale de este documento.

---

### 1. Premisa en una línea

Un inspector de Whitechapel persigue al asesino que aterroriza el East End en el otoño de 1888 y sospecha de todo el mundo menos del único hombre que nunca mira en los espejos.

### 2. Tono y referencias de sensación (no de contenido)

- Horror psicológico y cósmico **lento**, sin sustos baratos. La amenaza no tiene forma: es una voz, una marea, un hueco en la memoria.
- Calles mojadas, luz de gas ámbar contra una niebla verde y fría. El color cálido es escaso y casi siempre engaña.
- Las escenas del crimen se muestran **como las encontró la policía**: el cuerpo, la sangre, el lugar. El asesinato en sí nunca se ve; Thomas no recuerda esas horas y el jugador tampoco. Las víctimas son personas con nombre, deudas, amigos y frases propias; el juego las investiga, no las convierte en espectáculo.
- El jugador debe poder volver a jugar y descubrir que **todas las pistas apuntaban a él desde el primer minuto**.

### 3. La regla de lo sobrenatural (coherente y cerrada)

1. Bajo el East End corre el **Black Ditch**. En el barro hay una tablilla con una palabra latina: **HOSPES**. La atribución arqueológica romana es ficción interna del juego, no una afirmación histórica.
2. El Huésped carece de cuerpo y nombre propio. **Para entrar en una persona debe oír una respuesta voluntaria al nombre pronunciado por el agua.** Escuchar no basta. Entrar no significa control absoluto inmediato.
3. La advertencia de los ribereños es precisa: «Si el agua dice tu nombre, no contestes». La voz puede imitar a alguien querido, pero no puede anular esa condición de entrada.
4. En octubre de **1866**, Thomas puede contestar o guardar silencio, según decida el jugador. Si contesta, el Huésped entra entonces. **Si calla, permanece fuera durante trece años; el primer ingreso ocurre en marzo de 1879**, cuando Thomas decide responder *de viva voz* durante otro encuentro junto al lavadero del hospital; después olvida haberlo hecho. Esa respuesta se documenta, pero Thomas la olvida.
5. Una vez dentro, el Huésped «alquila horas»: desaparecen lapsos de memoria, se mueven objetos, cambian sus guantes y sus botas. Cada noche controla más tiempo. El acto de 1879 refuerza el vínculo si ya había entrado en 1866.
6. **El nombre es una dirección.** Para permanecer sin depender de una sola respuesta privada, el Huésped necesita que muchas personas repitan un nombre nuevo; una ciudad lo hace poderoso y visible socialmente, no omnipotente.
7. Los crímenes son un medio para propagar ese nombre. La mano de Thomas escribe la carta *Dear Boss* con tinta roja en la noche del **24 al 25 de septiembre de 1888**. La carta lleva fecha del **25**, llega a la Central News Agency el **27** y se conoce masivamente después del doble crimen del **30 de septiembre**. Su nombre firmado es «Jack the Ripper».
8. La sustitución es lenta y trágica: Thomas puede elegir sus últimas acciones, pero ya no puede detener la difusión del nombre. Al terminar, recuerda cada vez menos cómo se llama. No hay un nuevo sacrificio necesario para «completar» el ritual.

**Regla de redacción:** ningún personaje explica estos ocho puntos seguidos. La respuesta se deduce del cuaderno, la cronología, la voz y el efecto de la prensa. El Huésped jamás debe contradecir su regla de entrada para lograr un efecto sorpresivo.

### 4. Personajes

### Thomas Ashgrove (protagonista)
- 34 años, inspector de la División H (Whitechapel) de la Policía Metropolitana.
- Estudió cuatro años de medicina en el **London Hospital** de Whitechapel Road y lo dejó sin explicar por qué. **Sabe anatomía.**
- **Zurdo**: escribe con la izquierda (se ve en sus notas, en cómo empuña la lámpara).
- Vive de alquiler en un cuarto de Thrawl Street, encima de una cerería. El espejo del lavabo está tapado con una sábana: *"Me corté afeitándome. Mala luz."*
- Pierde horas. Lo atribuye al cansancio y al láudano para dormir.
- Su herida: en 1866, su hermano pequeño **Nat** se ahogó en Limehouse. Semanas después, el agua dijo *"Thomas"*. **Que Thomas contestara entonces depende de la elección del jugador.** Si calló, la primera respuesta ocurrió en 1879, ante el lavadero del hospital. En ambas rutas su memoria es incompleta.

### Nat Ashgrove (el hermano)
- Solo aparece en el prólogo y en la voz del agua. La voz que imita a Nat es la del Huésped; usa la voz que mejor abre la puerta.

### Sargento Aldous Pike
- Compañero de Thomas. Seco, metódico, de pocas palabras. Toma notas sobre **Thomas**, no sobre el caso.
- Primera lectura: oculta algo, quizá protege al asesino o lo es él.
- Verdad: desde la primera noche sospecha de Thomas y anota horarios para contrastar una hipótesis. Le aterra que sea cierta; **en el capítulo final debe confrontarlo de forma audible y humana** antes de la huida.

### Dr. Lionel Greaves
- Cirujano del London Hospital y antiguo mentor de Thomas. Tiene bisturís, conocimientos y coartadas débiles: **sospechoso perfecto**.
- Estudia la "fuga disociativa" (el término es real y de 1887). Lleva un expediente clínico de un paciente al que llama **T. A.**
- Verdad: intentó tratar a Thomas en 1879, cuando lo halló en la sala de disección tras una ausencia de memoria. Una nota de una testigo sitúa la respuesta «Aquí estoy» junto al lavadero; Thomas no recuerda el incidente.

### Madame Orla Wexley
- Médium de Spitalfields. Hace sesiones de espiritismo por un chelín.
- Primera lectura: charlatana, quizá jefa de una secta que hace sacrificios.
- Verdad: oye el agua de verdad. En la sesión, cuando el espíritu habla, no se dirige a los muertos: le habla a **Thomas** con la voz de Nat.

### Silas Brennan
- Matarife del desolladero de caballos de Winthrop Street, junto a Buck's Row. Delantal de cuero, cuchillos, mal carácter y antecedentes por peleas.
- Primera lectura: el sospechoso obvio. El jugador puede *"resolver"* el caso acusándolo.
- Verdad: inocente. Una turba lo apalea después de que Thomas lo señalara. Primera culpa del protagonista que el jugador comparte.

### Wren
- Niña mudlark de 11 años que rebusca en el fango del Támesis. Encuentra cosas que el río devuelve.
- Le enseña a Thomas la regla del agua. Es la única que lo mira con miedo **desde el principio**: "Usted huele al Ditch, señor".
- En el final es quien le pregunta su nombre. Vuelve a tener presencia breve durante la segunda mitad de la historia, sin funcionar como narradora omnisciente.

### Las víctimas (fechas reales)
Polly Nichols (31 ago, Buck's Row), Annie Chapman (8 sep, Hanbury St.), Elizabeth Stride y Catherine Eddowes (30 sep, "doble suceso") y Mary Jane Kelly (9 nov, Miller's Court). Aparecen en la escena del crimen tal como las halló la policía, y en informes, recuerdos de quienes las conocían y objetos personales.

### 5. Estructura (versión jugable: 30–45 min)

| # | Capítulo | Fecha | Lugar | Función |
|---|----------|-------|-------|---------|
| 0 | **Prólogo: La marea baja** | Oct. 1866 | Foreshore de Limehouse | El agua dice «Thomas». Responder permite la entrada en 1866; callar la aplaza hasta 1879. **Las dos decisiones se respetan.** |
| 1 | **Buck's Row** | 31 ago 1888, 3:40 AM | Cuarto de Thomas → Buck's Row → desolladero | Despertar con las botas mojadas. Escena del crimen. Pistas: corte de zurdo, conocimiento anatómico, barro de río. Wren y la regla del agua. Sospecha de Brennan. |
| 2 | **El delantal de cuero** | 8–10 sep | Hanbury St. → sesión de Madame Wexley | Sesión: la voz de Nat. Acusar a Brennan → la turba. |
| 3 | **Tinta roja** | 24–30 sep | Cuarto de Thomas → Mitre Square → Goulston St. | Horas perdidas. Thomas despierta con los dedos manchados de rojo. La prensa publica "Jack the Ripper". Doble suceso. Persecución: Thomas huye "tras el asesino" con silbatos de la policía a su espalda. |
| 4 | **Huésped** | 8–9 nov | Consulta de Greaves → Támesis → Miller's Court | El expediente "T. A.". Pike viene a detenerlo. Huida al foreshore donde murió Nat. El agua dice su nombre. Revelación en el reflejo. Final. |

### El final (destino invariable; última acción significativa)

Tras el expediente de Greaves, Pike confronta personalmente a Thomas. El jugador elige **una última acción**, con consecuencias observables pero sin cambiar el destino: intentar entregarse (`surrender`), pedir a Pike que proteja a Wren (`warn_wren`), o intentar romper un folio del expediente que lo señala (`destroy_page`). Una laguna temporal lo conduce al foreshore en todos los casos.

En el agua, la voz dice «Thomas». Si el jugador insiste en callar, **Thomas calla de verdad durante unos segundos**; luego su boca, ya dominada, dice «Aquí estoy». El juego muestra que no se produjo una nueva invitación: la entidad ya estaba alojada en él por una respuesta pasada.

El cuaderno obliga a hacer **tres relaciones finales razonadas** con la ficha de Thomas y presenta una cuarta evidencia —la respuesta de 1879—, distinta si el niño respondió o no en 1866. La voz no explica qué significa ser un nombre: se oyen conversaciones, titulares e informes que pronuncian «Jack» y el jugador concluye el resto.

Epílogo, Miller's Court, 9 de noviembre: Wren le pregunta «¿Cómo se llama usted?». Se recupera la **interfaz de firma** del inicio (`final_name_entry`): el jugador escribe «Thomas» u otro texto, pero el resultado visible termina siempre en **J-A-C-K**. Debe ser una transformación lenta, no un salto instantáneo. La opción de última acción se refleja en una línea del epílogo; los destinos canónicos siguen siendo trágicos.

Fundido a negro con un fragmento de la firma histórica. Evitar narrar que Thomas «es Jack» antes de que el jugador contraste las pruebas.

### 6. Cómo se planta el giro (pistas justas)

Cada pista es legítima y tiene una lectura inocente en el momento:

| Pista | Lectura en el momento | Lectura al final |
|-------|-----------------------|------------------|
| Despiertas con las botas mojadas y barro negro | Volviste de una ronda bajo la lluvia | Barro del Black Ditch |
| Todos los espejos están tapados, rotos o empañados | Ambientación lúgubre | El protagonista se evita |
| "El asesino es zurdo" (informe del forense) | Pista sobre el sospechoso | Tus notas están escritas con la izquierda |
| "El asesino conoce la anatomía" | Apunta a Greaves o a Brennan | Cuatro años de medicina |
| El asesino conoce las rondas de los policías | Apunta a un policía, a Pike | Eres policía |
| Wren: "Usted huele al Ditch" | Los niños dicen cosas raras | Literal |
| El reloj salta de 11:40 a 3:15 | Fallo de cansancio | Horas alquiladas |
| Tinta roja en tu escritorio, volcada a las 3:15 del 25 | Un tintero que alguien tiró | La carta "Dear Boss" está en tinta roja, y la escribiste tú |
| Pike apunta en su libreta cada vez que tú hablas | Pike es raro | Te investiga |
| Madame Wexley: "Hay alguien detrás de usted" | Teatro de médium | Lo hay: dentro |
| Durante la persecución, los silbatos se acercan *a ti* | Persigues al asesino | Te persiguen a ti |

### Dos lecturas

**Primera partida.** El jugador veterano espera «el detective es el asesino», así que el juego le ofrece
otro tópico más tentador: **a Thomas le están tendiendo una trampa**. Alguien entra por su ventana
mientras duerme, le moja las botas, le vuelca la tinta roja y le roba un bisturí del estuche. Los
sospechosos razonables son **Pike** (reparte las rondas, lleva bombín y linterna, apunta a qué hora
llega Thomas y guarda la otra llave de su cuarto) y **Greaves** (tiene sus bisturís, conoce su
pasado y su letra es la de la carta). En el prólogo el niño **puede callar**; en la sesión, la voz alude a una respuesta sin decir cuándo ocurrió. Thomas cree que se refiere a 1866. Las frases que lo delataban (la voz que dicta, la mano
izquierda manchada, la sangre seca de los guantes) no aparecen.

**Segunda lectura** (se desbloquea al terminar). La misma historia, sin cambiar retroactivamente decisiones: si el niño calló, se ve por primera vez cómo respondió en 1879; si respondió en 1866, se muestra cómo la entidad amplió entonces su control. La voz dicta la carta, la hoja de rondas lleva la firma de Thomas, y el cuaderno contrasta sus hipótesis con las pruebas reales.

**El final cobra lo que hiciste.** Si callaste en 1866, descubrirás que respondiste en 1879: **la regla se cumplió**. Acusar, callar o proteger a Brennan deja secuelas distintas. La última acción ante Pike modifica el diálogo del epílogo; no hay rutas de victoria. Si conserva cordura, Wren insiste en recordarle su nombre; si le pagaste, te devuelve el penique.

### Puzles

1. **Las rondas** (cap. I): con la hoja de rondas, deducir los diez minutos en que nadie veía el
   portón (Thain alumbró a las 3:30; Cross llegó a las 3:40). La respuesta ingenua, «entre dos pasadas
   de Neil», es falsa.
2. **Los golpes** (cap. II): antes de empezar la sesión, la mesa golpea sola en el código de los presos
   del zar (fila y columna sobre una tabla de 5x5 sin K, clavada en la pared bajo la carta astral).
   Thomas los lee con la tabla: HOSPES, y con eso se abre la sesión. En la oscuridad, los mismos seis
   grupos vuelven más fuertes: esta vez sabe la palabra.
3. **La letra** (cap. III): la carta «Dear Boss» frente a cuatro muestras manuscritas; comparar el remate de la **J**, el enlace de las **t** y la inclinación de los trazos. La similitud sugiere a Greaves, pero **no lo demuestra**. La segunda lectura permite comparar también los apuntes de Thomas. **No alterar la transcripción histórica añadiendo letras «ſ» que el original no usa.**

### El perfil del asesino (mecánica del cuaderno)
Cada deducción **de tipo inferencia sustentada** añade un rasgo al **Perfil del sospechoso** (las hipótesis de culpabilidad no son rasgos probados): *zurdo, sabe anatomía, conoce las rondas, ronda el río, sabe escribir, tiene acceso a las escenas antes que la policía*. En el capítulo 4, el cuaderno muestra el perfil completo en una página y, en la de enfrente, la ficha de **Thomas Ashgrove**. El jugador hace la deducción final él mismo.

### 7. Sistemas

- **Cordura**: baja con lo que se ve, con lo que se oye y con las horas perdidas. A menos cordura, aparecen grano, aberración cromática y susurros; algunas descripciones mienten y la voz del agua se oye más alta.
- **Horas perdidas**: transiciones donde el reloj salta. Al volver, el inventario o el estado del mundo ha cambiado sin explicación.
- **Cuaderno**: registra pruebas automáticamente y presenta tres tipos: `hecho`, `hipotesis` e `inferencia`. Combinar dos pistas puede formar una hipótesis revisable o una inferencia sustentada. Las deducciones mantienen sus IDs históricos para compatibilidad.
- **Inventario**: objetos que se usan sobre el escenario.
- **Consecuencias**: `brennan_outcome` y `final_intent` persisten en guardado y solo alteran consecuencias humanas y el epílogo.
- **Interfaz de nombre**: la firma del cuaderno al inicio vuelve al final con letras progresivamente sustituidas por «JACK»; requiere soporte de entrada de texto táctil y teclado.

### 8. Reglas de producción

- Los escenarios se pintan por código; los personajes se modelan en Blender (`tools/blender`). Todo se termina como pixel-art HD (640×360, una paleta curada en `src/art/pixel.js`) con iluminación por encima. No se usan packs de terceros.
- La violencia ocurre fuera de plano; lo que se ve es su resultado, con el realismo de un expediente policial de 1888, y sus consecuencias humanas.
- Los diálogos son breves: nunca más de tres intervenciones seguidas sin respuesta, acción, cambio de mirada o una razón dramática clara. Un clic sin información nueva no debe abrir diálogo.


### Política editorial V3 (vinculante para implementación)

- **Ningún personaje narra lo que ya se ve:** lluvia, trenes, arquitectura, posiciones, objetos y ropa se comunican mediante arte, animación, sonido y hotspot. Un pensamiento solo se justifica si agrega **contradicción, decisión, inferencia útil, recuerdo personal o temor no visible**.
- **Thomas:** investigador preciso, poco sentimental; empieza con preguntas profesionales, después duda de su memoria en frases cada vez más breves. No hace bromas recurrentes ni ofrece tutoriales en voz interior.
- **Pike:** frases cortas, datos exactos, silencios deliberados; pregunta por Thomas cuando debería preguntar por el crimen. Cuida a las víctimas sin decirlo.
- **Greaves:** cortesía clínica, memoria compartida y culpa; jamás se presenta como villano ni diagnostica al protagonista con un discurso.
- **Brennan:** orgulloso de su oficio, poco tolerante con la autoridad y con la sospecha fácil; agresivo, no caricaturesco.
- **Wren:** concreta, sagaz y seca; su conocimiento del Ditch no la convierte en una niña-oráculo que explica la mitología. No le atribuir emociones sobrenaturales a cada línea.
- **Wexley:** comienza controlando su puesta en escena profesional; cuando la voz se manifiesta, pierde el control del lenguaje y de la habitación.
- **Agente Watkins y Richardson:** hablan desde un interés humano propio: jurisdicción, trabajo, intimidad y cansancio; no son dispensadores de información.
- **Prueba vs. hipótesis:** si una frase expresa una conclusión de Thomas sin evidencia suficiente, debe quedar como sospecha subjetiva; las deducciones guardadas no la convierten en verdad confirmada.
- **Recorrido del jugador:** las entradas informativas, pistas y documentos permanecen accesibles. Las observaciones eliminadas NO son requisitos ocultos de progresión. Un silencio debe tener feedback interactivo real y no obligar al jugador a clickear sin saber si funcionó.
- **Ritmo:** cada escena combina un beat de observación, una acción del jugador y una consecuencia; evitar cadenas de 4–5 cuadros que repiten la misma evidencia. No multiplicar símbolos sobrenaturales si ya hay una pista clara.

### 9. Mecánicas implementadas (no cambian el canon)

El canon sigue igual: la entrada exige una respuesta voluntaria (en 1866 o, si el niño calla, en 1879), el Huésped ya está dentro cuando suena «Aquí estoy» en el agua, la carta se escribe en la noche del 24 al 25 de septiembre, se fecha el 25 y llega el 27, Thomas es el culpable físico y el final es trágico. Lo que sigue son reglas de juego.

- **Pruebas, hipótesis y teorías.** Relacionar dos pruebas da una conclusión; las que son suposiciones quedan marcadas como *hipótesis* o *inferencia*. Las preguntas del caso (¿alguien entra o salgo yo?, ¿Brennan o el barrio?, ¿quién escribió la carta?, ¿qué explica las horas perdidas?) se muestran con lo que sostiene y lo que contradice cada explicación; ninguna hay que elegirla para avanzar, y nada señala a Thomas antes del capítulo IV.
- **Avanzar con pruebas, no con acusaciones.** El capítulo I se cierra cuando Thomas lo decide (con Pike o con Brennan) si tiene el caso de Pike, el bisturí de Wren y al menos una conclusión con pruebas. Su postura sobre Brennan (vigilarlo, nada contra él, no lo sé) queda escrita y la turba la recuerda.
- **El peine.** Se respeta lo elegido: si Pike se lo queda, la sesión empieza sin el objeto y Wexley lo sabe igual.
- **La sesión.** La mesa golpea antes de empezar; leer HOSPES es la entrada a la sesión, con ayuda que crece en cada fallo; en la oscuridad los golpes vuelven y el susto es la recompensa.
- **La ayuda del cuaderno («¿Qué hago ahora?»).** Dice primero lo que la escena todavía pide (un objeto, una conversación o una decisión); una pareja de pruebas solo se propone si cumple esa exigencia. Si ya se puede avanzar, nunca antepone una deducción opcional a la salida. A la segunda pregunta, el cuaderno se cierra para marcar lo que se puede tocar y el texto queda en un aviso en pantalla.
- **La letra.** «La muestra no basta» es una respuesta válida; Greaves recuerda cómo la valoró Thomas.
- **La persecución.** Los errores cuentan: limpia, vista o herida; el periódico, Pike y Greaves lo reflejan.
- **Ante Pike.** Entregarse cierra la primera esposa antes de la laguna; avisar por Wren hace que Pike la proteja (ella guarda la distancia y su silbato); romper el folio no borra lo que se sabe (Bell vuelve a declarar).
- **El agua.** Responder, callar o taparse la boca tienen cada una su escena; en las tres la boca dice «Aquí estoy» porque ya estaba dentro. «Todavía no» devuelve al cuaderno. El final exige tres pruebas de fuentes independientes.
- **Cordura como percepción.** Firme (≥65): las pruebas se leen mejor. Tensa (36–64): la habitación contesta a veces. Desgastada (≤35): lo del otro lado se ve más claro (el método de los golpes, la luz del Ditch) y los hechos se dudan más; la gente lo nota. Ninguna banda bloquea nada ni muestra pistas falsas. La barra de cordura usa los mismos tres tramos, así que su color coincide con la banda.
- **Segunda lectura.** Un momento nuevo por capítulo (el hombre del agua, la libreta de Pike, Wexley sabe a quién hablan los golpes, el borrador de la carta, la noche de 1879) y atajos por los puzles ya resueltos para quien terminó el juego.
- **Víctimas.** Cada una tiene al menos un detalle humano documentado: Polly y su sombrero nuevo; Annie, el ganchillo y las flores; Elizabeth Stride, sueca, «Long Liz»; Catherine Eddowes, de vuelta del lúpulo de Kent con John Kelly; Mary Jane Kelly, unos veinticinco años, a la que una vecina oyó cantar.


## Introducción (antes del prólogo)
_Archivo: src/story/intro.js. Ficha policial del cuaderno, tres líneas sobre Whitechapel y la primera página._
- POLICÍA METROPOLITANA · DIVISIÓN H
- Registro de efectos. Objeto n.º 214.
- Cuaderno de tapas de hule, muy deteriorado por el agua. Hallado en la boca del desagüe del Black Ditch, en Limehouse, el 10 de noviembre de 1888.
- Propiedad del inspector T. Ashgrove, de esta División, en paradero desconocido.
- Las anotaciones están escritas con dos caligrafías distintas.
- Otoño de 1888. Alguien está matando mujeres en Whitechapel.
- Para entender lo que pasó este otoño tengo que empezar por el río. Por Nat.

## El cuarto de Thomas (Thrawl Street)
_Archivo: src/scenes/room.js_

### Al entrar en la escena
_(sin texto)_

### Cosas con las que se interactúa

#### Puerta `door`
**Al interactuar:**
- _Si p === 'c1':_
  - _Si missing.length:_
    - [Aviso] Falta {list}.
- _Si no:_
  - _Si p === 'c3a':_
    - _Si flag('woke_c3') && !hasClue('llave_pike'):_
      - *Thomas (piensa):* Cerrada por dentro. Pike tiene la única copia. _(1ª lectura)_
      - *Thomas (piensa):* Cerrada por dentro. Nadie necesitaba la llave de Pike. _(2ª lectura)_
      - [+ Pista al cuaderno: llave_pike]
    - [Aviso] Cerrada por dentro. Es de madrugada. | Primero, los informes.
  - _Si no:_
    - _Si p === 'c3b':_
      - _Si !flag('paper_read'):_
        - *Thomas (piensa):* Hay un periódico bajo la puerta.

#### Periódico `paper`
_Aparece si: phase(G) === 'c3b' && !flag('paper_read')_
**Al interactuar:**
- _(sin texto)_

#### Botas `boots`
_Aparece si: phase(G) === 'c1' && !flag('boots_on')_
**Al interactuar:**
- *Thomas (piensa):* Barro de río. Hasta dentro de las botas.
- *Thomas (piensa):* Antes de acostarme estaban secas. _(1ª lectura)_
- *Thomas (piensa):* Otra noche que no recuerdo. _(2ª lectura)_
- [+ Pista al cuaderno: botas]

#### Abrigo y bombín `coat`
_Aparece si: !flag('coat_on')_
**Al interactuar:**
- _Si !has('placa'):_
  - [+ Objeto: placa]
- _Si !has('penique') && !flag('penique_given'):_
  - [+ Objeto: penique]

#### Linterna de ojo de buey `lantern`
_Aparece si: !flag('lantern_taken')_
**Al interactuar:**
- *Thomas (piensa):* La mecha sigue caliente. No recuerdo encenderla. _(1ª lectura)_
- *Thomas (piensa):* La usé anoche. ¿Adónde fui? _(2ª lectura)_

#### Espejo cubierto `mirror`
**Al interactuar:**
- _Si n === 1:_
  - *Thomas (piensa):* La sábana no tiene por qué estar aquí.

#### Cama `bed`
**Al interactuar:**
- _Si p === 'c3b':_
  - *Thomas (piensa):* Falta el de ébano. Siempre guardaba seis.
  - [+ Pista al cuaderno: estuche]
- *Thomas (piensa):* Pisadas de la ventana hasta mi cama. Alguien me observó mientras dormía. _(1ª lectura)_
- *Thomas (piensa):* Barro en mi lado del colchón. _(2ª lectura)_

#### Fotografía `photo`
**Al interactuar:**
- _Si p === 'c1':_
  - *Thomas (piensa):* Nat odiaba posar. Aquí se reía.
- _Si no:_
  - *Thomas (piensa):* Han raspado mi cara. La de Nat está intacta.

#### Ventana `window`
**Al interactuar:**
- _Si p === 'c1':_
  - _Si !hasClue('ventana'):_
    - *Thomas (piensa):* Cerré esta ventana. Lo sé. _(1ª lectura)_
    - *Thomas (piensa):* Salí por aquí para no despertar a Pell. _(2ª lectura)_
    - [+ Pista al cuaderno: ventana]

#### Escritorio `desk`
**Al interactuar:**
- _Si p === 'c1':_
  - _Si !had:_
    - [+ Objeto: penique]
  - _Si !has('placa'):_
    - [+ Objeto: placa]
- _Si no:_
  - _Si p === 'c3a':_
    - _Si no:_
      - _Si second() && !flag('s2_draft'):_
        - [Documento] Bajo el secante Dear Boss, I keep on hearing the police have caught me but they wont fix me just yet... Tachado y vuelto a escribir dos veces. La J con la cola larga. Las t, cortas.
        - *Thomas (piensa):* Mi mano. Mi tinta. Lo practiqué antes de escribirlo.
      - _Si no:_
        - *Thomas (piensa):* Es mi letra. Las últimas dos páginas no son mías... ¿o sí? _(1ª lectura)_
        - *Thomas (piensa):* Lo escribí yo. ¿Cuándo? _(2ª lectura)_

#### Frasco de láudano `laudano`
**Al interactuar:**
- _Si !hasClue('laudano'):_
  - [+ Pista al cuaderno: laudano]
  - *Thomas (piensa):* Compré este frasco hace tres días. Ya está casi vacío.
- _Si no:_
  - _Si !flag('drank'):_
    - > **Elección:** 1) Un trago. Solo uno.  ·  2) Dejarlo.
    - _Si c === 0:_
      - *Thomas (piensa):* Las manos dejan de temblar. Esta noche dormiré más hondo. Demasiado.
  - _Si no:_
    - *Thomas (piensa):* Ya no queda.

#### Reloj `clock`
**Al interactuar:**
- *Thomas (piensa):* {h[0]}:{String(h[1]).padStart(2, '0')}. {phase(G) === 'c1' ? 'Me acosté a las once.' : 'No puede haber pasado tanto tiempo.'}

#### Mapa de Whitechapel `map`
**Al interactuar:**
- _Si state.chapter === 'c3' || state.chapter === 'c4':_
  - *Thomas (piensa):* Todo ocurrió a diez minutos de mi puerta.

## Buck's Row (Mary Ann Nichols)
_Archivo: src/scenes/bucks_row.js_

### Al entrar en la escena
- **Pike:** Inspector. No pise junto al portón.
- **Pike:** No lleva papeles. Hasta que el forense la vea, no hay nombre.
- **Thomas:** ¿Quién la vio primero?
- **Pike:** Dos carreteros, sobre las tres cuarenta. Neil llegó detrás. Aún discuten cuál la encontró.
- [Objetivo] Examinar el cuerpo. Hablar con Pike, con Neil y con el chico.

### Cosas con las que se interactúa

#### Sargento Pike `pike`
**Al interactuar:**
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Qué dijo el médico? _(si !hasClue('zurdo'))_
  - ¿Quién era ella? _(si !flag('pike_polly'))_
  - ¿Qué apunta en esa libreta, Pike? _(si !flag('pike_notes') && flag('pike_polly'))_
  - ¿Quién trabaja de noche por aquí? _(si hasClue('zurdo') && !flag('knackers_lead'))_
  - La hoja de rondas de esta noche. _(si flag('neil_times') && !hasClue('ronda'))_
  - Déjeme ver su libreta, Pike. _(si second() && flag('pike_notes') && !flag('pike_book_read'))_
  - Cerramos por esta noche, Pike. _(si canFinishC1(state).ok && !flag('c1_done'))_
  - Nada más.
- _Si c === 'book':_
  - **Pike:** ...Tome. No tengo nada que esconderle.
- _Si c === 'doc':_
  - **Pike:** Llewellyn cree que los cortes podrían ser de un zurdo.
  - [+ Pista al cuaderno: zurdo]
  - **Pike:** Dice que conocía el cuerpo. No es una afirmación que haga a la ligera.
  - [+ Pista al cuaderno: anatomia]
- _Si no:_
  - _Si c === 'polly':_
    - **Pike:** Lleva un sombrero de paja negro; parece nuevo. Alguien lo eligió con cuidado.
  - _Si no:_
    - _Si c === 'notes':_
      - **Pike:** Quién entra. Quién sale. A qué hora.
      - **Thomas:** ¿También apunta cuándo llego yo?
      - **Pike:** Cuatro y doce. Lo mandé llamar a las cuatro.
    - _Si no:_
      - _Si c === 'beats':_
        - **Pike:** Aquí la tiene, señor. Las horas de todos, y lo que declaran.
      - _Si no:_
        - _Si c === 'lead':_
          - [Objetivo] Ir al desolladero de Winthrop Street, hacia el oeste.
          - **Pike:** Barber tiene un desolladero en Winthrop Street. No cierra de noche.
          - **Thomas:** ¿Armas?
          - **Pike:** Allí hasta el aprendiz lleva cuchillo.

#### Agente Neil `neil`
**Al interactuar:**
- _Si !hasClue('ronda'):_
  - **Neil:** Pasé a las tres y cuarto. La calle estaba despejada.
  - **Thomas:** ¿Y después?
  - **Neil:** A las tres cuarenta y cinco la encontré yo. Le hice señas a Thain con la linterna. Está todo en la hoja.
- _Si no:_
  - **Neil:** Es mi ronda desde hace seis años. Anoche me costó entrar en esa calle.

#### Chico con un cubo `boy`
**Al interactuar:**
- _Si !hasClue('silencio'):_
  - **Chico:** Mi madre quiere que lo limpien antes de que vengan los curiosos.
  - **Thomas:** ¿Vio a alguien?
  - **Chico:** Duerme con la ventana abierta. No oyó ni un grito. Y ella oye hasta cuando los gatos pisan el tejado.
  - [+ Pista al cuaderno: silencio]
- _Si no:_
  - **Chico:** Ese barro de sus botas... aquí no hay de ese color.

#### El cuerpo de la mujer de Buck's Row `polly`
_Aparece si: !flag('polly_taken')_
**Al interactuar:**
- _Si first:_
  - **Neil:** La tapé yo. No tenían por qué verla todos.

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* Le sujetaron la mandíbula con la derecha.

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* Dos cortes. El primero para acallarla.
- *Thomas (piensa):* Sin señales de defensa.
- [+ Pista al cuaderno: cuello]

#### La falda `vientre`
**Al interactuar:**
- *Thomas (piensa):* Heridas posteriores. La ropa absorbió casi toda la sangre.

#### Rastro en los adoquines `tracks`
**Al interactuar:**
- *Thomas (piensa):* Barro del río. La huella se aleja hacia Winthrop Street.
- [+ Pista al cuaderno: huellas]
- *Thomas (piensa):* Mi talla. Eso no significa nada.

#### Ventana de la señora Green `window`
**Al interactuar:**
- _(sin texto)_

#### Hacia Winthrop Street `west`
**Al interactuar:**
- _Si !flag('knackers_lead'):_
  - *Thomas (piensa):* Necesito la opinión de Llewellyn antes de irme.
- [→ Escena: knackers]

## El desolladero de Barber (Winthrop Street)
_Archivo: src/scenes/knackers.js_

### Al entrar en la escena
- [Objetivo] Hablar con Brennan y con la niña de las cajas.

### Cosas con las que se interactúa

#### Silas Brennan `brennan`
_Aparece si: !isMob(G)_
**Al interactuar:**
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Dónde estaba a las tres y media? _(si !flag('br_alibi'))_
  - ¿No oyeron nada? _(si !flag('br_heard') && flag('br_alibi'))_
  - (Mirar cómo trabaja) _(si !hasClue('brennan_zurdo'))_
  - Esto es todo por esta noche. _(si canFinishC1(state).ok && !flag('c1_done'))_
  - Nada más.
- _Si c === 'look':_
  - [+ Pista al cuaderno: brennan_zurdo]
- _Si c === 'alibi':_
  - **Brennan:** Aquí. Con tres hombres. Puede preguntarles. Ya lo hicieron sus agentes.
  - **Brennan:** Seis caballos, inspector. Un caballo no se despieza solo.
- _Si no:_
  - _Si c === 'heard':_
    - **Brennan:** Aquí dentro ni los gritos de los caballos dejan oír la calle.
    - **Brennan:** Pregúntele a la cría de las cajas. Ella ve lo que ustedes pasan por alto.

#### Niña sobre las cajas `wren`
_Aparece si: !isMob(G)_
**Al interactuar:**
- _Si !flag('wren_met'):_
  - **Niña:** No se acerque.
  - **Niña:** Usted huele al Ditch, señor.
  - **Thomas:** Soy policía.
  - **Niña:** Ya. Por eso.
  - **Wren:** Wren. Lo que encuentro en el fango se paga.
  - _Si has('penique'):_
    - > **Elección:** 1) Dejarle el penique en el poste.  ·  2) Ahora no.
  - [Objetivo] Darle un penique a Wren.
- _Si flag('wren_paid'):_
  - **Wren:** Se lo he dicho: si el agua pronuncia su nombre, no conteste.
  - _Si flag('c1_done') && !flag('wren_return_visit'):_
    - **Wren:** Encontraron a otra mujer. Usted guarda cosas de los muertos, inspector. Yo también. La diferencia es que yo las vendo.
- **Wren:** Un penique, señor. Las cosas cuestan.
- *Thomas (piensa):* Dejé el penique sobre los informes.
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Poste de piedra `bollard`
**Al interactuar:**
- _(sin texto)_
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Abrevadero `trough`
**Al interactuar:**
- _Si !flag('trough_seen'):_
  - *Thomas (piensa):* Me habré colocado mal.
- _Si no:_
  - *Thomas (piensa):* No vuelvo a asomarme.

#### Volver a Buck's Row `east`
_Aparece si: !isMob(G)_
**Al interactuar:**
- [→ Escena: bucks_row]

### Secuencia `payWren`
- **Wren:** Estaba en la rejilla, antes de que llegara la policía. Brillaba.

## La orilla del Támesis, el Black Ditch (Limehouse)
_Archivo: src/scenes/foreshore.js_

### Al entrar en la escena
_(sin texto)_

### `onDeduce`
- [Objetivo] Ir al agua.

### Cosas con las que se interactúa

#### Algo en el barro `boat`
_Aparece si: is1866(G) && !flag('boat')_
**Al interactuar:**
- _(sin texto)_

#### Desagüe del Black Ditch `outfall`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* El agua está tibia. Nat decía que aquí vivía alguien.
- _Si no:_
  - _Si !state.seen?.['foreshore:outfall:1888']:_
    - *Thomas (piensa):* Ladrillo viejo. El agua sale a borbotones de debajo de la calle.
    - _Si perceptionBand(state.sanity) !== 'steady':_
      - *Thomas (piensa):* El ruido se calla al acercarme.

#### El embarcadero `jetty`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* Nadie supo decir dónde se cayó Nat.

#### El río `water`
**Al interactuar:**
- _(sin texto)_

#### Escaleras a Narrow Street `stairs`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* Primero el barco. Nat no lo habría dejado aquí por nada.

## Hanbury Street, 29 (Annie Chapman)
_Archivo: src/scenes/hanbury.js_

### Al entrar en la escena
- **Pike:** Dicen en la casa que es Annie, de Dorset Street. Hay que confirmarlo.
- **Pike:** Dicen que hacía ganchillo y vendía flores, cuando la salud la dejaba.
- **Pike:** La encontró Davis, antes de las seis. Phillips espera que la vea antes de moverla.
- [Objetivo] Examinar el cuerpo y el patio. Hablar con Pike, con el médico y con la casera.

### Cosas con las que se interactúa

#### Sargento Pike `pike`
**Al interactuar:**
- _Si !hasClue('ordenados'):_
  - **Pike:** Phillips calcula entre las cuatro y media y las cinco y media.
  - **Thomas:** ¿Y por qué no han recogido sus cosas?
  - **Pike:** Porque alguien las colocó en fila. Quería que las viéramos así.
  - [+ Pista al cuaderno: ordenados]
- _Si no:_
  - _Si !flag('pike_hb2'):_
    - **Pike:** Inspector, ¿dónde pasó la noche?
    - > **Elección:** 1) En mi cuarto. Durmiendo.  ·  2) ¿Por qué lo pregunta?
    - _Si c === 0:_
      - **Pike:** Entendido.
    - _Si no:_
      - **Pike:** No lo haría si no necesitara una respuesta.
  - _Si no:_
    - **Pike:** Ya han decidido que fue «Leather Apron». Los diarios. No los testigos.

#### Dr. Lionel Greaves `greaves`
**Al interactuar:**
- _Si !flag('greaves_met'):_
  - **Greaves:** Sigues mirando las manos primero, Thomas.
  - **Thomas:** ¿Ha venido por Phillips o por mí?
  - **Greaves:** Phillips me pidió que viniera. Lo otro es una pregunta difícil.
  - > **Elección:** 1) ¿Qué opina del corte?  ·  2) Me alegro de verle, doctor.
  - _Si c === 0:_
    - **Greaves:** Parece trabajo de alguien acostumbrado a la disección.
    - **Greaves:** Tú tenías buena mano. No era un elogio que hiciera a menudo.
  - _Si no:_
    - **Greaves:** Habría preferido verte descansado.
  - **Greaves:** ¿Sigues tomando láudano? Si es así, no lo mezcles con ginebra.
  - [+ Pista al cuaderno: greaves_sabe]
  - *Thomas (piensa):* Nunca le he contado a nadie lo del láudano. ¿Cómo lo sabe?
- _Si no:_
  - **Greaves:** Sabes dónde encontrarme. Y aún conservo tu vieja ficha.

#### Sra. Richardson, la casera `amelia`
**Al interactuar:**
- _Si !flag('amelia1'):_
  - **Sra. Richardson:** Diecisiete personas bajo este techo. Dígame cómo nadie oyó nada.
  - **Sra. Richardson:** Ese delantal lo lavé yo. Es de mi hijo John. ¿Va a escribirlo o va a preguntar otra vez?
  - *Thomas (piensa):* Del hijo de la casera. Pero estaba a dos pasos del cuerpo.
- _Si no:_
  - **Sra. Richardson:** Los de la ventana cobran por mirar. Yo vivo aquí y nadie me deja cerrar la puerta.

#### Delantal de cuero `apron`
**Al interactuar:**
- [+ Pista al cuaderno: delantal]

#### Algo junto a la valla `comb`
_Aparece si: !flag('peine_taken')_
**Al interactuar:**
- *Thomas (piensa):* Dos púas rotas. Alguien dejó el peine fuera del montón.
- > **Elección:** 1) Dárselo a Pike.  ·  2) Guardármelo.
- _Si c === 0:_
  - **Pike:** Lo apunto: un peine de bolsillo, dos púas rotas, junto a la valla. Se queda con las pruebas.
- _Si no:_
  - [+ Objeto: peine]
  - *Thomas (piensa):* Me lo guardo. Más tarde se lo daré a Pike.

#### Ventana trasera `window`
**Al interactuar:**
- *Thomas (piensa):* No había nadie.
- [+ Pista al cuaderno: reflejo]

#### Escalones `steps`
**Al interactuar:**
- *Thomas (piensa):* La tierra removida, y serrín encima. Alguien ya ha empezado a limpiar.

#### El cuerpo de la mujer del patio `annie`
_Aparece si: !flag('annie_taken')_
**Al interactuar:**

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* La estrangularon antes de usar el cuchillo.
- *Thomas (piensa):* Nadie habría oído el segundo ataque.

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* La incisión es demasiado firme para un primer intento.

#### Sobre el hombro `hombro`
**Al interactuar:**
- *Thomas (piensa):* Han colocado lo que extrajeron. Con precisión deliberada.
- *Thomas (piensa):* Lo vi en la sala de disección. No quiero volver a verlo.

#### Bajo el saco `saco`
**Al interactuar:**
- *Thomas (piensa):* Extrajo un órgano entero. Sabía cómo separarlo.
- [+ Pista al cuaderno: falta]

#### La mano `mano`
**Al interactuar:**
- *Thomas (piensa):* Quedan marcas de dos anillos arrancados.
- *Thomas (piensa):* Latón barato. No se los llevó por dinero.
- [+ Pista al cuaderno: anillos]

#### Sus cosas `cosas`
**Al interactuar:**
- [+ Pista al cuaderno: ordenados]

#### Pasillo a Hanbury Street `passage`
**Al interactuar:**
- _Si !gate.ok:_
  - *Thomas (piensa):* Antes de irme: {gate.missing[0]}.
  - [Objetivo] {gate.missing.join('; ').replace(/^./, (m) => m.toUpperCase())}. Luego salir por el pasillo.

### Secuencia `hanburyObjective`
- [Objetivo] Salir por el pasillo a Hanbury Street. | {gate.missing.join('; ').replace(/^./, (m) => m.toUpperCase())}. Luego salir por el pasillo.

## La consulta del Dr. Greaves (London Hospital)
_Archivo: src/scenes/greaves.js_

### Al entrar en la escena
- _Si flag('sospecha_greaves'):_
  - *Thomas (piensa):* Si Greaves me miente, guarda aquí la prueba.
- _Si no:_
  - *Thomas (piensa):* Vine por una respuesta, no por otra dosis.

### Cosas con las que se interactúa

#### Cajón del escritorio `drawer`
**Al interactuar:**
- _Si flag('drawer_open'):_
  - [Documento] SCOTLAND YARD — NOTA DEL INSPECTOR JEFE D. S. SWANSON 19 de octubre de 1888 · Copia al Dr. L. Greaves, por consulta. «Al principio el doctor creyó que las heridas las había causado una persona zurda; ahora lo duda.»
- *Thomas (piensa):* La cerradura es pequeña. Necesito algo fino.
**Al usar un objeto sobre ello:**
- *Thomas (piensa):* Ni siquiera tuve que probar dos veces.
- [+ Objeto: llave]
- [Documento] SCOTLAND YARD — NOTA DEL INSPECTOR JEFE D. S. SWANSON 19 de octubre de 1888 · Copia al Dr. L. Greaves, por consulta. «Al principio el doctor creyó que las heridas las había causado una persona zurda; ahora lo duda.»

#### Vitrina cerrada `cabinet`
**Al interactuar:**
- *Thomas (piensa):* Expedientes por año. El de 1879 está apartado.
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Frascos de especímenes `jars`
**Al interactuar:**
- _(sin texto)_

#### Lámina anatómica `chart`
**Al interactuar:**
- *Thomas (piensa):* Puedo señalar cada arteria sin mirar.

#### Esqueleto `skeleton`
**Al interactuar:**
- _Si second() && !flag('s2_1879'):_
  - [Visión: hands]
  - *Thomas (piensa):* La mesa 3. Marzo de 1879. La enfermera junto al lavadero. Ahora lo veo entero.
- *Thomas (piensa):* El sueño terminó aquí, en otra mesa. El resto está borrado.

#### Puerta `door`
**Al interactuar:**
- _Si !flag('file_read'):_
  - *Thomas (piensa):* Sin el expediente no salgo.

## La sesión de Madame Wexley
_Archivo: src/scenes/seance.js_

### Pista (botón de ayuda)
- {{ if (hasClue('hospes')) return null; if (!flag('raps_heard')) return 'La mesa: antes de que Wexley empiece, conviene acercarse a ella y escuchar.'; return flag('knock_board') ? 'Cada letra son dos grupos de golpes: el primero es la fila de la tabla, el segundo la columna. Dos golpes y tres golpes: fila 2, columna 3.' : 'En la pared, bajo la carta astral, hay una tabla de letras. Sin ella los golpes no se pueden leer.'; }}

### Al entrar en la escena
- **Madame Wexley:** Inspector Ashgrove. Ha llegado antes de lo previsto.
- > **Elección:** 1) ¿Quién me esperaba?  ·  2) Usted me mandó una nota. Quiero saber quién se la dictó.
- _Si c === 0:_
  - **Madame Wexley:** Una voz preguntó por usted. No le dije que viniera, pero está aquí.
- _Si no:_
  - **Madame Wexley:** Si me la dictaran, cobraría más.
- _Si state.flags.comb_custody === 'pike':_
  - **Madame Wexley:** Siéntese. Esta mañana ha tenido algo de ella en las manos. Todavía lo lleva encima, aunque ya no lo tenga.
  - *Thomas (piensa):* El peine. Se lo di a Pike. No se lo he contado a nadie.
  - [Objetivo] Sentarse a la mesa de la sesión.
- _Si no:_
  - **Madame Wexley:** Siéntese. Lo que guarda en el bolsillo: póngalo sobre la mesa.
  - *Thomas (piensa):* El peine. No se lo he mostrado.
  - [Objetivo] Poner el peine de Annie sobre la mesa.

### Cosas con las que se interactúa

#### Mesa de la sesión `table`
**Al interactuar:**
- _(sin texto)_
**Al usar un objeto sobre ello:**
- _Si !hasClue('hospes'):_
  - **Madame Wexley:** Todavía no. La mesa ya está diciendo algo; escúchela primero.

#### Madame Orla Wexley `wexley`
**Al interactuar:**
- _Si flag('seance_done'):_
  - **Madame Wexley:** Fuera, inspector. Ahora.
  - > **Elección:** 1) ¿El qué?  ·  2) (Salir sin decir nada)
  - _Si c === 0:_
    - **Madame Wexley:** No es el abrigo lo que debe quitarse.
- _Si !flag('wex_q1'):_
  - **Madame Wexley:** A un policía le cobraría el doble. A usted no le cobraré nada.
  - **Madame Wexley:** Aquí tapamos los espejos cuando alguien muere. Yo no lo hice. Creí que era más valiente.
- _Si no:_
  - **Madame Wexley:** Siéntese cuando quiera. Ella ya está aquí. _(si state.flags.comb_custody === 'pike')_
  - **Madame Wexley:** El peine. No estoy fingiendo que no lo veo. _(si no)_

#### Espejo `mirror`
**Al interactuar:**
- _Si n === 1:_
  - *Thomas (piensa):* Prefiero no mirar.
- _Si no:_
  - _Si no:_
    - *Thomas (piensa):* No.

#### Viuda `widow`
**Al interactuar:**
- **Viuda:** Mi marido se ahogó hace dos inviernos. Vengo cuando me alcanza para la entrada.
- **Viuda:** Nunca es su voz. La señora dice que es él. Yo conozco la voz de mi marido.

#### Joven `young`
**Al interactuar:**
- **Joven:** Del Star. No, no me creo lo que dice.
- **Joven:** Pero tampoco me iré sin escucharla terminar.

#### Reloj de la repisa `clock`
**Al interactuar:**
- *Thomas (piensa):* Tres y cuarto. La primera ronda de Neil.

#### Carta astral `chart`
**Al interactuar:**
- *Thomas (piensa):* «T. A.» y mi fecha. ¿Quién le contó eso?
- _Si !flag('knock_board'):_
  - _Si flag('raps_heard') && !hasClue('hospes'):_
    - [Objetivo] Leer los golpes con la tabla de letras de la pared (en la mesa).
  - *Thomas (piensa):* Dos grupos de golpes. Fila y columna. Como en las cárceles del zar.

#### Salir a Fournier Street `door`
**Al interactuar:**
- _Si !flag('seance_done'):_
  - *Thomas (piensa):* Todavía no sé quién conoce a Nat.

## Mitre Square (Catherine Eddowes)
_Archivo: src/scenes/mitre.js_

### Al entrar en la escena
- **Agente Watkins:** ¡Quieto! ¿Quién lo ha dejado entrar?
- [Objetivo] Enseñar la placa al agente de la City (inventario).

### Cosas con las que se interactúa

#### Agente Watkins (Policía de la City) `watkins`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - **Agente Watkins:** Sin placa, ni un paso más. Esto no es Whitechapel.
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Qué ha encontrado? _(si !hasClue('trozo'))_
  - ¿Alguien vio algo? _(si !hasClue('testigo'))_
  - ¿Sabemos quién era? _(si !flag('watkins_name'))_
  - ¿Hay novedades de otras calles? _(si hasClue('trozo') && !hasClue('berner_aviso'))_
  - ¿Quién lleva el caso? _(si !flag('mitre_city'))_
  - Nada más.
- _Si c === 'found':_
  - **Agente Watkins:** Paso aquí cada cuarto de hora. A la una y media, nada. A la una y cuarenta y cuatro, la vi.
  - **Agente Watkins:** Falta una pieza del delantal. Se la llevó quien lo hizo.
  - [+ Pista al cuaderno: trozo]
- _Si no:_
  - _Si c === 'witness':_
    - **Agente Watkins:** Un vecino de Church Passage dice que, hacia la una y media, vio a una pareja a la entrada del pasaje. Él, abrigo oscuro y bombín. Y una linterna, dice. No está seguro.
    - [+ Pista al cuaderno: testigo]
    - *Thomas (piensa):* Así viste Pike. Así vestimos todos. _(1ª lectura)_
    - *Thomas (piensa):* Así visto yo. _(2ª lectura)_
  - _Si no:_
    - _Si c === 'name':_
      - **Agente Watkins:** No. Aquí nadie la conoce.
    - _Si no:_
      - _Si c === 'berner':_
        - **Agente Watkins:** Aviso de la Metropolitana: Berner Street, hacia la una. Una mujer en el patio de un club, con la garganta cortada. Sin nombre todavía.
        - [+ Pista al cuaderno: berner_aviso]
      - _Si no:_
        - _Si c === 'city':_
          - **Agente Watkins:** Aquí manda la City, inspector. Lo de Berner Street es de ustedes. Usted está aquí de favor.
**Al usar un objeto sobre ello:**
- _Si flag('mitre_badge'):_
  - *Thomas (piensa):* Ya la ha visto.
- **Agente Watkins:** División H. Adelante. Y tenga las manos donde pueda verlas.
- _Si perception.othersNotice(state.sanity):_
  - **Agente Watkins:** ¿Se encuentra bien, inspector? Le tiemblan.
- **Agente Watkins:** ¿Cómo llegó antes que mi aviso?
- [+ Pista al cuaderno: rapido]
- [Objetivo] Averiguar qué encontró Watkins y si alguien vio algo.
- > **Elección:** 1) Estaba cerca, en Aldgate.  ·  2) Oí los silbatos.
- _Si c === 0:_
  - *Thomas (piensa):* Pike me mandó a Aldgate... creo. _(1ª lectura)_
  - *Thomas (piensa):* ¿Por qué fui a Aldgate? _(2ª lectura)_
- _Si no:_
  - *Thomas (piensa):* Mentira. No hubo silbatos.

#### El cuerpo, en la esquina más oscura `corner`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - [Aviso] Watkins no me deja acercarme sin ver la placa.
- *Thomas (piensa):* Aquí nadie podía verlo trabajar.

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* Las marcas no la mataron. Las hizo después.
- *Thomas (piensa):* Tenía menos de quince minutos para hacerlas.
- [+ Pista al cuaderno: marcas]

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* Otra vez de izquierda a derecha.

#### El vientre `vientre`
**Al interactuar:**
- *Thomas (piensa):* Repite el orden de Hanbury.
- *Thomas (piensa):* Falta un riñón... ¿Por qué ya lo sabía?

#### El delantal `delantal`
**Al interactuar:**
- *Thomas (piensa):* Falta una esquina; el corte es limpio.
- [+ Pista al cuaderno: trozo]

#### La muñeca `pulso`
**Al interactuar:**
- _Si second():_
  - [Visión: hands]
- [+ Pista al cuaderno: guantes]
- _Si seen.pulso && !flag('watkins_touch'):_
  - **Agente Watkins:** Le he dicho que no la toque. ¿Me ha oído?
  - > **Elección:** 1) Buscarle el pulso.  ·  2) (Esconder las manos en los bolsillos)
  - _Si c === 0:_
    - **Agente Watkins:** ¿El pulso? Inspector, mírela.

#### Morris, el vigilante `morris`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - [Aviso] Watkins no me deja acercarme sin ver la placa.
- **Morris:** Tenía la puerta entornada. No oí ni una palabra.
- **Morris:** Fui agente veinte años. No me acostumbro a esto.

#### Hacia Goulston Street `east`
**Al interactuar:**
- _Si !gate.ok:_
  - *Thomas (piensa):* Todavía no. Me falta {gate.missing[0]}.
- *Thomas (piensa):* Hacia el este. El trozo de delantal no habrá llegado muy lejos.

### Secuencia `mitreObjective`
- _Si hasClue('trozo') && hasClue('testigo'):_
  - [Objetivo] Seguir el rastro del delantal hacia el este, por Goulston Street.

## Goulston Street (el grafito)
_Archivo: src/scenes/goulston.js_

### Al entrar en la escena
- [Objetivo] Examinar el portal de los Wentworth Buildings.

### Cosas con las que se interactúa

#### Portal de la escalera `doorway`
**Al interactuar:**
- [+ Pista al cuaderno: goulston_historic]
- *Thomas (piensa):* En el ladrillo mojado, junto a la jamba, creo leer HERE I AM. Parpadeo y es solo agua. _(1ª lectura)_
- *Thomas (piensa):* En el ladrillo mojado, letra inclinada. Reconozco la A antes de leer la frase. _(2ª lectura)_
- [Visión: chalk]
- _Si !second():_
  - *Thomas (piensa):* Lo dije yo. Hace veintidós años. _(si flag('answered1866'))_
  - *Thomas (piensa):* ¿Lo he leído o lo he oído? _(si no)_
- [+ Pista al cuaderno: aqui_estoy]

## La persecución por los callejones
_Archivo: src/scenes/alleys.js_

### Al entrar en la escena
- [Objetivo] Alcanzar al abrigo oscuro.
- > **Elección:** 1) Seguir recto, hacia la luz.  ·  2) Meterse por Wentworth Street.
- > **Elección:** 1) Agacharse detrás de los barriles.  ·  2) Seguir corriendo.
- > **Elección:** 1) Ir a casa.  ·  2) Seguir hacia el río.

## Secuencias de la historia (capítulos, transiciones, final)
_Archivo: src/story/chapters.js. Cada una la dispara una escena o un objeto en el momento indicado por su nombre._

### `prologue`
- [Rótulo] Limehouse — Octubre de 1866
- [→ Escena: foreshore]
- *Thomas (piensa):* Nat no llegó a cumplir diez años.
- *Thomas (piensa):* Si el río puede devolver un barco, puede devolver algo más.
- [Objetivo] Buscar el barquito de Nat en el barro, junto al embarcadero.

### `c1`
- [Rótulo] Buck's Row — Whitechapel, 31 de agosto de 1888
- [→ Escena: room]
- **Voz al otro lado de la puerta:** ¡Inspector Ashgrove! El sargento Pike le manda llamar. Han encontrado a una mujer en Buck's Row.
- **Thomas:** Voy.
- [Objetivo] Coger el abrigo, las botas y la linterna, y salir hacia Buck's Row.

### `c2`
- [Documento] RECORTE DE PRENSA — SEPTIEMBRE DE 1888 El 31 de agosto, una compañera del asilo de Lambeth reconoció a la mujer de Buck's Row: Mary Ann Nichols, a quien llamaban «Polly». Tenía cinco hijos. La noche del crimen no reunió los cuatro peniques de la cama; dijo a la encargada que volvería pronto con el dinero, y que se fijaran en su sombrero nuevo.
- [Rótulo] El delantal de cuero — 29 Hanbury Street, 8 de septiembre de 1888
- [→ Escena: hanbury]

### `c3`
- [Rótulo] Tinta roja — Thrawl Street, noche del 24 de septiembre de 1888
- [→ Escena: room]
- *Thomas (piensa):* No quiero otra mañana como aquella.
- [Objetivo] Terminar los informes en el escritorio.

### `c4`
- [Rótulo] Octubre — Ningún nuevo crimen con la misma firma. Los rumores, en cambio, no descansan.
- [Rótulo] Duermo de día. De noche camino. Pike ya no me saluda.
- [Documento] RECORTE DE PRENSA — OCTUBRE DE 1888 En la investigación de Berner Street, una compañera de pensión reconoció a la víctima: Elizabeth Stride, a quien llamaban «Long Liz», nacida cerca de Gotemburgo. Antes, otra mujer había jurado que era su hermana; se demostró que se equivocaba. En el caso de Mitre Square, John Kelly reconoció a su compañera, Catherine Eddowes. Había vuelto días antes de la recogida del lúpulo en Kent. Esa noche, al salir de la comisaría de Bishopsgate, ella había dado el nombre de Mary Ann Kelly.
- [Rótulo] Huésped — London Hospital, 8 de noviembre de 1888
- [Objetivo] Encontrar pruebas contra Greaves en su consulta: el cajón, la vitrina. | Encontrar lo que Greaves sabe de mí: el cajón, la vitrina.
- [→ Escena: greaves]

### `prologueBoat`
- [Objetivo] Acercarse al río.
- _Si second() && !flag('s2_prologue'):_
  - *Thomas (piensa):* En el agua hay un hombre con bombín. No se agacha conmigo.

### `prologueWater`
- _Si !flag('boat'):_
  - *Thomas (piensa):* No. Primero el barco.
- **La voz (la voz):** _Thomas._
- *Thomas (piensa):* ¿Nat?
- **La voz (la voz):** _Tommy. Estoy aquí abajo. Tengo frío._
- > **Elección:** 1) «Aquí estoy».  ·  2) Guardar silencio.
- _Si !answered:_
  - **La voz (la voz):** _Solo tienes que decirlo._
  - > **Elección:** 1) «Aquí estoy».  ·  2) Seguir callado.
- _Si answered:_
  - **Thomas:** Aquí estoy.
  - **La voz (la voz):** _Ya lo sé._
- [Rótulo] El Huésped — Hospes (lat.): el que recibe y el que es recibido.

### `leaveRoomC1`
- [→ Escena: bucks_row]

### `takeScalpel`
- [+ Objeto: bisturi]
- [+ Pista al cuaderno: bisturi]
- *Thomas (piensa):* Mango de ébano. Marca del London Hospital.
- **Wren:** No lo oiga dos veces, señor. Si el agua dice su nombre, déjela hablando sola.
- > **Elección:** 1) ¿Por qué me dices eso?  ·  2) Son cuentos de ribereños.
- _Si c === 0:_
  - **Wren:** Porque anoche la oí hablar desde la rejilla. No era agua corriente. _(1ª lectura)_
  - **Wren:** Porque usted ya le contestó una vez. _(2ª lectura)_
- _Si no:_
  - **Wren:** Si prefiere no creerme, tampoco voy a cobrarle por eso.
- [+ Pista al cuaderno: regla]
- *Thomas (piensa):* Un bisturí del London Hospital, a dos pasos de ella.

### `c1Objective`
- _Si !gate.ok:_
  - [Objetivo] {gate.missing[0].replace(/^./, (m) => m.toUpperCase())}.
- [Objetivo] Cuando quiera: cerrar la noche con Pike en Buck's Row, o con Brennan en el desolladero.

### `closeC1`
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - Brennan: hay que vigilarlo. _(si hasClue('brennan_zurdo'))_
  - Brennan: no hay nada contra él.
- _Si who === 'pike':_
  - **Pike:** Lo vigilaremos. Con cuidado: aquí se cuelga a la gente por menos. _(para "suspect")_
  - **Pike:** Lo apunto así. Será el único que lo escriba esta semana. _(para "clear")_
  - **Pike:** Prudente. El barrio no lo será. _(para "unsure")_

### `beats`
- [Documento] DIVISIÓN J (BETHNAL GREEN) — RONDAS · copia a la H Noche del 30 al 31 de agosto de 1888 Remitida a Whitechapel: la H pide las rondas de la noche por lo de George Yard. PC 97J Neil. Buck's Row, Brady Street, Baker's Row. Vuelta de media hora: pasa ante el portón del establo a las y cuarto y a menos cuarto. PC 96J Thain. Brady Street. A las y media se detiene en la esquina de Buck's Row y alumbra la calle con la linterna. PC 55H Mizen. Baker's Row y Hanbury Street. Desde su punto no se ve Buck's Row. Declaraciones: Thain alumbró Buck's Row a las 3:30; no había nada en el suelo. Charles Cross, carretero, entró en la calle hacia las 3:40 y la encontró delante del portón. {two('Firmado: el inspector de guardia', 'Firmado: T. Ashgrove, inspector de guardia')}
- _Si knowsPuzzles(G):_
  - > **Elección:** 1) Ya lo sé: de 3:30 a 3:40.  ·  2) Leer la hoja otra vez.
  - _Si k === 0:_
    - [+ Pista al cuaderno: ronda]
    - *Thomas (piensa):* Yo firmé estas rondas.
- *Thomas (piensa):* ¿En qué intervalo quedó el portón fuera de vista?
- > **Elección:** 1) Entre las 3:15 y las 3:45: entre dos pasadas de Neil.  ·  2) Entre las 3:15 y las 3:30.  ·  3) Entre las 3:30 y las 3:40.  ·  4) Entre las 3:40 y las 3:45.  ·  5) Mirar otra vez la hoja.
- *Thomas (piensa):* No. A las 3:30 Thain alumbró la calle desde Brady Street, y no había nadie en el suelo. _(vez 1)_
- *Thomas (piensa):* Entonces Thain la habría visto al alumbrar a las 3:30. No había nada. _(vez 2)_
- *Thomas (piensa):*  _(vez 3)_
- *Thomas (piensa):* A las 3:40 ya estaba muerta: Cross la encontró. _(vez 4)_
- _Si misses === perception.beatsHelpAfter(state.sanity):_
  - *Thomas (piensa):* Lo que importa son dos horas: cuándo alumbró Thain la calle vacía, y cuándo llegó Cross y la encontró.
- [+ Pista al cuaderno: ronda]
- *Thomas (piensa):* De 3:30 a 3:40, si las horas son buenas.
- _Si second():_
  - *Thomas (piensa):* Yo firmé estas rondas.

### `endC1`
- _Si who === 'brennan' && actor('Brennan'):_
  - **Brennan:** Si va a decir algo, inspector, dígalo mirándome. _(si state.flags.brennan_stance === 'suspect')_
  - **Brennan:** Váyase a dormir, inspector. Tiene cara de no haberlo hecho. _(si no)_
  - *Thomas (piensa):* Un matarife a cien yardas. Un bisturí de mi viejo hospital. Faltan hechos.
  - **Wren:** No fue él.
  - **Thomas:** ¿Cómo lo sabes?
  - **Wren:** Anoche seguía aquí. Yo estaba junto al río. _(1ª lectura)_
  - **Wren:** Él no huele al Ditch. _(2ª lectura)_
- _Si no:_
  - _Si pike:_
    - **Pike:** Las cuatro y cincuenta y ocho. Ya está, señor.
  - *Thomas (piensa):* Un bisturí de mi viejo hospital. Faltan hechos.

### `leaveHanbury`
- [Documento] 27 Fournier Street Inspector Ashgrove: Los muertos piden hablar con usted. No suelen pedir a nadie por su nombre. Esta noche, a las once. Traiga lo que lleva en el bolsillo. — O. Wexley
- [Rótulo] Esa misma noche — Fournier Street, Spitalfields
- [Objetivo] Averiguar qué quiere Madame Wexley.
- [→ Escena: seance]

### `seance`
- _Si !onTable:_
  - **Madame Wexley:** No hace falta tocarlo. Descríbamelo.
  - **Thomas:** Un peine de bolsillo. Dos púas rotas. Estaba apartado de sus otras cosas.
- **Madame Wexley:** Pongan las manos en la mesa. No suelten a nadie.
- **Madame Wexley:** Hay una mujer... No. Alguien se ha puesto delante.
- **Madame Wexley (la voz):** _Tommy._
- *Thomas (piensa):* Nat me llamaba Tommy. Nadie más.
- **Madame Wexley (la voz):** _Dejaste de buscarme, Tommy._
- **Madame Wexley (la voz):** _¿Te acuerdas de lo que dijiste?_
- [+ Pista al cuaderno: nat_voz]
- _Si !flag('answered1866'):_
  - *Thomas (piensa):* Yo no contesté en Limehouse. ¿A qué noche se refiere?
- **Joven:** ¿Quién demonios es Tommy?
- **Madame Wexley (la voz):** _No hace falta que me busques. Ya te encontré._
- **Madame Wexley:** ¡No! ¡No me mire a mí! ¡Mire detrás de usted!
- [Visión: nichols]
- _Si hasClue('hospes'):_
  - *Thomas (piensa):* HOSPES. El que entra en una casa. Y el que lo recibe.
- **Madame Wexley:** No voy a volver a abrir la boca con usted aquí.
- [+ Pista al cuaderno: alguien_detras]
- *Thomas (piensa):* Había alguien detrás de mí. O lo vio Wexley. O quiso que yo lo creyera.
- [Objetivo] Salir a Fournier Street. | Leer los golpes de la mesa. En la pared había una tabla de letras.

### `tableKnocks`
- _Si w:_
  - **Madame Wexley:** Yo no he empezado. ¿Lo ha oído usted también?
- *Thomas (piensa):* Seis grupos de golpes, dos a dos. Los apunto.
- [Objetivo] Leer los golpes con la tabla de letras de la pared (en la mesa). | Leer los golpes. En la pared, bajo la carta astral, hay algo con letras.

### `raps`
- _Si w:_
  - **Madame Wexley:** Fila y columna. Me lo enseñó un preso de Odesa. Hache. O. Ese. Lo demás, léalo usted.
- _Si knowsPuzzles(G) && flag('knock_board'):_
  - > **Elección:** 1) Ya sé lo que dicen: HOSPES.  ·  2) Leerlos otra vez.
  - _Si k === 0:_
    - [+ Pista al cuaderno: hospes]
- _Si !res.ok:_
  - *Thomas (piensa):* Más tarde. Fila y columna; tiene que salir algo. _(si flag('knock_board'))_
  - *Thomas (piensa):* Sin la tabla de la pared no hay manera de leerlos. _(si no)_
- [+ Pista al cuaderno: hospes]
- *Thomas (piensa):* HOSPES. Latín. El huésped.

### `afterRaps`
- _Si second():_
  - _Si w:_
    - **Madame Wexley:** No le hablan a un muerto, inspector. Le hablan a usted.
- _Si !flag('seance_done'):_
  - [Objetivo] Sentarse a la mesa de la sesión. | Poner el peine de Annie sobre la mesa.
- _Si no:_
  - [Objetivo] Salir a Fournier Street.

### `pikeBook`
- [Documento] Libreta del sargento A. Pike 7 ago. — Tabram, George Yard. Avisado el inspector a las 3:10. Llega a las 3:20. Botas mojadas. 31 ago. — Buck's Row. Avisado a las 4:00. Llega a las 4:12. Botas mojadas. Barro negro. Llega siempre antes de lo que tarda en venir desde Thrawl Street.
- *Thomas (piensa):* Doce minutos. Diez. No venía de mi cuarto.

### `leaveSeance`
- [Rótulo] 10 de septiembre — Winthrop Street, de noche
- [→ Escena: knackers]

### `mobScene`
- **Vecinos:** ¡Leather Apron! ¡Que salga el matarife!
- **Brennan:** ¡Pregúntenle a los del turno! ¡He trabajado toda la noche!
- **Un hombre:** ¡Usted lo ha investigado! ¿Es él o no?
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - Pedir que se disperse la multitud.
  - Ordenar que lo escolten a salvo.
- _Si outcome === 'severe':_
  - **Thomas:** Queda detenido, Brennan. ¡Retírense!
  - _Si flag('amelia1'):_
    - *Thomas (piensa):* El delantal lo lavó la señora Richardson. Era de su hijo. Lo sabía.
- _Si no:_
  - _Si outcome === 'injured':_
    - **Thomas:** ¡Basta! ¡Nadie aquí puede demostrar nada!
  - _Si no:_
    - **Thomas:** ¡Pike! Sáquelo por detrás. Yo los entretengo.
    - **Pike:** Vamos, Silas. No se detenga.
- _Si outcome === 'protected':_
  - **Wren:** Lo ha sacado de ahí. No pensé que un policía lo haría.
  - > **Elección:** 1) Era lo que había que hacer.  ·  2) (No decir nada)
- _Si no:_
  - **Wren:** Usted sabía que no tenía nada contra él. _(si outcome === 'severe')_
  - **Wren:** Lo dijo tarde. Ya le habían dado. _(si no)_
  - > **Elección:** 1) Lo sospechaba. | No me dejaron.  ·  2) (No decir nada)
  - _Si r === 0:_
    - **Wren:** Sospechar no es saber, señor. _(si outcome === 'severe')_
    - **Wren:** Ya. _(si no)_
- [Rótulo] Esos días detuvieron a John Pizer, a quien el barrio llamaba «Leather Apron». Tenía coartada y lo soltaron.
- [Rótulo] Brennan regresó a su trabajo. Nunca volvió a hablar con la policía. | Brennan no volvió al desolladero.

### `writeC3a`
- _Si second():_
  - **La voz (la voz):** _Escribe, Tommy. Con la otra tinta._
- [+ Pista al cuaderno: dedos]
- *Thomas (piensa):* Faltan tres pliegos de papel. _(1ª lectura)_
- *Thomas (piensa):* Faltan tres pliegos. Los usé yo. _(2ª lectura)_
- [Objetivo] Acostarse.

### `sleepC3a`
- [Rótulo] Los días siguientes apenas duermo.
- [Rótulo] 30 de septiembre — 1:46 de la madrugada
- [Objetivo] Entrar en Mitre Square.
- [→ Escena: mitre]

### `toGoulston`
- [Objetivo] Buscar el trozo de delantal.
- [→ Escena: goulston]

### `caught`
- **Agente Long:** ¡Eh! ¡Usted! ¡Quieto ahí!
- > **Elección:** 1) "¡Soy inspector de la División H!"  ·  2) (Correr)
- _Si c === 0:_
  - **Thomas:** ¡Soy inspector de la Div...!
  - **Agente Long:** Abrigo oscuro, bombín y linterna de policía... ¡Es él! ¡ES ÉL!
- [→ Escena: alleys]

### `endChase`
- **La voz (la voz):** _Bien, Tommy._
- _Si outcome === 'injured':_
  - *Thomas (piensa):* Me he abierto la mano en la tapia de Wentworth Street. No sé cuándo.
- _Si no:_
  - _Si outcome === 'spotted':_
    - *Thomas (piensa):* El agente de la linterna me vio la cara. Un momento. Bastó.
- [→ Escena: room]
- [Objetivo] Leer el periódico. Mirar debajo de la cama.

### `readPaper`
- [Documento] THE DAILY NEWS — 1 de octubre de 1888 LOS CRÍMENES DEL EAST END. LA CARTA FIRMADA «JACK THE RIPPER». Una carta fechada el 25 de septiembre, matasellada y recibida por la Central News Agency el 27, circula ahora entre los investigadores y la prensa. Escrita con tinta roja, menciona al «Leather Apron» y reivindica los crímenes: "I keep on hearing the police have caught me but they wont fix me just yet... That joke about Leather Apron gave me real fits..." Yours truly / Jack the Ripper {{ spotted: 'Un agente persiguió de madrugada a un hombre de abrigo oscuro por Wentworth Street. Asegura que podría reconocerlo.', injured: 'Un agente persiguió de madrugada a un hombre de abrigo oscuro por Wentworth Street. El fugitivo dejó sangre en una tapia; el agente asegura que podría reconocerlo.' }[state.flags.chase_outcome] || ''}
- [+ Pista al cuaderno: carta]
- *Thomas (piensa):* Fechada el 25. La noche que perdí. _(1ª lectura)_
- *Thomas (piensa):* Fechada el 25. Faltaban tres pliegos en mi mesa. _(2ª lectura)_
- _Si !second():_
  - *Thomas (piensa):* Puede que la haya inventado un periodista. Una carta así vende periódicos.
- _Si second():_
  - **La voz (la voz):** _Jack._
- *Thomas (piensa):* Esa letra la he visto antes. En el escritorio tengo letras de todos.
- _Si bo === 'severe':_
  - *Thomas (piensa):* Brennan sigue sin poder trabajar. No he rectificado la acusación.
- _Si no:_
  - _Si bo === 'injured':_
    - *Thomas (piensa):* Brennan perdió su trabajo. Nadie lo ha rectificado. Yo tampoco.

### `c3bObjective`
- [Objetivo] {`${left.join('; ')}.`.replace(/^./, (m) => m.toUpperCase())} | Salir.

### `compareHands`
- [Documento] Copia de la carta que circula entre los inspectores y cuatro escrituras La copia de la carta, sin la letra del original: "Dear Boss... Yours truly, Jack the Ripper" La nota de Madame Wexley:Mano redondeada y espaciada. "Los muertos piden hablar con usted..." Un informe del sargento Pike, con mis correcciones en rojo:Letra cerrada y recta. "Ronda sin novedad. Las farolas de Buck's Row siguen sin gas..." La receta del láudano, del doctor Greaves:Letras unidas, la J con una cola larga, el remate de las t muy corto. "Tinctura opii. Veinte gotas al acostarse. — L. G." El recibo del desolladero de Barber, de Silas Brennan:"X — su marca" {two('', 'Mis apuntes de anatomía, cuarto curso, 1878:La misma J, las mismas t. "Carótida: corre junto a la tráquea..."')}
- *Thomas (piensa):* Esa J. Esas t. Las conozco.
- > **Elección:** 1) Madame Wexley.  ·  2) Pike.  ·  3) Greaves: se parece a la suya.  ·  4) Brennan.  ·  5) {...(second() ? ['La mía.'] : [])}  ·  6) La muestra no basta. Necesito más pruebas.  ·  7) Revisar las muestras.
- _Si pick.startsWith('Greaves'):_
  - *Thomas (piensa):* Es una escritura parecida. No es una identificación.
- _Si pick === 'La mía.':_
  - *Thomas (piensa):* Es mi propia letra. Copié a Greaves años atrás.
- _Si pick.startsWith('La muestra'):_
  - *Thomas (piensa):* Una copia y cuatro letras de mi mesa. Con esto no se acusa a nadie.
- *Thomas (piensa):* No coincide con Wexley. _(para "Madame Wexley.")_
- *Thomas (piensa):* No coincide con Pike. Sus notas sí llevan mis correcciones. _(para "Pike.")_
- *Thomas (piensa):* Brennan firmó con una cruz. No hay muestra suficiente. _(para "Brennan.")_
- [+ Pista al cuaderno: letra]

### `leaveRoomC3b`
- _Si !hasClue('letra'):_
  - *Thomas (piensa):* Necesito comparar la carta antes de salir.
- _Si !hasClue('estuche'):_
  - *Thomas (piensa):* El estuche bajo la cama. Falta una pieza.

### `readFile`
- [Documento] LONDON HOSPITAL — EXPEDIENTE CLÍNICO Paciente: T. A., estudiante de cuarto año. 14 de marzo de 1879. Dr. L. Greaves. Hallado a las cuatro de la mañana en la sala de disección, con un bisturí en la mano izquierda. Ausencia de recuerdos sobre su llegada. El cadáver de la mesa 3 presenta incisiones ajenas al programa de prácticas. La enfermera M. Bell declaró que, esa noche, junto al lavadero, oyó al estudiante responder claramente: «Aquí estoy». El paciente recuerda haber oído agua y niega haber hablado con nadie. Su hermano menor falleció en Limehouse en 1866; el paciente tenía doce años. Impresión clínica: episodios de amnesia y desorientación; vigilar recurrencias. Anotación agregada, 1888: El cuadro se asemeja a las descripciones posteriores de fuga disociativa (Tissié, 1887). El 1 de septiembre, el sargento Pike preguntó si era posible actuar durante una laguna de memoria. Respondí que sí.
- [+ Pista al cuaderno: expediente]
- [+ Pista al cuaderno: respuesta1879]
- *Thomas (piensa):* «T. A.» No puedo seguir llamándolo una coincidencia.
- *Thomas (piensa):* En 1866 ya me oyó el agua. Esto volvió a ocurrir. _(si flag('answered1866'))_
- *Thomas (piensa):* En 1866 callé. En el hospital no. _(si no)_
- **Greaves:** La encontraste.
- _Si hand === 'greaves_like':_
  - **Greaves:** Pensaste que la carta era mía. Te enseñé a escribir así; no a firmar eso.
- _Si no:_
  - _Si hand === 'inconclusive':_
    - **Greaves:** No acusaste a nadie por una letra. Siempre fuiste prudente con las pruebas. Con las tuyas también.
  - _Si no:_
    - _Si hand === 'self_recognition':_
      - **Greaves:** Reconociste tu letra. Yo la reconocí en marzo de 1879.
- _Si state.flags.chase_outcome === 'injured':_
  - **Greaves:** Y esa mano. ¿Quién te la ha cosido?
- _Si perception.othersNotice(state.sanity):_
  - **Greaves:** No duermes. Se te ve en los ojos, Thomas.
- **Greaves:** Aquel día te hallé en la sala. No sé lo que ocurrió antes.
- **Greaves:** Pike vino a preguntarme si alguien puede actuar sin recordarlo. Le respondí que sí.
- > **Elección:** 1) Me está acusando a mí.  ·  2) ¿Y si tiene razón?  ·  3) ¿Le habló usted de Nat a Wexley?
- _Si c === 0:_
  - **Greaves:** No estoy acusándote. Te estoy pidiendo que te entregues.
- _Si no:_
  - _Si c === 1:_
    - **Greaves:** Entonces dame el bisturí.
  - _Si no:_
    - **Greaves:** No la conozco. Siempre has hablado dormido, Thomas.
- **Greaves:** Deja el bisturí sobre la mesa. Lentamente.
- [Visión: hands]
- **Greaves:** Thomas... mírame. Por favor.
- **Pike:** Thomas. Soy Pike. No voy a entrar sin avisarte.
- **Pike:** Nadie te vio en Wentworth Street. Eso es lo que más me asusta. _(para "clean")_
- **Pike:** El agente Long dice que te vio la cara en Wentworth Street. No le he contestado. _(para "spotted")_
- **Pike:** Long encontró sangre en la tapia de Wentworth Street. Y tú llevas la mano cosida. _(para "injured")_
- **Pike:** Traigo tus rondas. Tu firma. No sé aún cuánto hiciste, pero no puedo dejarte marchar.
- > **Elección:** 1) «Deténgame, Pike».  ·  2) «Proteja a Wren. La niña del río».  ·  3) (Romper el folio del expediente que me señala)
- _Si last === 0:_
  - **Thomas:** Póngame las esposas antes de que cambie de opinión.
  - **Pike:** De acuerdo. Déjame pasar.
  - **Pike:** Las manos, Thomas.
- _Si no:_
  - _Si last === 1:_
    - **Thomas:** Hay una niña. Wren. Duerme en las cajas del desolladero de Barber. Que no vuelva al Ditch.
    - **Pike:** Barber, Winthrop Street. Esta noche. Tienes mi palabra.
  - _Si no:_
    - **Pike:** Romperlo no cambia lo que sabemos. La enfermera Bell sigue viva, Thomas.
- [Rótulo] 9 de noviembre — Limehouse, 2:30 de la madrugada
- [→ Escena: foreshore]

### `finaleIntro`
- _Si tried:_
  - *Thomas (piensa):* Llevo una esposa cerrada en la muñeca derecha. La otra cuelga abierta. _(para "surrender")_
  - *Thomas (piensa):* Se lo dije a Pike: Barber, las cajas. Eso lo recuerdo. _(para "warn_wren")_
  - *Thomas (piensa):* Tengo entre los dedos un trozo de papel con la mitad de una firma. _(para "destroy_page")_
- *Thomas (piensa):* Yo abrí la puerta. _(si flag('answered1866'))_
- *Thomas (piensa):* Callé aquella noche. No la siguiente. _(si no)_
- *Thomas (piensa):* Greaves, Pike, el bisturí, la carta. Un mismo hombre.
- [+ Pista al cuaderno: ficha]
- *Thomas (piensa):* Es mi ficha. Encaja demasiado bien.
- [Objetivo] En el cuaderno: comparar mi ficha con al menos tres pruebas independientes. Una hipótesis sin prueba no cuenta.

### `outfall1888`
- _Si !canEnterFinale(state).ok:_
  - *Thomas (piensa):* Todavía no. Antes tengo que estar seguro. El cuaderno.
- **La voz (la voz):** _Ven al agua, Tommy._

### `finaleWater`
- _Si !canEnterFinale(state).ok:_
  - *Thomas (piensa):* Primero comprobaré lo que sé. No voy a contestar a ciegas.
- _Si !flag('water_before'):_
  - _Si flag('sospecha_pike') || flag('sospecha_greaves') || flag('accused'):_
    - *Thomas (piensa):* Brennan, Greaves, Pike. A todos los puse delante de mí.
  - *Thomas (piensa):* Mi letra. Mis rondas. Mi bisturí.
- **La voz (la voz):** _Thomas._
- > **Elección:** 1) Responder.  ·  2) Callar.  ·  3) Taparme la boca.  ·  4) Todavía no estoy seguro.
- _Si att === 'unsure':_
  - *Thomas (piensa):* No. Otra vez el cuaderno. Quiero estar seguro.
- _Si att === 'answer':_
  - _Si flag('answered1866'):_
    - *Thomas (piensa):* Ya lo dije una vez.
  - **Thomas:** Aquí estoy.
- _Si no:_
  - _Si att === 'silent':_
    - **Thomas:** Aquí estoy.
    - *Thomas (piensa):* No lo he dicho yo.
  - _Si no:_
    - **Thomas:** (Entre los dedos) Aquí estoy.
    - *Thomas (piensa):* La mano no baja. No es mía.
- **La voz (la voz):** _Escucha._
- *Thomas (piensa):* El mío ya no viene cuando lo llamo.
- [Visión: hands]
- **La voz (la voz):** _¿Cómo te llamabas?_
- *Thomas (piensa):* Thomas...
- [→ Escena: millers]

### `epilogue`
- **Wren:** ¡Señor! Lo busca la policía. Y los hombres que no son policía.
- _Si intent === 'warn_wren':_
  - **Wren:** Pike vino a las cajas a buscarme. Me dio su silbato. Dijo que lo tocara si usted se acercaba.
- _Si no:_
  - _Si intent === 'surrender':_
    - **Wren:** Lleva una esposa puesta. Pike va por ahí con la otra, abierta, colgando del cinturón.
  - _Si no:_
    - _Si intent === 'destroy_page':_
      - **Wren:** Lleva un papel roto en la manga. Pike tiene la otra mitad.
- _Si flag('wren_paid'):_
  - **Wren:** Su penique. Se ha puesto frío. No lo quiero.
- **Wren:** Dígame su nombre, señor. El que le puso su madre.
- **Wren:** {lead} {what}
- [Rótulo] Yours truly, Jack the Ripper — Don't mind me giving the trade name.
- [Rótulo] El 9 de noviembre de 1888, Mary Jane Kelly fue asesinada en Miller's Court. Tenía unos veinticinco años. Esa noche, una vecina la oyó cantar. Fue la última de las cinco víctimas canónicas; la identidad del asesino no quedó establecida.
- [Rótulo] Silas Brennan no volvió a andar sin bastón. Nadie le pidió perdón. | Brennan sobrevivió a la turba, pero perdió su trabajo. Nadie rectificó la acusación. | Brennan sobrevivió sin heridas aquella noche. No volvió a hablar con Thomas.
- _Si intent === 'destroy_page':_
  - [Rótulo] El expediente de 1879 se archivó con un folio roto. La enfermera Bell volvió a declarar.
- _Si no:_
  - _Si intent === 'surrender':_
    - [Rótulo] El sargento Pike guardó la esposa abierta en un cajón de la comisaría de Commercial Street.
  - _Si no:_
    - _Si intent === 'warn_wren':_
      - [Rótulo] Wren no volvió a dormir junto al Ditch.
- [Rótulo] Nadie volvió a ver al inspector Thomas Ashgrove. El Black Ditch sigue corriendo bajo el East End.
- [Rótulo] El Huésped — Fin

## El cuaderno: objetos, pistas y deducciones
_Archivo: src/story/data.js. `text` es lo que se lee en la primera partida; `text2` y `truth2`, lo que cambia o se añade en la segunda lectura._

### Objetos

**`penique`**
- Nombre: Penique
- Al examinarlo en el inventario:
  - *Thomas (piensa):* Un penique con la cara de la reina gastada de tanto pasar de mano en mano.

**`bisturi`**
- Nombre: Bisturí
- Al examinarlo en el inventario:
  - *Thomas (piensa):* Acero de Weiss, mango de ébano. Grabado en la virola: LONDON HOSPITAL — SALA DE DISECCIÓN.
  - _Si flag('awake'):_
    - *Thomas (piensa):* Mis iniciales están raspadas, pero sigue notándose la T.
  - _Si no:_
    - *Thomas (piensa):* Hay un rasguño en el mango, como si alguien hubiera borrado unas iniciales.

**`peine`**
- Nombre: Peine de Annie
- Al examinarlo en el inventario:
  - *Thomas (piensa):* Un peine de bolsillo con dos púas rotas. Estaba en el patio, colocado junto a sus otras cosas.
  - *Thomas (piensa):* Tendría que haberlo dejado con las pruebas, pero me lo guardé sin pensarlo.

**`tinta`**
- Nombre: Tinta roja
- Al examinarlo en el inventario:
  - _Si flag('tinta_vacia'):_
    - *Thomas (piensa):* Casi vacío. Lo compré hace una semana.
  - _Si no:_
    - *Thomas (piensa):* Tinta roja, para corregir los informes de los sargentos.

**`placa`**
- Nombre: Placa de inspector
- Al examinarlo en el inventario:
  - *Thomas (piensa):* Policía Metropolitana, División H. Inspector T. Ashgrove. Mis iniciales están casi borradas por el roce.

**`llave`**
- Nombre: Llave de latón
- Al examinarlo en el inventario:
  - *Thomas (piensa):* Una llave pequeña de latón. Estaba en el cajón de Greaves.

### Pistas

**`botas`**
- Dónde: Mi cuarto · 31 ago
- Texto: Me desperté con las botas empapadas y cubiertas de barro negro. Anoche las dejé secas junto a la puerta.
- Texto (2ª lectura): Me desperté con las botas empapadas y cubiertas de barro negro. No recuerdo haber salido.
- Verdad (2ª lectura): Salí con ellas. Fui hasta Buck's Row y volví.

**`ventana`**
- Dónde: Mi cuarto · 31 ago
- Texto: La ventana estaba entornada y había barro negro en el alféizar. Anoche la cerré yo.
- Verdad (2ª lectura): La abrí yo, desde dentro. Por la escalera me habría oído la señora Pell.

**`laudano`**
- Dónde: Mi cuarto · 31 ago
- Texto: El frasco de láudano está casi vacío. Lo compré el martes.
- Verdad (2ª lectura): Lo bebo para no oír el agua. Ya no sirve.

**`ronda`**
- Dónde: Buck's Row · la hoja de rondas
- Texto: Según la hoja, Thain alumbró la calle hacia las 3:30 y Cross llegó hacia las 3:40. Son horas de testimonio, no de reloj: la ventana es aproximada.
- Verdad (2ª lectura): La hoja de rondas la firmé yo.

**`silencio`**
- Dónde: Buck's Row
- Texto: Nadie oyó nada. La señora Green dormía a tres metros, detrás de esa ventana.
- Verdad (2ª lectura): No gritó. Un policía no da miedo.

**`zurdo`**
- Dónde: Buck's Row · Dr. Llewellyn
- Texto: Según el forense, los cortes van de izquierda a derecha y podrían ser obra de un zurdo.
- Verdad (2ª lectura): Escribo con la izquierda.

**`anatomia`**
- Dónde: Buck's Row · Dr. Llewellyn
- Texto: El forense cree que el asesino tenía alguna noción, tosca, de anatomía.
- Verdad (2ª lectura): Cuatro años en la sala de disección.

**`huellas`**
- Dónde: Buck's Row
- Texto: Huellas de barro negro, barro de río, que se alejan hacia Winthrop Street.
- Verdad (2ª lectura): Del Ditch a Buck's Row, y de Buck's Row a mi puerta.

**`brennan_zurdo`**
- Dónde: Desolladero de Barber
- Texto: Silas Brennan afila el cuchillo con la mano izquierda. Lleva delantal de cuero.
- Verdad (2ª lectura): Era zurdo, como yo. Me bastó.

**`bisturi`**
- Dónde: Wren
- Texto: Wren encontró un bisturí en la alcantarilla de Buck's Row. Lleva el sello del London Hospital.
- Verdad (2ª lectura): Es el que falta en mi estuche.

**`cuello`**
- Dónde: Buck's Row · el cuerpo
- Texto: Dos cortes en el cuello, de un lado a otro, hasta el hueso. No tiene heridas en las manos: no se defendió.
- Verdad (2ª lectura): Como nos enseñaron en la sala de disección.

**`regla`**
- Dónde: Wren
- Texto: "Si el agua dice su nombre, no responda." Es lo que dicen los ribereños del Támesis.
- Verdad (2ª lectura): Si callé en 1866, respondí en 1879. La regla no falló.

**`delantal`**
- Dónde: 29 Hanbury St. · 8 sep
- Texto: Un delantal de cuero mojado junto al grifo del patio. Los periódicos ya hablan de "Leather Apron".
- Verdad (2ª lectura): Era del hijo de la casera. Lo supe y me callé.

**`ordenados`**
- Dónde: 29 Hanbury St.
- Texto: Sus pocas pertenencias estaban colocadas en fila a sus pies, con cuidado, como el instrumental en una mesa de disección.
- Verdad (2ª lectura): Como en la mesa 3, en 1879.

**`greaves_sabe`**
- Dónde: Dr. Greaves
- Texto: Greaves sabía que duermo mal y que he vuelto al láudano. Nunca se lo he contado a nadie.
- Verdad (2ª lectura): Lo sabe porque me trató.

**`anillos`**
- Dónde: 29 Hanbury St. · el cuerpo
- Texto: Había señales de que llevaba otros dos anillos de latón junto al que conserva. Las marcas siguen ahí. No estaban entre sus cosas.
- Verdad (2ª lectura): Nunca aparecieron.

**`falta`**
- Dónde: 29 Hanbury St. · el cuerpo
- Texto: Le abrieron el vientre y se llevaron algo de dentro, con cortes limpios, de quien sabe lo que busca.
- Verdad (2ª lectura): Sabía dónde buscar.

**`reflejo`**
- Dónde: 29 Hanbury St.
- Texto: En el cristal de la ventana vi a alguien detrás de mí. Cuando me giré no había nadie.
- Verdad (2ª lectura): Era yo. El del cristal no se giró conmigo.

**`alguien_detras`**
- Dónde: Madame Wexley
- Texto: "Hay alguien detrás de usted, inspector. Siempre ha estado ahí."
- Verdad (2ª lectura): Dentro. No detrás.

**`nat_voz`**
- Dónde: Sesión de espiritismo
- Texto (2ª lectura): La voz habló como Nat. Sabía lo del foreshore. Sabía lo que contesté.
- Verdad (2ª lectura): La voz conocía mi respuesta. Si no fue en 1866, fue en 1879.

**`hospes`**
- Dónde: Sesión de espiritismo
- Texto: En la oscuridad, la mesa golpeó una palabra latina: HOSPES. El que recibe y el que es recibido; el anfitrión y el huésped.
- Verdad (2ª lectura): Me lo decía a mí. Yo soy la casa.

**`dedos`**
- Dónde: Mi cuarto · 25 sep
- Texto: Me desperté sobre el escritorio a las 3:15. El tintero rojo estaba volcado, la ventana abierta y faltaban tres pliegos de papel de cartas.
- Texto (2ª lectura): Me desperté sobre el escritorio a las 3:15, con los dedos de la mano izquierda manchados de rojo. El tintero de tinta roja estaba casi vacío.
- Verdad (2ª lectura): La ventana la abrí yo, al volver.

**`llave_pike`**
- Dónde: Mi cuarto · 25 sep
- Texto: La puerta estaba cerrada con llave. Solo hay otra llave de este cuarto: la que guarda Pike, por si me necesitan de noche.
- Verdad (2ª lectura): Pike nunca la usó.

**`rapido`**
- Dónde: Mitre Square · 30 sep
- Texto: El agente de la City me preguntó cómo había llegado tan rápido. Él la había encontrado hacía cuatro minutos.
- Verdad (2ª lectura): Llegué antes porque no me había ido.

**`trozo`**
- Dónde: Mitre Square
- Texto: Falta un trozo del delantal de la víctima, cortado a cuchillo.
- Verdad (2ª lectura): Lo corté para limpiarme las manos.

**`marcas`**
- Dónde: Mitre Square · el cuerpo
- Texto: Cortes en los párpados y una V en cada mejilla. No sirven para matar. Son una firma.
- Verdad (2ª lectura): Las hice despacio.

**`guantes`**
- Dónde: Mitre Square
- Texto: Le busqué el pulso. Al levantarme, mis guantes estaban pegajosos de su sangre.
- Texto (2ª lectura): Al levantarme del cuerpo, mis guantes estaban pegajosos. Y la sangre del dorso ya estaba seca.
- Verdad (2ª lectura): Cuando Watkins la encontró, la sangre de mis guantes ya se había secado.

**`goulston_historic`**
- Dónde: Goulston St. · informe

**`aqui_estoy`**
- Dónde: Goulston St.
- Texto (2ª lectura): En la pared mojada creí leer HERE I AM. Es lo que yo contesté al agua.
- Verdad (2ª lectura): Con mi letra inclinada.

**`testigo`**
- Dónde: Mitre Square
- Texto: Un testigo vio a un hombre con abrigo oscuro y bombín que llevaba una linterna "como las de la policía".
- Verdad (2ª lectura): Como yo.

**`berner_aviso`**
- Dónde: Mitre Square · aviso
- Texto: Berner Street, hacia la una: una mujer en el patio de un club, garganta cortada. Sin nombre todavía.

**`carta`**
- Dónde: Prensa · 1 oct
- Texto: Una carta fechada el 25 y recibida por la Central News el 27 circula bajo la firma «Jack the Ripper». Según el periódico, está escrita con tinta roja.
- Verdad (2ª lectura): La escribí durante las horas perdidas de la noche del 24 al 25.

**`letra`**
- Dónde: La carta
- Texto: El remate de la J y la unión de las t recuerdan a la receta de Greaves. La semejanza no prueba autoría.
- Verdad (2ª lectura): Mis apuntes de anatomía tienen los mismos gestos: Greaves me enseñó a escribir así.

**`estuche`**
- Dónde: Mi cuarto · 1 oct
- Texto: Mi viejo estuche de disección, debajo de la cama. Falta un bisturí.
- Verdad (2ª lectura): No me lo robaron.

**`expediente`**
- Dónde: Dr. Greaves
- Texto: Expediente «T. A.», 1879: episodios de amnesia. Lo hallaron en la sala de disección con un bisturí; una enfermera oyó «Aquí estoy» junto al lavadero. Una nota posterior de 1888 compara el cuadro con la fuga disociativa.

**`respuesta1879`**
- Dónde: Expediente · 1879
- Texto: La enfermera Bell oyó «Aquí estoy» durante la laguna de 1879, junto al lavadero.
- Verdad (2ª lectura): Si callé en 1866, aquella noche no callé.

**`ficha`**
- Dónde: Yo
- Texto: Thomas Ashgrove. 34 años. Zurdo. Cuatro años de medicina en el London Hospital. Inspector de la División H. Vive junto al Black Ditch.

### Deducciones (unir dos pistas)

**`d_ronda`**
- Une las pistas: `ronda` + `silencio`
- Rasgo del perfil: Conoce las rondas de la policía
- Texto: Las horas declaradas dejan un hueco de unos diez minutos. Tal vez conocía las rondas; la precisión también admite el azar.

**`d_zurdo`**
- Une las pistas: `zurdo` + `anatomia`
- Rasgo del perfil: Quizá zurdo, quizá con nociones de anatomía
- Texto: Si el forense acierta, un zurdo que sabe dónde cortar: un matarife, un carnicero... o un médico. Técnica no es lo mismo que estudios.

**`d_barro`**
- Une las pistas: `botas` + `ventana`
- Texto: Las botas estaban mojadas y la ventana abierta. ¿Alguien pasó por aquí durante la noche? ¿Cómo se explica el barro?
- Verdad (2ª lectura): Nadie entra. Salgo yo.

**`d_brennan`**
- Une las pistas: `brennan_zurdo` + `zurdo`
- Texto: Brennan coincide con la lateralidad atribuida al asesino y trabaja cerca. Su coartada requiere verificación. No es prueba de culpabilidad.
- Verdad (2ª lectura): Brennan es zurdo. Yo también.

**`d_bisturi`**
- Une las pistas: `bisturi` + `anatomia`
- Rasgo del perfil: Formación médica (London Hospital)
- Texto: Un bisturí de la sala de disección del London Hospital. Quien lo perdió estudió allí.

**`d_delantal`**
- Une las pistas: `delantal` + `brennan_zurdo`
- Texto: El delantal del patio se parece al de Brennan. No sé de quién es; un parecido no es un vínculo.
- Verdad (2ª lectura): El delantal era del hijo de la casera; ella misma lo había lavado. Brennan no tenía nada que ver, y yo lo sabía.

**`d_ordenados`**
- Une las pistas: `ordenados` + `anatomia`
- Rasgo del perfil: Metódico: trata a la víctima como a un paciente
- Texto: No es furia, es método. La trata como a un paciente en la mesa de disección.

**`d_greaves`**
- Une las pistas: `greaves_sabe` + `alguien_detras`
- Texto: Greaves sabe de mi pasado y Wexley habló con la voz de Nat. ¿Hubo intercambio de información o una causa que no comprendo?
- Verdad (2ª lectura): Nadie le habló de Nat a Wexley. La voz se lo dijo.

**`d_nat`**
- Une las pistas: `nat_voz` + `regla`
- Rasgo del perfil: Ronda el río
- Texto: La voz del agua dice nombres en la orilla, donde sale el Ditch. Quien la oye y contesta, cambia.

**`d_hospes`**
- Une las pistas: `hospes` + `regla`
- Texto: El agua llama, alguien contesta, y desde entonces hay un anfitrión y un huésped. Wexley no hablaba de espíritus: hablaba del Ditch.

**`d_rojo`**
- Une las pistas: `dedos` + `carta`
- Texto: Según el periódico, la carta fechada el 25 está escrita en rojo. La misma madrugada faltaron hojas de mi escritorio. Es posible que se escribiera aquí.
- Verdad (2ª lectura): Escribí esa carta. Le di un nombre.

**`d_pike`**
- Une las pistas: `llave_pike` + `testigo`
- Texto: Pike tiene una llave, viste como el testigo describe y registra mis horarios. También podría estar investigándome. ¿Qué explicación encaja con los hechos?
- Verdad (2ª lectura): Pike apuntaba dónde estaba yo porque tenía miedo de saberlo.

**`d_letra`**
- Une las pistas: `letra` + `greaves_sabe`
- Texto: La letra recuerda la de Greaves y él conoce mi historial. Tengo motivos para preguntarle por el pasado, no pruebas de que redactara la carta.
- Verdad (2ª lectura): Escribo como él porque me enseñó él.

**`d_rapido`**
- Une las pistas: `rapido` + `ronda`
- Rasgo del perfil: Llega a las escenas antes que la policía
- Texto: Siempre está cerca. Llega antes que nadie.

**`d_testigo`**
- Une las pistas: `testigo` + `trozo`
- Rasgo del perfil: Abrigo oscuro, bombín, linterna de policía
- Texto: El testigo describe un abrigo oscuro, un bombín y una linterna similar a la policial. El trozo del delantal fue hallado después; no sabemos quién lo dejó.

**`d_estuche`**
- Une las pistas: `estuche` + `bisturi`
- Texto: Un bisturí idéntico al del estuche faltante apareció junto a Buck's Row. No sé quién lo sacó de mi cuarto.
- Verdad (2ª lectura): No me lo robaron. Wren lo sacó de la alcantarilla de Buck's Row.

**`d_aqui`**
- Une las pistas: `aqui_estoy` + `nat_voz`
- Rasgo del perfil: Le respondió al agua
- Texto: Lo que creí leer en Goulston Street repite la frase de la voz. Es un vínculo sugestivo, no una prueba de quién escribió nada.

**`d_confianza`**
- Une las pistas: `cuello` + `silencio`
- Rasgo del perfil: Ella no le tuvo miedo
- Texto: No hubo gritos ni arañazos defensivos según los testigos y el examen. Puede que el atacante se acercara sin despertar alarma; un uniforme explicaría esa confianza, pero no la prueba.
- Verdad (2ª lectura): No me tuvo miedo. Le enseñé la placa.

**`d_trofeo`**
- Une las pistas: `anillos` + `falta`
- Rasgo del perfil: Se lleva recuerdos
- Texto: Los anillos, y lo que le sacó del vientre. Se lleva algo de cada una.

**`d_firma`**
- Une las pistas: `marcas` + `ordenados`
- Rasgo del perfil: Firma su trabajo
- Texto: Las cosas en fila, las marcas en la cara: quiere que se sepa que es el mismo, y que lo hace con calma.

**`d_guantes`**
- Une las pistas: `guantes` + `rapido`
- Texto: Los guantes se mancharon al tocar el cuerpo; el origen y la antigüedad de la sangre necesitan comprobarse.
- Verdad (2ª lectura): La sangre de mis guantes ya estaba seca cuando Watkins la encontró.

**`f_zurdo`**
- Une las pistas: `ficha` + `zurdo`
- Texto: El forense creyó ver a un zurdo. Yo escribo con la izquierda.

**`f_anat`**
- Une las pistas: `ficha` + `bisturi`
- Texto: El bisturí del London Hospital es mío.

**`f_testigo`**
- Une las pistas: `ficha` + `testigo`
- Texto: Abrigo oscuro, bombín y linterna de policía. Ese soy yo.

**`f_ronda`**
- Une las pistas: `ficha` + `ronda`
- Texto: Conozco las rondas porque las firmo yo.

**`f_exp`**
- Une las pistas: `ficha` + `expediente`
- Texto: T. A. Thomas Ashgrove.

**`f_barro`**
- Une las pistas: `ficha` + `huellas`
- Texto: El barro, mi residencia y las huellas son compatibles; no hay un seguimiento continuo demostrado hasta mi puerta.
