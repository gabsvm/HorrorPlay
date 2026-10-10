# El Huésped — estado de implementación del plan maestro

Seguimiento de `EL_HUESPED_PLAN_MAESTRO_IMPLEMENTACION.md` en la rama `reboot/web-el-huesped`.
Estados: `TODO`, `IN_PROGRESS`, `CODE_COMPLETE` (código hecho, pruebas automáticas pasan), `TESTED` (además, comprobado a mano en navegador o dispositivo real), `BLOCKED`.
Ninguna fase se marca `TESTED` sin una comprobación real en navegador o teléfono.

## Cómo correr las pruebas

```bash
node web/tools/test-all.mjs            # todo: unitarias, smoke, audio, integridad, compatibilidad y las tres partidas
node web/tools/test-all.mjs --quick    # sin las partidas largas
node web/tools/walk.mjs <escenario>    # una partida o escenario de web/tests/scenarios/
node web/tools/unit.mjs                # solo la lógica pura (web/tests/unit/)
```

## Fases

| Fase | Estado | Qué se hizo | Commit | Pruebas | Pendiente | Observación manual |
|---|---|---|---|---|---|---|
| 0 · Baseline | CODE_COMPLETE | Línea base registrada; harness de escenarios con elecciones por texto; instantáneas de guardado por capítulo (ambas lecturas) y un guardado anterior a la V3; pruebas de compatibilidad, integridad y unitarias; `test-all.mjs` | ver historial | ver abajo | — | Sin comprobación visual (la fase no cambia nada visible) |
| 1 · Progresión y teorías | CODE_COMPLETE | `story/progression.js` (condiciones puras `canFinishC1`, `canLeaveHanbury`, `canStartSeance`, `canLeaveMitre`, `canLeaveRoomC3b`, `canEnterFinale` con fuentes independientes, `currentGate`, `normalizeState`); `story/theories.js` (4 preguntas del caso con hipótesis y estado derivado de las pruebas); cuaderno con pestañas Conclusiones / Teorías / Perfil; ayuda en dos niveles que dice qué falta; estados guardados en `state.investigation`; errores de guion visibles solo en desarrollo | ver historial | unit 21/21, notebook, compat, walks | El cierre explícito del capítulo I llega en la Fase 3 (por ahora sigue siendo automático, pero ya no exige `d_brennan`) | Navegador: pestañas y ayuda comprobadas en Hanbury con un estado preparado |
| 2 · Feedback y ritmo | CODE_COMPLETE | Ninguna interacción muda (inventario abajo); `again` para la segunda mirada corta; «Volver a mirar» en lo ya examinado; respuestas variadas por familia al usar mal un objeto; salidas bloqueadas que dicen lo que falta (Hanbury, Mitre, cuarto en c3); aviso al cerrar un primer plano con detalles clave sin ver; tarjetas que se cortan con clic/toque/tecla; opción «Lo ya leído: Al instante»; protección de 280 ms contra elegir con el clic que terminó la línea; opción «Movimiento: Reducido» (respeta `prefers-reduced-motion`) | ver historial | feedback + suite | Duraciones de tarjetas y esperas se revisan en la Fase 10 | Navegador: tarjeta cortada con clic (1,8 s en vez de 7), elección protegida, menú de opciones |
| 3 · Capítulo I | CODE_COMPLETE | La noche se cierra cuando el jugador lo decide, con Pike en Buck's Row («Cerramos por esta noche, Pike.») o con Brennan en el desolladero («Esto es todo por esta noche.»), si `canFinishC1` se cumple; ninguna deducción ni entrada en una calle cambia de capítulo sola; al cerrar se registra la postura sobre Brennan (`brennan_stance`: vigilarlo / nada contra él / no lo sé) y la ruta en `investigation.routes.c1`; Pike responde a cada postura; `endC1` se pone en escena donde se cierra; la hoja de rondas, tras dos fallos, vuelve a señalar las dos horas que importan | ver historial | c1-minimal, walk (Brennan, sospecha), walk alt (Pike, sin sospecha) | La turba usa la postura en la Fase 4 | Navegador: el menú de Pike ofrece «Cerramos por esta noche, Pike.» con el mínimo reunido (el resto del flujo, en las partidas automáticas: el panel oculto pausa las animaciones) |
| 4 · Hanbury y peine | CODE_COMPLETE | «Dárselo a Pike» le entrega el peine de verdad (`comb_custody: 'pike'`, sin objeto en el inventario, Pike lo anota); «Guardármelo» lo da a Thomas (`'thomas'`); los guardados viejos con el peine quedan como `'thomas'`; la salida exige una decisión, no el objeto; la sesión empieza sin peine si lo tiene Pike (Wexley lo sabe, Thomas lo describe en voz alta); una línea verificable sobre Annie (ganchillo y flores, enferma); acusar en la turba solo si hay razón (`d_delantal` o postura «vigilarlo»); si acusa sabiendo de quién era el delantal, Thomas lo recuerda; Wren responde a lo que Thomas hizo (agradece la escolta, reprocha el resto) y su respuesta se guarda (`wren_mob_reply`) | ver historial | comb-pike, mob, walk, walk alt | — | Sin comprobación visual de esta fase |
| 5 · Sesión | CODE_COMPLETE | Orden nuevo: la mesa golpea sola antes de empezar (`raps_heard`, Wexley: «Yo no he empezado»), Thomas los lee con la tabla de la pared (`hospes_decoded`, `seance_prepared`) y solo entonces la sesión; en la oscuridad suenan los mismos golpes y HOSPES cobra su doble sentido; la salida queda libre al terminar; el puzle explica más con cada fallo (grupos → fila/columna → la primera letra) y desde el tercero Wexley puede leer «HOS»; fallos y ayuda guardados en `investigation.evaluations.raps`; los guardados viejos con la sesión hecha y los golpes sin leer siguen funcionando; nunca hay dos sesiones | ver historial | seance, comb-pike, mob, walk | — | Navegador: puzle con la ayuda de la primera letra, botón «Pedir ayuda a Wexley» que rellena HOS, palabra completada; corregido que la línea de Wexley quedaba tapada por el puzle (z-index) |
| 6 · Capítulo III | CODE_COMPLETE | Caligrafía: opción «La muestra no basta. Necesito más pruebas.» que da `letra` y deja avanzar; `handwriting_assessment` (`greaves_like` / `inconclusive` / `self_recognition`) y `hand_inconclusive` para las teorías; Greaves, en el IV, alude a cómo Thomas trató esa prueba. Persecución: `chase_mistakes` y `chase_outcome` (`clean` 0, `spotted` 1–2, `injured` 3) con consecuencias visibles: una línea al acabar, una noticia en el periódico del 1 de octubre, lo que Pike dice en la puerta y lo que Greaves ve en la mano; temporizador 4,6 s (5,6 s en táctil). Mitre: un detalle humano verificable de Catherine Eddowes (Kent, el lúpulo, John Kelly) y de Elizabeth Stride (sueca, cerca de Gotemburgo, «Long Liz») | ver historial | chapter3 (tres persecuciones, dos valoraciones), walk | — | Sin comprobación visual de esta fase |
| 7 · Capítulo IV | CODE_COMPLETE | Reconocimiento: el final exige tres pruebas de fuentes independientes (`FINAL_SOURCES`; el barro no cuenta) y, al reunirlas, Thomas lo reconoce en gestos (se mira la mano, la linterna se apaga un instante), sin monólogo; en el agua, «Todavía no estoy seguro» devuelve al cuaderno. Pike: `surrender` = Pike entra y cierra la primera esposa antes de la laguna (`pike_cuff`); `warn_wren` = Thomas da el lugar exacto (las cajas de Barber) y Pike lo repite (`wren_warned`); `destroy_page` = el folio se rompe (`file_torn`), Pike recuerda que la enfermera Bell vive. La laguna se muestra (22:51 → 2:30) y lo intentado sigue en él al despertar. Agua: una sola elección con actitudes distintas, cada una con su puesta en escena (`water_reply_intent`: answer / silent / hand / unsure; `water_resistance`); ninguna afirma una entrada nueva. Epílogo: Wren guarda distancia y lleva el silbato de Pike si fue avisada, y su última frase responde a lo que hizo Thomas y a su cordura; un rótulo propio por cada acto. Firma: transformación pura y probada (`engine/signature.js`), teclado cerrado antes de transformar | ver historial | finale (3 actos × 3 actitudes × ambas rutas de 1866), unit signature, walk | Playtest en Android del teclado virtual en la firma | Sin comprobación visual de esta fase |
| 8 · Cordura | CODE_COMPLETE | `story/perception.js`: bandas `steady` ≥65 / `strained` 36–64 / `frayed` ≤35, calibradas con una partida real (≈100 en el I, 72 al empezar el II, 54 en el III, 0 al llegar al IV en una partida exhaustiva); todas las reglas en un sitio. A favor: firme → en los cuerpos lo importante sin examinar se ve desde más lejos y el contador lo dice; firme → la hoja de rondas señala las dos horas tras un fallo (no dos); desgastado → el método de los golpes se ve desde el principio; desgastado → la luz verde del Ditch aparece en el río (señal, nunca prueba). En contra: tensa/desgastada → algunos clics responden con un susurro (solo sonido); desgastado → las explicaciones plausibles se marcan «lo dudo» en el cuaderno; desgastado → Watkins y Greaves lo notan. El láudano sigue siendo de un solo uso y dice lo que cuesta. Corregido: con cordura baja la última frase de Wren ya no tapa la que responde a lo que hizo Thomas | ver historial | sanity (10/36/64/100), unit perception, suite | Calibrar con playtest humano si los umbrales se sienten así | Sin comprobación visual de esta fase |
| 9 · Segunda lectura | CODE_COMPLETE | Un momento jugable nuevo por capítulo: prólogo, el hombre con bombín en el agua tras recoger el barco (sin tocar la elección de 1866); I, «Déjeme ver su libreta, Pike» (horas de llegada de Thomas, botas mojadas); II, Wexley entiende a quién hablan los golpes; III, el borrador de la carta bajo el secante, con su letra; IV, el esqueleto devuelve la noche de 1879 en una visión. Atajos para puzles ya resueltos (rondas, golpes) solo si `Game.read()` y la lectura es la segunda, y dando las mismas pistas y flags | ver historial | second-reading (con y sin la marca de juego terminado), walk second | — | Sin comprobación visual de esta fase |
| 10 · Edición | TODO | | | | | |
| 11 · QA y entrega | TODO | | | | | |

