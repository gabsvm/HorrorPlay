# V2 iteración 3 — Niños reconstruidos con el método de figura de Thomas V2

Pasada artística/UX sobre la foto de la habitación. Canon intacto: mismos
textos, flags, hotspots, cordura, sello «E. VANCE», montura y geometría de
anclas. `room.js` NO se tocó; `bodies.js` (respaldo procedural) intacto.

La iteración 2 fue rechazada por el auditor: caras de peluche (ojos redondos
con brillo, nariz de punto), torsos cuadrados, mano rectángulo flotante.
Diagnóstico confirmado al abrir las placas: el estudio usaba esferas con
subsurf, iris/esclerótica con brillo y manos de dedos sueltos. Esta
iteración reconstruye los niños con el método de
`web/art_review/thomas_v2/` sin tocar esa carpeta.

## Método Thomas adoptado (copia, no trasplante)

`v2/scripts/build_blend.py` reescrito: las primitivas `lathe`, `capsule`,
`obj`, `empty`, `limb`, `ccw`, `shaded` están copiadas de
`thomas_v2/scripts/build_master.py` y adaptadas al estudio fotográfico
(menos segmentos/anillos, sombreado plano, sin subsurf en ningún sitio,
materiales Principled de estudio). Del master vienen el lenguaje y la
paleta: piel `#a78a6f`, ojo como punto oscuro `#241a14`, chaqueta gris,
camisa clara, latón, botas oscuras.

- Rostros mínimos y SERIOS: nariz de bloque (dos cubos, nunca bola con
  brillo), ojo como punto oscuro sobre cuenca oscura (sin globos
  oculares, sin esclerótica, sin brillo), boca cerrada en línea fina
  oscura (sin dientes, sin cavidad), cejas rectas, orejas planas
  pequeñas. Nat lleva como máximo la comisura levemente alzada (dos
  segmentos de labio cerrado).
- Proporciones de niño de verdad modeladas (mayor ~7 cabezas, menor ~6,
  cuello corto y grueso que entra en el cráneo + trapecio + cuello de
  camisa derivado del mentón): chaquetilla corta con solapas y 3 botones
  de latón, camisa con cuello, pantalón largo el mayor / bombacho +
  medias el menor, botas, pelo con volumen (raya al lado el mayor,
  mechones el menor). Sin bombín, sin abrigo largo, sin farol, sin
  bufanda.
- Brazo CONTINUO: el brazo derecho del mayor sale de su hombro en dos
  tramos del mismo radio con esfera de codo del mismo radio, y la mano
  (bloque facetado: palma + 4 dedos + pulgar) se apoya SOLAPANDO la
  hombrera del menor. Mangas de una pieza en el resto, rodillas del mismo
  radio dentro del pantalón.
- Cámara perspectiva ligera 3/4 (adaptación documentada: la 3/4 completa
  del master giraría una de las dos caras; las cabezas miran al objetivo
  con los pivotes E_HEAD/Y_HEAD) y una luz lateral cálida suave como key
  con relleno bajo.
- Mismo tratamiento de albúmina en `compose_v2.py`: desenfoque suave,
  foxing, arañazos, grano de plata, viñeteado y cartón con «E. VANCE».

## Encuadre (cambio respecto a iteración 2)

Carte-de-visite con corte a la rodilla: las cabezas se reducen para que
el cuerpo modelado completo (las piernas continúan tras el borde) llene
el ~68 % (mayor) / ~58 % (menor) de la altura del cliché. Las caras
siguen centradas en las cajas fijas, así que la raspadura, el overlay de
pared y el sprite funcionan sin tocar código.

## Qué cambió (archivos)

Integrados (mismos nombres y formatos):
- `web/assets/closeups/room_photo.jpg` (49 421 B) y `room_photo_torn.jpg`
  (55 360 B) — 1280x720; la torn raspa exactamente al mayor, Nat intacta.
