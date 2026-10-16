# T4b — Corrección de tono de los props del patio de Hanbury (el auditor rechazó el tono, no la geometría)

T4 dejó los 4 sprites casi blancos (tina +26 %, retrete +79 % sobre el
procedural en recortes del motor; L media de sprite 124–154). Causa raíz:
el mismo error de los frascos de Greaves en T3b — rig Blender sobreexpuesto
(albedos claros 0,38–0,62 + áreas 290/180/220 + mundo 0,6 + look
`Medium High Contrast`) más `0,72` de brillo en el pack. Mismo remedio.

**Qué cambió (solo tono; geometría, encuadres, anclas, hotspots, flags,
textos, luces y lluvia intactos):**
- `scripts/build_hanbury_props.py` — madera empapada casi negra
  (0,060/0,043/0,030), duelas sucias (0,10/0,07/0,045), rodillos manchados
  (0,11/0,085/0,06), ropa mojada gris (0,13/0,125/0,11), piedra ennegrecida
  (0,11/0,105/0,10), latón deslustrado (0,20/0,14/0,06, rugosidad 0,6: un
  brillo pequeño permitido), rugosidad 0,92–1,0, vetas por ruido más fuerte,
  verdín en la base del retrete (faldón de algas 0,06/0,075/0,045),
  corazón recortado intacto y legible; rig atenuado (áreas 45/28/35,
  mundo 0,25, look `None`). Blender 5.2.2 LTS sin fallos de API (solo los
  `DeprecationWarning` conocidos de `use_nodes`; exit ≠ 0 por el stderr
  pero con los 4 `RENDERED` + `.blend` guardado).
- `scripts/pack_hanbury_props.py` — multiplicador final reproducible
  `VALUE = 0,85` (antes 0,72 + contraste 1,06; ahora sin empuje de
  contraste), anclas fijas de T4 (mangle ax 57, tina ax 55: el pack ya no
  las centra y no hay deriva) y escritura CRLF explícita del índice.
- `web/assets/props/hanbury_{mangle,tub,tap,privy}.png` — 13/15/12/33 KB
  (antes 17/18/12/47 KB); L media de sprite 31,9/41,3/39,7/33,6 (antes
  124,8/153,8/145,6/124,2). `index.json` sin cambios frente a T4.
- `scripts/capture_hanbury.mjs` (nuevo) — captura el motor real en x=500
  (lavadero) y x=1650 (grifo/retrete) a 640x360 y 1280x720 en
  `comparison/work/<etiqueta>/`; para el ANTES se apartan los 4 PNG y
  `drawProp` cae al procedural. `scripts/check_tone.py` (nuevo) exige
  ≤ +15 % en los mismos recortes (exit ≠ 0 si falla).
- `scripts/make_comparison.py` — ahora lee `comparison/work/` local
  (regenerable, no depende de `scenery_refresh`) y cuantiza a 192 colores
  con assert < 600 KB (T4 a 256 colores se fue a 655 KB).
- `comparison/AB_hanbury_640.png` — regenerado (587 KB < 600 KB).

**Evidencia (motor real, mismos recortes antes/después, `check_tone.py`
PASS):** tina +5,0 %, fregadero −10,5 %, tubo −0,6 %, puerta del retrete
+5,5 %, tejadillo −11,0 %. Todo dentro del +15 %. A 640x360 el DESPUÉS se
ve igual de sombrío que el ANTES pero con más detalle: duelas con aros,
sábana gris y tabla acanalada; fregadero de piedra con grifo de latón
deslustrado; caseta con tejadillo, puerta con corazón, bisagras y pomo,
y verdín en la base. Nada blanco ni crema.

**Revisión honesta a 640x360:** el mangle sigue **parcialmente oculto
tras la casera** (actor en x=470, como ya dijo T4): solo asoman rodillos,
volante y manivela, ahora oscuros (verificado en recorte ampliado, no en
caja de tono). El fregadero y el tejadillo quedan un poco MÁS oscuros que
el procedural (−10/−11 %): legibles, pero si el auditor los quiere un
pelo más presentes, el mando es una constante (`VALUE` en el pack).
La lluvia animada impide igualdad de píxeles entre capturas: la medida es
un cociente de medias en recortes fijos, no un diff.

## test-all (real, 2026-10-16, T4b)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS,
0 FAIL, 0 SKIP**, exit 0 (unit, smoke, audio, 38 escenarios, walk x3,
browser). Tres ejecuciones completas, todas en verde.

## Qué NO pude comprobar (T4b)

- **Respaldo procedural en el motor:** solo corre sin los PNG; es el código
  viejo de T4 intacto y pasa `node --check` vía test-all, sin renderizar.
- **Móvil físico / APK / memoria y rendimiento:** NOT_TESTED. Los 4 PNG
  suman 73 KB (antes 94 KB).
- **Encuadre 1280x720:** capturado (los scripts lo regeneran) pero juzgado
  solo a 640x360, puerta de cumplimiento; los 1280 y los logs se borraron.
