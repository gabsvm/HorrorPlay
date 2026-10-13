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

## V4-05 — implementación (pendiente de revisión)

Implementado por el agente implementador (Haiku), sin commit. Base `5c2a040`. Revisión del observador pendiente.

### Decisiones y textos

- **Jamba (`scenes/goulston.js`, `chalkScrawl`).** La jamba siempre lleva trazos de tiza sin letras (líneas diagonales, ganchos cortos y verticales, semilla fija 4217). Se dibujan con o sin `chalk_seen`, antes y después del hallazgo. `drawNear` ya no escribe `HERE I AM`, y `drawGlow` se elimina de la escena (el renderer lo llama solo si existe).
- **Forma de los trazos, ajustada tras la primera captura.** Los arcos eran casi círculos completos y dos bucles podían leerse como una «o». Se cambiaron a ganchos cortos (0,6–1,4 rad). Ver la captura de abajo.
- **Orden del primer hallazgo (`doorway`).** 1) `G.clue('goulston_historic')`. 2) `G.think(G.two(lectura 1, lectura 2))`, después `G.vision('chalk')`; solo en la primera lectura, la línea «Lo dije yo. Hace veintidós años.» (si `answered1866`) o «¿Lo he leído o lo he oído?». 3) `G.clue('aqui_estoy')`. 4) `chalk_seen`, `G.audio.sting(0.22)`, `G.sanity(-8)`, `G.mad(0)`, pose `null`. 5) `caught` una sola vez. La segunda lectura no tiene voz nueva: el pensamiento sustituye al `G.voice('Aquí estoy.')`.
- **Textos de la pista nueva `goulston_historic`** (`story/data.js`, tag «Goulston St. · informe»). Texto en función de `flags.paper_read`: sin él, «En la jamba hay otra inscripción en tiza, contra los judíos. No se sabe quién la escribió.»; con él, además «Al amanecer la borraron por orden de la jefatura, por miedo a disturbios contra los judíos.». `truth2`: «Nadie me pidió que la leyera.». Sin flag, sin migración, sin `text2`, y fuera de `theories.js`, `FINAL_SOURCES`, `progression.js` y las deducciones.
- **`aqui_estoy`** (mismo ID y efecto): `text` y `text2` según la especificación. `d_aqui` y la nota de «horas» pasan a los textos aprobados.
- **Visión `chalk`** (`art/bodies.js`, `paintChalk`): ladrillo oscuro, brillo húmedo y «HERE I AM» tenue e inclinado. No dibuja la jamba. `game.js` y `ui.js` no cambian: la reducción de movimiento ya la cubre `ui.vision`.
- **Texto prohibido.** El insulto y la frase de la carta no aparecen en `src`, `tests`, `tools`, `docs` ni `GUION.md`. La prueba es un hash de las palabras (`tests/unit/goulston.test.mjs`) y un escaneo de 104 archivos sin imprimir palabras (0 aciertos).

### Desviaciones y observaciones

1. **`G.mad(0.5)` se movió al inicio de la lectura** (antes de `G.think`); `G.mad(0)` queda al final. La especificación lo listaba en el paso 4; en ese orden, `mad(0.5)` y `mad(0)` se ejecutan en el mismo tic y la tensión no se nota. `G.audio.sting(0.22)` sí queda en el paso 4.
2. **La línea «Lo dije yo» / «¿Lo he leído o lo he oído?» va después de la visión**, no antes, como reacción a la imagen. La especificación no fijaba su posición; solo pedía el cambio del texto de «¿Quién escribió esto?».
3. **El GUION no muestra el primer texto de `goulston_historic`**: el exportador no lee textos en función, igual que con `aqui_estoy` (solo sale `text2`). Es una limitación del generador, no del juego; el texto se verifica en `tests/unit/goulston.test.mjs`.
4. **Etiqueta de fuente H-02 / H-31.** «VERIFICADA-CITA» se escribe tal como pide la especificación. **La URL de Warren no se abrió en esta ronda**, y la fila lo dice. F17 debe abrir la fuente primaria.
5. **Finales de línea.** `art/bodies.js`, `scenes/goulston.js` y `GUION.md` estaban en CRLF en el árbol de trabajo (índice LF). Se pasaron a LF. `git ls-files --eol` da `lf/lf` para todos los archivos tocados.
6. **`GUION.md`** se regeneró con `tools/script/export.mjs` y se pasó a LF. Diff: 12 líneas añadidas y 8 quitadas, solo en Goulston, `aqui_estoy`, `d_aqui` y la pista nueva.

### Archivos tocados (git status, antes de escribir esta sección)

```
 M web/GUION.md
 M web/docs/V4_F00_INVENTORY.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/art/bodies.js
 M web/src/scenes/goulston.js
 M web/src/story/data.js
 M web/src/story/theories.js
?? web/tests/scenarios/goulston.js
?? web/tests/unit/goulston.test.mjs
```

No se tocó `game.js`, `ui.js`, `chapters.js`, `progression.js`, `canLeaveMitre`, `FINAL_SOURCES`, `caught()` ni las transiciones.

### Tabla de comportamiento (PASO 0)

`web/docs/V4_F00_INVENTORY.md`, sección 7, escrita antes de tocar `goulston.js` (leída del código en `5c2a040`).

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes de `evaluate`, 5 teorías)

Scripts y salidas en `scratchpad/v4-05/` (fuera del repositorio): `snap.mjs`, `snapshot-before.json`, `snapshot-after.json`.

```
$ node snap.mjs snapshot-before.json
fixtures: 11, theories: 5
$ node snap.mjs snapshot-after.json
fixtures: 11, theories: 5
$ diff snapshot-before.json snapshot-after.json
501c501
<        "la tiza de Goulston Street"
---
>        "lo que creí leer en Goulston Street"
892c892
<        "la tiza de Goulston Street"
---
>        "lo que creí leer en Goulston Street"
```

Solo cambia la nota de la teoría «horas» (`aqui_estoy`), en dos fixtures: `saves-v1-baseline/c4.json` y `saves-v1-baseline-second/c4.json`. Ninguna otra teoría, hipótesis ni estado cambia.

### Comandos y salidas reales

```
$ node web/tools/unit.mjs            (última línea)
98 pruebas bien, 0 mal

$ node web/tools/walk.mjs goulston
{ "scenario": "goulston", "ok": true, "errors": [], "lines": 86, "deductions": 12, "scene": "room" }

$ node web/tools/walk.mjs
{ "scenario": "walkthrough", "ok": true, "errors": [], "lines": 427, "deductions": 25, "scene": "bucks_row" }

$ node web/tools/walk.mjs second
{ "scenario": "second", "ok": true, "errors": [], "lines": 431, "deductions": 25, "scene": "bucks_row" }

$ node web/tools/walk.mjs alt
{ "scenario": "alt", "ok": true, "errors": [], "lines": 125, "deductions": 1, "scene": "seance" }

$ node web/tools/test-all.mjs
PASS  unit                         0.3s
PASS  smoke                        3.2s
PASS  audio                        0.1s
PASS  scenario beats               0.8s
PASS  scenario brennan             5.0s
PASS  scenario c1-minimal          0.5s
PASS  scenario calm                2.8s
PASS  scenario chapter3            3.1s
PASS  scenario comb-pike           2.0s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario finale             17.9s
PASS  scenario forense             0.6s
PASS  scenario goulston            5.0s
PASS  scenario hint                0.4s
PASS  scenario hint-ui             0.4s
PASS  scenario integrity           0.3s
PASS  scenario mob                 2.4s
PASS  scenario notebook            0.4s
PASS  scenario positions           0.4s
PASS  scenario resume              3.2s
PASS  scenario sanity             26.9s
PASS  scenario seance              2.1s
PASS  scenario second-reading      1.4s
PASS  walk                         4.3s
PASS  walk second                  4.4s
PASS  walk alt                     0.6s
EXIT=0

$ node web/tools/script/export.mjs
C:\Dev\HorrorPlay\web\GUION.md: 1507 lines, 357 spoken or thought
$ git diff --stat -- web/GUION.md
 web/GUION.md | 20 +++++++------
```

### Captura 720p (Chrome headless, CDP, 1280×720, servidor 5317)

- Script: `scratchpad/v4-05/720p/capture.mjs`. El servidor 5317 no respondía, así que se arrancó con `preview_start` (name `el-huesped`) y se detiene al terminar.
- Estado: partida de `saves-v1-baseline/c3.json` con `apron_found`, `chalk_seen`, `goulston_historic` y `aqui_estoy`, en `goulston`, con Thomas en x=760 mirando a la izquierda. Sin visión en pantalla.
- Archivos: `scratchpad/v4-05/720p/goulston-jamb-720p.png` (1280×720) y `goulston-jamb-crop-x4.png` (recorte 860–1000 × 350–500, ×4).
- Lo que se ve: la puerta de la escalera, con «108 – 119» encima, y a la derecha del marco de la puerta, la jamba, con trazos de tiza grises y apagados: líneas diagonales, ganchos cortos y algunas verticales. No se distingue ninguna letra. La primera captura tenía dos bucles casi circulares que se parecían a una «o»; se corrigieron (ver Decisiones). No hay visión encima ni brillo sobre la jamba.
- Consola: sin excepciones ni errores.

### Preguntas abiertas para el observador

1. ¿Se acepta el movimiento de `mad(0.5)` a la lectura (desviación 1)?
2. ¿Hace falta que el GUION muestre el texto en función de `goulston_historic` (desviación 3)?
3. H-02 y H-31 llevan «VERIFICADA-CITA» según la especificación, sin haber abierto la URL. ¿Lo dejamos así hasta F17?

**Revisión de cierre (Opus, V4-05): APPROVED con un cambio aplicado.** P2-1: `goulston_historic` pierde `truth2` (una frase en primera persona no puede ligar a Thomas con la inscripción real); test añadido. H-02, H-07 y H-31 quedan como «CITA SECUNDARIA (resumen automático de WebFetch; no literal)» hasta F17. Desviación aceptada: `mad(0.5)` al inicio de la lectura.

## V4-06 — implementación (pendiente de revisión)

Implementado por el agente implementador (Haiku), sin commit. Base `b923ce0`. Revisión del observador pendiente.

### Decisiones y textos

