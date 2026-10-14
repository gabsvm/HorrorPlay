# EL HUÉSPED — V5 · La ciudad que aprendió un nombre

Biblia compacta de la dirección V5 (14-10-2026). Sustituye el objetivo editorial del giro; no deshace la V4 técnica. Lo que no está aquí sigue en `web/STORY_BIBLE.md`. Si algo choca con el canon, se conserva el canon y se adapta el tratamiento.

## 1. Tesis

«Quién es Jack» se puede descubrir **antes** del desenlace. El misterio de mayor alcance es otro: **qué consigue una presencia sin nombre propio al convertir una firma privada en una identidad que toda una ciudad repite**. El jugador cree investigar a un hombre; comprende que investigaba su propio cuerpo; por último comprende que la carta, las copias y la prensa construyeron algo más duradero que el individuo.

Contrapunto: mientras «Jack» se vuelve célebre, las cinco mujeres conservan nombre y vida. El horror no las convierte en combustible.

## 2. Reglas (cerradas)

| | Regla |
|---|---|
| R1 | Entrada solo por **respuesta voluntaria en voz alta** al llamado del agua (1866 o 1879). Decir, leer, oír o escribir «Jack» nunca mete al Huésped en nadie. |
| R2 | Sin nombre propio, el Huésped no tiene referente estable fuera de su portador. Para durar como **identidad pública** necesita un nombre que otros repitan. Eso le da anclaje, no omnipotencia. |
| R3 | «Thomas» es el nombre **privado** por el que el agua llamó. «Jack» es una **firma pública construida**. No es el «verdadero nombre» del demonio. |
| R4 | Los documentos **no se reescriben**. El horror documental es procedencia, copia, omisión y circulación. |
| R5 | Sin viajes en el tiempo, bucles ni multiverso. Un eco del prólogo es el Huésped recordando o imitando. |
| R6 | Cada personaje sabe lo suyo. Nadie expone R1–R5 seguidos. |
| R7 | La posesión explica la pérdida de control, no borra las decisiones de Thomas (acusar, callar, ocultar, la última respuesta). Sin absolución ni culpa simple. |
| R8 | La firma ya circula: no se retira. Los vivos aún pueden corregir un testimonio, proteger a alguien, dejar constancia, negarse a mentir. Esa es la agencia del jugador. |

## 3. Cronología del nombre

| Fecha | Qué existe | Quién puede decir «Jack» |
|---|---|---|
| Oct 1866 / mar 1879 | El agua llama «Thomas». Entrada por respuesta voluntaria | Nadie |
| 24–25 sep 1888 | Una mano escribe en tinta roja durante las horas perdidas. Fecha de la carta: 25 | Nadie |
| 27 sep | La Central News recibe la carta | Nadie fuera de ella |
| 30 sep | Doble suceso; Goulston (el grafito histórico no es `HERE I AM`) | **Nadie todavía**: el agente persigue una figura física |
| 1 oct | El Daily Telegraph imprime la transcripción (fuente leída, ver ledger); la calle repite «Jack» | Desconocidos que no conocen a Thomas |
| 8–9 nov | Greaves, Pike, el agua, Miller's Court | Cualquiera, salvo Thomas |

## 4. El doble misterio y cómo se pasa del uno al otro

**A — ¿Qué hizo el cuerpo de Thomas?** Perfil (I), 1879 y la voz de Nat (II), **«Pude escribirla yo»** como sospecha razonada en la primera partida (III), expediente + Pike + recuerdo corporal (IV). La certeza íntima llega **antes** del agua.

**B — ¿Para qué una firma?** La **cadena del nombre**: mano → firma → eco (pestaña «Nombre» del cuaderno). Se puede leer desde la calle del 1 de octubre, pero solo se **ordena al despertar** (después del expediente): responde a la pregunta A. Resolver A abre B: tras reconocer su ficha, Thomas pregunta por qué la carta necesitaba un nombre y no solo una confesión.

