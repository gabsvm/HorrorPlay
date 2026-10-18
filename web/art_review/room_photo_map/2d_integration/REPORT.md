# ENTREGA A (2D) — Fotografía en el close-up de inspección (01 y 02)

## Qué se cambió

- `web/assets/closeups/room_photo.jpg` (c1, intacta) y `room_photo_torn.jpg`
  (c3/c4, raspada): composiciones nuevas a 1280x720 derivadas de
  `source/01_foto_limpia_thomas_nat.png` y `source/02_foto_raspada_thomas_nat.png`.
  Mismos nombres, mismo formato JPG, mismas entradas de índice, fallback
  procedural intacto (`paintRoomPhoto` en `web/src/art/bodies.js` no se tocó).
- `web/src/scenes/room.js`: solo el punto único de la foto pasa de
  `{x:600, y:370, r:180}` a `{x:640, y:270, r:185}` (+ comentario con las
  medidas nuevas). Textos, cordura, consecuencias y guarda intactos.
- Nuevos scripts versionados en
  `web/art_review/room_photo_map/2d_integration/scripts/`:
  `compose_room_photo.py` (regenera los dos JPG desde `source/`) y
  `capture_2d.mjs` (capturas del motor real + toma fuera de zona).
- `web/tools/browser-check.mjs`: SIN CAMBIOS. Las coordenadas de la prueba T8
  siguen siendo significativas con la zona nueva: el dentro `(610,350)` queda a
  ~85 px del centro (radio 185) y el fuera `(60,640)` a ~688 px. Verificado por
  distancia y en el motor (toma fuera de zona sin etiqueta Examinar).

## Receta (reproducible, misma geometría para 01 y 02)

Recorte limpio de la tarjeta (umbral de blanco >242, cierre morfológico,
borde suavizado 1,5 px; las esquinas redondeadas caen sobre el fondo oscuro,
sin blanco), escala uniforme Lanczos a tarjeta 455x604 (83,9 % del alto,
centrada en 412,58), fondo pardo oscuro (degradado + brillo + vetas + grano
con semilla fija + viñeta + sombra de la tarjeta). Clima: compresión de altas
luces sobre luminancia (conserva el matiz de la albúmina) + multiplicado
cálido; el cartón crema (~188-204) baja a ~110-135 sin blanco quemado
(máx. 180-182, p95 ~161). El fondo se servocontrola (solo él) para que el
canvas c1 quede en media 112. Los originales de `source/` no se modificaron.

Medidas del script (numpy, pre-JPEG salvo medias JPG):

- JPG final c1: media **112,0** (banda 102-138: OK, -6,7 % bajo la base 120).
- JPG final c3: media **111,7** (OK).
- Caras en JPG: mayor ~106, menor ~108 (legibles bajo el farol en el motor).
- Sello `E. VANCE` legible; cartón ~110-135 según zona.
- Tamaños: 82 KB (c1) y 94 KB (c3).
- 01 vs 02: la MISMA máscara, recorte, escala, posición y niveles (una sola
  ruta de código). Diferencia media fuera de la zona dañada: **0,28/255**
  (mínima); dentro del daño: **10,4/255**. No se usaron overlays 06/08.
- Zona medida sobre el JPG final: tarjeta x 412-867, y 58-662; niños
  (cabezas, torsos, mano del mayor en el hombro del menor) x 503-760,
  y 139-404. Círculo (640,270,185): cubre las cuatro esquinas (dist. máx.
  ~181) sin tocar mesa ni cartela del sello (y~600+).

## Evidencia (motor real, 640x360)

Comparativas lado a lado ANTES/DESPUÉS en `comparison/` (<600 KB cada una):

- `comparison/cmp_c1_onzone_640x360.png` (220 KB): farol sobre los niños, c1.
- `comparison/cmp_c3_onzone_640x360.png` (225 KB): cara del mayor raspada, c3.
- `comparison/cmp_c3_offzone_640x360.png` (223 KB): farol en la mesa
  (150,600), figuras a oscuras y SIN etiqueta Examinar.

Qué se ve (honesto): en c1 los dos rostros son legibles y distinguibles bajo
el farol, con tono de albúmina cálido; en c3 la cara del mayor es un borrón
claro de emulsión perdida con grietas radiadas (ilegible) y el menor queda
intacto; el daño se lee como emulsión, sin sangre ni añadidos. Defectos: el
cartón queda algo más frío/grisáceo que el fondo en vista directa al JPG
(contraste simultáneo con el fondo melocotón; en RGB el borde es cálido
158,123,84), y el fondo central es más claro que las esquinas por diseño
(media obligada a ~112). Bajo el farol del motor ambos efectos se atenúan.
La lluvia varía entre capturas (etiquetado en el log de captura).

