# El Huésped — Whitechapel, 1888

Point & click de horror psicológico y cósmico. Eres el inspector Thomas Ashgrove, de la División H, y persigues al asesino del East End en el otoño de 1888. Sospechas de todos menos de ti.

La historia completa, las reglas de lo sobrenatural y la lista de pistas que preparan el giro final están en [STORY_BIBLE.md](STORY_BIBLE.md).

## Jugar

```bash
python web/tools/serve.py 5317
```

Abre `http://localhost:5317`. No necesita instalar nada ni compilar: son módulos ES servidos tal cual. El servidor desactiva la caché para que los cambios se vean al recargar.

### Controles

| Acción | Ratón / teclado | Táctil |
|---|---|---|
| Caminar, examinar, hablar | Clic | Toque |
| Inventario | I o botón **Inventario** | Botón **Inventario** |
| Examinar un objeto | En el inventario: elegirlo y **Examinar** (flechas, Inicio y Fin para moverse) | Tocarlo y **Examinar** |
| Usar un objeto | En el inventario: **Usar**, y luego clic en el destino; queda en la mano hasta **Cancelar** o Esc | Igual, con toque; **Cancelar** o Atrás lo sueltan |
| Revelar puntos de interés | Espacio o botón **Revelar** | Botón **Revelar** |
| Jugar sin ratón | **← / →** (o **Tab**) recorren los puntos de la escena de izquierda a derecha y el elegido se nombra en pantalla; **Intro** actúa como un clic (con un objeto en la mano, lo usa) y **Mayús+Intro** mira; mientras corre un guion, o con el cuaderno, el inventario o un documento abiertos, la lista no está | — |
| Cuaderno (pistas y deducciones) | N o botón **Cuaderno** | Botón |
| Avanzar diálogo | Clic, Espacio o Intro | Toque |
| Cerrar lo abierto / menú | Esc: cierra documento, inventario, cuaderno, menú de conversación o puzle; si no hay nada, pausa | Atrás (Android), en ese mismo orden, o botón **Menú** |
| Acortar un rótulo o una tarjeta | Clic, Espacio o Intro | Toque |
| Elegir una opción | Clic o tecla 1–9 | Toque |

El cuaderno tiene las **pruebas** a la izquierda y, a la derecha, tres pestañas: **Conclusiones** (lo que sale de relacionar dos pruebas; las suposiciones van marcadas como *hipótesis* o *inferencia*), **Teorías** (las preguntas abiertas del caso, con lo que sostiene y lo que contradice cada explicación) y **Perfil**. «¿Qué hago ahora?» da primero el objetivo y lo que falta para seguir; preguntado otra vez, la pareja de pruebas que encaja o la pista de la escena. Nunca hace falta acusar a nadie para avanzar.

Opciones: volumen, velocidad del texto, calidad, **Lo ya leído** (al instante o tecleado de nuevo), **Movimiento** (reducido: sacudidas y destellos suaves; empieza como pida el sistema) y vibración.

## Estructura

```
web/
  index.html, styles.css    página e interfaz (DOM)
  src/engine/               renderizador WebGL, actores, audio, UI, bucle y API de guion
  src/art/                  paleta única y kit de pintura procedural
  src/scenes/               una escena por archivo: arte, hotspots y guion local
  src/story/                datos (objetos, pistas, deducciones) y capítulos
  tests/walkthrough.js      recorrido automático de todo el juego
  tools/serve.py            servidor de desarrollo sin caché
  assets/fonts/             las tres tipografías (WOFF2 latino) con sus licencias: el juego no pide nada a Google Fonts
```

### Dirección de arte: pixel-art HD

Todo el arte se pinta por código a resolución completa, se reduce a una rejilla de 640×360 y se ajusta a una única paleta curada (`src/art/pixel.js`) con un *dithering* ordenado suave. Así fachadas, objetos y personajes comparten el mismo acabado. La luz y la niebla se mantienen suaves por encima, en un único pase de shader: albedo × mapa de luz, niebla iluminada con conos de luz bajo las farolas, halos, reflejos en el suelo mojado y salpicaduras de lluvia.

- `src/art/paint.js`: biblioteca de materiales y mobiliario urbano (ladrillo en aparejo flamenco, ventanas de guillotina, adoquines de granito, farolas de hierro, carteles, letreros, cables...).
- `src/art/build.js`: composiciones (fachadas, almacenes, horizontes con hitos como Christ Church, San Pablo o los gasómetros, e interiores).
- `src/engine/actor.js`: personajes procedurales con anatomía, ciclo de paso, vestuario, caras de perfil y miradas por encima del hombro, convertidos en sprites en cada fotograma.
- `src/engine/life.js`: vida ambiental (humo, goteras, ratas, gatos, cuervos, siluetas tras las cortinas, polillas, periódicos al viento, ondas en los charcos).