La cadena son **etapas de transmisión**, no tres fuentes independientes sobre la identidad física de Thomas. `FINAL_SOURCES` y `canEnterFinale` no cambian: la carta, la copia y el recorte nunca cuentan como corroboraciones separadas.

## 5. Qué sabe cada cual (sin metafísica completa)

| Quién | Sabe | No sabe / no dice |
|---|---|---|
| Thomas | Deduce por pruebas; sospecha su mano por papel, tinta y fecha | No puede probarlo ante un tribunal; no teoriza |
| Pike | Rondas, firma de Thomas, horas; lo que vio frente a lo que teme | El plan del Huésped; no escribe lo temido como visto |
| Greaves | Expediente de 1879, culpa clínica, miedo por Thomas | No presenció nada; «me pareció oír tu voz leyéndola» no es prueba |
| Wexley | La voz no es de ningún muerto de su mesa y «sabe a quién ha venido a buscar» | R1–R5 |
| Wren | La advertencia popular, el nombre «Thomas» | No lee titulares como historiadora ni es oráculo |
| Brennan | Es la primera consecuencia de poner nombre sin pruebas | — |

## 6. Dónde está cada cosa en el juego

| Beat | Dónde |
|---|---|
| Prólogo: el agua llama el nombre que ya tiene y pide «dime que estás aquí» | `prologueWater` |
| Brennan como ensayo humano de la firma: «Le han puesto un nombre. La calle ya no pregunta» y Pike distingue lo que dicen de lo que hay | `closeC1`, `mobScene` |
| Wexley: la voz no es de ningún muerto, sabe a quién viene a buscar | `seance` |
| La copia **no guarda el trazo**: se arregla la comparación falsa de J y t | `compareHands`, pista `letra`, `d_letra` |
| «Pude escribirla yo» (postura, teoría `carta.yo`, opción en el cuaderno y ante Greaves) | `positions.js`, `theories.js`, `greaves.js` |
| La calle del 1 de octubre (se oye desde la ventana o al salir; nunca bloquea) | `heardName`, pista `eco` |
| Greaves/Thomas/Greaves («No te he preguntado qué recuerdas»), Pike («lo he visto / lo temo»), recuerdo corporal | `readFile` |
| La cadena del nombre | `story/chain.js`, `nameChain`, pestaña «Nombre» (`ui.js`) |
| El agua exige las tres fuentes **y** la cadena | `canEnterWater`, `outfall1888`, `finaleWater` |
| «Escucha»: voces de desconocidos tras el 30/9 | `finaleWater` |
| Epílogo: las cinco por su nombre; dos desconocidos dicen «Jack» y no mencionan a Thomas | `epilogue` |

## 7. Estado (aditivo)

`v5_name_chain` (`'reasoned'` cuando está ordenada), `v5_name_echo_seen` (la calle se oyó), pista `eco` (rescatada al cargar un guardado del capítulo IV con la carta), posición `letter_author = 'yo'`, valor `handwriting_assessment = 'self_suspicion'`, `investigation.evaluations.chain.misses`. Nada se renombra ni se borra; los guardados anteriores abren con todo lo necesario (la cadena no exige tener ninguna pista: se recapitula).

## 8. Reglas de redacción

- Primero hubo una mano. Después, una firma. Ahora nadie necesita haberlo visto para hablar de él. La conclusión de Thomas es un orden de hechos, no una cosmología.
- Ningún personaje de 1888 cita obras posteriores (*The King in Yellow* es de 1895).
- Ninguna escena anterior a la calle del 1 de octubre dice «Jack» (`tests/unit/v5.test.mjs`).
- Las fuentes históricas no verificadas siguen marcadas en `V4_HISTORICAL_LEDGER.md`; V5 no añade datos históricos nuevos, solo ficción etiquetada.

## 9. Segunda lectura

Nada imprescindible está solo ahí. Resignifica: la voz que dicta, el borrador bajo el secante, «Jack.» al leer el periódico, la libreta de Pike. La segunda lectura no pregunta la postura sobre la carta.
