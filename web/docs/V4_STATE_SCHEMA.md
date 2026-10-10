# V4 — Esquema de estado (F00, inventario de solo lectura)

Estado en HEAD `965de74` (base de medición `92a5413`). **F00 no añade campos.** Este documento inventaria lo que existe, para que las fases siguientes sepan qué leer y qué no tocar. Generado a partir del código con los comandos indicados; cuando una fase añada un campo, lo documenta aquí con fuente, valor por defecto, dependencias y migración.

## 1. Claves de nivel superior de `state`

Origen: `freshState()` en `src/engine/game.js` (`chapter, scene, flags, items, clues, deductions, profile, sanity, date, clock`), más las que se escriben en tiempo de juego (`grep -rhoE "(this\.)?state\.[a-zA-Z_]+ (=|\|\|=|\?\?=)" src`): `seen`, `investigation`, `objective`, `unread`, `tips`, `clockHands`.

| Clave | Creada por | `normalizeState` la sanea | Notas |
|---|---|---|---|
| `chapter`, `scene` | `freshState`, cambios de escena | no | `scene` es el id de escena actual |
| `flags` | `freshState` | sí, `??= {}` | ver §2 |
| `items`, `clues`, `deductions`, `profile` | `freshState` | sí (`Array` + `Set`) | arrays sin duplicados |
| `sanity` | `freshState` | sí (0–100) | bandas en `story/perception.js` |
| `date`, `clock` | `G.date`, `G.clock` | no | texto de cabecera; `clock` es "H:MM" |
| `clockHands` | `game.js` (`[h, m]` derivado de `clock`) | **no** | se recalcula al cambiar `clock` |
| `seen` | `game.js` (`seenKey`) | sí (`??= {}`) | ver §3 |
| `investigation` | `normalizeState`, `theories.js` | sí (`hypotheses`, `routes`, `evaluations`) | `positions` y `revisions` **no existen** (`grep -rn "positions\|revisions" src` vacío); los añade F01 |
| `objective` | `G.objective` | **no** | texto del objetivo, sin lógica |
| `unread` | `game.js` (badge del cuaderno) | **no** | contador de notas nuevas |
| `tips` | `game.js` (`state.tips ||= {}`) | **no** | marcas de consejos ya vistos |

Dato de `normalizeState` (`src/story/progression.js`): además de sanear lo anterior, deriva `flags.entry_year` desde `answered1866` cuando falta, y `flags.comb_custody = 'thomas'` desde `peine_taken` en guardados antiguos.

## 2. Flags

Fuentes de escritura, todas comprobadas en el código:
- `G.flag('x')` y `G.flag('x', v)`: 70 nombres literales distintos.
- `state.flags.x` / `flags.x` directo: 23 nombres distintos.
- Campo `flag:` de las deducciones en `src/story/data.js` (se activan en `tryDeduce`, `game.js`): `acusar_brennan`, `f1`–`f6`, `sospecha_brennan`, `sospecha_greaves` (×2), `sospecha_pike`.
- `?flags=a,b` (desarrollo, `src/main.js:153`): cualquier nombre, sin lista blanca.
- Literales de `flags` que `normalizeState` completa: `entry_year`, `comb_custody`.

Unión de los tres orígenes: **97 nombres**. Lista completa (orden alfabético, generada con `grep -rhoE` sobre `src`):

```
accused acusar_brennan amelia1 annie_taken answered1866 apron_found awake bisturi_taken boat boots_on 
br_alibi br_heard br_intro brennan_outcome brennan_stance c1_done cabinet_open candles_out chalk_seen 
chase_mistakes chase_outcome coat_on comb_custody comb_on_table ditch_glow drank drawer_open entry_year f1 f2 
f3 f4 f5 f6 file_read file_torn final_intent fs_1888 go_intro gr_intro greaves_met hand_inconclusive 
handwriting_assessment hb_intro hospes_decoded intro_signature_confirmed kn_intro knackers_lead knock_board 
lantern_taken mi_intro mirror_cracked mirror_n mitre_badge mob neil_times paper_read peine_taken 
penique_given pike_book_read pike_cuff pike_hb2 pike_notes pike_polly polly_seen polly_taken raps_heard 
recognized room_phase s2_1879 s2_draft s2_prologue saw_red_ink se_intro seance_done seance_prepared second 
signature sospecha_brennan sospecha_greaves sospecha_pike tinta_vacia trough_seen water_before water_light 
water_reply_intent water_resistance watkins_name watkins_touch wex_mirror wex_q1 woke_c3 wren_met 
wren_mob_reply wren_paid wren_return_visit wren_warned 

```

Valores por defecto: ausente = falsy. Ningún flag tiene valor por defecto explícito salvo `entry_year`, `comb_custody` y los que `normalizeState` deriva. **Limitación:** las claves construidas dinámicamente (`G.flag(k)` con `k` variable en `theories.js`, `perception.js` y progresiones que usan `flag(s, k)`) no están en esta lista; F01 debe tratarlas al inventariar `evidence`/`positions`.

