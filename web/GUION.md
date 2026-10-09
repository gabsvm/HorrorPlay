# El Huésped — guion completo

_Generado desde el código del juego (2026-10-09) con `node web/tools/script/export.mjs`. Es todo lo que el jugador puede leer: diálogos, pensamientos de Thomas, elecciones, documentos, objetivos y el cuaderno._

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

1. Bajo el East End corre un río enterrado, el **Black Ditch** (real: desembocaba en el Támesis por Limehouse). En su lecho hay algo más antiguo que Londres. Los romanos lo dejaron escrito en una tablilla de plomo hallada en el fango: **HOSPES**.
2. El Huésped **no tiene cuerpo ni nombre**. Solo puede habitar a quien le responde.
3. **El agua dice tu nombre.** Si contestas, le abres la puerta. Los ribereños lo saben desde siempre: *"No respondas si el agua dice tu nombre."*
4. Una vez dentro, el Huésped **alquila horas**: el anfitrión pierde tiempo y despierta con las botas mojadas. Cada noche alquila más.
5. **El nombre es una dirección.** Un ser sin nombre no puede llegar a ningún sitio. Para quedarse en el mundo necesita un nombre que mucha gente pronuncie a la vez.
6. Por eso los crímenes no son el fin, son **el anuncio**. Lo que el Huésped busca es que Londres entera repita un nombre nuevo. La carta *"Dear Boss"*, firmada **Jack the Ripper**, la escribe la mano del protagonista con tinta roja durante una de sus horas perdidas. Cuando la prensa la publica, millones de bocas pronuncian el nombre, y el Huésped ya tiene dirección.
7. El final no es una muerte, es una **sustitución**. El protagonista no muere: olvida su nombre, y lo único que le queda es el que le dio la ciudad.

Nunca se explica todo esto en voz alta. El jugador lo reconstruye con el cuaderno.

### 4. Personajes

### Thomas Ashgrove (protagonista)
- 34 años, inspector de la División H (Whitechapel) de la Policía Metropolitana.
- Estudió cuatro años de medicina en el **London Hospital** de Whitechapel Road y lo dejó sin explicar por qué. **Sabe anatomía.**
- **Zurdo**: escribe con la izquierda (se ve en sus notas, en cómo empuña la lámpara).
- Vive de alquiler en un cuarto de Thrawl Street, encima de una cerería. El espejo del lavabo está tapado con una sábana: *"Me corté afeitándome. Mala luz."*
- Pierde horas. Lo atribuye al cansancio y al láudano para dormir.
- Su herida: en 1866, en la epidemia de cólera, su hermano pequeño **Nat** se ahogó en el foreshore de Limehouse, donde desagua el Black Ditch. Semanas después, el agua dijo *"Thomas"*. Él respondió: *"Aquí estoy."*

### Nat Ashgrove (el hermano)
- Solo aparece en el prólogo y en la voz del agua. La voz que imita a Nat es la del Huésped; usa la voz que mejor abre la puerta.

### Sargento Aldous Pike
- Compañero de Thomas. Seco, metódico, de pocas palabras. Toma notas sobre **Thomas**, no sobre el caso.
- Primera lectura: oculta algo, quizá protege al asesino o lo es él.
- Verdad: desde la primera noche sospecha de Thomas y no se atreve a decirlo porque nadie le creería.

### Dr. Lionel Greaves
- Cirujano del London Hospital y antiguo mentor de Thomas. Tiene bisturís, conocimientos y coartadas débiles: **sospechoso perfecto**.
- Estudia la "fuga disociativa" (el término es real y de 1887). Lleva un expediente clínico de un paciente al que llama **T. A.**
- Verdad: intentó tratar a Thomas en 1879, cuando dejó la carrera tras despertar en la sala de disección sin saber cómo había llegado allí.

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
- En el final es quien le pregunta su nombre.

### Las víctimas (fechas reales)
Polly Nichols (31 ago, Buck's Row), Annie Chapman (8 sep, Hanbury St.), Elizabeth Stride y Catherine Eddowes (30 sep, "doble suceso") y Mary Jane Kelly (9 nov, Miller's Court). Aparecen en la escena del crimen tal como las halló la policía, y en informes, recuerdos de quienes las conocían y objetos personales.

### 5. Estructura (versión jugable: 30–45 min)

| # | Capítulo | Fecha | Lugar | Función |
|---|----------|-------|-------|---------|
| 0 | **Prólogo: La marea baja** | Oct. 1866 | Foreshore de Limehouse | El agua dice "Thomas". Elegir responder o callar: las dos opciones terminan en *"Aquí estoy."* |
| 1 | **Buck's Row** | 31 ago 1888, 3:40 AM | Cuarto de Thomas → Buck's Row → desolladero | Despertar con las botas mojadas. Escena del crimen. Pistas: corte de zurdo, conocimiento anatómico, barro de río. Wren y la regla del agua. Sospecha de Brennan. |
| 2 | **El delantal de cuero** | 8–10 sep | Hanbury St. → sesión de Madame Wexley | Sesión: la voz de Nat. Acusar a Brennan → la turba. |
| 3 | **Tinta roja** | 27–30 sep | Cuarto de Thomas → Mitre Square → Goulston St. | Horas perdidas. Thomas despierta con los dedos manchados de rojo. La prensa publica "Jack the Ripper". Doble suceso. Persecución: Thomas huye "tras el asesino" con silbatos de la policía a su espalda. |
| 4 | **Huésped** | 8–9 nov | Consulta de Greaves → Támesis → Miller's Court | El expediente "T. A.". Pike viene a detenerlo. Huida al foreshore donde murió Nat. El agua dice su nombre. Revelación en el reflejo. Final. |

### El final (sin elección real)
En el foreshore, la marea dice *"Thomas"*. El jugador puede pulsar **[Callar]** cuantas veces quiera: el texto que aparece es *"Aquí estoy."* Thomas se mira por fin en el agua y no reconoce la cara.

Epílogo, Miller's Court, 9 de noviembre, de madrugada. Niebla. Wren, desde el otro lado de la calle: *"¿Cómo se llama usted, señor?"*

El juego muestra el campo de nombre del principio (donde el jugador firmó su cuaderno como *Thomas Ashgrove*). Escriba lo que escriba, las letras salen así: **J-A-C-K**.

Fundido a negro. Sobre él, la carta: *"Yours truly, Jack the Ripper. Don't mind me giving the trade name."*

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
| Tinta roja en tu escritorio (la usas en un puzle del cap. 1) | Herramienta | La carta "Dear Boss" está en tinta roja |
| Pike apunta en su libreta cada vez que tú hablas | Pike es raro | Te investiga |
| Madame Wexley: "Hay alguien detrás de usted" | Teatro de médium | Lo hay: dentro |
| Durante la persecución, los silbatos se acercan *a ti* | Persigues al asesino | Te persiguen a ti |

### Dos lecturas

**Primera partida.** El jugador veterano espera «el detective es el asesino», así que el juego le ofrece
otro tópico más tentador: **a Thomas le están tendiendo una trampa**. Alguien entra por su ventana
mientras duerme, le moja las botas, le vuelca la tinta roja y le roba un bisturí del estuche. Los
sospechosos razonables son **Pike** (reparte las rondas, lleva bombín y linterna, apunta a qué hora
llega Thomas y guarda la otra llave de su cuarto) y **Greaves** (tiene sus bisturís, conoce su
pasado y su letra es la de la carta). En el prólogo el niño **puede callar**, y si calla, la voz de la
sesión miente al decir que contestó. Las frases que lo delataban (la voz que dicta, la mano
izquierda manchada, la sangre seca de los guantes) no aparecen.

**Segunda lectura** (se desbloquea al terminar). La misma historia contada como fue: el niño contesta
aunque elijas callar, la voz dicta la carta, la hoja de rondas lleva la firma de Thomas, el cuaderno
anota con la otra mano la verdad de cada pista y tacha desde el principio las negaciones.

**El final cobra lo que hiciste.** Si callaste en 1866: «La primera vez callaste. No hacía falta: ya
estaba dentro.» Si acusaste a Brennan, a Greaves o a Pike, Thomas lo recuerda en la orilla. Si
conservas cordura, Wren dice su nombre por él; si le pagaste, te devuelve el penique.

### Puzles

1. **Las rondas** (cap. I): con la hoja de rondas, deducir los diez minutos en que nadie veía el
   portón (Thain alumbró a las 3:30; Cross llegó a las 3:40). La respuesta ingenua, «entre dos pasadas
   de Neil», es falsa.
2. **Los golpes** (cap. II): en la oscuridad de la sesión, la mesa golpea en el código de los presos
   del zar (fila y columna sobre una tabla de 5x5 sin K, clavada bajo la carta astral): HOSPES.
3. **La letra** (cap. III): la carta «Dear Boss» contra cuatro letras; el rasgo es la ſ larga de las
   recetas antiguas. Apunta a Greaves. La verdad: Thomas aprendió esa letra copiando sus recetas.

### El perfil del asesino (mecánica del cuaderno)
Cada deducción correcta añade un rasgo al **Perfil del sospechoso**: *zurdo, sabe anatomía, conoce las rondas, ronda el río, sabe escribir, tiene acceso a las escenas antes que la policía*. En el capítulo 4, el cuaderno muestra el perfil completo en una página y, en la de enfrente, la ficha de **Thomas Ashgrove**. El jugador hace la deducción final él mismo.

### 7. Sistemas

- **Cordura**: baja con lo que se ve, con lo que se oye y con las horas perdidas. A menos cordura, aparecen grano, aberración cromática y susurros; algunas descripciones mienten y la voz del agua se oye más alta.
- **Horas perdidas**: transiciones donde el reloj salta. Al volver, el inventario o el estado del mundo ha cambiado sin explicación.
- **Cuaderno**: registra las pistas automáticamente. Se combinan dos pistas para deducir. Las deducciones hacen avanzar la historia y construyen el perfil.
- **Inventario**: objetos que se usan sobre el escenario.

### 8. Reglas de producción

- Los escenarios se pintan por código; los personajes se modelan en Blender (`tools/blender`). Todo se termina como pixel-art HD (640×360, una paleta curada en `src/art/pixel.js`) con iluminación por encima. No se usan packs de terceros.
- La violencia ocurre fuera de plano; lo que se ve es su resultado, con el realismo de un expediente policial de 1888, y sus consecuencias humanas.
- Los diálogos son breves: nunca más de tres líneas seguidas sin que el jugador haga algo.


## Introducción (antes del prólogo)
_Archivo: src/story/intro.js. Ficha policial del cuaderno, tres líneas sobre Whitechapel y la primera página._
- POLICÍA METROPOLITANA · DIVISIÓN H
- Registro de efectos. Objeto n.º 214.
- Cuaderno de tapas de hule, muy deteriorado por el agua. Hallado en la boca del desagüe del Black Ditch, en Limehouse, el 10 de noviembre de 1888.
- Propiedad del inspector T. Ashgrove, de esta División, en paradero desconocido.
- Las anotaciones están escritas con dos caligrafías distintas.
- Otoño de 1888. Alguien está matando mujeres en Whitechapel.
- La policía todavía no tiene un nombre para él.
- Él tampoco.
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
    - *Thomas (piensa):* No puedo salir así. Me falta {list}. Está todo junto a la puerta.
- _Si no:_
  - _Si p === 'c3a':_
    - _Si flag('woke_c3') && !hasClue('llave_pike'):_
      - *Thomas (piensa):* La puerta está cerrada con llave, por dentro. Solo hay otra llave de este cuarto: la que guarda Pike, por si me necesitan de noche. _(1ª lectura)_
      - *Thomas (piensa):* Cerrada con llave, por dentro. La otra la guarda Pike. No ha hecho falta que nadie la use. _(2ª lectura)_
      - [+ Pista al cuaderno: llave_pike]
    - *Thomas (piensa):* Pasan de las tres. No tengo adónde ir a estas horas.
  - _Si no:_
    - _Si p === 'c3b':_
      - _Si !flag('paper_read'):_
        - *Thomas (piensa):* Hay un periódico bajo la puerta. La señora Pell lo deja ahí cuando no le pago a tiempo.

