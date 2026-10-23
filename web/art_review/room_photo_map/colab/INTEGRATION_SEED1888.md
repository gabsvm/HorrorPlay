# HorrorPlay / El Huésped — integración Colab seed 1888

Fecha: 2026-10-23 · rama: `reboot/web-el-huesped`.

## Cambios de producción
- `web/assets/closeups/room_photo.jpg` ← `room_photo_candidate_1888.jpg` del segundo ZIP generado con Colab y su máscara corregida.
- `web/assets/closeups/room_photo_torn.jpg` ← `room_photo_torn_candidate_1888.jpg` del mismo ZIP.
- Se optimizaron los JPEG progresivos (calidad 85, subsampling 4:2:0) manteniendo 1280×720; tamaños finales 84.625 y 99.889 bytes respectivamente.
- SHA-256 intacta: `7ef862209b58f3d335bef3d806adb929b35b7bb4d950135eedef3c0d80373d0f`.
- SHA-256 raspada: `bf74615f822619445dead8928fb7b7914f0c4ef5ac904ac5f8e45884f9d41adc`.
- Se conservan respaldos locales de los JPG y PNG previos fuera del repo en `C:\Dev\HorrorPlay_seed1888_backup_20261023`.
- Ningún archivo de lógica, diálogo, hotspots ni guion fue modificado. Los sprites de pared `room_photo.png` y `room_photo_torn.png` se mantienen por ahora sin modificación: tienen sus propias anclas de overlay y requieren una prueba específica de coherencia.

## Verificación
- ZIP transferido desde la cuenta de Drive al dispositivo autorizado mediante Desktop Commander. SHA-256 del ZIP `8c22cb80083724fae4ed71515d601de871488349481bcb77fc83926e61ff3720` confirmado.
- Capturas del juego REAL hechas con `node web/art_review/room_photo_map/v2/scripts/capture_v2.mjs after_colab1888`, en Chromium/Edge headless: pared e inspección, capítulos 1 y 3, a 640×360 y 1280×720. Ocho PNG y registro local bajo `C:\Dev\HorrorPlay_seed1888_QA`.
- Evidencia visual que sí se versiona: `comparison/SEED1888_INGAME_640.png`, cuatro capturas auténticas a 640×360. La raspadura queda sobre el mayor y Nat conserva el rostro.
- `node web/tools/test-all.mjs`: **44 PASS** (unit, smoke, audio, escenarios y los tres recorridos completos). El último `browser-check.mjs` ejecutó y aprobó los casos específicos de foto/mapa, pero se bloqueó posteriormente y fue interrumpido. **El comando global terminó con exit 1; NO afirmar 45/45 PASS.**
- Android físico, APK y memoria/rendimiento móvil: **NO PROBADOS**. No sustituir pruebas en dispositivo con captura de Chromium.

## Próximo trabajo visual propuesto
1. **Consistencia de sprite de pared con el close-up nuevo:** comparar el par 110×84 del muro (intacto/raspado) con la nueva foto antes de cambiarlo; preservar overlay y anclas de capítulo 3.
2. **`web/assets/closeups/hands.jpg`:** evaluar mejora de anatomía de manos y material de guantes en la visión, sin mover el bisturí ni pistas visuales; candidata para inpainting acotado en Colab.
3. **Close-ups de Nichols, Chapman y Eddowes:** priorizar sólo los que tengan defectos concretos tras captura real; no cambiar la composición ni la posición de los hotspots forenses.
4. **Documentos/fotografías narrativos restantes:** IA para motivos y materiales; tipografía, pistas escritas, mapas y textos generados mediante composición controlada, no diffusion.
5. **Escenarios:** evitar sustituir los fondos con un JPG estático: preservar farolas, reflejos, niebla, parallax, hotspots y rendimiento móvil.

Este registro documenta la integración; no sustituye una aprobación visual en el teléfono.
