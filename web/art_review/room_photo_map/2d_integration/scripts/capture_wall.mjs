// El Huesped ENTREGA B (2D): wall-sprite captures of the room photograph (real engine).
// Captures the framed photo on the wall in chapter 1 (intact) and chapter 3
// (scraped), at a fixed camera (x=740) so before/after stay comparable.
// The chapter-3 state is forced the same way QA does (room_phase flag, see
// web/src/scenes/room.js phase(G)); after the change the static layer is keyed
// by phase (room.js variant), so the capture rebuilds layers exactly like
// G.goto('room') does in the real game. Rain varies between shots.
//
// Usage (paths are relative to this script, no personal paths):
//   node web/art_review/room_photo_map/2d_integration/scripts/capture_wall.mjs <label> [c1|c3|all]
// Output: web/art_review/room_photo_map/2d_integration/work/<label>/ + capture_log.json
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '..', '..', '..', '..');
const OUT = resolve(HERE, '..', 'work');
const label = process.argv[2] || 'after';
if (!/^[a-z0-9_-]+$/i.test(label)) throw Error('Bad output label');
// One fresh browser session per phase: headless rAF stalls once several
// screenshot round-trips pile up in a single session (see 2D REPORT.md).
const part = process.argv[3] || 'all';
if (!['c1', 'c3', 'all'].includes(part)) throw Error('Bad part');
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

const runPhase = async (phase) => {
  const profile = join(tmpdir(), 'elh-room-wall-' + phase + '-' + Date.now());
  let proc; let ws;
  try {
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
    // Force the phase, then rebuild the static layers exactly like goto() does,
    // so the wall photo matches what the real game shows on that visit.
    await ev(`(() => {game.G.state.flags.room_phase=${JSON.stringify(phase)};if(${JSON.stringify(phase)}!=="c1"){game.G.state.chapter="c3";}else{game.G.state.chapter="c1";}game.buildLayers(game.scene);return true;})()`);
    await ev('(() => {game.r.fx.fade=0;game.r.fx.zoom=[1,.5,.5];game.zoomTarget=null;game.player.x=740;game.zoom={z:1,x:740,y:460};game.r.cam.shake=0;game.ui.showHud(false);game.ui.hideDialogue();return true;})()');
    await sleep(900);
    for (const [w, h] of [[640, 360], [1280, 720]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await sleep(600);
      const data = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      const name = `wall_${phase}_${w}x${h}.png`;
      await writeFile(join(DIR, name), Buffer.from(data.data, 'base64'));
      console.log('CAPTURE', label, name);
    }
    // Hover check through the real pointer path (hotspotAt adds cam.x to the
    // logical pointer): the photo centre (scene 735, 304) must raise
    // Fotografía, a bare-wall point (scene 640, 300) must raise nothing.
    const hoverAt = async (px, py) => {
      const pt = await ev(`(() => {const r = document.getElementById('view').getBoundingClientRect();const lx = ${px} - game.r.cam.x;return { x: r.left + r.width * lx / 1280, y: r.top + r.height * ${py} / 720 };})()`).catch(() => null);
      if (!pt) return null;
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(pt.x), y: Math.round(pt.y) });
      await sleep(450);
      return ev(`(() => ({ hover: game.hoverH ? game.hoverH.id : null, label: document.getElementById('hover-label').textContent, hidden: document.getElementById('hover-label').classList.contains('hidden') }))()`).catch(() => null);
    };
    const dbg = await ev('(() => ({phase: game.G.state.flags.room_phase, builtPhoto: game.scene.built && game.scene.built.photo, cacheKeys: [...game.layerCache.keys()].filter((k) => String(k).startsWith("room@")), photoHotspot: game.scene.hotspots.find(h=>h.id==="photo").rect}))()').catch(() => null);
    console.log('STATE', phase, JSON.stringify(dbg));
    console.log('HOVER photo-centre', JSON.stringify(await hoverAt(735, 304)));
    console.log('HOVER bare-wall', JSON.stringify(await hoverAt(640, 300)));
    return [`wall_${phase}_640x360.png`, `wall_${phase}_1280x720.png`];
  } finally {
    try { ws?.close(); } catch { /* noop */ }
    try { proc?.kill(); } catch { /* noop */ }
    await sleep(650);
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }).catch(() => {});
  }
};

const log = [];
try {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const phases = part === 'all' ? ['c1', 'c3b'] : [part === 'c3' ? 'c3b' : 'c1'];
  for (const p of phases) log.push(...await runPhase(p));
  await writeFile(join(DIR, 'capture_log.json'), JSON.stringify({ scene: 'room', label, method: 'actual canvas/render in Chrome; QA scene deep-link, no story entrance; c3 forced via room_phase flag + buildLayers rebuild (same as goto); rain varies', androidTested: false, shots: log }, null, 2));
} finally {
  server.close();
}
