# V4 — Dirección de escena (F11)

Estado: **lista de planos escrita; ningún plano implementado todavía.** Los cambios de cámara y arte necesitan revisión visual en navegador (1280×720 y móvil), y eso no está hecho. Este documento fija qué debe mostrar cada toma y qué modo reducido le corresponde. La implementación queda para una fase aparte con esa revisión.

## Convenciones

- Plano abierto: investigación, con todo el espacio visible.
- Plano medio: confrontación o conversación.
- Plano cercano: revelación. Como mucho uno por escena.
- Ninguna toma usa temblor de cámara como efecto continuo. Con movimiento reducido: fundidos, sin destellos rápidos ni sacudidas (`prefs.reduceMotion`).
- Duración máxima por toma: la indicada; si se excede, la escena pasa a la siguiente sin esperar al jugador.

## Planos por escena

| Toma | Escena | Foco | Acción | Silencio | Entrada / salida | Duración máx. | Modo reducido |
|---|---|---|---|---|---|---|---|
| Intro | `story/intro.js` | abierto (calle bajo la lluvia) | una línea sobre la calle; luego el cuaderno | sí, antes de la primera página | fundido | 6 s | sin cambios de encuadre |
| Hallazgo de Polly | `bucks_row` | medio, el cuerpo y la lámpara | Pike llega; sin nombre | sí | corte seco | 8 s | fundido |
| Primer encuentro con Wren | `knackers` | medio, la niña sobre las cajas | «No se acerque» | sí | corte | 6 s | fundido |
| Examen de Annie | `hanbury` | cercano, la mano y el peine | examinar; sin gore | sí | fundido | 8 s | fundido |
| Mesa de Wexley | `seance` | medio, la mesa y los golpes | golpes; la tabla de la pared | sí, antes de la sesión | fundido | 10 s | fundido |
| Salida de Goulston | `goulston` | cercano, la jamba con trazos ilegibles | la visión sobre el ladrillo mojado | sí | fundido | 6 s | imagen fija |
| Persecución | `alleys` | abierto, la calle y la linterna | tres cruces con tiempo | no | corte | 4,6 s (5,6 s táctil) | sin cambios |
| Expediente | `readFile` | cercano, el papel | lectura | sí | corte | 6 s | fundido |
| Orilla | `foreshore` | abierto, el agua y el desagüe | acercarse al colector | sí, en la primera mirada | fundido | 6 s | imagen fija |
| Firma | `final_name_entry` | cercano, la pantalla de la firma | escribir; transformación lenta | sí | fundido | 10 s | fundido, sin teclado superpuesto |

## Deudas visuales ya registradas

- Lámina de agua de `foreshore.js` (146–149): se lee como un cauce abierto. Debe salir de la boca del colector (V4-08).
- Pestaña de teorías a 720p: el panel se desplaza con cinco preguntas (V4-02, F16).

## Qué no cambia

Ningún escenario nuevo; ninguna variante del mapa sin razón jugable; ningún `Math.random()` en cambios con significado narrativo; el arte procedural existente.
