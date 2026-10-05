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

Todo el arte se pinta por código con una sola paleta y se ilumina en un único pase de shader (albedo × mapa de luz, niebla iluminada, halos y reflejos en el suelo mojado). El audio también es procedural. No hay assets de terceros.

## Pruebas

Con el juego abierto en el navegador, en la consola:

```js
const t = await import('/tests/walkthrough.js'); await t.run();
```

Juega el prólogo y los cuatro capítulos por las mismas rutas de hotspots y cuaderno que usaría un jugador, y devuelve `{ ok: true }` si llega a los créditos.

Parámetros de desarrollo en la URL: `?scene=bucks_row&x=900&noenter=1&flags=a,b` abre una escena directamente; `?chapter=c3` empieza un capítulo.

## Android

El juego es una página estática, así que se puede empaquetar con Capacitor como cualquier web: copiar `web/` como `webDir` y bloquear la orientación en horizontal.