#### Periódico `paper`
_Aparece si: phase(G) === 'c3b' && !flag('paper_read')_
**Al interactuar:**
- _(sin texto)_

#### Botas `boots`
_Aparece si: phase(G) === 'c1' && !flag('boots_on')_
**Al interactuar:**
- *Thomas (piensa):* Están empapadas, y tienen barro negro hasta los cordones. Huelen a río.
- *Thomas (piensa):* Anoche las dejé secas, aquí mismo, junto a la puerta. _(1ª lectura)_
- *Thomas (piensa):* Me acosté a las once. No recuerdo haber salido. _(2ª lectura)_
- [+ Pista al cuaderno: botas]
- *Thomas (piensa):* Me las pongo. Están frías por dentro.

#### Abrigo y bombín `coat`
_Aparece si: !flag('coat_on')_
**Al interactuar:**
- *Thomas (piensa):* El abrigo todavía está húmedo en los puños.
- _Si !has('placa'):_
  - [+ Objeto: placa]
- _Si !has('penique') && !flag('penique_given'):_
  - [+ Objeto: penique]
- *Thomas (piensa):* En el bolsillo, la placa de la División H y un penique.

#### Linterna de ojo de buey `lantern`
_Aparece si: !flag('lantern_taken')_
**Al interactuar:**
- *Thomas (piensa):* La linterna del servicio. Está tibia y la mecha, quemada. Yo no la encendí. _(1ª lectura)_
- *Thomas (piensa):* La linterna del servicio. La mecha está quemada, como si la hubiera tenido encendida toda la noche. _(2ª lectura)_

#### Espejo cubierto `mirror`
**Al interactuar:**
- *Thomas (piensa):* La sábana sigue ahí desde la semana pasada. Me corté afeitándome; la luz es mala. _(vez 1)_
- *Thomas (piensa):* Prefiero no mirar. _(vez 2)_
- *Thomas (piensa):* No. _(vez 3)_

#### Cama `bed`
**Al interactuar:**
- _Si p === 'c3b':_
  - *Thomas (piensa):* Debajo de la cama está mi viejo estuche de disección. Lo abro.
  - *Thomas (piensa):* Seis huecos de terciopelo y cinco bisturís. Falta el del mango de ébano.
  - [+ Pista al cuaderno: estuche]
- *Thomas (piensa):* Hay barro en las tablas, en pisadas que van de la ventana a la cama y se paran ahí. Alguien ha estado de pie a mi lado mientras dormía. _(1ª lectura)_
- *Thomas (piensa):* Las sábanas están revueltas y hay barro en el borde del colchón. _(2ª lectura)_

#### Fotografía `photo`
**Al interactuar:**
- _Si p === 'c1':_
  - *Thomas (piensa):* Nat y yo en las escaleras de Limehouse, el verano antes del cólera. Él tenía nueve años y yo doce.
  - *Thomas (piensa):* Es la única fotografía que nos hicieron.
- _Si no:_
  - *Thomas (piensa):* Alguien ha rascado la cara del niño mayor con la punta de algo afilado. La de Nat está intacta.
  - *Thomas (piensa):* La del niño mayor es la mía.

#### Ventana `window`
**Al interactuar:**
- _Si p === 'c1':_
  - _Si !hasClue('ventana'):_
    - *Thomas (piensa):* La ventana está entornada y hay barro negro en el alféizar. Anoche la cerré. Estoy seguro de que la cerré. _(1ª lectura)_
    - *Thomas (piensa):* Entornada, con barro en el alféizar. Por aquí salgo cuando no quiero que la señora Pell me oiga en la escalera. _(2ª lectura)_
    - [+ Pista al cuaderno: ventana]
  - *Thomas (piensa):* Thrawl Street bajo la lluvia. Abajo, la cerería. Más allá, el olor del Ditch.
- _Si no:_
  - _Si p === 'c3a':_
    - *Thomas (piensa):* No pasa nadie. El cristal está empañado por dentro, como si alguien hubiera estado respirando contra él.
  - _Si no:_
    - *Thomas (piensa):* Unos chicos vocean el periódico en la esquina. Gritan un nombre que no entiendo.

#### Escritorio `desk`
**Al interactuar:**
- _Si p === 'c1':_
  - _Si !has('penique') && !flag('penique_given'):_
    - [+ Objeto: penique]
    - *Thomas (piensa):* Un penique suelto entre los informes.
  - _Si !has('placa'):_
    - [+ Objeto: placa]
  - _Si !flag('saw_red_ink'):_
    - *Thomas (piensa):* Los dos tinteros: el negro para los informes y el rojo para corregir los de los sargentos.
  - _Si no:_
    - *Thomas (piensa):* Informes atrasados. Robos, borracheras, una mujer que se cayó al canal.
- _Si no:_
  - _Si p === 'c3a':_
    - _Si no:_
      - *Thomas (piensa):* El informe está terminado. Las últimas páginas tienen mi letra, o una muy parecida, y no recuerdo haberlas escrito. Falta papel de cartas. _(1ª lectura)_
      - *Thomas (piensa):* El informe está terminado y la letra es mía, pero no recuerdo haber escrito las últimas páginas. Falta papel de cartas. _(2ª lectura)_
  - _Si no:_
    - _Si no:_
      - *Thomas (piensa):* El tintero rojo está casi vacío y el plumín, doblado.

#### Frasco de láudano `laudano`
**Al interactuar:**
- _Si !hasClue('laudano'):_
  - [+ Pista al cuaderno: laudano]
  - *Thomas (piensa):* Láudano, para dormir. Casi vacío. Lo compré el martes.
- _Si no:_
  - _Si !flag('drank'):_
    - > **Elección:** 1) Un trago. Solo uno.  ·  2) Dejarlo.
    - _Si c === 0:_
      - *Thomas (piensa):* El amargor me calma. Las manos dejan de temblar.
  - _Si no:_
    - *Thomas (piensa):* Ya no queda casi nada.

#### Reloj `clock`
**Al interactuar:**
- *Thomas (piensa):* Las {h[0]}:{String(h[1]).padStart(2, '0')}. {phase(G) === 'c1' ? 'Me acosté a las once. Me parece que hace un momento.' : 'Va bien. Nunca atrasa.'}

#### Mapa de Whitechapel `map`
**Al interactuar:**
- *Thomas (piensa):* El mapa de la división, lleno de alfileres. Los rojos marcan las agresiones de este año.
- _Si state.chapter === 'c3' || state.chapter === 'c4':_
  - *Thomas (piensa):* Todos los alfileres rojos están a menos de diez minutos de esta habitación.

## Buck's Row (Mary Ann Nichols)
_Archivo: src/scenes/bucks_row.js_

### Al entrar en la escena
- **Pike:** Inspector.
- *Thomas (piensa):* Pike abre la libreta y escribe algo, como siempre que llego.
- **Pike:** Mary Ann Nichols. La llamaban Polly. Cuarenta y tres años. Sigue ahí, delante del portón: la carretilla del depósito no ha llegado.
- **Pike:** Si quiere verla, ahora es el momento, señor.
- **Pike:** La encontró un carretero a las tres cuarenta, justo delante del portón del establo. Neil llegó un minuto después, haciendo la ronda.
- *Thomas (piensa):* Tengo que hablar con todos antes de que se despierte la calle, que luego la gente habla de más.
- [Objetivo] Examinar el cuerpo. Hablar con Pike, con Neil y con el chico.

### `onDeduce`
- _Si deduced('d_brennan') && deduced('d_bisturi') && !flag('c1_done'):_
  - [Objetivo] Volver al desolladero de Winthrop Street.
  - *Thomas (piensa):* Brennan, o alguien del hospital. Tengo que volver al desolladero.

### Cosas con las que se interactúa

#### Sargento Pike `pike`
**Al interactuar:**
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Qué dijo el médico? _(si !hasClue('zurdo'))_
  - ¿Quién era ella? _(si !flag('pike_polly'))_
  - ¿Qué apunta en esa libreta, Pike? _(si !flag('pike_notes') && flag('pike_polly'))_
  - ¿Quién trabaja de noche por aquí? _(si hasClue('zurdo') && !flag('knackers_lead'))_
  - La hoja de rondas de esta noche. _(si flag('neil_times') && !hasClue('ronda'))_
  - Nada más.
- _Si c === 'doc':_
  - **Pike:** El doctor Llewellyn dice que los cortes van de izquierda a derecha. Que el que lo hizo seguramente es zurdo.
  - [+ Pista al cuaderno: zurdo]
  - **Pike:** Y que tenía "cierta noción de anatomía". Sabía dónde cortar y no tuvo que buscarlo.
  - [+ Pista al cuaderno: anatomia]
  - *Thomas (piensa):* Zurdo, y sabía dónde cortar. En el cuaderno (N) puedo relacionar las pistas que encajan entre sí.
- _Si no:_
  - _Si c === 'polly':_
    - **Pike:** Tenía cinco hijos. El marido la dejó hace años. Dormía en Flower and Dean Street cuando le llegaba para pagar la cama.
    - **Pike:** Anoche no le llegaba. Le dijo a la casera que le guardara el sitio, que enseguida volvía con el dinero.
    - **Pike:** Llevaba un sombrero negro nuevo. Estaba contenta con ese sombrero.
    - *Thomas (piensa):* Un sombrero nuevo. Es lo único que sabemos de cómo se sentía anoche.
  - _Si no:_
    - _Si c === 'notes':_
      - **Pike:** Horas, señor. Quién llega y a qué hora.
      - **Pike:** Usted ha llegado a las cuatro y doce. Le mandé llamar a las cuatro.
      - *Thomas (piensa):* Doce minutos desde Thrawl Street. Debí de venir corriendo.
    - _Si no:_
      - _Si c === 'beats':_
        - **Pike:** Aquí la tiene, señor. Las horas de todos, y lo que declaran.
      - _Si no:_
        - _Si c === 'lead':_
          - [Objetivo] Ir al desolladero de Winthrop Street, hacia el oeste.
          - **Pike:** El desolladero de Barber, en Winthrop Street, ahí detrás. Matan caballos toda la noche.
          - **Pike:** Hombres con cuchillos y delantal de cuero, a cien yardas de aquí. Neil dice que no vieron nada.
          - *Thomas (piensa):* Hacia el oeste, siguiendo la pared de Essex Wharf.

#### Agente Neil `neil`
**Al interactuar:**
- _Si !hasClue('ronda'):_
  - **Neil:** Pasé por aquí a las tres y cuarto, señor, igual que todas las noches. No había nadie, y la calle estaba vacía de punta a punta.
  - **Neil:** A las tres cuarenta y cinco vi al carretero haciéndome señas. Media hora, nada más. En media hora.
  - _Si !flag('neil_times'):_
    - *Thomas (piensa):* Media hora entre dos pasadas. Pero Neil no es el único que mira esta calle. Pike tiene la hoja de rondas.
- _Si no:_
  - **Neil:** Llevo seis años en esta ronda, señor. Nunca había tenido tanto miedo de volver a pasar por la misma esquina.

#### Chico con un cubo `boy`
**Al interactuar:**
- _Si !hasClue('silencio'):_
  - **Chico:** Mi madre dice que en cuanto se la lleven hay que fregarlo, antes de que la gente se despierte y venga a mirar.
  - **Chico:** Ella duerme ahí mismo, detrás de esa ventana. Lo oye todo: los gatos, los borrachos, los trenes. Y esta noche no oyó nada, señor. Nada.
  - [+ Pista al cuaderno: silencio]
  - *Thomas (piensa):* A tres metros de una mujer con el sueño ligero, y nadie oyó nada.
- _Si no:_
  - **Chico:** Usted tiene barro en las botas, señor. Del negro, del que hay junto al río.
  - *Thomas (piensa):* Como medio Whitechapel.

#### Portón del establo `gate`
**Al interactuar:**
- *Thomas (piensa):* Aquí, delante del portón. El carretero creyó que era una lona tirada en el suelo.
- *Thomas (piensa):* Apenas había sangre bajo ella. Llewellyn dice que la mayor parte se quedó dentro de la ropa.

#### El cuerpo de Polly Nichols `polly`
_Aparece si: !flag('polly_taken')_
**Al interactuar:**
- _Si first:_
  - **Neil:** Le eché la capa por encima, señor. No me parecía bien dejarla así, con la cara al aire.
