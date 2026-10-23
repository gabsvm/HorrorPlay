# Experimento Google Colab — fotografía de Thomas y Nat

Notebook: [HorrorPlay_Thomas_Nat_Colab.ipynb](HorrorPlay_Thomas_Nat_Colab.ipynb)

## Objetivo
Usar inpainting con un modelo abierto para mejorar el realismo de los dos niños de la foto de la habitación de Thomas, manteniendo las anclas del guion y produciendo las variantes intacta y raspada del capítulo 3. Es un experimento A/B; ningún asset del juego cambia hasta completar la revisión visual.

## Abrir y ejecutar
1. Abrir el notebook en Google Colab desde GitHub, con la rama `reboot/web-el-huesped`.
2. En «Entorno de ejecución» seleccionar una GPU (T4 o superior). Las ventajas del plan Google AI Pro dependen de las unidades y la disponibilidad de Colab; no son ilimitadas.
3. Ejecutar las celdas hasta la previsualización de la máscara y comprobar que incluye figuras y brazo y no invade el sello fotográfico.
4. Continuar con el modelo `sd15` por defecto para minimizar consumo de GPU. `sdxl` es una alternativa más pesada.
5. Revisar la lámina A/B y descargar el ZIP de candidatos. No elegir una versión solamente por su detalle a tamaño grande.

## Salidas
- `room_photo_candidate_<seed>.jpg`: fotografía intacta, tamaño 1280×720.
- `room_photo_torn_candidate_<seed>.jpg`: misma variante con la raspadura de capítulo 3.
- `room_photo_candidate_<seed>.png`: copia sin pérdida para comparación.
- `AB_photo_640.png`: comparación intacta/raspada a 640×360.
- `experiment.json`: procedencia, versión de modelo, semillas, máscara y hash del archivo original.

## Restricciones
- El notebook **no llama a APIs pagas** ni usa suscripciones de otros proveedores de modelos. Se descargan pesos desde Hugging Face y se ejecutan en la GPU asignada por Colab.
- La sesión de GPU utiliza las unidades de procesamiento de Colab de la cuenta; revisar saldo antes de ejecutarlo.
- El modelo no garantiza consistencia anatómica, identidades o mano sobre hombro. Si hay regresiones visuales, no integrar.
- Para publicar resultados hay que revisar la licencia OpenRAIL del modelo y las licencias del proyecto.
- La foto de pared `web/assets/props/room_photo.png` sigue sin modificaciones: debe verificarse su consistencia con el candidato elegido.

## QA pendiente antes de integrar
Comparar en el motor real los close-ups de la habitación (capítulos 1 y 3) a 640×360, asegurar anclas y hotspots, ejecutar `node web/tools/test-all.mjs` y validar APK y rendimiento en el teléfono Android. El notebook no afirma ejecutar esas pruebas.
