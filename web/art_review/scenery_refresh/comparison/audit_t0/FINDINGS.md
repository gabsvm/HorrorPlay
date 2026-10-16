# T0 — Auditoría de regresión visual: farolas (`lampPost`) y cajas (`crate`)

Evidencia: `comparison/audit_t0/` (solo se conservan las dos zonas cambiadas, mitre x1380 y hanbury x250; el resto se regenera con `capture_scene.mjs`),
13 zonas × 640x360 + 1280x720 capturadas del motor real con
`scripts/capture_scene.mjs <escena> <etiqueta> <x>`. Hoja de contacto:
`comparison/audit_t0/CONTACT_SHEET.png` (miniaturas; las pruebas fehacientes
están en los PNG a tamaño completo).

Escenas auditadas (todas las que usan `lampPost` o `crate`): alleys (x 700, 1800,
2900, 3800), bucks_row (x 300, 1640), goulston (x 380), hanbury (x 250, 1760),
knackers (x 400, 1500), millers (x 1320), mitre (x 1380). No hay más usos en
`web/src` (greaves, room, seance y build.js no llaman a `lampPost`/`crate`).

## Hallazgos

| # | Escena | Problema observado | Gravedad | Corregido |
|---|--------|-------------------|----------|-----------|
| 1 | mitre x1380, hanbury x250 | Cajas con sprite (`crate.png`) más limpias/planas y brillantes que el entorno: la vía sprite omitía el `stain` que el fallback procedural sí aplica (`alpha 0.45`). Bajo la farola de Mitre las cajas se veían naranja plano; la caja pequeña de Hanbury (x280), gris pálida junto al barril procedural oscuro. | media-baja | SÍ: `stain(ctx,x,y,w,h,{seed,alpha:0.3})` en la vía sprite de `paint.js::crate`, antes del stencil. Alpha menor que el fallback para conservar el sombreado modelado. |
| 2 | bucks_row x1640, goulston x380, millers x1320, mitre x1380 | A 640x360 el farol + halo del motor se funden en un resplandor grande. Verificado a 1280x720: el farol está bien dibujado (bastidor visible, proporción correcta ~0,6 m de farol, poste plantado, haz de luz). Es fusión por downsample + halo del motor (configurado por escena, fuera del alcance: no se tocan escenas), no defecto del sprite ni de `paint.js`. | baja (observación) | NO |
| 3 | todas las farolas con sprite | Ancla: el sprite extiende 62 px fuente bajo los pies (`ay:706/768`), es decir ~31 px lógicos bajo `groundY` con `h=320`. Verificado el alfa del PNG: 61 de 68 filas bajo y=706 totalmente transparentes, resto motas del borde del plinto. En todas las capturas la base asienta sobre el pavimento sin muñón visible. | ninguna | NO |
| 4 | hanbury x250, knackers x1500, mitre x1380, bucks_row x300 | Stencils: CEYLON (mitre) totalmente legible; RICHARDSON/BARBER/K & T/E.W. parcialmente ocultos por actores (Amelia, Wren, Morris) u oscuridad de la esquina — composición de escena, fuera del alcance. Sin desbordes: Georgia 12 px cabe en las cajas. | ninguna-baja (observación) | NO |
| 5 | todas las cajas | Estirado de `drawPropIn`: interior fuente 128x125 (1,02) en cajas de hasta 1,25 de aspecto (hasta 22 % más anchas). A 640 y 1280 siguen leyéndose como cajones correctos. | ninguna | NO |
| 6 | alleys (4), knackers x400 | Farolas `{bracket:true}`: siguen procedurales (sin sprite, por diseño), brazo + farol + haz correctos; la pequeña de knackers (h=160) encaja en el arco. Sin defectos. | ninguna | NO |

## Cambio aplicado

- `web/src/art/paint.js` (`crate`, vía sprite): overlay de `stain` con `alpha: 0.3`
  y `seed` de la caja, antes del stencil. Solo afecta al albedo de la caja;
  no toca assets PNG, composición, luces ni escala.
- `web/art_review/scenery_refresh/scripts/capture_scene.mjs`: acepta cualquier
  escena del mapa ampliado (alleys, goulston, hanbury, millers, mitre añadidas;
  valores históricos de knackers/bucks_row/foreshore intactos) y un 4º argumento
  `x` (o `--x=N`) para el punto de captura; con `x` explícita el fichero se
  etiqueta (`escena_xN_640x360.png`), sin ella conserva el nombre histórico.
- `web/art_review/scenery_refresh/scripts/contact_sheet_t0.py` (nuevo):
  genera `CONTACT_SHEET.png` desde las carpetas antes/después.

Comparación ANTES→DESPUÉS (13 zonas): ninguna escena se ve peor; las cajas
asientan mejor en la noche y los stencil siguen legibles (ver PNG completos;
la hoja de contacto son miniaturas).

## No comprobado / riesgos

- Solo se revisó con `drawProp` activo (sprites cargados). La vía fallback sin
  sprites no se re-verificó (no se tocó).
- `stain` usa ruido con `seed` de la caja: dos cajas con misma semilla comparten
  patrón de suciedad; ya era así en el fallback.
- La hoja de contacto reduce a 384 px: los juicios finos están en los PNG
  originales de `audit_t0/` y `audit_t0_after/`.