El audio también es procedural, con música compuesta para cada estado: cuerdas para la tensión, una caja de música para los recuerdos y un pulso para la persecución. La tela y el papel son grabaciones breves CC0 de terceros superpuestas a la síntesis (créditos en `assets/audio/CREDITS.md`).

## Pruebas

Sin navegador, desde la raíz del repositorio, todo de una vez:

```bash
node web/tools/test-all.mjs
```

Con `--quick` se saltan las tres partidas completas y las comprobaciones en navegador. Por separado:

- `node web/tools/unit.mjs`: la lógica pura de `tests/unit/` (condiciones para avanzar, guardados viejos, teorías, cordura, firma, higiene).
- `node web/tools/smoke.mjs`: pinta todas las escenas y sus variantes contra un canvas/WebGL simulado y estricto.
- `node web/tools/audio-smoke.mjs`: todos los sonidos y la música contra un Web Audio simulado.
- `node web/tools/walk.mjs`: el juego real con un DOM simulado, del prólogo a los créditos; `second` lo juega como segunda lectura; `alt` juega mal a propósito.
- `node web/tools/walk.mjs <escenario>`: uno de `tests/scenarios/` — `compat` (guardados de antes), `integrity` (datos y referencias), `notebook`, `feedback`, `c1-minimal`, `comb-pike`, `mob`, `seance`, `chapter3`, `finale`, `sanity`, `second-reading`, `resume`. Las elecciones se toman por su texto.
- `node web/tools/browser-check.mjs`: lo que solo un navegador real puede mostrar, en Chrome sin ventana: el puzle de golpes con Atrás, Escape y «Dejarlo»; la pérdida y recuperación del contexto WebGL; el aviso sin WebGL; el ritmo en pausa. Se salta si no encuentra Chrome (`CHROME=<ruta>` para indicarlo).
- `WALK_LOG=run.log node web/tools/walk.mjs` y `node web/tools/read-count.mjs run.log`: cuánto se lee en una partida.

Métricas de desarrollo: `?metrics` en la dirección registra en la consola (nunca envía nada) el tiempo hasta el primer control, la espera en rótulos, clics sin efecto, pasos con un objeto en la mano, objetos mal usados, cambios automáticos de calidad, intentos de puzle, ayudas pedidas y tiempo por capítulo; `window.__metrics()` las devuelve. En `localhost` o con `?dev`, un error de guion se avisa en pantalla.

Con el juego abierto en el navegador, en la consola:

```js
const t = await import('/tests/walkthrough.js'); await t.run();
```

Juega el prólogo y los cuatro capítulos por las mismas rutas de hotspots y cuaderno que usaría un jugador, y devuelve `{ ok: true }` si llega a los créditos.

Parámetros de desarrollo en la URL: `?scene=bucks_row&x=900&noenter=1&flags=a,b` abre una escena directamente; `?chapter=c3` empieza un capítulo.

## Android

```bash
bash web/tools/build-apk.sh
```

Genera `web/dist/el-huesped.apk` solo con las build-tools del SDK de Android y el JDK (sin Gradle; el empaquetado usa `npx --yes esbuild`, que lo descarga si no está en caché). El APK es un WebView a pantalla completa, en horizontal y sin que se apague la pantalla, que carga la versión de un solo archivo desde sus assets. Atrás cierra lo que esté abierto (documento, inventario, cuaderno, conversación, puzle) y, si no hay nada, abre la pausa; nunca elige por el jugador ni salta una línea. Salir de la app guarda, silencia el sonido y congela el reloj de una elección con tiempo. Las partidas se guardan en el teléfono. Se firma con una clave de depuración local (`web/android/debug.keystore`, se crea la primera vez y no se sube al repositorio). El icono sale de `python web/tools/make-icon.py`, que encuadra la pintura `web/android/icon-source.png` como icono adaptativo (y el `.ico` de Windows).

Instalar con el teléfono conectado por USB (depuración USB activada): `adb install -r web/dist/el-huesped.apk`. O copiar el APK al teléfono y abrirlo, permitiendo instalar apps de origen desconocido.

## Windows

```bash
bash web/tools/build-win.sh
```

Genera `web/dist/ElHuesped.exe` con el compilador de C# que trae Windows (.NET Framework 4), sin SDK (el empaquetado usa `npx --yes esbuild`, como el APK). Es un solo archivo: lleva dentro la versión de un solo archivo del juego, la extrae en `%LOCALAPPDATA%\ElHuesped` y la abre en una ventana de aplicación de Edge (necesita Microsoft Edge instalado; no lleva un motor propio) a pantalla completa, con un perfil propio donde quedan las partidas. `ElHuesped.exe --windowed` la abre en ventana; F11 alterna.