## Línea base (antes de tocar el flujo), commit `f04d1fa`

Ejecutado el 10-10-2026 desde `web/`:

| Comando | Resultado |
|---|---|
| `node tools/smoke.mjs` | `Sin problemas.` (11 escenas construidas y dibujadas) |
| `node tools/walk.mjs` | `ok: true`, 334 líneas, 25 deducciones, termina en el menú |
| `node tools/walk.mjs alt` | `ok: true`, 97 líneas, llega a la sesión |
| `node tools/walk.mjs second` | `ok: true`, 337 líneas, 25 deducciones |
| `node tools/audio-smoke.mjs` | `Audio sin problemas.` |
| `node tools/script/export.mjs` | `GUION.md: 1370 lines, 307 spoken or thought` |

Recuento en el código de la línea base: 124 llamadas a `G.think` y 135 a `G.say` en historia y escenas (no equivale a líneas por partida).

## Instantáneas de guardado (compatibilidad)

- `tests/fixtures/saves-v1-baseline/<capítulo>.json`: el estado que el juego guarda al empezar cada capítulo (`elhuesped.save.v1.ch.<id>`), primera lectura, generado con la partida automática de la línea base.
- `tests/fixtures/saves-v1-baseline-second/`: lo mismo en la segunda lectura.
- `tests/fixtures/legacy-c3-pre-v3.json`: un guardado del capítulo III sin los campos que añadió la V3 (`signature`, `entry_year`, `brennan_outcome`).
- `tests/scenarios/compat.js` carga todos, comprueba escena, pistas y objetos, y que reanudar no repite la entrada de una escena.

