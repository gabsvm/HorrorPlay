"""Records the voice script: every line of tools/voices/script.json in English, in its character's voice.
usage: <tts venv>/python web/tools/voices/generate.py [--only Pike,Wren] [--force]
Needs the local TTS environment (see tools/voices/README.md): Kokoro reads each character's reference
clip from the voice in cast.json (a British voice or a blend of two, pitched by resampling), and
Chatterbox clones that reference and performs the line. Writes assets/voices/<id>.ogg (Opus) and
assets/voices/index.json; a line already recorded with the same English and the same casting is kept.
"""
import hashlib, json, os, re, sys
import numpy as np, soundfile as sf, torch, torchaudio

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(WEB, 'assets', 'voices')
REFS = os.path.join(HERE, '.refs')   # reference clips, rebuilt from cast.json (not committed)
SR = 24000
REF_TEXT = ("It was a cold night in October, and the fog had come up from the river. "
            "I walked the length of the street twice, and I saw no one. Then I heard the bells.")

args = sys.argv[1:]
only = set(args[args.index('--only') + 1].split(',')) if '--only' in args else None
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
    p = os.path.join(REFS, f"{r['name']}.wav")
    if not os.path.exists(p):
        wav = kokoro(REF_TEXT, r['kokoro'], 0.92)
        if r.get('st'):
            t = torch.from_numpy(wav).float()[None]
            wav = torchaudio.functional.resample(t, round(SR * 2 ** (r['st'] / 12)), SR)[0].numpy()
        sf.write(p, wav, SR)
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
    on = np.where(env > 0.01)[0]
    if len(on): wav = wav[max(0, on[0] - int(SR * 0.06)): min(len(wav), on[-1] + int(SR * 0.18))]
    rms = np.sqrt(np.mean(wav ** 2)) or 1
    wav = wav * min(0.1 / rms, 0.95 / (np.max(np.abs(wav)) or 1))
    return wav.astype(np.float32)


model = None
todo = [l for l in script if l['en'] and (not only or l['speaker'] in only)]
done = 0
for line in todo:
    if line['en'].strip('. ') == '':
        continue   # a silence, not a line
    r = role(line['speaker'])
    stamp = hashlib.sha1(json.dumps([line['en'], r], sort_keys=True).encode()).hexdigest()[:12]
    path = os.path.join(OUT, line['id'] + '.ogg')
    if not force and index.get(line['id']) == stamp and os.path.exists(path):
        continue
    if model is None:
        from chatterbox.tts import ChatterboxTTS
        model = ChatterboxTTS.from_pretrained(device='cuda')
    exag, cfg = direction(line, r)
    torch.manual_seed(int(line['id'], 16) & 0x7fffffff)
    wav = model.generate(re.sub(r'\s+', ' ', line['en']), audio_prompt_path=reference(r), exaggeration=exag, cfg_weight=cfg)
    wav = torchaudio.functional.resample(wav, model.sr, SR)[0].numpy()
    sf.write(path, tidy(wav), SR, format='OGG', subtype='OPUS')
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