- *Thomas (piensa):* Levanto la capa de Neil.

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* Tiene los ojos abiertos. Miran algo que ya no está ahí.
- *Thomas (piensa):* Un moratón en la mandíbula, a la derecha: alguien le sujetó la cara con la mano derecha, desde atrás.

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* Dos cortes. De un lado a otro, hasta el hueso. El primero para callarla, el segundo para asegurarse.
- *Thomas (piensa):* Ni un rasguño en las manos. No se defendió.
- [+ Pista al cuaderno: cuello]

#### La falda `vientre`
**Al interactuar:**
- *Thomas (piensa):* La falda está empapada. La levanto un palmo con la punta del lápiz.
- *Thomas (piensa):* Cortes en el vientre, largos, hechos después. Por eso apenas había sangre en el suelo: la ropa se la bebió toda.

#### Las manos `manos`
**Al interactuar:**
- *Thomas (piensa):* Las manos abiertas, las palmas hacia arriba. Ni tierra en las uñas. No arañó a nadie.

#### El sombrero `sombrero`
**Al interactuar:**
- *Thomas (piensa):* El sombrero negro nuevo. Le dijo a la casera que con ese sombrero pronto tendría para la cama.
- *Thomas (piensa):* Lo recojo y lo dejo junto a su cabeza. No sé por qué lo hago.
- *Thomas (piensa):* Vuelvo a taparla con la capa.

#### Rastro en los adoquines `tracks`
**Al interactuar:**
- *Thomas (piensa):* Bajo la linterna se ven unas huellas de barro negro, barro de río, que se alejan hacia Winthrop Street.
- [+ Pista al cuaderno: huellas]
- *Thomas (piensa):* Son de bota de hombre, de un número parecido al mío.

#### Alcantarilla `grate`
**Al interactuar:**
- *Thomas (piensa):* Una rejilla de alcantarilla. Desde aquí abajo sube el olor del Ditch.

#### Farola `lamp`
**Al interactuar:**
- *Thomas (piensa):* La farola más cercana al portón está a treinta yardas. Allí estaba tan oscuro como en el fondo de un pozo.

#### Ventana de la señora Green `window`
**Al interactuar:**
- *Thomas (piensa):* Una vela encendida detrás de la cortina. Alguien nos está mirando.

#### Cartel `poster`
**Al interactuar:**
- *Thomas (piensa):* "Cien libras de recompensa por información." Lo puso un comité de comerciantes, porque la policía no ofrece recompensas.

#### Hacia Winthrop Street `west`
**Al interactuar:**
- _Si !flag('knackers_lead'):_
  - *Thomas (piensa):* Antes tengo que oír lo que dijo el médico.
- [→ Escena: knackers]

#### Hacia Baker's Row `east`
**Al interactuar:**
- *Thomas (piensa):* Mi casa queda por allí. Todavía no.

## El desolladero de Barber (Winthrop Street)
_Archivo: src/scenes/knackers.js_

### Al entrar en la escena
- *Thomas (piensa):* Desde el desolladero llega un olor espeso a cal, a sangre de caballo y a vapor.
- [Objetivo] Hablar con Brennan y con la niña de las cajas.

### Cosas con las que se interactúa

#### Silas Brennan `brennan`
_Aparece si: !isMob(G)_
**Al interactuar:**
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Dónde estaba a las tres y media? _(si !flag('br_alibi'))_
  - ¿No oyeron nada? _(si !flag('br_heard') && flag('br_alibi'))_
  - (Mirar cómo trabaja) _(si !hasClue('brennan_zurdo'))_
  - Nada más.
- _Si c === 'look':_
  - *Thomas (piensa):* Afila un cuchillo de desollar en la muela, con la mano izquierda. Lo hace sin mirar, como quien lo ha hecho diez mil veces.
  - *Thomas (piensa):* Lleva un delantal de cuero hasta las rodillas.
  - [+ Pista al cuaderno: brennan_zurdo]
- _Si c === 'alibi':_
  - **Brennan:** Aquí. Con Tomkins, con Mumford y con Britten. Ya vinieron dos de los suyos a preguntarlo, y les dijimos lo mismo.
  - **Brennan:** Seis caballos esta noche, inspector. Un caballo no se despieza solo.
- _Si no:_
  - _Si c === 'heard':_
    - **Brennan:** Aquí dentro los caballos gritan más que cualquier mujer.
    - **Brennan:** Si quiere saber quién anda por ahí a esas horas, pregúntele a la cría. Esa no duerme nunca.

#### Niña sobre las cajas `wren`
_Aparece si: !isMob(G)_
**Al interactuar:**
- _Si !flag('wren_met'):_
  - **Niña:** ¡No se acerque!
  - **Niña:** Usted huele al Ditch, señor.
  - **Thomas:** Soy policía.
  - **Niña:** Ya. Por eso.
  - **Wren:** Me llamo Wren. Busco cosas en el fango y las vendo. Esta noche he encontrado algo, pero las cosas cuestan.
  - *Thomas (piensa):* Pide un penique. No se va a acercar a mí.
  - _Si has('penique'):_
    - > **Elección:** 1) Dejarle el penique en el poste.  ·  2) Ahora no.
  - [Objetivo] Darle un penique a Wren.
- _Si flag('wren_paid'):_
  - **Wren:** Ya se lo he dicho. Si el agua dice su nombre, no conteste.
- **Wren:** Un penique, señor. Las cosas cuestan.
- *Thomas (piensa):* No llevo ni un penique encima. En mi cuarto, entre los informes, había uno suelto.
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Poste de piedra `bollard`
**Al interactuar:**
- *Thomas (piensa):* Un poste para amarrar caballos, gastado por las cuerdas.
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Patio del desolladero `yard`
_Aparece si: !isMob(G)_
**Al interactuar:**
- *Thomas (piensa):* Dentro hay tres hombres desollando a la luz de un brasero. Los caballos cuelgan de los ganchos como abrigos.
- *Thomas (piensa):* Aquí todo el mundo tiene un cuchillo y sangre en las manos. Por eso nadie mira dos veces.

#### Arco del ferrocarril `arch`
**Al interactuar:**
- *Thomas (piensa):* Bajo el arco del Great Eastern duermen los que no tienen cuatro peniques para una cama.

#### Abrevadero `trough`
**Al interactuar:**
- _Si !flag('trough_seen'):_
  - *Thomas (piensa):* Agua negra y quieta. Me asomo y no veo mi reflejo, solo la linterna, flotando sola.
  - *Thomas (piensa):* Habrá sido el ángulo.
- _Si no:_
  - *Thomas (piensa):* No vuelvo a asomarme.

#### Volver a Buck's Row `east`
_Aparece si: !isMob(G)_
**Al interactuar:**
- [→ Escena: bucks_row]

### Secuencia `payWren`
- *Thomas (piensa):* Dejo el penique en el poste de piedra y me aparto.
- **Wren:** Esto estaba en la rejilla de Buck's Row, antes de que llegaran los suyos. Brillaba.

## La orilla del Támesis, el Black Ditch (Limehouse)
_Archivo: src/scenes/foreshore.js_

### Al entrar en la escena
_(sin texto)_

### Cosas con las que se interactúa

#### Algo en el barro `boat`
_Aparece si: is1866(G) && !flag('boat')_
**Al interactuar:**
- _(sin texto)_

#### Desagüe del Black Ditch `outfall`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* El agua que sale de ahí es negra y está tibia, aunque sea octubre. Mamá dice que no me acerque.
  - *Thomas (piensa):* Nat decía que ahí dentro vive alguien.

#### El embarcadero `jetty`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* Nat se sentaba en la punta del embarcadero con los pies colgando. Mamá le gritaba que se iba a caer.
  - *Thomas (piensa):* No se cayó de ahí. Nadie sabe de dónde se cayó.
- _Si no:_
  - *Thomas (piensa):* Los mismos pilotes, veintidós años más podridos. La escalera sigue bajando hasta el agua.
  - *Thomas (piensa):* Desde aquí, el desagüe se ve como una boca abierta.

#### El río `water`
**Al interactuar:**
- _(sin texto)_

#### Escaleras a Narrow Street `stairs`
**Al interactuar:**
- _Si is1866(G):_
  - *Thomas (piensa):* Todavía no. Hoy no me voy sin encontrar algo de Nat. Él siempre jugaba allí, junto a los pilotes del embarcadero.
- _Si no:_
  - *Thomas (piensa):* Arriba están los silbatos. No hay a dónde volver.

## Hanbury Street, 29 (Annie Chapman)
_Archivo: src/scenes/hanbury.js_

### Al entrar en la escena
- *Thomas (piensa):* En la calle hay vecinos cobrando un penique por asomarse a la ventana a mirar el patio.
- **Pike:** Annie Chapman. Cuarenta y siete años. Vendía flores y ganchillo cuando estaba sana. Ya no lo estaba.
- **Pike:** La encontró un vecino a las seis menos cuarto, entre los escalones y la valla. Phillips no ha querido que la muevan hasta que usted la viera.
- *Thomas (piensa):* Pike escribe la hora en la libreta.
- [Objetivo] Examinar el cuerpo y el patio. Hablar con Pike, con el médico y con la casera.

### Cosas con las que se interactúa

#### Sargento Pike `pike`
**Al interactuar:**
- _Si !hasClue('ordenados'):_
  - **Pike:** El doctor Phillips dice que la mataron entre las cuatro y media y las cinco y media. Y otra cosa más.
  - **Pike:** Sus pertenencias estaban a sus pies: un trozo de muselina, un peine, un sobre roto. En fila, colocadas con cuidado.
  - [+ Pista al cuaderno: ordenados]
  - *Thomas (piensa):* Ordenadas como el instrumental antes de una operación.
- _Si no:_
  - _Si !flag('pike_hb2'):_
    - **Pike:** ¿Dónde estuvo anoche, inspector?
    - > **Elección:** 1) En mi cuarto. Durmiendo.  ·  2) ¿Por qué lo pregunta?
    - _Si c === 0:_
      - **Pike:** Bien.
    - _Si no:_
      - **Pike:** Por la libreta, señor. Se lo pregunto a todos.
    - *Thomas (piensa):* Escribe algo. Esta vez tarda más.
  - _Si no:_
    - **Pike:** La gente ya está diciendo "Leather Apron". Los periódicos se lo han puesto fácil.

#### Dr. Lionel Greaves `greaves`
**Al interactuar:**
- _Si !flag('greaves_met'):_
  - **Greaves:** Thomas. Cuánto tiempo.
  - **Greaves:** Ayudo a Phillips con la autopsia. Me alegra ver que te ha ido bien, después de... la facultad.
  - > **Elección:** 1) ¿Qué opina del corte?  ·  2) Me alegro de verle, doctor.
  - _Si c === 0:_
    - **Greaves:** Que quien lo hizo ha pasado tiempo en una sala de disección. Mucho tiempo.
    - **Greaves:** Tú lo sabrías mejor que yo. Eras el mejor de tu promoción con el bisturí.
  - _Si no:_
    - **Greaves:** Y yo de verte a ti. Aunque tienes cara de no dormir.
  - **Greaves:** ¿Has vuelto al láudano? No se te ocurra mezclarlo con ginebra.
  - [+ Pista al cuaderno: greaves_sabe]
  - _Si hasClue('delantal'):_
    - [Objetivo] Salir por el pasillo a Hanbury Street. | Mirar lo que hay junto a la valla, a los pies de Annie. Luego salir por el pasillo.
  - *Thomas (piensa):* Nunca le he contado a nadie lo del láudano. ¿Cómo lo sabe?
- _Si no:_
  - **Greaves:** Ven a verme al hospital si necesitas algo para dormir, Thomas. Lo digo en serio.

#### Sra. Richardson, la casera `amelia`
**Al interactuar:**
- _Si !flag('amelia1'):_
  - **Sra. Richardson:** Diecisiete personas duermen en esta casa, inspector. Diecisiete. Y nadie oyó nada.
  - **Sra. Richardson:** El delantal que hay junto al grifo es de mi hijo John. Lo lavé yo misma el jueves y lo dejé ahí para que se secara. Ya se lo he dicho a sus hombres.
  - *Thomas (piensa):* Eso dice. Pero el delantal también estaba en la escena.