- **Watkins (`scenes/mitre.js`).** «¿Qué ha encontrado?» (`found`) da dos líneas sin nombre y la pista `trozo`. «¿Alguien vio algo?» (`witness`) da la línea del vecino de Church Passage y la pista `testigo`; el pensamiento de Thomas no cambia. «¿Sabemos quién era?» (`name`) da «No. Aquí nadie la conoce.» y −2 de cordura, como antes.
- **Opción nueva «¿Hay novedades de otras calles?» (`berner`).** Visible con `trozo` y sin `berner_aviso`. Da el aviso de la Metropolitana (texto aprobado), la pista `berner_aviso` y el objetivo si hay `trozo` y `testigo`. No es puerta de salida.
- **Opción nueva «¿Quién lleva el caso?» (`city`).** Visible tras la placa, una sola vez (`flags.mitre_city`). Un intercambio, sin cordura. **La etiqueta no venía en la especificación:** es decisión de implementación.
- **Orden del menú: found, witness, name, berner, city, bye.** `tests/walkthrough.js:123` elige por índice `[0]` tres veces tras la placa; con las nuevas antes, la ruta principal rompería. Ese archivo no está en la lista y no se toca.
- **Pista `berner_aviso`** (`story/data.js`, tag «Mitre Square · aviso», texto fijo, sin `truth2`).
- **Teoría `doble`** (`story/theories.js`, al final de `THEORIES`). Hipótesis `vinculados` (`berner_aviso` + `testigo`) y `no_relacionados` (`berner_aviso`), con las pruebas de la especificación. **Los textos de las hipótesis no venían en la especificación:** «El mismo hombre: la misma noche y a menos de una hora de distancia.» y «Dos hombres distintos: otra calle y otra jurisdicción.». Reglas: `vinculados` plausible con dos pruebas; `no_relacionados` plausible con una. Nunca `sostenida`.
- **Pregunta `double_event`** (`story/positions.js`): título «¿Son el mismo hombre?»; opciones «Probablemente, sí», «No hay bastante para decirlo», «Por ahora, no». Visible con `berner_aviso` y `trozo`.
- **Recorte de prensa** (`story/chapters.js`, `c4`): tras las dos tarjetas «Octubre» y antes de la tarjeta «Capítulo IV», con `G.doc`. Cabecera y párrafos exactos. Sin flag, sin pista, sin pensamiento.
- **Comentarios.** `scenes/mitre.js:40` decía «toward Duke's Place» y pasa a «toward the club side»; `story/progression.js` (`f_testigo`) pasa a «a neighbour in Church Passage». Son comentarios, no texto de pantalla, pero la prueba de Duke's Place mira todo `src`.

### Desviaciones y observaciones

1. **Visibilidad de `doble` con una regla `show`.** `evaluate()` mostraba una teoría si cualquier hipótesis tenía evidencia. Con `testigo` y `trozo` sin aviso, `vinculados` tendría evidencia y la teoría saldría, contra el criterio de guardados (P). Se añade un campo opcional `show` a la teoría; `evaluate()` lo respeta. Solo `doble` lo tiene. Las cinco anteriores no cambian (ver el snapshot).
2. **Registro de `double_event`.** La especificación nombraba `double_event_assessment` como posible campo; no se crea (ver `V4_STATE_SCHEMA.md` §10).
3. **Palabras que ya existían fuera de la escena.** Las pruebas no son literales: `story/data.js:146` (la pista `trozo` dice «Catherine Eddowes»), `art/props.js:276` (comentario), `story/chapters.js:933` (tarjeta de Miller's Court, «Mary Jane Kelly»), `scenes/mitre.js:103` (comentario) y `main.js:57` (créditos). `tests/unit/mitre.test.mjs` las compara con una lista blanca por línea. No se han cambiado: no estaban en la especificación.
4. **Clasificación de H-04.** El alias «Mary Ann Kelly» queda `[A]` corregido en la escena, y el dato de Bishopsgate queda «FUENTE PENDIENTE». La especificación no fijaba la clase de esa parte.
5. **H-34 (George Morris).** La especificación da «[D] FUENTE PENDIENTE (P3-2)» sin describir su papel histórico. La fila no lo describe.
6. **Finales de línea.** `scenes/mitre.js` y `GUION.md` estaban en CRLF en el árbol de trabajo (índice LF); se pasaron a LF. `main.js` sigue en CRLF en el árbol de trabajo y no se toca.
7. **`investigation.hypotheses`.** `game.js:365` guarda `statuses()`, que ahora incluye `doble.vinculados` y `doble.no_relacionados` cuando la teoría está visible. Es estado de cuaderno, no de progreso; ni `canLeaveMitre`, ni `FINAL_SOURCES`, ni `flags` cambian.
8. **Líneas de los recorridos.** Antes de V4-06 eran 427 (walkthrough) y 431 (second); ahora 425 y 429, por las líneas quitadas de Watkins. `alt` sigue en 125.
9. **Etiqueta de la opción de Watkins.** La tabla §8 de `V4_F00_INVENTORY.md` usa la etiqueta exacta de la especificación (C), «¿Hay novedades de otras calles?», y no la forma corta «¿Hay novedades?» de la fila de la tabla.

### Archivos tocados (git status antes de escribir esta sección)

```
 M web/GUION.md
 M web/docs/V4_F00_INVENTORY.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/scenes/mitre.js
 M web/src/story/chapters.js
 M web/src/story/data.js
 M web/src/story/positions.js
 M web/src/story/progression.js
 M web/src/story/theories.js
?? web/tests/scenarios/mitre6.js
?? web/tests/unit/mitre.test.mjs
```

`web/docs/V4_EXECUTION_LOG.md` se modifica con esta misma sección. Sin commit ni push. Todos los archivos tocados están en `i/lf w/lf` (`git ls-files --eol`).

### Tabla de comportamiento (PASO 0)

`web/docs/V4_F00_INVENTORY.md`, sección 8, escrita antes de tocar `scenes/mitre.js` (leída del código en `b923ce0`). Incluye las filas de `watkins` (found, witness, name, berner, city, bye, sin placa, `use` de la placa), `corner` (cuerpo e inspección `kate`) y `east`.

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes de `evaluate`, 5 teorías)

Scripts y salidas en `scratchpad/v4-06/` (fuera del repositorio): `snap.mjs`, `snapshot-before.json`, `snapshot-after.json`.

```
$ node snap.mjs snapshot-before.json        (antes de tocar src)
fixtures: 11, theories: 5
$ node snap.mjs snapshot-after.json         (después)
fixtures: 11, theories: 6
$ diff snapshot-before.json snapshot-after.json
2c2
<  "theories": 5,
---
>  "theories": 6,
```

Los 11 fixtures dan lo mismo para las cinco teorías anteriores. `doble` no aparece en ningún fixture (ninguno tiene `berner_aviso`). La única diferencia es el contador de teorías, que cuenta `THEORIES.length`. La prueba unitaria «las cinco teorías anteriores siguen en su orden, y doble no aparece en ningún guardado» lo cubre en el repositorio.

### Comandos y salidas reales

```
$ node web/tools/unit.mjs            (última línea)
120 pruebas bien, 0 mal

$ node web/tools/walk.mjs
{ "scenario": "walkthrough", "ok": true, "errors": [], "lines": 425, "deductions": 25, "scene": "bucks_row" }

$ node web/tools/walk.mjs second
{ "scenario": "second", "ok": true, "errors": [], "lines": 429, "deductions": 25, "scene": "bucks_row" }

$ node web/tools/walk.mjs alt
{ "scenario": "alt", "ok": true, "errors": [], "lines": 125, "deductions": 1, "scene": "seance" }

$ node web/tools/walk.mjs mitre6
{ "scenario": "mitre6", "ok": true, "errors": [], "lines": 152, "deductions": 21, "scene": "greaves",
  "seen": { "route": "con aviso y ciudad: llega a Goulston", "oldRoute": "llega a Goulston sin aviso ni City",
            "saveWithApron": "ofrece el aviso sin pista previa", "noNotice": "doble oculta", "clipping": "solo en c4, una vez" } }

$ node web/tools/test-all.mjs
PASS  unit                         0.3s
PASS  smoke                        2.9s
PASS  audio                        0.1s
PASS  scenario beats               0.7s
PASS  scenario brennan             4.9s
PASS  scenario c1-minimal          0.5s
PASS  scenario calm                2.9s
PASS  scenario chapter3            2.9s
PASS  scenario comb-pike           2.0s
PASS  scenario compat              0.4s
PASS  scenario feedback            0.6s
PASS  scenario finale             17.9s
PASS  scenario forense             0.6s
PASS  scenario goulston            5.0s
PASS  scenario hint                0.4s
PASS  scenario hint-ui             0.4s
PASS  scenario integrity           0.3s
PASS  scenario mitre6              0.8s
PASS  scenario mob                 2.3s
PASS  scenario notebook            0.3s
PASS  scenario positions           0.3s
PASS  scenario resume              3.2s
PASS  scenario sanity              27.2s
PASS  scenario seance              2.2s
PASS  scenario second-reading      1.4s
PASS  walk                         4.3s
PASS  walk second                  4.5s
PASS  walk alt                     0.6s
EXIT=0

$ node web/tools/script/export.mjs && git diff --stat -- web/GUION.md
 web/GUION.md | 21 ++++++++++++++++-----
 1 file changed, 16 insertions(+), 5 deletions(-)
```

Lo que cambia en el guion (`git diff -- web/GUION.md`; sin `doble` ni `FINAL_SOURCES`):

- Watkins: el menú (dos opciones nuevas), «found» sin la línea de Stride, «witness» con el vecino, «name» con una línea, y los bloques `berner` y `city`.
- `c4`: el documento «RECORTE DE PRENSA — OCTUBRE DE 1888».
- Pistas: `berner_aviso` (tag y texto).

Estado del repositorio (`git status --porcelain`):

```
 M web/GUION.md
 M web/docs/V4_EXECUTION_LOG.md
 M web/docs/V4_F00_INVENTORY.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/scenes/mitre.js
 M web/src/story/chapters.js
 M web/src/story/data.js
 M web/src/story/positions.js
 M web/src/story/progression.js
 M web/src/story/theories.js
?? web/tests/scenarios/mitre6.js
?? web/tests/unit/mitre.test.mjs
```

### Preguntas abiertas para el observador

- ¿Es aceptable la regla `show` en `theories.js` (desviación 1), o prefieres que `doble` se oculte de otra forma?
- Etiqueta de `city` («¿Quién lleva el caso?») y textos de las hipótesis de `doble`: son decisiones de implementación.
- `no_relacionados` es plausible con solo el aviso. ¿Es lo que quieres, o debe requerir algo más?
- El recorte va antes de la tarjeta «Capítulo IV», después de «Octubre». Si prefieres después de la tarjeta de capítulo, es un cambio de una línea.
- Clasificación de H-04 y del dato de Bishopsgate (desviación 4).

**Revisión de cierre (Opus, V4-06): APPROVED con tres cambios de texto aplicados.** (1) `trozo` dice «la víctima», no el nombre (data.js:146). (2) El título del inspect de Mitre Square es «La mujer de Mitre Square» (mitre.js). (3) Las hipótesis de `doble` quedan: «Probablemente el mismo hombre: la misma noche, a menos de una hora.» y «Sin vínculo por ahora: otra calle y otra jurisdicción.» Deudas: `walkthrough.js` elige opciones por posición (frágil; elegir por texto en F16 o F17). Hallazgos fuera de F06 para F09: Pike nombra a Nichols a las 4:12 del 31 de agosto (bucks_row.js:151,255,266, [A]); Chapman y la hora de su identificación por la pensión (hanbury.js:171,304,308, [U]).

## V4-07 — implementación (pendiente de revisión)

Implementado por el agente implementador (Haiku), sin commit ni push. Base `b735471`. Revisión del observador pendiente.

### Decisiones y textos

