# Scenario Labs 3D Collection → El Huésped

Fuente: https://huggingface.co/datasets/scenario-labs/3d-collection
Licencia declarada del dataset: Creative Commons Attribution 4.0 (CC BY 4.0). Se añadió atribución en los créditos del juego.

## Assets integrados como sprites prerenderizados

| Sprite | Identificador de Scenario | Escena | Dimensiones PNG | Función |
| --- | --- | --- | --- | --- |
| scenario_lantern | fKt7GfxXBazxCJDuukgANgja | Callejones, x900 | 38×72 | Decoración bajo farolas |
| scenario_key | MUU29AV1YPaK1A2i5KDPgHcW | Estudio Greaves, x790 | 92×19 | Decoración del escritorio |
| scenario_cage | exfG8ymTBAYY5NR3q3n2AQBM | Salón Wexley, x520 | 61×112 | Jaula ornamentada |
| scenario_gargoyle | AeppvCPdcSpBz3DYzxrv3GaU | Callejones, x2830 | 74×82 | Ornamentación de fachada |

Cada GLB se descargó individualmente a un directorio temporal de Windows, verificó como glTF binario v2 y se renderizó con **Blender 5.2.2 LTS**. Se optimizaron con Pillow a PNG RGBA comprimido y se registraron los anclajes en `web/assets/props/index.json`. No se distribuyen GLB originales.

Tamaños finales de las cuatro imágenes PNG: **6870, 3475, 15554 y 12848 bytes**, aproximadamente 38,7 KB en total. Los GLB originales suman ~193 MB; no forman parte del HTML/APK.

## Integración

Las escenas añaden referencias decorativas con `drawProp`. Los sprites faltantes no rompen la pintura del nivel. No se agregaron hotspots, pistas ni mecánicas. Por diseño, la llave es un objeto ambiental y no una llave que pueda recogerse.

El código reproductible queda en:
- `web/tools/scenario3d/build.py`: descargas, verificación estructural, optimización PNG e instalación que rehúsa sobrescribir props ya existentes.
- `web/tools/scenario3d/render_glb.py`: importación y renderización de GLB en Blender.
- `web/tools/scenario3d/manifest.json`: procedencia, licencia, objetivos de tamaño y ubicación.

Para hacer una **nueva prueba sin modificar el juego**, volver a ejecutar `build.py --blender "RUTA_REAL_A_BLENDER.exe"` sin `--install`. La instalación original ya fue realizada, y posteriores modificaciones se deben revisar en una rama/commit antes de reemplazar los PNG.

## Verificaciones efectuadas
- Blender 5.2.2 importó y renderizó exitosamente los cuatro GLB sin errores; geometría 38.155 / 332.100 / 2.801.544 / 1.482.036 triángulos respectivamente.
- Prueba en navegador Chromium/Edge real: las escenas `alleys`, `greaves` y `seance` cargaron, y `hasProp(name)` devolvió `true` para los cuatro nombres.
- Capturas reales a 640×360 en `web/art_review/scenario3d/Scene3D_QA_640.jpg`; farol, gárgola y jaula visibles; llave más discreta, ambientación sin interacción.
- El empaquetador `web/tools/build-artifact.py --apk` generó un HTML autocontenido de prueba que contiene las cuatro imágenes. **La prueba utilizó JS mínimo** y no constituye una APK compilada.
- Prueba física Android: **pendiente**. No considerar validada la performance móvil hasta realizarla.

## Procedencia y atribución
Modelos por Scenario Labs, dataset «3d-collection», bajo CC BY 4.0. Adaptación de materiales y conversión a sprites por HorrorPlay. Identificadores exactos en la tabla anterior y enlace a la colección al principio del archivo.

No introducir estos sprites como objetos coleccionables o pistas sin revisar antes el diseño narrativo y los hotspots.

## 24 Oct 2026 — Reemplazo del barril procedural
- **Origen:** Scenario Labs `32YByDGjPViGn8xZj9ZxFNMP`, CC BY 4.0, prompt «A large wooden barrel reinforced with dark metal bands…». GLB SHA-256: `de71bfc71de0f92af7196edb72805abf3170b5149e1bcf14753dbe27acb8a2d8`.
- Importado con Blender 5.2.2: **87.596 triángulos**, original **9,3 MiB**; se distribuye exclusivamente como PNG RGBA **60 × 64 px**, unos **9 KB**.
- En `web/src/scenes/alleys.js`, las apariciones procedurales `A.barrel` usan ahora `drawProp('scenario_barrel')` conservando el área original (40×46 escalada por `s`) y la misma secuencia de RNG. Si el sprite no carga, vuelve a `A.barrel` automáticamente.
- **No sustituir ciegamente los otros dos usos de `A.barrel`:** en Buck's Row representa el **balde pequeño del niño**; en Hanbury Yard solo aparece como *fallback* de una **tina de lavado**. Reemplazarlos por un barril grande rompería la lógica visual.
- QA: PNG alfa válido, manifiesto, dimensiones, `node --check`, HTML autocontenido `--apk` y capturas de escenario a 640×360. Pruebas en Android físico todavía pendientes.
