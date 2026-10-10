# EL HUÉSPED — PLAN MAESTRO V4
## Reforma integral de gameplay, pacing, investigación histórica, terror y presentación

**Destinatario:** Claude Code, ejecutando con **Haiku implementador / Claude Opus 5.5 observer-adviser**.
**Repositorio:** `gabsvm/HorrorPlay`
**Rama de trabajo existente:** `reboot/web-el-huesped`.
**HEAD de referencia comprobado:** `92a5413f5d0cb2a4be435685d30d27d134ca9c41` (2026-10-10).
**Ámbito:** `web/` exclusivamente, además de la configuración específica de agentes de este repositorio y documentación técnica. **No tocar** la rama `main`, el prototipo Unity, el juego Godot anterior ni proyectos ajenos.
**Documento vinculante:** `web/STORY_BIBLE.md`, reconciliado con el presente plan y con el código real. El script exportado `web/GUION.md` es un derivado del código: nunca editarlo como fuente principal.
**Objetivo:** una aventura gráfica histórica de terror psicológico memorable, basada en deducción genuina, contradicciones verificables, subtexto, montaje, economía de interacción y consecuencias humanas. **No** un juego de supervivencia, acción, RPG ni una demo nueva.
**Duración:** el objetivo experimental de primera lectura es **45–60 min**, no una cuota para rellenar artificialmente. Medir tiempo real por capítulo y optimizar; no extender si el contenido nuevo no lo justifica. Segunda lectura más breve y radicalmente reinterpretativa.

> **REGLA DE CANON INALTERABLE — OPCIÓN A APROBADA POR EL PROPIETARIO:** Thomas Ashgrove redacta `Dear Boss` con tinta roja durante la laguna de la noche del **24 al 25 de septiembre de 1888**. La carta fechada el 25 llega a Central News Agency el 27; la prensa propaga el nombre `Jack the Ripper`. El Huésped utiliza esa propagación. **NO** implementar la hipótesis alternativa de un periodista autor material de la carta, un tercero falsificador o un cambio de identidad del asesino. La sospecha policial sobre autenticidad puede existir *dentro del mundo* como hipótesis errónea/insuficiente; el hecho ficticio establecido no cambia.

---

# A. CONTRATO DE PRODUCCIÓN (LEER ANTES DE EDITAR)

## A1. Invariantes narrativas

1. Protagonista: **inspector Thomas Ashgrove**, Whitechapel/Londres, 1888. Los protagonistas y nombres existentes siguen siendo Thomas, Nat, Wren, Pike, Greaves, Brennan y Wexley; no reemplazarlos.
2. El Huésped **solo entra al recibir una respuesta voluntaria a su llamada desde el agua**. Si se respondió en 1866, entrada en 1866. Si se calló en 1866, entrada en **1879**. Las respuestas de noviembre de 1888 no constituyen una primera entrada nueva, pues ya está dentro. Conservar `answered1866`, `entry_year` y las dos rutas.
3. Thomas comete los asesinatos en el canon ficticio. No sustituir ese giro por una culpabilidad de Greaves, Brennan, Pike o la prensa. La **comprensión** puede variar; el hecho central no.
4. Las cinco víctimas canónicas y sus fechas históricas se conservan. No añadir muertes inventadas para “subir la tensión”, no explotar el gore y no reducir a las víctimas a coleccionables.
5. No multiplicar finales incompatibles. Destino principal y transformación visible de firma a **J-A-C-K** se mantienen; las consecuencias de Brennan, Wren, Pike y del estado mental deben reconocerse.
6. Conservación de los 11 escenarios actuales salvo que Opus autorice una razón jugable excepcional. Prioridad a nuevas capas interactivas en escenarios ya existentes; no expansión de mapa por defecto.
7. El agua, el nombre, la memoria, la firma y la culpa son la mitología central. Evitar exposición del origen, biología o “lore de monstruos”.
8. El misterio es **doble**: A) ¿Thomas está siendo incriminado o actúa durante las lagunas? B) ¿por qué necesita la entidad que Londres conozca un nombre? No explicar B antes de que el jugador haya construido A; evitar revelaciones via monólogo.
9. Personajes y tono: diálogos secos, concretos, con subtexto; Thomas no narra constantemente lo que se ve. Wren no es una oráculo infalible. Greaves no explica lo sobrenatural.
10. Historias documentadas: diferenciar **hechos acreditados**, **testimonios/discrepancias de 1888**, **reconstrucciones dramáticas** y **manifestaciones sobrenaturales ficticias**.

## A2. Invariantes técnicas

- Aplicación JavaScript nativo ES modules, Canvas/WebGL, DOM y audio procedural. Mantener arquitectura existente, offline/APK/WebView y ejecutable Windows; no migrar a React, Phaser, Unity, Electron, otro framework o un nuevo motor.
- Mantener las claves y contratos `elhuesped.save.v1`, `.resume`, `.ch.*`, `.read`, `.unlocked`, y prefs. No resetear partidas; migraciones **idempotentes** por `normalizeState` y funciones puras. **Nunca** asumir estado nuevo en un guardado antiguo.
- Conservar TODOS los IDs existentes de escenas, hotspots relevantes, pistas, objetos, deducciones, flags y finales (`aqui_estoy`, `chalk_seen`, `seance_done`, `comb_custody`, etc.). Añadir IDs nuevos con prefijos estables; no reutilizar uno existente con semántica incompatible.
- No introducir dependencia de servidores, analítica remota, cuentas, APIs externas, subida de saves, trackers o licencias de terceros. Las métricas permanecen locales/opt-in.
- Mantener accesibilidad: movimiento reducido (sin flashes rápidos), legibilidad móvil, tamaños táctiles, contraste, saltar tarjetas, velocidades de texto, vibración opcional, sonido desactivable.
- `web/tools/test-all.mjs` debe continuar ejecutándose con salida de cero errores; smoke, audio, unit, escenarios, partida estándar/alternativa/segunda, compatibilidad y reanudación. No eliminar tests para obtener verde.
- Preservar build APK y Windows. No afirmar “comprobado en Android” sin haberlo ejecutado en un teléfono.
- Cambios de arte/cámara/profundidad han de ser coherentes con el pixel-art HD procedural (`src/art/*`, `renderer.js`) y razonables en GPU de gama media.
- **No cambiar otra rama ni hacer push a `main`**. Trabajar con commits pequeños dentro de `reboot/web-el-huesped`, o en rama hija de esa base si se necesita revisión. Tras aprobación Opus y tests verdes, se autoriza **push normal a `reboot/web-el-huesped`** si las credenciales del propietario lo permiten; prohibidos `--force`, merge a `main` y despliegues a producción sin permiso.

## A3. No intervención destructiva

No renombrar indiscriminadamente pistas, no mover escenas a otro motor, no reescribir toda la biblia, no acortar testimonios borrando información necesaria, no introducir dificultad artificial. Priorizar *sustituir* una interacción banal por otra significativa, no añadir ruido. Verificar dependencias de cada nuevo flag con búsquedas en todos los archivos.

## A4. Estado actual confirmado (para evitar repetir arreglos ya hechos)

En HEAD `92a5413`: `story/progression.js` ya tiene `canFinishC1`, `canLeaveHanbury`, `canStartSeance`, `canLeaveMitre`, `canEnterFinale`, `currentGate`, `gateDeductions`. `story/theories.js` tiene cuatro preguntas y estados **derivados**, no seleccionados por el usuario. `story/perception.js` ya gestiona bandas de cordura (≥65, 36–64, ≤35). El capítulo I se cierra voluntariamente; peine con Pike o Thomas es real; HOSPES se descifra antes del clímax; persecución tiene `chase_outcome`; final conserva `final_intent`, `water_reply_intent`; segunda lectura cuenta con cinco nuevos momentos; `UI.vision()` ya respeta movimiento reducido; la ayuda ya comunica después de cerrar el cuaderno. **No reimplementar estas correcciones**.

---

# B. PROTOCOLO MULTIAGENTE OBLIGATORIO

## B1. Roles y propiedad del código

