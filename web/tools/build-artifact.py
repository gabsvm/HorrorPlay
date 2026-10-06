"""Bundle the game into a single self-contained HTML page (inline CSS and JS).
usage: python web/tools/build-artifact.py OUT.html   (run `npx esbuild` first, see README)
Expects the esbuild bundle next to OUT as bundle.js.
"""
import base64
import json
import os
import re
import sys

out = sys.argv[1]
web = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(web, 'index.html'), encoding='utf-8').read()
css = open(os.path.join(web, 'styles.css'), encoding='utf-8').read() + '\n:root{color-scheme:dark}html,body{height:100%;background:#000}\n'
js = open(os.path.join(os.path.dirname(out), 'bundle.js'), encoding='utf-8').read().replace('</script', '<\\/script')
body = html.split('<body>')[1].split('</body>')[0].replace('<script type="module" src="src/main.js"></script>', '')
fonts = re.search(r'<link href="https://fonts.googleapis.com[^>]+>', html).group(0)
# the recorded sounds travel inside the page as data URIs (the engine reads window.__SAMPLES first)
adir = os.path.join(web, 'assets', 'audio')
samples = {f[:-4]: 'data:audio/mpeg;base64,' + base64.b64encode(open(os.path.join(adir, f), 'rb').read()).decode()
           for f in sorted(os.listdir(adir)) if f.endswith('.mp3')}
sjs = '<script>window.__SAMPLES=' + json.dumps(samples) + ';</script>\n'
page = '<title>El Huésped</title>\n' + fonts + '\n<style>\n' + css + '</style>\n' + body + '\n' + sjs + '<script type="module">\n' + js + '\n</script>\n'
open(out, 'w', encoding='utf-8').write(page)
print(f'{out}: {len(page)} bytes')
