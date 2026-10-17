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