**Haiku, implementador (único editor):** implementa, escribe tests, ejecuta pruebas, corrige y registra cambios. Posee todas las escrituras de `web/src`, `web/tests`, `web/tools`, `web/styles.css`, `web/index.html`, documentación, commits y builds. No delega la implementación efectiva en Opus.

**Opus 5.5, observer/adviser (independiente y read-only):** lee archivos originales, analiza riesgos históricos y narrativos, revisa propuestas *antes* de codificar, inspecciona cambios después, detecta contradicciones históricas y del canon, exige pruebas y emite decisión `APPROVED`, `CHANGES_REQUESTED` o `BLOCKED`. Nunca edita archivos, nunca hace commits ni pushes. Tiene derecho a vetar una fase por riesgo sustantivo.

**Usuario:** ha aprobado únicamente el canon A y este marco de trabajo. La implementación puede progresar automáticamente fase por fase mientras mantenga el contrato. Si un cambio exige romper un invariante, documentar alternativa y marcar `BLOCKED` en lugar de decidir un nuevo canon unilateralmente.

## B2. Orquestación preferida: Claude Code agent team real

Documentación de producto verificada:
- https://code.claude.com/docs/en/agent-teams
- https://code.claude.com/docs/en/sub-agents
- https://code.claude.com/docs/en/model-config

