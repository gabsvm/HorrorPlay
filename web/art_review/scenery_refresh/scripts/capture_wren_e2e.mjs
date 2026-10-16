// Capture the two Wren moments at 640x360 in the real engine, with the real clock
// (no FAST, no scene= shortcuts): the penny on the stone post, and Wren on the ground.
// Real playthrough from the chapter-I baseline save, then side-by-side PNG via Python PIL
// (palette, < 500 KB) in comparison/exchange/WREN_E2E_640.png. Temp shots are deleted.
//   node web/art_review/scenery_refresh/scripts/capture_wren_e2e.mjs
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../..');
const OUT = resolve(HERE, '../comparison/exchange/WREN_E2E_640.png');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((x) => x && existsSync(x));
if (!chrome) throw new Error('Chrome/Edge not found');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://localhost');
    let p = join(WEB, decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html');
    res.writeHead(200, { 'Content-Type': mime[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const port = 37000 + Math.floor(Math.random() * 7000);
const profile = join(tmpdir(), 'elh-wren-e2e-' + Date.now());
const proc = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, '--window-size=640,360', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
let ws;
try {
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try { const r = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' }); if (r.ok) target = await r.json(); } catch {}
    if (!target) await sleep(170);
  }
  if (!target) throw new Error('CDP unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => { const v = JSON.parse(e.data); if (v.id && pending.has(v.id)) { pending.get(v.id)(v); pending.delete(v.id); } });
  const send = (method, params = {}) => new Promise((r, j) => { const n = ++id; const t = setTimeout(() => { pending.delete(n); j(new Error('CDP timeout')); }, 30000); pending.set(n, (v) => { clearTimeout(t); v.error ? j(new Error(v.error.message)) : r(v.result); }); ws.send(JSON.stringify({ id: n, method, params })); });
  const ev = async (expr) => { const v = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (v.exceptionDetails) throw new Error('eval fail'); return v.result.value; };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base + '/index.html?' });
  for (let i = 0; i < 120; i++) { await sleep(170); if (await ev('!!(window.game && game.scene)').catch(() => false)) break; }
  await sleep(600);
  const wnorm = (s) => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const whasMenu = () => ev(`!document.getElementById('choices').classList.contains('hidden') && !!game.ui._choiceKeys`);
  const wmenuTexts = () => ev(`[...document.querySelectorAll('#choices button')].map((x) => x.textContent)`);
  const wplay = async (hid, picks = []) => {
    await ev(`(() => { window.__actDone = false; const h = game.activeHotspots().find((x) => x.id === '${hid}'); const r = typeof h.rect === 'function' ? h.rect(game.G) : h.rect; game.onClick({ x: r[0] + r[2] / 2 - game.r.cam.x, y: r[1] + r[3] / 2 }, false).then(() => { window.__actDone = true; }); return true; })()`);
    const queue = [...picks];
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) {
      await sleep(250);
      if (await whasMenu()) {
        await sleep(650);
        if (!await whasMenu()) continue;
        const cur = await wmenuTexts();
        const want = queue.shift();
        const idx = cur.findIndex((t) => wnorm(t).includes(wnorm(want)));
        await ev(`[...document.querySelectorAll('#choices button')][${idx}].click()`);
        await sleep(450);
        if (await whasMenu()) { const ag = await wmenuTexts(); if (JSON.stringify(ag) === JSON.stringify(cur)) { queue.unshift(want); continue; } }
        continue;
      }
      const s = await ev(`({ done: window.__actDone, running: game.running, dlg: !document.getElementById('dialogue').classList.contains('hidden') })`);
      if (s.dlg) { await ev('game.ui.advance()'); continue; }
      if (s.done && s.running === 0) {
        await sleep(400);
        const q = await ev(`({ running: game.running, dlg: !document.getElementById('dialogue').classList.contains('hidden'), menu: !document.getElementById('choices').classList.contains('hidden') && !!game.ui._choiceKeys })`);
        if (q.running === 0 && !q.dlg && !q.menu) return;
      }
    }
    throw new Error('play timeout ' + hid);
  };
  const c1 = await readFile(join(WEB, 'tests/fixtures/saves-v1-baseline/c1.json'), 'utf8');
  await ev(`(() => { localStorage.clear(); window.__c1done = false; game.inMenu = false; game.ui.hideMenu(); game.startChapter('c1', ${c1}).then(() => { window.__c1done = true; }); return true; })()`);
  for (let i = 0; i < 120; i++) { await sleep(350); const s = await ev(`({ done: window.__c1done, scene: game.state.scene, running: game.running, dlg: !document.getElementById('dialogue').classList.contains('hidden') })`); if (s.dlg) await ev('game.ui.advance()'); if (s.done && s.scene === 'room' && s.running === 0 && !s.dlg) break; }
  await wplay('coat'); await wplay('boots'); await wplay('lantern'); await wplay('door');
  await wplay('pike', ['medico', 'nada mas']); await wplay('pike', ['trabaja de noche', 'nada mas']); await wplay('west');
  // Wren, capturing the two moments on the real clock.
  let shotA = null;
  let shotB = null;
  await ev(`(() => { window.__actDone = false; const h = game.activeHotspots().find((x) => x.id === 'wren'); const r = typeof h.rect === 'function' ? h.rect(game.G) : h.rect; game.onClick({ x: r[0] + r[2] / 2 - game.r.cam.x, y: r[1] + r[3] / 2 }, false).then(() => { window.__actDone = true; }); return true; })()`);
  {
    const queue = ['penique', 'por que'];
    const t0 = Date.now();
    while (Date.now() - t0 < 150000) {
      await sleep(220);
      if (await whasMenu()) {
        await sleep(650);
        if (!await whasMenu()) continue;
        const cur = await wmenuTexts();
        const want = queue.shift();
        const idx = cur.findIndex((t) => wnorm(t).includes(wnorm(want)));
        await ev(`[...document.querySelectorAll('#choices button')][${idx}].click()`);
        await sleep(450);
        if (await whasMenu()) { const ag = await wmenuTexts(); if (JSON.stringify(ag) === JSON.stringify(cur)) { queue.unshift(want); continue; } }
        continue;
      }
      const s = await ev(`(() => { const w = game.actor('Wren'); return { done: window.__actDone, running: game.running, dlg: !document.getElementById('dialogue').classList.contains('hidden'), coin: !!game.state.flags.wren_coin_on_post, wy: w ? w.y : null }; })()`);
      if (!shotA && s.coin && s.running > 0) shotA = (await send('Page.captureScreenshot', { format: 'png', fromSurface: true })).data;
      if (!shotB && (s.wy || 0) >= 620 && s.coin) shotB = (await send('Page.captureScreenshot', { format: 'png', fromSurface: true })).data;
      if (s.dlg) { await ev('game.ui.advance()'); continue; }
      if (s.done && s.running === 0) {
        await sleep(400);
        const q = await ev(`({ running: game.running, dlg: !document.getElementById('dialogue').classList.contains('hidden'), menu: !document.getElementById('choices').classList.contains('hidden') && !!game.ui._choiceKeys })`);
        if (q.running === 0 && !q.dlg && !q.menu) break;
      }
    }
  }
  if (!shotA || !shotB) throw new Error('moments not captured');
  const tmpA = join(tmpdir(), `wren-coin-${Date.now()}.png`);
  const tmpB = join(tmpdir(), `wren-ground-${Date.now()}.png`);
  await writeFile(tmpA, Buffer.from(shotA, 'base64'));
  await writeFile(tmpB, Buffer.from(shotB, 'base64'));
  const py = `from PIL import Image, ImageDraw\nimport sys\na, b, out = sys.argv[1], sys.argv[2], sys.argv[3]\nA = Image.open(a).convert('RGB')\nB = Image.open(b).convert('RGB')\nassert A.size == (640, 360) and B.size == (640, 360)\nS = Image.new('RGB', (1280, 360))\nS.paste(A, (0, 0))\nS.paste(B, (640, 0))\nd = ImageDraw.Draw(S)\nfor x, t in ((8, 'PENIQUE SOBRE EL POSTE'), (648, 'WREN EN EL SUELO')):\n    w, h = d.textbbox((0, 0), t)[2:]\n    d.rectangle([x - 4, 6, x + w + 4, 10 + h], fill=(5, 7, 10))\n    d.text((x, 8), t, fill=(234, 217, 178))\nS.convert('P', palette=Image.ADAPTIVE, colors=256).save(out, optimize=True)\nprint('WREN_E2E', out)\n`;
  const r = spawnSync('python', ['-c', py, tmpA, tmpB, OUT], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('PIL combine failed: ' + (r.stderr || '').slice(0, 500));
  await rm(tmpA, { force: true });
  await rm(tmpB, { force: true });
  console.log((r.stdout || '').trim());
} finally {
  try { ws?.close(); } catch {}
  try { proc?.kill(); } catch {}
  server.close();
  await sleep(650);
}
