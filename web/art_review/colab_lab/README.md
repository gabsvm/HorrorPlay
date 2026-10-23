# HorrorPlay · Laboratorio visual en Google Colab

Rama: `reboot/web-el-huesped`. Fuente de assets fijada en el commit `0681cfee36921ec2bd372f8ae8080a401f8bd63b` (integración de la foto Thomas/Nat, 23-10-2026).

## Cuadernos

| Orden | Notebook | Objetivo | Computación |
|---|---|---|---|
| 01 | `01_Foto_pared_Thomas_Nat.ipynb` | Crear nuevos sprites de pared intacto/raspado a 70x92 a partir de la foto seed 1888; preservar el marco | Solo CPU |
| 02 | `02_Manos_Thomas_Guantes.ipynb` | Inpainting acotado de ambos guantes en `hands.jpg`; preservar bisturí | T4, modelo de pesos abiertos |
| 03 | `03_Forense_Nichols.ipynb` | Grading limitado del suelo de Buck's Row, conservar puntos forenses | CPU; T4 opcional |
| 04 | `04_Forense_Chapman.ipynb` | Mejorar superficie del muro/tierra de Hanbury sin tocar pistas | CPU; T4 opcional |
| 05 | `05_Forense_Eddowes.ipynb` | Mejorar adoquinado marginal de Mitre Square sin tocar pistas | CPU; T4 opcional |
| 06 | `06_Mapa_Whitechapel_Tipografia.ipynb` | Proponer 2 rediseños tipográficos vectoriales del mapa, más legibles | Solo CPU |
| 07 | `07_Texturas_Documentos_Victorianos.ipynb` | Texturas de cartas, expedientes y recortes sin reescribir los textos del juego | Solo CPU |

## Flujo de uso

1. Abrir cada `.ipynb` desde la rama de GitHub en Google Colab (Archivo > Abrir cuaderno > GitHub).
2. Activar GPU T4 **solo** para el notebook 02 o si `RUN_AI=True` en 03/04/05. Los demás usan CPU y no consumen GPU.
3. Ejecutar las celdas de arriba a abajo, detenerse a **inspeccionar la máscara roja** antes de los modelos.
4. Se exportan candidatos con nombres distintos de los assets actuales, `AB_*.png` y un `.zip`; no se hace `git push`, no se modifica el motor y no se utilizan APIs de generación pagas.
5. Compartir el ZIP para revisar visualmente y decidir si una propuesta merece integrarse.

## Precauciones

- Las pruebas no equivalen a QA en Android. No generar ni publicar automáticamente nuevos assets.
- Los cuadernos 03, 04 y 05 **evitan los hotspots** de las escenas; no editar cuerpos, heridas, evidencias o pistas por defecto.
- El mapa 06 es una representación artística derivada del plano existente, **no una cartografía históricamente certificada**; validar nombres, marcas y geometría antes de integrar.
- El cuaderno 07 crea texturas y mockups de lectura. El texto narrativo debe seguir en HTML/CSS del juego, nunca en un render de difusión.
- El repositorio tiene un informe de la seed 1888 y respaldos fuera del árbol de trabajo local; estos experimentos NO sustituyen ese historial.
- Pesos abiertos de Stable Diffusion se ejecutan dentro del propio runtime de Colab con `use_safetensors=False, variant='fp16'` porque la primera prueba en T4 falló al exigir `safetensors`. Revisar condiciones de licencia de los pesos antes de uso comercial y evitar modelos alternativos por suscripción no autorizados.