## Pruebas

- `node web/tools/test-all.mjs`: **45 PASS, 0 FAIL, 0 SKIP** (dos pasadas
  completas con exit 0; `browser` 228-233 s PASS, incluye la etapa foto/mapa T8
  con la zona nueva y las coordenadas de prueba sin tocar).
- `git diff --check`: limpio (líneas CRLF del `room.js` preservadas).

## Qué NO se pudo comprobar y riesgos

- No se probó en Android (sin dispositivo): los JPG (82/94 KB) y el close-up
  a 640x360 son del mismo orden que los actuales; riesgo bajo.
- Rareza de herramienta: en headless, tras varios ciclos captura/métricas en
  la MISMA sesión, el tercer `inspect` no llega a abrirse (rAF aparentemente
  parado; sin error, `running:0`). No es bug del juego (T8 abre/cierra
  decenas de inspecciones en una sesión sin capturas). `capture_2d.mjs` lo
  evita con una sesión fresca por toma (`off`/`c1`/`c3`) y reintento
  protegido; documentado en la cabecera del script.
- No se tocan: sprite de pared, mapa, textos, lógica, deducciones ni final.

# ENTREGA B (2D) — Sprite de pared de la fotografía (c1 intacta, c3/c4 raspada)

## Qué se cambió

- `web/assets/props/room_photo.png` (c1): retrato vertical nuevo de 70x92 con
  alfa real, derivado de `source/05_sprite_pared_foto_alto_contraste.png`.
  Sustituye al apaisado procedural de 110x84. Entrada de índice actualizada
  (`ax/ay 0/0, w/h 70/92`); el nombre de prop se mantiene.
- `web/assets/props/room_photo_torn.png` (c3/c4, NUEVO prop): misma receta a
  partir de `source/02_foto_raspada_thomas_nat.png` (cara del mayor raspada,
  menor intacto). Misma lona 70x92, misma colocación, misma entrada de índice.
  (El nombre coincide con el del close-up de `assets/closeups/`, pero son
  espacios de nombres independientes: `__PROPS` frente a `__CLOSEUPS`.)
- `web/src/scenes/room.js` (sigue CRLF, sin textos/lógica tocados):
  `variant: (G) => (phase(G) === 'c1' ? 'c1' : 'torn')` para que la capa
  estática se hornee por fase (el motor cacheaba `room@rs@` sin variante: la
  primera visita imponía su foto a todas las demás); `build(R, G)` dibuja
  `room_photo_torn` en c3/c4 y `room_photo` en c1, centrado a 735
  (`drawProp(..., 700, GROUND - 404)`), y anota la clase horneada en
  `built.photo`; el raspado procedural de `drawNear` (lín. ~161) solo se
  dibuja cuando la capa horneada NO es `torn`, así no se duplica el daño.
  Si falta `room_photo_torn`, la rama cae al fallback procedural íntegro de
  siempre (foto antigua + raspado procedural, tal cual); si falta también
  `room_photo`, igual que antes. El hotspot Fotografía NO cambia
  (`[676, GROUND-404, 118, 92]`): contiene al sprite (700-770, 258-350) con
  24 px de margen por lado.
- Scripts versionados en `.../2d_integration/scripts/`: `make_wall_photo.py`
  (genera candidatas y finales), `capture_wall.mjs` (pared c1/c3 en motor
  real + comprobaciones de fase, caché y hover) y `make_comparison_wall.py`.
- `source/`: quedan SOLO `05_sprite_pared_foto_alto_contraste.png` (elegida) y
  `02_foto_raspada_thomas_nat.png` (raspada). Descartadas y borradas:
  `03_sprite_pared_foto.png` (SHA-256
  `288e355c86c2d8279fc3ad8a957875e8c215851d5fce57b4942bae0ed92482a5`:
  la más lechosa en pared, la que peor recorta las dos figuras) y
  `07_sprite_pared_foto_pixel_safe.png` (SHA-256
  `1e8e732ae24c3d0a30715ca2f475fd115d1e58291c0cc6aa261b2ed36e038464`:
  intermedia pero con el cartón más claro, la que más arriesga el efecto
  pegatina). Elegida 05: a tamaño de pared da la silueta de dos figuras y los
  rostros más distinguibles sin brillar (ver `cmp_variants_wall.png`).

