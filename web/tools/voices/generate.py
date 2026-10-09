"""Records the voice script: every line of tools/voices/script.json in English, in its character's voice.
usage: <tts venv>/python web/tools/voices/generate.py [--only Pike,Wren] [--ids a1b2c3d4,...] [--take N] [--best N] [--force]
Needs the local TTS environment (see tools/voices/README.md): Kokoro reads each character's reference
clip from the voice in cast.json (a British voice or a blend of two, pitched by resampling), and
Chatterbox clones that reference and performs the line. Writes assets/voices/<id>.ogg (Opus) and
assets/voices/index.json; a line already recorded with the same English and the same casting is kept.
"""
import hashlib, json, os, re, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import numpy as np, soundfile as sf, torch, torchaudio

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(WEB, 'assets', 'voices')
REFS = os.path.join(HERE, '.refs')   # reference clips, rebuilt from cast.json (not committed)
SR = 24000
# what a reference reads: flat narration, or (ref: expr / boot) something with doubt and questions in it,
# so the clone learns a voice that rises and falls
EXPR = {
    'man': ("No. No, that can't be right... I left them by the door, I know I did. "
            "Who's been in here? Hello? Is someone there? ... Of course not. There's never anyone there."),
    'child': ("Mum! Mum, look what I found down by the water! ... No, I wasn't near the edge, I promise. "
              "Can I keep it? Please? I'll be ever so careful with it."),
}
REF_TEXT = ("It was a cold night in October, and the fog had come up from the river. "
            "I walked the length of the street twice, and I saw no one. Then I heard the bells.")

args = sys.argv[1:]
only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
ids = set(args[args.index('--ids') + 1].split(',')) if '--ids' in args else None
take = int(args[args.index('--take') + 1]) if '--take' in args else 0   # another performance of the same line
best = int(args[args.index('--best') + 1]) if '--best' in args else 1   # record N takes, keep the one heard best
force = '--force' in args
script = json.load(open(os.path.join(HERE, 'script.json'), encoding='utf-8'))
cast = json.load(open(os.path.join(HERE, 'cast.json'), encoding='utf-8'))
os.makedirs(OUT, exist_ok=True); os.makedirs(REFS, exist_ok=True)
idx_path = os.path.join(OUT, 'index.json')
index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}


def role(speaker):
    c = cast['speakers'].get(speaker)
    if c is None: raise SystemExit(f'nobody cast for "{speaker}" (cast.json speakers)')
    return {**cast['voices'][c['voice']], **c, 'name': c['voice']}


_pipe = None
def kokoro(text, voice, speed=1.0):
    global _pipe
    from kokoro import KPipeline
    if _pipe is None: _pipe = KPipeline(lang_code='b', repo_id='hexgrad/Kokoro-82M')
    if isinstance(voice, list):
        voice = torch.mean(torch.stack([_pipe.load_voice(v) for v in voice]), dim=0)
    return np.concatenate([a.numpy() for _, _, a in _pipe(text, voice=voice, speed=speed)])


def reference(r):
    """The clip Chatterbox clones. 'flat': Kokoro reads plain narration. 'expr': Kokoro reads the
    expressive text. 'boot': Chatterbox performs the expressive text from the 'expr' clip, and that
    performance is the reference, so the voice keeps a natural rise and fall."""
    how = r.get('ref', 'flat')
    p = os.path.join(REFS, f"{r['name']}.wav")
    if os.path.exists(p): return p
    text = EXPR[r.get('text', 'man')] if how != 'flat' else REF_TEXT
    wav = kokoro(text, r['kokoro'], 1.0 if how != 'flat' else 0.92)
    if r.get('st'):
        t = torch.from_numpy(wav).float()[None]
        wav = torchaudio.functional.resample(t, round(SR * 2 ** (r['st'] / 12)), SR)[0].numpy()
    if how != 'boot':
        sf.write(p, wav, SR)
        return p
    base = os.path.join(REFS, f"{r['name']}_kokoro.wav")
    sf.write(base, wav, SR)
    torch.manual_seed(11)
    out = load_model().generate(text, audio_prompt_path=base, exaggeration=0.75, cfg_weight=0.3)
    sf.write(p, torchaudio.functional.resample(out, load_model().sr, SR)[0].numpy(), SR)
    return p


