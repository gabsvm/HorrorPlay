# Scenario 3D → El Huésped — integración provisional

Origen: https://huggingface.co/datasets/scenario-labs/3d-collection · licencia declarada del dataset: CC BY 4.0. Créditos añadidos a la pantalla de créditos.

## Los cuatro recursos elegidos

| Sprite | ID de Scenario | Escena |
|---|---|---|
| scenario_lantern | fKt7GfxXBazxCJDuukgANgja | Alley x565, suelo |
| scenario_key | MUU29AV1YPaK1A2i5KDPgHcW | Greaves x790, escritorio |
| scenario_cage | exfG8ymTBAYY5NR3q3n2AQBM | Wexley x125, suelo |
| scenario_gargoyle | AeppvCPdcSpBz3DYzxrv3GaU | Alley x2525, fachada |

El motor de HorrorPlay no carga GLB. Los GLB se importan con Blender para prerenderizar PNG con transparencia, se optimizan y se incluyen en web/assets/props junto a index.json. Las llamadas de escena drawProp no alteran hotspots y no hacen nada mientras no existan los PNG.

**Estado: rama de preparación, sin validar ni fusionar.** No se pudo ejecutar Blender ni capturar el juego porque el PC autorizado figura OFFLINE.

## Cuando vuelva la conexión a Windows

Desde la raíz del repo, con Blender y Python/Pillow instalados:

    git switch art/scenario3d-props-20261023
    py -3 -m pip install Pillow
    py -3 web/tools/scenario3d/build.py --blender "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe"

La ejecución por defecto descarga modelos y genera vistas de prueba **sin tocar los assets jugables**. Los archivos estarán en %TEMP%\HorrorPlay_Scenario3D\proof. Ajustar perspectiva, luz y tamaño según A/B antes de instalar.

Después de revisar y aprobar los cuatro PNG:

    py -3 web/tools/scenario3d/build.py --install --blender "RUTA_REAL_A_BLENDER.exe"

El instalador añade cuatro sprites y sus metadatos y rehúsa sobrescribir entradas existentes. Los GLB fuentes NO se embeben en la APK: tamaños aproximados de descarga 4,92 + 16,16 + 104,33 + 66,36 MiB.

## QA obligatoria antes de fusionar

1. Ejecutar node web/tools/unit.mjs, node web/tools/smoke.mjs y node web/tools/test-all.mjs --quick.
2. Capturar en Chromium a 640×360 las escenas alleys, greaves y seance; comparar visibilidad, anclajes, oclusiones, paleta y hotspots.
3. Revisar especialmente: llave decorativa no debe inducir a un puzle inexistente; gárgola no debe flotar ni sugerir un edificio gótico donde no corresponde; jaula no debe bloquear la puerta; el farol no debe confundir la salida.
4. Revisar el empaquetador web/tools/build-artifact.py para confirmar que los nuevos PNG están embebidos mediante el índice. Probar un APK Android real y calidad/rendimiento.
5. Sólo entonces fusionar a reboot/web-el-huesped.

Licencia y atribución: Scenario Labs, 3D Collection, CC BY 4.0. Adaptación a sprites por HorrorPlay; comprobar licencia de cada registro antes de distribuir.
