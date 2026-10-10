# V4 — Registro de ejecución

Plan: `docs/EL_HUESPED_PLAN_MAESTRO_V4_GAMEPLAY_HISTORIA_PACING.md`. Prompt de arranque: `PROMPT_EJECUCION_CLAUDE_V4.md`.

## 1. Modo de ejecución (declarado)

| Elemento | Plan exige | Lo que hay realmente |
|---|---|---|
| Sesión principal (lead implementador) | Haiku (`claude --model haiku`) | **Opus 5.5** (la sesión no puede cambiar de modelo). Deviación explícita. La implementación de las fases se delegará a subagentes Haiku cuando se apruebe la fase; la coordinación queda en esta sesión. |
| Equipo con Agent Teams | Sí, interactivo, con `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | **No.** Esta sesión no tiene el flag ni es un arranque interactivo de `claude`; no hay teammates reales. |
| Observer | Agente `opus-55-observer` (`model: claude-opus-5-5`, read-only) | **No cargado.** El agente existe en `.claude/agents/` pero se crea después del arranque de la sesión; el tipo no aparece en la lista disponible (`Agent type 'opus-55-observer' not found`). |
| Modo usado | — | **MODO SUBAGENTES EMULADO**: subagente `general-purpose` con `model: opus` y las instrucciones del observador pegadas en el prompt, con restricción de solo lectura. |
| Modelo del observador | `claude-opus-5-5` verificado | El subagente declara ser Claude Opus 5.5 según su contexto de entorno. **No verificable desde aquí** más allá de esa declaración; se registra así. |

Consecuencia: no se declara supervisión en modo equipo. Las revisiones de esta fase son de un subagente Opus emulado, con veredicto literal registrado en §5.

## 2. Estado de git y entorno

| Dato | Valor |
|---|---|
| Rama | `reboot/web-el-huesped` |
| HEAD de referencia del plan | `92a5413f5d0cb2a4be435685d30d27d134ca9c41` |
| HEAD al empezar F00 | `965de7461b9c1c3d3a6adaaf27ba0defa8345715` (`chore(v4): install V4 team package …`) |
| `git show --stat 965de74` | 5 ficheros, todos fuera de `web/`: `.claude/agents/haiku-implementer.md`, `.claude/agents/opus-55-observer.md`, `LEEME_ARRANQUE.md`, `PROMPT_EJECUCION_CLAUDE_V4.md`, `docs/EL_HUESPED_PLAN_MAESTRO_V4_GAMEPLAY_HISTORIA_PACING.md` (719 inserciones) |
| `git status --porcelain` al inicio de F00 | vacío |
| Cambios en `web/src`, `web/tests`, `web/tools` durante F00 | ninguno (`git diff -- web/src web/tests web/tools` = 0 bytes) |
| Cambios en `web/tests/fixtures` | ninguno (0 bytes) |
| Remoto | `origin/reboot/web-el-huesped` = `92a5413` (no se ha hecho push de `965de74`) |
| Node | v26.4.0 |
| Java | JDK 17 (`C:\jdk-17`) |
| `ANDROID_HOME` | `C:\Users\Gabriel\AppData\Local\Android\Sdk` |
| SO | Windows 11 Pro 10.0.26300, Git Bash |
| Hora de inicio | 2026-10-10T16:15:58-03:00 |

## 3. Procedimiento F00 (pasos 1–6 del plan)

| Paso | Qué pide el plan | Estado | Dónde está |
|---|---|---|---|
| 1 | Estado limpio, rama y HEAD | HECHO (ver §2) | §2 |
| 2 | `test-all` y `unit` con salida, timestamps y SHA | HECHO | §4 |
| 3 | Baseline de texto (`WALK_LOG`, `read-count`) | HECHO, con dos medidas distintas (ver §4.2) | §4.2 |
| 4 | Inventario de hotspots, entradas, visiones, tarjetas, diálogo | PARCIAL: IDs, dependencias de flags y recuentos sí; comportamiento por hotspot (acción, primera visita, repetición, bloqueo, `use`) **no** | `web/docs/V4_F00_INVENTORY.md` |
| 5 | Ledger histórico con fuentes | HECHO como registro provisional; **ninguna URL verificada** | `web/docs/V4_HISTORICAL_LEDGER.md` |
| 6 | Auditar menú, guardados, APK, Windows, segunda lectura | PARCIAL: APK construido; Windows **falla**; menú/guardados/segunda lectura auditados por código, **no ejecutados en navegador ni en dispositivo** | §6 |

## 4. Evidencia

### 4.1 Pruebas (`unit` y `test-all`)

Salida literal guardada en `scratchpad/v4-baseline/` (fuera del repo). Resumen:

```
$ node web/tools/unit.mjs
37 pruebas bien, 0 mal                       (exit 0)

$ node web/tools/test-all.mjs                (exit 0; 16:15:58 → 16:17:23 incluidos unit)
PASS  unit   PASS  smoke   PASS  audio
PASS  scenario c1-minimal   calm   chapter3   comb-pike   compat   feedback   finale
PASS  scenario hint   hint-ui   integrity   mob   notebook   resume   sanity   seance   second-reading
PASS  walk   walk second   walk alt
```

Son 22 líneas `PASS`, ninguna `FAIL`. La duración mayor es `sanity` (≈32 s) y `finale` (≈21 s).

### 4.2 Texto recorrido (baseline F00)

Dos medidas, que no son comparables entre sí:

| Partida | `read-count` (texto dicho/pensado) | Líneas crudas de `window.LOG` (JSON `lines` de `walk.mjs`) | Log `WALK_LOG` (líneas) | Elecciones / rótulos / documentos (`read-count`) |
|---|---|---|---|---|
| Completa (`walk.mjs`) | 204 líneas, 9443 caracteres | 425 | 424 | 37 / 29 / 7 |
| Segunda lectura (`walk.mjs second`) | 209 líneas, 9542 caracteres | 430 | 429 | 37 / 29 / 7 |
| Alternativa (`walk.mjs alt`) | 54 líneas, 2492 caracteres | 125 | 124 | 13 / 7 / 1 |

Comandos (PowerShell, equivalente en Git Bash):

```
WALK_LOG=<ruta absoluta en el scratchpad> node web/tools/walk.mjs
node web/tools/read-count.mjs <ruta absoluta en el scratchpad>
```

**Desglose de las 425 entradas crudas de la partida completa** (revisión del observador, reproducida con `walk.mjs`):

| Tipo de entrada | Cantidad |
|---|---|
| Líneas dichas o pensadas | 204 |
| Elecciones | 37 |
| Rótulos | 29 |
| Documentos | 7 |
| `[aviso]` | 75 |
| `[golpes]` | 1 |
| `[firma]` | 2 |
| Marcadores del arnés `### escena:hotspot` (`tests/walkthrough.js:20`) | 70 |

