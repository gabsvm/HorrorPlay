# V4 — Checklist de cierre

HEAD verificado: `7c33f4f935d3e38f3c2a50f960c4ef88f2b9ce09` (2026-10-11), igual que `origin/reboot/web-el-huesped`, árbol limpio.

Estados: `CODE_COMPLETE` (código y pruebas automáticas, con revisión del observador), `TESTED` (comprobado en navegador o dispositivo real), `BLOCKED` (con causa), `PENDING` (no empezada o parcial).

| Fase | Estado | Evidencia / lo que falta |
|---|---|---|
| F00 baseline | CODE_COMPLETE | commit `7bf2928`; ver `V4_EXECUTION_LOG.md` |
| F01 posturas | CODE_COMPLETE | commit `9516438`; scroll provisional a 720p aceptado |
| F02 ventana de rondas | CODE_COMPLETE | commit `e2422e2` |
| F03 forense | CODE_COMPLETE | commit `bb378af` |
| F04 caso Brennan | CODE_COMPLETE | commit `5c2a040` |
| F05 Goulston | CODE_COMPLETE | commit `b923ce0`; captura 720p del tramo de la jamba |
| F06 doble suceso | CODE_COMPLETE | commit `b735471` |
| F07 Dear Boss | CODE_COMPLETE | commit `bb367df` |
| F08 Black Ditch | CODE_COMPLETE | commit `1209c85`; fuente de la canalización NO verificada (PDF y ficha UCL no legibles) |
| F09 víctimas | CODE_COMPLETE | commit `f25ec50`; recompensa emocional pendiente (F15) |
| F10 ritmo | CODE_COMPLETE (medido) | banco: primer control 29,4 s (mediana de 3, de 52,7 s antes); la apertura dura unos 13 s y el registro completo está en el menú; primera deducción no medida (no la recorre el banco) |
| F11 dirección visual | PARTIAL | plano 1 (introducción) hecho: encuadre de la calle, silencio antes de la página, movimiento reducido medido; contorno de la orilla hecho antes; faltan los planos 2 a 5 en orden (Goulston, Wexley, Greaves, firma) y los restantes de V4_SCENE_DIRECTION.md |
| F12 cordura | CODE_COMPLETE (opción A aplicada) | diez costes rebajados; llegada a Greaves 28 tras la entrada en la ruta principal (25–35); bandas medidas y documentadas; pruebas en sanity14 y walkthrough; revisión del observador pendiente de la corrección |
| F13 persecución | CODE_COMPLETE, VISUAL_PARTIAL | `7c33f4f`, `6a9a26f`, `1c6a76c`; `chase14.js` (calle del primer error en la etiqueta, la herida y Pike); `chase13.js` (c3b y reanudación). Sin captura comparada de la venda en 1280×720 ni en móvil |
| F14 cuarto capítulo y final | CODE_COMPLETE, DEVICE_PENDING | postura antes del expediente (`ae2210b`); reanudación de la confrontación sin doble cargo de cordura y sin guardados a mitad de guion (`greaves_resume14.js`, auditoría 05c15bd P0); matriz `finale14.js` (18 rutas por pares). Pendiente: teclado y móvil, y pausa real de Android |
| F15 segunda lectura | CODE_COMPLETE (contenido pendiente) | segunda lectura medida con su marca (200 vs 202 líneas); dos atajos de puzle; recuerdo de Thomas en la segunda lectura (`s2_polly`); recorte del capítulo II corregido con dos conversaciones separadas (*The Times* y *Eastern Argus*, transcripciones digitales); falta una interacción distinta por capítulo (decisión de contenido) |
| F16 interfaz y packaging | PENDING (parcial) | build de Windows corregido y verificado; maquetación a 720p provisional; Android sin dispositivo |
| F17 playtest | BLOCKED | necesita jugadores y dispositivo; protocolo escrito (`V4_PLAYTEST_PROTOCOL.md`) |

## Comandos de verificación

Ejecutar tras cada cambio: `node web/tools/unit.mjs`, `node web/tools/test-all.mjs`, `node web/tools/script/export.mjs` y revisar `git diff -- web/GUION.md`.

## Pendientes que requieren al propietario

- Tres sesiones de playtest con perfiles distintos (F17).
- Instalación y prueba del APK en un teléfono Android (F16, F17).
- Verificación de fuentes primarias para los datos marcados `FUENTE PENDIENTE` en `V4_HISTORICAL_LEDGER.md`.
