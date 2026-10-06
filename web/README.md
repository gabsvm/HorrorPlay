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
| Usar un objeto | Clic en el objeto del inventario y luego en el destino | Igual |
| Examinar un objeto del inventario | Clic dos veces en él | Igual |
| Revelar puntos de interés | Espacio o botón **Revelar** | Botón **Revelar** |
| Cuaderno (pistas y deducciones) | N o botón **Cuaderno** | Botón |
| Avanzar diálogo | Clic, Espacio o Intro | Toque |
| Menú / cancelar | Esc | Botón **Menú** |

En el cuaderno se seleccionan dos pistas para relacionarlas. Las deducciones hacen avanzar la historia y van completando el perfil del asesino.

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
```

### Dirección de arte: pixel-art HD

Todo el arte se pinta por código a resolución completa, se reduce a una rejilla de 640×360 y se ajusta a una única paleta curada (`src/art/pixel.js`) con un *dithering* ordenado suave. Así fachadas, objetos y personajes comparten el mismo acabado. La luz y la niebla se mantienen suaves por encima, en un único pase de shader: albedo × mapa de luz, niebla iluminada con conos de luz bajo las farolas, halos, reflejos en el suelo mojado y salpicaduras de lluvia.

- `src/art/paint.js`: biblioteca de materiales y mobiliario urbano (ladrillo en aparejo flamenco, ventanas de guillotina, adoquines de granito, farolas de hierro, carteles, letreros, cables...).
- `src/art/build.js`: composiciones (fachadas, almacenes, horizontes con hitos como Christ Church, San Pablo o los gasómetros, e interiores).
- `src/engine/actor.js`: personajes procedurales con anatomía, ciclo de paso, vestuario, caras de perfil y miradas por encima del hombro, convertidos en sprites en cada fotograma.
- `src/engine/life.js`: vida ambiental (humo, goteras, ratas, gatos, cuervos, siluetas tras las cortinas, polillas, periódicos al viento, ondas en los charcos).

El audio también es procedural, con música compuesta para cada estado: cuerdas para la tensión, una caja de música para los recuerdos y un pulso para la persecución. No hay assets de terceros.

## Pruebas

Sin navegador, desde la raíz del repositorio:

```bash
node web/tools/smoke.mjs
```

```bash
node web/tools/walk.mjs
```

```bash
node web/tools/audio-smoke.mjs
```

- `smoke.mjs` pinta todas las escenas y sus variantes y renderiza fotogramas contra un canvas/WebGL simulado y estricto (detecta radios negativos, coordenadas no finitas, errores de código).
- `walk.mjs` arranca el juego real con un DOM simulado y juega la partida entera, del prólogo a los créditos.
- `audio-smoke.mjs` ejecuta todos los sonidos y la música contra un grafo de Web Audio simulado.

Con el juego abierto en el navegador, en la consola:

```js
const t = await import('/tests/walkthrough.js'); await t.run();
```

Juega el prólogo y los cuatro capítulos por las mismas rutas de hotspots y cuaderno que usaría un jugador, y devuelve `{ ok: true }` si llega a los créditos.

Parámetros de desarrollo en la URL: `?scene=bucks_row&x=900&noenter=1&flags=a,b` abre una escena directamente; `?chapter=c3` empieza un capítulo.

## Android

El juego es una página estática, así que se puede empaquetar con Capacitor como cualquier web: copiar `web/` como `webDir` y bloquear la orientación en horizontal.