Usar **sesión interactiva**, no `claude -p` (los equipos no se crean en modo no interactivo). Actualizar Claude Code según necesidad (`claude update`); Opus 5.5 requiere versión compatible y disponibilidad real de modelo. Con `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, abrir **lead Haiku**: `claude --model haiku`.

Crear antes de lanzar (o instalar desde el paquete) `.claude/agents/opus-55-observer.md` (`model: claude-opus-5-5`, sólo `Read, Grep, Glob`) y `.claude/agents/haiku-implementer.md` (`model: haiku`). El lead Haiku actúa como implementador; **spawnea un teammate** de tipo `opus-55-observer` fijando explícitamente modelo `claude-opus-5-5`. No son dos asistentes imaginarios dentro de un solo mensaje: confirmar que el equipo existe, que cada miembro aparece y que la versión/modelo efectiva del observer es la solicitada. No asumir que un fallback de provider es Opus 5.5; si no se consigue, parar e informar.

Protocolo por fase:

1. **Haiku → Opus:** paquete `PROPOSAL`: objetivo, archivos, riesgos, pseudocódigo/puntos de integración, medidas de canon, pruebas nuevas, migración de saves.
2. **Opus → Haiku:** `APPROVE_PLAN` o `REQUEST_CHANGES`, con severidad P0–P3 y evidencia. Si solicita cambios, Haiku modifica propuesta antes de editar.
3. **Haiku implementa** sólo la fase aprobada, sin tocar archivos ajenos a la fase salvo justificación.
4. **Haiku ejecuta** tests específicos y suite completa; comparte diff/archivo concreto y logs, no un “todo OK” sin evidencia.
5. **Opus revisa de manera adversarial**: (i) gameplay real, (ii) pacing, (iii) exactitud/ambigüedad histórica, (iv) compatibilidad, (v) accesibilidad, (vi) pruebas ausentes. Emite `APPROVED` o `CHANGES_REQUESTED`. Revisar el contenido actual, no solamente el resumen del implementador.
6. Corregir hasta aceptación. Haiku hace commit de fase. Registrar SHA, paths, pruebas y acta Opus en `web/docs/V4_EXECUTION_LOG.md`. Cambiar estado a `CODE_COMPLETE` únicamente tras la aprobación. **Nunca** `TESTED` sin playtest humano real.
7. Siguiente fase. No acumular todas las revisiones al final, no aceptar autoaprobación de Haiku simulando Opus.

**Transparencia:** al terminar cada bloque, registrar el modelo efectivo del implementador y del observer según la sesión, ID/rol de agente, veredicto y riesgos residuales. Si se detiene el observer por límite/contexto, reanudar o reemplazar **con Opus 5.5 verificado** antes de marcar listo. No inventar aprobaciones.

## B3. Fallback técnico si agent teams está deshabilitado o falla

Usar sesión principal `claude --model haiku` y llamar un **subagente personalizado `opus-55-observer`** tras planificar y después de cada fase (en modo subagents la respuesta vuelve al principal, sin mensajería directa). Mantener el mismo protocolo y registros de dos pasadas. No fingir que hay un equipo activo; decir `MODO SUBAGENTES` en el informe. Si no hay acceso real a Opus 5.5, no sustituirlo silenciosamente por Sonnet/Haiku ni inventar supervisión: detener las fases de alto riesgo y reportar la limitación.

## B4. Coste y concurrencia

Un solo escritor (Haiku), un solo supervisor (Opus): evitan conflictos de archivos. Opus debe revisar por fase, no mantenerse generando contenido innecesario mientras Haiku escribe. Usar revisiones dirigidas con diffs compactos, siempre leyendo fuente para los hallazgos. No disparar otros agentes “por si acaso”.

---

# C. MODELO DE EXPERIENCIA: LOOP, RITMO Y TERROR

## C1. Loop objetivo

**Observar → formular hipótesis → contrastar con otra fuente → escoger una interpretación → actuar → recibir consecuencia → reevaluar.**

El sistema anterior `pista A + pista B = deducción automática` se conserva como operación básica, pero se añade una capa **deliberativa** sobre un conjunto pequeño de preguntas. No crear decenas de árboles de diálogo nuevos. Hay tres núcleos investigativos:
- I. Buck's Row: rondas, horarios, visibilidad y fiabilidad de testimonios.
- II. Brennan/Leather Apron: evidencia, estigma, coartadas y efecto de rumores.
- III. Carta Dear Boss / identidad: analogía de letra, red ink, acceso al cuarto, pruebas independientes.

El jugador puede terminar los capítulos siguiendo el camino **actual** sin entrar en el nuevo sistema deliberativo salvo el tutorial mínimo. En ningún caso una opinión elegida se convierte en hecho forense nuevo. Hipótesis rectificables, no un solucionario impuesto.

## C2. Modelo de pacing propuesto (hipótesis, luego calibrar)

- Prólogo 4–5 min; Cap. I 10–13; Cap. II 10–12; Cap. III 10–12; Cap. IV + epílogo 11–15. Suma objetivo: 45–60; la duración final dependerá de playtests.
- Primer control útil deseado antes de ~90 s, primer acto de investigación relevante antes de ~5 min; medir sobre jugador real, no `FAST`.
- Cada capítulo debe alternar: **investigación**, **interacción con coste humano**, **perturbación controlada**, **breve silencio**, **revelación parcial**; evitar tres documentos consecutivos o conversaciones que repitan el último objetivo.
- Usar métricas medibles: `firstInput`, `timeToFirstDeduction`, `timeInDialogue`, `timeWalking`, `timeInCinematics`, `timeInNotebook`, `puzzleAttempts`, `hintsPerGate`, `blockedExit`, `timePerChapter`, `optionalInteractions`. El estado de progreso no debe enviarse a red.
- Presupuesto editorial: un hecho puede presentarse como pista/diálogo/cuaderno **una vez** de manera explícita; posteriores referencias han de aportar contradicción, coste o doble sentido. Eliminar narraciones sobre sonidos/acciones ya visibles.

## C3. Terror ambiental con reglas

- Efectos anclados a **eventos/estados**, no puramente aleatorios: `ambient.*` y `second` son las principales llaves; cordura cambia presentación sin falsificar pistas.
- Cada manifestación tiene **setup**, **cambio mínimo**, **ausencia/silencio**, **posibilidad de reexaminar**. Ejemplos: reflejo una fracción tarde, humedad donde se limpió, silencio de goteras al tocar expediente, crujido del cuarto cuando Thomas revisa su firma.
- Muy pocos sustos fuertes. El terror principal es “algo no coincide”, no jumpscares. No sobrerrepresentar la entidad como criatura visible.
- Para `reduceMotion`, flashes sustituidos por fundidos o imagen fija; no cámara punch, no destellos rápidos. Los indicadores de progreso se mantienen legibles en todos los modos.

---

# D. ARQUITECTURA DE DATOS Y MIGRACIONES

## D1. Modelo incremental de investigación

Mantener `state.investigation.hypotheses`, `.routes`, `.evaluations`; añadir de forma compatible `state.investigation.positions` y `state.investigation.revisions`, **sin** sustituir los estados derivados actuales:

```js
// Propuesta semántica, adaptar a estilo actual e IDs disponibles.
state.investigation.positions = {
  buck_window: { selected: 'uncertain', reviewedAt: 'c1', basis: ['ronda'] },
  br_suspect: { selected: 'uncertain', reviewedAt: 'c1', basis: [] },
  letter_author: { selected: 'insufficient', reviewedAt: 'c3', basis: [] },
};
state.investigation.revisions = [
  // { question, from, to, when, reasonId }  // IDs, no texto localizado como fuente de verdad
];
```

No introducir `selected` arbitrario en un save antiguo; reconstruir `unknown`/`not_chosen` y usar flags viejos cuando existe intención explícita, sin inferir que el jugador eligió una teoría sólo porque tenía pistas. Los estados `plausible/refutada/etc.` derivados de `theories.js` son **evidencia**, no decisión del jugador. Los cambios de postura humana pueden almacenar `stance` en `positions` y compatibilidad con `brennan_stance`.

## D2. Esquema de pistas y testimonios

Datos de cada pieza, sin reescribir la definición actual:

```js
{
  id: 'c1_testimony_neil',       // IDs nuevos y persistentes
  source: 'Neil / declaración',  // canon interno o fuente interna
  era: '1888-08-31',
  reliability: 'reported',      // recorded | reported | disputed | supernatural
  independentGroup: 'neil',    // la misma fuente no cuenta dos veces como corroboración
  contradictions: ['c1_testimony_cross'],
  historicalStatus: 'dramatization', // documented | disputed | dramatization | fictional
}
```

No prometer que un testimonio constituye certeza ni marcar como `documented` algo reconstruido. Los hotspots antiguos y las pistas existentes siguen compatibles; lo nuevo puede ser un mapa `evidenceMeta` asociado a IDs, sin mutación masiva.

## D3. Compatibilidad y checkpoints

- `normalizeState()` agrega campos bajo `investigation`, sanea arrays, garantiza idempotencia y preserva claves desconocidas.
- Los guardados anteriores a V3/V4 deben reanudar sin nueva introducción, repetir entrega de objeto o reabrir un puzzle completado.
- La reanudación a mitad de escenas nuevas debe ser **por evento seguro/checkpoint**: serializar estados entre acciones atómicas, no guardar durante una cinemática con actor reconfigurado. Marcar `v4_*_done` al completar acto, no al iniciar.
- No exigir una pista nueva para entrar en un capítulo si save antiguo había completado el gate anterior; nuevos bucles son “valor añadido”, no obstáculos retroactivos.
- Documentar cada flag o ID añadido en `web/docs/V4_STATE_SCHEMA.md`, con fuente, default, dependencias, unlock y migración.
- Cobertura guardados: 1866 respuesta / silencio 1879; Brennan 3 outcomes; peine Thomas/Pike; chase 3 outcomes; final 3 intents; segunda lectura; 0/36/64/100 cordura; legacy pre-V3/V4.

---

# E. FASES DE IMPLEMENTACIÓN — EJECUTAR EN ORDEN

Cada fase termina únicamente con una ficha `PROPOSAL → BUILD → TEST → OPUS REVIEW → APPROVED → COMMIT` y aceptación basada en criterios observables. **El hecho de que un test pase NO demuestra buen pacing**: `TESTED` reservado a playtest humano.

## FASE 00 — Baseline, mapa de dependencias y control de alcance

**Archivos:** `web/docs/V4_EXECUTION_LOG.md` (nuevo), `web/docs/V4_STATE_SCHEMA.md` (nuevo), `web/STORY_BIBLE.md`, `web/src/story/{chapters,data,progression,theories}.js`, `web/src/engine/{game,ui,metrics}.js`, `web/src/scenes/*.js`, `web/tools/*`.

**Implementar:**
1. `git status` limpio o documentar modificaciones preexistentes sin borrarlas. Confirmar rama y HEAD; si difiere de `92a5413`, reauditar diff antes de tocar nada.
2. Ejecutar `node web/tools/test-all.mjs` y `node web/tools/unit.mjs`. Guardar resultados auténticos, timestamps y SHA.
3. Capturar baseline `WALK_LOG=... node web/tools/walk.mjs`, segunda lectura, alt, y contar `web/tools/read-count.mjs`. Separar llamadas condicionales vs texto efectivamente recorrido. No escribir log encima de los fixtures.
4. Inventariar hotspots por escena: acción, respuesta primera visita, repetición, feedback de bloqueo, `use`, flags y pruebas actuales. Inventariar entradas/teletransiciones, visiones, tarjetas y pasos de diálogo.
5. Identificar conflictos históricos concretos en el guion, clasificarlos `[D] documentado`, `[U] discutido`, `[F] ficticio`, `[A] anacronismo`. Redactar `web/docs/V4_HISTORICAL_LEDGER.md` con fuentes y fechas, no opiniones sin fuente.
6. Auditar el funcionamiento real del menú, guardados, APK, Windows y segunda lectura. No modificar el canon aún.

**Criterios:** baseline verde o fallos reproducibles documentados; mapa de IDs y dependencias; Opus aprueba fases 01–04 antes del primer cambio delicado.

## FASE 01 — Infraestructura de evidencias y deliberación ligera

**Archivos:** nuevo `web/src/story/evidence.js` (o equivalente), nuevo `web/src/story/positions.js`; `web/src/story/theories.js`, `web/src/story/progression.js`, `web/src/engine/game.js`, `web/src/engine/ui.js`, `web/index.html`, `web/styles.css`; unit tests.

**Requisitos:**
1. Mantener combinaciones de 2 pistas actuales. Añadir `reliability`, `source`, `independentGroup`, `historicalStatus`, `contradictions` en **registro separado** para nueva evidencia; no exigir metadatos para pistas antiguas.
2. Tres preguntas editoriales seleccionables (`buck_window`, `br_suspect`, `letter_author`) con 2–3 posturas válidas cada una. Selección/revisión opcional. No proponer como hecho “el jugador cree X” cuando sólo acumuló prueba Y.
3. UI cuaderno: “Estado de pruebas” (plausible/refutado/insuficiente) separado visual y semánticamente de “Mi postura” (seleccionada/no seleccionada). Discrepancia visible entre fuentes. No introducir una cuarta pestaña caótica: reutilizar `Teorías` o panel contextual. Botones accesibles para táctil.
4. Al rectificar teoría, registrar motivo `evidenceId`, capítulo y revisión. Límite de tamaño histórico; no duplicar revisiones por clicks.
5. Nuevas frases de Thomas sólo al **cambiar realmente** una postura con consecuencia; no comentario por cada clic. No gatillar capítulos al abrir el cuaderno.
6. El índice de dificultad debe ser amigable: 3 preguntas, máximo 3 posturas por pregunta, una pantalla sin scroll interminable en 720p. Aclarar qué es prueba y qué es interpretación.

**Tests:** selección y reversión; estado viejo `positions` ausente; save/reload sin duplicar historial; no contaminación de deducciones; todos los gates antiguos intactos; navegación teclado/táctil. **Opus:** revisar que no se anticipe el giro antes de `awake` ni por strings de UI.

## FASE 02 — Revisión histórica de Buck's Row y puzle de rondas

**Archivos:** `web/src/scenes/bucks_row.js`, `web/src/story/chapters.js` (`beats`), `web/src/story/data.js`, `web/src/story/progression.js`, `web/src/story/evidence.js`, `web/STORY_BIBLE.md`, tests.

**Requisitos:**
1. Conservar nombres históricos PC Neil, Thain, Cross/Mizen que ya aparecen en guion, pero separar horarios “declarados” de una ventana objetiva **probada**. El puzle actual convierte `3:30–3:40` en certeza: reemplazar una deducción demasiado tajante por una **mejor reconstrucción con margen de incertidumbre**, sin inventar hechos históricos nuevos.
2. La respuesta relevante puede continuar siendo la franja reconstruida por las declaraciones del *juego*, si son coherentes; el UI debe advertir que las horas de testimonios son aproximadas y no que el asesinato ocurrió *demostrablemente* en diez minutos.
3. Contradicción activa: jugador consulta hoja, habla con al menos dos fuentes y elige si la ventana es firme/compatible/insuficiente. Un error produce feedback informativo (qué declaración contradice), no reset repetitivo.
4. Progresión alternativa intacta: completar una sola conclusión válida que se sustente en evidencias (`canFinishC1`), sin exigir rondas. La investigación ampliada es mejor y da recompensa, pero no gatea la historia si no se resolvió.
5. Justificar diegéticamente con una frase o documento breve por qué el inspector de División H participa en un caso de Buck's Row asociado a División J, sin modificar rangos ni inventar una orden histórica real.
6. Nunca cambiar `ronda`, `d_ronda` o save IDs; si se añade nuevo estado `v4_beats_assessment`, marcarlo como opcional.

**Tests:** ruta clásica, investigación opcional completa, error doble, revisión de postura, fast/normal, saves con `ronda` pre-V4; cierre con Pike y Brennan. **Opus:** contrastar horarios/afirmaciones de certeza con `V4_HISTORICAL_LEDGER` y revisar consistencia con el caso ficticio.

## FASE 03 — Informe forense: lateralidad y formación anatómica como hipótesis

**Archivos:** `web/src/scenes/bucks_row.js`, `web/src/scenes/hanbury.js` (diálogos médicos), `web/src/story/{data,theories,chapters}.js`, `web/src/scenes/greaves.js` o documentos existentes, ledger y tests.

**Hallazgo documental de partida:** Llewellyn sostuvo inicialmente que las heridas de Nichols *podían* indicar zurdera; un informe de Swanson fechado **19 de octubre de 1888** describe dudas posteriores. Hay desacuerdo histórico sobre habilidad anatómica; no presentar ambas como hechos cerrados del asesino.

**Requisitos:**
1. En **agosto** sólo se oye la opinión **inicial** de Llewellyn, preferiblemente matizada (“puede ser zurdo”). No insertar la rectificación de octubre en el diálogo de agosto o septiembre: sería anacronismo.
2. Una nota **posterior al 19 de octubre** disponible en consulta Greaves/expediente Cap. IV, o en documento fechado visible, revela la revisión. No introducir un nuevo NPC imprescindible.
3. Reinterpretar `zurdo`/`anatomia` como testimonios/indicios, no evidencias independientes de culpabilidad definitiva. Mantener sus IDs y utilidad dentro del puzzle del final; el final debe exigir corroboraciones de fuentes distintas, no apoyarse exclusivamente en las dos dudas médicas.
4. Brennan y Greaves siguen siendo sospechosos compatibles pero no culpables demostrados. Distinguir técnica de disección de poseer educación formal.
5. El efecto emocional: Thomas puede dudar de una prueba que también lo señala a él. Evitar confesión demasiado precoz.

**Tests:** cronología: texto de Swanson nunca antes de 19-10; `f_zurdo` continúa disponible pero muestra etiqueta de evidencia matizada; `canEnterFinale` continúa con múltiples rutas; hipótesis Brennan se puede corregir. **Opus:** bloquear si una contradicción histórica altera el canon oculto.

## FASE 04 — Caso Brennan, rumor, coartada y consecuencias humanas

**Archivos:** `web/src/scenes/knackers.js`, `web/src/scenes/hanbury.js`, `web/src/story/{chapters,theories,positions}.js`, `web/src/scenes/millers.js` si aplica; tests.

**Requisitos:**
1. Centrar la investigación en evidencia vs prejuicio: oficio con cuchillos, lateralidad, coartada, dueño del delantal, rumor periodístico Leather Apron, reacción de Wren.
2. La casera sabe de quién es el delantal; Brennan presenta una coartada que puede requerir confirmación sin inventar testigos históricos reales. Añadir **una** contradicción verificable que el jugador pueda resolver con información existente, no otra búsqueda por tres escenarios nuevos.
3. Ofrecer selección de postura `suspect/clear/unsure` donde ya funciona, y opción de revisar antes del cierre si llega una evidencia incompatible (sin cambiar resultado implícitamente).
4. No eliminar consecuencias `brennan_outcome` (`severe`, `injured`, `protected`), ni redención gratis. La turba puede actuar pese a una conclusión prudente; mostrar con acciones físicas, no tres tarjetas más.
5. Wren reacciona a lo ocurrido, nunca culpa a Thomas por proteger a Brennan. Evitar que su conocimiento sobrenatural invalide testimonios humanos.
6. La prensa funciona como presión ambiental: un recorte, rumor y reacción del barrio bastan. No diseñar simulador de periódicos.

**Tests:** tres posturas × tres desenlaces disponibles según reglas, peine Pike/Thomas, regreso, second read, save/resume y epílogos. No hay camino donde Tomás “prueba” culpabilidad de Brennan sin fuente.

## FASE 05 — Goulston Street: prueba histórica vs percepción «HERE I AM»

**Archivos:** `web/src/scenes/goulston.js`, `web/src/story/{data,theories,progression}.js`, `web/src/story/chapters.js`, `web/src/art/paint.js` sólo si imprescindible, `web/STORY_BIBLE.md`, tests y ledger.

**OBLIGATORIO:** el mensaje `HERE I AM` de la versión actual **NO** corresponde al grafiti históricamente documentado. No presentarlo como una inscripción policial real de 1888. La inscripción encontrada junto a la evidencia de Eddowes tiene transcripciones contradictorias y contenido antisemita; la policía la borró ante riesgo de violencia. **Su autoría en relación con el asesino no está probada.**

**Implementación narrativa elegida:**
1. Conservación de `goulston`, su portal, trozo de delantal, timestamp aproximado, `aqui_estoy`, `chalk_seen`, persecución `caught()`, transiciones y flags. **No alterar el canon de la carta.**
2. Añadir una capa documental (`goulston_record`) que indique la existencia de un grafiti distinto, potencialmente incitador, y su procedencia/estado incierto. Evitar pintar una injuria étnica legible en pantalla como elemento decorativo. Si se ofrece transcripción histórica exacta, que sea sólo en documento contextualizado y cuya variante se identifique como discutida, nunca como interpretación aprobada por el juego. Priorizar una descripción sin insultos visibles.
3. La expresión `HERE I AM` aparece exclusivamente como **visión subjetiva de Thomas** sobre la pared húmeda, reflejo o caligrafía superpuesta fugazmente. Antes/después se conserva el registro histórico. La segunda lectura permite reconocer la mano pero no entrega nueva prueba objetiva de autoría policial.
4. Cuaderno separa `goulston_historic` (informe/testimonio policial, fiable dentro de la fuente) y **pista previa** `aqui_estoy` (percepción sobrenatural, no corroboración independiente). `aqui_estoy + nat_voz` sigue siendo posible; su conclusión debe declarar vínculo sugestivo, no autoría demostrada.
5. Timing crítico: la secuencia de persecución y el `caught()` deben seguir funcionando. La lectura del grafiti opcional o contextual no añade gate obligatorio; jugadores de old saves con `chalk_seen=true` mantienen pista y progreso.
6. Si se usa una decisión del jugador, que sea “¿qué anoto como hecho?”, no “¿aceptas la interpretación xenófoba?”. Nunca trivializar el riesgo real de violencia contra la comunidad judía.
7. Arte: usar superposición transitoria separada de capa de evidencia, sin reescribir el fondo persistente con `HERE I AM`; `reduceMotion` cambia a fundido, no parpadeo. No introducir más que una interacción nueva y una percepción.

**Tests:** `Goulston 1st/2nd`, sane/low-sanity, historial sin y con `chalk_seen`, pista `aqui_estoy` inalterada, `caught()` una sola vez, no cadenas ofensivas en dibujo general, percepciones no cuentan como fuentes forenses, `canLeaveMitre` igual, no bloqueo tras cerrar documento.

**Veto Opus:** si al jugar parece que `HERE I AM` es el grafiti histórico documentado, o la escena convierte antisemitismo real en prueba culpable, `CHANGES_REQUESTED`.

## FASE 06 — El doble acontecimiento del 30 de septiembre: cronología y jurisdicción

**Archivos:** `web/src/scenes/mitre.js`, `web/src/story/chapters.js`, `web/src/story/evidence.js`, `web/src/story/data.js`, `web/src/scenes/goulston.js` si interacción, tests.

**Objetivo:** que Elizabeth Stride deje de ser sólo una línea de Watkins, sin crear otro escenario grande ni explotar el cuerpo. Una subinvestigación de 2–4 min integrada en Mitre Square.

**Requisitos:**
1. Incorporar una comunicación fechada de Berner Street con identidad de Stride y otra fuente discrepante; contrastar con el estado de Eddowes. Horarios históricos aproximados, no precisión ficticia sin justificación (Stride ~1:00, Eddowes hallada ~1:44).
2. Mostrar que el jugador **no puede demostrar** que el mismo hombre cometió ambos asesinatos sólo por proximidad temporal. Tres interpretaciones disponibles: probablemente vinculados / evidencia insuficiente / no relacionada por ahora, revisables.
3. Contrastar **dos** dimensiones entre testimonios: tiempo y oportunidad, sin inferir velocidades/caminatas inventadas. Mantener camino a Goulston y badge de City Police.
4. Watkins y Pike representan jurisdicciones distintas; bastará un desacuerdo profesional sobrio, no interminables líneas de “explicación histórica”.
5. Reutilizar actores, una carta/mensaje breve y cuaderno; añadir hotspot sólo si sirve a una acción distinta.

**Tests:** sin subpuzzle el camino viejo termina; resolviendo se registra `double_event_assessment`; jamás conclusión factual de culpabilidad conjunta automática; sin loops con `trozo`, `testigo`, `mitre_badge`.

## FASE 07 — «Dear Boss»: carta, prensa y razonamiento de autoría (CANON A)

**Archivos:** `web/src/scenes/room.js`, `web/src/story/chapters.js` (`writeC3a`, `compareHands`), `web/src/story/{data,theories,positions}.js`, `web/src/scenes/greaves.js`, `web/STORY_BIBLE.md`, tests.

**INAMOVIBLE:** Thomas escribió físicamente la carta, **no** sólo un borrador que un periodista copió, no fue una falsificación independiente. Mantener fechas 24/25→27→difusión tras 30.

**Requisitos:**
1. Periodismo de la época: incorporar sospecha **in-world** de que la carta es un engaño o campaña de prensa; no convertir esa sospecha en verdad canónica. Las pistas objetivas y el resultado final conservan autoría Thomas.
2. Puzle de caligrafía actual admite `greaves_like`, `inconclusive`, `self_recognition` (segunda lectura). Reforzarlo con dos categorías: parecido caligráfico **vs identificación de autor**. No forzar acusación a Greaves; no dar nombres nuevos.
3. Redactar “indicios” distintos: tinta roja sobre dedos, pliegos faltantes, semejanza de escritura, fecha de recepción, manuscrito original vs reproducción periodística. No utilizar tinta roja como prueba histórica absoluta si sólo es un dato del canon interno.
4. Añadir una decisión investigativa revisable, `letter_author`, con posturas: muestra insuficiente / pudo salir de mi cuarto / se parece a Greaves. No permitir confirmar a Thomas culpable por criterio del jugador antes de la revelación; conservar subtexto.
5. Recompensa para investigación cuidadosa: Greaves/Pike reconocen que Thomas no condenó a nadie por letra; la segunda lectura exhibe una evidencia adicional sin diálogos tutorializantes.
6. No cambiar `writeC3a` timestamps ni los finales. No sumar documentos largos por encima de una interacción con significado.

**Tests:** cinco formas de análisis, primera y segunda lectura, fechas visibles, save/compat, teoría previa y cambio, `handwriting_assessment` existente preservado, autoría Thomas inequívoca en la verdad final.

## FASE 08 — Black Ditch: geografía, arquitectura y ley sobrenatural

**Archivos:** `web/src/scenes/{foreshore,room,seance,knackers,goulston}.js` según pertinencia, `web/src/art/{build,paint,props}.js` sólo si necesario; `web/src/story/data.js`, `web/STORY_BIBLE.md`, ledger y tests.

**Dato histórico:** Black Ditch fue un curso de agua real hacia Limehouse, desviado y convertido en alcantarillado/canalizaciones, **completamente entubado antes de 1851** según investigación arqueológica. En 1888 no representarlo como un amplio río abierto atravesando Whitechapel. El Támesis y posibles bocas de desagüe siguen siendo escenarios plausibles en el estuario, pero detalles físicos requieren documentación.

**Requisitos:**
1. Mostrar una **red soterrada** que conecta símbolos narrativos (goteras, rejillas, sótano, canalización, desembocadura); nunca introducir un mapa que demuestre un itinerario criminal imposible.
2. Un croquis antiguo de ingeniería/drenaje **claramente ficticio** hallado en documento existente puede mostrar trazado esquemático Spitalfields→Whitechapel→Stepney→Limehouse, respetando naturaleza canalizada; no reproducir un mapa histórico falso como exacto.
3. Añadir como máximo 2 interacciones opcionales ambientales con lecturas distintas antes/después de la comprensión: ruido que se calla, desagüe que devuelve una palabra, tubería vinculada a la voz. Nunca dar nuevas reglas sobrenaturales que contradigan respuesta voluntaria.
4. Wren sabe de la superstición local por experiencia, no porque tenga acceso a historia 1866/1879. Su saber ha de ser incompleto y personal.
5. Reusar audio procedural, niebla y reflexiones. No pantalla nueva de mapa si el coste no se justifica.

**Tests:** regla 1866/1879 intacta; no se declara una entrada nueva en noviembre; cordura no produce pista falsa obligatoria; offline.

## FASE 09 — Víctimas: humanidad, memoria y peso moral

**Archivos:** `bucks_row.js`, `hanbury.js`, `mitre.js`, `room.js`, `chapters.js`, `millers.js`, `data.js`, STORY_BIBLE, ledger y tests.

**Requisitos:**
1. Una caracterización de **cada una de las cinco víctimas** basada en evidencia documentada o en ficción claramente contextualizada: Polly (alojamiento, sombrero, hijos); Annie (trabajos/condición vulnerable, detalles cotidianos); Elizabeth (origen sueco); Catherine (Kent/hops/John Kelly); Mary Jane (vecinos, su canto reportado).
2. Nunca inventar una acusación histórica, cita textual o detalle íntimo documentado si la fuente no lo respalda. Una interacción física y una respuesta humana tienen preferencia frente a un documento de 10 líneas.
3. Si ya existe un diálogo que aporta lo mismo, **sustituir**/pulirlo, no duplicar. Narración y violencia contenidas; evitar contemplación morbosa de lesiones y “trofeos” como fin en sí.
4. Una recompensa emocional **posterior**: Thomas o Wren recuerdan un detalle concreto de las víctimas en el epílogo/lectura 2 sin transformar a Wren en narradora de la historia.
5. Los objetos existentes conservan sus mecánicas y decisiones (peine, anillos, pañuelos); no agregar 5 ítems permanentes al inventario.

