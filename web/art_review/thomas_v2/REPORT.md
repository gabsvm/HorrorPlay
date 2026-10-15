# REPORT — Thomas Ashgrove V2 (benchmark de arte, sin integrar)

Veredicto: **`CANDIDATE_READY_FOR_REVIEW`** — el candidato respeta el contrato del motor
(122 frames, mismas animaciones, `height=206`, `cols=10`, `ns=0.5`) y se distingue del
original a la resolución real del juego (ver `comparison/03`). La integración queda en manos
de Claude **solo tras aprobación visual del propietario**. No se tocó producción.

## 1. Qué cambió realmente

Silueta: hombros más anchos (mangas 0.074 frente a 0.068, hombreras), abrigo con más vuelo
(`flare` 1.34 frente a 1.2), pliegues más profundos, bombín más alto y ala más ancha,
cuello levantado con anilla visible, farol ×1.38 (frente a ×1.25) con núcleo de llama.

Cara: cráneo alargado, pómulos, mentón y barba incipiente (`stubble` #6f5c48), puente nasal,
ojos más grandes con párpado y ceja melancólica, orejas con pliegue, patillas largas,
pelo con volumen lateral y nuca. Sin monstruo, sin caricatura.

Vestuario: abrigo #2e3238 (antes #23262b) separado del pantalón #141518; solapas marfil,
tapeta, botones de latón, puños con botón, costuras de hombro, bolsillo, bajo con banda;
bufanda burdeos #5c1a15 con nudo y flecos; guantes de cuero con vuelta; botas con suela,
tacón y puntera.

Iluminación/materiales (solo datos de exportación, sin tocar el motor): oclusión más
profunda (0.22 frente a 0.3), volumen más marcado (potencia 0.7 frente a 0.8), borde más
fuerte (0.42 frente a 0.5), 64 muestras (frente a 16), filtro 0.7 (frente a 0.9).

Animación: **misma matemática de pies, cadera y cabeza** (sin pies flotantes ni saltos de
escala); solo más amplitud de balanceo de brazos (0.5 frente a 0.42), respiración (1.0
frente a 0.8) y respuesta del abrigo al paso. Mismas etiquetas y recuentos, mismos
instantes de ciclo (contact sheet con fotograma medio en ambos).

## 2. Revisión por ejes (sincera)

| Eje | V2 frente a original | Nota |
|---|---|---|
| Silueta | Mejora | Hombros, abrigo, bombín y farol leen en 0,5–1 s a 640×360 |
| Identidad facial | Mejora leve-moderada | A ~100 px se lee cansancio/patillas; el detalle fino vive en 06 (D), no en el sprite |
| Vestuario | Mejora | Separación abrigo/pantalón, solapas, latón, bufanda con nudo |
| Gestualidad | Empate | Mismas poses; solo más peso en brazos/abrigo/respiración |
| Legibilidad a 640×360 | Mejora | Contraste y farol (ver 03); sin cambiar zoom ni luz |
| Coherencia artística | Mantiene | Victoriano sobrio 1888; sin armas, símbolos ni steampunk |
| Coste de recursos | Empeora leve | PNG +50 KB (+11 %), VRAM decodificada +1,5 MB (+7 %); ver §4 |

No hay dieces por compromiso: gestualidad empata y el coste sube un poco.

## 3. Pruebas ejecutadas (evidencia, no afirmaciones)

- `scripts/verify_candidate.py` → **RESULT PASS** (TESTED: anims idénticos, índices
  0..121 contiguos, `height`/`cols`/`ns`, atlas 1440×3146 coherente, normales a mitad
  720×1573, 0 celdas vacías de 122, alfa duro {0,255}, máscara de vidrio 0,29 % solo
  farol; PARTIAL: caja 144×242 frente a 134×236 por silueta más ancha — alineación de
  pies documentada: `ax/w` 0,458 frente a 0,448, `ay/h` 0,921 frente a 0,928).
- `scripts/verify_blend.py` en Blender 5.2.2 batch → **VALID**: 116 mallas, 11.260
  vértices, 11.858 polígonos, 44 materiales, colecciones BODY/CLOTHING/ACCESSORIES/RIG/
  LIGHTS/CAMERAS, 21 empties de rig, 5 cámaras (orto `cam` + 4 estudio), 3 luces.
- Aislamiento: `git status` muestra solo `?? web/art_review/`; rama
  `reboot/web-el-huesped`, HEAD `ffe46380` coincidente con la referencia; los 10
  archivos protegidos (thomas, motor, tools) intactos por hash.
- Comparativas 01–08 + GIF existen y abren; 03 mide 640×360 exactos, 04 es 1280×720
  con nearest-neighbor (código: `Image.NEAREST`, sin suavizado).
- NOT_TESTED (declarado, no oculto): iluminación real dentro del motor, captura real
  del juego y Android — 03 es mockup (E) etiquetado; reimportación del GLB.

## 4. Medidas reales

Candidato: `albedo.png` 78.703 B, `normal.png` 408.619 B, `model.json` 378 B
(total 476 KB frente a ~426 KB de producción). VRAM decodificada estimada: albedo
17.696 KB + normales 4.424 KB = **22.120 KB** (producción ≈20,5 MB).
`.blend` 211.580 B, `.glb` 406.468 B. `working/` pesa 17,6 MB en 570 archivos
(frames crudos regenerables; no forma parte de la entrega versionable, ver MANIFEST).

## 5. Limitaciones reales y decisiones

1. El render 4K/estudio (D) no prueba nada por sí solo: la decisión debe tomarse en
   03 a tamaño nativo y 04 ampliada. 06 se etiqueta NO representativo.
2. Las suelas añaden 2 px abajo (`ay−h` −19 frente a −17): el anclaje al suelo cambia
   2 px; Claude deberá validar el apoyo en la prueba V1/V2 tras aprobación.
3. La altura del atlas de normales es impar (1573): el empaquetador lo admite
   (`h//2*2`), y el motor muestrea con `floor`, pero se documenta por si el shader
   espera dimensiones pares en alguna GPU.
4. Rig = jerarquía de 21 empties + código de pose reproducible
   (`render_candidate.py`), sin acciones de armature; el GLB lleva mallas/materiales
   y nodos (exportación OK en Blender), reimportación NOT_TESTED.
5. Sin captura wireframe en batch: 07 muestra bordes orientativos + estadísticas
   reales; la topología se inspecciona en el `.blend`.
6. `figure.py` original **funciona sin modernizar en Blender 5.2.2** (EEVEE, `Out`
   group, `world.color` operativos); la copia privada solo añade deltas V2.
7. Nombres de cámaras de estudio se corrigieron (front/side venían cruzados
   respecto al eje de mirada del personaje); `cam` ortográfica intacta.
8. Suela lateral con saliente visible en 02 (fondo claro): aceptada como lectura de
   calzado a tamaño real; si molesta en revisión, es un único parámetro.

## 6. Pendientes (para Claude, tras aprobación)

Prueba visual con interruptor V1/V2 o rama separada (sin tocar el save), imágenes a
640×360 y en Android; solo entonces copiar los 3 ficheros, reempaquetar, tests y
partida de regresión, conservando el baseline para reversión. Detalle en README.
