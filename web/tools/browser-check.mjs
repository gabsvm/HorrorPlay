// Checks that need a real browser (the stub DOM of walk.mjs cannot run them), in headless Chrome over CDP:
//   - the knocks puzzle (HOSPES): Android Back, Escape and «Dejarlo» leave it; a solved word survives Back
//     pressed in the pause before it closes (UX audit b69323b, UX-B01)
//   - the WebGL context lost and restored: nothing throws, nothing is drawn while it is gone, drawing resumes
//   - no WebGL at all: a plain message instead of a black screen
//   - paused behind the menu, the scene is drawn at about 12 frames a second
//   node web/tools/browser-check.mjs        (CHROME=<path> to choose the browser; skipped if none is found)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('..', import.meta.url));
const chromePath = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p));
if (!chromePath) { console.log('SKIP: no Chrome found (set CHROME=<path>)'); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.glb': 'model/gltf-binary' };
const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
    if (!p) p = 'index.html';
    const file = join(web, p);
    if (!file.startsWith(web) || !(await stat(file)).isFile()) throw new Error('404');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// one headless Chrome per run; `flags` lets a run take WebGL away
async function browser(flags = []) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'elh-bc-' + Date.now() + Math.random())}`,
    '--window-size=1280,720', '--no-first-run', '--autoplay-policy=no-user-gesture-required', ...flags, 'about:blank'], { stdio: 'ignore' });
  let target;
  for (let i = 0; i < 80 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(150); } }
  if (!target) { proc.kill(); throw new Error('Chrome no responde'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(); const errors = [];
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(String(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (x) => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(`${x.slice(0, 60)}: ${r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text}`); return r.result?.result?.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  const open = async (q) => { await send('Page.navigate', { url: `${base}/index.html?${q}` }); for (let i = 0; i < 80; i++) { await sleep(150); if (await ev('!!(window.game && game.scene) || !!document.getElementById("fatal")').catch(() => false)) break; } await sleep(600); };
  return { ev, open, errors, close: () => { ws.close(); proc.kill(); } };
}

const fails = [];
const need = (cond, msg) => { if (!cond) fails.push(msg); console.log(`${cond ? 'ok  ' : 'FALLO'} ${msg}`); };

try {
  const b = await browser();
  try {
    // ---- the knocks puzzle
    await b.open('scene=seance&noenter&x=600');
    const K = `{ raps: [[1,1],[1,2]], answer: 'AB', board: true, rows: ['ABCDE','FGHIK','LMNOP','QRSTU','VWXYZ'] }`;
    const knocks = () => b.ev(`(() => { window.__kr = undefined; game.running++; game.ui.knockPuzzle(${K}).then((r) => { window.__kr = r; game.running--; }); return true; })()`);
    const st = () => b.ev(`({ ok: window.__kr && window.__kr.ok, done: window.__kr !== undefined, overlay: !!document.getElementById('knocks'), armed: !!game.ui._knockClose, paused: !!game.paused })`);
    const press = (ch) => b.ev(`[...document.querySelectorAll('#knocks .grid button')].find((x) => x.dataset.ch === '${ch}').click()`);
    for (const [how, act] of [['Atrás', 'window.__appBack()'], ['Escape', `window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`], ['«Dejarlo»', `document.querySelector('#knocks .leave').click()`]]) {
      await knocks(); await sleep(250);
      const open = await st();
      await b.ev(act); await sleep(250);
      const s = await st();
      need(open.overlay && open.armed && s.done && s.ok === false && !s.overlay && !s.armed && !s.paused, `golpes: ${how} lo deja sin resolver, sin panel y sin pausar`);
    }
    await knocks(); await sleep(250);
    await press('A'); await press('B'); await sleep(1300);
    let s = await st();
    need(s.ok === true && !s.overlay, 'golpes: la palabra correcta lo resuelve');
    await knocks(); await sleep(250);
    await press('A'); await press('B'); await sleep(100);
    await b.ev('window.__appBack()'); await b.ev(`document.querySelector('#knocks .leave')?.click()`); await sleep(1300);
    s = await st();
    need(s.ok === true && !s.overlay, 'golpes: Atrás justo después de acertar no pierde el acierto');

    // ---- V5: the notebook's «Nombre» page, with the real button (chain.js): disabled before the file, then it closes the
    // notebook, shows the papers and the first question; Android Back leaves it without cost; it can be started again
    await b.open('scene=foreshore&noenter&x=520');
    await b.ev(`(() => { const s = game.state; s.clues.push('dedos', 'carta', 'eco'); s.flags.fs_1888 = true; game.ui.openNotebook(game); game.ui.notebookTab('name'); game.ui.renderNotebook(); return true; })()`);
    const tabShown = await b.ev(`!document.getElementById('nb-tab-name').classList.contains('hidden')`);
    const dis = await b.ev(`document.getElementById('chain-go').disabled`);
    need(tabShown && dis === true, 'cadena: la pestaña «Nombre» se lee con la calle oída, pero no se ordena antes del expediente');
    await b.ev(`(() => { game.state.flags.awake = true; game.ui.renderNotebook(); return true; })()`);
    need((await b.ev(`document.getElementById('chain-go').disabled`)) === false, 'cadena: despierto, el botón se activa');
    const sanityBefore = await b.ev('game.state.sanity');
    await b.ev(`document.getElementById('chain-go').click()`); await sleep(700);
    const after = await b.ev(`({ nb: !document.getElementById('notebook').classList.contains('hidden'), doc: !document.getElementById('document').classList.contains('hidden'), running: game.running })`);
    need(!after.nb && after.doc && after.running > 0, 'cadena: el botón cierra el cuaderno y muestra los papeles en el escenario');
    await b.ev(`document.getElementById('doc-close').click()`); await sleep(900);
    // the lines before the question are advanced as a player would, until the choices are on screen
    const toChoices = async () => { for (let i = 0; i < 10; i++) { if (await b.ev('!!game.ui._choiceKeys')) return; await b.ev('game.ui.advance && game.ui.advance()'); await sleep(450); } };
    const toIdle = async () => { for (let i = 0; i < 10 && (await b.ev('game.running')) > 0; i++) { await b.ev('game.ui.advance && game.ui.advance()'); await sleep(450); } };
    await toChoices();
    const nOpts = await b.ev(`document.querySelectorAll('#choices button').length`);
    need(nOpts === 5, `cadena: la primera pregunta ofrece 5 opciones (hay ${nOpts})`);
    await b.ev('window.__appBack()'); await sleep(600); await toIdle();
    const left = await b.ev(`({ running: game.running, flag: game.state.flags.v5_name_chain || null, sanity: game.state.sanity, pending: !!game.pendingChain })`);
    need(left.running === 0 && !left.flag && left.sanity === sanityBefore && !left.pending, 'cadena: Atrás la deja sin resolver, sin coste y sin quedar a medias');
    await b.ev(`game.ui.openNotebook(game); game.ui.notebookTab('name'); document.getElementById('chain-go').click()`); await sleep(700);
    need(await b.ev(`!document.getElementById('document').classList.contains('hidden')`), 'cadena: se puede volver a empezar');
    await b.ev(`document.getElementById('doc-close').click()`); await sleep(500);
    await toChoices(); await sleep(600);  await b.ev('window.__appBack()'); await sleep(600); await toIdle();
    { const r = await b.ev('({ running: game.running, flag: game.state.flags.v5_name_chain || null, doc: !document.getElementById("document").classList.contains("hidden"), dlg: document.getElementById("dialogue").className + "|" + document.getElementById("dlg-text").textContent.slice(0,40), choices: document.querySelectorAll("#choices button").length, nb: !document.getElementById("notebook").classList.contains("hidden") })'); need(r.running === 0 && !r.flag, 'cadena: dejarla otra vez deja el juego libre'); }

    // ---- the WebGL context lost and restored
    await b.open('scene=bucks_row&noenter&x=900');
    const drawn = () => b.ev('game.r.presented || 0');
    const n0 = await drawn(); await sleep(500);
    need((await drawn()) > n0 + 10, 'contexto: la escena se dibuja');
    await b.ev(`(window.__lose = game.r.gl.getExtension('WEBGL_lose_context'), window.__lose.loseContext(), true)`); await sleep(400);
    const lost = await b.ev('({ lost: game.r.lost, gl: game.r.gl.isContextLost() })');
    const n1 = await drawn(); await sleep(500);
    need(lost.lost && lost.gl && (await drawn()) === n1, 'contexto perdido: se marca y no se dibuja nada');
    await b.ev('(window.__lose.restoreContext(), true)'); await sleep(800);
    const back = await b.ev('({ lost: game.r.lost, gl: game.r.gl.isContextLost() })');
    const n2 = await drawn(); await sleep(500);
    need(!back.lost && !back.gl && (await drawn()) > n2 + 10, 'contexto recuperado: se vuelve a dibujar');
    // the restored picture is the scene, not black: read a frame back right after drawing it
    const lit = await b.ev(`new Promise((res) => requestAnimationFrame(() => { const gl = game.r.gl; game.r.present(game.scene, game.r.cam.x); const px = new Uint8Array(4 * 64); let sum = 0; for (let i = 0; i < 8; i++) { gl.readPixels(Math.floor(gl.drawingBufferWidth * (i + 0.5) / 8), Math.floor(gl.drawingBufferHeight / 2), 8, 2, gl.RGBA, gl.UNSIGNED_BYTE, px); for (let k = 0; k < px.length; k += 4) sum += px[k] + px[k + 1] + px[k + 2]; } res(sum); }))`);
    need(lit > 0, `contexto recuperado: la imagen no es negra (suma ${lit})`);

    // ---- paused: about 12 frames a second
    await b.ev('game.onPause()'); await sleep(300);
    const p0 = await drawn(); await sleep(2000);
    const pausedFps = ((await drawn()) - p0) / 2;
    await b.ev('game.onPause()'); await sleep(300);
    const r0 = await drawn(); await sleep(1000);
    const runFps = (await drawn()) - r0;
    need(pausedFps > 5 && pausedFps < 16 && runFps > 30, `en pausa ${pausedFps.toFixed(1)} fps, jugando ${runFps} fps`);
    need(!b.errors.length, `sin errores de JS${b.errors.length ? ': ' + b.errors.slice(0, 3).join(' | ') : ''}`);
  } finally { b.close(); }

  // ---- no WebGL at all: the message, not a black screen
  const n = await browser(['--disable-3d-apis', '--disable-webgl']);
  try {
    await n.open('');
    const f = await n.ev(`(() => { const e = document.getElementById('fatal'); return e ? e.textContent : null; })()`);
    need(!!f && /WebGL/.test(f) && /partidas guardadas no se han tocado/.test(f), 'sin WebGL: se explica en pantalla y no se toca nada');
  } finally { n.close(); }
} catch (err) {
  fails.push(String(err && err.message || err));
  console.log('FALLO', err);
} finally { server.close(); }
console.log(fails.length ? `\n${fails.length} fallo(s)` : '\nnavegador: todo bien');
process.exit(fails.length ? 1 : 0);
