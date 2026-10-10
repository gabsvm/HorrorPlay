# V4 — Inventario de F00 (escenas, hotspots, flags y textos)

Generado en F00 a partir de `web/src` y `web/tests` en HEAD `965de74`. Solo lectura: ningún fichero del juego cambia.

**Cobertura y límites (declarados):**

- Hotspots: listados por escena con el patrón `id: '…'` en la misma línea que `rect:` o `cursor:`. Algunas definiciones multilínea o anidadas en `chapters.js`/`intro.js` no se capturan; por eso esas dos aparecen vacías y su contenido se cubre en el texto de la sección 3.
- Comportamiento por hotspot (acción, respuesta en la primera visita, repetición, mensaje de bloqueo, `use`) **NO está inventariado en F00**: exige leer cada escena. Queda pendiente y se completa por escena antes de que una fase la modifique (la regla de salida de F00 exige el mapa de IDs y dependencias, que sí se entrega aquí).
- Tests: conteo de `act('id')` en `tests/scenarios` y `tests/walkthrough*.js`; no mide cobertura real.

## 1. Hotspots por escena

- src/scenes/alleys.js :: 
- src/scenes/bucks_row.js :: boy neil pike polly tracks west window 
- src/scenes/corpse.js :: 
- src/scenes/foreshore.js :: boat jetty outfall stairs water 
- src/scenes/goulston.js :: doorway 
- src/scenes/greaves.js :: cabinet chart door drawer jars skeleton 
- src/scenes/hanbury.js :: amelia annie apron comb greaves passage pike steps window 
- src/scenes/knackers.js :: bollard brennan east trough wren 
- src/scenes/millers.js :: 
- src/scenes/mitre.js :: corner east morris watkins 
- src/scenes/room.js :: bed boots clock coat desk door lantern laudano map mirror paper photo window 
- src/scenes/seance.js :: chart clock door mirror table wexley widow young 
- src/story/chapters.js :: 
- src/story/intro.js :: 

## 2. Hotspots referenciados por las pruebas (conteo de `act('id')`)

table×24  pike×24  door×18  desk×11  passage×10  greaves×10  apron×10  watkins×9  water×8  comb×8  chart×8  lantern×7  coat×7  boots×7  west×6  east×6  brennan×6  bed×6  wren×5  drawer×5  cabinet×5  window×4  wexley×3  tracks×3  neil×3  mirror×3  boat×3  amelia×3  photo×2  paper×2  morris×2  doorway×2  corner×2  clock×2  trough×1  skeleton×1  polly×1  outfall×1  laudano×1  jars×1  boy×1  annie×1  

## 3. Flags, deducciones y textos por archivo

Columna `calls_text`: líneas con `G.say/think/voice/card/doc/choice` (recuento por líneas, no por llamadas).

- src/scenes/alleys.js :: calls_text=1 :: 
- src/scenes/bucks_row.js :: calls_text=34 :: anatomia br_intro c1_done cuello huellas knackers_lead neil_times pike_book_read pike_notes pike_polly polly_seen polly_taken ronda silencio zurdo 
- src/scenes/corpse.js :: calls_text=0 :: 
- src/scenes/foreshore.js :: calls_text=3 :: boat ditch_glow fs_1888 recognized water_light 
- src/scenes/goulston.js :: calls_text=3 :: answered1866 apron_found aqui_estoy chalk_seen go_intro 
- src/scenes/greaves.js :: calls_text=9 :: cabinet_open drawer_open file_read gr_intro s2_1879 sospecha_greaves 
- src/scenes/hanbury.js :: calls_text=40 :: amelia1 anillos annie_taken delantal falta greaves_met greaves_sabe hb_intro ordenados peine_taken pike_hb2 reflejo 
- src/scenes/knackers.js :: calls_text=18 :: bisturi_taken br_alibi br_heard brennan_zurdo c1_done kn_intro mob penique_given trough_seen wren_met wren_paid wren_return_visit 
- src/scenes/millers.js :: calls_text=0 :: 
- src/scenes/mitre.js :: calls_text=32 :: guantes marcas mi_intro mitre_badge rapido testigo trozo watkins_name watkins_touch 
- src/scenes/room.js :: calls_text=20 :: boots_on botas coat_on drank estuche lantern_taken laudano letra llave_pike paper_read penique_given s2_draft saw_red_ink ventana woke_c3 
- src/scenes/seance.js :: calls_text=25 :: hospes knock_board raps_heard se_intro seance_done wex_q1 
- src/story/chapters.js :: calls_text=182 :: accused alguien_detras amelia1 answered1866 awake bisturi bisturi_taken boat brennan_zurdo c1_done candles_out carta comb_on_table dedos ditch_glow estuche expediente ficha file_read fs_1888 hand_inconclusive hospes hospes_decoded knock_board letra mirror_cracked mob nat_voz paper_read pike_book_read polly_taken raps_heard regla respuesta1879 ronda room_phase s2_prologue seance_done seance_prepared sospecha_greaves sospecha_pike tinta_vacia water_before water_light woke_c3 wren_paid 
- src/story/intro.js :: calls_text=0 :: 

