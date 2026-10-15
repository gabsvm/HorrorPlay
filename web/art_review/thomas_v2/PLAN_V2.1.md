# PLAN V2.1 — Thomas Ashgrove legible + fuente única (sin integración)

Base: HEAD `c5f271d` (rama `reboot/web-el-huesped`). Todo lo nuevo vive en
`web/art_review/thomas_v2/`. No se toca producción, motor, APK ni guardados.
Criterio de salida: veredicto honesto + `IN_ENGINE_NOT_TESTED` si el navegador falla.

## Paso 1 — Base y aislamiento
`git status` limpio salvo el benchmark; registrar HEAD; nada fuera de `thomas_v2/`.

## Paso 2 — V2.1 legibilidad (edits aplicados AL .blend, no al script)
Script `scripts/apply_v21_to_blend.py` (Blender batch sobre el master): ojos más
oscuros con punto de luz sobrio, cejas y línea de boca con más contraste, manos más
grandes con pulgar y puño claro, hombros y banda de bajo marcadas, botones de latón
más grandes, inclinación leve. Sin caricatura ni cambio de canon. Guarda revisión del
master. Verificación: renders de estudio frente/3-4/perfil revisados a píxel.

## Paso 3 — Fuente única .blend → atlas
Nuevo `scripts/render_from_blend.py`: carga `source/Thomas_Ashgrove_V2.blend` (sin
`read_factory_settings`), vincula el rig por nombre, reutiliza `pose()`/`build_coat()`
y renderiza los 122 frames con la misma cámara ortográfica. Prueba de ida y vuelta:
un edit visible en el `.blend` debe aparecer en un atlas reconstruido (diff de frame).
`render_candidate.py` queda congelado como legado documentado. Verificación: atlas
V2.1 byte-distinto donde toca, idéntico donde no; `model.json` con mismo contrato.

## Paso 4 — Capturas en motor real (o NOT_TESTED)
Intentar harness temporal: servidor estático + navegador headless, mismos
frames/escenas V1 frente a V2.1 a 640×360 y 1280×720. Si no hay navegador
automatizable, entregar assets como `IN_ENGINE_NOT_TESTED`, sin mockups en la
comparación principal. Verificación: screenshots reales o etiqueta honesta.

## Paso 5 — Láminas 09/10 + movimiento
`09_ingame_640_antes_despues.png`, `10_ingame_1280_antes_despues.png` y GIF/vídeo de
caminata y charla; pruebas de rodillas, botas y manos con luz variable.

## Paso 6 — Perfil y validación estricta
Memoria decodificada real + peso PNG; ampliar `verify_candidate.py`/`verify_blend.py`
con aserciones (orto, colecciones, rig, continuidad) y reimportar el GLB en escena
temporal. Sin tocar gameplay ni guardados. Verificación: PASS/FAIL explícitos.

## Paso 7 — Limpieza Git y documentos
`git rm -r --cached web/art_review/thomas_v2/working/` (conservar en local),
`.gitignore` local con `working/`, commit de limpieza normal, push. Actualizar
README/MANIFEST/REPORT con tabla TESTED/PARTIAL/NOT_TESTED. Verificación: el remoto
no contiene `working/` y el árbol local sigue completo.

## Paso 8 — Entrega sin integración
Respuesta final ordenada según benchmark; esperar aprobación visual explícita antes de
que Claude integre nada.
