// Capture the real Hanbury yard scene (El Huesped T4b) before/after, at both
// logical sizes. Two frames: wash corner (tub + mangle, x=500) and tap/privy
// corner (x=1650). Hanbury hotspots only examine/talk, so there are no object
// close-up inspections to shoot; rain is animated so pixels never match exactly.
// Usage: node web/art_review/hanbury_yard/scripts/capture_hanbury.mjs before
//        node web/art_review/hanbury_yard/scripts/capture_hanbury.mjs after
// For BEFORE (procedural fallback): temporarily move web/assets/props/hanbury_*.png
// aside, capture, then restore. drawProp returns false when the PNG 404s.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../..');
const OUT = resolve(HERE, '..', 'comparison', 'work');
const label = process.argv[2] || 'after';
if (!/^[a-z0-9_-]+$/i.test(label)) throw Error('Bad output label');
const DIR = join(OUT, label);
await mkdir(DIR, { recursive: true });
const chrome = [
  process.env.CHROME, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find((x) => x && existsSync(x));
if (!chrome) throw Error('Edge/Chrome not found');
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
};
const server = createServer(async (req, res) => {
  try {
    const path = resolve(WEB, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    const rel = relative(WEB, path);
    if (rel.startsWith('..') || rel.startsWith('/') || rel.startsWith('\\') || rel.includes(':')) throw Error('bad path');
    const st = await import('node:fs/promises').then((m) => m.stat(path));
    if (!st.isFile()) throw Error('bad path');
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(path));
  } catch { res.writeHead(404); res.end(); }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), 'elh-hanbury-t4b-' + Date.now());
await mkdir(profile, { recursive: true });
let proc; let ws;
const log = [];
try {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = 37000 + Math.floor(Math.random() * 7000);
  proc = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=1280,720', 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
      if (r.ok) target = await r.json();
    } catch { /* retry */ }
    if (!target) await sleep(170);
  }
  if (!target) throw Error('Browser CDP unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', j, { once: true }); });
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const v = JSON.parse(e.data);
    if (v.id && pending.has(v.id)) { pending.get(v.id)(v); pending.delete(v.id); }
  });
  const send = (method, params = {}) => new Promise((r, j) => {
    const n = ++id;
    const timeout = setTimeout(() => { pending.delete(n); j(Error('CDP timeout ' + method)); }, 30000);
    pending.set(n, (v) => { clearTimeout(timeout); v.error ? j(Error(v.error.message)) : r(v.result); });
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const ev = async (expr) => {
    const v = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (v.exceptionDetails) throw Error(v.exceptionDetails.text);
    return v.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const url = 'http://127.0.0.1:' + server.address().port + '/index.html?scene=hanbury&noenter&x=500';
  await send('Page.navigate', { url });
  let loaded = false;
  for (let i = 0; i < 120; i++) {
    await sleep(170);
    const ready = await ev('window.game?.scene?.id === "hanbury" && game.r.presented > 3').catch(() => false);
    if (ready) { loaded = true; break; }
  }
  if (!loaded) throw Error('Scene not ready');
  await ev('(() => {game.r.fx.fade=0;game.r.fx.zoom=[1,.5,.5];game.zoomTarget=null;game.zoom={z:1,x:game.player.x,y:460};game.r.cam.shake=0;game.ui.showHud(false);return true;})()');
  await sleep(850);
  const shot = async (name, w, h) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    const data = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    await writeFile(join(DIR, name), Buffer.from(data.data, 'base64'));
    console.log('CAPTURE', label, name);
    log.push(name);
  };
  const frame = async (x, name) => {
    await ev(`(() => {game.player.x=${x};game.zoom={z:1,x:${x},y:460};return true;})()`);
    await sleep(700);
    await shot(`${name}_640x360.png`, 640, 360);
    await shot(`${name}_1280x720.png`, 1280, 720);
  };
  // wash corner: tub (403) + mangle (479); tap/privy corner: tap (1660) + privy (1917)
  await frame(500, 'hanbury_x500');
  await frame(1650, 'hanbury_x1650');
  await writeFile(join(DIR, 'capture_log.json'), JSON.stringify({ scene: 'hanbury', label, method: 'actual canvas/render in Chrome; QA scene deep-link, no story entrance', androidTested: false, shots: log }, null, 2));
} finally {
  try { ws?.close(); } catch { /* noop */ }
  try { proc?.kill(); } catch { /* noop */ }
  server.close();
  await sleep(650);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }).catch(() => {});
}