**Tests:** los cinco nombres humanos aparecen al menos una vez en diálogo/documento accesible; primer recorrido no añade más de una exposición nueva por víctima; no contradicciones históricas; epílogo no atribuye certeza de autoría histórica fuera de ficción.

## FASE 10 — Pacing de intro, escenas y diálogos

**Archivos:** `web/src/story/intro.js`, `web/src/story/chapters.js`, escenas seleccionadas, `web/src/engine/{ui,metrics}.js`, styles, tests.

**Requisitos:**
1. Medir con reproducción **normal** el control inicial y la primera deducción; si el prólogo documental demora, comprimir o hacerlo interactivo sin retirar atmósfera. No depender de que el jugador sepa saltar el intro.
2. Evitar tres pantallas seguidas que reiteren contexto. Auditar todas las llamadas `G.think`, `G.say`, `G.card`, `G.doc`: eliminar lo que describe lo ya visible/sonoro, reafirma objetivos, explica una teoría antes de formularla o repite un hecho sin función nueva.
3. Máxima prioridad a *turnos conversacionales* y no únicamente caracteres. Mantener voz de cada personaje; Thomas seco, Pike contenido, Brennan defensivo, Greaves profesional ambiguo, Wren concreta, Wexley vulnerable y perturbadora.
4. Conservar cinematografía útil; permitir interrumpir tarjetas no críticas sin que un click arrastre elección involuntaria.
5. Interacciones que no progresan reciben feedback breve y contextual; ninguna “acción muda” que parezca un botón roto.
6. Audiovisual: reducir drone constante en escenas ordinarias, dejar silencios auténticos, emplear sonido de agua sólo donde haya motivo diegético.
7. Reemplazar esperas vacías por actuación mínima NPC/cámara cuando éstas comunican algo; no animar todo artificialmente.