- `web/assets/props/room_photo.png` (9 100 B, 110x84).
- `v2/`: `source/photo_studio_v2.blend` (regenerado con el método
  Thomas), `scripts/build_blend.py` (reescrito),
  `scripts/compose_v2.py` (encuadre a la rodilla + guardián de ojos al
  nuevo lenguaje + umbral de corte 540), `scripts/render_figures.py`,
  `capture_v2.mjs`, `make_comparison_v2.py` (intactos),
  `candidates/` (3 NUEVOS A/B/C con caras 3x + `FAVORITE.md`, favorito
  B; los de peluche, sobrescritos), `comparison/` (4 AB iteración-2 →
  iteración-3), este informe. Sin `work/` (se regenera con los scripts).

## Evidencia (rutas) y guardianes

- `v2/comparison/AB_wall_c1_640.png` (337 KB),
  `AB_inspect_photo_c1_640.png` (168 KB), `AB_wall_c3_640.png` (339 KB),
  `AB_inspect_photo_c3_640.png` (170 KB) — motor real, farol fijado entre
  ambas cabezas; inspecciones a 640 nativo, paredes a 480.
- `v2/candidates/cand{B}_640.png` + `cand{B}_{elder,young}_3x.png`.
- Guardianes numéricos en `compose_v2.py --mode final` (todo PASS):
  vano 0.680/0.584, dientes 0.000/0.000, ojos con núcleo oscuro (elder
  mín 20.8 / young 35.8 frente a mejilla ~138/~130) sin blanco de
  peluche (0.084/0.001 bajo el tope 0.10), closeup 119.5 (ref 123.0;
  banda ±15 %: 104.6–141.5), sprite 74.7 (ref 82.5; banda 70.1–94.9).
  C queda descalificado (luz dura: boca 0.012 sobre el tope 0.010).

## Qué veo yo (honesto)

- Inspección c1: dos niños facetados solemnes que miran a cámara, del
  mismo mundo que Thomas V2; la mano pesa sobre el hombro del menor con
  manga continua. Nada de dientes, nada de brillos, nada flotando.
- Inspección/pared c3: el raspado cubre la cara del mayor con margen y
  respeta al menor, en pared y en close-up.
- Defectos que persisten: a 3x los párpados son barras claras gruesas
  (a 640 leen como ojeras serias, aceptable); el flequillo del mayor es
  una visera recta; en pared (47 px) los niños siguen siendo masa sepia,
  como antes. El sprite tocó el tope inferior de ganancia (0.80) y quedó
  un 9.5 % bajo la referencia, dentro de banda.

## test-all, no comprobado y riesgos

- `test-all` (REAL, 2026-10-16, `node web/tools/test-all.mjs`): **45 PASS,
  0 FAIL, 0 SKIP, exit 0** — unit, smoke, audio, 38 scenarios (incluidos
  `cost14`, `chapter3`, `carta`, `brennan`, que usan la habitación), walk,
  walk second, walk alt y browser (168,1 s). Segunda ejecución completa
  para capturar el resumen tras una primera pasada ya en verde.
- NO comprobado: APK/Android físico, rendimiento en móvil (JPG+PNG suman
  ~114 KB); respaldo procedural de `bodies.js` (intacto).
- Riesgos: Blender 5.2 emite avisos `use_nodes` 6.0 inocuos (el exit 1 de
  PowerShell es solo ese stderr). Si el guion mueve las cabezas o el
  overlay, hay que revalidar anclas. El guardián de ojos del mayor quedó
  en 0.084 bajo el tope 0.10: un reencuadre futuro que meta más camisa en
  la caja lo rompería (fallaría en rojo, que es lo que debe hacer).
- Depuración documentada: a medio camino apareció una «losa flotante»
  junto a la cabeza (cotas: mandíbula/barbilla sin `* hr`, 40 cm hacia
  la cámara) más camisa/cuellos enterrados en la chaqueta; corregido en
  origen y verificado en placa.

---

# ENTREGA B — Interacción de la inspección (un punto preciso por close-up)

Pasada ARTÍSTICA/UX sobre `web/src/scenes/room.js` (único archivo de juego
tocado; `ui.js`/`game.js` intactos). Canon intacto: mismos textos, pistas,
sonidos, cordura (−4 con `sanityOnce`), variables, objetivos y «Atrás».
Close-ups intactos (luminancia N/A: no hay assets nuevos).

