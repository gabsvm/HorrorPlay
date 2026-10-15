import os, shutil
P = 'web/art_review/thomas_v2/scripts/build_master.py'
s = open(P, encoding='utf-8').read().replace('\r\n', '\n')
old = "os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)"
assert s.count(old) == 1
s = s.replace(old, "# MASTER: no render frames dir (OUT is the .blend path, not a folder)")
open(P, 'w', encoding='utf-8', newline='\n').write(s)
stray_frames = os.path.join('web', 'art_review', 'thomas_v2', 'source', 'Thomas_Ashgrove_V2.blend', 'frames')
stray = os.path.join('web', 'art_review', 'thomas_v2', 'source', 'Thomas_Ashgrove_V2.blend')
assert os.listdir(stray) == ['frames'] and os.listdir(stray_frames) == [], "unexpected stray contents"
os.rmdir(stray_frames)
os.rmdir(stray)
print("fix ok, stray removed")