def direction(line, r):
    """How hard to play it: shouts and exclamations harder, ellipses and very short lines softer."""
    exag, cfg = r['exag'], r['cfg']
    text = line['en']
    if text.isupper() or text.count('!') >= 2: exag += 0.35
    elif '!' in text: exag += 0.2
    if text.startswith('...') or text.endswith('...'): exag -= 0.1
    return max(0.25, min(1.4, exag)), cfg


def tidy(wav):
    """Trim the silence at both ends (leaving a breath), then bring it to one loudness for everyone."""
    a = np.abs(wav)
    win = int(SR * 0.02)
    env = np.convolve(a, np.ones(win) / win, mode='same')
    on = np.where(env > 0.06 * env.max())[0]
    if len(on): wav = wav[max(0, on[0] - int(SR * 0.06)): min(len(wav), on[-1] + int(SR * 0.18))]
    rms = np.sqrt(np.mean(wav ** 2)) or 1
    wav = wav * min(0.1 / rms, 0.95 / (np.max(np.abs(wav)) or 1))
    return wav.astype(np.float32)


_ear = None
def heard(wav, text):
    """How much of the line a listener (faster-whisper) makes out of the take, 0..1."""
    global _ear
    import difflib
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    if _ear is None: _ear = WhisperModel('small.en', device='cpu', compute_type='int8', cpu_threads=8)
    words = lambda t: re.sub(r"[^a-z0-9' ]", ' ', t.lower().replace('ſ', 's')).split()
    segs, _ = _ear.transcribe(resample_poly(wav, 2, 3).astype(np.float32), beam_size=5, language='en')
    return difflib.SequenceMatcher(None, words(text), words(' '.join(x.text for x in segs))).ratio()


model = None
def load_model():
    global model
    if model is None:
        from chatterbox.tts import ChatterboxTTS
        model = ChatterboxTTS.from_pretrained(device='cuda')
    return model


todo = [l for l in script if l['en'] and (not only or l['speaker'] in only) and (not ids or l['id'] in ids)]
done = 0
for line in todo:
    if line['en'].strip('. ') == '':
        continue   # a silence, not a line
    r = role(line['speaker'])
    stamp = hashlib.sha1(json.dumps([line['en'], r], sort_keys=True).encode()).hexdigest()[:12]
    path = os.path.join(OUT, line['id'] + '.ogg')
    if not force and not ids and index.get(line['id']) == stamp and os.path.exists(path):
        continue
    load_model()
    exag, cfg = direction(line, r)
    takes = []
    for k in range(best):
        torch.manual_seed((int(line['id'], 16) + 7919 * (take + k)) & 0x7fffffff)
        wav = model.generate(re.sub(r'\s+', ' ', line.get('say', line['en'])), audio_prompt_path=reference(r), exaggeration=exag, cfg_weight=cfg)
        wav = tidy(torchaudio.functional.resample(wav, model.sr, SR)[0].numpy())
        takes.append((heard(wav, line['en']) if best > 1 else 1, k, wav))
        if takes[-1][0] >= 0.97: break
    score, k, wav = max(takes, key=lambda t: t[0])
    if best > 1: print(f"   take {take + k} heard {score:.2f}", flush=True)
    sf.write(path, wav, SR, format='OGG', subtype='OPUS')
    index[line['id']] = stamp
    done += 1
    if done % 10 == 0:
        json.dump(index, open(idx_path, 'w'), indent=0, sort_keys=True)
    print(f"{done}/{len(todo)} {line['speaker']}: {line['en'][:60]}", flush=True)

# lines no longer in the script lose their recording
live = {l['id'] for l in script}
for k in [k for k in index if k not in live]:
    index.pop(k)
    try: os.remove(os.path.join(OUT, k + '.ogg'))
    except OSError: pass
json.dump(index, open(idx_path, 'w'), indent=0, sort_keys=True)
print('recorded', done, '· in the game', len(index))