Antes: foto y mapa abrían `G.inspect` con `{ x: 640, y: 360, r: 800 }` — desde
la esquina del cartón (dist. ~603 del centro viejo) o la cartela (dist. ~406)
cualquier clic examinaba. Después: un único punto medido por close-up.

## Geometría (lienzo 1280x720 de la inspección, sin recorte: `paintBody`
dibuja el JPG a pantalla completa)

- FOTO `{ x: 600, y: 370, r: 180 }`: las dos figuras (mano del mayor sobre el
  hombro del menor incluida) ocupan x 470–743, y 231–556 dentro de la placa
  (x 80–1199, y 40–556; medido por píxel). El círculo contiene cabezas,
  torsos y contacto sin tocar cartón ni marco. Límite honesto: un círculo no
  cubre un rectángulo de 273x329 sin salirse de la placa; quedan fuera
  sendas tiras de ~30 px en las rodillas recortadas por el borde inferior y
  el filo exterior de las piernas. Caras y contacto, holgados (margen ≥8 px).
- MAPA `{ x: 700, y: 280, r: 175 }`: red de calles con las marcas de Hanbury
  (660,202), Flower & Dean (740,260) y Goulston (657,377) dentro; márgenes,
  cartela (a 262 px), rosa (a ~700 px) y escala, fuera. Límite honesto: las
  cruces de Buck's Row (a 251 px, pegada a la cartela: no cabe sin rozarla),
  Mitre y Berner quedan fuera — un punto preciso es preferible a extras
  decorativos, como pide la tarea.
- Táctil: r 180/175 en lógica son ~90/87 px CSS de radio a 640x360; de sobra
  para el dedo. Un solo punto basta; no hacen falta más.
- Disparo doble: `let done` por apertura en cada `act` (el efecto corre una
  vez por apertura aunque se repulse o caiga a mitad del pensamiento; el −4
  sigue una vez por partida vía `sanityOnce`, verificado en c3/c4).

## Qué cambió (archivos)

- `web/src/scenes/room.js`: puntos de foto y mapa + guardia `done` (16
  líneas añadidas, CRLF preservado).
- `web/tools/browser-check.mjs`: etapa T8 «foto/mapa» (33 `need`, 640x360,
  ratón + táctil simulado por CDP; sin Chrome hace SKIP como el resto).
- `v2/scripts/capture_interaction.mjs` + `v2/scripts/make_interaction_png.py`:
  capturas motor real dentro/fuera (antes con r=800 por llamada directa con
  la misma ruta de pintado; después con los hotspots reales) y hoja final.
- `v2/comparison/INTERACTION_640.png` (372 KB): foto y mapa, farol dentro
  (etiqueta «Examinar» visible) y fuera (sin etiqueta), a 640x360 nativo.

## test-all, no comprobado y riesgos

- `test-all` (REAL, 2026-10-16, `node web/tools/test-all.mjs`): **45 PASS,
  0 FAIL, 0 SKIP, exit 0** — unit, smoke, audio, 38 scenarios (incluidos
  `cost14`, `chapter3`, `carta`, `brennan`, `goulston`, `resume`), walk,
  walk second, walk alt y browser (223,6 s; antes 168,1 s por la etapa T8
  nueva, con sus 34 `need` en verde). `cost14` sigue cobrando la foto 4
  solo la primera vez (modo FAST intacto).
- Evidencia ANTES eliminada tras verificar (los `work/` se regeneran con los
  scripts): con r=800 el cartón y la cartela mostraban «Examinar»; ahora no.
- NO comprobado: teléfono físico (el táctil es `pointerType: touch`
  simulado por CDP); APK/Android; rendimiento móvil (sin assets nuevos).
- Riesgos: a 1280x720 bajo render por software el jugador camina lento
  (clamp de dt); solo afecta al script de capturas (teletransporta al punto
  de paseo), no al juego. Si el guion reencuadra los close-ups, revalidar
  centros/radios con los scripts de medida (borrados tras medir; el método
  queda descrito arriba).
