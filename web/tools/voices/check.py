"""Listens to the recordings: transcribes each clip (faster-whisper) and compares it with its line.
usage: <tts venv>/python web/tools/voices/check.py [--below 0.85]
Prints the lines whose recording drops, swaps or invents words (word match under the threshold), worst
first, and writes their ids to tools/voices/.retake.txt for generate.py --ids.
"""
import difflib, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'assets', 'voices')
below = float(sys.argv[sys.argv.index('--below') + 1]) if '--below' in sys.argv else 0.85
script = {l['id']: l for l in json.load(open(os.path.join(HERE, 'script.json'), encoding='utf-8'))}
index = json.load(open(os.path.join(VOICES, 'index.json')))

words = lambda t: re.sub(r"[^a-z0-9' ]", ' ', t.lower().replace('ſ', 's')).split()
model = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=8)
bad = []
for i in index:
    want = words(script[i]['en'])
    if not want: continue
    wav, sr = sf.read(os.path.join(VOICES, i + '.ogg'), dtype='float32')
    segs, _ = model.transcribe(resample_poly(wav, 2, 3).astype(np.float32), beam_size=5, language='en')   # 24 kHz to 16
    got = ' '.join(s.text for s in segs)
    score = difflib.SequenceMatcher(None, want, words(got)).ratio()
    if score < below: bad.append((score, i, script[i]['speaker'], script[i]['en'], got.strip()))
bad.sort()
for score, i, who, want, got in bad:
    print(f'{score:.2f} {i} {who}\n   want: {want}\n   got:  {got}')
open(os.path.join(HERE, '.retake.txt'), 'w').write(','.join(b[1] for b in bad))
print(f'{len(bad)} of {len(index)} under {below}')
