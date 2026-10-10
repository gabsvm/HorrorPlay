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
