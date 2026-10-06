"""Turn the downloaded CC0 recordings into the small set of game sounds in web/assets/audio/.

usage: python web/tools/build-audio.py [path/to/ffmpeg]
Sources (all CC0) are expected unzipped in web/assets-src/audio/, see web/assets/audio/CREDITS.md.
Loops get their tail crossfaded into their head so they repeat without a seam.
"""
import array, math, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src', 'audio')
OUT = os.path.join(ROOT, 'assets', 'audio')
FF = sys.argv[1] if len(sys.argv) > 1 else (shutil.which('ffmpeg') or 'ffmpeg')
RATE = 32000
K = 'kenney_rpg-audio/Audio/'

# name: (source, start, length or None, channels, kbps, loop crossfade seconds, peak[, ffmpeg filter])
SOUNDS = {
    'rain':        ('rain_ogg/1.ogg', 0, 26, 2, 64, 2.0, 0.8),
    'storm':       ('dark_rainy_night.ogg', 60, 42, 2, 64, 3.0, 0.8),
    'river':       ('sfx_loops/water_flowing.ogg', 0, None, 1, 48, 0.3, 0.7),
    # footsteps: Kenney's boot steps, shaped per surface (dry stone, hollow boards, soft wet earth)
    'step_stone0': (K + 'footstep02.ogg', 0, None, 1, 48, 0, 0.9, 'highpass=f=140,equalizer=f=3200:t=q:w=1.2:g=3'),
    'step_stone1': (K + 'footstep04.ogg', 0, None, 1, 48, 0, 0.9, 'highpass=f=140,equalizer=f=3200:t=q:w=1.2:g=3'),
    'step_stone2': (K + 'footstep05.ogg', 0, None, 1, 48, 0, 0.9, 'highpass=f=140,equalizer=f=3200:t=q:w=1.2:g=3'),
    'step_stone3': (K + 'footstep06.ogg', 0, None, 1, 48, 0, 0.9, 'highpass=f=140,equalizer=f=3200:t=q:w=1.2:g=3'),
    'step_stone4': (K + 'footstep07.ogg', 0, None, 1, 48, 0, 0.9, 'highpass=f=140,equalizer=f=3200:t=q:w=1.2:g=3'),
    'step_wood0':  (K + 'footstep00.ogg', 0, None, 1, 48, 0, 0.9, 'lowpass=f=3000,equalizer=f=200:t=q:w=1:g=4'),
    'step_wood1':  (K + 'footstep01.ogg', 0, None, 1, 48, 0, 0.9, 'lowpass=f=3000,equalizer=f=200:t=q:w=1:g=4'),
    'step_wood2':  (K + 'footstep03.ogg', 0, None, 1, 48, 0, 0.9, 'lowpass=f=3000,equalizer=f=200:t=q:w=1:g=4'),
    'step_wood3':  (K + 'footstep08.ogg', 0, None, 1, 48, 0, 0.9, 'lowpass=f=3000,equalizer=f=200:t=q:w=1:g=4'),
    'step_wood4':  (K + 'footstep09.ogg', 0, None, 1, 48, 0, 0.9, 'lowpass=f=3000,equalizer=f=200:t=q:w=1:g=4'),
    'step_mud0':   (K + 'footstep00.ogg', 0, None, 1, 48, 0, 0.9, 'asetrate=27200,aresample=32000,lowpass=f=700,equalizer=f=250:t=q:w=1:g=5'),
    'step_mud1':   (K + 'footstep01.ogg', 0, None, 1, 48, 0, 0.9, 'asetrate=27200,aresample=32000,lowpass=f=700,equalizer=f=250:t=q:w=1:g=5'),
    'step_mud2':   (K + 'footstep03.ogg', 0, None, 1, 48, 0, 0.9, 'asetrate=27200,aresample=32000,lowpass=f=700,equalizer=f=250:t=q:w=1:g=5'),
    'step_mud3':   (K + 'footstep08.ogg', 0, None, 1, 48, 0, 0.9, 'asetrate=27200,aresample=32000,lowpass=f=700,equalizer=f=250:t=q:w=1:g=5'),
    'step_gravel': ('steps/gravel.ogg', 0, 0.35, 1, 48, 0, 0.9),
    'door_open':   (K + 'doorOpen_2.ogg', 0, None, 1, 56, 0, 0.9),
    'door_close':  (K + 'doorClose_1.ogg', 0, None, 1, 56, 0, 0.9),
    'creak1':      (K + 'creak1.ogg', 0, None, 1, 48, 0, 0.9),
    'creak2':      (K + 'creak2.ogg', 0, None, 1, 48, 0, 0.9),
    'creak3':      (K + 'creak3.ogg', 0, None, 1, 48, 0, 0.9),
    'cloth1':      (K + 'cloth1.ogg', 0, None, 1, 48, 0, 0.9),
    'cloth2':      (K + 'cloth3.ogg', 0, None, 1, 48, 0, 0.9),
    'leather':     (K + 'handleSmallLeather.ogg', 0, None, 1, 48, 0, 0.9),
    'book_open':   (K + 'bookOpen.ogg', 0, None, 1, 48, 0, 0.9),
    'book_close':  (K + 'bookClose.ogg', 0, None, 1, 48, 0, 0.9),
    'book_flip1':  (K + 'bookFlip1.ogg', 0, None, 1, 48, 0, 0.9),
    'book_flip2':  (K + 'bookFlip2.ogg', 0, None, 1, 48, 0, 0.9),
    'latch':       (K + 'metalLatch.ogg', 0, None, 1, 48, 0, 0.9),
    'metal_click': (K + 'metalClick.ogg', 0, None, 1, 48, 0, 0.9),
    'knife':       (K + 'drawKnife2.ogg', 0, None, 1, 56, 0, 0.9),
}


