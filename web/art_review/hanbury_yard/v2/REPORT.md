# Entrega D — Visibilidad del mangle de Hanbury: limitación documentada, árbol intacto

Conclusión honesta: con la casera en su sitio real y la cámara típica de
llegada (jugador x=560, cam 0, Amelia x=470), el mangle NO se reconoce a
simple vista a 640x360 sin zoom, ni con el sprite T4b ni con el procedural.
No existe un ajuste solo del prop (posición, escala, orden o presentación)
que lo libere sin flotar, atravesar personajes/muros o invadir hotspots.
Por eso no se toca `hanbury.js`: cualquier cambio empeora la composición.
Se deja el árbol del juego intacto; solo se añade esta evidencia v2.

## Por qué no hay ajuste mínimo que funcione

- Posiciones reales (verificadas en motor: `ARRIVAL {"x":560,"px":560,
  "cam":0,"amelia":470}`): Amelia `x=470 h=148`, Thomas `x=560 h=173`
  (tras `walk(560)` desde `spawn 260`; `enter` no mueve a Amelia), Pike 900,
  Greaves 1150, cámara 0 (`camTarget`: 560-640 < 0, clamped). Mangle en
  `drawProp(ctx, 'hanbury_mangle', 479, GROUND - 10)`, sprite 147x130 ax57:
  mundo x 422-569, y 495-625. Tina en 403 (mundo 348-492): ya solapan 70 px.
- Actores tapan el centro: Amelia cubre ~440-500, Thomas ~535-585; el hueco
  libre entre ambos es ~35 px lógicos (~17 px a 640x360). El mangle mide 147
  px: ningún fragmento contiguo legible (rodillos+barra ~70 px, volante 42 px)
  cabe ahí. A la llegada, el volante (borde derecho mundo 564) queda DENTRO
  de Thomas (535-585): oculto. Solo asoman astillas a izquierda/derecha.
- Salidas analizadas y descartadas sin tocar actores (prohibido moverlos):
  - Derecha para librar a Amelia (x>567, p. ej. 570: 513-660): sigue partido
    por Thomas, cae delante de la puerta/escalones e invade el hotspot
    `steps` [540,582,140,50] de lleno. Probado en motor con x=540: rodillos a
    un lado de Thomas y volante al otro, separados por su cuerpo; además tapa
    la puerta. Peor que lo actual.
  - Contiguo a un lado de ambos (izquierda x<350 entre cajas/ventana, o
    derecha x>642 delante de valla/cuerpo): rompe el rincón de lavado
    (tina 403 ↔ mangle a 240 px con puerta/escalones en medio), atraviesa
    cajas o se mete en `steps` [540,582,140,50] + `annie` [690,600,170,60];
    a la izquierda choca con tina (348-492), ventana [334,414,92,150] y
    cajas. Movimiento grande, no mínimo.
  - Encoger para caber en el hueco (sx~0,24): juguete irreconocible.
    Agrandar: más solape, tapa la puerta. Subir: flota. Bajar: se hunde.
  - Pintar detrás/delante (`drawNearOver` tras actores): el mangle pasaría
    POR DELANTE de Amelia/Thomas que están delante del muro; atraviesa
    personajes (la tarea lo prohíbe) y se leería como flotando.
- Hotspots revisados en `hanbury.js`: `amelia` [430,467,80,163],
  `steps` [540,582,140,50], `window` [334,414,92,150],
  `annie` [690,600,170,60], `comb` [970,628,70,30], `pike`, `greaves`,
  `passage`, `apron`. El mangle actual ya roza `amelia` y `steps`; moverlo a
  cualquier sitio visible lo mete de lleno en `steps` o `annie`.
- Mover a Amelia o a Thomas liberaría el mangle, pero la tarea lo prohíbe en
  principio ("NO muevas actores") y sería cambio de puesta en escena, no un
  ajuste del prop. No se hace; se documenta.

## Qué cambió (archivos)

- SIN CAMBIOS en el juego: `web/src/scenes/hanbury.js`, `web/assets/props/`
  (4 PNG + `index.json`) intactos. `git diff` del juego: vacío.
