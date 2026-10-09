# Retratos de diálogo: descripciones para generar con IA

Cada personaje que habla necesita **tres imágenes de la misma pintura**:

| Archivo | Qué es |
|---|---|
| `<id>.png` | Base: boca cerrada, ojos abiertos |
| `<id>_talk.png` | La misma imagen, con la boca entreabierta, como hablando |
| `<id>_blink.png` | La misma imagen, con los ojos cerrados |

Genera primero la base con el **estilo común** más la descripción del personaje. Después, en la
misma conversación, pide las otras dos como edición de esa imagen (las frases están al final).
Guárdalas en `web/assets/portraits/` con el nombre de la tabla. Cuadradas; si salen de 1024 px,
mejor. El juego las recorta, las reduce a su cuadrícula de 72 px con su paleta, alterna la boca
mientras el personaje habla, parpadea y hace la versión de «la voz» de Thomas.

Las descripciones están en inglés porque los generadores de imágenes responden mejor así.

## Estilo común (pégalo delante de cada personaje)

```
Dark Victorian oil portrait, London East End, autumn 1888. Head and shoulders, three-quarter view,
the person turned toward the right of the frame. Lit by a single warm amber gas lamp from the right;
the left side of the face falls into cold green-blue shadow. Deep blacks, muted desaturated colours,
visible brushwork, slightly grimy. Plain near-black background with a faint fog. Large, clearly
readable face and silhouette with simple strong shapes (it will be shown very small). Square 1:1.
No text, no frame, no border, no hands in front of the face.
```

## Personajes

### thomas: Inspector Thomas Ashgrove
```
A 34-year-old police inspector, gaunt and exhausted, dark circles under grey eyes that seem to look
past the viewer. Dark brown hair, long sideburns, two days of stubble. Black bowler hat. Charcoal
wool greatcoat with the collar turned up, an oxblood-red wool scarf at the throat. Pale, cold skin;
a faint sheen of rain. Something absent behind the eyes, as if he is listening to something far away.
```

### pike: Sergeant Aldous Pike
```
A police sergeant in his late forties, square-jawed and solid, a dark brown walrus moustache, short
dark brown hair. Black bowler hat. A brown-grey Inverness coat with a short shoulder cape, double
breasted. Small, attentive, unblinking eyes that study the viewer; a pencil behind the ear. Dry,
methodical, quietly suspicious.
```

### greaves: Dr. Lionel Greaves
```
A surgeon in his sixties, distinguished and tired, a neatly trimmed grey beard and swept-back grey
hair. Black silk top hat. Black frock coat, a rust-brown waistcoat with a gold watch chain, a white
wing collar and black cravat. Gold-rimmed pince-nez. Intelligent, guarded eyes, a doctor who knows
something and is deciding whether to say it.
```

### wexley: Madame Orla Wexley
```
A spirit medium in her forties, striking and severe, black hair parted in the middle under a dark
plum shawl worn over the head. A dark wine-coloured dress with a high collar, a jet bead necklace.
Pale skin, heavy-lidded dark eyes fixed slightly beside the viewer, as if seeing someone standing
behind them. Candle-lit warmth on one cheek, otherwise in shadow.
```

### brennan: Silas Brennan
```
A huge knacker (horse slaughterer) in his forties, a broad weathered face, a thick dark brown beard,
a flat tweed cap. Brown work coat with sleeves rolled up over thick forearms, a stained dark leather
apron over it. Bad-tempered, tired, wary; a man used to being blamed. Rough skin, a scar on the brow.
```

### wren: Wren, la mudlark
```
An 11-year-old girl who scavenges the Thames mud, thin and dirty-faced, sharp chestnut-brown hair
cut short and sticking out under an oversized man's flat cap. A patched brown coat far too big for
her and a grey-blue wool shawl. Mud on her cheek. Big wary eyes looking at the viewer with fear and
pity, as if she can smell something wrong on him.
```

### watkins: Agente Watkins (City of London Police)
```
A City of London police constable in his forties, tall custodian helmet with a crested badge, a dark
navy tunic buttoned to the throat with a collar number. A dark brown moustache, a lined, steady face.
Shaken but dutiful, the face of a man who has just seen something terrible on his beat.
```

### neil: Agente Neil (Metropolitan Police)
```
A young Metropolitan Police constable in his thirties, tall custodian helmet, dark navy tunic with
collar number and belt, a brown moustache. Wet from the rain, lantern light on his face, pale and
alarmed but trying to look in control.
```

### long: Agente Long (Metropolitan Police)
```
A Metropolitan Police constable in his late twenties, tall custodian helmet, dark navy tunic, clean
shaven, nervous and breathless, eyes wide, as if he has been running after someone through the alleys.
```

### morris: Morris, el vigilante nocturno
```
An old night watchman in his sixties, a long grey beard and grey hair under a worn flat cap, a
brown knitted scarf, a shabby dark brown coat. Watery, kind, frightened eyes. He has been awake all
night with a lamp in a warehouse doorway.
```

### chico: el chico
```
A street boy of about twelve, a flat cap, a patched brown jacket, brown hair, a thin dirty face.
Crouching posture implied by hunched shoulders; startled, guilty eyes, as if caught looking at
something he should not have seen.
```

### joven: el joven de la sesión
```
A young clerk in his twenties, bare-headed, oiled dark brown hair parted in the middle, a thin
moustache, a brown wool scarf over a grey coat. Nervous half-smile, trying to look sceptical at a
séance, candlelight from below.
```

### viuda: la viuda de la sesión
```
A widow in her fifties in full mourning: a black bonnet with a black lace veil lifted halfway, a
black dress and black shawl. A pale, grief-worn face, red-rimmed eyes, lips pressed together.
Candlelight from below.
```

### richardson: Sra. Amelia Richardson
```
A landlady in her sixties, stooped and stern, grey hair under a black bonnet, a grey-brown dress
and a dark wool shawl crossed over the chest. Hard, practical, frightened eyes in a lined face.
Early morning grey light mixed with a warm lamp.
```

## Ediciones de la misma imagen

Para `_talk.png`:
```
Edit this exact image. Keep everything identical (same person, pose, light, colours, background,
framing). Only change: the mouth slightly open, as if in the middle of speaking a word.
```

Para `_blink.png`:
```
Edit this exact image. Keep everything identical (same person, pose, light, colours, background,
framing). Only change: the eyes fully closed, as in a blink.
```

Consejos: si una edición mueve la cara o cambia la luz, pide otra; el juego alterna entre las
imágenes muy deprisa y cualquier diferencia se ve como un salto. Mantén el encuadre: la cara en el
tercio superior y centro, los hombros cortados por abajo.