- **Documento del Daily News (`story/chapters.js`, `readPaper`).** Se quita la línea «Se ruega a quien reconozca la letra que se presente en Scotland Yard.». Nada más del documento cambia (incluida la frase «Escrita con tinta roja», ver desviación 1).
- **Sospecha de engaño.** Pensamiento de Thomas, solo en la primera lectura: `if (!G.second()) await G.think('Puede que la haya inventado un periodista. Una carta así vende periódicos.');`. No guarda flag ni pista.
- **Pista `carta` (`story/data.js`).** Mismo ID, mismo flag, `truth2` sin cambio. Solo la última frase: «Según el periódico, está escrita con tinta roja.».
- **Comparación de letras (`compareHands`).** Cabecera: «Copia de la carta que circula entre los inspectores y cuatro escrituras». Línea previa a la cita: «La copia de la carta, sin la letra del original:». Pensamiento de `inconclusive`: «Una copia y cuatro letras de mi mesa. Con esto no se acusa a nadie.». Las opciones, `greaves_like`, `self_recognition`, la revisión de muestras y `handwriting_assessment` no cambian. No se añade `handwriting_category` ni `handwritingCategory`.
- **Tests.** `tests/unit/carta.test.mjs` (9 pruebas) y `tests/scenarios/carta.js`. El escenario recorre la persecución limpia de `chapter3` dos veces (primera y segunda lectura) y comprueba la duda y que no quedan flags ni pistas nuevas.

### Posiciones exactas de la sospecha (`web/src/story/chapters.js`)

- Línea 621: `await G.think(G.two('Fechada el 25. La noche que perdí.', ...))`: el pensamiento de la fecha.
- **Línea 622: la sospecha**, dentro de `readPaper`, justo después de la fecha y antes del susurro, de la voz y de «Esa letra la he visto antes».
- Línea 623: `G.audio.whisper(2, 0.14);`.
- Línea 624: `if (G.second()) await G.voice('Jack.');`.
- Línea 625: «Esa letra la he visto antes».

### Desviaciones y observaciones

1. **Restos del grep de E que la especificación no pedía cambiar.** Tres apariciones de «tinta roja» o de autoría sin atribución quedan fuera de la lista:
   - `story/chapters.js:613` (documento de `readPaper`): «Escrita con <b>tinta roja</b>». La especificación dice «Nada más del documento cambia».
   - `story/data.js:180` (deducción `d_rojo`, `text`): «La carta fechada el 25 está escrita en rojo.». Su `truth` no cambia, como se pidió; el `text` no se menciona en la especificación.
   - `story/theories.js:49` (opción de la teoría `carta`): «La escribió Greaves.». Es una hipótesis que el jugador puede elegir, no un hecho del juego, y el archivo no está en la lista.
   Las pruebas de autoría de `carta.test.mjs` cubren `chapters.js` y `data.js`, no `theories.js`; el documento de `readPaper` no se comprueba por «tinta roja». **Requiere decisión del observador.**
2. **H-13.** La especificación dice que la petición de reconocer la letra «es de un cartel posterior con facsímil». No he abierto ninguna fuente: en el registro figura como `[A]` con **FUENTE PENDIENTE**.
3. **Escenario de compatibilidad.** La especificación habla de «escenario compat existente» para `handwriting_assessment`. `tests/scenarios/compat.js` no menciona ese flag. La comprobación de guardados antiguos está en `carta.test.mjs` (unit: un guardado con cada uno de los tres valores conserva su valor, e `normalizeState` es idempotente con él).
4. **Comprobación en navegador.** No se hizo: el cambio es de texto y lo cubren los recorridos headless (`walk`, `chapter3`, `carta`). No hay servidor de vista previa.
5. **Finales de línea.** `tools/script/export.mjs` escribió CR en `GUION.md`. Se normalizó a LF con `sed -i 's/\r$//'`, igual que en V4-06. El `git diff` de `GUION.md` queda en 6 inserciones y 4 eliminaciones.

### Archivos tocados (git status, antes de escribir esta sección)

```
 M web/GUION.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/src/story/chapters.js
 M web/src/story/data.js
?? web/tests/scenarios/carta.js
?? web/tests/unit/carta.test.mjs
```

`git diff --stat` (sin el log): `web/GUION.md` 10, `V4_HISTORICAL_LEDGER.md` 14, `V4_STATE_SCHEMA.md` 14, `chapters.js` 8, `data.js` 2. Todos en `i/lf w/lf`.

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes, 6 teorías: intruso, brennan, carta, horas, rondas, doble)

Scripts y salidas en `scratchpad/v4-07/` (fuera del repositorio): `snapshot.mjs`, `snapshot-before.json`, `snapshot-after.json`.

- Antes de editar: 11 fixtures (todos los de `tests/fixtures/**`, legacy incluido).
- Después: `cmp snapshot-before.json snapshot-after.json` → sin diferencias (`SNAPSHOT: IDENTICAL`).
- `doble` no aparece en ningún fixture (su regla `show` lo oculta). Las demás teorías coinciden antes y después.

### Comandos y salidas reales

```
$ node tools/unit.mjs | tail -1
131 pruebas bien, 0 mal                                  (exit 0)

$ node tools/walk.mjs chapter3
{ "scenario": "chapter3", "ok": true, "errors": [], "lines": 393, "deductions": 12, "scene": "foreshore",
  "seen": { "clean": "inconclusive", "spotted": "greaves_like", "injured": "inconclusive" } }   (exit 0)

$ node tools/walk.mjs carta
{ "scenario": "carta", "ok": true, "errors": [], "lines": 154, "deductions": 12, "scene": "room",
  "first": { "duda": true }, "second": { "duda": false } }                                      (exit 0)

$ node tools/test-all.mjs        (salida completa en scratchpad/v4-07/test-all-final.txt)
PASS  unit    PASS  smoke    PASS  audio    PASS  scenario beats    PASS  scenario brennan
PASS  scenario c1-minimal    PASS  scenario calm    PASS  scenario carta    PASS  scenario chapter3
PASS  scenario comb-pike    PASS  scenario compat    PASS  scenario feedback    PASS  scenario finale
PASS  scenario forense    PASS  scenario goulston    PASS  scenario hint    PASS  scenario hint-ui
PASS  scenario integrity    PASS  scenario mitre6    PASS  scenario mob    PASS  scenario notebook
PASS  scenario positions    PASS  scenario resume    PASS  scenario sanity    PASS  scenario seance
PASS  scenario second-reading    PASS  walk    PASS  walk second    PASS  walk alt
(29 PASS, 0 FAIL, exit 0)

$ node tools/script/export.mjs && git diff --stat -- web/GUION.md
 web/GUION.md | 10 ++++++----      (6 inserciones, 4 eliminaciones)
```

Lo que cambia en el guion (`git diff -- web/GUION.md`, solo esto):

- `readPaper`: el documento sin «Se ruega…».
- `readPaper`: «Puede que la haya inventado un periodista…» dentro de `if (!G.second())`, tras «Fechada el 25…».
- `compareHands`: la cabecera del documento y la línea de la copia; el pensamiento de `inconclusive`.
- Pista `carta`: «Según el periódico, está escrita con tinta roja.».

Grep de la sección E (sobre `web/src`):

```
Se ruega a quien reconozca la letra ........... 0
tal como la reproduce el Daily News ........... 0
Puede que la haya inventado un periodista ..... 1 (src/story/chapters.js:622)
Está escrita con tinta roja (sin atribución) ... 0
autoría como hecho (Greaves/Brennan/prensa) ... 1 (src/story/theories.js:49: 'La escribió Greaves.'; ver desviación 1)
```

### Preguntas abiertas para el observador

- ¿Se quitan «Escrita con tinta roja» del documento (`chapters.js:613`), «escrita en rojo» de `d_rojo.text` y «La escribió Greaves.» de `theories.js:49`? La especificación no los autoriza. Si se cambian, las pruebas de autoría pueden extenderse a esos archivos.
- Fuente de H-13 (cartel posterior con facsímil) y de la circulación de copias (H-35): FUENTE PENDIENTE, primaria en F07/F17.

**Cierre de V4-07 (decisiones del implementador revisadas):** se aceptan el documento del periódico con «escrita con tinta roja» (es la prensa en el mundo del juego), la hipótesis «La escribió Greaves.» (opción de hipótesis, no hecho) y el *test* de compatibilidad que comprueba `handwriting_assessment`. Se modaliza la deducción `d_rojo` a «Según el periódico, la carta fechada el 25 está escrita en rojo.» (un hecho de prensa, no del cuaderno). Ningún cambio de verdad canónica: `d_rojo.truth` y `carta.truth2` siguen atribuyendo la carta a Thomas.

## V4-08 — implementación (pendiente de revisión)

Implementado por el agente implementador (Haiku), sin commit ni push. Base `bb367df`. Revisión del observador pendiente.

### Decisiones y textos

- **Nombre del hotspot.** «Desagüe del Black Ditch» se mantiene (opción a). `intro.js` no se toca.
- **Cabecera de `foreshore.js` (línea 1).** «Limehouse foreshore at low tide, where the culvert of the Black Ditch comes out at the Thames.» (solo comentario).
- **Hotspot `outfall`, solo 1888, primera mirada** (`!G.state.seen?.['foreshore:outfall']`, la marca que el motor ya guarda; sin flag nuevo):
  1. «Ladrillo viejo. El agua sale a borbotones de debajo de la calle.»
  2. Si `perceptionBand(G.state.sanity) !== 'steady'`: «El ruido se calla al acercarme.» y una caída breve de los fondos con `G.audio.setBeds({}, 0.3)`, espera de 1200 ms y `G.audio.setBeds(bed, 1.5)` con el mapa anterior (`G.audio.wantBeds`). Sin destellos ni flags.
  3. `outfall1888` sin cambios.
- **`data.js`, `d_nat`:** «La voz del agua dice nombres en la orilla, donde sale el Ditch. Quien la oye y contesta, cambia.» (mismo ID, `a`, `b` y `profile`).
- **Tests nuevos:** `tests/unit/ditch.test.mjs` (10 pruebas: lectura de `src`, cabecera, nombre, líneas una vez y dentro del hotspot, rama de 1866 limpia, marca `seen` sin flag, condición de cordura y efecto de audio, `outfall1888` intacto, bandas, `d_nat`) y `tests/scenarios/ditch.js` (escenario automático en `test-all`: 1888 con cordura 100, 50 y 20; voz solo con `canEnterFinale`; 1866; brillo; estado guardado idéntico entre bandas salvo la cordura).

### Desviaciones y observaciones

1. **La primera mirada de 1888 no aparece si el desagüe se miró en 1866 (decisión del observador).** El motor marca `seen['foreshore:outfall']` en 1866 y nada la borra al pasar a 1888. Comprobado con una sonda temporal (borrada): tras mirar en 1866, la mirada de 1888 no muestra «Ladrillo viejo…». Por eso la línea solo aparece a quien no miró el desagüe en 1866. Sigue la especificación al pie de la letra; las opciones están en `V4_STATE_SCHEMA.md` §12.
2. **Ruta de la especificación.** La especificación cita `web/tests/scenarios/walkthrough.js:161`; el archivo real es `web/tests/walkthrough.js`, línea 161 (`act('outfall')`). `walk` sigue en PASS. Con la línea nueva, el recorrido hace dos líneas más (426→428 en primera lectura; 429→431 en segunda). El recorrido no mira el desagüe en 1866.
3. **Efecto de audio aplicado** con `setBeds` (API existente). No hizo falta inventar método. En las pruebas headless no hay `AudioContext`, así que el escenario comprueba las llamadas a `setBeds` en lugar del sonido.
4. **Línea de base.** La primera ejecución de `test-all` se paró porque leía `src` mientras editaba. La línea de base final se hizo sobre una copia de HEAD (`git archive bb367df web`): PASS completo, exit 0.
5. **Finales de línea.** `foreshore.js` estaba en CRLF en el árbol de trabajo; se normalizó a LF (`sed -i 's/\r$//'`). `git diff` no lo registra por `.gitattributes`. `GUION.md` se regeneró y se normalizó a LF.
6. **Comprobación en navegador.** No se hizo: el cambio es de texto y audio, y lo cubren los recorridos headless. No hay servidor de vista previa.

