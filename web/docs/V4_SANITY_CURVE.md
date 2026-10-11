# V4 — Curva de cordura (F12)

Medido con `node tools/walk.mjs` (recorrido principal, cada escena una vez). Bandas sin cambios: 65 / 35 (`story/perception.js`).

## Curva del recorrido principal

foreshore 100 · room 100 · bucks_row 95 · knackers 86 · hanbury 92 · seance 75 · room 69 · knackers 69 · mitre 61 · goulston 33 · room 19 · alleys 19 · greaves 7 · **foreshore 0** · bucks_row 0 · millers 0

El suelo a 0 se alcanza al terminar la confrontación de Greaves, no antes. Desde ahí no hay más efecto mecánico.

## Cambio aplicado: costes que se pagan una vez

Antes, doce objetos restaban cordura en cada vistazo. Una segunda pasada completa costaba unos 45 puntos (frascos 4, falda 3, hombro 5, cara 4, vientre 5, muñeca 6, estuche 4, fotografía 4, espejo 2 desde la tercera mirada, reloj 2, carta astral 3, Wexley 3). Ahora usan `G.sanityOnce(clave, delta)` (`engine/game.js`), que guarda la marca en `flags.cost_<clave>`: la reacción (rojo, sonido, línea) sigue en cada vistazo; el coste, no. El recorrido principal no cambia, porque visita cada objeto una vez (medido: misma curva).

Pruebas: `cost14.js` (el helper; frascos y fotografía, dos vistazos cada uno).

## Recomendación sin aplicar (requiere revisión del observador y playtest)

1. **El suelo oculta costes.** Greaves se alcanza con 7. El expediente (−10) y el corte (−15) suman −25, así que solo pesan 7: los otros 18 se pierden en el suelo. Por debajo de 35 la banda ya no cambia; lo único continuo es la intensidad de la visión (`sanityMad`).
2. **Opción A:** que la llegada a Greaves tenga al menos 25 puntos, de modo que la confrontación pese entera. Eso exige reducir en unos 18 puntos los costes previos (Goulston −8, −3 por cada error de la persecución, Mitre −5 y −6, entre otros). Es un ajuste grande; requiere revisión del observador y playtest.
3. **Opción B:** bajar el coste de la confrontación en vez de subir la llegada: el expediente de −10 a −5 y el corte de −15 a −10. La curva termina en 0 igual, pero se pierden menos puntos en el suelo. Pierde peso dramático; no recomendada sin playtest.
4. **No hacer:** tocar 65 o 35, o añadir cualquier castigo por cordura baja (requisito 1 de F12).

Lo no medido: recorridos exploratorios reales (solo se ha medido el recorrido guionizado y las repeticiones por el cambio de costes). Requiere jugadores (F17).