Los 70 marcadores no son texto del jugador: **425 no es una medida de lectura.** Desde F00, la referencia válida de lectura es la de `read-count` (204 / 209 / 54). Las cifras de `walk` (425 / 430 / 125) solo sirven como volumen de entradas del arnés. Con el mismo desglose para la segunda lectura y la alternativa, el log queda reproducible.

**Por qué 334 y 425 no se comparan:** el contenido cambió en 16 commits, y el propio registro cambió; además `[aviso]` no estaba en `LOG` en `f04d1fa` (comprobado con `git grep` sobre `src/engine/ui.js` en ese commit). No es una regresión medida, es un cambio de qué se registra.

**Qué no ve `read-count`** (declarado por el observador y verificado en `tools/read-count.mjs`): documentos registrados solo como `[documento]` sin su texto; caracteres de elecciones; los rótulos `[aviso|documento|golpes|firma]`; texto de pistas, cuaderno, objetivos y toasts.

**Cifras antiguas no reproducidas:** `IMPLEMENTATION_STATUS.md` (líneas 33–46) cita 334 / 337 / 97 líneas para `walk`, `second` y `alt`. Hoy el JSON de `walk.mjs` da 425 / 430 / 125. Esas cifras se atribuyen a un estado anterior; no se usan como referencia.

**Llamadas de texto (estático, `grep -ohE` sobre `src`):** `G.think` 144, `G.say` 159, `G.voice` 16, `G.card` 25, `G.doc` 7, `G.choice` 28. `IMPLEMENTATION_STATUS.md` registra `G.think` 141: el mismo código da 144 en `f9549cb` y en todos los commits posteriores; la diferencia es de criterio de conteo. No se corrige el registro antiguo; se anota.

### 4.3 Builds

| Build | Comando | Resultado | Notas |
|---|---|---|---|
| APK | `bash web/tools/build-apk.sh` | **exit 0**, `web/dist/el-huesped.apk` (4,6 MB) | Construido, **no instalado ni probado en teléfono**. `VERSION_CODE` = `git rev-list --count HEAD`. |
| Windows | `bash web/tools/build-win.sh` (por defecto) → **exit 1**; `VERSION=1.0-rc1 bash web/tools/build-win.sh` → **exit 0** (`dist/ElHuesped.exe`, 5,8 MB) | `dist\win\Version.cs(1,12): error CS0647 … 'The version specified '1.0..0' is invalid'`. Causa: `VERSION` por defecto `1.0-rc` → `NUM="1.0"`, `RC` vacío porque `grep -o '[0-9]*$'` no devuelve nada, y la plantilla escribe `"$NUM.$RC.0"` (`tools/build-win.sh:8,20`). Fallo preexistente; no se corrige en F00 (no hay cambios de código). Se trata en F16. |

Los artefactos van a `web/dist/`, ignorado por git.

## 5. Revisión del observador (F00)

**Propuesta enviada:** la de F00 (solo lectura y documentación).
**Veredicto recibido:** `REQUEST_CHANGES` (sin P0). Informe completo de la sesión (no reproducido aquí).

Respuesta punto por punto:

| Hallazgo | Respuesta | Estado |
|---|---|---|
| P1-1 · Registrar HEAD, rama, status y `show --stat` | §2 | HECHO |
| P1-2 · Auditar menú, guardados, segunda lectura, APK y Windows; lo no ejecutado como `NOT RUN` con error | §6 | PARCIAL (el build de Windows sí tiene error real; el resto, ver §6) |
| P1-3 · Inventario de hotspots más completo (acción, primera visita, repetición, bloqueo, `use`, flags, tests; entradas, visiones, tarjetas, `insp:*`; `chapters.js` e `intro.js`) | Se entrega: IDs por escena (verificados: nº de `id:` menos la escena = nº de `act:`), flags por escena, tests que los nombran, recuentos de texto e ids de inspección (`polly`, `annie`, `kate`). **Falta** el comportamiento por hotspot. Acordado con el observador: F01 no toca escenas; **ninguna fase edita un `scenes/*.js` sin antes entregar la tabla de comportamiento de esa escena para revisión.** | CERRADO PARA F00 con esa condición |
| P1-4 · Ledger con Mitre/Watkins/Lawende, Stride/Eddowes con fecha de identificación, columna escena-vs-conocimiento, URLs marcadas `UNVERIFIED` | Hecho en `V4_HISTORICAL_LEDGER.md`. Las clasificaciones son provisionales (declarado en el documento). | HECHO, sin verificar fuentes |
| P2-1 · Esquema de estado completo (literales, deducciones, `?flags=`, `seen`, claves no saneadas, almacenamiento) | `V4_STATE_SCHEMA.md`. **Limitación declarada:** flags construidos dinámicamente no listados. | HECHO con límite |
| P2-2 · Medición: limitaciones de `read-count`, grep reproducible, hora de reloj y `node -v` | §4.2 y §2 | HECHO |
| P3-1 · Discrepancia 30–45 vs 45–60 min | Anotada aquí; no se edita `STORY_BIBLE.md` en F00 | ANOTADO |
| P3-2 · `corpse.js` como auxiliar | Tratado como módulo auxiliar en el inventario | HECHO |