### Deuda visual (F11)

- **Escena:** `foreshore` (1888, variante noche).
- **Capa:** `near` (`build`), `web/src/scenes/foreshore.js` líneas 146–149, «the ditch water running out over the mud»: una lámina de agua pintada desde el arco del desagüe (x≈200) hasta x=900 sobre el barro, con dos reflejos. Se lee como un curso abierto que corre por la orilla, no como una salida entubada. No se cambió (arte fuera de la lista). Anotada para F11.

### Tabla de comportamiento (PASO 0)

`web/docs/V4_F00_INVENTORY.md` §9, «Hotspots de foreshore.js (tabla de comportamiento, V4-08)»: `boat`, `jetty`, `outfall`, `stairs`, `water`. Añadida antes de editar `foreshore.js`.

### Archivos tocados (git status)

```
 M web/GUION.md
 M web/docs/V4_F00_INVENTORY.md
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/docs/V4_EXECUTION_LOG.md
 M web/src/scenes/foreshore.js
 M web/src/story/data.js
?? web/tests/scenarios/ditch.js
?? web/tests/unit/ditch.test.mjs
```

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes, `evaluate()` y `statuses()`)

Scripts y salidas en `scratchpad/v4-08/` (fuera del repositorio): `snap.mjs`, `snapshot-before.json`, `snapshot-after.json`.

- `cmp snapshot-before.json snapshot-after.json` → sin diferencias (`SNAPSHOT IDENTICAL`). `d_nat` no es prueba de teoría.

### Comandos y salidas reales

```
$ node tools/unit.mjs | tail -1
141 pruebas bien, 0 mal                                  (exit 0)   [131 antes + 10 de ditch.test.mjs]

$ node tools/walk.mjs
{ "scenario": "walkthrough", "ok": true, "errors": [], "lines": 428, "deductions": 25, "scene": "bucks_row" }   (exit 0)
  (antes: lines 426)

$ node tools/walk.mjs second
{ "scenario": "second", "ok": true, "errors": [], "lines": 431, "deductions": 25, "scene": "bucks_row" }   (exit 0)
  (antes: lines 429)

$ node tools/walk.mjs alt
{ "scenario": "alt", "ok": true, "errors": [], "lines": 125, "deductions": 1, "scene": "seance" }          (exit 0)
  (antes: lines 125)

$ node tools/walk.mjs ditch
{ "scenario": "ditch", "ok": true, "errors": [], "lines": 27, "deductions": 0, "scene": "foreshore" }      (exit 0)
  Contra HEAD: falla («Primera mirada 1888 sin el ladrillo»), y unit da 5 FALLO.

$ node tools/test-all.mjs   (salida en scratchpad/v4-08/testall-final.txt)
PASS  unit   PASS  smoke   PASS  audio   PASS  scenario ditch   ... (todas los escenarios)  PASS  walk   PASS  walk second   PASS  walk alt
(30 PASS, 0 FAIL, EXIT 0)

$ node tools/script/export.mjs && git diff -- web/GUION.md   (solo cambian 2 bloques: el outfall 1888 con sus dos líneas condicionales, y `d_nat`)
```

### Preguntas abiertas para el observador

- ¿Se acepta la limitación de la marca `seen` compartida (desviación 1), o se usa una clave `foreshore:outfall:1888` en `seen`? Lo segundo es un campo nuevo dentro de `seen`.
- Deuda visual F11 (escena `foreshore`, capa `near`, líneas 146–149).
- H-14 y H-36 siguen `[U]` con **FUENTE PENDIENTE** (LAMAS: PDF binario, ficha HTML 403).

**Revisión de cierre (Opus, V4-08): APPROVED con una corrección aplicada.** La primera mirada de 1888 usa la clave `seen['foreshore:outfall:1888']`, no la marca compartida con 1866 (un test cubre el caso «mirar en 1866 primero»). Deuda visual para F11: la lámina de agua de foreshore.js (146–149) se lee como un cauce abierto; debe salir de la boca del colector. H-14 sigue [U] FUENTE PENDIENTE (PDF binario; ficha HTML 403).

## V4-09 — implementación (pendiente de revisión)

Implementado por el agente implementador (Haiku), sin commit ni push. Base `1209c85`. Revisión del observador pendiente.

### Decisiones y textos

- **Línea de llegada de Pike en Buck's Row (A).** No cambia (`scenes/bucks_row.js:151`). El texto que hay es otro: ver la desviación 1.
- **Opción «¿Quién era ella?» (B).** Una sola línea de Pike, con el mismo flag `pike_polly` (`scenes/bucks_row.js:188`): «Lleva un sombrero de paja negro; parece nuevo. Alguien lo eligió con cuidado.» La opción «¿Qué apunta en esa libreta, Pike?» sigue igual y exige `pike_polly`.
- **Hotspot y inspect de Buck's Row (C).** Hotspot: «El cuerpo de la mujer de Buck's Row». Inspect: «La mujer de Buck's Row». Ids sin cambio (`polly`, `polly_taken`, `polly_seen`, `pike_polly`, `nichols`).
- **Libreta de Pike (D)** (`story/chapters.js`, `pikeBook`): «31 ago. — Buck's Row. Avisado a las 4:00. Llega a las 4:12. Botas mojadas. Barro negro.» La línea de Tabram no cambia.
- **Recorte de septiembre (E)** (`story/chapters.js`, `c2`, línea 85): un solo `G.doc`, cabecera «RECORTE DE PRENSA — SEPTIEMBRE DE 1888» y el cuerpo aprobado, sin flag ni pista. Ver la desviación 3.
- **Hanbury Street (F)** (`scenes/hanbury.js`): líneas de Pike 171–172: «Dicen en la casa que es Annie, de Dorset Street. Hay que confirmarlo.» y «Dicen que hacía ganchillo y vendía flores, cuando la salud la dejaba.» Hotspot `annie`: «El cuerpo de la mujer del patio». Inspect: «La mujer del patio de Hanbury Street». Ids sin cambio (`annie`, `annie_taken`, `chapman`). «Dark Annie» y «Annie Chapman» han salido del texto visible (queda el comentario de código de la línea 142, que no cuenta).
- **Recorte de octubre (G)** (`story/chapters.js`, `c4`): tras «…John Kelly reconoció a su compañera, Catherine Eddowes.» se añade «Había vuelto días antes de la recogida del lúpulo en Kent.» Ningún otro cambio en el recorte.
- **Tests nuevos:** `tests/unit/victims.test.mjs` (11 pruebas: lectura de `bucks_row.js` y de `pikeBook`, la opción, la libreta, hotspot e inspect, Hanbury, hora de identificación, recorte de septiembre, recorte de octubre) y `tests/scenarios/victims.js` (escenario automático en `test-all`: recorte una vez y antes de la tarjeta, no al reanudar ni en `c3`; la línea del sombrero, la libreta después y «¿Quién era ella?» no se repite; la línea de la casa en Hanbury; el lúpulo una vez en `c4`).
- **Documentación:** `V4_HISTORICAL_LEDGER.md` (H-19 a cita secundaria; H-04 actualizada por la línea del lúpulo; filas nuevas H-37 a H-44; fuentes y notas V4-09), `V4_STATE_SCHEMA.md` §13, y esta sección. `V4_F00_INVENTORY.md` no se toca (solo texto).

### Desviaciones y observaciones

1. **Línea de llegada de Pike (A): el texto que hay no es el aprobado.** `scenes/bucks_row.js:151` dice «Nichols. Mary Ann. Aquí la llamaban Polly.». La especificación dice que no cambia y que se reporte si dice otra cosa; «No lleva papeles. Hasta que el forense la vea, no hay nombre.» no aparece en ningún archivo del repositorio. Por la regla, no se cambió. Consecuencia: el test `victims.test.mjs` «bucks_row.js no dice en texto visible el nombre ni los datos de vida de la mujer» **falla** («aparece «Nichols»»). Es el único fallo de `unit`. Decisión del observador: cambiar la línea 151 por el texto de A (el test pasa) o eximirla de forma explícita. Nada más de esta escena depende de esa línea.
2. **Test existente de Mitre ajustado (fuera de la lista).** `tests/unit/mitre.test.mjs`: (a) el conteo de «RECORTE DE PRENSA» sobre todo `chapters.js` pasa a contar el de octubre (ahora hay dos, y el de septiembre también empieza así); (b) el párrafo de Kelly que el test fija incluye la frase del lúpulo. Sin estos dos cambios el test falla por diseño, no por regresión. Los escenarios no lo necesitan.
3. **Recorte de septiembre: dónde queda.** Antes de la tarjeta «Capítulo II», dentro de `c2`, después de `G.game.r.fx.fade = 1;` (`chapters.js:85`). No fue necesario el orden alternativo. Sin flag. Patrón equivalente: el recorte de octubre de `c4` tampoco guarda flag. Un replay del capítulo II desde su instantánea lo muestra otra vez, igual que la tarjeta (ver `V4_STATE_SCHEMA.md` §13).
4. **Línea del lúpulo: posición.** «a continuación de la frase de Kelly» se leyó como la primera frase del párrafo («…Catherine Eddowes.»), porque «Había vuelto» habla de Eddowes. La segunda frase («Esa noche…») queda detrás. Si el observador la quiere al final del párrafo, es un cambio de posición.
5. **`GUION.md`: fecha de cabecera.** `export.mjs` estampó «2026-10-11» (antes «2026-10-10»). Es la fecha que escribe el script, no un cambio de contenido. El resto del diff es el previsto.
6. **Finales de línea.** `bucks_row.js`, `hanbury.js`, `chapters.js`, `mitre.test.mjs` y los documentos ya estaban en LF (comprobado con `node`; `git status` estaba limpio). No hubo normalización que revertir.
7. **«Annie» visible fuera de la lista (no cambiado).** Quedan en texto visible: el objeto «Peine de Annie» (`story/data.js:52`) y el objetivo «Poner el peine de Annie sobre la mesa.» (`chapters.js:442`; `scenes/seance.js:195`). La especificación pide no tocar objetos. Decisión para el observador.
8. **Escenarios `compat.js` y `resume.js`.** Tienen regex negativas sobre el texto antiguo de Hanbury («Annie Chapman. Los de la casa», «Dark Annie»). Siguen pasando sin cambio.
9. **Recorrido: líneas.** `walk` 428 → 427 (comparado línea a línea con la base `1209c85`: el sombrero quita 2 líneas de Pike, el recorte de septiembre añade una entrada `[documento]`, y Hanbury cambia dos líneas por dos). `second` 431 → 430 y `alt` 125 → 124, con el mismo efecto (no comparado línea a línea).
10. **Verificación en navegador.** No se hizo: el cambio es de texto y lo cubren los recorridos headless. No se arrancó servidor de vista previa.

### Recompensa emocional (J)

