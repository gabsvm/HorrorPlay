# T6 — Pulido de tres detalles (REPORT)

Tres arreglos pequeños, cada uno comprobado en el motor real a 640x360.
Evidencia en `comparison/`: un PNG lado a lado por arreglo (< 500 KB).
Nada más en el repo salvo este informe.

## (A) Espejo de Wexley: oro envejecido

**Problema confirmado.** En `AB_seance_640.png` el marco Blender (VALUE 1.0)
brillaba como neón amarillo junto a las velas. Medido en el motor (x=700):
núcleos de montantes ~1.4–1.6x sobre el marco pintado original.

**Cambio.**
- `web/art_review/wexley_mirror/scripts/pack_wexley_mirror.py`: nuevo
  multiplicador reproducible `VALUE = 0.72` (estilo Hanbury). El cristal,
  reflejos, grieta, hotspot y geometría del hueco no se tocan (el pack
  revalida el hueco 238x267 y `ax/ay` no cambian; `index.json` sin cambios).
- El mismo script ahora preserva los finales CRLF existentes de
  `index.json` en vez de convertir todo el archivo a LF.
- `web/assets/props/wexley_mirror.png` (72 906 → 66 876 bytes) +
  `renders/wexley_mirror_game_candidate.png` regenerados desde un RAW
  re-renderizado del `.blend` comprometido (Blender 5.2.2 LTS, sin fallos
  de API; el RAW intermedio se borró tras empaquetar).

**Calibración (motor real, mismo recorte 640x360, x=700).** Referencia
original = fallback pintado, capturado ocultando el PNG (restaurado
después; `seance.js` intacto). Máscara de dorado (píxeles cálidos > 50)
en montantes izq/der: original 112.9/102.4 → VALUE 1.0: 153.7/144.8
(1.36x/1.41x) → VALUE 0.72: 131.7/124.6 (**1.167x/1.217x**, bajo el tope
1.25x). La respuesta es lineal en VALUE con base aditiva de halo de velas
(~75–85); con 0.85 aún daba 1.27x/1.31x, por eso se bajó a 0.72.
Ornamento verificado a 640: ovas, rosetas, dentellones, remate con urna y
colgante siguen legibles; las velas vuelven a ser lo más brillante del rincón.

Evidencia: `comparison/AB_A_mirror_640.png` (312 KB).

## (B) Fotografía de los niños: albúmina creíble

**Cambio** (`web/art_review/room_photo_map/scripts/make_photo_map.py`,
función `paint_boy` + brazo del mayor; regenerado con el script):
hombros inclinados con leve entalle, cuello de camisa con pechera y
cuello de pajarita, chaquetas con solapa y tres botones, mangas
entalladas con puños y manos (dedos insinuados), pelo con volumen
(masa trasera + mechones laterales + brillo), rostros solo con sombreado
tenue de ojos cerrados/boca que el blur de 3.2 px funde (nada dibujado
tras el blur: fuera ojos de punto y sonrisa), mano del mayor sobre el
hombro del menor (manga + puño + mano, no palo y disco).
Anclas intactas (`ELDER_HEAD`, `SPRITE_HEAD`), mismos nombres de archivo,
sello «E. Vance» y montura sin cambios; `room_photo_torn.jpg` regenerada
con el mismo código (cara del mayor raspada, cubre la nueva cabeza con
margen). `room_map.jpg`, `room_map.png` y `room_photo.png` (sprite de
pared, cabeza del overlay c3 en su sitio) salen byte-idénticos: sin diff.

Evidencia: `comparison/AB_B_photo_640.png` (66 KB), inspección con farol
antes/después. Nota honesta: las figuras siguen siendo pictóricas
(coherente con el arte del juego), no fotográficas; los rostros quedan
deliberadamente suaves y sin rasgos, según lo pedido.

## (C) Barca de Nat: verificada, sin defecto → sin cambios de código

- `nat_boat` aparece solo en `web/src/scenes/foreshore.js` (única
  coincidencia en `web/src`); `drawNear` la dibuja únicamente si
  `is1866(G)` (prólogo en Limehouse) y sin flag `boat`. En 1888
  (`fs_1888`) retorna antes: la barca NO sale en 1888.
- Posición/ancla: (1130, GROUND+30), `ay` = quilla; reposa sobre el barro
  con la elipse de lodo (`foreshore.js` l.275) lamiendo el casco:
  **reposa/varada en bajamar, no flota**. Correcto para el prólogo.
- Escala: sprite 96x83 frente a Thomas niño (h=138): juguete creíble
  (caja de puros) junto a los pilotes del embarcadero.
- Luz/profundidad: casco en madera oscura, vela crema que coge el
  atardecer + glint de `drawGlow` cada ~3.2 s; mismo plano de suelo que
  el jugador, entre pilotes. Coherente con el resto del prólogo.
- No se tocó `foreshore.js` ni `nat_boat.png`.

Evidencia: `comparison/AB_C_boat_640.png` (222 KB): plano 1866 en x=1000
+ zoom 2x de la barca (en x=1130 el jugador la tapa: para verla hay que
apartarse, como en juego real al ir al hotspot).

## test-all

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`, exit 0:
**45 PASS, 0 FAIL, 0 SKIP** (unit, smoke, audio, 38 scenarios — incluido
`scenario seance` —, walk, walk second, walk alt, browser).

## NO comprobado / riesgos

- No probado en móvil/Android (solo Chromium de escritorio); los PNG
  finales están en rango móvil (65/47/54/8 KB).
- Vistas 1280x720 capturadas y revisadas, no guardadas (regenerables con
  los scripts); la hoja AB del espejo está cuantizada a 255 colores.
- Blender 5.2.2: el `.blend` comprometido renderiza sin errores de API;
  `build_wexley_mirror.py` NO se re-ejecutó (solo re-render del .blend),
  así que el .blend no cambió.
- La media sobre rectángulo fijo (incluyendo muro) da ~1.3–1.4x porque el
  marco nuevo, más ancho, cubre muro oscuro del ANTES: el criterio se
  evaluó sobre píxeles de dorado, que es la lectura honesta del «marco».
- Si un re-render futuro mueve el hueco > 3 px, el pack falla a propósito.


## Decisión del auditor sobre (B), la fotografía

**Revertida.** El segundo intento de las figuras (hombros, cuellos, solapas, rostros fundidos) se vio peor que el pictograma de T2: a 640x360 y bajo la luz de la inspección los rostros quedan como óvalos oscuros con un hueco, como maniquíes de madera. Se conservan los JPG y el script de T2. Para mejorar de verdad las figuras haría falta un modelado/ilustración, no más formas procedurales en PIL. (A) espejo y (C) barca, aprobados.