Comprobaciones previas a F01 pedidas por el observador:

1. `unit` y `test-all` en verde con SHA y horas: **HECHO** (§4.1). Revisión F00 en `APPROVED`: **PENDIENTE** de una segunda revisión.
2. Sin cambios en `web/src`, `web/tests`, `web/tools`; fixtures sin tocar: **CUMPLIDO** (§2).
3. `V4_STATE_SCHEMA.md` confirma que `positions` y `revisions` no existen y fija su valor por defecto: **PARCIAL**. Confirma la inexistencia; el valor por defecto se fija en F01 al crearlos.
4. Test de idempotencia de `normalizeState` con todos los fixtures antes y después de F01: **PENDIENTE** (se escribe en F01, antes de tocar `investigation`).
5. Propuesta de F01 con textos revisados por Opus antes de `awake`: **PENDIENTE** (F01).
6. Comprobar que F01 no reutiliza IDs: **PENDIENTE** (F01).

## 6. Auditoría de F00 (paso 6)

| Área | Cómo se ha comprobado | Resultado |
|---|---|---|
| Menú | Lectura de `src/main.js` (entradas, `reduceMotion`, segunda lectura) | Código revisado; **NOT RUN** en navegador en F00 |
| Guardados | Lectura de `src/engine/game.js` §4 de `V4_STATE_SCHEMA.md`; fixtures de compatibilidad en `unit`/`scenario compat` | Código revisado; suite `compat`/`resume` en verde; **NOT RUN** en navegador |
| Segunda lectura | `walk second` y `second-reading` en verde | Verde en la suite; **NOT RUN** en navegador |
| APK | `build-apk.sh` exit 0 | Construido; **NOT RUN** en dispositivo (no hay teléfono conectado en esta sesión) |
| Windows | `build-win.sh` exit 1 | **FALLO REPRODUCIBLE** (§4.3) |

## 7. Pendiente antes de cerrar F00

1. Completar el comportamiento por hotspot (P1-3) escena por escena, empezando por las que toca F01–F04 (`bucks_row`, `hanbury`, `knackers`, `room`, `greaves`).
2. Segunda revisión del observador con este registro y los documentos.
3. Si el observador aprueba, F00 pasa a `CODE_COMPLETE` (sin cambios de código de juego) y se propone F01.

## 8. Estado

**F00: segunda revisión del observador `CHANGES_REQUESTED` (solo documentación, sin P0 ni P1); cambios aplicados en este diff.** Condiciones: (a) el diff toca solo `web/docs/V4_*.md`; (b) se cubren los puntos 2, 3 y 5 y los ids de inspección; (c) la tabla de comportamiento por hotspot queda como condición previa a editar cualquier escena. Aprobación de F00 tras comprobar este diff, según el observador. Ningún cambio de código de juego. Ninguna fase marcada `CODE_COMPLETE` ni `TESTED`.

**Riesgos residuales (observador):** el proceso se desvía del plan (coordinador Opus, no Haiku; sin equipo real); todas las URLs del ledger siguen `UNVERIFIED`; H-01, H-03, H-04 y H-05 siguen en el juego hasta F05/F06; el build de Windows falla por la versión por defecto (opcional: probar `VERSION=1.0-rc1`, sin cambio de código).

## V4-01 — implementación (pendiente de revisión)

Estado: **F01 CODE_COMPLETE (no TESTED).** Revisión del observador (Opus): **APPROVED con condiciones**; las condiciones de esa revisión están aplicadas en esta sección (scroll al desplegar, requisito 6 registrado como desviación aceptada, pendiente F16, etiqueta de Brennan). Sin commit ni push.

Etiqueta «Qué pensé de Brennan» (`QUESTIONS.br_suspect.title`): **no se muestra en ninguna parte.** Se deja para una fase posterior y no se elimina ahora.

SHA base: `7bf2928` (rama `reboot/web-el-huesped`). Alcance: posturas del jugador sobre las preguntas abiertas del cuaderno (`investigation.positions`, `investigation.revisions`), según la especificación aprobada de V4-01 y las decisiones del observador de esta ronda.

### Decisiones de esta ronda (observador: CHANGES_REQUESTED)

1. **Postura plegada (P1, opción a).** Cada pregunta visible es una línea plegada: botón con `aria-expanded` y `data-toggle`, texto «Mi postura: <etiqueta o sin postura> ▸» (▾ cuando está abierta; el glifo es mía). Pulsarla despliega el subtítulo, la línea «En el cap. I dije: …» (solo `br_suspect`, si `brennan_stance` existe) y las opciones; pulsarla otra vez la pliega. Solo una abierta a la vez, en `UI._openPosture` (no va a `state`, `localStorage` ni al guardado). Con `flags.awake`: sin botón, solo las líneas de lectura. El subtítulo ya no se repite en cada bloque plegado.
2. **Segunda lectura (P2, opción ii).** `setPosition` devuelve `false` si `flags.awake` o `flags.second`, sin escribir. `postureHtml` devuelve `''` con `flags.second`: ningún bloque, ningún `data-q` ni `data-toggle`.
3. **Render doble (P3).** El listener llama a `renderNotebook()` solo si `setPosition` devuelve `false`; si escribe, `game.setPosition` ya renderiza. Un render por pulsación en ambos casos (probado en `scenarios/positions.js`). Añadido por mi cuenta: tras cada render el listener devuelve el foco al control pulsado (`focusPosture`); sin ello el foco se perdía al reconstruir la lista.
4. **Polaridad de `basis` (P3).** Formato `for:clue|ded|flag:<id>` o `against:clue|ded|flag:<id>`, según la lista de la hipótesis; `insuficiente` → `[]`. Documentado en `V4_STATE_SCHEMA.md` §6.

