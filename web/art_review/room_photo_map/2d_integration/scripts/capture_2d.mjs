// El Huesped 2D task: room photo close-up captures (real engine, 640x360 + 1280x720).
// Captures the lantern inspection in chapter 1 (intact faces) and chapter 3
// (scraped elder face), plus a lantern-AWAY shot proving the zone is tight.
// The chapter-3 state is forced the same way QA does: room_phase flag
// (see web/src/scenes/room.js phase(G)).
//
// Usage (paths are relative to this script, no personal paths):
//   node web/art_review/room_photo_map/2d_integration/scripts/capture_2d.mjs after
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
// One fresh browser session per shot (part): headless rAF stalls once several
// screenshot/metrics round-trips pile up in a single session, so the third
// inspect of a long run never opens. Parts: off | c1 | c3 | all.
const part = process.argv[3] || 'all';
if (!['off', 'c1', 'c3', 'all'].includes(part)) throw Error('Bad part');
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
const profile = join(tmpdir(), 'elh-room-photo-2d-' + Date.now());
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
  // Pin the lantern at (px, py) in 1280x720 paint space AFTER the viewport
  // metrics settle: changing metrics synthesizes pointer events that would
  // otherwise undo the pin before the pixels land.
  const pinAt = async (px, py) => {
    const pt = await ev(`(() => {const r = document.getElementById('inspect').getBoundingClientRect();return { x: r.left + r.width * ${px} / 1280, y: r.top + r.height * ${py} / 720 };})()`).catch(() => null);
    if (pt) await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(pt.x), y: Math.round(pt.y) });
    await sleep(450);
  };
  const closeInspect = async () => {
    await ev(`(() => {document.getElementById('insp-close').click();return true;})()`).catch(() => {});
    await sleep(1200);
    await ev('(() => {game.r.fx.fade=0;game.ui.hideDialogue();return true;})()');
    await sleep(400);
  };
  const openInspect = async (tag) => {
    // A close click can rarely miss after a metrics switch, leaving the modal
    // open; make sure it is closed before knocking again, then retry the open.
    await ev(`(() => {const b=document.getElementById('inspect');if(!b.classList.contains('hidden')){document.getElementById('insp-close').click();}game.r.fx.fade=0;game.ui.hideDialogue();return true;})()`).catch(() => {});
    await sleep(1200);
    for (let attempt = 0; attempt < 3; attempt++) {
      // Never knock twice over a live session: a retry only acts when the
      // modal is hidden and no inspect session is alive.
      const alreadyOpen = await ev(`!document.getElementById('inspect').classList.contains('hidden') || !!game.ui._inspectClose`).catch(() => true);
      if (!alreadyOpen) {
        await ev(`(() => {window.__actErr=null;game.player.x=740;game.zoom={z:1,x:game.player.x,y:460};game.player.lanternOn=true;game.scene.G=game.G;const h=game.scene.hotspots.find(h=>h.id==="photo");if(!h){window.__actErr='no-hotspot';}else{h.act(game.G).catch((e)=>{window.__actErr=String((e&&e.stack)||e);});}return true;})()`);
      }
      let open = false;
      for (let i = 0; i < 30; i++) {
        await sleep(300);
        open = await ev(`!document.getElementById('inspect').classList.contains('hidden')`).catch(() => false);
        if (open) break;
      }
      if (open) break;
      if (attempt === 2) {
        const dbg = await ev(`(async () => ({running: game.running, err: window.__actErr, alive: !!game.ui._inspectClose, scene: game.state.scene, fade: game.r.fx.fade, raf: await new Promise((r) => { let done = false; requestAnimationFrame(() => { done = true; r('live'); }); setTimeout(() => r(done ? 'live' : 'STALLED'), 1500); }) }))()`).catch(() => null);
        console.log('INSPECT SKIP', tag, '(no modal)', JSON.stringify(dbg)); log.push(`inspect_${tag}:SKIP`);
        return false;
      }
      await sleep(1000);
    }
    const title = await ev(`document.getElementById('insp-title').textContent`).catch(() => '');
    console.log('INSPECT OPEN', tag, JSON.stringify(title));
    return true;
  };
  const inspectOnZone = async (tag) => {
    // Same pin as the v2 before-shots (606, 275): between the two heads, so
    // before/after stay comparable. The label is hidden for a clean read.
    if (!(await openInspect(tag))) return;
    await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pinAt(606, 275);
    await ev(`(() => {document.getElementById('insp-label').classList.add('hidden');return true;})()`).catch(() => {});
    await sleep(250);
    await snap(`inspect_${tag}_640x360.png`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pinAt(606, 275);
    await ev(`(() => {document.getElementById('insp-label').classList.add('hidden');return true;})()`).catch(() => {});
    await sleep(250);
    await snap(`inspect_${tag}_1280x720.png`);
    await closeInspect();
  };
  const inspectOffZone = async (tag) => {
    // Lantern parked on the bare table (150, 600), far outside the figures
    // circle: the Examinar label must stay down. The label is NOT hidden here;
    // its absence is the evidence.
    if (!(await openInspect(tag))) return;
    await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pinAt(150, 600);
    const st = await ev(`(() => ({ hidden: document.getElementById('insp-label').classList.contains('hidden'), text: document.getElementById('insp-label').textContent }))()`).catch(() => null);
    console.log('OFFZONE label', JSON.stringify(st));
    log.push(`inspect_${tag}_label:${st && st.hidden ? 'hidden' : 'SHOWN:' + (st ? st.text : '?')}`);
    await snap(`inspect_${tag}_640x360.png`);
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await sleep(600);
    await pinAt(150, 600);
    await snap(`inspect_${tag}_1280x720.png`);
    await closeInspect();
  };
  // Chapter 3 first, on a fresh page: the lantern parked off the zone proves
  // the figures circle is tight (no Examinar label on the bare table).
  if (part === 'off' || part === 'all') {
    await setPhase('c3b');
    await inspectOffZone('photo_c3_off');
  }
  // Chapter 1: wall + lantern inspection (intact faces).
  if (part === 'c1' || part === 'all') {
    await setPhase('c1');
    await frame(740, 'wall_c1');
    await inspectOnZone('photo_c1');
  }
  // Chapter 3: wall scratch overlay + torn inspection (elder face scraped).
  if (part === 'c3' || part === 'all') {
    await setPhase('c3b');
    await frame(740, 'wall_c3');
    await inspectOnZone('photo_c3');
  }
  await writeFile(join(DIR, 'capture_log.json'), JSON.stringify({ scene: 'room', label, method: 'actual canvas/render in Chrome; QA scene deep-link, no story entrance; c3 forced via room_phase flag; rain varies between shots', androidTested: false, shots: log }, null, 2));
} finally {
  try { ws?.close(); } catch { /* noop */ }
  try { proc?.kill(); } catch { /* noop */ }
  server.close();
  await sleep(650);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }).catch(() => {});
}
