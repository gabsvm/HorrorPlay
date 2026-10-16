# T2 — Fotografía de Thomas y Nat + mapa de Whitechapel (habitación)

Pasada artística/UX sobre `web/src/scenes/room.js` (líneas 72-101 y hotspots
`photo`/`map`). Canon intacto: mismos textos, mismos flags, mismas pistas,
misma cordura, mismos rects de hotspot. Solo cambia CÓMO se ven y que ahora
se pueden mirar de cerca con el farol.

## Qué cambió (archivos)

**Assets nuevos (generados por script, ver abajo):**
- `web/assets/closeups/room_photo.jpg` (47 KB) — cabinet card 1280x720: dos
  niños de pie, el mayor con la mano en el hombro del menor; albúmina sepia,
  rostros suaves sin detalle (como una foto movida de 1860s), cartón con
  filete dorado y pie de estudio «E. VANCE, 23 COMMERCIAL STREET».
- `web/assets/closeups/room_photo_torn.jpg` (53 KB) — la misma foto con la
  cara del mayor raspada (capítulo 3; misma paleta que el raspado de pared).
- `web/assets/closeups/room_map.jpg` (100 KB) — Whitechapel 1888 en tinta
  sobre papel envejecido: Whitechapel High St/Rd, Commercial St/Rd, Osborn St,
  Brick Lane, Hanbury, Fashion, Dorset, Flower & Dean, Wentworth, Thrawl,
  Buck's Row, Berner, Goulston, Bishopsgate, Winthrop St (invención del juego,
  tramo corto al norte), Mitre Square (CITY), London Hospital, Christ Church,
  Miller's Ct, cartela «1888», escala y rosa de los vientos. Cinco cruces a
  lápiz donde el juego ya pone sus chinchetas + el rincón propio rodeado, sin
  rotular nada que el juego no diga.
- `web/assets/props/room_photo.png` (8 KB, 110x84) y
  `web/assets/props/room_map.png` (15 KB, 130x96) — sprites de pared a la
  medida exacta de los marcos viejos, sin texto (ilegible a esa escala).
- `web/assets/closeups/index.json` y `web/assets/props/index.json` — solo
  añaden las tres + dos entradas (el empaquetado las recoge solo).

**Código (diff mínimo, fallbacks conservados):**
- `web/src/scenes/room.js` — la foto y el mapa de pared se dibujan con
  `drawProp` y el dibujo procedural anterior queda como respaldo literal. Los
  hotspots `photo`/`map` abren `G.inspect` con UN solo punto cuyo `act`
  contiene el comportamiento viejo copiado palabra por palabra (mismos
  `think`, `sanityOnce`, `audio`, condición de capítulo). La foto enseña
  `room_photo` en c1 y `room_photo_torn` después. El raspado de pared del c3
  (`drawNear`) no se tocó: la cabeza del sprite cae en su mismo píxel
  (comprobado por assert en el generador).
- `web/src/engine/game.js` — `G.inspect` acepta `calm` (sin arrodillarse, sin
  susto/sting, sin aviso de «cuerpo») y `close` (texto del botón). Por defecto
  todo sigue igual para los cuerpos.
- `web/src/engine/ui.js` — `inspect` acepta `close` y lo escribe en el botón
  (si no se da, sigue «Levantarse»). En calma el botón dice «Atrás».
- `web/src/art/bodies.js` — `paintBody` entiende los tres kinds nuevos:
  close-up si está cargado, repintado procedural sencillo si no.

**Técnica elegida:** pintura Python/PIL+numpy reproducible, no Blender: la
tipografía del mapa y el grano del papel piden control por píxel; Blender 5.2
no hizo falta y no se descarga nada.

## Evidencia (rutas)
- `web/art_review/room_photo_map/comparison/AB_room_photo_640.png` (347 KB)
- `web/art_review/room_photo_map/comparison/AB_room_map_640.png` (352 KB)
- `web/art_review/room_photo_map/comparison/INSP_room_640.png` (114 KB)
- Scripts que regeneran todo: `scripts/make_photo_map.py` (assets + índices),
  `scripts/capture_room.mjs` (escena room en x=740/x=1260 a 640 y 1280 más
  vistas de inspección; en el «antes» las inspecciones salen SKIP porque no
  existían), `scripts/make_comparison.py` (las tres láminas).

## test-all (real, 2026-10-16)
`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **44 PASS, 0 FAIL,
0 SKIP** — unit, smoke, audio, los 35 scenarios (incluidos `cost14`, que pisa
la foto dos veces y exige −4/+0; `chapter3`, `carta`, `brennan`, `goulston`,
que usan la habitación), walk, walk second, walk alt y browser (78,6 s).

## Qué NO pude comprobar
- **El respaldo procedural** (`paintRoomPhoto`/`paintRoomMap` en bodies.js):
  solo se vería si faltaran los JPG, y los JPG viajan con el juego y con el
  artefacto empaquetado; el código compila (`node --check`) pero nunca se
  ejecutó. Riesgo bajo.
- **La variante rota en el motor (c3):** el JPG existe y se vio fuera del
  motor; en el motor solo se capturó la habitación en fase c1. El cableado es
  un ternario sobre `phase(G)` ya cubierto por tests en FAST.
- **Clic real sobre el punto de inspección:** en el navegador de captura no se
  pulsó el punto (el `think` esperaría avance manual y colgaría la captura);
  en tests FAST el `act` del punto corre íntegro (cost14 lo demuestra).
- **Android físico / APK / memoria y rendimiento en móvil:** NOT_TESTED, como
  en pasadas anteriores. Los PNG de pared suman 23 KB; los JPG 200 KB.

## Riesgos
- El mapa fija una geografía concreta (p. ej. Thrawl St corta entre
  Flower & Dean y Whitechapel Rd, Winthrop St al noroeste): si el guion futuro
  dice otra cosa, el dibujo manda cambiar, no el texto.
- `G.inspect` con `calm` no arrodilla a Thomas: si el auditor prefiere el
  lenguaje corporal de examen también en la pared, basta quitar `calm: true`
  en los dos hotspots (una línea cada uno).