**Tests:** recuentos antes/después por cada ruta; porcentaje de diálogo que cambia rama, tarjetas saltables; `FAST` y modo real sin inputs arrastrados, primera acción disponible; tests de métrica. **Opus** debe aprobar cada eliminación narrativa sensible.

## FASE 11 — Dirección cinematográfica procedural y puesta en escena

**Archivos:** `src/engine/{game,renderer,actor,life}.js` sólo si imprescindible; `src/art/*`; escenas y audio.

**Objetivo:** aprender de *REPLACED* la composición y el movimiento de escena, **sin** incorporar combate ni plataformas.

**Requisitos:**
1. Diseñar un `shot list` breve en `web/docs/V4_SCENE_DIRECTION.md`: intro, hallazgo de Polly, primer encuentro Wren, examen de Annie, mesa de Wexley, salida de Goulston, persecución, expediente, orilla, firma. Por toma: foco, acción, silencio, entrada/salida, max duración, modo reducido.
2. Utilizar cámara existente (`G.zoom`, `camFocus`, actores): distinguir plano abierto de investigación, plano medio en confrontación, plano cercano para revelaciones; evitar punch constante.
3. Añadir como máximo 1–2 variaciones de entorno por escenario clave, gobernadas por flags/seen y restaurables; no `Math.random()` para cambios con significado narrativo.
4. Reducir Motion: fundidos, no flashes, no cámara temblorosa. Calidad baja mantiene evidencias visibles, contraste y legibilidad.
5. No usar fotos/elementos con licencias dudosas; respetar arte procedural existente.

