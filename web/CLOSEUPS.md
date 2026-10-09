# Primeros planos de la escena del crimen: descripciones para generar con IA

Tres pinturas, una por víctima, que sustituyen a los dibujos de `src/art/bodies.js` cuando Thomas se
arrodilla junto al cuerpo. El juego las reduce a su paleta y las ilumina con el farol que sigue al
dedo, así que deben ser **oscuras y con luz suave**: el farol pone la luz fuerte.

| Archivo | Víctima | Escena |
|---|---|---|
| `nichols.png` | Mary Ann "Polly" Nichols | Buck's Row, adoquines mojados, de noche |
| `chapman.png` | Annie Chapman | patio trasero de 29 Hanbury Street, tierra y losas, al amanecer |
| `eddowes.png` | Catherine Eddowes | Mitre Square, losas, de noche |

**Formato: horizontal 16:9.** La composición importa, porque las pistas del juego están en puntos
fijos de la imagen: el cuerpo tumbado boca arriba **en horizontal, la cabeza a la izquierda** (la
cara a un cuarto del ancho, a media altura) y el cuerpo hacia la derecha hasta salir del cuadro por
las rodillas. Si la composición sale algo distinta, no pasa nada: yo muevo los puntos sobre la pintura.

Cuando las tengas, déjalas en una carpeta y ejecuta `python tools/closeups.py <carpeta>`.

## Estilo común (ya va incluido en cada prompt)

Dark Victorian oil painting seen from directly above, like an 1888 police record of a crime scene.
Wide 16:9 frame. A woman lies on her back across the frame, head on the left, her face a quarter of
the way in from the left edge at mid height, her body running to the right and out of frame at the
knees. Night, almost no light: only a faint cold glow, deep blacks, muted desaturated colours,
visible brushwork. Realistic and sombre, not stylised. No text, no people standing, no frame.

## nichols.png
```
Dark Victorian oil painting seen from directly above, like an 1888 police record of a crime scene. Wide 16:9 frame. A woman lies on her back across the frame, head on the left, her face a quarter of the way in from the left edge at mid height, her body running to the right and out of frame at the knees. Night, almost no light: only a faint cold glow, deep blacks, muted desaturated colours, visible brushwork. Realistic and sombre, not stylised. No text, no people standing, no frame.
Scene: wet cobblestones of a narrow East End street in the rain. A woman of about forty in a worn brown linsey dress and a reddish-brown ulster, eyes open, a bruise on the right side of her jaw. A deep dark cut across her throat with a small pool of blood under the neck running between the stones. Her skirt is dark and soaked at the belly. Her hands lie open at her sides, palms up, clean. A new black straw bonnet lies on the cobbles beside her head, lower left.
```

## chapman.png
```
Dark Victorian oil painting seen from directly above, like an 1888 police record of a crime scene. Wide 16:9 frame. A woman lies on her back across the frame, head on the left, her face a quarter of the way in from the left edge at mid height, her body running to the right and out of frame at the knees. Grey dawn light, very dim, deep blacks, muted desaturated colours, visible brushwork. Realistic and sombre, not stylised. No text, no people standing, no frame.
Scene: the packed earth and broken flagstones of a back yard beside a wooden fence. A stout woman of about forty-five in a black skirt and a dark jacket, a dark scarf at her neck, her face swollen. A deep dark cut right round her throat, blood soaked into the earth under her head. Dark entrails lie placed over her right shoulder, upper middle of the frame. An old sack has been laid over her belly. Her left hand lies near her hip with two pale marks on the ring finger where rings were torn off. At her feet, lower right, a scrap of muslin, a torn envelope and two pennies set out neatly in a row.
```

## eddowes.png
```
Dark Victorian oil painting seen from directly above, like an 1888 police record of a crime scene. Wide 16:9 frame. A woman lies on her back across the frame, head on the left, her face a quarter of the way in from the left edge at mid height, her body running to the right and out of frame at the knees. Night, almost no light: only a faint cold glow, deep blacks, muted desaturated colours, visible brushwork. Realistic and sombre, not stylised. No text, no people standing, no frame.
Scene: the dark flagstones of a city square. A thin woman of about forty-six in a black straw bonnet pushed back on her head, a black cloth jacket and a dark green chintz skirt, a white apron over it. Her face is cut: a nick through each eyelid and an inverted V on each cheek. A single deep cut across the throat and a wide pool of blood under her. Her clothes are torn open over the belly, dark with blood. One corner of the white apron has been cut away in a clean straight line, right side of the frame. Her right arm lies along her side with the wrist upturned near the top of the frame.
```

## Si el generador se niega

Algunos rechazan las heridas. Prueba a quitar las frases de las heridas y deja la sangre: el texto del
juego ya cuenta los detalles, y la pintura solo tiene que mostrar el cuerpo como lo encontró la policía.