## Receta (reproducible, rutas relativas al script)

Máscara de tarjeta (umbral de blanco >242, cierre 15, plumado 1,5 px),
compresión de altas luces sobre luminancia + multiplicado cálido (misma
familia que el close-up), servo lineal a media 75 del sprite enmarcado,
downscale Lanczos a tarjeta de 84 px de alto + UnsharpMask suave, marco de
nogal oscuro pintado BAJO la tarjeta (los huecos de borde dan madera, nunca
blanco) y lona final común 70x92 con esquinas redondeadas transparentes.
La 02 y la 05 son encuadres distintos de la misma tarjeta (misma escala,
distinto recorte), así que la 02 se registra sobre la ventana de la 05 por
correlación cruzada normalizada (ZNCC grueso-a-fino: desplazamiento (30,4),
puntuación 0,72) y se iguala su curva de tono por CDF del área de foto
(excluidos cartón claro y raspado brillante). Diferencia final intacto/rascado
fuera del daño: media 14,1/255 (residuo de subpíxel entre los dos encuadres
de terceros, invisible a 33x46 px en la pared oscura); dentro del daño el
raspado domina. Los originales de `source/` no se modificaron.

Medidas (numpy, PNG finales RGBA):

- Sprite c1: 70x92, media **74,5** (banda 63,75-86,25: OK, -0,7 % bajo 75).
- Sprite c3: 70x92, media **74,5** (OK).
- En el motor (ventana de la foto, 1280x720): ANTES c1 26,1 → DESPUÉS c1
  **25,6** (-1,9 %) y DESPUÉS c3b **25,4**: misma presencia nocturna, sin
  pegatina brillante.
- Tamaños: 12 KB (c1) y 14 KB (c3).

## Evidencia (motor real; la lluvia varía entre tomas)

Comparativas lado a lado ANTES/DESPUÉS en `comparison/` (<600 KB):

- `comparison/cmp_wall_c1_640x360.png` (345 KB): apaisado gris → retrato
  vertical oscuro de dos niños.
- `comparison/cmp_wall_c3_640x360.png` (344 KB): ídem en c3; el daño se
  intuye en la pared (cara del mayor pálida) y lo cuenta el close-up.
- `comparison/cmp_variants_wall.png` (20 KB): 03/05/07 en la pared real.

Qué se ve (honesto): a 640x360 el retrato se lee como dos figuras con marco
(el 05 es el único con siluetas y cabezas distinguibles en la penumbra); los
rostros individuales NO son nítidos a esa distancia en ninguna variante
(física: ~33x46 px en pantalla) — el detalle lo da el close-up, intacto. No
hay halo blanco ni pegatina: el cartón quedó entonado a la pared. En c3 la
pared muestra la cara del mayor clara/raspada y el menor intacto, en
coherencia con el close-up raspado; el raspado procedural antiguo ya no se
dibuja encima (verificado: `built.photo` es `torn` y el live-pass lo salta).

Verificación lógica en el motor (CDP, `capture_wall.mjs`): c1 hornea
`photo:'intact'` (caché `room@0.5@c1`), c3b hornea `photo:'torn'` (caché con
ambas claves, la visita NO reutiliza la capa c1); hover por la vía real del
puntero: centro de la foto (escena 735,304) → `photo`/«ExaminarFotografía»
visible, pared desnuda (640,300) → nada; igual en c1 y c3b. Fallback: con
`room_photo_torn.png` apartado, c3 hornea `photo:'intact'` y reproduce el
aspecto anterior (dif. media 1,79/255 = suelo de ruido de lluvia).

## Pruebas

- `node web/tools/test-all.mjs`: **45 PASS, 0 FAIL, 0 SKIP** (exit 0;
  `browser` 229,3 s PASS, incluye la etapa foto/mapa T8 sin tocar).
- `git diff --check`: limpio (CRLF de `room.js` e `index.json` preservados).

## Qué NO se pudo comprobar y riesgos

- No se probó en Android (sin dispositivo): los PNG (12/14 KB frente a 9 KB
  del sprite anterior, mismo orden de magnitud); riesgo bajo.
- El residuo 14,1/255 fuera del daño entre c1 y c3 viene de que 02 y 05 son
  fotos/encuadres distintos de la tarjeta; a tamaño de pared es invisible,
  pero un pixel-peeper comparando sprites vería micro-diferencias de tono en
  los trajes además del raspado.