**No hay ningún recuerdo concreto de una víctima en boca de Thomas ni de Wren**, ni en el epílogo (`story/chapters.js`, `epilogue`, líneas 887–950) ni en la segunda lectura. En el epílogo, Thomas responde con «Era Thomas.» (línea 914) y «Puede acordarse.» (línea 917), que no son recuerdos de nadie. La cita más cercana es un pensamiento de Thomas sobre la sala de disección, no sobre la mujer: `scenes/hanbury.js:321` «Lo vi en la sala de disección. No quiero volver a verlo.». No se añadió texto. Queda como **deuda F15: recuerdo concreto de una víctima en boca de Thomas o de Wren (pendiente)**.

### Snapshot de `evaluate()` (11 fixtures, `normalizeState` antes de `evaluate`)

Script y salidas en `scratchpad/v4-09/` (fuera del repositorio): `snapshot.mjs`, `snapshot-before.json` (antes de editar), `snapshot-after.json` (al final).

- `cmp snapshot-before.json snapshot-after.json` → sin diferencias (exit 0), 20531 bytes cada uno.
- Las teorías que aparecen en los fixtures son `intruso`, `brennan`, `carta`, `horas` y `rondas`. `doble` no aparece en ninguno de los 11 fixtures.

### Archivos tocados

```
 M web/GUION.md
 M web/src/scenes/bucks_row.js
 M web/src/scenes/hanbury.js
 M web/src/story/chapters.js
 M web/tests/unit/mitre.test.mjs
 M web/docs/V4_HISTORICAL_LEDGER.md
 M web/docs/V4_STATE_SCHEMA.md
 M web/docs/V4_EXECUTION_LOG.md
?? web/tests/scenarios/victims.js
?? web/tests/unit/victims.test.mjs
```

### Comandos y salidas reales

```
$ node tools/unit.mjs | tail -1
151 pruebas bien, 1 mal                                  (exit 1)
FALLO victims.test.mjs › bucks_row.js no dice en texto visible el nombre ni los datos de vida de la mujer
  aparece «Nichols»                                      (desviación 1)

$ node tools/walk.mjs
{ "scenario": "walkthrough", "ok": true, "errors": [], "lines": 427, "deductions": 25, "scene": "bucks_row" }   (exit 0)
  (base 1209c85: lines 428)

$ node tools/walk.mjs second
{ "scenario": "second", "ok": true, "errors": [], "lines": 430, "deductions": 25, "scene": "bucks_row" }   (exit 0)
  (antes: lines 431)

$ node tools/walk.mjs alt
{ "scenario": "alt", "ok": true, "errors": [], "lines": 124, "deductions": 1, "scene": "seance" }          (exit 0)
  (antes: lines 125)

$ node tools/walk.mjs victims
{ "scenario": "victims", "ok": true, "errors": [], "lines": 48, "deductions": 21, "scene": "greaves", "seen": { ... } }   (exit 0)

$ node tools/test-all.mjs   (salida en scratchpad/v4-09/testall.txt)
FAIL  unit                         (1 prueba: desviación 1)
PASS  smoke, audio, 25 escenarios (incluido «scenario victims»), walk, walk second, walk alt
EXIT=1

$ node tools/script/export.mjs
C:\Dev\HorrorPlay\web\GUION.md: 1523 lines, 357 spoken or thought
$ git diff -- web/GUION.md   (solo cambian: las dos líneas de Pike de Buck's Row, la de la opción, el nombre y el título del hotspot, las dos líneas de Pike de Hanbury, el nombre del hotspot de la mujer del patio, el recorte de septiembre en c2, la línea del lúpulo, la anotación de la libreta, y la fecha de cabecera)
```

### Preguntas abiertas para el observador

- **A (línea 151 de `bucks_row.js`).** Decidir si se cambia por el texto aprobado, y el test de «Nichols» pasa. Es el único FAIL.
- **«Peine de Annie».** Objeto y objetivos de la sesión: ¿cambian en una fase posterior?
- **Posición de la línea del lúpulo** (desviación 4).
- **Deuda F15** (recuerdo concreto de una víctima en boca de Thomas o de Wren).

**Cierre de V4-09 (decisiones):** la línea de Pike al llegar (bucks_row.js:151) decía «Nichols. Mary Ann. Aquí la llamaban Polly.»; se cambia por el texto aprobado «No lleva papeles. Hasta que el forense la vea, no hay nombre.» (el anacronismo de las 4:12). El recorte de octubre pone la frase del lúpulo justo después de «…John Kelly reconoció a su compañera, Catherine Eddowes.». El nombre «Peine de Annie» (objeto) se mantiene: el objeto no afirma identidad. Recompensa emocional (punto 6 del plan): no hay recuerdo concreto de una víctima en boca de Thomas ni de Wren; queda como deuda para F15.

## F10 — medición de ritmo (bloqueada, sin resultado)

- Intento 1 y 2 (CDP, 1280×720, menú → «Nueva partida», velocidad normal): el juego arranca, la introducción termina a los 36 s y la partida queda en `running = 1` sin diálogo visible; el script no elige las opciones, así que no hay «primer control» medible.
- `?metrics` (src/engine/metrics.js) mide `primerControlMs` solo con la primera entrada del jugador. Necesita un jugador real para dar un valor fiable.
- Consecuencia: F10 no puede cerrarse con cifras de tiempo. Pendiente: medición con un jugador humano (protocolo de F17), o un script que elija opciones y espere el ritmo real, aprobado aparte.

## Tanda final (2026-10-11): qué se hizo, qué falta y por qué

**Hecho en esta tanda**
- `tools/build-win.sh`: con la versión por defecto (`1.0-rc`) el número de revisión quedaba vacío y el `AssemblyVersion` salía inválido. Corregido; el build por defecto ya termina con `dist/ElHuesped.exe` (verificado).
- `docs/V4_PLAYTEST_PROTOCOL.md` (F17): protocolo, perfiles, consentimiento, hoja de observación, checklists de escritorio, táctil y Android, criterios de aprobación y estados posibles. Ninguna sesión de playtest realizada.
- `docs/V4_SCENE_DIRECTION.md` (F11): planos por escena con foco, silencio, duración máxima y modo reducido. Ningún plano implementado.

**Pendiente, y por qué**
- **F10 (ritmo):** la medición de tiempo hasta el primer control no tiene resultado válido. Necesita un jugador real o un script que elija opciones y espere el ritmo real (ver la entrada F10 más arriba).
- **F11 (dirección visual):** los planos están escritos, pero su implementación necesita revisión visual en navegador a 1280×720 y móvil.
- **F12 (cordura):** falta instrumentar la cordura en la partida automática (la salida de `walk` no la expone) antes de probar los umbrales.
- **F13 (persecución) y F14 (cuarto capítulo y final):** cambios de guion y de estado; cada uno pide propuesta, revisión del observador, implementación y pruebas. No empezados en esta tanda.
- **F15 (segunda lectura):** pendiente; hereda la recompensa emocional de las víctimas (deuda de F09).
- **F16 (interfaz, accesibilidad, Windows y Android):** el build de Windows está arreglado; la pestaña de teorías sigue desbordando a 720p (desviación aceptada); Android no se puede probar sin dispositivo.
- **F17 (métricas y playtest):** el protocolo está escrito; no hay sesiones de jugadores, así que ninguna fase pasa de `CODE_COMPLETE` a `TESTED`.

**Fuentes:** la mayoría de datos históricos siguen apoyados en fuentes secundarias (ver `V4_HISTORICAL_LEDGER.md`). La verificación con fuente primaria queda para F17.

## F12 (cordura) — pruebas añadidas, 2026-10-11

- `tests/unit/perception.test.mjs`: extremos (0 desgastado, 100 firme; el azar de sonido en 0 es 0,35 y en 100 es 0), y ausencia de cierre por cordura en todo `src/` (búsqueda de «game over» y de una comprobación que cierre con cordura 0).
- Sin cambio de umbrales ni de efectos. La instrumentación de la cordura en la partida automática y la curva por escena siguen pendientes.
- F13 (persecución), F14 (cuarto capítulo y final) y F15 (segunda lectura): no empezadas en esta tanda; cada una pide propuesta, revisión del observador, implementación y pruebas.

## F15 (segunda lectura) — verificación, 2026-10-11

- Atajos: solo con segunda lectura y marca de juego terminado (`chapters.js:36`, `knowsPuzzles`). Verificado por `tests/scenarios/second-reading.js`: sin terminar no hay atajo.
- Una interacción nueva por capítulo: prólogo (barco y hombre con bombín), I (libreta de Pike), II (Wexley), III (borrador de la carta), IV (esqueleto de 1879). Verificado en el mismo escenario.
- Brecha: la segunda lectura NO es más corta. Partida automática: primera 428 líneas; segunda 430. Acortarla exige cortar texto, es decisión de diseño y queda pendiente de revisión del observador.

## F13 (persecución) — implementación parcial, 2026-10-11

Hecho, con el plan revisado por Opus (puntos 2 y 5):
- Ruta limpia: «Nadie me vio. Aún.» (rama `clean` de `endChase`, sale una sola vez).
- Ruta herida: la pista `chase_blood` («Un corte en la palma, con polvo de ladrillo dentro.»), dada en `endChase` antes de volver a la habitación. No entra en FINAL_SOURCES.
- Pruebas: `unit` 154/0; `test-all` 31 PASS.

Pendiente de F13, aprobado por Opus pero no implementado:
- Objeto visual en `room` c3b (abrigo, bombín y linterna colgados), con quitar la ropa al jugador en c3b y devolvérsela al salir (puntos 3 a-e). No está hecho: toca el personaje y la maquetación.
- Lugar del primer error (`chase_seen_at`) para el periódico y Pike (punto 4).
- Pruebas de reanudación en c3b, salida a c4 y venda en c4 (punto 6).

## F13 — cierre de implementación, 2026-10-11

Hecho:
- Vestuario según lugar y fase: `Game.dressFor` (game.js), llamado en cada cambio de escena. En `room` con `room_phase='c3b'` Thomas no lleva bombín ni linterna y el abrigo es el de camisa; en cualquier otro sitio vuelve a vestirse. No se guarda nada: se deriva de la escena y de `room_phase`.
- En c3b, el abrigo, el bombín y la linterna cuelgan de las perchas (room.js), aunque `coat_on` y `lantern_taken` sean verdaderos. Hotspot `coat` no reutilizado.
- Lugar del primer error: `flags.chase_seen_at` = `wentworth` | `flower_dean` | `thrawl` (alleys.js), y el periódico y las respuestas de Pike lo nombran (chapters.js, `chaseStreet`). La ruta limpia no nombra calle.
- Pruebas: `tests/scenarios/chase13.js` (vestuario en c3b, fuera, otras fases y c4); `chapter3` actualizado a la frase nueva de Pike en ruta limpia. `unit` 154/0; `test-all` 32 PASS.
- Verificación en navegador: se cargó la habitación en c3b con el estado de juego (`hat: none`, `lantern: false`) y el abrigo cuelga de su percha. La figura de Thomas es demasiado pequeña en la captura para confirmar a simple vista la ausencia del bombín: **VISUAL_PARTIAL**.

Pendiente de F13 (no implementado):
- Venda visible en la mano en c4 para la ruta herida (`chase_outcome='injured'`). La línea de Greaves y la de Pike ya la mencionan; falta el dibujo.
- Reanudación desde c3b por guardado: `dressFor` se aplica al cambiar de escena, y `resume` pasa por `goto`; no se ha probado con un guardado real en navegador.

## F14 — cuarto capítulo y final, primera parte, 2026-10-11