- _Si no:_
  - **Sra. Richardson:** Esos de la ventana están cobrando por mirar. A mí ni me han preguntado.

#### Delantal de cuero `apron`
**Al interactuar:**
- *Thomas (piensa):* Un delantal de cuero, empapado, tirado junto al grifo.
- [+ Pista al cuaderno: delantal]
- _Si flag('greaves_met'):_
  - [Objetivo] Salir por el pasillo a Hanbury Street. | Mirar lo que hay junto a la valla, a los pies de Annie. Luego salir por el pasillo.
- *Thomas (piensa):* Los periódicos llevan una semana hablando de un tal "Leather Apron". Ahora tendrán su delantal.

#### Algo junto a la valla `comb`
_Aparece si: !flag('peine_taken')_
**Al interactuar:**
- *Thomas (piensa):* Un peine de bolsillo con dos púas rotas, apartado de las otras cosas. Se les ha pasado.
- > **Elección:** 1) Dárselo a Pike.  ·  2) Guardármelo.
- _Si c === 0:_
  - *Thomas (piensa):* Me acerco a Pike con el peine en la mano...
  - *Thomas (piensa):* ...y cuando llego, ya no lo tengo en la mano. Lo tengo en el bolsillo del abrigo, y no recuerdo haberlo metido ahí.
- _Si no:_
  - *Thomas (piensa):* Me lo guardo. Más tarde se lo daré a Pike.
- [+ Objeto: peine]
- _Si hasClue('delantal') && flag('greaves_met'):_
  - [Objetivo] Salir por el pasillo a Hanbury Street.

#### Ventana trasera `window`
**Al interactuar:**
- _Si hasClue('reflejo'):_
  - *Thomas (piensa):* Ahora solo se ve la cocina de la señora Richardson.
- *Thomas (piensa):* En el cristal sucio se refleja el patio, la valla y yo. Y alguien detrás de mí, muy cerca.
- *Thomas (piensa):* No hay nadie.
- [+ Pista al cuaderno: reflejo]

#### Escalones `steps`
**Al interactuar:**
- *Thomas (piensa):* Aquí, entre los escalones y la valla. La tierra está removida y alguien ha echado serrín.
- *Thomas (piensa):* En esta casa duermen diecisiete personas, y hubo luz de sobra para verlo todo. Nadie vio nada.

#### El cuerpo de Annie Chapman `annie`
_Aparece si: !flag('annie_taken')_
**Al interactuar:**
- *Thomas (piensa):* Aparto el saco.

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* La cara hinchada, la lengua entre los dientes. La estrangularon primero, hasta dejarla sin sentido.
- *Thomas (piensa):* Por eso nadie oyó nada. Cuando empezó a cortar, ella ya no podía gritar.

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* El corte da toda la vuelta. Casi le separa la cabeza. Hay que tener mucha fuerza en la mano, o mucha costumbre.

#### Sobre el hombro `hombro`
**Al interactuar:**
- *Thomas (piensa):* Sobre el hombro derecho, lo que le sacaron del vientre. No está tirado: está colocado.
- *Thomas (piensa):* He visto esto antes. En una mesa de mármol, en el London Hospital, con un profesor señalando con el puntero.

#### Bajo el saco `saco`
**Al interactuar:**
- *Thomas (piensa):* Phillips dejó el saco sobre el vientre. No hace falta levantarlo: me lo contó Greaves.
- *Thomas (piensa):* Falta algo de dentro. Lo sacó entero, con cortes limpios. Sabía dónde estaba y cómo se suelta.
- [+ Pista al cuaderno: falta]

#### La mano `mano`
**Al interactuar:**
- *Thomas (piensa):* Le queda un anillo. Junto a él, dos marcas claras y la piel levantada: ahí había otros dos, y se los arrancaron.
- *Thomas (piensa):* Anillos de latón; no valían nada. No los cogió para venderlos.
- [+ Pista al cuaderno: anillos]

#### Sus cosas `cosas`
**Al interactuar:**
- *Thomas (piensa):* Un trozo de muselina, un sobre roto con el sello de un regimiento, dos peniques. En fila, a sus pies.
- [+ Pista al cuaderno: ordenados]
- *Thomas (piensa):* Como el instrumental antes de una operación.
- *Thomas (piensa):* Vuelvo a taparla. Ahora me miran todos los de las ventanas.

#### Vecinos en las ventanas `neighbours`
**Al interactuar:**
- *Thomas (piensa):* Los de la casa de al lado cobran un penique por asomarse a mirar el patio. Ya hay cola en la calle.

#### Pasillo a Hanbury Street `passage`
**Al interactuar:**
- _Si !hasClue('delantal') || !flag('greaves_met'):_
  - *Thomas (piensa):* Todavía no he terminado aquí. Me falta examinar el patio y hablar con el médico.
- _Si !flag('peine_taken'):_
  - *Thomas (piensa):* A los pies de Annie, junto a la valla, hay algo que los de Phillips no han recogido. Antes de irme quiero verlo.
  - [Objetivo] Mirar lo que hay junto a la valla, a los pies de Annie.

## La consulta del Dr. Greaves (London Hospital)
_Archivo: src/scenes/greaves.js_

### Al entrar en la escena
- _Si flag('sospecha_greaves'):_
  - *Thomas (piensa):* Greaves no está. Si es él, aquí habrá algo que lo demuestre.
- _Si no:_
  - *Thomas (piensa):* Greaves no está. Me dijo que viniera si necesitaba algo para dormir. Pero no he venido a eso.
- *Thomas (piensa):* La puerta estaba cerrada con llave. No recuerdo haberla forzado, pero el marco está astillado.

### Cosas con las que se interactúa

#### Cajón del escritorio `drawer`
**Al interactuar:**
- _Si flag('drawer_open'):_
  - *Thomas (piensa):* Ya está abierto. Solo había recetas y la llave.
- *Thomas (piensa):* Está cerrado con llave. Con algo fino podría forzar la cerradura.
**Al usar un objeto sobre ello:**
- *Thomas (piensa):* El bisturí entra en la cerradura como si la conociera. Dentro hay recetas de cloral y una llave pequeña de latón.
- *Thomas (piensa):* Lo he hecho con la izquierda, sin pensar.
- [+ Objeto: llave]

#### Vitrina cerrada `cabinet`
**Al interactuar:**
- *Thomas (piensa):* Expedientes clínicos ordenados por año, detrás de un cristal cerrado con llave. Hay uno de 1879.
**Al usar un objeto sobre ello:**
- *Thomas (piensa):* La llave gira. Saco el expediente de 1879.

#### Frascos de especímenes `jars`
**Al interactuar:**
- *Thomas (piensa):* Órganos en formol con etiquetas escritas a mano. En uno de ellos pone "Ahogado, Limehouse, 1866".

#### Lámina anatómica `chart`
**Al interactuar:**
- *Thomas (piensa):* Yo me la sabía de memoria. Todavía me la sé: cada órgano, cada arteria y qué se corta primero.

#### Esqueleto `skeleton`
**Al interactuar:**
- *Thomas (piensa):* Los estudiantes lo llaman "el señor Bones". Una vez me quedé dormido en la sala de disección, al lado de uno como este, y al despertar...
- *Thomas (piensa):* No recuerdo al despertar.

#### Ventana `window`
**Al interactuar:**
- *Thomas (piensa):* Whitechapel Road. Hay grupos de vigilancia vecinal con faroles y palos en cada esquina. Buscan a un hombre con abrigo oscuro.

#### Puerta `door`
**Al interactuar:**
- _Si !flag('file_read'):_
  - *Thomas (piensa):* No me voy de aquí sin saber qué sabe Greaves.
- *Thomas (piensa):* Afuera se oyen pasos. Alguien sube la escalera.

## La sesión de Madame Wexley
_Archivo: src/scenes/seance.js_

### Pista (botón de ayuda)
- Cada letra son dos grupos de golpes: el primero es la fila de la tabla, el segundo la columna. Dos golpes y tres golpes: fila 2, columna 3. _(si flag('seance_done') && !hasClue('hospes'); si flag('knock_board'))_
- En la pared, bajo la carta astral, hay una tabla de letras. Sin ella los golpes no se pueden leer. _(si flag('seance_done') && !hasClue('hospes'); si no)_

### Al entrar en la escena
- **Madame Wexley:** Inspector Ashgrove. Le estaban esperando.
- > **Elección:** 1) ¿Quién me esperaba?  ·  2) Usted me mandó una nota. Quiero saber quién se la dictó.
- _Si c === 0:_
  - **Madame Wexley:** Los que están al otro lado. No suelen pedir a nadie por su nombre, y esta semana han pedido el suyo.
- _Si no:_
  - **Madame Wexley:** Nadie me dicta nada, inspector. Yo escucho y luego escribo lo que oigo.
- **Madame Wexley:** Siéntese. Y ponga sobre la mesa lo que lleva en el bolsillo. Lo de ella.
- *Thomas (piensa):* El peine. No se lo he enseñado a nadie.
- [Objetivo] Poner el peine de Annie sobre la mesa.

### Cosas con las que se interactúa

#### Mesa de la sesión `table`
**Al interactuar:**
- _Si flag('seance_done'):_
  - *Thomas (piensa):* La cera de las velas sigue blanda.
- *Thomas (piensa):* Tres velas, un mantel de terciopelo gastado y huellas de dedos en la madera. Wexley espera a que deje algo encima.
**Al usar un objeto sobre ello:**
- _(sin texto)_

#### Madame Orla Wexley `wexley`
**Al interactuar:**
- _Si flag('seance_done'):_
  - **Madame Wexley:** Váyase, por favor. Y llévese eso con usted.
  - > **Elección:** 1) ¿El qué?  ·  2) (Salir sin decir nada)
  - _Si c === 0:_
    - **Madame Wexley:** Lo que lleva puesto, inspector. No hablo del abrigo.
- _Si !flag('wex_q1'):_
  - **Madame Wexley:** No cobro a la policía. Usted no ha venido por voluntad propia.
  - **Madame Wexley:** En esta calle casi todos tapamos los espejos cuando hay un muerto, para que no se quede atrapado dentro. Yo dejo el mío destapado, para que puedan mirar.
- _Si no:_
  - **Madame Wexley:** El peine, inspector. Encima de la mesa.

#### Espejo `mirror`
**Al interactuar:**
- _Si n === 1:_
  - *Thomas (piensa):* Prefiero no mirar.
- _Si no:_
  - _Si n === 2:_
    - *Thomas (piensa):* Se ve la mesa, las velas, la viuda y el joven. Hay tan poca luz que no consigo encontrarme.
  - _Si no:_
    - *Thomas (piensa):* No.

#### Viuda `widow`
**Al interactuar:**
- _Si flag('seance_done'):_
  - *Thomas (piensa):* Se ha ido sin despedirse. Su silla sigue caliente.
- **Viuda:** Mi marido se ahogó en el muelle de la Reina Victoria. Vengo todos los sábados.
- **Viuda:** Nunca habla él. Siempre habla otro que se hace pasar por él.

#### Joven `young`
**Al interactuar:**
- _Si flag('seance_done'):_
  - *Thomas (piensa):* Ha salido corriendo. Ni ha cogido el sombrero.
- **Joven:** Soy periodista, del Star. No crea que me lo trago.
- **Joven:** Aunque si esta noche pasa algo, mañana venderemos cien mil ejemplares.

#### Trompeta de espiritismo `trumpet`
**Al interactuar:**
- *Thomas (piensa):* Una trompeta de latón para que "los espíritus" hablen por ella. Un truco de feria.

#### Fotografías de espíritus `photos`
**Al interactuar:**
- *Thomas (piensa):* Fotografías de difuntos, con "espíritus" añadidos con doble exposición. Una de ellas tiene la cara borrada por la humedad, o eso parece.

#### Reloj de la repisa `clock`
**Al interactuar:**
- *Thomas (piensa):* Un reloj de sobremesa, parado a las tres y cuarto.
- *Thomas (piensa):* A las tres y cuarto pasó Neil por Buck's Row y no vio a nadie.