**Interpretación:** con `flags.awake` mantengo también la línea «En el cap. I dije» (la especificación original la pedía siempre que `brennan_stance` exista); el coordinador la dejó en «como ahora».

### Archivos tocados (git status, antes de escribir esta sección)

- `web/src/story/positions.js` (nuevo): `QUESTIONS`, `BRENNAN_STANCE_LABEL`, `readPosition`, `basisFor` (formato nuevo), `setPosition` (bloquea con `awake` o `second`), `sanitizePositions`, `REVISIONS_KEEP = 20`.
- `web/src/story/progression.js`: `normalizeState` completa `positions` (con `sanitizePositions`) y `revisions` (recorte a 20).
- `web/src/story/theories.js`: solo `export function holds`.
- `web/src/engine/game.js`: `setPosition(q, option)`: escribe, `autosave`, `renderNotebook`.
- `web/src/engine/ui.js`: `_openPosture`; listener único sobre `theoryList` (toggle y opciones); `focusPosture`; `postureHtml` plegable.
- `web/styles.css`: bloque `.posture`, `.ptoggle` a anchura completa, botones de 44 px mínimo, foco visible.
- `web/tests/unit/positions.test.mjs` (nuevo): 21 pruebas.
- `web/tests/scenarios/positions.js` (nuevo): escenario `positions`.
- `web/docs/V4_STATE_SCHEMA.md`: §6 V4-01 (formato de `basis`, segunda lectura, despliegue).
- `web/docs/V4_EXECUTION_LOG.md`: esta sección.

Sin tocar: fixtures, `web/tools`, `web/index.html`. `web/GUION.md`: lo regenera `export.mjs`; git lo ve sin cambios.

`git status --porcelain`:

```
 M web/docs/V4_EXECUTION_LOG.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/engine/game.js
 M web/src/engine/ui.js
 M web/src/story/progression.js
 M web/src/story/theories.js
 M web/styles.css
?? web/src/story/positions.js
?? web/tests/scenarios/positions.js
?? web/tests/unit/positions.test.mjs
```

`git diff --stat`:

```
 web/docs/V4_EXECUTION_LOG.md | 141 +++++++++++++++++++++++++++++++++++++++++++
 web/docs/V4_STATE_SCHEMA.md  |  21 +++++++
 web/src/engine/game.js       |  10 +++
 web/src/engine/ui.js         |  56 ++++++++++++++++-
 web/src/story/progression.js |   7 +++
 web/src/story/theories.js    |   2 +-
 web/styles.css               |   8 +++
 7 files changed, 243 insertions(+), 2 deletions(-)
```

### Comandos y salidas reales

`node web/tools/unit.mjs` (sin FALLO):

```
58 pruebas bien, 0 mal
```

`node web/tools/walk.mjs positions`:

```
{
 "scenario": "positions",
 "ok": true,
 "errors": [],
 "lines": 5,
 "deductions": 0,
 "scene": "room",
 "revisions": 3
}
```

`node web/tools/test-all.mjs` (última ejecución, tras los cambios de esta ronda; `exit=0`):

```
PASS  unit                         0.1s
PASS  smoke                        3.0s
PASS  audio                        0.1s
PASS  scenario c1-minimal          0.6s
PASS  scenario calm                2.8s
PASS  scenario chapter3            3.1s
PASS  scenario comb-pike           2.0s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario finale              17.9s
PASS  scenario hint                0.4s
PASS  scenario hint-ui             0.4s
PASS  scenario integrity           0.3s
PASS  scenario mob                 2.5s
PASS  scenario notebook            0.3s
PASS  scenario positions           0.3s
PASS  scenario resume              3.2s
PASS  scenario sanity              27.0s
PASS  scenario seance              2.2s
PASS  scenario second-reading      1.4s
PASS  walk                         4.3s
PASS  walk second                  4.4s
PASS  walk alt                     0.7s
exit=0
```

`node web/tools/script/export.mjs`:

```
C:\Dev\HorrorPlay\web\GUION.md: 1500 lines, 358 spoken or thought
```

`git diff --stat -- web/GUION.md`: vacío (sin salida; solo el aviso de CRLF de git).

### Medida 720p (Chrome headless, CDP, 1280×720, `scratchpad/cdp/pos2.mjs`)

Estado: cuaderno abierto, pestaña Teorías, pistas `brennan_zurdo`, `carta` y `delantal`, `awake` falso, sin pregunta abierta (todo plegado). Escena de la partida: `room`.

```
collapsed: listScrollH 541, listClientH 541, listH 541,
           tabScrollH 593, tabClientH 593, tabH 593,
           pageScrollH 768, pageClientH 596, pageOverflowY auto, bookH 620,
           toggles: br_suspect 401x44 aria-expanded=false "Mi postura: sin postura ▸";
                    letter_author 401x44 aria-expanded=false "Mi postura: sin postura ▸"
noPostures (mismo estado, bloques ocultos): listH 423 (listScrollH = listClientH = 423),
           tabH 475, pageScrollH 650, pageClientH 596
expanded (br_suspect abierta): listH 677, tabH 729, pageScrollH 904, pageClientH 596
```

**Requisito 6 (720p): DESVIACIÓN ACEPTADA (Opus).** Las tres medidas (`.page.right`, 1280×720, `clientHeight` 596 en todas):

- sin posturas (bloques de postura ocultos en el mismo estado): `scrollHeight` **650** / 596. Ese desbordamiento ya existía antes de V4-01 (el contenido sin posturas es el de HEAD; la medida se tomó con los bloques ocultos, no sobre HEAD).
- con todo plegado (estado de la medida 720p de abajo): `scrollHeight` **768** / 596.
- con una pregunta abierta (br_suspect): `scrollHeight` **904** / 596.

