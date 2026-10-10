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
| 1 · Progresión y teorías | TODO | | | | | |
| 2 · Feedback y ritmo | TODO | | | | | |
| 3 · Capítulo I | TODO | | | | | |
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