#### Cuervo disecado `raven`
**Al interactuar:**
- *Thomas (piensa):* Un cuervo disecado bajo una campana de cristal. Tiene la cabeza vuelta hacia la puerta, como si esperara a alguien.

#### Carta astral `chart`
**Al interactuar:**
- *Thomas (piensa):* Una carta astral dibujada a mano. En el margen alguien ha escrito "T. A." y la fecha de mi nacimiento.
- _Si !flag('knock_board'):_
  - *Thomas (piensa):* Debajo, clavada con chinchetas, una tabla de veinticinco letras en cinco filas, sin la K, con las filas y las columnas numeradas del uno al cinco.
  - *Thomas (piensa):* Los presos de las cárceles del zar hablaban así entre celdas, a golpes: primero la fila, luego la columna. Los espíritus de Madame Wexley, por lo visto, también.

#### Salir a Fournier Street `door`
**Al interactuar:**
- _Si !flag('seance_done'):_
  - *Thomas (piensa):* He venido a saber quién le habló de mí. No me voy sin saberlo.
- _Si !hasClue('hospes'):_
  - *Thomas (piensa):* Los golpes de la mesa. Los tengo apuntados y no sé qué dicen. No me voy sin saberlo.

## Mitre Square (Catherine Eddowes)
_Archivo: src/scenes/mitre.js_

### Al entrar en la escena
- **Agente Watkins:** ¡Alto ahí! Esto es la City. ¿Quién es usted?
- *Thomas (piensa):* La City de Londres tiene su propia policía. Aquí no soy nadie, salvo que les enseñe la placa.
- [Objetivo] Enseñar la placa al agente de la City (inventario).

### Cosas con las que se interactúa

#### Agente Watkins (Policía de la City) `watkins`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - **Agente Watkins:** Sin identificación no pasa nadie. Ni la reina.
- > **Menú de conversación** (las opciones que aparecen según lo ya hecho):
  - ¿Qué ha encontrado? _(si !hasClue('trozo'))_
  - ¿Alguien vio algo? _(si !hasClue('testigo'))_
  - ¿Sabemos quién era? _(si !flag('watkins_name'))_
  - Nada más.
- _Si c === 'found':_
  - **Agente Watkins:** Hago esta ronda cada quince minutos. A la una y media no había nada. A la una y cuarenta y cuatro estaba ahí, en la esquina.
  - **Agente Watkins:** Le falta un trozo del delantal, cortado a cuchillo. Se lo llevó.
  - [+ Pista al cuaderno: trozo]
  - **Agente Watkins:** Y dicen que hace una hora han encontrado a otra en Berner Street, en el patio de un club. Dos en una noche, inspector.
- _Si no:_
  - _Si c === 'witness':_
    - **Agente Watkins:** Tres hombres salían de un club de Duke's Place a la una y media. Uno vio a una mujer hablando con un hombre a la entrada de Church Passage.
    - **Agente Watkins:** Abrigo oscuro y bombín. Dice que el hombre llevaba una linterna como las nuestras, de policía. Por eso no le dio importancia.
    - [+ Pista al cuaderno: testigo]
    - *Thomas (piensa):* Una linterna de policía. Uno de los nuestros: abrigo oscuro y bombín, como Pike. Como media División H. _(1ª lectura)_
    - *Thomas (piensa):* Una linterna de policía. Como la mía. _(2ª lectura)_
  - _Si no:_
    - _Si c === 'name':_
      - **Agente Watkins:** La soltaron de la comisaría de Bishopsgate a la una, cuando se le pasó la borrachera. Dio un nombre: Mary Ann Kelly.
      - **Agente Watkins:** Pero en la casa de huéspedes la conocían como Kate. Catherine Eddowes. Volvía de Kent, de recoger lúpulo, con su hombre.
      - *Thomas (piensa):* Mary Ann Kelly. Ese nombre me da frío, y no sé por qué.
**Al usar un objeto sobre ello:**
- _Si flag('mitre_badge'):_
  - *Thomas (piensa):* Ya la ha visto.
- **Agente Watkins:** División H. Está bien, inspector, pero no toque nada. Esto es asunto de la City.
- **Agente Watkins:** ...¿Cómo ha llegado tan rápido? La encontré hace cuatro minutos. Todavía no hemos avisado a nadie de la Metropolitana.
- [+ Pista al cuaderno: rapido]
- [Objetivo] Averiguar qué encontró Watkins y si alguien vio algo.
- > **Elección:** 1) Estaba cerca, en Aldgate.  ·  2) Oí los silbatos.
- _Si c === 0:_
  - *Thomas (piensa):* Estaba en Aldgate. Pike me pidió que revisara las rondas de la City. Eso creo. _(1ª lectura)_
  - *Thomas (piensa):* Estaba en Aldgate. Eso creo. ¿Qué hacía yo en Aldgate a las dos menos cuarto? _(2ª lectura)_
- _Si no:_
  - *Thomas (piensa):* No ha sonado ningún silbato. Watkins no ha llegado a tocar el suyo.

#### El cuerpo, en la esquina más oscura `corner`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - *Thomas (piensa):* Watkins no me deja acercarme sin enseñarle la placa.
- *Thomas (piensa):* El rincón donde no llega la farola. Desde aquí no se ve ninguna ventana con luz.
- *Thomas (piensa):* Él conocía este rincón. Sabía que estaba a oscuras.

#### La cara `cara`
**Al interactuar:**
- *Thomas (piensa):* Le ha cortado la cara. Un tajo en cada párpado. Una V en cada mejilla, con la punta hacia los ojos.
- *Thomas (piensa):* Esto no la mató. Esto lo hizo después, con calma, sabiendo que Watkins pasaba cada quince minutos.
- [+ Pista al cuaderno: marcas]

#### El cuello `cuello`
**Al interactuar:**
- *Thomas (piensa):* Un solo corte, de izquierda a derecha. La misma mano que en Buck's Row.

#### El vientre `vientre`
**Al interactuar:**
- *Thomas (piensa):* Abierta de arriba abajo. Lo de dentro, sobre el hombro, como en Hanbury Street.
- *Thomas (piensa):* Le falta un riñón. Lo sé antes de mirar. ¿Cómo lo sé antes de mirar?

#### El delantal `delantal`
**Al interactuar:**
- *Thomas (piensa):* Al delantal le falta una esquina, cortada a cuchillo, en línea recta. Con eso se limpió las manos.
- [+ Pista al cuaderno: trozo]

#### La muñeca `pulso`
**Al interactuar:**
- *Thomas (piensa):* Le cojo la muñeca para buscarle el pulso. Es la costumbre.
- *Thomas (piensa):* Al soltarla, mis guantes se quedan pegados a su piel.
- _Si second():_
  - [Visión: hands]
  - *Thomas (piensa):* Me miro los guantes. Están pegajosos. Y la sangre del dorso ya está seca.
- _Si no:_
  - *Thomas (piensa):* Me limpio los guantes en el abrigo. No consigo dejar de temblar.
- [+ Pista al cuaderno: guantes]
- _Si seen.pulso && !flag('watkins_touch'):_
  - **Agente Watkins:** ¡Le he dicho que no la toque! ¿Qué hace con las manos en ella?
  - > **Elección:** 1) Buscarle el pulso.  ·  2) (Esconder las manos en los bolsillos)
  - _Si c === 0:_
    - **Agente Watkins:** ¿El pulso? Mírela, inspector. Mírela bien.
  - _Si no:_
    - *Thomas (piensa):* Meto las manos en los bolsillos del abrigo. Están pegajosos por dentro también.

#### Morris, el vigilante `morris`
**Al interactuar:**
- _Si !flag('mitre_badge'):_
  - *Thomas (piensa):* Watkins no me deja pasar hasta que le enseñe la placa.
- **Morris:** Estaba barriendo ahí dentro, con la puerta entornada. No oí nada, señor. Nada de nada.
- **Morris:** Fui policía, ¿sabe? Pensé que ya había visto de todo.

#### Aviso de la Policía de la City `notice`
**Al interactuar:**
- *Thomas (piensa):* Un aviso pidiendo testigos de la noche del 8 de septiembre. Ya lo han tapado a medias con otro: un spaniel perdido.

#### Farola `lamp`
**Al interactuar:**
- *Thomas (piensa):* La farola de la plaza da luz a todo menos a la esquina donde estaba ella. Watkins pasa por aquí cada quince minutos.

#### Church Passage `passage`
**Al interactuar:**
- *Thomas (piensa):* Por ahí he venido. No recuerdo haber cruzado el pasaje.

#### Hacia Goulston Street `east`
**Al interactuar:**
- _Si !hasClue('trozo') || !hasClue('testigo'):_
  - *Thomas (piensa):* Antes tengo que oír lo que sabe Watkins.
- *Thomas (piensa):* Se llevó un trozo del delantal. Lo tirará en algún sitio de camino a casa. Hacia el este, de vuelta a Whitechapel.

### Secuencia `mitreObjective`
- _Si hasClue('trozo') && hasClue('testigo'):_
  - [Objetivo] Seguir el rastro del delantal hacia el este, por Goulston Street.

## Goulston Street (el grafito)
_Archivo: src/scenes/goulston.js_

### Al entrar en la escena
- *Thomas (piensa):* Goulston Street. Hay luz en algunas ventanas de los Wentworth Buildings, y el portal de la escalera está abierto.
- [Objetivo] Examinar el portal de los Wentworth Buildings.

### Cosas con las que se interactúa

#### Portal de la escalera `doorway`
**Al interactuar:**
- _Si flag('apron_found'):_
  - *Thomas (piensa):* Ya no queda nada que ver aquí.
- *Thomas (piensa):* En el suelo del portal hay un trozo de tela blanca, empapado y oscuro. Es el delantal.
- *Thomas (piensa):* Al acercar la linterna veo la jamba de ladrillo. Alguien ha escrito con tiza: HERE I AM. Aquí estoy. _(1ª lectura)_
- *Thomas (piensa):* Al acercar la linterna veo la jamba de ladrillo. Alguien ha escrito algo con tiza, con letra inclinada. _(2ª lectura)_
- _Si second():_
  - **La voz (la voz):** _Aquí estoy._
- _Si no:_
  - *Thomas (piensa):* Lo mismo que le contesté al agua cuando tenía doce años. _(si flag('answered1866'))_
  - *Thomas (piensa):* Lo que el agua quería que yo le contestara. Alguien se lo ha contestado por mí. _(si no)_
- [+ Pista al cuaderno: aqui_estoy]

#### Cartel `poster`
**Al interactuar:**
- *Thomas (piensa):* "Se ha perdido un terrier. Se gratificará." Media ciudad busca a un asesino y la otra media, a su perro.

#### Farola `lamp`
**Al interactuar:**
- *Thomas (piensa):* La única farola de la calle. El portal de los Wentworth queda fuera de su luz. Él lo sabía.

#### Carnicería `butcher`
**Al interactuar:**
- *Thomas (piensa):* Cerrada a cal y canto. En el escaparate cuelgan ganchos vacíos.

## La persecución por los callejones
_Archivo: src/scenes/alleys.js_

### Al entrar en la escena
- *Thomas (piensa):* Lo veo al final de la calle: un abrigo oscuro corriendo, igual que yo. Tengo que alcanzarlo.
- > **Elección:** 1) Seguir recto, hacia la luz.  ·  2) Meterse por Wentworth Street.
- > **Elección:** 1) Agacharse detrás de los barriles.  ·  2) Seguir corriendo.
- > **Elección:** 1) Ir a casa.  ·  2) Seguir hacia el río.
- _Si c !== j.good:_
  - *Thomas (piensa):* Un patio cerrado, con una pared de diez pies. Vuelvo atrás.
  - *Thomas (piensa):* Me agacho y un farol pasa a dos pasos de mí. Cuando se aleja, se han acercado los otros.
  - *Thomas (piensa):* En mi puerta hay un agente. Doy media vuelta antes de que me vea.

## Secuencias de la historia (capítulos, transiciones, final)
_Archivo: src/story/chapters.js. Cada una la dispara una escena o un objeto en el momento indicado por su nombre._