- Solo nuevo en esta entrega:
  - `web/art_review/hanbury_yard/v2/scripts/capture_mangle.mjs` — captura de
    llegada (x=560, cam 0, casera en 470) a 640x360 y 1280x720.
  - `web/art_review/hanbury_yard/v2/scripts/make_mangle_comparison.py` —
    monta la comparativa (cuantizada 192, assert < 600 KB).
  - `web/art_review/hanbury_yard/v2/comparison/AB_mangle_640.png` (296 KB).
  - `web/art_review/hanbury_yard/v2/REPORT.md` (este informe).

## Evidencia (motor real, casera en su sitio, cámara de llegada)

- `web/art_review/hanbury_yard/v2/comparison/AB_mangle_640.png` (296 KB <
  600 KB): patio a 640x360 ANTES (procedural, PNG apartados) y DESPUÉS
  (sprites T4b en su sitio), ambos con `x=560, cam 0, Amelia x=470`. A simple
  vista son casi idénticos: el sprite existe pero lo tapan casera y Thomas.
  El mangle NO se reconoce sin zoom; los otros props no empeoraron (intactos).
- Tono: sin cambio de sprite, vale la medida T4b (`check_tone.py` PASS: tina
  +5,0 %, fregadero −10,5 %, tubo −0,6 %, puerta +5,5 %, tejadillo −11,0 %,
  todo dentro de ±15 %). Comprobación extra en este encuadre (misma cámara
  que T4b, caja tina 156,260,40,50): antes 42,9 → después 44,8 (+4,4 %,
  dentro de ±15 %; lluvia animada, cociente de medias, no diff de píxeles).

## test-all (real, 2026-10-16, D)

`node web/tools/test-all.mjs` desde `C:\Dev\HorrorPlay`: **45 PASS,
0 FAIL, 0 SKIP**, exit 0 (unit, smoke, audio, 38 escenarios, walk x3,
browser). Verificación rápida repetida tras la limpieza (`--quick`):
41 PASS, 0 FAIL, 0 SKIP. Nada que arreglar: el juego sigue intacto.

## Qué NO pude comprobar

- Encuadre con el diálogo de entrada (`enter` + `frameDialogue` con zoom
  1,08 entre Thomas y NPC): las capturas usan `noenter` + zoom 1 fijo para
  comparar fondo; la composición con zoom de diálogo puede tapar aún más.
- Partida real jugada hasta Hanbury (las capturas son deep-link QA
  `?scene=hanbury&noenter&x=560`, sin guion de entrada).
- Móvil físico / APK / memoria y rendimiento: NOT_TESTED.
- Encuadre 1280x720: capturado para verificar y borrado (solo se juzga a
  640x360); los 1280, logs y `comparison/work/` se borran al cerrar.

## Regenerar todo (v2)

```
node web/art_review/hanbury_yard/v2/scripts/capture_mangle.mjs after
# ANTES (fallback): apartar web/assets/props/hanbury_*.png, capturar, restaurar
node web/art_review/hanbury_yard/v2/scripts/capture_mangle.mjs before
python web/art_review/hanbury_yard/v2/scripts/make_mangle_comparison.py
```

## Riesgos y notas

- Dejar el mangle medio oculto es una decisión consciente: es preferible a un
  mangle "visible" pero flotando, cortado por Thomas o plantado ante la
  puerta/invadiendo `steps`/`annie`. Si el auditor prefiere priorizar la
  lectura del mangle, la única vía honesta es re-escenificar (mover actores o
  el rincón de lavado), fuera del alcance de esta tarea.
- Blender 5.2 no se usó (sin asset nuevo): la limitación es de composición,
  no de modelado. Nada que adaptar de la API 4.2→5.2 en esta entrega.
- La lluvia animada impide igualdad de píxeles: las medidas son cocientes de
  medias en recortes fijos, no diffs.

## Decisión del auditor (Entrega D)

**Limitación aceptada, sin cambio en el juego.** Revisado el patio con la casera en su sitio narrativo (x=470) y el jugador llegando (x=560): el mangle comparte esa franja con ella y con Thomas, que lo tapan en parte. Los huecos libres próximos invaden los escalones (`steps`, x 540-680) o el cuerpo de Annie (`annie`, x 690-860), o llevan a esconder la tina ya aprobada (x 403) detrás de la casera, es decir, solo cambiaría qué objeto queda tapado. Mover actores o el rincón de lavado sería re-escenificar y la orden lo excluye. El mangle sigue ahí, con su tono aprobado, y se aprecia cuando la casera o Thomas se apartan.