Hecho:
- `readFile` es de una sola vez: el expediente se muestra siempre, pero la secuencia (cordura, Greaves, la transición final) solo corre la primera vez (`if (G.flag('file_read')) return;` en chapters.js). Antes, mirar la vitrina otra vez volvía a bajar la cordura y repetía la conversación. Prueba: `tests/scenarios/expediente14.js`.
- `unit` 154/0; `test-all` 33 PASS, 0 FAIL.

Pendiente de F14 (no implementado todavía):
- Ocasión para sostener o revisar una interpretación antes de que Greaves exponga el expediente (usar `investigation.positions`).
- Verificación de la firma `JACK` (entrada vacía, Unicode, teclado móvil, doble confirmación) y la matriz 1866/1879 × intenciones de Pike × actitudes del agua × bandas de cordura.
- Gate de tres fuentes: revisar que el barro y las percepciones no cuenten doble.

## F14 — firma JACK, casos de prueba, 2026-10-11

- Pruebas añadidas (`tests/unit/signature.test.mjs`): acentos, Unicode, emoji, espacios y texto muy largo acaban en `Jack`.
- Doble confirmación: `ui.nameEntry` quita los oyentes de Enter y del botón antes de continuar, así que un segundo clic o tecla no registra la firma dos veces. Sin cambio de código; anotado.
- Pendiente de F14: la ocasión de revisar una interpretación antes del expediente (narrativa: necesita propuesta para el observador) y la matriz 1866/1879 × intenciones × actitudes × bandas.

## F14 — matriz del final, 2026-10-11

- `tests/scenarios/finale14.js`: 18 recorridos completos desde el cuarto capítulo. Ambos caminos de 1866/1879 × las tres intenciones de Pike × las tres actitudes del agua × tres bandas de cordura (100, 50, 10). Las combinaciones se eligen con un arreglo ortogonal L9 para cada camino, de modo que todos los pares de factores aparecen.
- Cada recorrido comprueba: intención, laguna, respeto a 1866, reconocimiento con tres pruebas, actitud ante el agua, sin entrada nueva en 1888, lo que Wren muestra, el epílogo, la firma `Jack` y la vuelta al menú.
- Limitación: la cordura se fija al empezar cada recorrido; no se comprueba la banda en cada paso de la partida.
- Pendiente de F14: la ocasión de revisión antes del expediente (narrativa, necesita propuesta del observador) y el gate de tres fuentes (revisar que el barro no cuente).

## F14 — gate de tres fuentes, 2026-10-11

- `tests/unit/gate14.test.mjs`: la percepción de Goulston (`aqui_estoy`, `d_aqui`), la pista histórica y la herida no son fuentes finales; las conclusiones de zurdera (`d_zurdo`, `d_bisturi`) no cuentan; el barro y dos fuentes no abren el final; tres fuentes distintas sí, con o sin forense. Sin cambio de código: el gate ya se comportaba así, ahora está comprobado.
- Pendiente de F14: la ocasión de revisión de una interpretación antes del expediente (narrativa, necesita propuesta del observador).

## Corrección tras la auditoría de 05c15bd, 2026-10-11

- **Prólogo infantil (P1, regresión mía):** `dressFor` sobrescribía el aspecto del niño al cambiar de escena. Ahora no toca al personaje mientras el capítulo es `prologue`. Prueba añadida en `chase13.js`.
- **Confrontación de Greaves interrumpida (P0, verificado por lectura):** `file_read` se marcaba al ver el expediente, pero la salida de la escena solo ocurría al final; si se guardaba a mitad, la puerta exigía `file_read` y quedaba sin salida. Ahora `greaves_done` se marca justo antes de salir al río, la vitrina muestra solo la página cuando ya está hecha, y la puerta reanuda la secuencia si no lo está. Pendiente: prueba automática de la reanudación real (exige elegir opciones del diálogo).
- **Ropa de c3b en el atlas normal (P1):** no resuelto. El motor dibuja Thomas desde el atlas cuando hay frames del modelo, y `dressFor` solo cambia propiedades. Necesita verificación con capturas a 1280×720 y, probablemente, un atlas o un fallback para c3b.
- Suite: `unit` 161/0; `test-all` 0 FAIL.

## Ropa de c3b en el dibujo real, 2026-10-11

- Causa: el atlas del modelo dibuja a Thomas vestido aunque las propiedades cambien. Solución: en `dressFor`, en c3b el personaje no usa el modelo (se dibuja procedural, sin sombrero ni linterna); en cualquier otro sitio se restaura el modelo.
- Verificación en navegador (Chrome, 1280×720, zoom sobre la figura): vestido, abrigo oscuro y bombín con el atlas; en c3b, figura procedural sin bombín, camisa visible. Diferencia comprobada. Pendiente: captura guardada y prueba de reanudación desde c3b.

## Lote 2026-10-11: F13 completo en lo automatizable, F12 instrumentación

- **F13:** reanudar en c3b devuelve a Thomas sin bombín ni linterna; reanudar tras la habitación lo devuelve vestido (`chase13.js`). **Venda** para la ruta herida: se dibuja en la mano (actor.js) y el personaje herido se dibuja de forma procedural. Prueba: venda solo tras ruta herida. Pendiente: captura del vendaje en navegador.
- **F12:** `tools/walk.mjs` imprime ahora la curva de cordura por cambio de escena (`sanityCurve`, `sanityAtZeroScenes`, `sanityEnd`). Partida automática: la cordura baja de 100 a 33 en Goulston y llega a 0 tras la confrontación con Greaves en c4 (tres cambios de escena a cero). **Sin rebalanceo**: el plan exige revisión antes de tocar porcentajes o efectos; queda como propuesta pendiente de revisión.
- Suite: `test-all` sin fallos (ver salida en el commit).

## F14 — ocasión de postura antes del expediente, 2026-10-11

Implementada tras la revisión del observador (REQUEST_CHANGES, aplicados sus hallazgos):
- Al usar la llave sobre la vitrina, en la primera lectura, antes de despertar y con la carta en el cuaderno, Thomas elige una lectura de la carta: «Todavía no sé quién la escribió.» (primera, por defecto), «La carta pudo escribirla Greaves.», «Alguien que entra en mi cuarto.». Escribe `investigation.positions.letter_author` mediante `G.game.setPosition`. Sin flag, pista, cordura, cambio de escena ni gate.
- Sin frase de «puedo cambiarlo más tarde» (no era cierta: la secuencia va sin pausa hasta despertar).
- Greaves no dice «No acusaste a nadie por una letra» cuando la postura elegida es Greaves.
- Pruebas: las seis que responden a la vitrina añaden la nueva respuesta; `letter14.js` comprueba que la postura se guarda una vez, que la intención final no cambia, y que despierto no se ofrece.
- Pendiente: la validación en móvil de que el cuadro de opciones no tapa el sprite (sin dispositivo).

## Auditoría 05c15bd — P0 Greaves y pruebas reales de F13, 2026-10-11

**P0, reanudación de la confrontación.** Reproducido antes del cambio con `greaves_resume14.js`:
- Un guardado tomado mientras corre un guion (p. ej. al minimizar la app a mitad de la confrontación) se escribía igual. Ahora `autosave()` no escribe mientras `game.running` (igual que ya hacía `onPause`); el guardado al terminar el guion cubre el punto.
- Al reanudar con el expediente ya leído, `readFile` volvía a cobrar el descubrimiento: 60 → 35 de cordura (−10 del expediente y −15 del corte). Ahora el descubrimiento (pistas, −10 y los dos pensamientos) solo ocurre en la primera lectura; una lectura posterior, con la confrontación sin terminar, sigue directamente con la confrontación (−15 solo). Verificado: 60 → 45.
- Residual sin verificar: un guardado de una versión anterior, tomado justo después del corte, repetiría el corte una vez. No es detectable sin un marcador nuevo; se deja así hasta prueba en dispositivo.
- Pérdida asumida: si la app se cierra durante un guion largo, la reanudación vuelve al último final de guion (no al instante exacto).

**F13, calle del primer error.** `chaseStreet` pasa a `data.js` (una sola fuente). La etiqueta de la pista de la sangre (`chase_blood`) sigue la calle del primer error, igual que el periódico y Pike; antes estaba fija en «Wentworth Street». `chase14.js` recorre tres primeros errores (Wentworth, Flower and Dean, Thrawl) y comprueba `chase_seen_at`, la etiqueta y la frase de Pike. Nota: la ruta herida necesita los tres cruces mal, así que su primer error siempre es Wentworth; el cambio de la línea de la herida es defensivo.

**Pruebas.** `test-all`: 37 PASS, 0 FAIL, exit 0 (incluye `greaves_resume14`, `chase14`, `letter14`, `expediente14`, `finale14`).

**Pendiente, no ejecutado:** prueba de pausa real de Android a mitad de la confrontación; capturas de la venda y la ropa de c3b en 1280×720 y móvil; validación de la postura en teclado y móvil.

**Revisión del observador sobre be81e32:** APPROVE, sin P0 ni P1 introducidos. Cambios posteriores de pruebas (sin tocar el juego): `greaves_resume14` prueba también la primera lectura (−10 y −25 en total, dos pistas, primer pensamiento) y `window.__appPause()` a mitad de guion; `chase14` comprueba el texto del periódico y la frase de Pike para cada calle.

**Residuales abiertos (no los introduce este lote):**
- Guardados escritos por la versión anterior justo después del corte repiten el corte (−15) al reanudar. No hay marcador que los distinga.
- Guardados antiguos tomados en `foreshore` durante las escaleras o `finaleIntro` tienen `greaves_done` pero no `awake` ni la pista de la ficha: nada vuelve a lanzar `finaleIntro`. Reparar exige decidir qué estado se les da; no se toca sin esa decisión.
- Sin probar: la pausa real de Android a mitad de la confrontación, y la pintura de la etiqueta de la pista en el cuaderno (el test llama a la función de la etiqueta, no al render).

## F12 — cordura: costes pagados una vez y curva medida, 2026-10-11

- Doce objetos restaban cordura en cada vistazo (una segunda pasada: unos 45 puntos). Ahora `G.sanityOnce(clave, delta)` cobra la primera vez y deja la marca en `flags.cost_<clave>`; la reacción sigue. Sitios: frascos, falda (Bucks Row), hombro (Hanbury), cara, vientre y muñeca (Mitre), estuche y fotografía (habitación), espejo desde la tercera mirada, reloj, carta astral y despedida de Wexley (sesión).
- Curva del recorrido principal medida y sin cambios por el cambio: 0 a partir de la confrontación de Greaves. Recomendación sobre los costes guionizados en `docs/V4_SANITY_CURVE.md`, sin aplicar: requiere revisión del observador y playtest.
- Pruebas: `cost14.js`; `test-all` 38 PASS, 0 FAIL.
- Sin prueba: diez de los doce sitios (los puntos de inspección de Mitre, Hanbury y Bucks Row, y la sesión). El cambio se ha revisado por lectura de código y el observador no ha ejecutado esas escenas.

## F11 — dirección visual: la boca del colector, 2026-10-11

- La lámina de agua de la orilla se pintaba antes del suelo de barro, que la tapaba entera. Ahora se pinta encima: una poza bajo el arco, una lengua que se adelgaza hasta x≈480 y dos reflejos en la boca. Verificado con capturas de Chrome headless (`1280×720` completo, recorte 3× antes/después, `1920×1080`).
- No implementado: los demás planos de `V4_SCENE_DIRECTION.md` (encuadres, duraciones máximas, modos reducidos por toma). Requieren revisión visual de cada escena; quedan como pendientes.
- `test-all`: 38 PASS, 0 FAIL.

