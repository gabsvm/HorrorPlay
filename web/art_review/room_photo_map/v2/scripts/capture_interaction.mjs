// El Huesped T-B — room photo/map interaction captures (real engine).
// The lantern inside vs outside the single inspection point: before (r=800,
// called directly with the same paint path as the game) and after (the real
// room.js hotspots with their measured points).
// Usage (paths are relative to this script, no personal paths):
//   node web/art_review/room_photo_map/v2/scripts/capture_interaction.mjs
// Output: v2/work/interaction/*.png + capture_log.json (regenerable, not shipped).
// The deliverable sheet is built with make_interaction_png.py.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../../..');
const OUT = resolve(HERE, '..', 'work', 'interaction');
await mkdir(OUT, { recursive: true });
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
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(tmpdir(), 'elh-room-interaction-' + Date.now());
let proc; let ws;
const log = { points: { photo: { x: 600, y: 370, r: 180 }, map: { x: 700, y: 280, r: 175 } }, shots: [] };
try {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = 37000 + Math.floor(Math.random() * 7000);
  proc = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=640,360', 'about:blank'], { stdio: 'ignore', windowsHide: true });
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
    if (v.exceptionDetails) throw Error('eval: ' + v.exceptionDetails.text);
    return v.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const move = async (lx, ly) => {
    const p = await ev(`(() => { const r = document.getElementById('inspect').getBoundingClientRect(); return { x: r.left + ${lx} / 1280 * r.width, y: r.top + ${ly} / 720 * r.height }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
    await sleep(700);
  };
  const shot = async (name) => {
    const data = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    await writeFile(join(OUT, name), Buffer.from(data.data, 'base64'));
    log.shots.push(name);
    console.log('SHOT', name);
  };
  const open = () => ev(`!document.getElementById('inspect').classList.contains('hidden')`);
  const closeInspect = async (flag) => {
    const r = await ev(`(() => { const b = document.getElementById('insp-close'); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
    await sleep(50);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', buttons: 1, clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', buttons: 0, clickCount: 1 });
    for (let i = 0; i < 60 && (await open() || !(await ev(`window.${flag}`))); i++) await sleep(250);
    if (await open()) throw Error('inspect did not close');
  };
  // before: the old catch-all geometry (r=800), same paint path the game uses
  const before = async (kind, body, title, name, lx, ly, tag) => {
    await ev(`(window.__bdone = false, game.G.inspect('${kind}', { title: '${title}', body: '${body}', calm: true, points: [{ id: 'mirar', x: 640, y: 360, r: 800, name: '${name}', act: async () => {} }] }).then(() => { window.__bdone = true; }), true)`);
    for (let i = 0; i < 60 && !(await open()); i++) await sleep(200);
    await move(lx, ly);
    await shot(`before_${tag}_${SIZE[0]}x${SIZE[1]}.png`);
    await closeInspect('__bdone');
  };
  // after: the real hotspot with its measured single point
  const after = async (hid, lxIn, lyIn, lxOut, lyOut, tag) => {
    console.log('TRIGGER', tag, JSON.stringify(await ev(`({ running: game.running, scene: game.scene && game.scene.id, px: game.player.x, spots: game.activeHotspots().map((x) => x.id) })`)));
    await ev(`(window.__adone = false, window.__aerr = null, (() => { const h = game.activeHotspots().find((x) => x.id === '${hid}'); if (!h) { window.__aerr = 'no hotspot'; return; } const r = h.rect; const tx = h.walk != null ? (typeof h.walk === 'function' ? h.walk(game.G) : h.walk) : null; if (tx != null) { game.player.stop(); game.player.x = Math.max(game.scene.walk[0], Math.min(game.scene.walk[1], tx)); } game.onClick({ x: r[0] + r[2] / 2 - game.r.cam.x, y: r[1] + r[3] / 2 }, false).then(() => { window.__adone = true; }).catch((e) => { window.__aerr = String(e && e.message || e); }); })(), true)`);
    for (let i = 0; i < 150 && !(await open()); i++) await sleep(200);
    if (!(await open())) throw Error(`inspect did not open: ${hid} err=${await ev('window.__aerr')} state=${JSON.stringify(await ev(`({ running: game.running, px: game.player.x, done: window.__adone })`))}`);
    await move(lxIn, lyIn);
    await shot(`${tag}_in_${SIZE[0]}x${SIZE[1]}.png`);
    await move(lxOut, lyOut);
    await shot(`${tag}_out_${SIZE[0]}x${SIZE[1]}.png`);
    await closeInspect('__adone');
  };
  let SIZE = [640, 360];
  for (const [w, h] of [[640, 360], [1280, 720]]) {
    SIZE = [w, h];
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + '/index.html?scene=room&noenter&x=760' });
    let ready = false;
    for (let i = 0; i < 120; i++) {
      await sleep(170);
      if (await ev(`window.game && game.scene && game.scene.id === 'room' && game.r.presented > 3`).catch(() => false)) { ready = true; break; }
    }
    if (!ready) throw Error('room not ready');
    await sleep(850);
    if (w === 640) {
      await before('photo', 'room_photo', 'Fotografía', 'La fotografía', 60, 640, 'photo_outside');
      await before('map', 'room_map', 'Mapa de Whitechapel', 'El mapa', 1050, 75, 'map_outside');
    }
    await after('photo', 610, 350, 60, 640, 'photo');
    await after('map', 740, 260, 1050, 75, 'map');
  }
  await writeFile(join(OUT, 'capture_log.json'), JSON.stringify(log, null, 2));
  console.log('LOG', JSON.stringify(log.shots));
} finally {
  try { ws?.close(); } catch { /* closed */ }
  try { proc?.kill(); } catch { /* killed */ }
  server.close();
  await sleep(650);
}
