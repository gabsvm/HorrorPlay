# Recorded sounds

All recordings are CC0 (public domain). They were trimmed, normalised and turned into seamless
loops with `python web/tools/build-audio.py [ffmpeg]` from these downloads (kept out of git in
`web/assets-src/audio/`):

| Files | Source | Author |
|---|---|---|
| rain | [Rain (loopable)](https://opengameart.org/content/rain-loopable), `Rain OGG.zip` | Ylmir |
| storm | [rain and thunders](https://opengameart.org/content/rain-and-thunders), `Dark_Rainy_Night(ambience).ogg` | kindland |
| river | [30 CC0 SFX loops](https://opengameart.org/content/30-cc0-sfx-loops), `sfx_loops.zip` | rubberduck |
| step_stone, step_gravel, step_mud | [Different steps on wood, stone, leaves, gravel and mud](https://opengameart.org/content/different-steps-on-wood-stone-leaves-gravel-and-mud) | TinyWorlds |
| step_wood*, door_*, creak*, cloth*, leather, book_*, latch, metal_click, knife | [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney (kenney.nl) |

Music, voices of the Host, the drone, heartbeats and stings stay procedural (src/engine/audio.js).