## 3. Claves de `seen`

`seen` tiene dos formas:

- **Hotspots:** clave plana `${scene.id}:${hotspot.id}` con valor `true` (`seenKey`, `game.js:204`). Se usa para "Volver a mirar" y para no repetir pasos.
- **Inspecciones de cuerpo:** `seen['insp:<id>']` es un **objeto anidado** que `G.inspect(id, …)` crea (`game.js:797`). Sus claves son los ids de punto (`pt.id`) con valor `true`, más `__first` (ya se hizo la primera aproximación, `game.js:800`). Ids de inspección existentes: `polly` (`scenes/bucks_row.js:265`), `annie` (`scenes/hanbury.js:307`) y `kate` (`scenes/mitre.js:190`; `mitre.js:227` lee `seen['insp:kate']`).

`normalizeState` **no** sanea el nivel interior de `insp:*` (solo `seen ??= {}`): cualquier campo nuevo dentro de una inspección debe tratar la ausencia como `undefined` y añadirse con `||=`. Las claves de `seen` nunca se sanean, así que son libres en el nivel superior.

## 4. Claves de almacenamiento local (`localStorage`)

| Clave | Contenido | Fuente |
|---|---|---|
| `elhuesped.save.v1` | partida actual (`state` completo) | `game.js:21`, `game.js:659` |
| `elhuesped.save.v1.resume` | `{state, x, facing, …}` para reanudar a mitad de escena | `game.js:674` |
| `elhuesped.save.v1.ch.<id>` | snapshot al empezar cada capítulo | `game.js:722` |
| `elhuesped.save.v1.read` | `'1'` cuando se terminó el juego (habilita segunda lectura) | `game.js:703` |
| `elhuesped.save.v1.unlocked` | lista de capítulos desbloqueados (`["prologue"]` por defecto) | `game.js:706` |
| `elhuesped.prefs` | preferencias (volumen, texto, `reduceMotion`, `vibrate`, `seenFast`) | `prefs.js:2` |
| `elhuesped.seenLines` | líneas de diálogo ya vistas (para saltar rápido) | `ui.js:16` |

Todas las lecturas están envueltas en `try/catch`. Ninguna clave nueva de F01–F17 debe cambiar el prefijo `elhuesped.save.v1`.

## 5. Compatibilidad (estado de partida)

- Fixtures de compatibilidad, sin modificar: `web/tests/fixtures/saves-v1-baseline/` (c1–c4 y second), `saves-v1-baseline-second/`, `legacy-c3-pre-v3.json`.
- `git diff -- web/tests/fixtures` vacío en F00 (verificado).
- Idempotencia de `normalizeState`: probada en `unit/progression.test.mjs` para el fixture pre-V3. **Pendiente:** extender la comprobación a todos los fixtures antes de F01 (ver checks del observador).

## 6. V4-01 — posturas del jugador (`investigation.positions`, `investigation.revisions`)

Fuente: `src/story/positions.js` (puro, sin DOM). Campos añadidos en `investigation`; ninguna otra clave de `state` cambia.

| Campo | Default (`normalizeState`) | Forma | Tope | Quién escribe |
|---|---|---|---|---|
| `investigation.positions` | `{}` (plain object) | `{ [questionId]: optionId }` | — | `setPosition` (solo por el botón del cuaderno, vía `game.setPosition`) |
| `investigation.revisions` | `[]` (array) | `{ question, from, to, chapter, basis }` | últimas **20** (`REVISIONS_KEEP`) | `setPosition` |

