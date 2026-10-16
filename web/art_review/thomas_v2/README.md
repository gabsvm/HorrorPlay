# Thomas Ashgrove V2 — benchmark de arte (NO integrado)

Versión visual candidata del protagonista adulto, construida y renderizada con Blender
5.2.2 a partir de una copia privada del pipeline (`figure.py` HEAD `ffe46380`).
**Nada de esta carpeta afecta al juego, a la APK ni a `web/assets/models/thomas/`.**
Estado: `CANDIDATE_READY_FOR_REVIEW` (ver REPORT). No hacer commit/push sin orden.

## Inspeccionar (teléfono primero)

1. `comparison/08_galeria_general.png` — resumen en retrato.
2. `comparison/09_ingame_640_antes_despues.png` — lectura a tamaño real con píxeles
   del motor (Edge + `actor.js`; escena simulada, E-real). El mockup PIL es
   `comparison/03_gameplay_640x360_antes_despues.png`.
3. `comparison/05_animacion_contact_sheet.png` — 6 acciones, mismo instante (A frente a C).
4. `comparison/preview_walk_v21.gif` y `comparison/preview_talk_v21.gif` — ciclos
   del motor (caminata y charla, 8 frames cada uno).
5. `comparison/11_ingame_detalle_motor.png` — rodillas, botas, manos y rostro x4.
6. Resto de `comparison/01–07,10` para silueta, pixelado nearest, detalle master y topología.

## Contenido

- `source/Thomas_Ashgrove_V2.blend` — master editable (colecciones BODY, CLOTHING,
  ACCESSORIES, RIG, LIGHTS, CAMERAS; cámara orto `cam` idéntica a exportación; 4
  cámaras de estudio; rig de 21 empties; notas en el bloque `THOMAS_V2_NOTES`).
- `source/thomas_v2.glb` — exportación GLB; el informe V2.1 documenta su reimportación en Blender 5.2.
- `exports/game_candidate/` — V2.0 en formato motor (congelado como referencia).
- `exports/game_candidate_v21/` — V2.1 en formato motor, renderizado DESDE el
  `.blend` (fuente única): `albedo.png`, `normal.png`, `model.json`.
- `exports/sample_frames/` — un frame crudo por animación (19 PNG).
- `scripts/` — `render_from_blend.py` (pipeline vigente),
  `render_candidate.py` (legado congelado), `apply_v21_to_blend.py`,
  `pack_candidate.py`, `verify_candidate.py`, `build_master.py`,
  `render_studio.py`, `verify_blend.py`, `export_check_glb.py` (+ utilidades).
- `working/` — SOLO LOCAL (no versionado): intermedios regenerables. El arnés
  **versionable y reproducible** está en `scripts/ingame_ab.mjs`.
- `MANIFEST.json` — checksums SHA-256 y tamaños de la entrega (sin `working/`).
- `PLAN_V2.1.md` — plan de esta iteración.

## Reproducir el arte (todo aislado, sin tocar producción)

**Requiere Blender 5.2** para abrir el master. Se probó este pipeline en Blender
5.2 por Muse; **Blender 4.2 no puede leer este archivo**. La versión 4.2 de la
PC conectada de Chat On Steroids no se usó para guardar ni convertir el master.

El master distribuido **ya contiene V2.1**. NO vuelvas a aplicar la pasada
estética antes de cada render: `apply_v21_to_blend.py` se usa exclusivamente
al actualizar un master V2.0. Ahora lleva protección idempotente y un test de
lógica; no convierte automáticamente archivos entre versiones de Blender.

```powershell
$bl = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
& $bl -b web/art_review/thomas_v2/source/Thomas_Ashgrove_V2.blend -P web/art_review/thomas_v2/scripts/render_from_blend.py -- web/art_review/thomas_v2/working/v21_raw
python web/art_review/thomas_v2/scripts/pack_candidate.py web/art_review/thomas_v2/working/v21_raw web/art_review/thomas_v2/exports/game_candidate_v21
python web/art_review/thomas_v2/scripts/verify_candidate.py web/art_review/thomas_v2/exports/game_candidate_v21
& $bl -b web/art_review/thomas_v2/source/Thomas_Ashgrove_V2.blend -P web/art_review/thomas_v2/scripts/verify_blend.py
python web/art_review/thomas_v2/scripts/test_apply_v21.py
```

La apariencia (mallas, colores, proporciones) se edita en el `.blend`; los
movimientos se calculan en `render_from_blend.py` y la geometría de la falda
del abrigo se reposiciona proceduralmente en `build_coat()`. Por tanto,
**no edites a mano la topología del abrigo esperando que cada vértice permanezca
fijo durante la exportación animada**. Es un pipeline **híbrido Blender + Python**,
no un archivo con acciones de Armature ni un rig con keyframes editable al 100%.

## Comparación A/B en la escena real

Sin Blender, con Node 24 y Edge/Chrome:

```powershell
node web/art_review/thomas_v2/scripts/ingame_ab.mjs
python web/art_review/thomas_v2/scripts/make_ab_board.py
```

Se crean `comparison/ab_bucks_row/AB_BuckRow_640.png`,
`AB_BuckRow_1280.png`, `AB_BuckRow_closeup_x4.png`,
`AB_BuckRow_actions.png`, diez capturas originales (reposo a dos tamaños +
caminar, hablar y retroceder a 640×360 para ambas variantes) y
`capture_log.json`. Se carga el **Buck's Row verdadero**, con
`actor.js`, `model.js`, `renderer.js` y luz real; un override
`window.__MODELS` introducido antes de navegar en la pestaña de QA cambia
solamente las texturas de Thomas. El juego activo, sus guardados y la APK
permanecen intactos. No es una partida completa ni una prueba Android.

El navegador usa un perfil temporal separado; se cierra exclusivamente el
proceso iniciado por el arnés, no todas las ventanas de Chrome/Edge.
El resultado, la diferencia visual y las limitaciones se documentan en
`AB_REPORT.md`. La prueba A/B incluye escenas con lluvia animada, por lo que
el fondo no es idéntico píxel por píxel entre capturas.
Los estados de caminar, hablar y retroceder se activan usando la API del actor
en el arnés de QA: **no** son una conversación ni un recorrido narrativo.

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