**Lo que se desplaza es `.page.right`** (el panel derecho del libro, `overflow-y: auto`). `#theory-list` no se desplaza por sí mismo.

**Resultado: NO CABE.** `#theory-list` no se desplaza por sí mismo (`scrollHeight` = `clientHeight`), pero el contenedor que sí desplaza es el panel derecho del libro (`.page.right`, `overflow-y: auto`): `scrollHeight` 768 frente a `clientHeight` 596 con todo plegado. Causa medida (diagnóstico `scratchpad/cdp/pos3.mjs`): dentro del panel hay 35 px de `#nb-tabs` más 10 de margen, 30 px de `#nb-feedback` más 6, la pestaña de Teorías (593 px) y 36 px de relleno arriba y abajo. La pestaña sola ya no cabe en el panel (593 frente a 524 disponibles). Las dos líneas plegadas añaden 118 px (2 × 44 px de botón, más margen y borde).

**Desviación respecto de lo pedido (aceptada por Opus):** el panel no cabe a 720p con todo plegado, y tampoco sin posturas (650 frente a 596). El desbordamiento de 54 px sin posturas es anterior a esta fase. La maquetación del libro no se ha cambiado: la solución compartida se registra en «Pendiente F16».

**Nota sobre las cifras anteriores:** «770 px con dos posturas abiertas» ya no es alcanzable: solo una pregunta puede estar abierta. La medida de abrir una pregunta es `listH 677`.

Captura (plegado, 1280×720): `scratchpad/cdp/pos/01-collapsed-720p.png`. Captura (una abierta): `scratchpad/cdp/pos/02-expanded-720p.png`. JSON: `scratchpad/cdp/pos/report.json`.

### Prueba de teclado (CDP, mismo script)

- Foco programático en el primer botón de despliegue (`br_suspect`): `document.activeElement` es ese botón.
- Enter (`keyDown` + `keyUp` por CDP): `aria-expanded="true"`, el foco sigue en `br_suspect`, `outlineStyle: solid`, `outlineWidth: 2px`, `outlineColor: rgb(142, 27, 22)`, `:focus-visible: true`, tres botones de opción presentes.
- Tab real no se probó: el foco se puso por código (la especificación lo admite). Pendiente si se quiere probar Tab desde el inicio del cuaderno.
- Sin excepciones de página (`consoleExceptions: []`).

### Comprobación 1 (observador): la postura desplegada queda a la vista

Cambio en `ui.js` (una línea, en la rama de la pulsación que abre una pregunta): tras el render, `scrollIntoView({ block: 'nearest' })` sobre el bloque `.posture` abierto. Comprobación con CDP (`scratchpad/cdp/pos4.mjs`), 1280×720, todo plegado (ninguna pregunta abierta antes), foco en el botón de «Mi postura» de la carta (fuera de la vista) y Enter por teclado:

```
openQ (antes)                 null
expanded (después)            "true"
botón «Salió de mi cuarto»    getBoundingClientRect().bottom = 608
.page.right bottom            658   (top 62)
scrollTop / scrollHeight / clientHeight   244 / 904 / 596
botón dentro del área visible: true
foco en el botón de despliegue: true
consoleExceptions             []
```

El botón queda con `bottom` 608 ≤ 658 (`.page.right`). Captura: `scratchpad/cdp/pos/03-letter-open-720p.png`. JSON: `scratchpad/cdp/pos/report-letter.json`.

### Preguntas abiertas para el observador

1. **720p: resuelta.** DESVIACIÓN ACEPTADA (Opus), ver arriba. La maquetación compartida queda en «Pendiente F16».
2. **Segunda lectura:** resuelta en esta ronda por la opción (ii) del observador (bloqueo en la capa pura y en la UI). Queda registrada aquí como decisión.

## V4-02 — implementación (pendiente de revisión)

Estado: **F02 CODE_COMPLETE (no TESTED por el observador).** Sin commit ni push. Alcance: la ventana de las rondas (`ronda`, `d_ronda`, la hoja, la teoría `rondas` y la pregunta `buck_window`), según la especificación aprobada de V4-02.

### Decisiones y textos

1. **Textos exactos** de la especificación: pista `ronda` (sin «Diez minutos…»), deducción `d_ronda`, pensamiento final de `beats` («De 3:30 a 3:40, si las horas son buenas.»), cabecera de la hoja (DIVISIÓN J (BETHNAL GREEN) — RONDAS · copia a la H), remisión a Whitechapel, «hacia las 3:40» en Cross y la línea de Neil en `bucks_row.js`. La línea de Thain y la firma no cambian; la de Pike tampoco.
2. **Teoría `rondas`** (`theories.js`): dos hipótesis, `firme` (evidencia `d_ronda`) y `compatible` (evidencia `ronda`). Regla `plausible` o `sin evaluar`; nunca `sostenida`. No lee `flags.awake`, `misses` ni `beats`.
3. **`buck_window`** (`positions.js`): `theory: 'rondas'`, `visible` con la pista `ronda`. El comentario que decía «oculta en F01» se actualiza a «visible con la pista ronda (F02)».
4. **Formato de `basis`:** `firme` → `for:ded:d_ronda` (la especificación lo escribía como `ded:d_ronda`); `compatible` → `for:clue:ronda`; `insuficiente` → `[]`. Es el formato de V4-01.
5. **Compatibilidad:** sin cambios en `normalizeState`, IDs, flags, `canFinishC1` ni `currentGate`. Un guardado con `ronda` muestra la teoría y la pregunta sin postura, y no escribe al reanudar (probado en `scenarios/beats.js`, caso d).
6. **Renombrada una prueba** de `unit/positions.test.mjs` («buck_window nunca» pasa a «buck_window sin la pista ronda»). Solo el nombre; el contenido no cambia.

