// El Huesped T2 — room photo v2 capture (real engine, 640x360 + 1280x720).
// Captures the wall photo (chapter 1), the lantern inspection (chapter 1),
// and the scraped variant on the wall + in inspection (chapter 3).
// The chapter-3 state is forced the same way QA does: room_phase flag
// (see web/src/scenes/room.js phase(G) and drawNear "by chapter three").
//
// Usage (paths are relative to this script, no personal paths):
//   node web/art_review/room_photo_map/v2/scripts/capture_v2.mjs before
//   node web/art_review/room_photo_map/v2/scripts/capture_v2.mjs after
// Output: web/art_review/room_photo_map/v2/work/<label>/ + capture_log.json
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../../..');
const OUT = resolve(HERE, '..', 'work');
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
const profile = join(tmpdir(), 'elh-room-photo-v2-' + Date.now());
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
  const url = 'http://127.0.0.1:' + server.address().port + '/index.html?scene=room&noenter&x=740';
  await send('Page.navigate', { url });
  let loaded = false;
  for (let i = 0; i < 120; i++) {
    await sleep(170);
    const ready = await ev('window.game?.scene?.id === "room" && game.r.presented > 3').catch(() => false);
    if (ready) { loaded = true; break; }
  }
  if (!loaded) throw Error('Scene not ready');
  await ev('(() => {game.r.fx.fade=0;game.r.fx.zoom=[1,.5,.5];game.zoomTarget=null;game.zoom={z:1,x:game.player.x,y:460};game.r.cam.shake=0;game.ui.showHud(false);game.ui.hideDialogue();return true;})()');
  await sleep(850);
  const shot = async (name, w, h) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await snap(name);
  };
  const snap = async (name) => {
    const data = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    await writeFile(join(DIR, name), Buffer.from(data.data, 'base64'));
    console.log('CAPTURE', label, name);
    log.push(name);
  };
  const frame = async (x, name) => {
    await ev(`(() => {game.player.x=${x};game.zoom={z:1,x:${x},y:460};game.ui.hideDialogue();return true;})()`);
    await sleep(700);
    await shot(`${name}_640x360.png`, 640, 360);
    await shot(`${name}_1280x720.png`, 1280, 720);
  };
  const setPhase = async (p) => {
    // Force the room chapter phase like QA does (room.js phase(G) reads this flag).
    await ev(`(() => {game.G.state.flags.room_phase=${JSON.stringify(p)};if(${JSON.stringify(p)}!=="c1"){game.G.state.chapter="c3";}else{game.G.state.chapter="c1";}return true;})()`);
    await sleep(700);
  };
  const inspectHotspot = async (hid, tag) => {
    await ev(`(() => {game.player.x=${hid === 'photo' ? 740 : 1260};game.zoom={z:1,x:game.player.x,y:460};game.player.lanternOn=true;game.scene.G=game.G;const h=game.scene.hotspots.find(h=>h.id===${JSON.stringify(hid)});h.act(game.G);return true;})()`);
    await sleep(2600);
    const open = await ev(`!document.getElementById('inspect').classList.contains('hidden')`).catch(() => false);
    if (!open) { console.log('INSPECT SKIP', tag, '(no modal)'); log.push(`inspect_${tag}:SKIP`); return; }
    const title = await ev(`document.getElementById('insp-title').textContent`).catch(() => '');
    console.log('INSPECT OPEN', tag, JSON.stringify(title));
    // Pin the lantern between the two heads (606, 275 in 1280x720 paint space)
    // AFTER the viewport metrics settle: changing metrics synthesizes pointer
    // events that would otherwise undo the pin before the pixels land.
    const pin = async () => {
      const pt = await ev(`(() => {const r = document.getElementById('inspect').getBoundingClientRect();return { x: r.left + r.width * 606 / 1280, y: r.top + r.height * 275 / 720 };})()`).catch(() => null);
      if (pt) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(pt.x), y: Math.round(pt.y) });
      await sleep(450);
      // The hotspot covers the whole painting (r=800), so any light position
      // raises the hover label over the faces: hide it for a clean comparison
      // (the before shots have no label because no pointer ever moved there).
      await ev(`(() => {document.getElementById('insp-label').classList.add('hidden');return true;})()`).catch(() => {});
      await sleep(250);
    };
    await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pin();
    await snap(`inspect_${tag}_640x360.png`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pin();
    await snap(`inspect_${tag}_1280x720.png`);
    await ev(`(() => {document.getElementById('insp-close').click();return true;})()`).catch(() => {});
    await sleep(1200);
    await ev('(() => {game.r.fx.fade=0;game.ui.hideDialogue();return true;})()');
    await sleep(400);
  };
  // Chapter 1: wall + lantern inspection (intact faces).
  await setPhase('c1');
  await frame(740, 'wall_c1');
  await inspectHotspot('photo', 'photo_c1');
  // Chapter 3: wall scratch overlay + torn inspection (elder face scraped).
  await setPhase('c3b');
  await frame(740, 'wall_c3');
  await inspectHotspot('photo', 'photo_c3');
  await writeFile(join(DIR, 'capture_log.json'), JSON.stringify({ scene: 'room', label, method: 'actual canvas/render in Chrome; QA scene deep-link, no story entrance; c3 forced via room_phase flag', androidTested: false, shots: log }, null, 2));
} finally {
  try { ws?.close(); } catch { /* noop */ }
  try { proc?.kill(); } catch { /* noop */ }
  server.close();
  await sleep(650);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }).catch(() => {});
}