## Rutas y puntos que el plan obliga a modificar

| Punto | Archivo | Problema en la línea base |
|---|---|---|
| Cierre del capítulo I | `knackers.js` (`enter`, `onDeduce`), `bucks_row.js` (`onDeduce`), `chapters.js` (`c1Objective`, `endC1`) | Exige `d_brennan` y `d_bisturi`; la transición salta sola al cerrar el cuaderno |
| Peine | `hanbury.js` (`comb`, `passage`), `seance.js`, `chapters.js` (`seance`) | «Dárselo a Pike» guarda el peine igualmente |
| Sesión | `seance.js`, `chapters.js` (`seance`, `raps`), `ui.js` (`knockPuzzle`) | El puzle HOSPES se resuelve después del clímax |
| Caligrafía | `chapters.js` (`compareHands`) | La única salida válida en la primera lectura es elegir a Greaves |
| Persecución | `alleys.js`, `chapters.js` (`caught`, `endChase`) | Los errores no dejan consecuencia |
| Pike y final | `chapters.js` (`readFile`, `finaleWater`, `epilogue`) | La última acción solo cambia una línea; las elecciones en el río se descartan |
| Wren tras la turba | `chapters.js` (`mobScene`) | Le recrimina a Thomas incluso si lo protegió; la respuesta se descarta |
| Salidas mudas | `bucks_row.js` (`east`), `mitre.js` (`east`), `room.js` (puerta en c3b) | Hotspots activos que no responden |
| Fallos de guion | `game.js` (`run`) | Solo `console.error`; sin registro de desarrollo |
| Cordura | `game.js`, escenas | Solo efectos visuales y una frase de Wren |
| Segunda lectura | escenas y `chapters.js` | Sobre todo cambia textos; repite los puzles |

