# T3b — Corrección de los frascos (el auditor rechazó solo los frascos)

T3 dejó la estantería en crema luminoso (+54 % sobre el original: 33,1 → 51,1
en L media) y 28 clones idénticos. Causa raíz: rig Blender sobreexpuesto
(líquido 0,45/0,52/0,34 con alfa 0,55 + áreas 260/120/130 + brillo con
emisión 0,7) y `greaves.js` calculando `cR/cG/cB` por frasco pero sin
usarlos en la rama del sprite. Cráneo, microscopio y archivador de T3 no se
tocaron (los reempaquetados salen byte-idénticos).

**Qué cambió:**
- `scripts/build_jars.py` — vidrio turbio oscuro (0,33/0,34/0,21, alfa
  0,72), espécimen más grande y oscuro arriba de la etiqueta, tapón de
  corcho oscuro, etiqueta clara baja, brillo fino (emisión 0,3), luces
  30/15/18 + mundo 0,25. Geometría y encuadre intactos (BODY 59/39 sin
  cambios, guarda de simetría OK).
- `web/assets/props/greaves_jar_{tall,squat}.png` — 44x78 (4 KB) y 44x57
  (3 KB); media opaca (79,79,67) y (81,79,65): oliva oscuro, no crema.
- `web/src/scenes/greaves.js` — cada frasco se dibuja con `drawJarTinted`:
  copia cacheada del sprite + velo `rgba(cR,cG,cB,0,6)` con
  `globalCompositeOperation` 'source-atop' (los mismos aleatorios del
  respaldo). Orden de `rng(5)` y bloque procedural intactos; si falta el
  sprite, el respaldo pinta lo de siempre.
- `web/src/art/models.js` — solo añade el getter `propSprite` (2 líneas +
  comentario); `drawProp` y el resto, intactos.
- `web/tests/unit/props.test.mjs` (nuevo, LF como el resto) — decodifica los
  dos PNG sin dependencias y exige oliva oscuro, variantes distintas,
  <100 KB, índice coherente, más respaldo + velo presentes en `greaves.js`.
  Fallaba antes del arreglo (203,205,180 crema; sin velo), pasa después.
- `scripts/make_comparison.py` — nuevo subtítulo del panel derecho.
- `comparison/AB_greaves_640.png` — regenerado (163 KB < 400 KB).

**Evidencia (motor real, encuadre escritorio x=700):** estantería L media
33,4 → 36,2 (**+8 %**, dentro del +15 %); sala 36,3 → 38,4. Los 28 velos
son distintos entre sí (28/28 con el `rng(5)` real, rangos
cR 70–94, cG 78–96, cB 48–62). Verificado a 640 y 1280 (capturas `work/`
borradas tras componer; se regeneran con `capture_greaves.mjs`).

**Revisión honesta a 640 y 1280 (visor directo):** la pared vuelve a la
penumbra y ya no compite con esqueleto ni ventana; se leen tapón oscuro,
cuerpo oliva, masa interna más oscura, etiqueta clara y filete especular.
Pero: el tono sale algo más cálido/pardo que el verde frío del original, la
variedad entre frascos es sutil (±9 niveles por el velo al 0,6) y el
espécimen se lee como penumbra interna más que como forma. No re-renderizo
más: cumple el criterio (tan sombrío y legible como el antes, modelado y
variado), con margen (8 % frente al 15 %).

## test-all (real, 2026-10-16, T3b)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS,
0 FAIL, 0 SKIP**, exit 0 (unit —incluido el nuevo `props.test.mjs`—, smoke,
audio, 38 scenarios —incluido `greaves_resume14`—, walk, walk second,
walk alt, browser).

## Qué NO pude comprobar (T3b)

- **Respaldo procedural en el motor:** solo corre sin los PNG; es el código
  viejo (mismo patrón `nat_boat`) y pasa `node --check`, sin renderizar.
- **Móvil físico / APK / memoria:** NOT_TESTED. Los dos PNG suman 8 KB.
- **Alfa del velo (0,6):** calibrado por cálculo + captura (8 %); si el
  auditor quiere más variedad o más frío, es una constante.

# T3 — Consultorio de Greaves: objetos focales

Pasada artística/UX sobre `web/src/scenes/greaves.js` (cráneo, microscopio,
archivador y frascos de la estantería, en ese orden). Canon intacto: mismos
hotspots y rects, mismos textos, mismos flags, misma lógica, mismos costes.
Solo cambia CÓMO se ven los cuatro objetos; el dibujo procedural anterior
queda como respaldo literal en cada caso.

## Qué cambió (archivos)

**Sprites nuevos (generados por script, ver abajo):**
- `web/assets/props/greaves_skull.png` (44x56, 3 KB) — cráneo de hueso
  marfilenvejecido, cuencas marcadas, dientes; base en (752, GROUND-99).
- `web/assets/props/greaves_microscope.png` (44x90, 4 KB) — monocular de
  latón con tubo inclinado, ocular de ebonita, platina y espejo
  condensador; base en (827, GROUND-98).
- `web/assets/props/greaves_cabinet.png` (180x400, 58 KB) — vitrina de
  caoba con tres baldas de expedientes (ante, rojo, verde, azul) con
  etiquetas, mainel, placa de latón y puertas inferiores con pomos;
  ocupa exactamente el rect procedural viejo (1240..1420, GROUND-410..-10).
