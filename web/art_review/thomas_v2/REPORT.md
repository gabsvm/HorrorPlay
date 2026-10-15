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

## 7. Addendum V2.1 (fuente única + motor real)

Veredicto V2.1: **`CANDIDATE_READY_FOR_REVIEW`** — supera el bloqueo P1 de la
auditoría (fuente única demostrada) y aporta capturas reales del motor (09–11).

Fuente única: `scripts/render_from_blend.py` carga `source/Thomas_Ashgrove_V2.blend`,
vincula el rig por nombre (25 objetos) y reutiliza `pose()`/`build_coat()` para los
122 frames. Prueba de ida y vuelta medida: botón ×5 en el `.blend` → **1300 px**
cambiados en el frame reconstruido (zona pecho x101–141/y61–136); tras revertir,
**0 px** de diff. `render_candidate.py` queda congelado como legado documentado.
Deltas V2.1 aplicados AL `.blend` (`apply_v21_to_blend.py`, 21 edits): ojos/ojeras/
boca más oscuros, manos ×1.15 con puños claros, botones ×1.3, patillas/cejas
mayores, líneas de sombra del abrigo más profundas. Postura intacta a propósito
(riesgo de anclaje al suelo; documentado, no disfrazado).

Motor real (navegador Edge headless + `actor.js`/`model.js` de producción sin
modificar, sprites por `drawModel`/`shadeVolume`, rs=0.5, placa 1280 verificada por
cajas: V1 x185–252, V2.1 x392–464, pies y=320): `09_ingame_640` (640×360),
`10_ingame_1280` (nearest), `11_ingame_detalle` (rodillas/botas/manos/rostro x4),
`preview_walk_v21.gif` y `preview_talk_v21.gif` (8 frames del motor cada uno).
Escena simulada y arnés temporal declarados; sin escenas completas del juego ni
Android (sigue pendiente para Claude).

Validación estricta: `verify_blend.py` 13/13 PASS (colecciones, 116 mallas, 11.260
verts, 21 empties, orto 2.7, grupo `Out`, 2 vidrios, 25 lookups).
`export_check_glb.py` GLB-OK: reexportado del master V2.1 (407.476 B), reimporta con
geometría (23.540 verts en escena temporal).
Candidato V2.1 (`exports/game_candidate_v21/`, mismo contrato 122/206/10/0.5):
albedo 81.600 B + normal 411.975 B = 482 KB; VRAM decodificada 22.120 KB (igual que
V2.0; producción ≈20,5 MB).

Tabla honesta: TESTED = contrato atlas, ida/vuelta blend→atlas, sprites del motor
en navegador, GLB reimportado, cajas de anclaje. PARTIAL = caja 144×242 (silueta
más ancha), suelas −19 frente a −17. NOT_TESTED = escenas completas del juego,
Android, FPS en dispositivo.