### `prologue`
- [Rótulo] Limehouse — Octubre de 1866
- [→ Escena: foreshore]
- *Thomas (piensa):* Hacía tres semanas que el río se había llevado a Nat.
- *Thomas (piensa):* Desde entonces bajaba cada tarde con la marea baja a buscarlo. Mamá decía que ya no iba a volver, pero yo bajaba igual.
- *Thomas (piensa):* Nat se pasaba las tardes junto al embarcadero, con el barquito que papá le hizo con una caja de puros.
- *Thomas (piensa):* Hoy encontraré algo suyo. Lo sé.
- [Objetivo] Buscar el barquito de Nat en el barro, junto al embarcadero.

### `c1`
- [Rótulo] Buck's Row — Whitechapel, 31 de agosto de 1888
- [→ Escena: room]
- **Voz al otro lado de la puerta:** ¡Inspector Ashgrove! El sargento Pike le manda llamar. Han encontrado a una mujer en Buck's Row.
- **Thomas:** Voy.
- *Thomas (piensa):* Estoy en camisa y tengo los pantalones mojados hasta las rodillas. Me he dormido vestido otra vez.
- [Objetivo] Coger el abrigo, las botas y la linterna, y salir hacia Buck's Row.

### `c2`
- [Rótulo] El delantal de cuero — 29 Hanbury Street, 8 de septiembre de 1888
- [→ Escena: hanbury]

### `c3`
- [Rótulo] Tinta roja — Thrawl Street, 27 de septiembre de 1888
- [→ Escena: room]
- *Thomas (piensa):* Tengo informes atrasados de tres semanas. Esta noche no salgo: escribo y me acuesto.
- [Objetivo] Terminar los informes en el escritorio.

### `c4`
- [Rótulo] Octubre — No hay crímenes en todo el mes.
- [Rótulo] Duermo de día. De noche camino. Pike ya no me saluda.
- [Rótulo] Huésped — London Hospital, 8 de noviembre de 1888
- [Objetivo] Encontrar pruebas contra Greaves en su consulta: el cajón, la vitrina. | Encontrar lo que Greaves sabe de mí: el cajón, la vitrina.
- [→ Escena: greaves]

### `prologueBoat`
- *Thomas (piensa):* El barco de Nat, el que papá le hizo con una caja de puros. Tiene la vela rota.
- [Objetivo] Acercarse al río.
- *Thomas (piensa):* Allí, en el río, brilla algo verde, como un farol hundido.

### `prologueWater`
- _Si !flag('boat'):_
  - *Thomas (piensa):* El agua está quieta. Demasiado quieta para ser el Támesis.
  - *Thomas (piensa):* Primero el barquito. Tiene que estar en el barro, entre los pilotes del embarcadero.
- **La voz (la voz):** _Thomas._
- *Thomas (piensa):* ...¿Nat?
- **La voz (la voz):** _Tommy. Estoy aquí abajo. Tengo frío._
- > **Elección:** 1) Responder.  ·  2) No responder.
- _Si c === 1:_
  - *Thomas (piensa):* Mamá dice que los ahogados no hablan. Que si alguna vez el agua me llama, no conteste.
  - **La voz (la voz):** _Tommy, por favor. Solo dime que estás ahí._
  - > **Elección:** 1) Responder.  ·  2) No responder.
  - > **Elección:** 1) No responder.  ·  2) No responder.
- _Si answered:_
  - **Thomas:** Aquí estoy.
  - **La voz (la voz):** _Ya lo sé._
- _Si no:_
  - *Thomas (piensa):* No contesto. Aprieto el barquito contra el pecho hasta que me duelen los dedos.
  - **La voz (la voz):** _..._
  - *Thomas (piensa):* La luz verde se apaga despacio, como una lámpara a la que se le acaba el aceite. El agua se queda quieta.
  - *Thomas (piensa):* Mamá tenía razón.
- [Rótulo] El Huésped — Hospes (lat.): el que recibe y el que es recibido.

### `leaveRoomC1`
- [→ Escena: bucks_row]

### `takeScalpel`
- [+ Objeto: bisturi]
- [+ Pista al cuaderno: bisturi]
- *Thomas (piensa):* Es un bisturí con mango de ébano, y en la virola pone LONDON HOSPITAL.
- *Thomas (piensa):* Wren lo sacó de la rejilla de Buck's Row, a dos pasos de donde estaba Polly.
- **Wren:** ¿Sabe lo que dicen en el río, señor? Si el agua dice su nombre, no conteste.
- > **Elección:** 1) ¿Por qué me dices eso?  ·  2) Son cuentos de ribereños.
- _Si c === 0:_
  - **Wren:** Porque esta noche el agua ha hablado mucho, señor. Se le oía desde el fango. _(1ª lectura)_
  - **Wren:** Porque a usted ya le ha hablado. Se le nota. _(2ª lectura)_
- _Si no:_
  - **Wren:** Usted sabrá. Pero no conteste.
- [+ Pista al cuaderno: regla]
- *Thomas (piensa):* Brennan es zurdo. El bisturí es del hospital. En el cuaderno tengo que relacionarlo con lo que dijo Llewellyn.

### `c1Objective`
- _Si !hasClue('brennan_zurdo'):_
  - [Objetivo] Fijarse en cómo trabaja Brennan. Luego, en el cuaderno, relacionarlo con lo que dijo el forense.
- _Si no:_
  - _Si !deduced('d_brennan') || !deduced('d_bisturi'):_
    - [Objetivo] En el cuaderno: relacionar a Brennan y el bisturí con lo que dijo el forense.

### `beats`
- [Documento] DIVISIÓN H — RONDAS Noche del 30 al 31 de agosto de 1888 PC 97J Neil. Buck's Row, Brady Street, Baker's Row. Vuelta de media hora: pasa ante el portón del establo a las y cuarto y a menos cuarto. PC 96J Thain. Brady Street. A las y media se detiene en la esquina de Buck's Row y alumbra la calle con la linterna. PC 55H Mizen. Baker's Row y Hanbury Street. Desde su punto no se ve Buck's Row. Declaraciones: Thain alumbró Buck's Row a las 3:30; no había nada en el suelo. Charles Cross, carretero, entró en la calle a las 3:40 y la encontró delante del portón. {two('Firmado: el inspector de guardia', 'Firmado: T. Ashgrove, inspector de guardia')}
- *Thomas (piensa):* ¿Cuándo pudo hacerlo sin que nadie viera el portón?
- > **Elección:** 1) Entre las 3:15 y las 3:45: entre dos pasadas de Neil.  ·  2) Entre las 3:15 y las 3:30.  ·  3) Entre las 3:30 y las 3:40.  ·  4) Entre las 3:40 y las 3:45.  ·  5) Mirar otra vez la hoja.
- *Thomas (piensa):* No. A las 3:30 Thain alumbró la calle desde Brady Street, y no había nadie en el suelo. _(vez 1)_
- *Thomas (piensa):* Entonces Thain la habría visto al alumbrar a las 3:30. No había nada. _(vez 2)_
- *Thomas (piensa):*  _(vez 3)_
- *Thomas (piensa):* A las 3:40 ya estaba muerta: Cross la encontró. _(vez 4)_
- [+ Pista al cuaderno: ronda]
- *Thomas (piensa):* Diez minutos entre la linterna de Thain y el carretero. No tuvo suerte: sabía las horas de los tres.
- _Si second():_
  - *Thomas (piensa):* Las sabía porque las puse yo.

### `endC1`
- **Brennan:** ¿Qué mira, inspector?
- *Thomas (piensa):* Un zurdo con cuchillo, a cien yardas de Buck's Row. O alguien del hospital que perdió su bisturí. Uno de los dos.
- **Wren:** No fue él, señor.
- **Thomas:** ¿Cómo lo sabes?
- **Wren:** Porque el que lo hizo bajó al río después. Brennan no se ha movido de su piedra en toda la noche. _(1ª lectura)_
- **Wren:** Porque él no huele al Ditch. _(2ª lectura)_
- *Thomas (piensa):* Me despierto en mi cuarto. No recuerdo haber vuelto. La ventana está abierta otra vez. _(1ª lectura)_
- *Thomas (piensa):* Me despierto en mi cuarto, vestido y con la linterna todavía caliente en la mano. _(2ª lectura)_

### `leaveHanbury`
- *Thomas (piensa):* En el pasaje, un chico me pone un sobre en la mano y sale corriendo.
- [Documento] 27 Fournier Street Inspector Ashgrove: Los muertos piden hablar con usted. No suelen pedir a nadie por su nombre. Esta noche, a las once. Traiga lo que lleva en el bolsillo. — O. Wexley
- [Rótulo] Esa misma noche — Fournier Street, Spitalfields
- [Objetivo] Averiguar qué quiere Madame Wexley.
- [→ Escena: seance]

### `seance`
- **Madame Wexley:** Las manos sobre la mesa, todos. Pase lo que pase, no suelten a nadie.
- **Madame Wexley:** Hay alguien... Hay una mujer. No. Se aparta. Hay otro que la aparta.
- **Madame Wexley (la voz):** _Tommy._
- *Thomas (piensa):* Nadie me llama así desde 1866.
- **Madame Wexley (la voz):** _El agua estaba fría, Tommy. Me buscaste tres semanas. Luego te llamé y contestaste._
- **Madame Wexley (la voz):** _Dijiste: aquí estoy. ¿Te acuerdas?_
- [+ Pista al cuaderno: nat_voz]
- _Si !flag('answered1866'):_
  - *Thomas (piensa):* Mentira. No contesté. No contesté nunca.
- **Joven:** ¿Quién demonios es Tommy?
- **Madame Wexley (la voz):** _Ya no tienes que buscarme. Te encontré yo a ti._
- **Madame Wexley:** ¡HAY ALGUIEN DETRÁS DE USTED!
- [Visión: nichols]
- *Thomas (piensa):* En la oscuridad, la mesa empieza a golpear. Cuento los golpes y los voy apuntando a ciegas en el cuaderno.
- *Thomas (piensa):* Alguien ha vuelto a encender una vela. Los clientes se han ido, y el espejo está partido en estrella.
- **Madame Wexley:** Hay alguien detrás de usted, inspector. Siempre ha estado ahí. Desde que era niño.
- [+ Pista al cuaderno: alguien_detras]
- *Thomas (piensa):* Un truco. Alguien le habló de Nat. ¿Quién sabía lo de Nat?
- [Objetivo] Descifrar los golpes de la mesa. En la pared había una tabla de letras.

### `raps`
- _Si !ok:_
  - *Thomas (piensa):* Más tarde. Fila y columna; tiene que salir algo. _(si flag('knock_board'))_
  - *Thomas (piensa):* Sin la tabla de la pared no hay manera de leerlos. _(si no)_
- [+ Pista al cuaderno: hospes]
- *Thomas (piensa):* HOSPES. Latín. Lo leí en un libro de la facultad: el que recibe en su casa, y también el que es recibido. La misma palabra.
- *Thomas (piensa):* Wexley no lo sabe, o no me lo dirá. Alguien le habla a esta mesa de mí. _(1ª lectura)_
- *Thomas (piensa):* La casa y el que entra en ella. No hablaba de Wexley. _(2ª lectura)_
- [Objetivo] Salir a Fournier Street.

### `leaveSeance`
- [Rótulo] 10 de septiembre — Winthrop Street, de noche
- [→ Escena: knackers]

### `mobScene`
- **Vecinos:** ¡Leather Apron! ¡Es el matarife! ¡Es él!
- **Brennan:** ¡Yo no he hecho nada! ¡Estaba trabajando! ¡Pregunten a Tomkins!
- **Un hombre:** ¡Eh, usted es policía! ¡Díganos si es él!
- > **Elección:** 1) "Es él. Leather Apron."  ·  2) "¡Atrás! ¡Este hombre está bajo custodia!"
- > **Elección:** 1) (Callar)  ·  2) "¡Atrás! ¡Este hombre está bajo custodia!"
- _Si c === 0 && accuse:_
  - **Thomas:** Es él.
  - *Thomas (piensa):* La multitud ruge como si llevara días esperando esa frase.
- _Si no:_
  - _Si c === 0:_
    - *Thomas (piensa):* Me quedo callado. La multitud no necesita que diga nada.
  - _Si no:_
    - **Thomas:** ¡Atrás! ¡Policía!
    - *Thomas (piensa):* Nadie me escucha. Por encima de los gritos alguien se ríe, y tardo un momento en darme cuenta de que soy yo.