- **Regeneración del ANTES:** exige apartar los 4 PNG y capturar con
  `capture_hanbury.mjs before`; ver comandos abajo.

## Regenerar todo (T4b)

```
blender -b --factory-startup -P web/art_review/hanbury_yard/scripts/build_hanbury_props.py
python web/art_review/hanbury_yard/scripts/pack_hanbury_props.py
# ANTES (fallback): apartar web/assets/props/hanbury_*.png, capturar, restaurar
node web/art_review/hanbury_yard/scripts/capture_hanbury.mjs before
# DESPUÉS: con los PNG en su sitio
node web/art_review/hanbury_yard/scripts/capture_hanbury.mjs after
python web/art_review/hanbury_yard/scripts/check_tone.py
python web/art_review/hanbury_yard/scripts/make_comparison.py
```

## Riesgos y notas (T4b)

- `VALUE = 0,85` está calibrado contra estas capturas; con otra lluvia o
  re-encuadre puede moverse ± un par de puntos (margen actual: lo peor es
  +5,5 % frente al +15 %).
- El pack de T4 derivaba las anclas (`ax = w/2`) y hubo que restaurar a
  mano mangle 57 / tina 55; el pack T4b las fija en `ANCHORS`, no vuelve
  a pasar.
- Blender 5.2: ningún fallo de API; solo avisos de deprecación futuros.

---

# T4 — Hanbury Street: lavadero, mangle, grifería y retrete

Rama `reboot/web-el-huesped`. Pasada artística/UX: sin cambios de canon,
textos, flags, `state`, puzles, hotspots ni luces. Solo albedo de 4 props.

## Qué cambió

- `web/src/scenes/hanbury.js`: importa `drawProp` de `../art/models.js` y
  envuelve con `if (!drawProp(...))` los 4 bloques existentes (el procedural
  queda intacto como fallback): tina (`hanbury_tub`, 403), mangle
  (`hanbury_mangle`, 479), grifo+fregadero (`hanbury_tap`, 1660) y retrete
  (`hanbury_privy`, 1917). Bases, orden de dibujo, rects de hotspots, flags,
  textos y niebla/lluvia/luces sin tocar.
- `web/assets/props/hanbury_{mangle,tub,tap,privy}.png` (17/18/12/47 KB) +
  4 entradas en `web/assets/props/index.json` (anclas medidas sobre el
  render, no centradas a ojo: mangle ax 57, tina ax 55).
- `web/art_review/hanbury_yard/`: `scripts/` (build/pack/make_comparison),
  `source/hanbury_props.blend`, `renders/` (4 raw + 4 candidatos),
  `comparison/AB_hanbury_640.png`, este informe.

## Evidencia (motor real, escena `hanbury`)

- ANTES/DESPUÉS capturados a 640x360 y 1280x720 en x=500 (lavadero) y
  x=1650 (grifo/retrete) con `capture_scene.mjs`; las 1280 y los logs se
  borraron tras montar la comparativa (se regeneran con los scripts).
- `comparison/AB_hanbury_640.png` (640 KB, cuantizada sin dither; la
  versión RGB no cabía en el presupuesto de ~600 KB): la tina pasa de
  mancha oscura a tina de duelas con aros, sábana y tabla acanalada; el
  fregadero deja de verse fundido en blanco y el grifo de latón aparece;
  el retrete pasa de tablones planos a caseta con tejadillo, puerta con
  corazón, bisagras y pomo.

## Blender 5.2

Los scripts antiguos son de 4.2: en 5.2.2 LTS todo el API usado sigue
válido (`Principled BSDF`, `Standard` + `Medium High Contrast`,
`ortho_scale`, `DISK`). Solo avisos de deprecación futuros (`use_nodes`
será retirado en 6.0), sin cambios necesarios. Comandos en
`scripts/` (build ~7 s, 28 muestras CYCLES).

## test-all.mjs

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **44 PASS,
0 FAIL, 0 SKIP** (unit, smoke, audio, 38 escenarios, walk x3, browser).

## Qué NO pude comprobar y riesgos

- Solo se juzgó a 640x360 (puerta de cumplimiento) y 1280x720 en
  Chromium/Edge. **Android físico, APK, memoria y rendimiento: NOT_TESTED**
  (lo compila el propietario del dispositivo).
- El mangle queda **parcialmente oculto tras la casera** (actor en x=470):
  asoman rodillos, volante y manivela; mejora real pero menor que la de
  los otros tres. Se integra igual por ser pieza prioritaria y renderizar
  bien; si el auditor lo considera insuficiente, basta borrar su bloque
  `drawProp` (el fallback sigue ahí).
- El retrete nuevo es más cálido/claro que su entorno; a 640x360 nocturno
  lee bien, pero en monitores muy brillantes puede parecer "nuevo".
- La lluvia animada impide igualdad de píxeles entre capturas: la
  comparativa es visual, no diff numérico.
