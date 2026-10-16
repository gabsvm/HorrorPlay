# T7 — Wren E2E real: penique, suelo, bisturí y guardados

## Qué cambió
- `web/tools/browser-check.mjs` (+145 líneas): etapa nueva T7 al final de la suite, mismo estilo (Chrome sin ventana por CDP, servidor propio, `need(...)`, exit 1 si falla, SKIP sin Chrome).
- `web/art_review/scenery_refresh/scripts/capture_wren_e2e.mjs` (nuevo): genera la evidencia visual con el mismo recorrido real y combina con PIL en paleta (< 500 KB). Los temporales van a `tmpdir` y se borran.
- `web/art_review/scenery_refresh/comparison/exchange/WREN_E2E_640.png` (nuevo, 316 KB, 1280x360 P): izquierda penique sobre el poste, derecha Wren en el suelo, a 640x360 cada mitad.
- Este informe. No se tocó canon, textos, flags, `state`, puzles, costes, deducciones ni final. No hizo falta arreglar puesta en escena: no se encontró fallo real del juego.

## Cómo se juega la prueba (real)
Sin `FAST` y sin `?scene=`/`flags`: `open('')` (menú), `startChapter('c1', c1.json)` por la entrada normal, y con clics reales (`game.onClick` con coordenadas del hotspot) más botones DOM `.choice` reales (con espera de 650 ms por el guardián de 280 ms y reintento sin consumir la elección). Ruta mínima real: cuarto (abrigo, botas, linterna, puerta) → Buck's Row (Pike médico, Pike paso, oeste) → knackers → Wren (`penique`, `por que`). Reloj real (~60 s la ida, ~30 s el intercambio, ~40 s reanudar+rehacer).

## Qué comprobó (todo en verde en esta máquina)
- Penique visible: flag `wren_coin_on_post` en ≥3 muestras (19 en la corrida de `browser-check`) y fotograma no negro (`present` + `readPixels`, suma 15564 en esa corrida).
- Wren con los pies en el suelo: máx `wy` a ≤2 px de 628, con muestras intermedias 561–620 (descenso progresivo, sin flotar); moneda retirada al recogerla (`paid && !coin`).
- Final: `wren_paid`, `coin` falso, `penique` consumido, `bisturí` una vez sin duplicados, pistas `bisturi`+`regla`, `running` 0 en `knackers`, cero errores JS y cero `scriptErrors`.
- Guardados: `autosave()` en mitad de la secuencia (con `running` > 0) no escribe; el guardado de después es coherente; reanudar desde el de después mantiene; reanudar desde el de antes queda limpio (con `penique`, sin `bisturí`, sin intermedios) y permite rehacerla completa (segundo intercambio entero, también en verde).

## Resultado real de `node web/tools/test-all.mjs`
Todo PASS (exit 0). `browser` 169.5 s con `navegador: todo bien`, incluidos los 23 `ok wren e2e`. Resumen completo (46 líneas, todas PASS): unit, smoke, audio, 38 escenarios, walk, walk second, walk alt y browser. Sin SKIP ni FAIL en esta máquina (hay Chrome).

## Qué NO comprobó (honesto)
- Píxel a píxel de la moneda: el assert automático es flag sostenido + fotograma iluminado, no una lectura de la zona del capitel (la cámara/zoom lo hacen frágil; la prueba visual está en el PNG, donde la moneda (~7 px) y Wren se ven a 640x360).
- Solo primera lectura y ruta mínima (sin rondas, sin cuerpo, sin deducciones previas al bisturí). Segunda lectura, 1280x720 de estos instantes, APK/Android físico, memoria y rendimiento móvil: NOT_TESTED.

## Riesgos
- Etapa larga (~170 s) y sensible a máquina lenta: mitigado con espera 650 ms + reintento, detección por `hidden`+`_choiceKeys` (no por contar botones) y coincidencias sin acentos.
- La lluvia animada hace que los PNG varíen entre corridas; la paleta P (256) para bajar de 500 KB puede bandear degradados oscuros (aceptable; poste y figuras legibles).
- Regenerar: `node web/art_review/scenery_refresh/scripts/capture_wren_e2e.mjs` y `node web/tools/browser-check.mjs` (o `node web/tools/test-all.mjs`).
