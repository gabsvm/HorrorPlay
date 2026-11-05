# Materiales de escenarios

Texturas difusas de [Poly Haven](https://polyhaven.com/), cedidas bajo [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). El ladrillo, el adoquín, el barro y la madera dan forma a la superficie base. El revoque añade desgaste. Las escenas conservan pintura procedural de reserva.

| Material | Autor | Original 1K | MD5 del original |
| --- | --- | --- | --- |
| [brown_brick_02](https://polyhaven.com/a/brown_brick_02) | Rob Tuytel | [JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_brick_02/brown_brick_02_diff_1k.jpg) | `c613a284d3ac4a25256bb93cf4d77328` |
| [cobblestone_floor_04](https://polyhaven.com/a/cobblestone_floor_04) | Rob Tuytel | [JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/cobblestone_floor_04/cobblestone_floor_04_diff_1k.jpg) | `b57737026948ed8b4fce9b0cb3c91e81` |
| [wood_floor_worn](https://polyhaven.com/a/wood_floor_worn) | Dimitrios Savva | [JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/wood_floor_worn/wood_floor_worn_diff_1k.jpg) | `160b2c683907f592dee214a23d8dfa1e` |
| [painted_plaster_wall](https://polyhaven.com/a/painted_plaster_wall) | Amal Kumar | [JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/painted_plaster_wall/painted_plaster_wall_diff_1k.jpg) | `15ba8c1f63a5ab412b1eabe31728540a` |
| [brown_mud_rocks_01](https://polyhaven.com/a/brown_mud_rocks_01) | Rob Tuytel | [JPG](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brown_mud_rocks_01/brown_mud_rocks_01_diff_1k.jpg) | `19e4d0066282bd8439bdc713310bbbe4` |

Para reproducir los archivos incluidos, descargar los originales con los nombres `<material>.jpg` en una carpeta y ejecutar `python web/tools/prepare-materials.py /ruta/a/originales` con Pillow. Se convierten a RGB, se reducen a 512 × 512 con Lanczos y se guardan como JPEG de calidad 84; la madera se gira 90° para orientar las tablas en la profundidad del suelo. Los archivos se cargan localmente y se incorporan al HTML autónomo y al APK.

El papel de los salones adapta *Marigold* (1875), de William Morris, [The Metropolitan Museum of Art, 23.163.4c](https://www.metmuseum.org/art/collection/search/384018), colección declarada de dominio público por el museo; Purchase, Edward C. Moore Jr. Gift, 1923. [Imagen web-large utilizada](https://images.metmuseum.org/CRDImages/dp/web-large/DP306733.jpg), 502 × 624 px, MD5 `831c03bbbc77760d454ec01a0ed7039c`. El mismo script toma `marigold.jpg`, recorta el módulo de 239 × 239 px desde (21, 95) hasta (260, 334), excluyendo los márgenes y cambia la tinta azul y el papel crema a una gama cálida; los salones aplican su propio tinte.


Para la nubosidad se usó el panorama [Industrial Sunset (Pure Sky)](https://polyhaven.com/a/industrial_sunset_puresky) de Sergej Majboroda y Jarod Guest (CC0). A partir del [HDR de 2K](https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/industrial_sunset_puresky_2k.hdr) se recorta el sector de nubes sin el disco solar y se extrae su luminosidad. Reproducción con ImageMagick 6 desde la raíz del repositorio:

```sh
convert industrial_sunset_puresky_2k.hdr -crop 720x382+94+113 +repage -colorspace Gray -contrast-stretch 2%x3% -resize 640x340! -quality 83 web/assets/materials/sunset_clouds.jpg
```

El fondo de la ribera usa [Black Lion Wharf](https://www.metmuseum.org/art/collection/search/372506), aguafuerte de 1859 de James McNeill Whistler (The Met, 17.3.35, dominio público). Se conservó la franja de edificios, se separó del papel y se prepararon versiones de atardecer y noche. La imagen de origen y la receta están en `web/tools/wharf/prepare.py`. Es una composición escénica con edificios documentados del Támesis.
