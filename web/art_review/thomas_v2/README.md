# Thomas Ashgrove V2 — benchmark de arte (NO integrado)

Versión visual candidata del protagonista adulto, construida y renderizada con Blender
5.2.2 a partir de una copia privada del pipeline (`figure.py` HEAD `ffe46380`).
**Nada de esta carpeta afecta al juego, a la APK ni a `web/assets/models/thomas/`.**
Estado: `CANDIDATE_READY_FOR_REVIEW` (ver REPORT). No hacer commit/push sin orden.

## Inspeccionar (teléfono primero)

1. `comparison/08_galeria_general.png` — resumen en retrato.
2. `comparison/03_gameplay_640x360_antes_despues.png` — lectura a tamaño real (E mockup).
3. `comparison/05_animacion_contact_sheet.png` — 6 acciones, mismo instante (A frente a C).
4. `comparison/preview_idle_walk.gif` — ciclos idle/walk.
5. Resto de `comparison/01–07` para silueta, pixelado nearest, detalle master y topología.

## Contenido

- `source/Thomas_Ashgrove_V2.blend` — master editable (colecciones BODY, CLOTHING,
  ACCESSORIES, RIG, LIGHTS, CAMERAS; cámara orto `cam` idéntica a exportación; 4
  cámaras de estudio; rig de 21 empties; notas en el bloque `THOMAS_V2_NOTES`).
- `source/thomas_v2.glb` — exportación GLB (mallas/materiales; reimportación NOT_TESTED).
- `exports/game_candidate/` — `albedo.png`, `normal.png`, `model.json` en formato motor.
- `exports/sample_frames/` — un frame crudo por animación (19 PNG).
- `scripts/` — `render_candidate.py`, `pack_candidate.py`, `verify_candidate.py`,
  `build_master.py`, `render_studio.py`, `verify_blend.py` (+ utilidades de cámara).
- `working/` — intermedios regenerables (17,6 MB): raw V2, baseline regenerado completo,
  frames y studios. No versionar sin criterio; se regeneran con los comandos de abajo.
- `MANIFEST.json` — checksums SHA-256 y tamaños de la entrega.

## Reproducir (todo aislado, sin tocar producción)

```powershell
$bl = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
& $bl -b --factory-startup -P web/art_review/thomas_v2/scripts/render_candidate.py -- web/art_review/thomas_v2/working/v2_raw
python web/art_review/thomas_v2/scripts/pack_candidate.py web/art_review/thomas_v2/working/v2_raw
python web/art_review/thomas_v2/scripts/verify_candidate.py
& $bl -b web/art_review/thomas_v2/source/Thomas_Ashgrove_V2.blend -P web/art_review/thomas_v2/scripts/verify_blend.py
```

## Integración diferida — SOLO para Claude, SOLO tras aprobación del propietario

1. Verificar compatibilidad del `model.json` candidato contra
   `web/assets/models/thomas/model.json` y revisar el atlas de normales (canal B =
   vidrio del farol; `ns=0.5`; caja 144×242 frente a 134×236 con 2 px más de suela).
2. Crear una prueba visual con interruptor temporal V1/V2 o rama de integración
   separada (sin modificar el save), con imágenes a 640×360 y en Android.
3. Solo tras aprobar esa comparación: copiar los 3 ficheros del candidato a los
   assets activos, actualizar recursos empaquetados y ejecutar los tests más una
   partida de regresión.
4. Conservar el baseline original para reversión.

Muse no ejecuta estos pasos, no modifica el personaje activo ni publica builds.
