# Entrega C — Diversidad de frascos de Greaves (v2)

Pasada artística/UX sobre `web/src/scenes/greaves.js`. Canon intacto:
mismos hotspots y rects, mismos textos, mismos flags, misma lógica,
mismos costes de cordura, 28 frascos en las mismas posiciones
(`jx = 310 + i*41`, `jy = 170 + s*100`, mismos `jh` porque el consumo de
`rng(5)` previo al reparto no cambia). Solo cambia CÓMO se ven los
frascos; el dibujo procedural anterior queda como respaldo literal.

## Por qué 5 variantes (calidad/recursos)

A 640x360 cada frasco mide ~32 px de ancho: la variedad tiene que venir
de silueta, tapón, masa interior y etiqueta, no de detalle fino. Dos
sprites aprobados (alto/achatado) + tres nuevos (redondo/cuero,
fino/vacío, ancho/cera/inclinado) = 5. Con 28 frascos, cada variante
sale ~5-6 veces y la regla anti-vecinos impide clones adyacentes; 28
modelos saldrían ~1 vez cada uno sin ganancia visual a cambio de 28x
memoria y trabajo de pack. Los 5 PNG suman 20,5 KB.

## Qué cambió (archivos)

**Sprites nuevos (un render, un .blend, mismo flujo T3):**
- `web/art_review/greaves_study/v2/source/greaves_jars_v2.blend` —
  una escena con las 5 variantes en fila (mismo rig de tono aprobado:
  vidrio 0,33/0,34/0,21 alfa 0,72, espécimen oscuro, tapón oscuro,
  etiqueta clara, brillo fino, luces 30/15/18 + mundo 0,25; 100 px/unidad).
- `web/assets/props/greaves_jar_{tall,squat,round,thin,wide}.png` —
  42x84 (4,5 KB), 46x61 (3,4 KB), 46x72 (4,6 KB), 38x61 (3,0 KB),
  48x77 (4,9 KB). `tall`/`squat` se reconstruyen (misma geometría y
  materiales); medias opacas 67-73 por canal: oliva oscuro, no crema.
  Anchos de contenido 34/38/38/30/40 px sobre paso de 41 px (mínimo
  1 px de hueco; reparto sin cambios).
- `web/assets/props/index.json` — las 5 entradas ganan `"body"` (altura
  del vidrio bajo la tapa en px: 65/42/57/36/58), única fuente de verdad
  para el escalado del juego (CRLF conservado).

**Código (diff mínimo, fallbacks conservados):**
- `web/src/scenes/greaves.js` — `JAR_NAMES` con las 5 variantes; reparto
  determinista con el `rng(5)` existente (misma partida/reanudación →
  mismos frascos; sin `Math.random` ni tiempo); si el pick repite al
  vecino, se aparta (6 apartados con esta semilla, 0 clones adyacentes);
  `sy = jh / body` del índice (cada silueta apoya en su balda); velo
  `JAR_VEIL`/`drawJarTinted` conservado con tintes cuantizados (paso 4:
  una entrada por variante y paso, 28 con esta semilla, capa estática
  pintada una sola vez, nada por frame); rama procedural intacta
  byte a byte (sus `jh/cR/cG/cB/tilt` no cambian).
- `web/tests/unit/props.test.mjs` — exige oliva oscuro en las 5,
  pairwise distintas, <100 KB por archivo y en total, índice coherente
  con `body` válido, respaldo+velo presentes, guarda anti-sprites
  antes del canvas, y determinismo (doble reparto idéntico, 28 frascos,
  sin vecinos iguales, las 5 aparecen, 28/28 velos distintos).

**Scripts v2 (rutas relativas al script; Blender por `BLENDER` o
defecto documentado):** `scripts/build_jars_v2.py`,
`scripts/pack_jars_v2.py`, `scripts/capture_jars.mjs` (encuadres
estantería x=450 + escritorio x=700, repeticiones para promediar el
parpadeo), `scripts/measure_shelf.py`, `scripts/make_comparison_v2.py`.

## Evidencia (motor real, misma x de cámara, mismo recorte)

- `v2/comparison/AB_jars_640.png` (156 KB) — antes/después estantería.
- `v2/comparison/ZOOM_shelves_640.png` (63 KB) — zoom 2x de las baldas.
- `v2/comparison/AB_jars_1280.png` (198 KB) — antes/después a 1280x720.
- (Intermedios `v2/work/`, `v2/renders/` borrados tras componer; se
  regeneran con los scripts. Solo quedan las 3 láminas + informe.)

**Luminancia** (recorte estantería x40-280/y40-280 en encuadre x=450,
promedio de 3 capturas; recorte escritorio x=700 como continuidad T3b):
BEFORE 42,03 (41,97/41,86/42,26) → AFTER 40,19 (40,19/40,11/40,28):
**0,956 (−4,4 %, PASS ≤ 1,15)**. Recorte escritorio: 24,25 → 24,17.

**Verificación numérica (sin visor; scripts en `/tmp`, no viajan):**
NCC de cada sprite contra el AFTER ( T3: 0,60-0,86; control ≤0,23):
tall 0,55, squat 0,60, round 0,59, thin 0,67, wide 0,57 — los 5 sprites
cargan y caen en la estantería, pero el NCC no distingue variantes
entre sí (todos son manchas oliva con etiqueta: esperable). Diferencia
media entre pares de la librería a tamaño de juego: 4,6-12,3 niveles
(máxima thin/wide, mínima round/wide); antes/después mismo recorte:
6,6. Lectura honesta: a 640 las diferencias son de silueta (forma,
tapón, etiqueta), que es justo lo que sobrevive al downsample; los
medios por píxel son de un dígito porque los frascos son pequeños y
oscuros. El auditor debe juzgar con el ZOOM.

## test-all (real, 2026-10-16)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS,
0 FAIL, 0 SKIP**, exit 0 (unit —182 pruebas, incluido `props.test.mjs`
ampliado—, smoke —greaves ok, el respaldo pinta de verdad sin sprites—,
audio, 38 scenarios, walk, walk second, walk alt, browser).

## Qué NO pude comprobar

- **Inspección visual directa:** sin visor en este entorno; la revisión
  es numérica (arriba) + láminas para el auditor.
- **Respaldo procedural en el motor real:** solo corre sin los PNG;
  pasa el smoke con mocks estrictos, pero nunca se renderizó en Chrome.
  Riesgo bajo (código viejo intacto, mismo patrón que `nat_boat`).
- **Móvil físico / APK / memoria:** NOT_TESTED. Los 5 PNG suman 20,5 KB;
  la caché de velos son ≤28 canvas pequeños de la capa estática.
- **Rendimiento de la capa estática:** se pinta una vez por construcción
  del engine; no medido en dispositivo.

## Riesgos y notas

- Blender 5.2: `primitive_torus_add` (cuerda de cuero) funciona; solo
  los `DeprecationWarning` conocidos de `use_nodes` (exit 0, `RENDERED`
  + PNG). `build_jars_v2.py` documenta `BLENDER` con el defecto típico.
- El E ancho apoya con 1 px de hueco al vecino: intencionado (ritmo de
  balda llena), sin solapes.
- Si el auditor quiere la estantería más clara o más fría, la constante
  es `JAR_VEIL` (0,6 intacto) — no re-renderizar.
- `git diff --check` limpio; `greaves.js` sigue 100 % CRLF,
  `props.test.mjs` LF como antes.