**Tests:** smoke todas las escenas y variantes, arte limpio sin gráficos no inicializados, layers cacheadas invalidadas por variant cuando cambie escena, móvil calidad baja, `reduceMotion` ruta entera.

## FASE 12 — Cordura como interpretación, no salud punitiva

**Archivos:** `web/src/story/perception.js`, `story/theories.js`, `scenes/*.js` sólo donde se active, `game.js`, `ui.js`, tests.

**Requisitos:**
1. Mantener bandas 65/35, reportadas por percepción. No modificar arbitrariamente los umbrales sin registros de playtest; nada de game over por cordura baja.
2. Con cordura alta: ventajas forenses (marcas, lectura precisa); con baja: señales del Ditch, tensión auditiva, dudas de interpretación. **No** falsificar pistas objetivas ni esconder una pieza obligatoria.
3. Resaltar en UI cuando percepción subjetiva ≠ testimonio documental; el mismo dato no debe contar doble como fuente independiente.
4. Evitar que todas las interacciones resten cordura hasta 0 demasiado pronto: analizar curvas en recorridos exploratorios; no calibrar exclusivamente con `FAST`. Redactar recomendación si se requieren ajustes.
5. Visiones sin parpadeos bajo `reduceMotion` ya están corregidas: preservar y ampliar cobertura, no reimplementar.

**Tests:** 0, 10, 35, 36, 64, 65, 100; progreso íntegro, no UI que suplante verdad como falsa, reanudación no modifica banda salvo nueva acción; pruebas automatizadas de control de visión.

## FASE 13 — Persecución del capítulo III: conectar urgencia con investigación

**Archivos:** `web/src/scenes/alleys.js`, `web/src/story/chapters.js` (`caught`, `endChase`), `mitre.js`, `room.js`, `story/progression.js`, tests.

**Requisitos:**
1. Mantener 3 cruces temporizados, `chase_mistakes`, `chase_outcome=clean|spotted|injured`, y consecuencias ya integradas. No reiniciar sobre otro minijuego.
2. Introducir un **coste informativo o una evidencia contextual** diferencial para ruta limpia/vista/herida. Nunca bloquear progreso por mal resultado; el jugador debe poder llegar al final con cualquier desenlace.
3. El error no debe hacer que la policía “tenga superpoderes” ni crear salto espacial imposible; diseñar relación coherente con calle/linterna/testigos.
4. Persecución sin pánico táctil injusto: 5,6 s táctil existe; medir touch reales, permitir alternativas accesibles como tiempo extendido sólo si se demuestra necesidad (sin eliminar presión para todos).
5. Terminar con inversión de perspectiva: se persigue al protagonista, y una pista visual posterior debe hacerlo comprensible sin monólogo explicativo.

**Tests:** 0,1,2,3 fallos, clock, 1866/1879, reinicio mid-chase sólo desde checkpoint seguro, Android táctil; la información se puede recuperar por otra vía si perdió una evidencia de la persecución.

## FASE 14 — Cuarto capítulo y final: deducir antes de que el guion confirme

**Archivos:** `web/src/scenes/{greaves,foreshore,millers}.js`, `web/src/story/{chapters,progression,theories,data}.js`, `web/src/engine/signature.js`, tests.

**Requisitos:**
1. El jugador debe poder formular una interpretación sospechosa **antes** de que Greaves actúe como exposición definitiva; no revelar autoría Tomás prematuramente. El expediente sigue funcionando como evidencia mayor y Greaves conserva incertidumbre humana sobre causa.
2. La acción con Pike conserva `final_intent` y las consecuencias visuales ya implementadas. Acentuar repercusión humana mediante puesta en escena, no tres diálogos más.
3. Gate de fin: 3 fuentes **independientes** de `FINAL_SOURCES`, con evidencia matizada después de corregir lateralidad. No convertir percepciones (`aqui_estoy`) en fuente forense independiente. No exigir 3 pistas nuevas a guardados antiguos.
4. En el río, “Responder”, “Callar”, “Taparme la boca” y “Todavía no” mantienen sentido; **ninguna** causa la entrada del Huésped en 1888. `water_resistance` representa actitud, no cura.
5. Firma: `morphFrames()` termina en `JACK`, sin teclado superpuesto en Android, con opción de movimiento reducido para animación muy larga si es necesario; impedir elecciones dobles.
6. El nombre “Jack” como fenómeno social se comunica por carta/periódicos/reacción, no por discurso explicativo del monstruo. Recuperar una pista de la primera lectura con sentido nuevo en epílogo.
7. Mantener Mary Jane Kelly y su trágico destino histórico; ninguna rama la salva ni altera cinco canónicas.

**Tests:** final con cada 1866/1879 × cada Pike intent × cuatro actitudes del río × tres bandas de cordura (matrix por pares eficiente, no necesariamente 72 travesías completas); `f_barro` no cuenta; firma en vacío/acento/emoji; ningún nuevo final.

## FASE 15 — Segunda lectura valiosa sin repetición artificial

**Archivos:** escenas existentes con `G.second()`, `web/src/story/{chapters,data,theories}.js`, cuaderno, tests.