- La etiqueta del hover en nulo (`label:"ExaminarFotografía", hidden:true`)
  conserva el texto anterior: es el comportamiento estándar de `ui.hover`
  (verificado igual en c1/c3, sin cambios).
- No se tocan: close-up, mapa, textos, cordura, guardados, deducciones,
  final ni `walk`.

## Decisión del auditor (Sonnet 5.5): resultado por entrega y candidatos del paquete

| Entrega | Veredicto | Motivo |
|---|---|---|
| A. Fotografía en el close-up (01 y 02) | **APPROVE** | Se leen dos niños reales bajo el farol, con la mano del mayor sobre el hombro del menor; en c3/c4 el raspado cubre solo la cara del mayor y el menor queda intacto; con el farol fuera de la zona no hay etiqueta de examinar. Mirado en el motor a 640x360. |
| B. Sprite de pared (05) y su versión raspada (derivada de 02) | **APPROVE** | Luminancia 74,5 frente a 75 de la línea base (no es una pegatina); se distinguen la figura alta y la baja; en c3/c4 la pared lleva la foto raspada y no se duplica el raspado procedural. Se corrige además un fallo real: la caché de la capa del cuarto imponía la foto de la primera visita a todas las fases (ahora `variant` por fase). P3: a ~35x46 px los rostros no son legibles en ninguna variante; el detalle lo da el close-up. |
| C. Mapa de Whitechapel (04) | **REJECT, se mantiene el mapa actual** | La cartela dice «1890» (la escena es 1888), lista seis asesinatos con fechas y orden erróneos (p. ej. Hanbury Street como «primer asesinato, 31 Aug 1888») y adelanta spoilers en un cuarto de capítulo 1; reconstruirlo exigiría borrar las anotaciones rojas incrustadas en la imagen. No hay mejora indiscutible y coherente con el canon. |
| D. Overlays de raspado (06 y 08) | **REJECT, no usados** | Medido: halos cromáticos rojos y amarillos en el borde; la cobertura alfa es de 18,2 % (06) y 14,1 % (08) de la imagen con cajas que abarcan casi todo el lienzo (x 82-1369, y 0-1069 y x 16-1353, y 0-1084), no la cara del mayor, y no están alineados con 01. La foto 02 ya trae el daño integrado. |

Variantes de pared: se evaluaron 03, 05 y 07 dentro del motor (`comparison/cmp_variants_wall.png`) y se eligió la 05; 03 y 07 se descartaron y no se versionan.

## Regeneración P2-A (reproducible desde checkout limpio, sin 03/07)

Comando (rutas relativas a la raíz del repo, sin rutas personales):

- `python web/art_review/room_photo_map/2d_integration/scripts/make_wall_photo.py`
- `python web/art_review/room_photo_map/2d_integration/scripts/compare_wall_finals.py`

Dependencias: Python 3 + Pillow + numpy (verificado con Pillow 12.3.0,
numpy 2.5.3). Entradas obligatorias (versionadas en `source/`): `05_…` y
`02_…`; `01_…` nunca es obligatoria aquí (solo close-up). Extras
estrictamente opcionales: `03_…`/`07_…` se generan si aparecen y se avisa
`skip optional extra` si no; los finales no los necesitan. Geometría,
tonalidad, alineación (ZNCC), marcos y filtros intactos; los finales salen
como CANDIDATOS a `work/candidates/` y el script jamás escribe
`web/assets/props/`.

Medida P2-A (17-oct-2026, sin 03/07 en disco): exit 0, registro
`02->05 (30,4,0.7157)`, medias finales 74,5/74,5; `compare_wall_finals.py`
**MATCH**, exit 0: ambos finales 70x92 RGBA con alfa efectivo, diff medio
0,0000/255 y máx. 0/255 contra `room_photo.png`/`room_photo_torn.png`
(idénticos al byte) más hoja visual lado a lado en `work/candidates/`.
Producción sin tocar: si difirieran, se informa y NO se publica.

## Auditoría independiente P2-A/P2-B — ChatGPT + Muse Spark 1.3 Contributor (17-oct-2026)

Muse Code 1.4.10 implementó los cambios con `--model muse-spark-1.3 --contributor-mode on`; ChatGPT inspeccionó diffs, reprodujo el generador y ejecutó las pruebas mediante Desktop Commander Remote.