## Matriz de estados y decisiones

Se completa en la Fase 11 con el escenario automático que cubre cada fila.

## Registro de pruebas por fase

### Fase 0

```
PASS  unit                         0.1s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  integrity                    0.3s
PASS  compat                       0.4s
PASS  walk                         3.5s
PASS  walk second                  3.4s
PASS  walk alt                     0.6s
```

### Fase 1

```
PASS  unit (21 pruebas)            0.1s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  scenario compat              0.4s
PASS  scenario integrity           0.3s
PASS  scenario notebook            0.3s
PASS  walk                         3.5s
PASS  walk second                  3.5s
PASS  walk alt                     0.7s
```

Navegador (localhost:5317, Hanbury con un estado preparado): las pestañas Conclusiones / Teorías / Perfil cambian; la pestaña Teorías muestra dos preguntas con estados `plausible`, `sin evaluar` y `no demostrada` y sus pruebas; «¿Qué hago ahora?» responde con el objetivo y «me falta mirar lo que hay junto a la valla, a los pies de Annie». Sin errores en consola.

### Fase 2

Inventario de interacciones que no respondían y qué se hizo:

| Escena · objeto | Antes | Ahora |
|---|---|---|
| Buck's Row · «Hacia Baker's Row» | salida activa sin función | quitada |
| Buck's Row · rastro | repetía todo | segunda vez: una línea (`again`) |
| Cuarto · puerta en c3a | nada | cerrojo y aviso («Primero, los informes» / «Cerrada por dentro») |
| Cuarto · puerta en c3b sin periódico | nada | «Hay un periódico bajo la puerta.» |
| Cuarto · escritorio en c1, espejo, mapa, láudano agotado | nada | sonido de papel / susurro / «Ya no queda.» |
| Desolladero · poste | nada sin Wren | sonido (ambientación deliberada) |
| Hanbury · ventana tras el reflejo | nada | susurro |
| Hanbury · pasillo | mencionaba el peine antes de verlo | dice lo primero que falta según `canLeaveHanbury` |
| Mitre · cuerpo y Morris sin placa | nada | aviso «Watkins no me deja acercarme sin ver la placa.» |
| Mitre · salida al este | nada | «Todavía no. Me falta…» según `canLeaveMitre` |
| Mitre · placa enseñada dos veces | nada | «Ya la ha visto.» |
| Consulta · cajón abierto | nada | sonido |