**Requisitos:**
1. Conservar las cinco escenas/momentos de segunda lectura ya añadidos (prólogo, Pike, Wexley, carta, esqueleto); no duplicar de manera innecesaria.
2. En cada capítulo, ofrecer **una interacción distinta** (no sólo frase añadida) que reinterprete un hecho anterior; ejemplos: una cronología vista desde quien llega antes, la inscripción subjetiva de Goulston, la nota médica corregida de octubre, el manuscrito con la mano de Thomas.
3. Los puzles conocidos se pueden acortar solo en segunda lectura con marca `Game.read()`, conservando pistas y flags. `second=true` manual sin `read` no habilita shortcut.
4. El texto distinto debe recompensar atención al detalle, no leer el final de antemano en el primer capítulo. La duración prevista debe ser menor que primera, sujeto a playtest.
5. No nuevos ítems obligatorios ni ruptura de saved checkpoint `second`.

**Tests:** completitud first/second, atajos legítimos, rutas 1866/1879, cinco momentos, sin filtración de textos second a primera lectura, autosave antiguo.

## FASE 16 — UX, accesibilidad, comportamiento en Windows/Android

**Archivos:** `web/src/engine/{ui,game,prefs}.js`, styles, html, `web/android/*` y builds sólo si hay bug comprobado.

**Requisitos:**
1. Medir precisión de hotspots en escalados reales (1280×720, 1920×1080, smartphone 16:9/20:9 landscape, DPI alto), incluyendo safe areas, overlays, teclado de nombre, doble toque, cambios de orientación y hardware back.
2. En UI de evidencias: legibilidad mínimo razonable, contraste, estado escogido y foco; ningún texto desaparece por cerrar su panel. Recordar arreglo `hint()` actual.
3. Acciones con móvil: primera pulsación que arma hotspot, segunda ejecuta; comprobar que nuevos overlays no roban la segunda. Confirmar cierre/retorno de inspección con back.
4. Opciones de velocidad, texto ya leído, movimiento reducido, vibración y volumen deben sobrevivir a save y nueva partida. Puertas bloqueadas reportan requisito sin mostrar solución spoilers.
5. Aclarar temporalmente una deducción sin HUD intrusivo; no incluir tutorial largo modal.
6. No cambios en packaging salvo fallo. Comprobar offline, refresh, app resume y licencia/asset content.

**Tests:** inspección de escena real en desktop, WebView Android físico cuando disponible; screenshot/registro con escena, resolución, GPU si hay issue; builds APK/Windows sólo reportar `BUILD_OK` tras compilación real.

## FASE 17 — Métricas y playtesting ciego (criterio de salida)

**Archivos:** `web/src/engine/metrics.js`, `web/tools/read-count.mjs`, nuevo `web/docs/V4_PLAYTEST_PROTOCOL.md`, execution log y tests.

**Requisitos:**
1. Instrumentar localmente, sólo con `?metrics`, tiempos por capítulo, conversación, primera acción relevante, primera deducción, acciones ignoradas, intentos de pistas, retrocesos, tiempo de espera en tarjetas, tiempo de cuaderno y resultado final. No datos personales, no Analytics.
2. Separar `FAST` (verifica transiciones) de **normal** (verifica experiencia). Una suite verde no sustituye un playtest.
3. Protocolo para mínimo 3 perfiles: veterano point & click, jugador poco familiarizado y persona con conocimientos del caso. No mostrarles guía; grabar únicamente con consentimiento explícito.
4. Hoja de observación: primer control, primera deducción, capítulo donde se pierde, hipótesis del jugador sobre culpable, momento en que sospecha Thomas, elección Brennan, si entendió por qué `HERE I AM` no era el grafiti histórico, si comprende la regla 1866/1879, confusión firma; sensación de miedo 1–5.
5. Condiciones de aprobación basadas en evidencia: cero softlocks reproducibles, cero información que presuponga futuro (cronología), cero pérdida de guardados, interacción básica estable en móvil, final comprensible sin guía, algún razonamiento propio en C1/III, duración documentada. Pacing objetivo 45–60 solo si el material lo soporta.
6. Opus emite revisión final `READY_FOR_PLAYTEST`, `READY_FOR_RELEASE_CANDIDATE` o `BLOCKED`; jamás declarar `RELEASE_READY` sin una prueba funcional completa que cubra Android si se distribuye APK.

---

# F. PRUEBAS DE ACEPTACIÓN IMPRESCINDIBLES POR DOMINIO

## F1. Test matrix de progreso

| Área | Matriz mínima | Condición de éxito |
|---|---|---|
| Prólogo | responde 1866 / calla hasta 1879 | `entry_year` correcto; ninguna entrada sobrenatural adicional |
| C1 | prudente/sospechoso/indeciso; Pike/Brennan; rondas opcionales | capítulo II siempre accesible; decisiones guardadas |
| C2 | peine Pike/Thomas; golpe correcto/con errores; agotamiento de ayuda | sesión única; cierre accesible; inventario coherente |
| Brennan | severe/injured/protected; antes/después de testimonio casera | Wren/epílogo no contradicen actos |
| C3 | handwriting Greaves/inconcluso/propio 2ª; persecución 0–3 errores | Goulston llega, efecto social/recuerdo persiste |
| Goulston | first/second; baja/alta cordura; old save `chalk_seen` | `aqui_estoy` subjetivo; grafiti histórico separado; persecución sin duplicación |
| Final | 3 fuentes independientes; 2 fuentes; `f_barro` solo | puerta final no se abre con fuentes insuficientes |
| Epílogo | 3 Pike intents × actitudes del río | J-A-C-K, misma tragedia, consecuencias diferenciadas |
| Relectura | `Game.read()==true/false`; respuesta 1866/1879 | atajos sólo legítimos, detalles exclusivos no se filtran |
| Guardados | legacy c1/c2/c3/c4; new flags ausentes/parciales | sin throw, sin repetición de eventos, sin pérdida de pistas |
| Cordura | 0/10/35/36/64/65/100 | todos los caminos resolubles, band coherente |
| Accesibilidad | reduceMotion yes/no; calidad baja; teclado móvil | sin parpadeos excesivos, cues visibles y no duplicaciones |

## F2. Pruebas históricas y de continuidad

- Buscar todas las apariciones de `HERE I AM`: si aparece como grafiti **histórico** sin etiqueta de percepción, falla.
- Buscar afirmaciones “el asesino era zurdo”, “era cirujano”, “la misma persona cometió ambos crímenes” sin modalización documental: evaluar y matizar o etiquetar narrador subjetivo.
- Guard de fechas: `Swanson`/duda posterior al 19-10 jamás en escenas fechadas antes.
- `Dear Boss` authored by Thomas 24/25, received 27, difusión después 30: tests de canon/asset narrativa, sin final periodista autor.
- El Black Ditch en 1888 es curso de agua canalizado/alcantarillado; no mapa nuevo de río abierto en Whitechapel.
- No atribuir texto exacto a víctimas sin fuente. No cambiar destino final histórico de Mary Jane Kelly.
- El documento de escena “inscripción antisemita” se presenta con contexto sobre tensión y falta de evidencia de autoría; no se sugiere que todo un colectivo sea sospechoso.

## F3. Pruebas de calidad y pacing

- Prueba de frases duplicadas por escena: misma información explicada dos veces por voz distinta debe tener **razón dramática**, o condensarse.
- Conteo `G.say`/`G.think` por ruta y capítulo; contraste baseline y V4. Más texto puede ser válido si reemplaza tareas mudas por decisiones significativas. Reportar ambos recuentos, no sólo unidades globales.
- Cada puzle principal tiene explicación de error que remite a una prueba; no “incorrecto” sin orientación ni confirmación de culpabilidad no probada.
- Cada escena nueva es accesible en teclado/táctil; texto de 1888 español contemporáneo comprensible sin utilizar terminología técnica moderna en documentos de época.
- Repetir un hotspot no debe volver a consumir el mismo objeto o duplicar flag `*done`.
- Una puerta bloqueada explica el requisito al jugador sin que el lector del guion sea necesario para completar.

---

# G. ENTREGABLES Y CONTROL DE CALIDAD

**Archivos exigidos en repo al finalizar:**

