# V4 — Curva de cordura (F12)

Medido con `node tools/walk.mjs` (recorrido principal, cada escena una vez). Bandas sin cambios: 65 / 35 (`story/perception.js`).

## Curva del recorrido principal

foreshore 100 · room 100 · bucks_row 95 · knackers 86 · hanbury 92 · seance 75 · room 69 · knackers 69 · mitre 61 · goulston 33 · room 19 · alleys 19 · greaves 7 · **foreshore 0** · bucks_row 0 · millers 0

El suelo a 0 se alcanza al leer el expediente, dentro de la confrontación de Greaves (7 − 10), no al terminarla. Desde ahí no hay más efecto mecánico.

## Cambio aplicado: costes que se pagan una vez

Antes, doce objetos restaban cordura en cada vistazo. Una segunda pasada completa costaba unos 45 puntos (frascos 4, falda 3, hombro 5, cara 4, vientre 5, muñeca 6, estuche 4, fotografía 4, espejo 2 desde la tercera mirada, reloj 2, carta astral 3, Wexley 3). Ahora usan `G.sanityOnce(clave, delta)` (`engine/game.js`), que guarda la marca en `flags.cost_<clave>`: la reacción (rojo, sonido, línea) sigue en cada vistazo; el coste, no. El recorrido principal no cambia, porque visita cada objeto una vez (medido: misma curva).

Pruebas: `cost14.js` (el helper; frascos y fotografía, dos vistazos cada uno).

## Opción A — distribución aplicada (decisión de diseño del autor, 2026-10-11)

**Objetivo (del autor):** la ruta principal llega a Greaves con 25–35 de cordura; la confrontación conserva su −10 (expediente) y su −15 (corte); los umbrales 65/35 no cambian; los momentos de tensión de Goulston se conservan. Son objetivos de diseño, no cifras que se fuerzan si producen regresiones.

**Diagnóstico (medido con un rastro temporal del recorrido principal, que se retiró después):** antes del cambio, la cordura tocaba cero en la habitación del capítulo III, y lo que se perdía en el suelo no contaba. Costes previos a Greaves sin suelo: 142 puntos (incluidos cuatro deducciones erróneas de −6 cada una, en `game.js`), con ganancias de 45 (dos descansos en el desolladero y uno en la habitación). Llegada real a Greaves: 10 (la cuenta sin suelo daba 3 antes de la ganancia de 10).

**Cambios (solo bajan costes; no se añade ninguna penalización):**

| Coste | Antes | Ahora | Dónde |
|---|---|---|---|
| Deducción errónea (denial), cada una | −6 | −4 | `engine/game.js` |
| Wexley, «alguien detrás» | −10 | −6 | `story/chapters.js` |
| Dedos / pliegos de papel (habitación) | −8 | −5 | `story/chapters.js` |
| Carta, letra (habitación) | −6 | −4 | `story/chapters.js` |
| Desolladero, Wren («la regla») | −5 | −3 | `story/chapters.js` |
| Goulston, la tiza (el momento se conserva) | −8 | −5 | `scenes/goulston.js` |
| Mitre, cara | −4 | −3 | `scenes/mitre.js` |
| Mitre, vientre | −5 | −3 | `scenes/mitre.js` |
| Mitre, muñeca | −6 | −4 | `scenes/mitre.js` |
| Hanbury, hombro | −5 | −3 | `scenes/hanbury.js` |
| Séance, el peine | −3 | −2 | `scenes/seance.js` |
| Séance, carta astral | −3 | −2 | `scenes/seance.js` |

**No cambia:** el −10 del expediente y el −15 del corte (`story/chapters.js`, `readFile`); los umbrales 65 y 35; el coste de la persecución (−3 por error); el coste del desolladero por el trough (una vez); la pérdida de −3 por entrar en Greaves y el −4 de los frascos (una vez). Los costes de una sola vez y la regla de «mirar otra vez no cobra» de F12 siguen igual.

**Resultados medidos (los mismos recorridos, antes y ahora):**

| Recorrido | Llegada a Greaves, antes | Ahora |
|---|---|---|
| Principal (`walk`, con sus dos errores de persecución) | 10 (ruta con suelo) | 34 |
| Persecución limpia (sin errores) | 30 | 43 |
| Un error (se la ve la cara) | 27 | 40 |
| Tres errores (herida) | 21 | 34 |

La mejora es mayor en la ruta principal que en las de persecución porque, antes, la ruta principal tocaba cero y perdía puntos que no contaban; ahora no toca cero antes de la confrontación. Tras la confrontación, la cordura queda en 2 en la ruta principal (−10 y −15 aplicados por completo).

**Rutas y guardados comprobados** (`tests/scenarios/sanity14.js`):
- Las tres persecuciones llegan a Greaves entre 25 y 45 (43, 40 y 34).
- Un segundo vistazo a los frascos no cuesta: el primero cobra 4 y el segundo 0 (coste pagado una vez).
- Un guardado antiguo con 33 carga con 40: igual que antes del cambio (la entrada al capítulo IV suma 7; ya existía). Ningún guardado se recalcula al cargar: los valores guardados se conservan.
- Ninguna regla de progreso lee la cordura para bloquear nada: solo ajusta pistas de ayuda (beats, golpes), la mención de Watkins y Greaves, y la intensidad de visión. No hay softlock posible por este cambio.

**Lo que no se ha medido:** una partida de exploración completa con errores de deducción variados; el efecto sobre la experiencia real (eso es F17). Un jugador que haga más deducciones erróneas perderá 4 por cada una (antes 6): la distribución es más generosa con esas ramas, y se debe revisar con jugadores.

**Revisión:** pendiente del revisor independiente (Opus 5.5). Si la revisión pide otra distribución, se ajusta y se vuelve a medir con `sanity14.js`.

## Opción B — no aplicada

Bajar el expediente de −10 a −5 y el corte de −15 a −10. No se aplica: la decisión del autor fue la opción A, y la B altera la confrontación.
