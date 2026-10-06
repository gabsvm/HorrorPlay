"""Bundle the game into a single self-contained HTML page (inline CSS and JS).
usage: python web/tools/build-artifact.py OUT.html   (run `npx esbuild` first, see README)
Expects the esbuild bundle next to OUT as bundle.js.
"""
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
page = '<title>El Huésped</title>\n' + fonts + '\n<style>\n' + css + '</style>\n' + body + '\n<script type="module">\n' + js + '\n</script>\n'
open(out, 'w', encoding='utf-8').write(page)
print(f'{out}: {len(page)} bytes')
