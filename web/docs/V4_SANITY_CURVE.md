# V4 — Curva de cordura (F12)

Medido con `node tools/walk.mjs` (recorrido principal, cada escena una vez) y con `tests/scenarios/sanity14.js` (persecuciones). Umbrales sin cambios: 65 y 35 (`story/perception.js`). Los valores de la curva son la cordura al **cambiar de escena**, ya con el coste de entrada de esa escena.

## Curva del recorrido principal: antes y ahora

| Escena | Antes (HEAD) | Ahora | Banda antes → ahora |
|---|---|---|---|
| foreshore | 100 | 100 | steady |
| room | 100 | 100 | steady |
| bucks_row | 95 | 95 | steady |
| knackers | 86 | 88 | steady |
| hanbury | 92 | 96 | steady |
| seance | 75 | 82 | steady |
| room (2.ª visita) | 69 | 81 | strained → **steady** |
| knackers (2.ª) | 69 | 81 | strained → **steady** |
| mitre | 61 | 76 | strained → **steady** |
| goulston | 33 | 52 | frayed → **strained** |
| room (c3b) | 19 | 41 | frayed → **strained** |
| alleys | 19 | 41 | frayed → **strained** |
| greaves (llegada, tras el coste de entrada) | 7 | 28 | frayed → frayed |
| foreshore (tras la confrontación) | 0 | 0 | frayed |

Antes, la ruta principal tocaba cero antes de la confrontación de Greaves y lo perdido en el suelo no contaba; ahora no lo toca antes.

## Bandas: qué cambia para el jugador

Por `story/perception.js` y su uso (no hay ninguna regla de progreso que lea la cordura: `progression.js` solo la acota):

- **steady (≥ 65)**: en los cuerpos se marcan con más claridad los puntos clave (`forensicMarks`, `game.js`); en la hoja de rondas de Pike, la ayuda llega tras una sola falta, no tras dos (`beatsHelpAfter`, `chapters.js`); no hay susurros.
- **strained (36–64)**: susurros con probabilidad 0,15.
- **frayed (≤ 35)**: susurros con probabilidad 0,35; los golpes se leen de entrada (`knockHelpStart`); el resplandor verde del agua; la duda de las teorías (`doubtTheories`, `ui.js`); la gente lo nota (`othersNotice`: Watkins en Mitre, Greaves); en frayed y strained, el silencio del desagüe (`foreshore.js`) y la última frase de Wren.

Cambios que resultan de la nueva curva en la ruta principal:
- **Mitre pasa a steady**: se marcan los puntos clave del cuerpo y desaparecen los susurros de la escena. Esto hace Mitre más fácil de leer. Se revirtieron sus dos costes (cara −4 y vientre −5, como antes); no basta para devolverla a strained, porque la rebaja de las escenas anteriores ya la sube sobre 65.
- **Goulston, la habitación c3b y la persecución pasan a strained**: desaparecen la duda de las teorías en esas escenas; los susurros bajan de 0,35 a 0,15.
- **Greaves sigue en frayed** (28): la mención de Greaves («No duermes») y la lectura del final no cambian.

## Costes que se pagan una vez (F12, previo a la opción A)

Antes, doce objetos restaban cordura en cada vistazo. Una segunda pasada completa costaba unos 45 puntos (frascos 4, falda 3, hombro 5, cara 4, vientre 5, muñeca 6, estuche 4, fotografía 4, espejo 2 desde la tercera mirada, reloj 2, carta astral 3, Wexley 3). Ahora usan `G.sanityOnce(clave, delta)` (`engine/game.js`), que guarda la marca en `flags.cost_<clave>`: la reacción (rojo, sonido, línea) sigue en cada vistazo; el coste, no. Pruebas: `cost14.js`.

## Distribución aplicada (decisión de diseño del autor, 2026-10-11)

**Objetivo (del autor):** la ruta principal llega a Greaves con 25–35 de cordura; la confrontación conserva su −10 (expediente) y su −15 (corte); 65/35 sin cambios; Goulston conserva su momento de tensión.

**Diagnóstico (rastro temporal del recorrido principal, retirado):** antes, sin suelo, los costes previos a Greaves sumaban 142 y las ganancias 45. Cuatro deducciones erróneas costaban 6 cada una (24 puntos).

**Cambios (solo bajan costes; no se añade ninguna penalización):**

| Coste | Antes | Ahora | Dónde |
|---|---|---|---|
| Deducción errónea (denial), cada una | −6 | −4 | `engine/game.js` |
| Wexley, «alguien detrás» | −10 | −6 | `story/chapters.js` |
| Dedos / pliegos de papel (habitación) | −8 | −5 | `story/chapters.js` |
| Carta, letra (habitación) | −6 | −4 | `story/chapters.js` |
| Desolladero, Wren («la regla») | −5 | −3 | `story/chapters.js` |
| Goulston, la tiza (el momento se conserva) | −8 | −5 | `scenes/goulston.js` |
| Mitre, muñeca | −6 | −4 | `scenes/mitre.js` |
| Hanbury, hombro | −5 | −3 | `scenes/hanbury.js` |
| Séance, el peine | −3 | −2 | `scenes/seance.js` |
| Séance, carta astral | −3 | −2 | `scenes/seance.js` |

**Sin cambio:** el −10 del expediente y el −15 del corte (`story/chapters.js`, `readFile`); los umbrales 65 y 35; el −3 por error de persecución; el −3 por entrar en Greaves; los costes de una sola vez (frascos, trough, reflejo, Watkins).

**Llegada a Greaves (medida):**

| Recorrido | Antes del coste de entrada | Tras la entrada (−3), ahora | Antes de la opción A (tras la entrada) | Diferencia |
|---|---|---|---|---|
| Principal (`walk`) | 31 | 28 | 7 | +21 |
| Persecución limpia (`sanity14`) | — | 40 | 30 | +10 |
| Un error (la cara vista) | — | 37 | 27 | +10 |
| Tres errores (herida) | — | 31 | 21 | +10 |

La ruta principal gana más (+21) que las persecuciones (+10) porque antes tocaba cero y perdía puntos.

**Comprobado** (`walkthrough.js` y `sanity14.js`):
- La ruta principal llega a Greaves entre 25 y 35 tras la entrada (28).
- Las tres persecuciones llegan entre 25 y 45 (40, 37, 31).
- Un segundo vistazo a los frascos no cuesta: el primero, 4; el segundo, 0.
- Un guardado antiguo con 33 carga con 40, igual que en HEAD: +10 por la entrada al capítulo IV y −3 por la entrada a Greaves. Los guardados no se recalculan al cargar.
- No hay softlock posible: ninguna regla de progreso lee la cordura.

**No medido:** una partida exploratoria completa con errores de deducción variados (los errores cuestan 4 cada uno, y son la rama que más varía); el efecto real de las bandas en un jugador (eso es F17).

## Opción B — no aplicada

Bajar el expediente de −10 a −5 y el corte de −15 a −10. No se aplica: la decisión del autor fue la opción A, y la B altera la confrontación.