- **P2-A:** `python web/art_review/room_photo_map/2d_integration/scripts/make_wall_photo.py` = exit 0 sin originales 03/07; `compare_wall_finals.py` = MATCH, exit 0. Ambos finales 70×92 RGBA y diferencia máxima 0/255 con los PNG de producción. Arte de producción no modificado.
- **P2-B:** `node web/tools/browser-check.mjs` = exit 0 (244,66 s), secuencia c1→c3a→c3b→c1 con la misma instancia del motor; caché por variante; 21 celdas visualmente distintas en la región de la foto y 0 entre c3a/c3b; guardado/reanudación, fallo deliberado de carga del PNG raspado y recuperación tras desbloquear la carga; sin errores JS.
- **Suite independiente final:** `node web/tools/test-all.mjs` = **45 PASS, 0 FAIL, 0 SKIP**, exit 0, 443,23 s (etapa browser 234,6 s). `node web/tools/unit.mjs`: 182 bien, 0 mal. `git diff --check` sin errores.
- **Chrome:** se corrigió la limpieza del árbol y de procesos huérfanos por identificador del perfil temporal. Después de `test-all`, **0** procesos Chrome con perfil `elh-bc-*`, frente a 16 procesos Chrome normales preexistentes; consumo de RAM observado 68,2 %.
- **Inspección visual:** capturas nuevas de motor a 640×360 (pared c1/c3, close-up c1/c3, farol dentro y fuera de las figuras), inspeccionadas por ChatGPT; no se observaron desplazamientos ni halos. Las capturas quedaron temporalmente fuera de Git en `%TEMP%\huesped-photo-audit\`.
- **P3 físico (revisión inicial):** `adb devices -l` sin dispositivos autorizados. **ANDROID_PHYSICAL_NOT_TESTED**; requiere validación manual en dispositivo Android físico. No equivale a PASS de Android.
- **Actualización por ChatGPT/RDC (revisión posterior):** ADB detecta un Motorola `moto g86 power 5G` por Wi-Fi (dos entradas para el mismo equipo). La app `com.gabsvm.elhuesped` instalada declara `versionName=1.0-rc32`, consistente con `web/dist/ElHuesped-1.0-rc32.apk`. No se manipuló el teléfono ni se instaló una APK porque tenía otra aplicación en primer plano. Estado **ANDROID_PHYSICAL_NOT_TESTED**, ahora por falta de QA interactivo, no por falta de conexión.
- **Revalidación independiente posterior (ChatGPT/RDC):** suite `node web/tools/test-all.mjs` completada otra vez: **45 PASS, 0 FAIL, 0 SKIP**, exit 0, 443,76 s; etapa browser 234,1 s. Tras la suite, 0 procesos Chrome con perfil `elh-bc-*` (16 procesos Chrome sin ese perfil), RAM medida 66,7 %. La regeneración y comparación P2-A desde worktree temporal creado desde HEAD más los scripts corregidos finalizó con exit 0 y diferencia de píxeles máxima 0/255; el worktree temporal fue retirado.

### Huellas SHA-256 de los ocho originales del paquete (sin modificar)

| Archivo | SHA-256 | Estado |
|---|---|---|
| `01_foto_limpia_thomas_nat.png` | `716c1979540d7d58d4e965708dce70851bc08115de95a416b5320b910fb2f671` | usado (close-up c1) |
| `02_foto_raspada_thomas_nat.png` | `773452823a62be2c575f0d0d444dc42d5266bba816e562a3b436702913ec511f` | usado (close-up c3/c4 y sprite raspado) |
| `03_sprite_pared_foto.png` | `288e355c86c2d8279fc3ad8a957875e8c215851d5fce57b4942bae0ed92482a5` | descartado (no versionado) |
| `04_mapa_whitechapel.png` | `c44e785374a60a65d7cb13686d14d080d965c458c9bbee7a1deb61b0531b46ec` | descartado (no integrado) |
| `05_sprite_pared_foto_alto_contraste.png` | `d505496f7cbc737db5ba5397ed53985dce6ec97fdd379f8a7b4fd572e2c8333d` | usado (sprite de pared) |
| `06_overlay_raspado_transparente.png` | `2a0c8cf59b4cefc3090f0d2dc23ac891b247dc725d3ef125c46429862d049505` | descartado (no versionado) |
| `07_sprite_pared_foto_pixel_safe.png` | `1e8e732ae24c3d0a30715ca2f475fd115d1e58291c0cc6aa261b2ed36e038464` | descartado (no versionado) |
| `08_overlay_raspado_localizado.png` | `e5f7406e13ac0dc0c2fc8b48f40e0133ddc6e92c0708d9f9c7ce8d3aff226e5f` | descartado (no versionado) |