## F15 — segunda lectura medida con su marca, 2026-10-11

- El recorrido de segunda lectura (`walk second`) activaba `flags.second` pero no la marca `Game.markRead()`, así que los atajos de puzle (`knowsPuzzles`) nunca se ejercitaban ni se medían. Ahora la marca se pone con la segunda lectura, como en una partida terminada.
- Medido con `WALK_LOG` y `read-count.mjs`: primera lectura 202 líneas, 9289 caracteres, 38 elecciones, 10 documentos. Segunda lectura: 200 líneas, 8947 caracteres, 36 elecciones, 8 documentos. Antes del cambio de marca, la segunda parecía igual de larga (205 líneas), porque no se aplicaban atajos.
- Atajos existentes: la ronda de Pike (`chapters.js`, «Ya lo sé: de 3:30 a 3:40») y los golpes (`HOSPES`). No hay más.
- Aclaración: las cifras 428/430 de las secciones anteriores son líneas totales del arnés (ver la nota de `walk` más arriba en este registro) y quedan superadas por `read-count`. Con `read-count`, la segunda lectura es un 1 % más corta en líneas y un 4 % en caracteres: la brecha de duración sigue abierta.
- Los atajos se comprueban en el recorrido: `walk second` exige «Ya lo sé» y «Ya sé lo que dicen: HOSPES» en el registro, y `walk` exige que no aparezcan.
- No hecho: una interacción distinta por capítulo que reinterprete un hecho anterior (requisito 2) y la recompensa emocional de las víctimas (deuda de F09). Son decisiones de contenido y de canon que requieren revisión del observador antes de escribirse.
- `test-all`: 38 PASS, 0 FAIL.

## F10 — ritmo de apertura medido con un banco, 2026-10-11

- `web/tools/pacing-bench.mjs`: partida nueva en Chrome headless (1280×720), sin saltar el intro, sin pulsar en el registro. Lector modelado: una línea espera 700 ms más 40 ms por carácter desde que termina de escribirse; un documento, 2000 ms más 25 ms por carácter (unos 40 caracteres por segundo: un lector optimista); la firma, 1,5 s; una elección, 1,2 s y la primera opción. Cada espera empieza tras un sondeo de 150 ms y las llamadas CDP, así que los tiempos reales son 0,15–0,4 s mayores. Es un modelo, no la medida de una persona: la medida es F17.
- Antes de F10 (medido con el mismo banco en versión anterior): control del jugador a 52,5, 52,7 y 52,8 s (mediana 52,7 s). El intro terminaba a 36,4 s.
- Cambios de F10 en `story/intro.js` (solo tiempos): tecleo del registro: párrafos de 26 a 20 ms por carácter, encabezados de 34 a 26 ms; línea de la calle a 2400 ms (antes 2900); página a 42 ms por carácter (antes 55); espera tras la página a 1300 ms (antes 1800). La espera tras el registro pasó de 2200 ms a 1500 (probada: el registro se iba antes de leerse), a 5000 (probada: el observador calculó que tampoco bastaba) y a 8000 ms, que es la versión actual.
- Versión actual (3 partidas en la versión de 8 s, y una más en la versión final del banco): control a 54,0, 54,0 y 54,1 s (mediana 54,0 s); el intro termina a 37,9 s. Frente a antes de F10: **1,3 s más lento**. Las velocidades de F10 se conservan; lo que pesa es la espera del registro, que se alarga para que un lector llegue a la última fila. Ningún texto ni secuencia ha cambiado (solo tiempos y, en la pulsación, lo descrito abajo).
- Cambio de interacción (sin medir por el banco, que no pulsa): mientras el registro está en pantalla, una pulsación lo cierra y el intro sigue; antes, cualquier pulsación saltaba el intro entero. Comprobado en Chrome headless: la pulsación cierra el registro, y la línea de la calle aparece a continuación. Un lector que pulse no espera el registro completo.
- No medido: la primera deducción (capítulo I, después de escenas que exigen acciones del jugador). El banco no las recorre.
- Pendiente de decisión (F17, o una decisión tuya): la duración del intro para quien no pulsa. Con 8 s de espera, el registro cae a unos 19,6 s de aparecer: un lector a 17 caracteres por segundo se queda unos 2 s corto, y lo cierra la pulsación.
- `test-all`: 38 PASS, 0 FAIL (ver la sección de F15 de este registro para la última ejecución).

## F15 — recuerdo personal de Thomas y recorte corregido, 2026-10-11

- **Decisión del autor (aprobada para implementación):** la línea de Wren se retira del epílogo. En su lugar, en la segunda lectura, al examinar por primera vez el cuerpo de Buck's Row, Thomas piensa: «Recuerdo el sombrero junto a su cuerpo. Recuerdo mejor el sombrero que su rostro. Se llamaba Polly.» (`scenes/bucks_row.js`, hotspot `polly`; una vez, marca `s2_polly`). Es un recuerdo de Thomas, basado en lo que vio, no palabras atribuidas a la víctima. El sombrero ya está dibujado junto al cuerpo (la franja oscura de `drawNear`).
- **Recorte del capítulo II (`story/chapters.js`):** corregido para separar las conversaciones. (a) El encargado del alojamiento niega la cama por los cuatro peniques; la víctima dice que conseguiría el dinero y menciona su sombrero nuevo (*The Times*, 1-IX-1888, que en el original dice *bonnet*). (b) Emily Holland, con quien se cruzó en Osborne Street, declara que no tardaría en regresar (*Eastern Argus*, 8-IX-1888). Ya no se atribuyen a una misma persona las palabras de las dos.
- **Fuentes:** solo las leídas, en H-38. *Pall Mall Gazette* y *Daily Telegraph* no se han consultado en texto por esta revisión. Son transcripciones digitales de Casebook, no facsímiles cotejados.
- Walkthrough: el recuerdo sale en la segunda lectura y no en la primera. `test-all`: 38 PASS, 0 FAIL (unidad: 161 bien, 0 mal).
- No inventado: ninguna memoria de Wren ni palabras atribuidas históricamente a Polly en primera persona.


## F16 — objetivos táctiles en el cuaderno y la barra, 2026-10-11

- Medido en Chrome headless con la clase `touch` (la que pone el juego en un puntero grueso; se añade desde el script de la prueba, no se emula el puntero) a 1280×720, 640×360 y 800×360. Antes: los botones de la barra medían 35–41 px de alto y las pestañas del cuaderno 18 px en apaisado de teléfono; ningún desbordamiento horizontal.
- Cambio en `styles.css` (modo táctil): caja mínima de 44 px para los botones de la barra, las pestañas del cuaderno, «¿Qué hago ahora?» y «Cerrar». Después: ningún objetivo por debajo de 44 px en las tres medidas.
- Con 640×360 y `touch`, «Cerrar» y «¿Qué hago ahora?» invaden unos 14 px del relleno inferior de la página (medido a ojo en la captura de trabajo, no versionada). No rompe nada: los botones quedan dentro de la pantalla.
- Pendiente, no hecho: la pulsación que arma y la segunda que ejecuta en un dispositivo real; el retorno con el botón atrás de Android; la legibilidad con luz real; la instalación del APK. Requieren un teléfono.

## F12 — opción A (decisión del autor), 2026-10-11

- Objetivo del autor: la ruta principal llega a Greaves con 25–35 de cordura; el −10 del expediente y el −15 del corte se conservan; 65/35 sin cambios; Goulston conserva su momento.
- Medido con un rastro temporal del recorrido principal (retirado): sin suelo, los costes previos a Greaves eran 142 y las ganancias 45; la cordura tocaba cero en la habitación del capítulo III y lo perdido en el suelo no contaba.
- Cambio: once costes bajan (cuatro deducciones erróneas de −6 a −4; Wexley −10 a −6; dedos −8 a −5; letra −6 a −4; Wren −5 a −3; Goulston −8 a −5; Mitre −4/−5/−6 a −3/−3/−4; Hanbury −5 a −3; séance −3 a −2 en dos sitios). Ningún coste nuevo.
- Resultado: llegada a Greaves en la ruta principal 10 → 34; persecución limpia 30 → 43; un error 27 → 40; tres errores 21 → 34. Tras la confrontación, la ruta principal queda en 2.
- Comprobado: `tests/scenarios/sanity14.js` (las tres persecuciones entre 25 y 45; un segundo vistazo a los frascos no cuesta; un guardado antiguo carga como antes).
- Revisión del observador: pendiente de esta entrada (ver el commit). `test-all`: 39 PASS, 0 FAIL.

## F10 y F11 (plano 1, introducción) — apertura de unos 13 segundos, 2026-10-11

- **Decisión del autor:** primer control en 30 s o menos en la reproducción automatizada normal, sin saltar la introducción; apertura cinematográfica de unos 10–15 s; conservar el cuaderno hallado, las dos caligrafías y la firma; el registro completo, fuera de la apertura.
- `story/intro.js`: la apertura son tres planos. (1) «Hallado en el desagüe del Black Ditch. Dos caligrafías.» (2) Una línea sobre Whitechapel bajo la lluvia, con el encuadre que se desplaza despacio. (3) La primera página en su mano y la firma. Silencio antes de la página. Unos 13 s en total.
- El registro policial completo sale del intro y queda en el menú (`Registro de efectos`, título y pausa), como documento de 1888 y no como objeto de Thomas (`recordHtml`).
- Movimiento reducido: el encuadre de la calle se mantiene fijo (medido en el navegador: con movimiento normal el foco pasa de 2018 a 1718; con movimiento reducido, se queda en 2100). Para que sea verdad, la intro quita el balanceo del menú (`menuPan`) al empezar.
- `story/chapters.js` (prólogo): la tarjeta «Limehouse» y el fundido a la orilla se solapan (la tarjeta dura 2,6 s); el control llega antes sin cortar ninguna línea.
- **Medido con `pacing-bench.mjs` (3 partidas):** primer control 29,4 s (mediana; 29,1 a 29,8 s). La apertura termina a 15,5 s. Antes de F10 era 52,7 s.
- **Pulsar para avanzar:** en la apertura no hay decisiones. Una pulsación la salta; una segunda pulsación en 600 ms no la salta. Los escuchadores de la apertura se retiran antes de la firma y de cualquier decisión (`finally`).
- **Capturas:** 1280×720 (hallado, calle, página) y 1920×1080 (calle; `intro-1920x1080-street.png`), en el directorio de trabajo, no versionadas.
- **Pendiente:** la captura de 1920×1080 de la página y la verificación en un dispositivo táctil.

## F12 — correcciones tras la revisión del observador, 2026-10-11

- Mitre: la cara (−4) y el vientre (−5) vuelven a sus valores anteriores. La rebaja no devuelve Mitre a strained: ya sube sobre 65 por las rebajas anteriores (medido: Mitre 61 → 76). Se documenta el cambio de banda.
- La curva de `V4_SANITY_CURVE.md` se ha vuelto a medir con `walk` y con `sanity14`; se incluyen las bandas de cada escena y sus efectos en la percepción. Las cifras antiguas (llegada 34 y «+7») se corrigen: la llegada a Greaves, tras el coste de entrada, es 28 en la ruta principal; antes del coste de entrada, 31.
- `walkthrough.js` exige que la ruta principal llegue a Greaves con 25–35 tras la entrada (medido: 28).
- `sanity14.js`: las persecuciones llegan a Greaves con 40, 37 y 31 tras la entrada (antes 30, 27 y 21).