### Archivos tocados (git status, antes de escribir esta sección)

- `web/src/story/data.js`: textos de `ronda` y `d_ronda`.
- `web/src/story/chapters.js`: `beats` (cabecera, remisión, línea de Cross, pensamiento final).
- `web/src/scenes/bucks_row.js`: línea de Neil.
- `web/src/story/theories.js`: teoría `rondas` (añadida al final de `THEORIES`).
- `web/src/story/positions.js`: `buck_window` visible con `ronda`; comentarios.
- `web/tests/unit/rondas.test.mjs` (nuevo): 12 pruebas.
- `web/tests/scenarios/beats.js` (nuevo): escenario `beats`, casos a–e.
- `web/tests/unit/positions.test.mjs`: nombre de una prueba.
- `web/GUION.md`: regenerado por `export.mjs` (solo cambian los cinco textos aprobados).
- `web/docs/V4_HISTORICAL_LEDGER.md`: H-09 a SECONDARY; H-23, H-24 y H-25; sección «Fuentes secundarias (V4-02)».
- `web/docs/V4_STATE_SCHEMA.md`: corrección de `buck_window` en §6 y §7 (V4-02, sin campos nuevos).
- `web/docs/V4_EXECUTION_LOG.md`: esta sección y F16.

`git status --porcelain` (antes de esta sección):

```
 M web/GUION.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/scenes/bucks_row.js
 M web/src/story/chapters.js
 M web/src/story/data.js
 M web/src/story/positions.js
 M web/src/story/theories.js
 M web/tests/unit/positions.test.mjs
?? web/tests/scenarios/beats.js
?? web/tests/unit/rondas.test.mjs
```

`git diff --stat`:

```
 web/GUION.md                      | 10 +++++-----
 web/docs/V4_HISTORICAL_LEDGER.md  | 12 +++++++++++-
 web/docs/V4_STATE_SCHEMA.md       |  8 +++++++-
 web/src/scenes/bucks_row.js       |  2 +-
 web/src/story/chapters.js         |  7 ++++---
 web/src/story/data.js             |  4 ++--
 web/src/story/positions.js        |  7 +++----
 web/src/story/theories.js         | 14 ++++++++++++++
 web/tests/unit/positions.test.mjs |  2 +-
 9 files changed, 48 insertions(+), 18 deletions(-)
```

(Los dos ficheros nuevos, `beats.js` y `rondas.test.mjs`, no aparecen en `--stat` porque no están en el índice.)

### Comandos y salidas reales

Instantánea de `evaluate()` sobre los 11 fixtures (`snapshot-before.json` frente a `snapshot-after.json`, fuera del repo): intruso, brennan, carta y horas **IGUALES** en todos los fixtures. La única diferencia es la aparición de `rondas` en los 7 fixtures que tienen la pista `ronda`.

`node web/tools/unit.mjs` (última línea, tras el cambio de nombre):

```
70 pruebas bien, 0 mal
```

`node web/tools/walk.mjs beats`:

```
{ "scenario": "beats", "ok": true, "errors": [], "lines": 199, "deductions": 1, "scene": "hanbury", "misses": 2, "revisions": 2 }
```

`node web/tools/walk.mjs` (completa), `second` y `alt` (`ok: true` en los tres, sin errores):

```
walk:        "ok": true, "errors": [], "lines": 425, "deductions": 25, "scene": "bucks_row"
walk second: "ok": true, "errors": [], "lines": 430, "deductions": 25, "scene": "bucks_row"
walk alt:    "ok": true, "errors": [], "lines": 125, "deductions": 1,  "scene": "seance"
```

`node web/tools/test-all.mjs` (última ejecución, tras el cambio de nombre y la documentación; `exit=0`):

```
PASS  unit                         0.1s
PASS  smoke                        3.6s
PASS  audio                        0.2s
PASS  scenario beats               0.9s
PASS  scenario c1-minimal          0.7s
PASS  scenario calm                2.9s
PASS  scenario chapter3            3.3s
PASS  scenario comb-pike           2.1s
PASS  scenario compat              0.6s
PASS  scenario feedback            0.7s
PASS  scenario finale              18.2s
PASS  scenario hint                0.5s
PASS  scenario hint-ui             0.6s
PASS  scenario integrity           0.5s
PASS  scenario mob                 2.6s
PASS  scenario notebook            0.5s
PASS  scenario positions           0.5s
PASS  scenario resume              3.5s
PASS  scenario sanity              28.1s
PASS  scenario seance              2.3s
PASS  scenario second-reading      1.6s
PASS  walk                         4.6s
PASS  walk second                  4.7s
PASS  walk alt                     0.8s
exit=0
```

`node web/tools/script/export.mjs`: `C:\Dev\HorrorPlay\web\GUION.md: 1500 lines, 358 spoken or thought`. `git diff -- web/GUION.md`: 5 líneas cambiadas (+5 −5), revisadas una a una: línea de Neil, cabecera y remisión de la hoja, línea de Cross, pensamiento final de `beats`, pista `ronda` y `d_ronda`. Nada más.

### Medida 720p (Chrome headless, CDP, 1280×720, `scratchpad/v4-02/720p/measure.mjs`, servidor 5317)

Estado: partida en `room`, cuaderno abierto, pestaña Teorías, **todo plegado** (ninguna pregunta abierta). Pistas en memoria (no guardadas): `brennan_zurdo`, `carta`, `delantal`, `ronda`, `botas`, `laudano`. Cinco preguntas visibles:

```
preguntas (#theory-list > li): 5
  intruso    «¿Alguien entra en mi cuarto de noche, o salgo yo sin recordarlo?»
  brennan    «¿Brennan, o un barrio que necesita a un hombre con delantal?»
  carta      «¿Quién escribió la carta: Greaves, alguien que imita, o alguien cercano a mí?»
  horas      «¿Qué explica las horas que pierdo, y el agua?»
  rondas     «¿Cuándo quedó el portón fuera de vista, y cómo se sabe?»
botones «Mi postura» (data-toggle): 3 (br_suspect, letter_author, buck_window)
aria-expanded="true": 0
#theory-list:  scrollHeight 1050, clientHeight 1050 (no se desplaza por sí mismo)
.page.right:   scrollHeight 1277, clientHeight 596, overflow-y auto
viewport:      1280 × 720
consoleLogs:   []
```

**Resultado: NO CABE.** Con cinco preguntas y todo plegado, `.page.right` desbordaría 1277 − 596 = 681 px. Lo que se desplaza es `.page.right`, como en V4-01. Captura: `scratchpad/v4-02/720p/01-five-questions-collapsed-720p.png`. JSON: `scratchpad/v4-02/720p/report.json`.

La maquetación del libro no se ha cambiado en esta fase; la solución compartida queda en «Pendiente F16».

### Preguntas abiertas para el observador

1. **720p con cinco preguntas:** 1277 px frente a 596. La maquetación queda en F16 (ver abajo).
2. **Nombre de la prueba renombrada:** es solo el nombre. Si el observador quiere el texto original, se revierte.
3. **Dos pistas añadidas para la medida** (`botas`, `laudano`): solo en memoria, para que `intruso` y `horas` aparezcan. El guardado no se ha tocado.

## Pendiente F16

- Maquetación compartida del libro a 720p (todas las pestañas). **V4-02:** la pestaña Teorías tiene ahora **cinco preguntas** (intruso, brennan, carta, horas, rondas). Con todo plegado `.page.right` mide 1277 px frente a 596 a 1280×720. La línea plegada de cada postura (unos 59 px) debe caber en la línea de su pregunta o ser más compacta.
- Etiqueta «Qué pensé de Brennan» (`QUESTIONS.br_suspect.title`): no se muestra en ninguna parte; se decide en una fase posterior.

## Deudas registradas en V4-03

1. **Vitrina de Greaves repetible (posible P1 de juego).** `readFile` no tiene guarda: abrir la vitrina con la llave otra vez vuelve a ejecutar la conversación con Greaves y baja la cordura (−10 y −15). Ya existía antes de F03. Comprobar en partida normal y corregir en F10 (pacing), con la tabla de `greaves.js` de `V4_F00_INVENTORY.md` §6.
2. **Perfil antiguo en guardados.** `d_zurdo` cambia el rasgo del perfil a «Quizá zurdo, quizá con nociones de anatomía», pero los guardados antiguos conservan «Zurdo, con nociones de anatomía» en `state.profile` (7 fixtures). Opciones: sustitución exacta e idempotente en `normalizeState`, o aceptarlo. Decidir en F16 o F17.
3. **Atribución y texto literal de la nota de Swanson.** Verificación con fuente primaria en F17 (H-07).

## V4-04 — implementación (pendiente de revisión)

### Decisiones y textos

- **Flag `v4_wren_not_him`** (default ausente). Se activa en `endC1` (`src/story/chapters.js`), rama de Brennan, justo antes de «No fue él.». La hipótesis `brennan.brennan` la cita en `against` en lugar de `c1_done`. `normalizeState` (`src/story/progression.js`) la activa si `investigation.routes.c1.closedAt === 'knackers'`: solo activa, nunca borra, idempotente.
- **Verificado antes de codificar:** `closeC1` solo se llama desde `src/scenes/bucks_row.js:177` (Pike) y `src/scenes/knackers.js:284` (Brennan).
- **Turba:** la línea de Brennan (`chapters.js`, `mobScene`) pasa a «¡Pregúntenle a los del turno! ¡He trabajado toda la noche!». `web/src` ya no contiene «Tomkins».
- **`d_delantal.text`** pasa al texto acordado. Mismo id, mismo `flag` (`acusar_brennan`), mismo `denialLate`. `truth` **no se tocó**: sigue diciendo «El delantal era del hijo de la casera…». Solo se lee con `flags.awake` (`src/engine/ui.js:519`), como segunda lectura.
- **No tocado:** `severe` / `injured` / `protected`, la lógica de la turba y la opción «Acusar a Brennan», `brennan_stance`, `routes.c1`, `c1_done`, la línea de Wren que no culpa a Thomas. No hay escenas, pistas ni flags nuevos aparte de `v4_wren_not_him`.

### Desviaciones y observaciones

1. El encargo nombra el flag como `v4_wren_not_man` en un punto de la sección 6 de la documentación. El nombre usado en todo el código, los tests y el esquema es `v4_wren_not_him`, como en la especificación del flag.
2. **Matriz de la turba: 20 combinaciones.** Posturas × desenlaces disponibles: `suspect` con y sin delantal (4 + 4), `clear` y `unsure` con delantal (4 cada una) y sin delantal (2 cada una). `severe` se recorre con y sin `amelia1`. Cada una llega a `room` (sin softlock).
3. **Que «Acusar» no aparezca cuando no corresponde** se comprueba solo leyendo el código (`opts.unshift` solo con `d_delantal` o `suspect`). No se prueba con `PICKS`: una opción ausente lanza dentro del bucle del juego y el harness lo cuenta como error de script.
4. **H-27 a H-30 llevan `[D]` con `FUENTE PENDIENTE`.** La definición del registro reserva `[D]` para hechos acreditados; se dejan como pide el encargo y se anota en el riesgo de cada fila.
5. **H-30 (John Pizer): discrepancia de fecha.** La tarjeta del juego dice «Al día siguiente» de la turba del 10 de septiembre (es decir, 11). El encargo dice «detenido el 10-09-1888». No se ha cambiado el texto del juego.
6. **Guardados anteriores a V3 sin `routes.c1`** no pueden recuperar la prueba: no hay información en el guardado para reconstruirla. Degradación aceptada, documentada en `V4_STATE_SCHEMA.md` §8.
7. El guion exportado (`GUION.md`) no muestra el flag nuevo: `G.flag('v4_wren_not_him', true)` es una asignación, no una condición, y el exportador no las lista.

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes de `evaluate`)