1. Código en `web/src` y ajustes mínimos de estilos/interfaz.
2. Pruebas nuevas `web/tests/unit/*` y `web/tests/scenarios/*`, integradas automáticamente por `web/tools/test-all.mjs`.
3. `web/docs/V4_EXECUTION_LOG.md`: por fase SHA, archivos, tests con salida, modelo confirmado, revisión/veredicto Opus, riesgos, estado `CODE_COMPLETE`/`TESTED`.
4. `web/docs/V4_HISTORICAL_LEDGER.md`: tabla hecho, fuente y año, grado de certeza, escena, riesgo y cómo se presenta; fuentes con URL, no meramente “según internet”.
5. `web/docs/V4_STATE_SCHEMA.md`: campos/flags nuevos, migración, estados y compatibilidad.
6. `web/docs/V4_SCENE_DIRECTION.md`: lista corta de montaje, por escena.
7. `web/docs/V4_PLAYTEST_PROTOCOL.md`: objetivos, métricas, checklists desktop/táctil y observación de jugadores.
8. `web/STORY_BIBLE.md` actualizado **sin cambios de canon** y `web/GUION.md` regenerado con `node web/tools/script/export.mjs`.
9. `web/HANDOFF.md` y `web/README.md` adaptados: comandos, estado, rutas y limitaciones.
10. Resumen final para propietario: before/after de UX, conteo real de palabras por ruta, duración normal observada **si la hay**, pruebas y builds efectivamente ejecutadas, riesgos abiertos, SHAs y próximos pasos.

**Convención de commits:** `feat(v4-01): ...`, `feat(v4-02): ...`, `fix(v4-05): ...`, `test(v4-17): ...`. Commit tras revisión Opus. No rebase destructivo de rama compartida, no force push, no push a main. Puede hacerse **push a la rama de trabajo autorizada `reboot/web-el-huesped`** después de review y suite verde, sin sobrescribir commits ajenos; si se usa rama hija, indicar HEAD origen y ruta de integración, nunca hacer merge automático a `main` ni desplegar a producción sin autorización.

**Regla de salida de cada fase:**
```
PHASE: V4-XX
IMPLEMENTER: Haiku (modelo efectivo reportado)
OBSERVER: Claude Opus 5.5 (modelo efectivo reportado)
FILES: ...
NEW FLAGS / SAVE MIGRATION: ...
TESTS RUN: [comando + resultado real]
BROWSER / DEVICE: [qué se probó; o NOT TESTED]
HISTORICAL DELTAS: [documented/disputed/fiction]
OPUS REVIEW: APPROVED | CHANGES_REQUESTED | BLOCKED
OPEN RISKS: ...
COMMIT SHA: ...
STATUS: CODE_COMPLETE | TESTED | BLOCKED
```

---

# H. HISTORIA: EVIDENCIA, DISPUTA Y FICCIÓN (FUENTES BASE)

Estas referencias informan las decisiones históricas; **no son una licencia para copiar extensos textos ni asumir que una transcripción discutida es verdad única**. Opus valida citas, fechas y formulaciones contra fuentes al implementar cada escena. Si hay fuentes incompatibles, registrar ambas y optar por ambigüedad honesta.

| Tema | Fuente | Consecuencia de diseño |
|---|---|---|
| Black Ditch y canalización anterior a 1851 | Stephen White / Louise Rayner, *London and Middlesex Archaeological Society Transactions* 74, 2023, publicado en UCL: https://discovery.ucl.ac.uk/id/eprint/10209185/1/035-062%20Stepney%20Way%2C%20Whitechapel.pdf | Canal soterrado, no río abierto en Whitechapel 1888 |
| Black Ditch en investigación urbana | Crossrail, Whitechapel Written Scheme of Investigation: https://learninglegacy.crossrail.co.uk/wp-content/uploads/2020/01/C140-WHI-Whitechapel-Station-Written-Scheme-of-Investigation.pdf | Apoyo al trazado y arqueología; no plano inventado representado como exacto |
| Grafiti de Goulston y decisión de borrarlo | Carta de Warren al Home Office, 6-11-1888: https://www.casebook.org/official_documents/warrenlt/ | No coincide con `HERE I AM`; contextualizar temor a violencia antisemita y autoría incierta |
| Duda posterior sobre zurdera | Resumen con referencia al informe Swanson 19-10-1888, HO 144/221/A49301C/8a: https://www.casebook.org/dissertations/dst-recanon/?printer=true | Opinion inicial de Llewellyn discutida más tarde; cronología exacta |
| Informe Swanson y contexto | https://www.casebook.org/police_officials/donald_swanson/ | Enlace a fechas y autoridades; no justificar documentos inventados como textuales |
| Cronología de carta, Double Event, víctimas | https://www.casebook.org/timeline/ | Línea temporal; fechas y diferencias de testimonios |
| Claude Code agent teams | https://code.claude.com/docs/en/agent-teams | Lead Haiku y reviewer Opus en sesiones reales, no colaboración simulada |
| Claude Code custom agents y modelo | https://code.claude.com/docs/en/sub-agents y https://code.claude.com/docs/en/model-config | Definiciones de agentes en `.claude/agents`, `model: claude-opus-5-5` |

**Cautelas:** para escenas médicas, “formación anatómica” está debatida; documentar ambas interpretaciones en lugar de tratarla como absoluta. La carta `Dear Boss` como documento histórico es de autoría disputada; **dentro de este videojuego Thomas es su autor** por canon autorizado. El mensaje `HERE I AM` es **ficción sobrenatural**, no el grafiti real. Las identidades de policía y testigos históricos no deben adoptar hechos ficticios sin que el juego marque dramatización.

---

# I. HERRAMIENTAS Y COMANDOS MÍNIMOS

Desde la raíz `HorrorPlay/`, tras verificar entorno:

```bash
# baseline / tests generales
node web/tools/unit.mjs
node web/tools/test-all.mjs
node web/tools/test-all.mjs --quick
node web/tools/walk.mjs
node web/tools/walk.mjs second
node web/tools/walk.mjs alt

# medidas de narración (ajustar syntax según implementación actual de read-count)
WALK_LOG=web/dist/v4-walk.log node web/tools/walk.mjs
node web/tools/read-count.mjs web/dist/v4-walk.log

# fuente derivada de guion (no editar GUION.md a mano)
node web/tools/script/export.mjs

# navegador local
python web/tools/serve.py 5317
# /?metrics para medición local; /?dev para errores visibles

# solo cuando entorno esté disponible; registrar error real en vez de simular éxito
bash web/tools/build-apk.sh
bash web/tools/build-win.sh
```

Usar tests existentes como red de seguridad, no reemplazarlos. Evitar editar fixtures antiguos para hacerlos coincidir con resultados nuevos; conservarlos como prueba de compatibilidad.

---

# J. ORDEN DE APROBACIÓN Y DECISIONES YA TOMADAS

**Canon A: APROBADO.** Thomas escribe carta, Huésped se propaga como nombre. Otras variaciones de autoría: **PROHIBIDAS**.

**Diseño de mejoras mecánicas:** 3 investigaciones nucleares, evidencias contradictorias y decisiones revisables; **APROBADO COMO DIRECCIÓN**. Los textos concretos los valida Opus antes de codificar.

**Historia de las víctimas:** respeto, concreción y fuentes; no añadir gore o violencia gratuita.

**Objetivo de tiempo:** 45–60 min como hipótesis para playtesting; si resulta mejor en 35–45, **priorizar calidad** y documentarlo.

**Arquitectura:** código web actual, sin framework nuevo, sin backend, sin monetización, sin dependencias externas.

**Proceso:** Haiku escribe, Opus 5.5 observa, objeta y aprueba, fase por fase. Transparencia de agentes y métricas; no falsificar resultados.

**Orden operativo:** empezar con F00, luego F01–F17 secuenciales. Si una fase necesita datos o cambios de otra, Opus debe explicitar dependencia. La revisión documental e histórica no puede posponerse hasta el final.

*Fin del documento vinculante. Las fases constituyen la especificación completa; no sustituirla por una reescritura improvisada o una lista superficial de tareas.*
