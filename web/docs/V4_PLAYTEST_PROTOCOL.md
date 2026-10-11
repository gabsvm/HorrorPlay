# V4 — Protocolo de playtest (F17)

Estado: **protocolo escrito; ninguna sesión de playtest realizada.** Nada de lo que sigue cuenta como `TESTED`. Las pruebas automáticas (`node web/tools/test-all.mjs`, `walk`, escenarios) son red de seguridad, no sustituyen a una persona jugando.

## 1. Objetivo

Comprobar, con jugadores que no han visto el guion, si la primera lectura se entiende, si el ritmo se siente bien, si hay bloqueos o pérdida de guardados, y si la investigación da razonamiento propio. Las preguntas de diseño están en `EL_HUESPED_PLAN_MAESTRO_V4` §C y §E F17.

## 2. Perfiles (mínimo tres, sesiones separadas)

1. Veterano de aventuras gráficas o point & click.
2. Jugador poco familiarizado con el género.
3. Persona que conoce el caso histórico (Whitechapel 1888).

Sin guía impresa ni explicación previa del sistema de deducción. Se usa el juego tal como llega al público.

## 3. Consentimiento y datos

- Consentimiento escrito o explícito antes de jugar. Grabación solo con consentimiento aparte.
- Métricas locales con `?metrics` (`web/src/engine/metrics.js`): tiempo hasta la primera entrada, cinemáticas, clics sin efecto, objetos mal usados, ayudas pedidas, tiempo por capítulo. No se envía nada a ningún servidor y no se guardan datos personales.
- Los ficheros de observación se guardan fuera del repositorio.

## 4. Hoja de observación (una por sesión)

| Campo | Qué anotar |
|---|---|
| Perfil | 1, 2 o 3 |
| Plataforma | escritorio / táctil; resolución; navegador |
| Primer control | tiempo hasta la primera acción útil (`primerControlMs` si hay entrada real) |
| Primera deducción | capítulo y minuto |
| Capítulo donde se pierde | y qué intentó |
| Hipótesis del jugador sobre el culpable | en sus palabras |
| Momento de sospecha sobre Thomas | cuándo lo dice, si lo dice |
| Elección sobre Brennan | suspect / clear / unsure, y por qué |
| ¿Entendió por qué «HERE I AM» no era el grafiti histórico? | sí / no / no lo notó |
| ¿Entendió la regla 1866/1879? | sí / no, y cómo lo explica |
| Confusión con la firma | sí / no |
| Miedo percibido | escala 1–5 al final de cada capítulo |
| Duración por capítulo | medida con `?metrics` o cronómetro |
| Bloqueos | descripción exacta: escena, acción, qué esperaba |
| Pérdida de guardado | sí / no; cómo se reanudó |

## 5. Checklists

**Escritorio (1280×720 y 1920×1080):** prólogo completo; cuaderno con las cinco preguntas (la pestaña se desplaza, es una desviación aceptada); visiones con movimiento reducido y normal; cordura en las tres bandas; segunda lectura; guardado y reanudación a mitad de capítulo.

**Táctil (teléfono 16:9 y 20:9, horizontal):** hotspots con primera pulsación que arma y segunda que ejecuta; teclado de la firma sin tapar la escena; cierre de la inspección con el gesto de volver; alcance de los botones de postura (44 px); orientación cambiada a mitad de escena.

**Android (APK):** `bash web/tools/build-apk.sh` ya construye; falta instalarlo y jugar un capítulo completo. Sin dispositivo, no se marca nada de esta lista.

## 6. Criterios de aprobación (plan F17 §5)

Todos deben cumplirse con evidencia de sesiones reales:

- Cero bloqueos reproducibles.
- Ninguna información que presuponga el futuro (cronología, identidades antes de su fecha).
- Ninguna pérdida de guardados.
- Interacción básica estable en móvil.
- Final comprensible sin guía.
- Algún razonamiento propio en el capítulo I o en el III.
- Duración documentada (sin objetivo de 45–60 min salvo que el material lo sostenga).

## 7. Estados posibles al cerrar F17

- `READY_FOR_PLAYTEST`: el código está listo para esta fase. Estado actual.
- `READY_FOR_RELEASE_CANDIDATE`: solo tras el playtest y los criterios de §6.
- `BLOCKED`: con causa escrita.

Nunca `RELEASE_READY` sin prueba funcional completa que cubra Android si se distribuye APK.