```
PASS  unit                         0.1s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario integrity           0.3s
PASS  scenario notebook            0.3s
PASS  walk                         3.5s
PASS  walk second                  3.4s
PASS  walk alt                     0.6s
```

### Fase 3

Casos del plan y dónde se prueban:

| Caso | Prueba |
|---|---|
| `d_bisturi` sin `d_brennan` avanza | `walk alt` (cierra con Pike), `c1-minimal` (cierra con Brennan, «no lo sé») |
| `d_brennan` y `d_bisturi` avanza sin forzar acusación | `walk` |
| Ignorar huellas, cuerpo, rondas, Neil y el chico | `c1-minimal` |
| Bisturí y deducción antes de volver al desolladero | `walk alt` (deduce en Buck's Row y cierra allí) |
| Ir y volver entre las dos calles sin transición | `c1-minimal` |
| El capítulo II empieza una sola vez | `c1-minimal` |

```
PASS  unit                         0.1s
PASS  smoke                        3.0s
PASS  audio                        0.1s
PASS  scenario c1-minimal          0.6s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario integrity           0.3s
PASS  scenario notebook            0.3s
PASS  walk                         3.4s
PASS  walk second                  3.4s
PASS  walk alt                     0.7s
```

### Fase 4

- `comb-pike`: entrega a Pike, orden distinto (casera, peine, médico, delantal), reanudación sin duplicar ni recuperar el peine, sesión sin peine.
- `mob`: los tres desenlaces desde la misma noche; acusar solo con razón; Wren no culpa la ruta `protected`; respuesta guardada.

```
PASS  unit                         0.1s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  scenario c1-minimal          0.6s
PASS  scenario comb-pike           1.2s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario integrity           0.3s
PASS  scenario mob                 1.6s
PASS  scenario notebook            0.3s
PASS  walk                         3.6s
PASS  walk second                  3.4s
PASS  walk alt                     0.6s
```

### Fase 5

```
PASS  unit                         0.1s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  scenario c1-minimal          0.6s
PASS  scenario comb-pike           2.0s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario integrity           0.3s
PASS  scenario mob                 2.4s
PASS  scenario notebook            0.3s
PASS  scenario seance              2.2s
PASS  walk                         4.1s
PASS  walk second                  4.2s
PASS  walk alt                     0.6s
```

### Fase 6

`chapter3`: tres veces desde el punto de control del capítulo III; limpia / vista / herida; letra «no basta» o «se parece a la de Greaves»; comprueba la línea de Greaves y la de Pike en el IV para cada combinación.

### Fase 7

`finale`: surrender + callar (ruta 1879), warn_wren + taparse la boca (ruta 1866), destroy_page + responder (1879); comprueba la laguna mostrada, lo que queda en Thomas al despertar, que sin pruebas no empieza el final, el reconocimiento, «Todavía no», la línea de Wren y el rótulo de cada acto, y que la firma acaba en Jack. `unit/signature`: nombres largos, vacíos, nulos, con acentos y emoji.

### Fase 8

Valores medidos (punto de control al empezar cada capítulo, partida exhaustiva automática): prólogo 100, c1 100, c2 72, c3 54, c4 0 (el IV suma +10 al empezar). `sanity`: 10, 36, 64 y 100 completan los golpes y el final; ayuda inicial de los golpes 1 solo en ≤35; Wren responde siempre a la acción final.

### Fase 9

`second-reading`: sin la marca de juego terminado no aparece el atajo; con ella, los cinco momentos y los dos atajos.