- *Thomas (piensa):* Cuando la policía llega a dispersarlos, Brennan está en el suelo, contra el portón, y no se mueve. Respira.
- **Wren:** Usted sabía que no era él.
- > **Elección:** 1) No lo sabía.  ·  2) (No decir nada)
- _Si c2 === 0:_
  - **Wren:** Sí lo sabía. Usted siempre lo sabe todo antes que nadie.
- [Rótulo] Al día siguiente detuvieron a John Pizer, a quien el barrio llamaba "Leather Apron". Tenía coartada y lo soltaron.
- [Rótulo] Brennan no volvió al desolladero.

### `writeC3a`
- *Thomas (piensa):* Informe sobre la vigilancia de Hanbury Street. Agentes asignados: cuatro. Incidencias: ninguna.
- *Thomas (piensa):* Las once y cuarenta. Las once y cuarenta y uno.
- _Si second():_
  - **La voz (la voz):** _Escribe, Tommy. Con la otra tinta._
- _Si no:_
  - *Thomas (piensa):* La llama de la vela se tumba hacia la ventana, como si alguien la hubiera abierto a mi espalda.
- *Thomas (piensa):* Me he quedado dormido sobre el escritorio.
- *Thomas (piensa):* La ventana está abierta de par en par y el tintero rojo, volcado sobre los informes. _(1ª lectura)_
- *Thomas (piensa):* Tengo los dedos de la mano izquierda manchados de rojo hasta los nudillos. _(2ª lectura)_
- [+ Pista al cuaderno: dedos]
- *Thomas (piensa):* Me mancho los dedos intentando salvar las hojas. Faltan tres pliegos de papel de cartas. _(1ª lectura)_
- *Thomas (piensa):* El tintero rojo está casi vacío y el plumín, doblado. Faltan tres pliegos de papel de cartas. _(2ª lectura)_
- *Thomas (piensa):* Tengo que acostarme.
- [Objetivo] Acostarse.

### `sleepC3a`
- [Rótulo] Los días siguientes apenas duermo.
- [Rótulo] 30 de septiembre — 1:46 de la madrugada
- *Thomas (piensa):* No recuerdo haber salido. Estoy en Aldgate, delante de la iglesia de St. Botolph, y oigo a alguien correr hacia Mitre Square.
- [Objetivo] Entrar en Mitre Square.
- [→ Escena: mitre]

### `toGoulston`
- [Objetivo] Buscar el trozo de delantal.
- [→ Escena: goulston]

### `caught`
- **Agente Long:** ¡Eh! ¡Usted! ¡Quieto ahí!
- *Thomas (piensa):* Tengo el trozo de delantal en la mano. No recuerdo haberlo cogido.
- > **Elección:** 1) "¡Soy inspector de la División H!"  ·  2) (Correr)
- _Si c === 0:_
  - **Thomas:** ¡Soy inspector de la Div...!
  - **Agente Long:** Abrigo oscuro, bombín y linterna de policía... ¡Es él! ¡ES ÉL!
- [→ Escena: alleys]

### `endChase`
- *Thomas (piensa):* Bajo los escalones hasta que el agua me llega a los tobillos. Huele al Ditch. Aquí abajo no van a bajar.
- **La voz (la voz):** _Bien, Tommy._
- [→ Escena: room]
- *Thomas (piensa):* Me despierto en mi cama. No sé cuánto he dormido. Quizá un día entero.
- [Objetivo] Leer el periódico. Mirar debajo de la cama.

### `readPaper`
- [Documento] THE DAILY NEWS — 1 de octubre de 1888 LOS CRÍMENES DEL EAST END. UNA CARTA DEL ASESINO. La Central News Agency ha hecho pública una carta recibida el jueves 27, escrita con tinta roja, cuyo autor afirma ser responsable de los crímenes: "I keep on hearing the police have caught me but they wont fix me just yet... That joke about Leather Apron gave me real fits... Red ink is fit enough I hope ha. ha." Yours truly / Jack the Ripper Dont mind me giving the trade name Se ruega a quien reconozca la letra que se presente en Scotland Yard.
- [+ Pista al cuaderno: carta]
- *Thomas (piensa):* El jueves 27. La noche que la ventana amaneció abierta. _(1ª lectura)_
- *Thomas (piensa):* El jueves 27. Fue la noche que me dormí sobre el escritorio. _(2ª lectura)_
- *Thomas (piensa):* "Jack the Ripper". Mañana lo dirán en todas las tabernas de Londres.
- _Si second():_
  - **La voz (la voz):** _Jack._
- *Thomas (piensa):* Esa letra. La he visto antes, en alguna parte. En el escritorio tengo letras de todos.
- _Si flag('accused'):_
  - *Thomas (piensa):* "Lo de Leather Apron me hizo mucha gracia." Brennan sigue sin poder levantarse de la cama.

### `c3bObjective`
- [Objetivo] {`${left.join('; ')}.`.replace(/^./, (m) => m.toUpperCase())} | Salir.

### `compareHands`
- [Documento] Una carta y cuatro letras La carta, tal como la publica el Daily News: "Dear Boſs, I keep on hearing the police have caught me but they wont fix me juſt yet..." La nota de Madame Wexley:"Los muertos piden hablar con usted. No suelen pedir a nadie por su nombre..." Un informe del sargento Pike, con mis correcciones en rojo:"Ronda sin novedad. El agente Neil señala que las farolas de Buck's Row siguen sin gas desde el sábado..." La etiqueta del láudano, de puño y letra del doctor Greaves:"Tinctura opii. Veinte gotas al acoſtarſe, nunca más de treinta. — L. G." El recibo del desolladero de Barber, de Silas Brennan:"X — su marca" {two('', 'Mis apuntes de anatomía, cuarto curso, 1878:"Carótida: corre junto a la tráquea. Se ſecciona de izquierda a derecha, de un ſolo corte..."')}
- *Thomas (piensa):* ¿De quién es la mano que escribió la carta?
- > **Elección:** 1) Madame Wexley.  ·  2) Pike.  ·  3) Greaves.  ·  4) Brennan.  ·  5) {...(second() ? ['Mía.'] : [])}  ·  6) Mirar otra vez las letras.
- *Thomas (piensa):* Redonda, de colegio de monjas, y la s le sale corta. No es la suya. _(para "Madame Wexley.")_
- *Thomas (piensa):* Pike escribe la s corta, como todos los que aprendieron en la escuela de la parroquia. _(para "Pike.")_
- *Thomas (piensa):* Brennan no sabe escribir. Firma con una cruz. _(para "Brennan.")_
- [+ Pista al cuaderno: letra]
- *Thomas (piensa):* La ſ larga: "Boſs", "juſt". Así escriben las recetas los médicos viejos. Así escribe Greaves.
- _Si second():_
  - *Thomas (piensa):* Y así escribía yo en cuarto, copiando sus recetas para aprender. La mano de la carta es la de mis apuntes.

### `leaveRoomC3b`
- _Si !hasClue('letra'):_
  - *Thomas (piensa):* Antes, la carta. Esa letra la he visto antes, y en el escritorio tengo letras de todos.
- _Si !hasClue('estuche'):_
  - *Thomas (piensa):* Antes... hay algo debajo de la cama que no quiero mirar. Tengo que mirarlo.

### `readFile`
- [Documento] LONDON HOSPITAL — EXPEDIENTE CLÍNICO Paciente: T. A., estudiante de cuarto año. Fecha: 14 de marzo de 1879. Médico: L. Greaves. Hallado a las 4 a. m. en la sala de disección, con un bisturí en la mano izquierda. No recuerda cómo entró ni cuánto tiempo estuvo allí. El cadáver de la mesa 3 presenta incisiones que no constan en el programa de prácticas. Interrogado, el paciente afirma que "el agua le llamó por su nombre", como cuando tenía nueve años, y que él "contestó otra vez". Diagnóstico provisional: fuga disociativa (cf. Tissié, 1887). Pérdidas de memoria recurrentes. Posible relación con el ahogamiento de un hermano menor (Limehouse, 1866). El paciente abandona los estudios por voluntad propia. Recomiendo vigilancia discreta. Nota añadida, 1 sep. 1888: El sargento Pike vino a preguntar si un hombre puede hacer cosas y no recordarlas. Le he dicho que sí.
- [+ Pista al cuaderno: expediente]
- *Thomas (piensa):* T. A.
- *Thomas (piensa):* Cualquiera. Hay cientos de...
- **Greaves:** Así que lo has encontrado.
- **Greaves:** Aquella noche te encontré yo, Thomas. Tenías un bisturí en la mano y me preguntaste qué hora era. No te acordabas de nada.
- **Greaves:** Pike vino a verme después de Buck's Row. Lleva desde agosto apuntando a qué hora llegas y de dónde vienes.
- > **Elección:** 1) Me está acusando a mí.  ·  2) ¿Y si tiene razón?  ·  3) Usted le habló de Nat a Wexley.
- _Si c === 0:_
  - **Greaves:** Te estoy pidiendo que te entregues, antes de que vuelva a pasar.
- _Si no:_
  - _Si c === 1:_
    - **Greaves:** Entonces aún estás a tiempo, Thomas. Dame el bisturí.
  - _Si no:_
    - **Greaves:** No conozco a ninguna Wexley. Nunca le he contado lo de tu hermano a nadie.
- **Greaves:** Dame el bisturí, Thomas. Despacio.
- [Visión: hands]
- **Greaves:** ¡Thomas...! No...
- *Thomas (piensa):* Tengo el bisturí en la mano izquierda y hay sangre en la hoja.
- *Thomas (piensa):* Greaves se sujeta la mano, que sangra. Está vivo. Está vivo.
- **Greaves:** Vete. Corre, antes de que llegue Pike. Y que Dios se apiade de los dos.
- [Rótulo] 9 de noviembre — Limehouse, 2:30 de la madrugada
- [→ Escena: foreshore]

### `finaleIntro`
- *Thomas (piensa):* Los silbatos se oyen arriba, en Narrow Street. Aquí abajo solo está el agua.
- *Thomas (piensa):* Aquí se ahogó Nat. Aquí contesté. _(si flag('answered1866'))_
- *Thomas (piensa):* Aquí se ahogó Nat. Aquí no contesté. Eso he creído siempre. _(si no)_
- *Thomas (piensa):* Tengo que pensar con orden, como en cualquier caso.
- [+ Pista al cuaderno: ficha]
- *Thomas (piensa):* En el cuaderno hay una página nueva, escrita con mi letra: mi propia ficha. Tengo que contrastarla con el perfil.
- [Objetivo] En el cuaderno: relacionar mi ficha con las pistas del asesino (al menos tres).

### `outfall1888`
- *Thomas (piensa):* El desagüe brilla por dentro con una luz verde y lenta, como si respirara.
- _Si finals(G) < 3:_
  - *Thomas (piensa):* Todavía no. Antes tengo que estar seguro. El cuaderno.
- **La voz (la voz):** _Ven al agua, Tommy._

### `finaleWater`
- _Si finals(G) < 3:_
  - *Thomas (piensa):* El agua me llama, pero todavía no. Primero el cuaderno: tengo que saberlo con certeza.
- _Si flag('sospecha_pike') || flag('sospecha_greaves') || flag('accused'):_
  - *Thomas (piensa):* Busqué en Brennan, en Greaves, en Pike. Busqué en todos menos en el agua.
- *Thomas (piensa):* Ya lo sé. Lo sé desde Buck's Row.
- **La voz (la voz):** _Thomas._
- > **Elección:** 1) Responder.  ·  2) No responder.
- _Si !flag('answered1866'):_
  - **La voz (la voz):** _La primera vez callaste, Tommy. No hacía falta que contestaras. Ya estaba dentro._