Scripts fuera del repo: `scratchpad/v4-04/snapshot.mjs`, `compare.mjs`, `precise.mjs`. Salidas: `snapshot-before.json`, `snapshot-after.json`.

- Las cuatro teorías distintas de `brennan` (`intruso`, `carta`, `horas`, `rondas`) y el resto de `brennan` (`prensa`, `for`, las demás listas) son **idénticos en los 11 fixtures**.
- `brennan.brennan` solo cambia por la prueba de Wren (`precise.mjs`: `sameExceptWrenAndStatus=true` en los 11).
- **Fixtures que ganan la prueba de Wren: ninguno.** Ningún fixture tiene `routes.c1`, así que la migración no se activa sobre ellos (se prueba con estados construidos en `brennan.test.mjs`).
- **Fixtures que pierden la prueba (7):** `legacy-c3-pre-v3.json`, `saves-v1-baseline/c2.json`, `c3.json`, `c4.json`, `saves-v1-baseline-second/c2.json`, `c3.json`, `c4.json`. Son exactamente los que tienen `c1_done` sin `routes.c1`.
- Cambio de estado `brennan.brennan` por perder la prueba: `no demostrada → plausible` en `legacy-c3-pre-v3.json`, `saves-v1-baseline/c3.json`, `c4.json`, `saves-v1-baseline-second/c3.json`, `c4.json`. En `saves-v1-baseline/c2.json` y `saves-v1-baseline-second/c2.json` el estado sigue `plausible`; solo deja de citarse a Wren.
- Sin cambio: `saves-v1-baseline/c1.json`, `saves-v1-baseline/prologue.json`, `saves-v1-baseline-second/c1.json`, `saves-v1-baseline-second/prologue.json` (no tienen Brennan).

### Revisión de las líneas del desenlace `severe` (escenario `brennan`)

Con `amelia1` (líneas de la acusación, sin el pensamiento de la reunión de fondo):

```
Ashgrove: Queda detenido, Brennan. ¡Retírense!
Ashgrove: El delantal lo lavó la señora Richardson. Era de su hijo. Lo sabía.
Wren: Usted sabía que no tenía nada contra él.
  > Lo sospechaba.
Wren: Sospechar no es saber, señor.
```

Sin `amelia1`: las mismas líneas sin la del delantal. Ninguna afirma la culpa de Brennan como demostrada. La más dura es «Queda detenido», que describe una detención, no una prueba. El escenario lo verifica con una expresión regular (`culpable`, `es el asesino`, `lo hizo`, `demostrad`, `confes`, `prueba de que`) sobre todas las líneas del desenlace, además de esta lectura.

### Archivos tocados (git status antes de escribir esta sección)

```
 M web/GUION.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/story/chapters.js
 M web/src/story/data.js
 M web/src/story/progression.js
 M web/src/story/theories.js
?? web/tests/scenarios/brennan.js
?? web/tests/unit/brennan.test.mjs
```

### Comandos y salidas reales

```
$ node web/tools/unit.mjs
88 pruebas bien, 0 mal            (78 anteriores + 10 de brennan.test.mjs)

$ node web/tools/walk.mjs brennan
{ "scenario": "brennan", "ok": true, "errors": [], "deductions": 6, "scene": "room", ... "matrix": [20 combinaciones] }

$ node web/tools/script/export.mjs
C:\Dev\HorrorPlay\web\GUION.md: 1503 lines, 358 spoken or thought
$ git diff -- web/GUION.md   (+2 −2)
  - **Brennan:** ¡Pregúntenle a Tomkins! ¡He trabajado toda la noche!
  + **Brennan:** ¡Pregúntenle a los del turno! ¡He trabajado toda la noche!
  - Texto: El delantal del patio se parece al de Brennan, pero la casera declaró que pertenece a su hijo. Aún no hay vínculo con Brennan.
  + Texto: El delantal del patio se parece al de Brennan. No sé de quién es; un parecido no es un vínculo.
```

```
$ node web/tools/test-all.mjs
PASS  unit                         0.2s
PASS  smoke                        4.6s
PASS  audio                        0.2s
PASS  scenario beats               1.0s
PASS  scenario brennan             5.1s
PASS  scenario c1-minimal          0.8s
PASS  scenario calm                3.0s
PASS  scenario chapter3            3.3s
PASS  scenario comb-pike           2.1s
PASS  scenario compat              0.7s
PASS  scenario feedback            0.8s
PASS  scenario finale              18.8s
PASS  scenario forense             0.7s
PASS  scenario hint                0.5s
PASS  scenario hint-ui             0.6s
PASS  scenario integrity           0.4s
PASS  scenario mob                 2.6s
PASS  scenario notebook            0.6s
PASS  scenario positions           1.0s
PASS  scenario resume              3.6s
PASS  scenario sanity              28.1s
PASS  scenario seance              2.3s
PASS  scenario second-reading      1.5s
PASS  walk                         4.8s
PASS  walk second                  4.6s
PASS  walk alt                     0.8s
EXIT=0
```

**Revisión de cierre (Opus, V4-04): APPROVED con dos decisiones aplicadas.** D1: H-27 pasa a [U] (no [D]). D2: la tarjeta de Pizer en chapters.js:521 pierde «al día siguiente» y queda sin fecha («Esos días detuvieron a John Pizer…»); H-30 queda [D] FUENTE PENDIENTE, sin fecha en el juego. Desviación aceptada: en guardados anteriores a V3 sin routes.c1, la prueba de Wren desaparece y Brennan puede pasar de «no demostrada» a «plausible» (degradación documentada).
