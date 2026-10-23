"""Bundle the game into a single self-contained HTML page (inline CSS and JS).
usage: python web/tools/build-artifact.py OUT.html [--apk]   (run `npx esbuild` first, see README)
Expects the esbuild bundle next to OUT as bundle.js. --apk writes a complete document for the
Android WebView (see tools/build-apk.sh).
"""
import base64
import json
import os
import re
import sys

NL = chr(10)
out = sys.argv[1]
apk = '--apk' in sys.argv
web = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(web, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(web, 'styles.css'), encoding='utf-8').read()
# the typefaces (assets/fonts) travel inside the page as data URIs, like the sounds and the figures
css = re.sub(r'url\(assets/fonts/([\w.-]+\.woff2)\)', lambda m: 'url(data:font/woff2;base64,' + base64.b64encode(open(os.path.join(web, 'assets', 'fonts', m.group(1)), 'rb').read()).decode() + ')', css)
# In APK (single HTML), embed each CSS paper texture as a data URI.
# Explicit names avoid unreliable relative URLs and fragile regex escaping.
for name in ('carta', 'expediente', 'recorte'):
    filename = name + '_paper_960x540.webp'
    token = "url('assets/documents/" + filename + "')"
    if token not in css:
        raise ValueError('Missing paper reference in CSS: ' + token)
    encoded = base64.b64encode(open(os.path.join(web, 'assets', 'documents', filename), 'rb').read()).decode()
    css = css.replace(token, 'url(data:image/webp;base64,' + encoded + ')')
css += NL + ':root{color-scheme:dark}html,body{height:100%;background:#000}' + NL
# the licences of the typefaces travel with them (assets/fonts/LICENSES.md): OFL 1.1 for IM Fell, Apache 2.0 for Special Elite
lic = '<!-- Tipografias incluidas: IM Fell English / IM Fell English SC (SIL Open Font License 1.1) y Special Elite (Apache License 2.0).' + NL + NL.join(open(os.path.join(web, 'assets', 'fonts', n), encoding='utf-8').read() for n in ('OFL.txt', 'LICENSE-2.0.txt')) + NL + '-->' + NL
assert '-->' not in lic[:-4]
js = open(os.path.join(os.path.dirname(out), 'bundle.js'), encoding='utf-8').read().replace('</script', '<\\/script')
body = html.split('<body>')[1].split('</body>')[0].replace('<script type="module" src="src/main.js"></script>', '')
# the recorded sounds travel inside the page as data URIs (the engine reads window.__SAMPLES first)
adir = os.path.join(web, 'assets', 'audio')
samples = {f[:-4]: 'data:audio/mpeg;base64,' + base64.b64encode(open(os.path.join(adir, f), 'rb').read()).decode()
           for f in sorted(os.listdir(adir)) if f.endswith('.mp3')}
# and so do the modelled figures (assets/models, rendered by tools/blender): two atlases and their frames
mdir = os.path.join(web, 'assets', 'models')
models = {m: {'meta': json.load(open(os.path.join(mdir, m, 'model.json'))),
              **{f: 'data:image/png;base64,' + base64.b64encode(open(os.path.join(mdir, m, f + '.png'), 'rb').read()).decode()
                 for f in ('albedo', 'normal')}}
          for m in sorted(os.listdir(mdir)) if os.path.isfile(os.path.join(mdir, m, 'model.json'))}
# and the painted crime-scene close-ups (tools/closeups.py)
cdir = os.path.join(web, 'assets', 'closeups')
cidx = json.load(open(os.path.join(cdir, 'index.json'))) if os.path.isfile(os.path.join(cdir, 'index.json')) else {}
closeups = {k: 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(cdir, f), 'rb').read()).decode() for k, f in cidx.items()}
# and the modelled scenery props (tools/blender/props.py)
rdir = os.path.join(web, 'assets', 'props')
ridx = json.load(open(os.path.join(rdir, 'index.json'))) if os.path.isfile(os.path.join(rdir, 'index.json')) else {}
props = {n: {'meta': m, 'src': 'data:image/png;base64,' + base64.b64encode(open(os.path.join(rdir, n + '.png'), 'rb').read()).decode()} for n, m in ridx.items()}
sjs = ('<script>window.__SAMPLES=' + json.dumps(samples) + ';window.__MODELS=' + json.dumps(models)
       + ';window.__CLOSEUPS=' + json.dumps(closeups) + ';window.__PROPS=' + json.dumps(props) + ';</script>' + NL)
style = '<style>' + NL + css + '</style>' + NL
scripts = sjs + '<script type="module">' + NL + js + NL + '</script>' + NL
if apk:
    page = NL.join([
        '<!doctype html>', '<html lang="es">', '<head>', '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">',
        '<title>El Huésped</title>', lic + '<script>window.__APK = true;</script>',
    ]) + NL + style + '</head>' + NL + '<body>' + NL + body + NL + scripts + '</body>' + NL + '</html>' + NL
else:
    page = lic + '<title>El Huésped</title>' + NL + style + body + NL + scripts
open(out, 'w', encoding='utf-8').write(page)
print(f'{out}: {len(page)} bytes')