- **La voz (la voz):** _Tommy. Mírame._
- > **Elección:** 1) No responder.  ·  2) No responder.  ·  3) No responder.
- **Thomas:** Aquí estoy.
- *Thomas (piensa):* En el agua hay un hombre. Lleva mi abrigo, pero no se ha arrodillado conmigo.
- **La voz (la voz):** _Ya no hace falta que contestes, Tommy. Ahora contestan por ti. Escucha._
- *Thomas (piensa):* "¡Jack the Ripper!", grita un vendedor de periódicos en Commercial Street.
- *Thomas (piensa):* "Jack", dice una mujer en una taberna de Dorset Street, y se santigua.
- *Thomas (piensa):* "Jack", escribe Pike en su informe al comisario.
- *Thomas (piensa):* "Jack", rezan en Spitalfields las madres a sus hijos para que no salgan de noche.
- **La voz (la voz):** _Todo Londres dice mi nombre. Ya tengo una dirección, Tommy. Ya puedo quedarme._
- > **Elección:** 1) "Me llamo Thomas Ashgrove."  ·  2) "Me llamo Thomas Ashgrove."
- **Thomas:** Me llamo Thomas...
- **La voz (la voz):** _¿Seguro?_
- **Thomas:** Me llamo...
- [Visión: eddowes]
- [Visión: hands]
- [→ Escena: millers]

### `epilogue`
- **Wren:** ¡Señor!
- **Wren:** Le buscan todos: Pike, los de la City y los vecinos con palos.
- **Wren:** Ya sabía yo que vendría por aquí. Huele usted al Ditch más que nunca.
- _Si flag('wren_paid'):_
  - **Wren:** Tenga su penique. No lo quiero: está frío.
- **Wren:** ¿Cómo se llama usted, señor? Su nombre de verdad.
- **Wren:** No... Usted se llamaba Thomas, señor. Acuérdese. _(si state.sanity >= 40)_
- **Wren:** No... No, señor. Usted antes se llamaba de otra manera. _(si no)_
- *Thomas (piensa):* Desde el fondo del patio llega una voz de mujer que canta muy bajo una canción sobre una violeta cogida de la tumba de una madre.
- [Rótulo] Yours truly, Jack the Ripper — Don't mind me giving the trade name.
- [Rótulo] El 9 de noviembre de 1888, Mary Jane Kelly fue asesinada en su habitación del número 13 de Miller's Court. Tenía unos veinticinco años. Esa noche la oyeron cantar.
- [Rótulo] Fue la última de las cinco víctimas canónicas. El asesino nunca fue identificado.
- [Rótulo] Silas Brennan no volvió a andar sin bastón. Nadie le pidió perdón. | Silas Brennan declaró en la investigación por Mary Ann Nichols. Nadie volvió a preguntarle nada.
- [Rótulo] Nadie volvió a ver al inspector Thomas Ashgrove.
- [Rótulo] El Black Ditch sigue corriendo bajo el East End.
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
  - *Thomas (piensa):* Policía Metropolitana, División H. Inspector T. Ashgrove. La foto está tan borrosa que podría ser cualquiera.

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
- Texto: Entre las 3:30 y las 3:40 nadie podía ver el portón: Thain acababa de alumbrar la calle y Cross aún no había llegado. Diez minutos, y quien lo hizo lo sabía.
- Verdad (2ª lectura): La hoja de rondas la firmé yo.

**`silencio`**
- Dónde: Buck's Row
- Texto: Nadie oyó nada. La señora Green dormía a tres metros, detrás de esa ventana.
- Verdad (2ª lectura): No gritó. Un policía no da miedo.

**`zurdo`**
- Dónde: Buck's Row · Dr. Llewellyn
- Texto: Según el forense, los cortes van de izquierda a derecha: quien lo hizo es probablemente zurdo.
- Verdad (2ª lectura): Escribo con la izquierda.

**`anatomia`**
- Dónde: Buck's Row · Dr. Llewellyn
- Texto: El forense dice que el asesino tenía "cierta noción de anatomía".
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
- Verdad (2ª lectura): Yo ya había respondido.

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
- Texto: Le arrancaron dos anillos de latón del dedo y le dejaron el tercero. Las marcas siguen ahí. No estaban entre sus cosas.
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
- Verdad (2ª lectura): Contesté. Siempre contesto.

**`hospes`**
- Dónde: Sesión de espiritismo
- Texto: En la oscuridad, la mesa golpeó una palabra latina: HOSPES. El que recibe y el que es recibido; el anfitrión y el huésped.
- Verdad (2ª lectura): Me lo decía a mí. Yo soy la casa.

**`dedos`**
- Dónde: Mi cuarto · 27 sep
- Texto: Me desperté sobre el escritorio a las 3:15. El tintero rojo estaba volcado, la ventana abierta y faltaban tres pliegos de papel de cartas.
- Texto (2ª lectura): Me desperté sobre el escritorio a las 3:15, con los dedos de la mano izquierda manchados de rojo. El tintero de tinta roja estaba casi vacío.
- Verdad (2ª lectura): La ventana la abrí yo, al volver.

**`llave_pike`**
- Dónde: Mi cuarto · 27 sep
- Texto: La puerta estaba cerrada con llave. Solo hay otra llave de este cuarto: la que guarda Pike, por si me necesitan de noche.
- Verdad (2ª lectura): Pike nunca la usó.

**`rapido`**
- Dónde: Mitre Square · 30 sep
- Texto: El agente de la City me preguntó cómo había llegado tan rápido. Él la había encontrado hacía cuatro minutos.
- Verdad (2ª lectura): Llegué antes porque no me había ido.

**`trozo`**
- Dónde: Mitre Square
- Texto: Falta un trozo del delantal de Catherine Eddowes, cortado a cuchillo.
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

**`aqui_estoy`**
- Dónde: Goulston St.
- Texto (2ª lectura): Junto al trozo de delantal, alguien escribió con tiza: HERE I AM. Es lo que yo contesté al agua.
- Verdad (2ª lectura): Con mi letra inclinada.

**`testigo`**
- Dónde: Mitre Square
- Texto: Un testigo vio a un hombre con abrigo oscuro y bombín que llevaba una linterna "como las de la policía".
- Verdad (2ª lectura): Como yo.

**`carta`**
- Dónde: Prensa · 1 oct
- Texto: La Central News publica una carta escrita con tinta roja y firmada: Jack the Ripper.
- Verdad (2ª lectura): La escribí la noche del 27.

**`letra`**
- Dónde: La carta
- Texto: La carta usa la ſ larga de las recetas antiguas: "Boſs", "juſt". Así escribe el doctor Greaves; está en la etiqueta de mi láudano.
- Verdad (2ª lectura): Y así escribía yo en cuarto: aprendí copiando sus recetas.

**`estuche`**
- Dónde: Mi cuarto · 1 oct
- Texto: Mi viejo estuche de disección, debajo de la cama. Falta un bisturí.
- Verdad (2ª lectura): No me lo robaron.

**`expediente`**
- Dónde: Dr. Greaves
- Texto: Expediente "T. A.", 1879: fuga disociativa. El paciente despertó en la sala de disección con un bisturí en la mano izquierda.

**`ficha`**
- Dónde: Yo
- Texto: Thomas Ashgrove. 34 años. Zurdo. Cuatro años de medicina en el London Hospital. Inspector de la División H. Vive junto al Black Ditch.

### Deducciones (unir dos pistas)

**`d_ronda`**
- Une las pistas: `ronda` + `silencio`
- Rasgo del perfil: Conoce las rondas de la policía
- Texto: Actúa en el hueco entre dos rondas, sin hacer ruido. Sabe exactamente por dónde y cuándo pasan los agentes.

**`d_zurdo`**
- Une las pistas: `zurdo` + `anatomia`
- Rasgo del perfil: Zurdo, con nociones de anatomía
- Texto: Un zurdo que sabe dónde cortar: un matarife, un carnicero... o un médico.

**`d_barro`**
- Une las pistas: `botas` + `ventana`
- Texto: Alguien entra por mi ventana mientras duermo y sale con mis botas. Me las devuelve empapadas, con barro del río.
- Verdad (2ª lectura): Nadie entra. Salgo yo.

**`d_brennan`**
- Une las pistas: `brennan_zurdo` + `zurdo`
- Texto: Brennan es zurdo, sabe usar el cuchillo y trabajaba a cien yardas. Es el primer sospechoso.
- Verdad (2ª lectura): Brennan es zurdo. Yo también.

**`d_bisturi`**
- Une las pistas: `bisturi` + `anatomia`
- Rasgo del perfil: Formación médica (London Hospital)
- Texto: Un bisturí de la sala de disección del London Hospital. Quien lo perdió estudió allí.

**`d_delantal`**
- Une las pistas: `delantal` + `brennan_zurdo`
- Texto: Un delantal de cuero en Hanbury Street. Brennan lleva uno igual. "Leather Apron."
- Verdad (2ª lectura): El delantal era del hijo de la casera; ella misma lo había lavado. Brennan no tenía nada que ver, y yo lo sabía.

**`d_ordenados`**
- Une las pistas: `ordenados` + `anatomia`
- Rasgo del perfil: Metódico: trata a la víctima como a un paciente
- Texto: No es furia, es método. La trata como a un paciente en la mesa de disección.

**`d_greaves`**
- Une las pistas: `greaves_sabe` + `alguien_detras`
- Texto: Greaves y Wexley se conocen. Alguien le habló de Nat a esa mujer, y solo pudo ser Greaves.
- Verdad (2ª lectura): Nadie le habló de Nat a Wexley. La voz se lo dijo.

**`d_nat`**
- Une las pistas: `nat_voz` + `regla`
- Rasgo del perfil: Ronda el río
- Texto: La voz del agua dice nombres en la orilla del Ditch. Quien la oye y contesta, cambia.

**`d_hospes`**
- Une las pistas: `hospes` + `regla`
- Texto: El agua llama, alguien contesta, y desde entonces hay un anfitrión y un huésped. Wexley no hablaba de espíritus: hablaba del Ditch.

**`d_rojo`**
- Une las pistas: `dedos` + `carta`
- Texto: La carta se escribió con tinta roja la noche en que mi ventana amaneció abierta y mi tintero volcado. Alguien la escribió en mi mesa.
- Verdad (2ª lectura): Escribí esa carta. Le di un nombre.

**`d_pike`**
- Une las pistas: `llave_pike` + `testigo`
- Texto: Abrigo oscuro, bombín, linterna de policía y una llave de mi cuarto. Pike lleva desde agosto apuntando dónde estoy.
- Verdad (2ª lectura): Pike apuntaba dónde estaba yo porque tenía miedo de saberlo.

**`d_letra`**
- Une las pistas: `letra` + `greaves_sabe`
- Texto: Greaves sabe de mí lo que no sabe nadie, y escribe como la carta. Tengo que entrar en su consulta.
- Verdad (2ª lectura): Escribo como él porque me enseñó él.

**`d_rapido`**
- Une las pistas: `rapido` + `ronda`
- Rasgo del perfil: Llega a las escenas antes que la policía
- Texto: Siempre está cerca. Llega antes que nadie.

**`d_testigo`**
- Une las pistas: `testigo` + `trozo`
- Rasgo del perfil: Abrigo oscuro, bombín, linterna de policía
- Texto: Abrigo oscuro, bombín, una linterna de policía. Corta el delantal para limpiarse y lo deja a la vista.

**`d_estuche`**
- Une las pistas: `estuche` + `bisturi`
- Texto: El bisturí de Buck's Row es el que falta en mi estuche. Me lo robaron: el mismo que entra por mi ventana.
- Verdad (2ª lectura): No me lo robaron. Wren lo sacó de la alcantarilla de Buck's Row.

**`d_aqui`**
- Une las pistas: `aqui_estoy` + `nat_voz`
- Rasgo del perfil: Le respondió al agua
- Texto: "Here I am." Aquí estoy. Él también le contestó al agua.

**`d_confianza`**
- Une las pistas: `cuello` + `silencio`
- Rasgo del perfil: Ella no le tuvo miedo
- Texto: Nadie gritó y ella no se defendió. Dejó que se le acercara: alguien de quien uno se fía. Un médico. Un policía.
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
- Texto: Le busqué el pulso antes de que llegara Watkins. Es lo que haría cualquier policía.
- Verdad (2ª lectura): La sangre de mis guantes ya estaba seca cuando Watkins la encontró.

**`f_zurdo`**
- Une las pistas: `ficha` + `zurdo`
- Texto: Zurdo.

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
- Texto: Las huellas van del Ditch a Buck's Row, y de Buck's Row a mi puerta.
