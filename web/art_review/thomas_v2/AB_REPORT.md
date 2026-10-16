# Thomas Ashgrove — comparación A/B en Buck's Row (V1 / V2.1)

**Rama:** `reboot/web-el-huesped` · **Base:** `a373cae` · **Estado:** candidato sin integrar.

## Resultado editorial

La V2.1 se ve algo distinta: bordes del abrigo, iluminación de manos y cara y
cierta definición extra del rostro. **La diferencia a 640×360 sigue siendo
muy pequeña**, menor que la diferencia entre los personajes principales que
querríamos conseguir en una mejora visual general. No recomiendo sustituir la
V1 de producción basándonos solo en este benchmark.

El problema ya no es únicamente el modelado: el actor en Buck's Row ocupa muy
pocos píxeles verticales, usa una paleta oscura, y está iluminado por farolas
que enfatizan la silueta. El trabajo fino en botones, pelo y pómulos se pierde.
La V2.1 no introduce animaciones nuevas ni mejora claramente la expresividad.

## Evidencia de motor real

Se ejecutó `node web/art_review/thomas_v2/scripts/ingame_ab.mjs` en
Edge headless, con perfil aislado y servidor local temporal. Ambas variantes
se capturaron en **la misma escena real** (`bucks_row`, sin `FAST`), con
player.x = 1470, player.y = 628, player.h = 173, camX = 830 y la misma
configuración de luz/motor. El juego conserva sus scripts de
`actor.js`, `model.js`, `renderer.js` y los decorados de Buck's Row.
En el candidato, `window.__MODELS.thomas` inyecta únicamente albedo,
normales y metadatos antes del inicio de la página.

- `comparison/ab_bucks_row/AB_BuckRow_640.png`: V1/V2.1 a 640×360 real por lado.
- `comparison/ab_bucks_row/AB_BuckRow_1280.png`: 1280×720 por lado.
- `comparison/ab_bucks_row/AB_BuckRow_closeup_x4.png`: ampliación nearest
  de los **mismos píxeles** del personaje, sin recuperar detalle inventado.
- Cuatro capturas originales y `capture_log.json`: parámetros y readiness
  de cada variante para repetir la prueba.
- `AB_BuckRow_actions.png`: tres pares adicionales en el escenario real,
  **caminando** (un fotograma dentro de `walkTo`), **hablando**
  (`talking=true`, animación `talk`) y **reaccionando**
  (`pose='recoil'`). Se capturaron seis PNG adicionales a 640×360.
  La secuencia activa la API del actor de forma controlada en QA: no simula
  que el jugador haya disparado diálogos o eventos de historia.

**Importante:** Buck's Row tiene lluvia y otros elementos animados. Por ello
las dos capturas no son idénticas fuera de Thomas; no se debe interpretar un
diff global de píxeles como una mejora o regresión gráfica del personaje.
Estas capturas son de una escena auténtica con inicialización directa de QA,
**no un playthrough desde Nueva partida**.

## Correcciones técnicas realizadas

1. `apply_v21_to_blend.py` ahora es idempotente: marca la revisión de la
   escena y reconoce por color el master V2.1 antiguo, sin multiplicar
   escalas nuevamente. Una mezcla parcial de materiales se rechaza.
2. `scripts/test_apply_v21.py` prueba dos ejecuciones seguidas y adopción
   del master antiguo con `bpy` simulado.
3. `scripts/ingame_ab.mjs` conserva y automatiza la prueba de navegador
   antes perdida en `working/`, sin editar producción ni eliminar otros
   procesos Chrome/Edge.
4. `scripts/make_ab_board.py` genera las comparativas desde las capturas
   crudas, sin tocar el original.
5. README y cabecera del renderizador actualizados para describir el pipeline
   **híbrido**: el aspecto del master procede del `.blend`; los movimientos
   y vértices del abrigo se calculan en Python.

## Validación y límites

- **TESTED:** cuatro capturas de Buck's Row producidas por Edge, modelo listo
  en cada variante, mismo camX/posiciones, sin modificación a archivos
  activos ni guardados. Script de comparación ejecutado de principio a fin.
- **TESTED:** seis capturas diagnósticas extra de caminar, hablar y retroceder;
  el motor eligió respectivamente `walk`, `talk` y `recoil`. La posición
  durante la caminata varía levemente entre tomas debido al tiempo real.
- **TESTED:** la lógica de idempotencia con `bpy` simulado (dos casos).
- **TESTED:** `python .../verify_candidate.py .../game_candidate_v21`
  con NumPy/Pillow en entorno virtual aislado: **RESULT PASS** (122 frames,
  19 animaciones, atlas 1440×3146, normales 720×1573, 0 celdas vacías y
  canal de vidrio correcto). Tamaño/anclaje distintos, documentados como
  PARTIAL.
- **TESTED:** `node web/tools/test-all.mjs` ejecutado completo sobre la
  misma rama: **45 PASS / 0 FAIL / 0 SKIP**, incluidos recorridos completos
  y browser-check (no debe confundirse con pruebas físicas Android).
- **NO TESTED:** reexportación del `.blend` en Blender 5.2 en la máquina
  conectada. Solo está instalado Blender 4.2, que no puede abrir ese master
  5.2; el archivo original no se reescribió.
- **NO TESTED:** integración en APK/Android, todos los fotogramas del actor
  en una partida, animaciones bajo todas las luces y desempeño térmico.
- **PARTIAL:** la captura compara el motor real, pero su entrada de escena
  usa el `?scene=bucks_row&noenter` de desarrollo y no simula una partida.

## Decisión recomendada

**Mantener V1 en producción; dejar V2.1 como candidato reversible.** Antes de
considerar una sustitución global del reparto, probar un prototipo de
expresividad/silueta que se note con el personaje al tamaño de gameplay.

Para repetir en una copia de esta rama:

```powershell
node web/art_review/thomas_v2/scripts/ingame_ab.mjs
python web/art_review/thomas_v2/scripts/make_ab_board.py
python web/art_review/thomas_v2/scripts/test_apply_v21.py
```
