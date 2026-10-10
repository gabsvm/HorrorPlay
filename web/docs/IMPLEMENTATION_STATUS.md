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
| 4 · Hanbury y peine | TODO | | | | | |
| 5 · Sesión | TODO | | | | | |
| 6 · Capítulo III | TODO | | | | | |
| 7 · Capítulo IV | TODO | | | | | |
| 8 · Cordura | TODO | | | | | |
| 9 · Segunda lectura | TODO | | | | | |
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
