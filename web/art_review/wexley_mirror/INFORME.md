# T1b — Corrección del espejo de Wexley (itera sobre T1, rechazado por auditoría)

## Por qué T1 se rechazó (causas raíz, verificadas)

1. **Desalineado (~110 px, no ~50).** T1 dibujaba con
   `drawProp(ctx, 'wexley_mirror', TABLE_X, 10)` pero el ancla es
   `ay = TOP = 110` = borde superior del hueco en el sprite, así que el hueco
   caía en el mundo en y=10 y el cristal pintado (GY=117) quedaba 107 px por
   debajo: solo se veían las barras laterales, sin moldura inferior y con el
   remate fuera de pantalla. Medido en el PNG (flood-fill exterior vs hueco
   interior): hueco en sprite (31,109)-(270,377). El comentario de T1
   ("hueco en TABLE_X-119,120") y el `print` del pack ("draw at (TABLE_X, 10);
   hueco en 120") eran incoherentes entre sí; el código hacía lo primero.
2. **Dorado ilegible.** Oro authored oscuro (0.36,0.22,0.075) + AgX +
   oscurecido 0.85 en el pack: en la capa estática nocturna se volvía
   marrón mate. La v2 intermedia confirmó además que AgX lava la
   saturación hasta el marfil.
3. **Pack frágil ante crestas ornamentadas.** El bbox de *todos* los píxeles
   interiores contaba también los bolsillos transparentes entre volutas y
   cartela (31 px) e inflaba la altura del hueco (312 vs 267) haciendo fallar
   el assert.

## Qué cambió T1b (solo pasada artística; canon intacto)

- `web/src/scenes/seance.js`: dibuja en `(TABLE_X, 120)`; el hueco cae en
  (TABLE_X-119,120,238x267) y el cristal (TABLE_X-122,117,244x273) solapa
  ~3 px por cada lado bajo la moldura. Comentario corregido. Hotspot,
  `mirror_cracked`, cristal/reflejos y fallback procedural sin cambios.
- `web/assets/props/wexley_mirror.png` (nuevo render, 298x437, 71 KB) +
  misma entrada `wexley_mirror` (`ax:151, ay:110`) en
  `web/assets/props/index.json` (se normalizó a finales LF como el original).
- `scripts/build_wexley_mirror.py` (v3): frisos de ovas y dardos (huevos
  ámbar + conos de bronce) en riel superior y montantes, rosetas esquineras
  grandes, repisa inferior con dentellones y colgante, remate compacto
  (cartela + urna + volutas). Oro saturado para `view_transform = Standard`
  (sRGB plano: el sprite debe encontrarse con la paleta pintada, no con
  AgX), sin oscurecido en el pack (`BRIGHTNESS 1.0`). Hueco intacto.
- `scripts/pack_wexley_mirror.py`: el hueco es la mayor región conexa
  transparente interior (los bolsillos de la cresta se listan e ignoran);
  `print` de constantes corregido a `draw at (TABLE_X, 120)`; escritura con
  `newline="\n"`.
- `scripts/make_comparison.py`: la hoja AB se cuantiza a 256 colores sin
  difuminado para cumplir el presupuesto (<600 KB); quitando `.quantize`
  sale RGB completo. `capture_seance.mjs` sin cambios.

## Evidencia (motor real, escena `seance`, x=700)

- `comparison/AB_seance_640.png` (104 KB, única captura en repo).
- Lo que veo en el DESPUÉS a 640x360: marco dorado cálido que rodea todo el
  cristal (montantes, riel superior, repisa inferior con dentellones y
  remate con urna sobre el riel), cristal oscuro con velas y siluetas
  dentro: se lee CLARAMENTE mejor que el ANTES. A 1280x720
  (verificada, no guardada) las ovas, dardos y rosetas se distinguen.
- Con `mirror_cracked` la grieta queda centrada en el cristal; sus radios
  largos invaden la pared igual que antes (heredado, fuera de alcance).
- Pero honesto: las volutas del remate a 640x360 son más silueta con filo
  dorado que talla legible, y las ovas se leen como cuentas más que como
  ovas y dardos clásicos. El oro tira a ámbar claro en el filete interior;
  es legible y coherente con los dorados pintados (#8a6a2a), no un oro
  museo.

## test-all (`node web/tools/test-all.mjs`)

45 líneas PASS, 0 FAIL, 0 SKIP, exit 0 (unit, smoke, audio, scenarios
incluido `scenario seance`, walk, walk second, walk alt, browser).

## NO comprobado / riesgos

- No probado en móvil/Android (solo Chromium de escritorio); el PNG
  (71 KB) está en rango móvil.
- Blender 5.2: ningún fallo de API (solo los `DeprecationWarning` de
  `use_nodes` ya conocidos, inofensivos en 5.2).
- Si un re-render futuro mueve el hueco >3 px o lo fragmenta, el pack falla
  a propósito: actualizar GX/GY/GW/GH de `seance.js`.
- La hoja AB cuantizada posteriza levemente el grano de niebla; las
  capturas RGB se regeneran con `capture_seance.mjs` + `make_comparison.py`
  (quitando `.quantize`).
