# T5 — Callejones de la persecución: variación de muros, colada y fondos

Rama `reboot/web-el-huesped`. Pasada ARTÍSTICA/UX sobre `web/src/scenes/alleys.js`.
Lógica de persecución, tiempos, opciones, hotspots, textos, flags, costes y final
intactos. Sin assets de Blender: a 640x360 lo que rompe la repetición es la
variación procedural (semillas y mezcla), no más polígonos — ningún prop 3D
puntual aportaba a esa escala y solo habría sumado peso.

**Qué cambió (solo `web/src/scenes/alleys.js`):**
- Fachadas: nunca más de dos frentes seguidos del mismo material (ladrillo/yeso),
  bloques bajos de 2 plantas (22 %) que rompen la línea de cornisa, 2–3 plantas por
  frente, gabletes ocasionales (16 %), 5 tonos de yeso, carteles con posición y
  tamaño variados (mismos 4 textos), ventanas 1–3 con `litMap` en rango válido,
  puertas con ancho/posición variables y parches de carteles **sin texto**
  (`bills()`: papel envejecido y esquina despegada; a 640x360 cualquier letra
  sería ilegible y el decorado no debe añadir texto legible al canon).
- Colada: reescrita la docena de cuerdas — altura, comba y posición con jitter,
  0–4 prendas por cuerda (alguna vacía), sábanas ocasionales, 8 tonos de paño,
  rayas de cutí al 25 %, pinzas. El trío clónico cada 360 px desaparece.
- Cruces (x=1100/2200/3300): misma x, rótulos y textos intactos; anchos
  120/132/108 y filo frío en una jamba para que el hueco lea como profundidad.
  Sin cambios en las decisiones cronometradas: la silueta del camino y las
  farolas mandan.
- Profundidad: hasta 4 pasajes ciegos estrechos entre fachadas (sin rótulo,
  lejos de cruces y farolas para no fingir una opción) y postes de primer plano
  con paso/ancho/altura variables (antes cada 1300 px exactos).
- Suelo y cacharros: barriles/cajas con jitter de posición y escala ±15 %,
  sacos ocasionales; adoquín, farolas y escalinata final intactos.
- Capas parallax: las mismas 3 (sin capas nuevas); coste de frame idéntico.

**Evidencia (motor real, misma cámara antes/después):**
- `comparison/AB_alleys_640_a.png` (534 KB): farola/colada x=700, tramo x=1500.
- `comparison/AB_alleys_640_b.png` (516 KB): cruces x=2200 (FLOWER & DEAN) y
  x=3100 (THRAWL ST). Cuatro filas no cabían en un solo PNG fiel (923 KB a 64
  colores; a 16 se posteriza), así que van en dos hojas de 2 filas a 96 colores.
- `scripts/make_comparison.py`: regenera las hojas desde `before/`+`after/`
  (capturas 640x360 con `capture_scene.mjs alleys <before|after> <x>`,
  x ∈ {700, 1500, 2200, 3100}; las 1280x720 fueron QA intermedio, no se guardan).

**Rendimiento (`node web/tools/smoke.mjs`):** alleys build 106 ms → ~120 ms
(pintado único al cargar), frame 0,0 ms antes y después. Sin empeoramiento
apreciable; móvil sin capas nuevas.

**Revisión honesta a 640x360:** la colada y los carteles cambian mucho; los
pasajes y el jitter de vanos rompen el metrónomo. Lo que NO mejoró: el ladrillo
sigue leyéndose uniforme (el aparejo por pieza no sobrevive al downsample, como
anticipa el encargo) y la retícula de ventanas repite forma (los huecos los
dibuja `facade()` en `build.js`, compartido con otras escenas: tocarlo excede
el riesgo de esta pasada). La escena sigue muy oscura: es el tono pedido
(nocturna y legible por farolas/silueta, no por luz general).

## test-all (real, 2026-10-16, T5)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS, 0 FAIL,
0 SKIP**, exit 0 (unit, smoke, audio, 38 escenarios, walk x3, browser).
