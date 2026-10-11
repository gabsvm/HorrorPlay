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
| F10 ritmo | PENDING | medición de primer control sin resultado válido; requiere jugador o script que elija opciones |
| F11 dirección visual | PENDING | planos escritos en `V4_SCENE_DIRECTION.md`; sin implementar; requiere capturas |
| F12 cordura | PENDING | pruebas de extremos (commit `8c36a91`); falta instrumentación por escena y curva |
| F13 persecución | PENDING (parcial) | `7c33f4f`: ruta limpia y pista de herida; falta objeto visual en c3b, ropa del actor, `chase_seen_at` y reanudación |
| F14 cuarto capítulo y final | PENDING | no empezada |
| F15 segunda lectura | PENDING (parcial) | atajos y momentos verificados; duración sin reducir; recompensa emocional de víctimas pendiente |
| F16 interfaz y packaging | PENDING (parcial) | build de Windows corregido y verificado; maquetación a 720p provisional; Android sin dispositivo |
| F17 playtest | BLOCKED | necesita jugadores y dispositivo; protocolo escrito (`V4_PLAYTEST_PROTOCOL.md`) |

## Comandos de verificación

Ejecutar tras cada cambio: `node web/tools/unit.mjs`, `node web/tools/test-all.mjs`, `node web/tools/script/export.mjs` y revisar `git diff -- web/GUION.md`.

## Pendientes que requieren al propietario

- Tres sesiones de playtest con perfiles distintos (F17).
- Instalación y prueba del APK en un teléfono Android (F16, F17).
- Verificación de fuentes primarias para los datos marcados `FUENTE PENDIENTE` en `V4_HISTORICAL_LEDGER.md`.