- `positions`: si el guardado trae algo que no es un objeto plano (array, `null`, escalar), se sustituye por `{}`. Las claves desconocidas **se conservan** (una pregunta de una fase posterior sobrevive a un guardado de esta). Para una pregunta conocida (de `QUESTIONS`), el valor se **elimina** si no es una de sus opciones (`sanitizePositions` en `positions.js`, que devuelve un objeto nuevo y es idempotente).
- `revisions`: si no es un array, `[]`; si lo es, se recorta a las últimas 20. Idempotente.
- Entrada de `revisions`: `from` es la postura anterior o `null` la primera vez; `to` la nueva; `chapter` el capítulo en curso o `null`; `basis` las pruebas que sostenían la opción **en ese momento**, con su lado: `'for:clue:<id>'`, `'for:ded:<id>'`, `'for:flag:<id>'` (la prueba está en la lista `for` de su hipótesis) o `'against:clue:<id>'`, `'against:ded:<id>'`, `'against:flag:<id>'` (está en `against`).
- **Regla de `basis`:** `insuficiente` → `[]` siempre. Cualquier otra opción → las pruebas de su hipótesis en `theories.js` que se cumplen, primero las de `for` y luego las de `against`, con el prefijo de su lista. Si la hipótesis no existe, `[]`. Nunca `undefined`.
- **Reglas de `setPosition(state, q, option)`:** devuelve `false` y no escribe si `flags.awake` o `flags.second` (la segunda lectura no pregunta la postura), si la pregunta no existe o no es visible, si la opción no es de la pregunta, o si ya es la postura actual (así una pulsación repetida no añade revisión). Solo escribe `investigation.positions` e `investigation.revisions`.
- **Regla de `br_suspect`:** su pregunta depende de la teoría `brennan` (visible con `brennan_zurdo` o `delantal`). **No escribe `flags.brennan_stance`.** La parada del capítulo I se lee de `flags.brennan_stance` y se muestra como línea de solo lectura («En el cap. I dije: …») bajo la pregunta; la escribe `chapters.js` (`closeC1`), no esta fase.
- **Brennan se muestra desde `c1_done`:** la pregunta aparece cuando hay pruebas (`brennan_zurdo` o `delantal`), y la parada del cap. I aparece en cuanto `brennan_stance` existe (la fija `closeC1`, que también marca `c1_done`).
- `buck_window` (V4-02): visible con la pista `ronda` (`visible: (s) => hasClue(s, 'ronda')`), teoría `rondas`. Antes de V4-02 era `visible: () => false`.
- Ni `evaluate`/`statuses` ni `routes` ni `hypotheses` leen ni escriben `positions`: las teorías no cambian con o sin posturas (probado en `unit/positions.test.mjs`).
- Idempotencia de `normalizeState` sobre todos los fixtures de `tests/fixtures` (`saves-v1-baseline/*`, `saves-v1-baseline-second/*`, `legacy-c3-pre-v3.json`), comprobada en `unit/positions.test.mjs`.
- **Despliegue (solo UI, no es estado):** cada pregunta visible es una línea plegada («Mi postura: <etiqueta o sin postura> ▸»; botón con `aria-expanded` y `data-toggle`). Pulsarla la despliega (subtítulo, la parada del cap. I si existe, y las opciones) o la pliega. Solo una a la vez, guardada en `UI._openPosture`: no va a `state`, ni a `localStorage`, ni al guardado. Con `flags.awake`, sin botón: solo «(antes de saberlo): …» o «Sin postura». Con `flags.second`, no se pinta ningún bloque de postura.

## 7. V4-02 — teoría «rondas» y ventana de las rondas

- **La teoría `rondas` no añade campos de estado.** Sus hipótesis (`firme`, `compatible`) leen solo `clues` y `deductions` (`ronda`, `d_ronda`) a través de `evaluate()`. No hay campo `misses` ni otro nuevo en `investigation`, `flags` ni `clues`. Los errores de la hoja siguen en `investigation.evaluations.beats` (ya existían). La regla de la teoría no los lee (probado en `unit/rondas.test.mjs`).
- **`buck_window`** ya no está oculta: aparece con la pista `ronda` (§6 lo señalaba como `visible: () => false`; eso queda corregido). Su `basis` usa el formato de §6: `firme` → `for:ded:d_ronda` si está la deducción; `compatible` → `for:clue:ronda`; `insuficiente` → `[]`.
- **Sin cambios en `normalizeState`, IDs, flags ni en `canFinishC1` / `currentGate`.** Los guardados con la pista `ronda` (anteriores a V4-02) muestran la teoría y la pregunta sin postura y no escriben nada al reanudar (probado en `scenarios/beats.js`).

## 8. V4-04 — la prueba de Wren contra Brennan (`flags.v4_wren_not_him`)

| Campo | Valor |
|---|---|
| Clave | `flags.v4_wren_not_him` (booleano) |
| Default | **ausente** (falsy). No se escribe en `freshState` |
| Quién la activa | `endC1` (`src/story/chapters.js`), rama de Brennan, justo antes de la línea de Wren «No fue él.». Solo ahí |
| Migración | `normalizeState` (`src/story/progression.js`): si `investigation.routes.c1.closedAt === 'knackers'`, pone `flags.v4_wren_not_him = true` |
| Quién la lee | `src/story/theories.js`, hipótesis `brennan.brennan`, lista `against` («Wren: «No fue él»») |
| Efecto | Es una prueba en contra de Brennan. Con su coartada son dos, y la hipótesis pasa a «no demostrada». Con Pike no se cita |

- **Migración solo activa, idempotente.** Nunca borra la clave y dos pasadas de `normalizeState` dan el mismo resultado (probado en `tests/unit/brennan.test.mjs` para los fixtures de `tests/fixtures`).
- **Guardados anteriores a V3 sin `routes.c1`:** no reciben la prueba, aunque la noche se cerrara con Brennan. Degradación aceptada y documentada: esos guardados pierden la cita de Wren en el cuaderno. Ningún fixture tiene `routes.c1`; los que tienen `c1_done` (siete) pierden la prueba (ver `V4_EXECUTION_LOG.md`, V4-04).
- **Lo que no cambia:** `routes.c1`, `brennan_stance`, `brennan_outcome` y `c1_done` (que ya no alimenta la prueba de Wren). Ninguna otra clave de `state` cambia.
