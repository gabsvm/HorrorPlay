import os
d = 'web/art_review/thomas_v2/source/Thomas_Ashgrove_V2.blend/frames'
print('exists:', os.path.isdir(d))
print('contents:', os.listdir(d) if os.path.isdir(d) else None)
s = open('web/art_review/thomas_v2/scripts/build_master.py').read()
i = s.find("os.makedirs(os.path.join(OUT")
print('makedirs at:', i)
print(repr(s[i-200:i+120]))
