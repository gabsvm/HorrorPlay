# Voces

Las líneas habladas del juego, en inglés, grabadas en local con dos modelos libres: Kokoro, que pone el timbre de cada personaje (voces británicas, mezcladas y con el tono ajustado), y Chatterbox, que clona ese timbre e interpreta la línea. Los subtítulos siguen siendo el texto en español del juego.

## Flujo

```bash
node web/tools/voices/extract.mjs
```

Lee `src/`, saca cada línea de `G.say` / `G.think` / `G.voice` / `G.narrate` (con las dos lecturas de `G.two`) y escribe `script.json`. El id de cada línea es el hash del personaje y del texto en español (`src/engine/voicekey.js`, el mismo que usa el juego): si se cambia una frase, su grabación vieja deja de sonar y la línea vuelve a ser solo texto hasta regrabarla. Las líneas nuevas salen con `en` vacío; su traducción va en `en.json`.

```bash
C:/Dev/tts/.venv/Scripts/python.exe web/tools/voices/generate.py [--only Pike,Wren] [--force]
```

Graba lo que falte o haya cambiado (texto inglés o reparto) en `web/assets/voices/<id>.ogg` (Opus) y actualiza `index.json`. Una hora, más o menos, para el guion entero con una RTX 3050.

- `cast.json`: el reparto. `voices` define cada voz (voz de Kokoro o mezcla de dos, semitonos, intensidad `exag` y apego a la referencia `cfg`); `speakers` asigna una voz a cada nombre del guion.
- Las exclamaciones y los gritos se interpretan más fuerte, y los puntos suspensivos, más bajo (`direction()` en `generate.py`).

## Entorno

Un entorno de Python 3.12 aparte (las librerías aún no van con 3.14), en `C:\Dev\tts`:

```bash
python -m venv C:/Dev/tts/.venv
python -m uv pip install --python C:/Dev/tts/.venv/Scripts/python.exe torch torchaudio --index-url https://download.pytorch.org/whl/cu124
python -m uv pip install --python C:/Dev/tts/.venv/Scripts/python.exe kokoro soundfile chatterbox-tts
```

`extract.mjs` necesita `acorn`: `npm i` en esta carpeta.

## En el juego

`audio.speak()` (engine/audio.js) decodifica el clip solo cuando llega su línea. El texto avanza al ritmo de la voz y el ambiente baja mientras alguien habla. Cada personaje suena en su lado de la pantalla; los pensamientos de Thomas, cerca y secos. La voz del agua y la de Wexley en trance se desdoblan con una copia un poco más grave que se va desfasando. En Opciones, "Voces: Sí / No" las apaga del todo (también desde la pausa, a mitad de partida).