## F15 — correcciones tras la revisión del observador, 2026-10-11

- Pike (`bucks_row.js`): «Tiene al lado un sombrero de paja negro…» (antes «Lleva…»), para que coincida con el dibujo y con el recuerdo de Thomas. Corrección de palabra, no de hecho (ver H-39).
- Recuerdo de Thomas: «La llamaban Polly.» (antes «Se llamaba Polly.»), misma idea, sin afirmar un nombre de pila que la prensa no da en esa forma.
- Epílogo: no hay cambio. El recorte del capítulo II (`chapters.js`): «Emily Holland, con quien se cruzó en Osborne Street, declaró que la víctima le dijo que no tardaría en regresar.» (antes, el sujeto podía leerse como Holland).
- Los cuatro peniques: no aparecen en *The Times* ni en la *Eastern Argus* leídas; quedan como **decisión del autor** sobre una fuente secundaria (ver H-38).
- Grafías y «bonnet»: `Osborne` es la grafía de la prensa leída; `bonnet` se traduce como «sombrero» (decisión, H-38).

## Estado de revisión

- Las correcciones de F12 y F15 se han enviado a la revisión del observador (ver el mensaje de revisión; pendiente de veredicto en el momento de este commit).
- `test-all`: 39 PASS, 0 FAIL.

## F11 (plano 2, Goulston y la aparición de HERE I AM), 2026-10-11

- Implementado en `scenes/goulston.js`: antes de la visión de la tiza, un encuadre cercano a la jamba (zoom 1,6 hacia el portal) y silencio de los fondos; después, el encuadre vuelve a 1 y los fondos de la escena regresan. Con movimiento reducido no hay zoom: el encuadre queda fijo.
- Comprobado: sintaxis, `walk` y `walk second` en PASS; `test-all` en PASS.
- **No comprobado:** la captura de la aparición en el navegador. Un salto directo a la puerta (`?scene=goulston`) llega primero a la persecución de Agente Long, así que no se consiguió el momento de la tiza; la captura de prueba se descartó. Pendiente: capturar la visión en 1280×720 y 1920×1080 y verificar el modo reducido.
- Plano 3 (mesa de Wexley y sesión), plano 4 (expediente y confrontación) y plano 5 (firma en JACK): pendientes.

- Revisión del observador sobre d375728 (por lectura): APPROVE del encuadre y el silencio. Dos puntos atendidos después: (1) la música «dread» de la escena no se apagaba con `setBeds`; ahora la apertura de la visión la detiene (`playMusic(null)`, se apaga en unos 2,5 s) y la vuelve a poner al terminar; (2) el regreso de los fondos usa la misma forma que `game.js` (objeto o función). Comprobado con `walk`, `walk second` y `test-all` (39 PASS), no en audio real. Pendiente: escucharlo en un navegador con sonido.

- Revisión del observador sobre 5035df1 (por lectura): REQUEST_CHANGES por tiempos. Corregido: primero se silencian los fondos (0,8 s) y la música (`playMusic(null, 0.6)`, nueva duración de fundido; el valor por defecto de 2,5 s sigue para los cambios de escena); después 0,9 s de espera; luego la visión; y 1,5 s de silencio tras ella, en las dos lecturas. Solo entonces vuelven los fondos y la pista de la escena. Con movimiento reducido el silencio llega igual. Al volver, la pista de la escena empieza de nuevo con su entrada de 3 s (anotado, como indicó el observador). Pendiente: escucharlo en un navegador con sonido.

- Revisión del observador sobre 219af8d (por lectura): APPROVE del orden. Comprobado: la escena de Goulston no tiene emisores de escena (no define `sounds`). Pendiente de escuchar: la capa de ciudad (`setSpace`) y los sonidos de los objetos vivos de la escena (Drip, Rat, Cat) siguen sonando durante el silencio si suenan; si se quiere silencio total, hay que decidirlo al oído.

## F11 (plano 3, mesa de Wexley y sesión), 2026-10-11

- `story/chapters.js` (`seance`): antes de que Wexley pida las manos, el encuadre va a la mesa a media distancia (zoom 1,25 centrado en `tableX`, nuevo dato de la escena en `scenes/seance.js`) y la sala calla un momento (fondos a cero en 0,8 s, 1,2 s de espera). Los fondos de la sesión vuelven con su línea siguiente, como antes. Al terminar la sesión el encuadre vuelve a 1.
- Movimiento reducido: sin zoom. Además, `frameDialogue` (`engine/game.js`), el acercamiento suave que el juego hacía en cualquier diálogo, ya no actúa con movimiento reducido en ninguna escena.
- Comprobado en Chrome headless, en la primera línea de Wexley: zoom 1,25 con movimiento normal (capturas a 1280×720 y 1920×1080, no versionadas); zoom 0 con movimiento reducido. El encuadre no tapa la mesa, los personajes ni el subtítulo.
- `walk`, `walk second` y `test-all` (39 PASS). No escuchado en un navegador con sonido.

- Revisión del observador sobre 6870ae9 (por lectura): APPROVE. Atendidos sus dos puntos: el respiro antes de Wexley pasa de 1,2 a 1,8 s; y `G.zoom` (`engine/game.js`) no acerca la cámara con movimiento reducido en ningún sitio (solo deja pasar el regreso a 1). Así quedan cubiertos también los acercamientos del epílogo y de la firma, que antes se escapaban; se quitan las comprobaciones sueltas de Goulston y de la sesión. Vuelto a comprobar en el navegador: sesión con zoom 1,25 (normal) y 0 (reducido).

## F11 (plano 4, expediente de Greaves), 2026-10-11

- `story/chapters.js` (`readFile`): la página del expediente ya es el primer plano (el documento ocupa la pantalla). Al abrirla, la sala se corta en 0,2 s (corte, no fundido) y queda en silencio mientras se lee; al cerrarla, vuelven los fondos de la escena en 1,2 s, con la misma forma que `game.js`. Greaves no tiene música (`music: null`).
- La confrontación ya usaba `cinema` y su visión; no se cambia. Pendiente: captura del expediente y de la confrontación en 1280×720 y 1920×1080; no escuchado con sonido.
- `test-all`: 39 PASS.

## F11 (plano 5, la firma que se convierte en JACK), 2026-10-12

- `story/chapters.js` (epílogo): la firma se escribe en silencio. Los fondos (y la pista, si el lugar la tiene) bajan en 0,6 s antes de escribir y vuelven con el golpe de sonido final. La transformación (`ui.nameEntry`, `signature.js`) no cambia: el campo se desenfoca antes de empezar (sin teclado superpuesto en móvil) y las letras cambian despacio.
- Comprobado en Chrome headless llamando a la pantalla de la firma con «Thomas Ashgrove»: a 1280×720 y 1920×1080, a mitad de la transformación se lee «Thom» y termina en «Jack» unos 5,6 s después de pulsar «Firmar» (el plano pide 10 s como máximo). Capturas no versionadas.
- Movimiento reducido: el acercamiento del epílogo ya no actúa (`G.zoom`, desde f45bdf7); la transformación es un cambio de letras, sin movimiento de cámara.
- No comprobado: el epílogo completo en el navegador y el silencio al oído. `test-all`: 39 PASS.

- Revisión del observador sobre f45bdf7 y e297124 (por lectura): APPROVE, sin P0, P1 ni P2. Anotado: el paneo de la intro mantiene su propia comprobación de movimiento reducido porque mueve `camFocus`, no `G.zoom`; el silencio de la firma dura lo que tarde el jugador en escribir (vigilar en F17).

## F11 (planos de Polly, Wren y Annie), 2026-10-12

- **Hallazgo de Polly** (`scenes/bucks_row.js`, entrada): mientras habla Pike, encuadre medio (zoom 1,2) que abarca el cuerpo, la lámpara, a Pike, a Neil y a Thomas, con los fondos y la música «dread» en silencio; vuelven con el objetivo. Capturas a 1280×720 y 1920×1080; con movimiento reducido, sin zoom.
- **Primer encuentro con Wren** (`scenes/knackers.js`): desde «No se acerque.» hasta su nombre, encuadre medio (zoom 1,25) sobre la niña en las cajas y silencio; después vuelven el encuadre y el sonido. Capturas a 1280×720 y 1920×1080; con movimiento reducido, sin zoom.
- **Examen de Annie** (`scenes/hanbury.js`): el primer plano ya es el pintado de la inspección; se añade silencio (fondos y música) mientras dura y la vuelta del sonido al cerrarlo. Sin captura.
- Ningún encuadre tapa pruebas, personajes ni subtítulos en las capturas. Nada escuchado con sonido. `test-all`: 39 PASS.
- Revisión del observador sobre 2774922: REQUEST_CHANGES (la lluvia visible quedaba muda). Corregido: en Buck's Row y en el desolladero la lluvia baja (0,12 y 0,08) sin apagarse, y se cortan viento, zumbido y música; en Hanbury el silencio total se mantiene (el primer plano tapa la escena), pero solo en el primer examen (`annie_examined`), para no reiniciar la música en cada vistazo. `test-all`: 39 PASS.

## F11 (persecución y orilla), 2026-10-13

- **Persecución** (`scenes/alleys.js`): ya cumplía la tabla (encuadre abierto, tres cruces con 4,6 s o 5,6 s en táctil, sin silencio, «sin cambios» con movimiento reducido). No se cambia. Captura a 1280×720 y 1920×1080 del primer cruce con su barra de tiempo.
- **Orilla** (`scenes/foreshore.js`): la primera mirada al desagüe en 1888 ya callaba los fondos 1,2 s, pero la música «dread» seguía; ahora también se calla y vuelve después. Encuadre abierto, sin movimiento de cámara (imagen fija en modo reducido). Las capturas de la orilla a 1280×720 y 1920×1080 son de la ronda anterior y muestran la lámina de agua, no la primera mirada al desagüe con su silencio (sin captura).
- Con esto, las diez tomas de `V4_SCENE_DIRECTION.md` están hechas o comprobadas. `test-all`: 39 PASS.

- Revisión del observador sobre a47c25d y 6c496b1: código APPROVE; REQUEST_CHANGES por afirmaciones. Corregido: el estado de la tabla dice qué columnas se cumplen (foco, silencio, sin acercamiento en modo reducido) y cuáles no (duración máxima, tipo de transición, fundido en modo reducido); el checklist dice qué se revisó y en qué commit, y marca la persecución y la intro actual como no revisadas. Intro: la línea de la calle pasa a 3300 ms (59 caracteres a 17–20 por segundo) y el silencio cae 1,2 s antes de la página; el primer control se vuelve a medir.
- Remedido tras alargar la línea de la calle: 31,1 s. Para volver bajo 30 s sin quitar lectura: el silencio antes de la página cae en 0,6 s con 0,7 s de espera; dos pausas en negro se acortan (400→200 y 500→200 ms); la tarjeta «Limehouse» dura 2,2 s. **Primer control: 29,8 s** (mediana de 3: 29,8, 29,8, 29,9); la apertura termina a 16,4 s. `test-all`: 39 PASS.
