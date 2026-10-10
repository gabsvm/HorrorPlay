# PROMPT MAESTRO — EJECUCIÓN INTEGRAL EL HUÉSPED V4

Trabaja en mi repositorio `gabsvm/HorrorPlay`, rama `reboot/web-el-huesped`. Esta tarea ya está aprobada a nivel de diseño: **EJECUTA** el plan `docs/EL_HUESPED_PLAN_MAESTRO_V4_GAMEPLAY_HISTORIA_PACING.md` de la fase 00 a la fase 17, de manera incremental y rigurosa. La referencia de inspección fue el commit `92a5413f5d0cb2a4be435685d30d27d134ca9c41`; al iniciar comprueba HEAD real y, si hay commits posteriores, adapta el plan sin revertir arreglos.

**CANON QUE NO PUEDES CAMBIAR:** usamos la **opción A**. Thomas Ashgrove escribió físicamente `Dear Boss` durante la laguna del 24–25 de septiembre de 1888; carta fechada 25, recibida 27, difusión mediática del nombre Jack después del doble suceso del 30. Su autoría es un hecho en la ficción, aunque el contexto histórico sea discutido. El Huésped sólo entra cuando alguien responde voluntariamente a la llamada del agua (1866 o 1879), no en noviembre de 1888. Hay un único destino final y la firma acaba en JACK. Mantén cinco víctimas canónicas, voces y decisiones existentes.

**MODELOS Y RESPONSABILIDADES OBLIGATORIAS:**

- **Haiku IMPLEMENTA** todo el código, los tests, las revisiones de documentación, los commits y los builds. Esta sesión principal debe usar Haiku efectivamente (`claude --model haiku`). No delegues programar en Opus.
- **Opus 5.5 OBSERVA, ASESORA Y AUDITA** independientemente. Su modelo debe ser `claude-opus-5-5`, verificado realmente; el agent type es `opus-55-observer` de `.claude/agents/opus-55-observer.md`. No escribe ni hace commits; lee código y veta lo incorrecto. Nunca simules su veredicto.
- **Preferencia:** Claude Code Agent Team de DOS participantes: lead Haiku implementador + un teammate Opus 5.5 observer, con tareas y mensajes directos. Confirmar explícitamente que ambos existen, los modelos efectivos, y que la comunicación es real. Las instrucciones de arranque están en `LEEME_ARRANQUE.md`. Usa sesión **interactiva** y equipos habilitados.
- **Fallback honesto:** si Agent Teams no funciona, lead Haiku + subagente Opus 5.5 de revisión activado antes y después de cada fase. Registrar `MODO SUBAGENTES`. Si Opus 5.5 no está disponible, STOP: no sustituyas silenciosamente por otro modelo y no declares supervisión completada.

**PROCEDIMIENTO INNEGOCIABLE EN CADA FASE:**

1. Leer y comprender fuentes reales actuales (`web/STORY_BIBLE.md`, `web/HANDOFF.md`, el plan maestro, archivos de implementación y pruebas existentes). No asumir nada sin leer.
2. Haiku envía propuesta al agente Opus con detalles de archivos, dependencias, save compat, historia, pacing y pruebas. Espera `APPROVE_PLAN` o corrige observaciones.
3. Haiku implementa con mínimo cambio eficaz, documenta decisiones y flags nuevos. Respeta el orden de las fases 00–17 y la compatibilidad de saves.
4. Haiku ejecuta tests de la fase, después suite completa, compila cuando proceda y entrega evidencia (comandos y salidas reales).
5. Opus revisa DIFF + CÓDIGO ACTUAL con mirada independiente, buscando softlocks, spoilers, anacronismos, degradación de UX, pistas mal ponderadas, ausencia de tests y riesgos Android. Responde `APPROVED`, `CHANGES_REQUESTED` o `BLOCKED` con P0–P3.
6. Haiku corrige; repetir revisión hasta `APPROVED`. Commit pequeño y registro `web/docs/V4_EXECUTION_LOG.md` con SHA, modelos reales, veredicto, tests, métricas y estado. **Ninguna fase `CODE_COMPLETE` sin Opus. Ninguna fase `TESTED` sin playtest humano real.**
7. Continuar con siguiente fase. No detenerse sólo tras preparar una propuesta ni terminar temprano después de 1–2 fases. Si un bloqueo externo impide continuar, entregar todas las fases completadas y el diagnóstico preciso, no inventar trabajo pendiente realizado.

**PRIORIDADES DE GAMEPLAY E HISTORIA:**

- Las tres investigaciones (rondas de Buck's Row, caso Brennan, autoría de carta) deben permitir sospechar, contrastar, rectificar y actuar; no sólo combinar pares de pistas. No imponer culpabilidad falsa.
- Goulston: el grafiti registrado en 1888 NO decía `HERE I AM`. Conservar `aqui_estoy` como visión subjetiva de Thomas y separar documento histórico sin convertir hostilidad antisemita en decoración o insinuación de culpa comunitaria. No romper persecución ni saves previos.
- Zurdera: juicio inicial de Llewellyn, dudas posteriores documentadas sólo después de 19-10-1888. Experiencia anatómica también es materia disputada. No convertir hipótesis forenses en hechos absolutos.
- Black Ditch era curso de agua real entubado para 1888: evocarlo como canalizaciones soterradas, no como río abierto por Whitechapel.
- Dobles crímenes de Stride/Eddowes y testimonios policiales: convertir incertidumbre en investigación compacta sin añadir escenas enormes.
- Humanizar las cinco víctimas mediante información sustentada y detalles breves; evitar gore y diálogos expositivos largos.
- Mejorar pacing por montaje, silencios, sound design, acciones significativas y dirección cinematográfica procedural; no alargar por rellenar hasta 45–60 min.
- Segunda lectura con nueva percepción, no meras frases; mismo desenlace y cronología.

**VERIFICACIÓN FINAL:** `node web/tools/test-all.mjs`, `node web/tools/unit.mjs`, partida estándar/alternativa/segunda, pruebas de compatibilidad de snapshots, smoke/audio, export `web/GUION.md` desde código, documento histórico con URLs, doc de estado/migraciones y protocolo de playtest humano. Distingue builds realizados, tests de lógica y playtest de experiencia (no son equivalentes). No tocar `main`. Se permite push normal de commits aprobados únicamente a `reboot/web-el-huesped` si tienes acceso, sin `--force`; no hacer merge a `main` ni desplegar a producción sin autorización.

**SALIDA ESPERADA:** Código completo fase a fase (no sólo plan), commits trazables, actualizaciones `web/docs/V4_*`, SHAs y diferencias, resumen de resultados y riesgos abiertos. Empieza comprobando equipo real y baseline; pasa al trabajo de F00.
