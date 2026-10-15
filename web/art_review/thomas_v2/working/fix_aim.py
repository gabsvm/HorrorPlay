import os
P = 'web/art_review/thomas_v2/scripts/fix_studio_cams.py'
s = open(P, encoding='utf-8').read().replace('\r\n', '\n')
old = "cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()"
assert s.count(old) == 1, s.count(old)
s = s.replace(old, "cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()")
open(P, 'w', encoding='utf-8', newline='\n').write(s)
print('aim fix ok')