def decode(path, start, length, ch, af=None):
    cmd = [FF, '-v', 'quiet', '-ss', str(start), '-i', path]
    if length: cmd += ['-t', str(length)]
    if af: cmd += ['-af', af]
    cmd += ['-ac', str(ch), '-ar', str(RATE), '-f', 's16le', '-']
    a = array.array('h'); a.frombytes(subprocess.run(cmd, capture_output=True, check=True).stdout)
    return [x / 32768 for x in a]


def trim_silence(s, ch, thr=0.01):
    # drop leading/trailing near-silence so one-shots fire on the click
    n = len(s) // ch
    lo = next((i for i in range(n) if max(abs(s[i * ch + c]) for c in range(ch)) > thr), 0)
    hi = next((i for i in range(n - 1, -1, -1) if max(abs(s[i * ch + c]) for c in range(ch)) > thr * 0.5), n - 1)
    lo = max(0, lo - int(RATE * 0.004))
    return s[lo * ch:(hi + 1) * ch]


def crossfade_loop(s, ch, sec):
    # the last `sec` seconds fade out over the first `sec`, which then start the loop
    f = int(RATE * sec) * ch
    body, tail = s[f:len(s) - f], s[len(s) - f:]
    head = s[:f]
    mixed = []
    for i in range(0, f, ch):
        k = i / f
        a, b = math.cos(k * math.pi / 2), math.sin(k * math.pi / 2)  # equal power
        for c in range(ch): mixed.append(tail[i + c] * a + head[i + c] * b)
    return body + mixed


def encode(samples, ch, kbps, out):
    pk = max(1e-6, max(abs(x) for x in samples))
    return pk, subprocess.run([FF, '-v', 'quiet', '-y', '-f', 's16le', '-ar', str(RATE), '-ac', str(ch), '-i', '-',
                               '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', out],
                              input=array.array('h', [int(max(-1, min(1, x)) * 32767) for x in samples]).tobytes(), check=True)


os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.mp3') and f[:-4] not in SOUNDS: os.remove(os.path.join(OUT, f))
total = 0
for name, spec in SOUNDS.items():
    src, start, length, ch, kbps, xf, peak = spec[:7]
    af = spec[7] if len(spec) > 7 else None
    s = decode(os.path.join(SRC, src), start, length, ch, af)
    if xf: s = crossfade_loop(s, ch, xf)
    else: s = trim_silence(s, ch)
    pk = max(1e-6, max(abs(x) for x in s))
    s = [x * peak / pk for x in s]
    out = os.path.join(OUT, name + '.mp3')
    encode(s, ch, kbps, out)
    total += os.path.getsize(out)
    print(f'{name:12s} {len(s) / ch / RATE:6.2f}s  {os.path.getsize(out) // 1024:5d} KB')
print(f'total {total // 1024} KB')
