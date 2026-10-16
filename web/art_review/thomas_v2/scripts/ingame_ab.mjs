// Reproducible, non-invasive A/B of the actual Buck's Row scene.
// Uses the game's unchanged model.js / actor.js / renderer.js and redirects
// ONLY Thomas's atlas in the QA tab through window.__MODELS. No save changes,
// no production asset edits, no browser-wide process termination.
//
// Run from any folder: node web/art_review/thomas_v2/scripts/ingame_ab.mjs
// Optional: CHROME=<absolute path to Chrome or Edge>
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, stat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../..');
const BENCH = resolve(HERE, '..');
const OUT = join(BENCH, 'comparison', 'ab_bucks_row');
const CAND = 'art_review/thomas_v2/exports/game_candidate_v21';
const chrome = [
  process.env.CHROME,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(p => p && existsSync(p));
if (!chrome) throw new Error('No se encuentra Edge/Chrome; define CHROME');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2',
  '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};
const server = createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(WEB, '.' + name);
    const rel = relative(WEB, file);
    if (rel.startsWith('..') || rel.startsWith('/') || rel.startsWith('\\') || rel.includes(':')) throw new Error('outside');
    if (!(await stat(file)).isFile()) throw new Error('not file');
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = await mkdtemp(join(tmpdir(), 'elhuesped-ab-'));
let proc, ws;
await mkdir(OUT, { recursive: true });

try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html?scene=bucks_row&noenter&x=1470`;
  const port = 43000 + Math.floor(Math.random() * 8000);
  proc = spawn(chrome, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--window-size=1280,720', '--autoplay-policy=no-user-gesture-required', 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  let target;
  for (let i = 0; i < 100 && !target; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
      if (r.ok) target = await r.json();
    } catch {}
    if (!target) await sleep(180);
  }
  if (!target) throw new Error('El navegador aislado no abrió DevTools');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { ws.addEventListener('open', done, { once: true }); ws.addEventListener('error', fail, { once: true }); });
  let seq = 0;
  const pending = new Map(), errors = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown')
      errors.push(String(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)); }, 30000);
    pending.set(id, r => { clearTimeout(timer); r.error ? reject(new Error(r.error.message)) : resolve(r.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async expression => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const meta = JSON.parse(await readFile(resolve(WEB, CAND, 'model.json'), 'utf8'));
  const runs = [];
  for (const candidate of [false, true]) {
    const variant = candidate ? 'v21' : 'production';
    let injectionId;
    if (candidate) {
      const source = `window.__MODELS = { thomas: {
        meta: ${JSON.stringify(meta)},
        albedo: ${JSON.stringify('/' + CAND + '/albedo.png')},
        normal: ${JSON.stringify('/' + CAND + '/normal.png')}
      } };`;
      const injected = await send('Page.addScriptToEvaluateOnNewDocument', { source });
      injectionId = injected.identifier;
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    let loaded = false;
    for (let i = 0; i < 140; i++) {
      await sleep(200);
      const ready = await ev('!!(window.game && game.scene?.id === "bucks_row" && game.player.model?.ready && game.r.presented > 2)').catch(() => false);
      if (ready) { loaded = true; break; }
    }
    if (!loaded) throw new Error(variant + ': Buck\'s Row o modelo no cargó');
    // Hide only QA overlays/cursor; real canvas, lighting, background and actor stay untouched.
    await ev(`(() => {
      game.r.fx.fade = 0;
      game.zoomTarget = null;
      game.zoom = { z: 1, x: 1470, y: 470 };
      game.r.fx.zoom = [1, 0.5, 0.5];
      game.r.cam.shake = 0;
      game.ui.showHud(false);
      document.getElementById('cursor').style.display = 'none';
      return true;
    })()`);
    await sleep(1000);
    for (const [width, height] of [[640, 360], [1280, 720]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await sleep(650);
      const state = await ev(`(() => ({
        scene: game.scene.id, player: { x: game.player.x, y: game.player.y, h: game.player.h },
        modelReady: game.player.model.ready, source: window.__MODELS?.thomas ? 'candidate' : 'production',
        camX: game.r.cam.x, canvas: [game.view.width, game.view.height],
        count: game.r.presented
      }))()`);
      if (state.source !== (candidate ? 'candidate' : 'production')) throw new Error(variant + ': source mismatch');
      if (!state.modelReady || state.scene !== 'bucks_row') throw new Error(variant + ': scene no longer ready');
      const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
      const name = `bucks_row_${width}x${height}_${variant}.png`;
      await writeFile(join(OUT, name), Buffer.from(shot.data, 'base64'));
      runs.push({ name, variant, width, height, state });
      console.log('CAPTURE', name, JSON.stringify(state));
    }
    await send('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
    // Additional samples of Actor's real animation path. These are controlled
    // QA states, not story/dialogue playthroughs. Both variants use the same API.
    for (const [action, setup, delay] of [
      ['walk', 'game.player.pose=null; game.player.talking=false; game.player.walkTo(1690,{speed:85}); true', 650],
      ['talk', 'game.player.stop(); game.player.x=1470; game.player.pose=null; game.player.talking=true; true', 750],
      ['recoil', 'game.player.stop(); game.player.x=1470; game.player.talking=false; game.player.pose="recoil"; true', 500],
    ]) {
      await ev(setup);
      await sleep(delay);
      const status = await ev('({scene:game.scene?.id,playerX:game.player.x,camX:game.r.cam.x,frame:game.player.modelFrame(game.r.time)?.name,moving:game.player.moving,talking:game.player.talking,pose:game.player.pose})');
      if (status.scene !== 'bucks_row' || status.frame == null) throw new Error(action + ': no model frame');
      if (action === 'walk' && status.frame !== 'walk' && status.frame !== 'walk3' && status.frame !== 'walkh' && status.frame !== 'walkq') throw new Error('walk animation not selected: ' + status.frame);
      if (action === 'talk' && status.frame !== 'talk') throw new Error('talk animation not selected: ' + status.frame);
      if (action === 'recoil' && status.frame !== 'recoil') throw new Error('recoil animation not selected: ' + status.frame);
      const shot = await send('Page.captureScreenshot', { format:'png', fromSurface:true, captureBeyondViewport:false });
      const name = `bucks_row_${action}_640x360_${variant}.png`;
      await writeFile(join(OUT, name), Buffer.from(shot.data, 'base64'));
      runs.push({name, variant, width:640, height:360, action, state:status});
      console.log('ACTION', name, JSON.stringify(status));
    }
    if (injectionId) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injectionId });
  }
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  await writeFile(join(OUT, 'capture_log.json'), JSON.stringify({
    title: 'Thomas A/B in real Buck\'s Row scene, browser QA (not a full playthrough)',
    source: 'Unmodified engine; V2.1 supplied via pre-navigation __MODELS',
    productionUntouched: true, androidTested: false, captures: runs,
  }, null, 2));
  console.log('PASS: A/B captures saved in', OUT);
} finally {
  try { ws?.close(); } catch {}
  try { proc?.kill(); } catch {}
  server.close();
  await sleep(1000);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 }).catch(() => {});
}