- `web/assets/props/greaves_jar_tall.png` (44x78, 5 KB) y
  `greaves_jar_squat.png` (44x57, 3 KB) — dos frascos de vidrio turbio con
  contenido oscuro, tapa de madera y etiqueta; sustituyen los 28 frascos
  de la estantería eligiendo variante por altura (alto si jh > 62) y
  escalando el cuerpo a jh, con la tapa donde caía el rect viejo.
- `web/assets/props/index.json` — solo añade las cinco entradas (dif
  aditivo, CRLF conservado).

**Código (diff mínimo, fallbacks conservados):**
- `web/src/scenes/greaves.js` — cada objeto se dibuja con `drawProp` y el
  código anterior queda intacto dentro del `if (!drawProp(...))`. En los
  frascos las cinco llamadas a `rng(5)` se anticipan en el mismo orden
  (rango, tres enteros, rango), así que posiciones y alturas no cambian ni
  siquiera en el respaldo.

**Técnica:** Blender 5.2 (ortho frontal, 100 px/unidad, `Standard` sRGB sin
AgX, sin pre-oscurecido en el pack: la lección de T1b) + `drawProp` con
respaldo, el flujo de crate/poste/espejo.

## Evidencia (rutas, motor real)

- `web/art_review/greaves_study/comparison/AB_greaves_640.png` (165 KB,
  única captura en repo): antes/después del encuadre del escritorio.
- Scripts que regeneran todo: `scripts/build_{skull,microscope,cabinet,jars}.py`
  (renders + `.blend` en `source/`/`renders/`), `scripts/pack_greaves.py`
  (sprites + índice, con asserts de tamaño <100 KB y de centrado),
  `scripts/capture_greaves.mjs` (encuadres escritorio x=700 y archivador
  x=1290 a 640 y 1280; sin inspecciones: los hotspots solo piensan o abren
  un documento de texto), `scripts/make_comparison.py` (la lámina AB).

## Revisión honesta a 640x360

No dispongo de visor de imágenes en este entorno, así que la revisión es
numérica sobre las capturas del motor: correlación cruzada normalizada con
máscara alfa de cada sprite contra el DESPUÉS (y contra el ANTES como
control), más energía de bordes en la caja detectada.

| sprite | NCC después | NCC antes | bordes antes→después |
|---|---|---|---|
| cráneo | 0.60 en (334,256) | -0.25 | 42.2→53.1 (+26 %) |
| microscopio | 0.72 en (372,240) | 0.04 | 27.6→42.2 (+53 %) |
| archivador | 0.67 en (511,127, 90x200) | 0.18 | 10.4→17.7 (+71 %) |
| frasco alto | 0.86 en (122,201) | 0.23 | 14.5→22.3 (+54 %) |

Las posiciones detectadas coinciden con el layout del mundo (el micro está
38 px a la derecha del cráneo = 76 px de mundo; ambas bases alineadas;
el archivador cae en x=511 con su tamaño completo; el frasco cae en una
casilla real de estantería). La luminancia media sigue en rango nocturno
(~20–110, sin quemados). Conclusión: los cinco sprites cargan, caen en su
sitio y añaden detalle legible; ninguno se integró a ciegas y ninguno
empeoró su zona. Los scripts de comprobación están en `/tmp` (no viajan
en el repo): `check_greaves_diff.py`, `match_greaves.py`.

## test-all (real, 2026-10-16)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS,
0 FAIL, 0 SKIP**, exit 0 (unit, smoke, audio, 38 scenarios — incluido
`greaves_resume14` —, walk, walk second, walk alt, browser).

## Qué NO pude comprobar

- **Inspección visual directa:** no hay visor de imágenes en mi entorno;
  la verificación es numérica (arriba). El auditor debe mirar
  `AB_greaves_640.png` y regenerar los encuadres 1280 si quiere.
- **El respaldo procedural en el motor:** solo se ejecutaría si faltaran
  los PNG; es el código viejo byte-idéntico y pasa `node --check`, pero
  nunca se renderizó. Riesgo bajo (mismo patrón que `nat_boat`, ya en
  producción).
- **Android físico / APK / memoria y rendimiento en móvil:** NOT_TESTED.
  Los cinco PNG suman 73 KB.
- **Re-render futuro:** si un .blend mueve un objeto, el pack no lo
  detectaría solo (solo el de frascos lleva asserts de centrado y el de
  medidas es por construcción 100 px/unidad); revisar con
  `capture_greaves.mjs` + los scripts de `/tmp` si se remodela.

## Riesgos y notas

- Blender 5.2: ningún fallo de API (solo los `DeprecationWarning` de
  `use_nodes`, ya conocidos e inofensivos). Blender devuelve exit ≠ 0 por
  esos avisos en stderr aunque el render se guarde: los scripts son buenos
  si aparece `RENDERED` + el PNG.
- `muse.edit_file` no puede emparejar bloques CRLF multilínea ni emitir
  `\r\n`: el import/cráneo/microscopio se editaron por líneas y el
  archivador/frascos vía `/tmp/apply_greaves.py` con reemplazos exactos;
  al final se normalizaron los LF sueltos y se verificó (281 CRLF, 0 LF
  sueltos; el diff no toca nada fuera de los cuatro objetos + import).
- El microscopio nuevo (82 px) es más alto que el viejo (~58 px): gana
  presencia sin solaparse con la lámpara (x 809–845 frente a 672–734).
- El archivador ocupa el rect exacto del viejo: si el auditor prefiere
  que respire más dentro de la pared, basta escalar en el pack.
