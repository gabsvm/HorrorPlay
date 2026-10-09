"""The cast, as figure.py builds them: the same looks the scenes give each Actor (src/scenes/*.js,
src/story/chapters.js), plus what each one does on screen, so only the frames the game shows are
rendered. Keys match DEF in src/engine/actor.js; the extra keys say which animations to render:

  walk    walks somewhere (walk, half stride, turn)
  run     runs (the chase)
  poses   poses the scripts ask for
  base    a pose held for the whole scene (sitting at the séance, kneeling by the body): its
          breathing and talking replace standing still
  reach   reaches toward hotspots at several heights (Actor.reachTo)
  lying   a victim as the police found her (figure.py LIE): one still frame, drawn by corpse.js
  cover   the cape or sacking someone threw over her (draped over the body)
"""

MET = dict(h=212, hat='helmet', hatColor='#0e1018', coat='#161c30', trousers='#12151f', coatLen=0.8, flare=1.02,
           belt=True, number=True, lantern=True, lanternOn=True, moustache='#4a3424', buttons='brass')

VECINO = dict(h=200, walk=True, run=True, talk=False, idle=6, gait=(('walk', 1.0, 12),), runFrames=8)

CAST = {
    'thomas': dict(h=206, hat='bowler', coat='#23262b', coatLen=0.88, flare=1.2, lantern=True, collarUp=True,
                   sideburns=True, hair='#1a1410', gloves='#2a221c', scarf='#4a1612', trousers='#1a1b1e',
                   walk=True, run=True, reach=True, idle=12,
                   gait=(('walk', 1.0, 16), ('walk3', 0.75, 12), ('walkh', 0.5, 12), ('walkq', 0.25, 12)),
                   poses=['kneel', 'take', 'inspect', 'recoil', 'clutch', 'write', 'sit', 'reach']),
    'pike': dict(h=200, hat='bowler', coat='#2c2a26', coatLen=0.9, cape=True, build=1.05, moustache='#3a2a1e',
                 buttons='double', notebook=True, hair='#3a2a1e'),
    'greaves': dict(h=214, hat='top', coat='#1d1b1c', coatLen=0.95, cane=True, beard='#7a7a74', hair='#8a8a84',
                    flare=1.05, tails=True, chain=True, waistcoat='#3a2a20', buttons='double',
                    walk=True, poses=['cower', 'reach']),
    'wexley': dict(h=200, hat='shawl', shawl='#3a1a2a', skirt=True, bustle=True, coat='#2a1c22', hair='#1a1210',
                   base='sit'),
    'viuda': dict(h=190, hat='bonnet', hatColor='#0a0a0b', skirt=True, coat='#121112', shawl='#0e0d0e', base='sit'),
    'joven': dict(h=200, hat='none', hair='#2a1e14', coat='#2a2a30', moustache='#2a1e14', scarf='#4a3a2a',
                  base='sit'),
    'brennan': dict(h=222, hat='cap', hatColor='#2a241e', coat='#4a3e34', coatLen=0.66, apron='#3a2416', build=1.35,
                    trousers='#2a2420', rolled=True, beard='#2e2216', hair='#2e2216', walk=True,
                    poses=['reach', 'cower']),
    'wren': dict(h=150, hat='cap', hatColor='#2e2a26', coat='#4a4036', skirt=True, patches=True, shawl='#3a3a44',
                 hair='#5a3a22', boots='#1a1612', walk=True, poses=['reach']),
    'constable': dict(MET, walk=True, run=True),
    'city': dict(MET, coat='#14182a', trousers='#10121c', moustache='#3a2a1e'),
    'morris': dict(h=190, hat='cap', coat='#2e2a24', coatLen=0.7, stoop=1, beard='#7a7670', hair='#8a8680',
                   scarf='#3a3028'),
    'chico': dict(h=156, hat='cap', coat='#4a3a2a', coatLen=0.58, stoop=1, patches=True, hair='#4a3020', base='kneel'),
    'amelia': dict(h=176, hat='bonnet', hatColor='#1e1a18', skirt=True, coat='#3a3432', shawl='#2e2826', stoop=1,
                   hair='#6a6660'),
    # the victims, as the police found them (looks from the drawCorpse calls in the scenes)
    'polly': dict(h=150, hat='none', skirt=True, coat='#4a3a2c', hair='#4a3a2a', lying='polly', cover='#161c30'),
    'annie': dict(h=150, hat='none', skirt=True, coat='#2a2420', hair='#3a2a20', eyesClosed=True, lying='annie',
                  cover='#5a4a36'),
    'kate': dict(h=150, hat='bonnet', hatColor='#1a1414', skirt=True, coat='#24262a', apron='#a8a292', hair='#2a2420',
                 eyesClosed=True, lying='kate'),
    # the neighbours in the mob at the knackers' yard: six figures for nine people, who stand, turn,
    # and scatter at a run (knackers.js; model.js maps each Vecino to one)
    'vecino_cap': dict(VECINO, hat='cap', coat='#2a2620', moustache='#3a2a1e'),
    'vecino_bowler': dict(VECINO, hat='bowler', coat='#30302c', beard='#2a2018'),
    'vecino_bare': dict(VECINO, hat='none', coat='#1f2226', hair='#3a2a1a', rolled=True),
    'vecina_shawl': dict(VECINO, hat='shawl', skirt=True, shawl='#2e2a30', coat='#3a3026'),
    'vecina_bonnet': dict(VECINO, hat='bonnet', skirt=True, coat='#28241f'),
    'vecino_big': dict(VECINO, hat='cap', coat='#33302a', beard='#3a3026', build=1.2),
}
