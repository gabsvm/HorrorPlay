# HorrorPlay / Colab — V2 y assets integrados

Fecha: 2026-10-23 · Rama: `reboot/web-el-huesped`.

## Integrado en producción del juego
- `web/assets/props/room_photo.png` y `room_photo_torn.png`: interior de la fotografía sincronizado con la seed 1888 mediante la mezcla 85 del notebook 01; preservación de **TODOS** los valores alfa del PNG anterior y del RGB fuera del interior `(8,7)-(62,73)`. Los JPG de inspección y la lógica del relato no se tocaron.
- `web/assets/documents/{carta,expediente,recorte}_paper_960x540.webp`: texturas derivadas de los PNG de Colab, 7146 B / 7794 B / 8856 B, respectivamente. Ningún mockup con texto inventado fue instalado.
- `web/styles.css`: fondos WebP con selección por tipo de documento, sin rasterizar texto.
- `web/src/engine/ui.js`: selección de tipo por el encabezado HTML; **compatible con el DOM simulado de las pruebas** mediante regex + llamada DOM opcional. No altera el texto, la navegación ni la funcionalidad `Dejar`.

## Notebooks corregidos
- **01 Foto de pared:** preserva canal alfa, marco y bordes; añade aserciones.
- **02 Manos:** la primera generación de SD1.5 fue rechazada por mancha negra. V2 ofrece ajuste conservador con CPU por defecto; ejecución IA opcional con rechazo de pérdida drástica de luminancia y límite por canal. **No se sustituyó `hands.jpg`.**
- **03/04/05 Forenses:** cambios tonales limitados a zonas de suelo/fondo; max. 14 niveles por canal, geometría y hotspots conservados. **No se sustituyeron fotografías forenses.**
- **06 Mapa:** V2 conserva íntegramente calles, marcadores y su geometría; solo ajuste de luz. Los textos sobrepuestos del original todavía requieren tipografía manual. **No se reemplazó `room_map.jpg`.**
- **07 Documentos:** exporta WebP comprimidos; mockups y texto ficticio no van al motor.

## QA verificable
- `web/art_review/colab_lab/comparison/Colab_V2_JuegoReal_640.png`: captura real de Chromium del muro capítulos I/III y de tres tipos de documento, a 640 × 360.
- En la prueba de sprites comparé los canales alfa bit por bit contra Git HEAD previo; las esquinas transparentes y todo el exterior del interior son idénticos.
- `py -3 web/art_review/colab_lab/verify_notebooks.py`: siete notebooks pasan sintaxis y vías CPU; IA no se ejecutó.
- `node web/tools/unit.mjs`: 182 PASS, 0 FAIL.
- `node web/tools/smoke.mjs`: todas las escenas comprobadas.
- Test dirigidos `android-back`, `carta`, `chapter3`, `v5`, `compat`, `hint-ui`: PASS tras reparar compatibilidad DOM.
- Los tres documentos fueron mostrados y verificados con encabezado, tipo, fondo CSS y texto intacto en Chromium real.
- **Sin prueba Android física/uso prolongado**, ni nuevos resultados en T4; no declararlos validados.

## Reversión y artefactos
- Respaldos PNG del sprite anterior: `C:\Dev\HorrorPlay_colab_v2_backup_20261023`.
- ZIP original transferido y candidato en `C:\Dev\HorrorPlay_Colab_V2_stage`. Capturas PNG completas fuera del repo en `C:\Dev\HorrorPlay_colab_v2_qa`.
- La edición se ha limitado a la rama de El Huésped; sin cambios en Unity/main ni despliegues.

## Android single-file build compatibility
- `web/tools/build-artifact.py` ahora incrusta los 3 WebP como `data:image/webp;base64` al generar el HTML autocontenido para APK/Windows.
- Comprobación real del empaquetador `--apk` con JS mínimo de prueba: **3 texturas embebidas; 0 referencias relativas a `assets/documents/`; exit 0**. Esto prueba el HTML generado, pero **no** es una compilación APK ni una prueba en teléfono.
- La primera suite `test-all --quick` detectó incompatibilidad del DOM simulado en `UI.doc`. Fue corregida (extracción regex del encabezado y DOM opcional); los escenarios dirigidos `android-back`, `carta`, `chapter3`, `v5`, `compat` y `hint-ui` pasaron después.

## Resultado final de regresión
- Segunda ejecución de `node web/tools/test-all.mjs --quick`, después de corregir `UI.doc`: **todos los checks PASS, 0 FAIL, exit code 0**, incluidos `finale14`, `sanity`, `android-back`, carta, capítulo III y compatibilidad. Duración aproximada 233 s.
- El modo `--quick` no incluye las pruebas Browser adicionales ni los tres recorridos largos. Capturas específicas de Chromium de documento y pared sí se realizaron y son la evidencia adjunta.