## 4. Recuento estático de llamadas de texto (todo `src`)

- G.think 144
- G.say 159
- G.voice 16
- G.card 25
- G.doc 7
- G.choice 28

Nota: `G.think` aparece como 144 en `f9549cb`, `8e6d3f9`, `f7cfb5f`, `92a5413` y `965de74` (`git grep -ohE 'G\.think\(' <commit> -- web/src | wc -l`). `IMPLEMENTATION_STATUS.md` registraba 141 para la Fase 10; la diferencia es de criterio de conteo y queda anotada, no corregida.

## 5. Inspecciones de cuerpo (`G.inspect`, `seen['insp:<id>']`)

- `polly` — `scenes/bucks_row.js:265`
- `annie` — `scenes/hanbury.js:307`
- `kate` — `scenes/mitre.js:190` (lectura de `seen['insp:kate']` en `mitre.js:227`)

Estructura y límites: ver `V4_STATE_SCHEMA.md` §3.

## 6. Hotspots de greaves.js (tabla de comportamiento, V4-03)

Leído de `web/src/scenes/greaves.js` (HEAD `e2422e2`, antes de V4-03) y de `web/src/engine/game.js` (`onClick`, `wrongUse`, `seen`). Tests: `grep -rn "act('<id>'" web/tests`, filtrando por la escena en la que el test está (`expectScene`/`waitScene`); los `act('chart')`, `act('door')` de otras escenas no cuentan.

Reglas del motor que aplican a toda la tabla: sin `again`, cada clic repite `act`; tras cada `act` se marca `seen`, que solo lee el destello de pista del escenario tras 25 s sin actividad (no cambia el texto); con objeto y sin `use` (o con `use` que devuelve `false`) responde `wrongUse` (frases genéricas, rotan con un contador).

| Hotspot | Acción principal | Respuesta en la primera visita | Repetición | Mensaje de bloqueo | Uso de objeto (`use`) | Flags que lee o escribe | Tests que lo cubren |
|---|---|---|---|---|---|---|---|
| `cabinet` (Vitrina cerrada) | `act` (clic sin objeto) | Sin `cabinet_open`: «Expedientes por año. El de 1879 está apartado.» | Sin `cabinet_open`: lo mismo. Con `cabinet_open`: vuelve a ejecutar `readFile` completo, sin guarda (sanidad −10 y −15 otra vez, la conversación con Greaves). | No hay mensaje aparte: sin la llave, la respuesta es la de la primera visita. | `llave`: la quita, pone `cabinet_open`, sonido de puerta y ejecuta `readFile`, que termina en `goto('foreshore')`. Otro objeto: `false` → `wrongUse`. | Lee `cabinet_open`. Escribe `cabinet_open` (uso). `readFile` escribe `file_read`, `fs_1888`, `final_intent`, y según la elección `pike_cuff`, `wren_warned` o `file_torn`; pistas `expediente` y `respuesta1879`. | `chapter3.js:40`, `finale.js:26`, `resume.js:62`, `sanity.js:30`, `walkthrough.js:154` |
| `chart` (Lámina anatómica) | `act` | «Puedo señalar cada arteria sin mirar.» | Igual, sin guarda. | Ninguno. | No define `use`: cualquier objeto → `wrongUse`. | Ninguno. | `walkthrough.js:152` (única en esta escena). Los `act('chart')` de `comb-pike`, `mob`, `resume.js:45`, `sanity.js:19`, `seance.js`, `second-reading.js` son la lámina de la sesión, de otra escena. |
| `door` (Puerta, cursor `exit`) | `act` | Sin `file_read`: «Sin el expediente no salgo.» | Sin `file_read`: lo mismo. Con `file_read`: no dice nada y no cambia de escena; la salida la hace el `goto('foreshore')` de `readFile`. | «Sin el expediente no salgo.» | No define `use`: `wrongUse` con sus frases de salida («No.» / «Eso no me abre camino.»). | Lee `file_read`. No escribe. | Ninguna que actúe `door` dentro de esta escena. `walkthrough.js:147` es la puerta de `room` (lleva a esta escena). |
| `drawer` (Cajón del escritorio) | `act` | Sin `drawer_open`: «La cerradura es pequeña. Necesito algo fino.» | Con `drawer_open`: solo `G.audio.tick()`, sin texto. | «La cerradura es pequeña. Necesito algo fino.» (mismo texto que la primera visita). | `bisturi` y sin `drawer_open`: pose `reach`, dos ticks, `thud`, pone `drawer_open`, «Ni siquiera tuve que probar dos veces.», `give('llave')`, devuelve `true`. Otro objeto o cajón ya abierto: `false` → `wrongUse`. | Lee `drawer_open`. Escribe `drawer_open` (uso). Entrega `llave` (inventario). | `chapter3.js:38`, `finale.js:24`, `resume.js:62`, `sanity.js:29`, `walkthrough.js:153` |
| `jars` (Frascos de especímenes) | `act` | Sin texto: `G.sanity(-4)`, susurro `whisper(1, 0.07)`, `G.red(0.25)`. | Igual cada vez (−4 de cordura y el mismo susurro). Sin guarda. | Ninguno. | No define `use`: `wrongUse`. | Ninguno (solo cordura). | `walkthrough.js:152` (única en esta escena). |
| `skeleton` (Esqueleto) | `act` | Primera lectura: «El sueño terminó aquí, en otra mesa. El resto está borrado.» Segunda lectura sin `s2_1879`: pone `s2_1879`, `vision('hands')`, `red(0.4)` y «La mesa 3. Marzo de 1879. La enfermera junto al lavadero. Ahora lo veo entero.» | Tras `s2_1879`, o en la primera lectura: «El sueño terminó aquí…» cada vez. | Ninguno. | No define `use`: `wrongUse`. | Lee `s2_1879` y `G.second()`. Escribe `s2_1879` (solo en la segunda lectura). | `second-reading.js:49` |

