# V5 — Registro de ejecución (validación V5-06)

Entorno: Windows 11, Node v26.4.0, Chrome headless para `browser-check`. Salidas copiadas de la ejecución real; nada de este registro es una afirmación sin ejecutar.

## Modelos realmente usados
- Implementación (código, textos, pruebas): **Claude Sonnet 5.5** (`claude-sonnet-5-5`). No se usó Haiku.
- Revisión read-only: subagente `opus-55-observer`, que declaró `claude-opus-5-5`, sobre el diff de `d02e3fc` (veredicto: cambios solicitados; ver commit siguiente para las correcciones). Segunda revisión (`claude-opus-5-5`, también solo lectura) sobre las correcciones: encontró que una aserción de `tests/scenarios/v5.js` era **vacua** (el regex contenía caracteres de retroceso, no ``, y nunca coincidía); corregido. También pidió igualar la longitud de las opciones de la cadena, quitar la línea de Pike sobre la sospecha propia (Pike no puede saberla) y dar la ayuda desde el primer fallo; hecho. No pudo ejecutar nada: las salidas de abajo son mías.

## Comandos y resultados (HEAD de trabajo tras la auditoría de d02e3fc)
- `node tools/unit.mjs` → `174 pruebas bien, 0 mal`.
- `node tools/test-all.mjs` (sin `--quick`) → exit 0; **45 PASS, 0 FAIL, 0 SKIP** (ejecutado sobre este mismo árbol, tras las correcciones de la segunda revisión) (incluye `scenario v5`, `walk`, `walk second`, `walk alt`, `browser`).
- `node tools/script/export.mjs` → `GUION.md: 1592 lines, 425 spoken or thought` (contador propio del exportador; el archivo tiene más líneas en bruto), exit 0. El guion legible muestra las preguntas y el documento de procedencia de la cadena como `{...}`: es una limitación del exportador, el texto está en `story/chain.js`.
- `read-count` (recorrido principal, antes → después de V5): 202 → 222 líneas dichas o pensadas; 9.297 → 10.596 caracteres (+14 %, tras quitar la línea de Pike); 37 → 40 elecciones; 10 → 12 documentos.
- `browser-check` (Chrome real, 1280×720): nuevas comprobaciones de la pestaña «Nombre» con el **botón real**: se lee con la calle oída pero no se ordena antes del expediente; despierto el botón se activa; cierra el cuaderno y muestra los papeles; la primera pregunta ofrece 5 opciones; Atrás la deja sin resolver, sin coste y sin dejar el juego a medias; se puede volver a empezar.

## Comprobado a mano en el panel del navegador (no automatizado)
Pestaña «Nombre», recap y primera pregunta a 1280×720 y 640×360; la segunda pregunta (la de opciones más largas) a 640×360 cabe entera sin scroll (captura vista en el panel; emulación de tamaño, no táctil real).

## NOT_TESTED
Playtest humano (F17), Moto g86 power / Android 17, toque real, pantalla 20:9, curva de cordura F12 repetida con el cambio de coste (el coste fijo de −3 de la cadena se quitó; el recorrido principal no cambia su curva).
