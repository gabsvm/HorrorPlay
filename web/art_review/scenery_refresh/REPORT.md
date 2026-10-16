# El Huésped — auditoría de escenografía y pasada de assets 3D

Rama: `reboot/web-el-huesped`. Revisión centrada en el acabado de los fondos y objetos frente al nivel de los personajes. No cambia el canon narrativo ni el motor de juego.

## Resultados implementados

1. **Poste de Wren, Winthrop Street.** El poste original **sí existía** en `knackers.js`, pero el PNG `stone_post.png` tenía 43×78 px y una silueta casi negra. Además, Thomas terminaba la entrada muy cerca del poste y lo tapaba. Se modeló una nueva versión en Blender con granito facetado, anillo de hierro, cuerda, desgaste y capitel plano para la moneda. Exportado como PNG RGBA al pipeline original de props; origin y hotspot se actualizaron. También se desplaza a Thomas al final de la entrada para mantener visible el objeto.
2. **Intercambio de Wren.** Antes el penique simplemente desaparecía del inventario, Wren se desplazaba a la altura de las cajas flotando sobre el suelo y el bisturí se dibujaba a la altura del antiguo poste. Ahora el penique aparece sobre el capitel, Wren desciende al nivel del suelo y lo recoge, la moneda desaparece al llegar, Wren vuelve a las cajas y el bisturí se coloca en la coronación correcta. El haz de la ventana trasera da volumen sin convertir el poste en un icono luminoso.
3. **Farola de gas en calles.** Se localizó el benchmark **real** de Dev, `outputs/blender/benchmark_farol_muse/farol_victoriano.glb`; **no es el poste de piedra**. Se conservó una copia de origen en `web/art_review/gas_lamp/source/`. Blender 4.2 lo renderizó como sprite ortográfico transparente (con recuperación de material de hierro y vidrio). El juego usa `web/assets/props/gas_lamp.png` para farolas completas a través de `paint.js::lampPost`; las de brazo de pared conservan su trazo anterior. Las luces y reflejos siguen gestionados por el motor. Ver la escena real de Buck's Row.
4. **Barca de juguete de Nat.** El objeto emocional de Limehouse era antes un casco y vela de polígonos Canvas. Modelo 3D propio de caja de puros con tablazón y vela remendada; integrado en `foreshore.js`, preservando la geometría previa como fallback.
5. **Cajas reutilizables.** Se sustituyeron las cajas rectangulares de `paint.js::crate` por un cajón 3D de tablas, travesaños y clavos pre-renderizado. Afecta a varios escenarios que comparten el painter, sin modificar el texto de los rótulos ni las zonas de interacción.

### Antes y después del juego, no renders aislados

- `comparison/AB_knackers_640.png`: comparación Winthrop Street, en el propio renderer del juego.
- `comparison/AB_bucks_row_640.png`: comparación Buck's Row con el farol 3D.
- `comparison/GALERIA_NUEVOS_ASSETS.png`: cuatro assets a mayor escala para inspeccionar el modelado.
- `comparison/final/`: capturas originales a 640×360 y 1280×720. La lluvia es animada, por lo que los píxeles no tienen coincidencia exacta entre capturas.
- `comparison/exchange/knackers_wren_exchange_trace.json`: registro del intercambio real en navegador, sin usar `FAST`. Se comprobaron penique visible, bajada progresiva de Wren, llegada al suelo y retirada de la moneda (40 muestras; test de puesta en escena, **no** una partida completa).

### Reproducción

Los assets fuente y scripts reproducibles están en `scripts/`, `source/` y `renders/`; los del farol en `../gas_lamp/`.

```powershell
& 'C:\Program Files\Blender Foundation\Blender 4.2\blender.exe' -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_hitching_post.py
& 'C:\Program Files\Blender Foundation\Blender 4.2\blender.exe' -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_nat_boat.py
& 'C:\Program Files\Blender Foundation\Blender 4.2\blender.exe' -b --factory-startup -P web/art_review/scenery_refresh/scripts/build_crate.py
python web/art_review/scenery_refresh/scripts/pack_hitching_post.py
python web/art_review/scenery_refresh/scripts/pack_nat_boat.py
python web/art_review/scenery_refresh/scripts/pack_crate.py
node web/art_review/scenery_refresh/scripts/capture_scene.mjs knackers final --exchange
python web/art_review/scenery_refresh/scripts/make_comparison.py
```

El farol ya cuenta con `../gas_lamp/render_sprite.py` y una copia del GLB, de manera que no depende de encontrar el fichero en Dev para reproducirse.

## Auditoría del resto: prioridades de la siguiente pasada

**P1 — Objetos narrativos focales:**

- `scenes/seance.js:58-71`: espejo dorado central, reflejos/siluetas construidos con rectángulos y elipses. Debe tener marco 3D, pátina, vidrio y profundidad consistentes con la escena; preservar que no refleje al inspector.
- `scenes/room.js:72-101`: fotografía de dos niños (figuras esquemáticas) y mapa de Whitechapel (cuadrícula genérica). Son objetos que merecen ilustración y tipografía legible, no «más noise» procedural.
- `scenes/greaves.js`: mobiliario y utensilios de consulta, en especial cráneo, microscopio y archivador; objetos que deben sostener la inspección cercana.

**P2 — Escenarios secundarios y reutilización:**

- `scenes/hanbury.js`: lavadero/mangle, grifo, retrete, ropa colgada y vecinos de ventanas (formas básicas).
- `scenes/seance.js`: mesa redonda y vitrina del cuervo ya tienen sprite 3D, pero el acabado conserva masas oscuras poco legibles; revisar luz y materiales, no reemplazar indiscriminadamente.
- `scenes/alleys.js`: repetición de muros y coladas procedurales en persecuciones, comprobar silueta y lectura nocturna.
- `art/build.js` y `art/paint.js`: revisar elementos repetidos de fachada y albañilería; la mejora ha de conservar capas parallax y rendimiento.

## Criterio artístico y técnico

- El acabado debe ser **realista, húmedo, oscuro y legible a 640×360**, como los personajes 3D prerenderizados. Más polígonos que no sobreviven al downsample no tienen valor.
- No sustituir escenarios completos por fondos estáticos que anulen iluminación dinámica, niebla, reflejos, hotspot o variación narrativa.
- El renderer actual carga albedo de props PNG; los personajes llevan albedo **y normales**. En la siguiente fase evaluar normales separadas para props hero, con QA móvil y presupuesto de memoria.
- Las herramientas de captura son pruebas visuales de navegador. **Android 17 físico, compresión real de APK, memoria y rendimiento: NOT_TESTED**. La compilación móvil la realiza el propietario del dispositivo.