Sin hotspot de esta escena define `again`. Ningún hotspot de esta escena lee `seen` salvo el destello de pista del motor (ver la regla de arriba).

## 7. Hotspot de goulston.js (tabla de comportamiento, V4-05)

Leído de `web/src/scenes/goulston.js` (HEAD `5c2a040`, antes de V4-05) y de `web/src/engine/game.js` (`onClick`: con objeto y `walk`, camina hasta `walk`, cierra el objeto, usa `use` si existe y si no responde `wrongUse`; `renderer.js:495` llama a `drawGlow` solo si la escena lo define). Tests: `grep -rn "act('doorway'" web/tests` (dos, ambos en `expectScene('goulston')`). Dibujo: `web/tools/smoke.mjs:103`, variante `goulston: [{ chalk_seen: true }]`.

Único hotspot de la escena: `doorway` («Portal de la escalera», rect `[870, GROUND-270, 160, 300]`, `walk: 860`, `face: 1`). No define `use` ni `when`; su única guarda es `apron_found`.

| Punto | Acción | Primera visita | Repetición | Bloqueo | Uso de objeto (`use`) | Flags que lee o escribe | Pistas / otros | Tests que lo cubren |
|---|---|---|---|---|---|---|---|---|
| `doorway` (Portal de la escalera) | `act` (clic sin objeto) | Sin `apron_found`: pone `apron_found`, pose `kneel` y luego `reach`, espera 500 ms. Pensamiento con `G.two`: 1ª lectura «Tiza en la jamba: HERE I AM.», 2ª «Tiza, letra inclinada. Reconozco la A antes de leer la frase.». Pone `chalk_seen`, `G.audio.sting(0.22)`, `G.mad(0.5)`. 2ª lectura (`G.second()`): voz «Aquí estoy.». 1ª lectura: pensamiento «Lo dije yo. Hace veintidós años.» (con `answered1866`) o «Yo no respondí entonces. ¿Quién escribió esto?». Después: pista `aqui_estoy`, `G.sanity(-8)`, `G.mad(0)`, pose `null`, y `G.game.chapterHooks.caught(G)` (chase: `chapters.js`, luego escena `alleys`). | Con `apron_found`: `return` sin texto, sin cordura y sin `caught`. Es la única guarda. | Ninguno (ni `when` ni bloqueo). | No define `use`. Con objeto: camina a `walk`, cierra el objeto y responde `wrongUse` (`game.js:256`–`276`). | Lee `apron_found`, `answered1866`, y `G.second()`. Escribe `apron_found`, `chalk_seen`. Pista escrita: `aqui_estoy`. Los flags de la persecución (`chase_outcome`, `chase_mistakes`) los escriben las escenas de `caught`, fuera de este hotspot. | Ninguna elección propia; `caught` (`chapters.js`) pide las suyas y no cambia en V4-05. | `chapter3.js:27` (`act('doorway', null, ['Correr', ...junctions])`, tres persecuciones). `walkthrough.js:131` (primera lectura y, con `second`, segunda: `act('doorway', null, [0, 0, 0, 0])`). |
| `drawNear` (dibujo, cada frame) | — | Sin `apron_found`: `apronPiece(920, GROUND-20)`. Con `chalk_seen`: `A.chalk('HERE I AM', 1040, GROUND-210, size 30, rot 0.05)` en el fondo persistente. | Igual cada frame. | — | — | Lee `apron_found`, `chalk_seen`. | Dibujo; sin pistas. | `tools/smoke.mjs:103` (variante `chalk_seen`). |
| `drawGlow` (luz aditiva, `renderer.js:495`) | — | Con `chalk_seen`: repite `A.chalk('HERE I AM', 1040, GROUND-210, …)` con alfa `0.22 + sin(1.4·t)·0.06` (comentario del código: «the chalk catches the lantern light»). | Igual. | — | — | Lee `chalk_seen`. | Dibujo; sin pistas. | `tools/smoke.mjs:103` (variante `chalk_seen`). |

Ninguno de los tres puntos lee ni escribe `seen` (el motor lo marca tras cada `act`, sin efecto en el texto). Esta tabla describe el estado previo a V4-05; los cambios se registran en `V4_EXECUTION_LOG.md`, sección V4-05.
