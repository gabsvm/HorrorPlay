// Checks that need a real browser (the stub DOM of walk.mjs cannot run them), in headless Chrome over CDP:
//   - the knocks puzzle (HOSPES): Android Back, Escape and «Dejarlo» leave it; a solved word survives Back
//     pressed in the pause before it closes (UX audit b69323b, UX-B01)
//   - the WebGL context lost and restored: nothing throws, nothing is drawn while it is gone, drawing resumes
//   - no WebGL at all: a plain message instead of a black screen
//   - paused behind the menu, the scene is drawn at about 12 frames a second
//   - the post-QA fixes (QA-V5-001/002/003/004/006/011/016): a document is never under the last dialogue line, the fonts
//     are the game's own with the network to Google blocked, reduced motion starts at zoom 1, the scene is playable with
//     the keyboard alone, the prefilled signature is selected, the «Repasar» button stays in view, and at 640x360 no text
//     is under 11 CSS px, with real key and mouse events
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
async function browser(flags = [], { w = 1280, h = 720, reduce = false, block = [] } = {}) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const proc = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'elh-bc-' + Date.now() + Math.random())}`,
    `--window-size=${w},${h}`, '--no-first-run', '--autoplay-policy=no-user-gesture-required', ...flags, 'about:blank'], { stdio: 'ignore' });
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
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  if (reduce) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const requests = [];
  await send('Network.enable');
  if (block.length) await send('Network.setBlockedURLs', { urls: block });
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.method === 'Network.requestWillBeSent') requests.push(m.params.request.url); });
  const open = async (q) => { await send('Page.navigate', { url: `${base}/index.html?${q}` }); for (let i = 0; i < 80; i++) { await sleep(150); if (await ev('!!(window.game && game.scene) || !!document.getElementById("fatal")').catch(() => false)) break; } await sleep(600); };
  // real input, as a person gives it: a key goes through the keyboard path, a click through the mouse
  const key = async (k, o = {}) => { const code = { ArrowRight: 'ArrowRight', ArrowLeft: 'ArrowLeft', Tab: 'Tab', Enter: 'Enter', Escape: 'Escape', ' ': 'Space' }[k] || undefined; const vk = { ArrowRight: 39, ArrowLeft: 37, Tab: 9, Enter: 13, Escape: 27, ' ': 32 }[k]; const mods = (o.shift ? 8 : 0); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, modifiers: mods, text: k.length === 1 ? k : (k === 'Enter' ? String.fromCharCode(13) : undefined) }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, modifiers: mods }); await sleep(60); };
  const typeText = async (t) => { for (const ch of t) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); } };
  const click = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await sleep(50); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 }); await sleep(80); };
  return { ev, open, errors, requests, key, typeText, click, send, close: () => { ws.close(); proc.kill(); } };
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

    // ---- QA-V5-001: a document or a card is never under the last line of dialogue; the close button answers the click
    await b.open('scene=bucks_row&noenter&x=1000');
    await b.ev(`(() => { window.__doc = 'open'; game.running++; (async () => { await game.ui.say('Pike', 'Nadie ha tocado nada desde que la ronda pasó.', { auto: 60 }); await game.ui.doc('<h3>HOJA DE RONDAS</h3><p>Portón fuera de vista de 3:30 a 3:40.</p>'); window.__doc = 'closed'; await game.ui.say('Pike', '¿Qué opina, Ashgrove?', { auto: 60 }); window.__after = true; game.running--; })(); return true; })()`);
    for (let i = 0; i < 30 && !(await b.ev(`!document.getElementById('document').classList.contains('hidden')`)); i++) await sleep(150);
    const under = await b.ev(`(() => { const btn = document.getElementById('doc-close'), r = btn.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { dlg: document.getElementById('dialogue').classList.contains('hidden'), self: hit === btn || btn.contains(hit), open: !document.getElementById('document').classList.contains('hidden'), focus: document.activeElement === btn }; })()`);
    need(under.open && under.dlg && under.self && under.focus, `documento: la línea de diálogo anterior se oculta, «Dejar» recibe el clic y el foco (${JSON.stringify(under)})`);
    { const r = await b.ev(`(() => { const r = document.getElementById('doc-close').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`); await b.click(r.x, r.y); }
    await sleep(500);
    need((await b.ev('window.__doc')) === 'closed' && !(await b.ev(`!document.getElementById('document').classList.contains('hidden')`)), 'documento: un clic real en «Dejar» lo cierra');
    await sleep(700);
    need(await b.ev(`!document.getElementById('dialogue').classList.contains('hidden') && document.getElementById('dlg-text').textContent.length > 0`), 'documento: tras cerrarlo, la conversación continúa con su línea');
    await b.ev('game.ui.advance && game.ui.advance()'); await sleep(300);
    await b.ev(`(async () => { await game.ui.say('Wren', 'Dígame su nombre, señor.', { auto: 60 }); void game.ui.card('FIN', 'Gracias', '', 1500); return true; })()`);
    await sleep(900);
    need(await b.ev(`document.getElementById('dialogue').classList.contains('hidden') && !document.getElementById('card').classList.contains('hidden')`), 'tarjeta: la última línea de diálogo no queda sobre la tarjeta');
    await sleep(3200);

    // ---- QA-V5-004: the scene with the keyboard alone (real key events); nothing acts by itself
    await b.open('scene=bucks_row&noenter&x=1000');
    await sleep(1200);
    const kb = () => b.ev(`(() => { const a = document.activeElement; const lab = document.getElementById('hover-label'); return { id: a && a.closest && a.closest('#kb-spots') ? a.dataset.id : null, label: lab && !lab.classList.contains('hidden') ? lab.textContent : '', ring: !document.getElementById('kb-ring').classList.contains('hidden'), n: document.querySelectorAll('#kb-spots button').length, reveal: game.revealT || 0, running: game.running }; })()`);
    const k0 = await kb();
    need(k0.n >= 4 && k0.id === null && k0.running === 0, `teclado: la escena ofrece sus puntos (${k0.n}) y nada actúa por sí solo`);
    await b.key('ArrowRight'); await sleep(200);
    const k1 = await kb();
    need(!!k1.id && /\S/.test(k1.label), `teclado: la flecha enfoca un punto y lo nombra en el escenario («${k1.label}»)`);
    await b.key('ArrowRight'); await sleep(150);
    const k2 = await kb();
    need(k2.id && k2.id !== k1.id, 'teclado: la flecha siguiente pasa al siguiente punto');
    await b.key('ArrowLeft'); await sleep(150);
    need((await kb()).id === k1.id, 'teclado: la flecha contraria vuelve al anterior');
    await b.key(' '); await sleep(150);
    need((await kb()).reveal === 0, 'teclado: Espacio sobre un punto no revela ni dispara otra cosa');
    // a person chosen by name and acted on with Enter: the same walk and the same script as a click
    const idx = await b.ev(`[...document.querySelectorAll('#kb-spots button')].findIndex((x) => /Pike/.test(x.textContent))`);
    need(idx >= 0, 'teclado: la lista incluye a los personajes con los que se puede hablar');
    await b.ev(`document.querySelectorAll('#kb-spots button')[${idx}].focus()`); await sleep(150);
    await b.key('Enter'); await sleep(900);
    const act = await kb();
    need(act.running > 0, 'teclado: Intro actúa sobre el punto enfocado (el guion arranca)');
    need(await b.ev(`document.getElementById('kb-spots').classList.contains('hidden')`), 'teclado: mientras el guion corre, la lista no está disponible');
    for (let i = 0; i < 60 && (await b.ev('game.running')) > 0; i++) { if (await b.ev('!!game.ui._choiceKeys')) await b.key('1'); else await b.key('Enter'); await sleep(350); }
    await sleep(700);
    const back2 = await kb();
    need(back2.running === 0 && back2.id !== null, 'teclado: al acabar el guion, el foco vuelve a la lista');
    await b.key('n'); await sleep(400);
    need(await b.ev(`!document.getElementById('notebook').classList.contains('hidden') && document.getElementById('kb-spots').classList.contains('hidden')`), 'teclado: con el cuaderno abierto no hay puntos de la escena');
    await b.key('Escape'); await sleep(400);
    // a thing that appears with the story shows up in the list (a conditional hotspot)
    await b.open('scene=room&noenter&x=500');
    await sleep(1200);
    const before = await b.ev(`[...document.querySelectorAll('#kb-spots button')].map((x) => x.textContent)`);
    await b.ev(`game.state.flags.room_phase = 'c3b'; true`); await sleep(500);
    const after2 = await b.ev(`[...document.querySelectorAll('#kb-spots button')].map((x) => x.textContent)`);
    need(after2.some((t) => /Periódico/.test(t)) && !before.some((t) => /Periódico/.test(t)), 'teclado: un punto condicionado aparece en la lista cuando se cumple su condición');

    // ---- QA-V5-006: the prefilled signature is selected; what is typed, pasted or deleted replaces it
    await b.open('scene=room&noenter&x=500');
    const sign = `(() => { window.__sig = undefined; game.running++; game.ui.nameEntry('¿Cómo se llama usted?', null, 'Thomas Ashgrove').then((v) => { window.__sig = v; game.running--; }); return true; })()`;
    await b.ev(sign);
    await sleep(600);
    const sel = await b.ev(`(() => { const i = document.getElementById('name-input'); return { f: document.activeElement === i, a: i.selectionStart, z: i.selectionEnd, n: i.value.length }; })()`);
    need(sel.f && sel.a === 0 && sel.z === sel.n && sel.n > 0, `firma: el nombre prellenado queda seleccionado al enfocar (${JSON.stringify(sel)})`);
    // a press on the field before writing anything selects it again, not a caret in the middle
    { const r = await b.ev(`(() => { const r = document.getElementById('name-input').getBoundingClientRect(); return { x: r.left + r.width * 0.8, y: r.top + r.height / 2 }; })()`); await b.click(r.x, r.y); }
    need(await b.ev(`(() => { const i = document.getElementById('name-input'); return i.selectionStart === 0 && i.selectionEnd === i.value.length; })()`), 'firma: un clic en el campo antes de escribir lo vuelve a seleccionar entero');
    await b.typeText('Jack Smith'); await sleep(200);
    need((await b.ev(`document.getElementById('name-input').value`)) === 'Jack Smith', 'firma: lo que se teclea sustituye al nombre (sin «Thomas ThomasAshgrove»)');
    await b.key('Enter'); await sleep(1200);
    need((await b.ev('window.__sig')) === 'Jack Smith', 'firma: Intro firma con lo escrito');
    await b.ev(sign);
    await sleep(600);
    await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await sleep(200);
    need((await b.ev(`document.getElementById('name-input').value`)) === '', 'firma: una tecla de borrar vacía el nombre prellenado');
    await b.ev(`document.getElementById('name-ok').click()`); await sleep(1200);

    // ---- QA-V5-011: «Repasar la cadena» stays in view and is what a click lands on
    await b.open('scene=foreshore&noenter&x=520');
    const cv = await b.ev(`(() => { const s = game.state; for (const c of ['dedos', 'carta', 'eco']) if (!s.clues.includes(c)) s.clues.push(c); s.flags.fs_1888 = true; s.flags.awake = true; s.flags.v5_name_chain = 'reasoned'; game.ui.openNotebook(game); game.ui.notebookTab('name'); game.ui.renderNotebook(); const btn = document.getElementById('chain-go'); const r = btn.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: btn.textContent, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, hit: hit === btn }; })()`);
    need(cv.text === 'Repasar la cadena' && cv.top >= 0 && cv.bottom <= cv.vh && cv.hit, `cadena: «Repasar la cadena» se ve sin desplazarse y recibe el clic (${JSON.stringify(cv)})`);
    await b.ev('game.ui.closeNotebook(); true');

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

  // ---- QA-V5-003: the typefaces are the game's own: with the Google font hosts blocked, the four faces load from the
  // game and no request leaves for another host
  const f = await browser([], { block: ['*://fonts.googleapis.com/*', '*://fonts.gstatic.com/*'] });
  try {
    await f.open('');
    await f.ev(`Promise.all(['italic 20px "IM Fell English"', '20px "IM Fell English"', '20px "IM Fell English SC"', '20px "Special Elite"'].map((x) => document.fonts.load(x, 'Ñá')))`);
    const faces = await f.ev(`[...document.fonts].map((x) => x.family.replace(/"/g, '') + ' ' + x.style + ' ' + x.status)`);
    need(faces.length === 4 && faces.every((x) => /loaded$/.test(x)), `fuentes: las cuatro caras son propias y cargan con Google bloqueado (${faces.join(', ')})`);
    const w = await f.ev(`(() => { const c = document.createElement('canvas').getContext('2d'); const m = (fam) => { c.font = '40px ' + fam; return c.measureText('Whitechapel, 1888 — El Huésped').width; }; return { fell: m('"IM Fell English", monospace'), mono: m('monospace'), elite: m('"Special Elite", serif'), serif: m('serif') }; })()`);
    need(Math.abs(w.fell - w.mono) > 5 && Math.abs(w.elite - w.serif) > 5, 'fuentes: el texto se mide con las tipografías del juego, no con las de reserva');
    const hosts = [...new Set(f.requests.map((u) => new URL(u).host))].filter((h) => !/^127\.0\.0\.1(:\d+)?$/.test(h));
    need(!hosts.length, `fuentes: ninguna petición sale a otro servidor${hosts.length ? ' (' + hosts.join(', ') + ')' : ''}`);
    need(!/fonts\.(googleapis|gstatic)/.test(await f.ev('document.documentElement.outerHTML')), 'fuentes: la página no enlaza con Google Fonts');
  } finally { f.close(); }

  // ---- QA-V5-002: with reduced motion a scene starts at zoom 1 (and without it, settling in from 1.07)
  const rm = await browser([], { reduce: true });
  try {
    await rm.open('scene=bucks_row&noenter&x=1000');
    const z = await rm.ev('({ z: game.zoom.z, fx: game.r.fx.zoom[0], pref: matchMedia("(prefers-reduced-motion: reduce)").matches })');
    need(z.pref && z.z === 1 && z.fx === 1, `movimiento reducido: la escena empieza con zoom 1 exacto (${JSON.stringify(z)})`);
    await rm.ev(`(async () => { await game.goto('room', { fade: false, noEnter: true }); return true; })()`); await sleep(400);
    await rm.ev(`(async () => { await game.goto('bucks_row', { fade: false, noEnter: true }); return true; })()`); await sleep(300);
    const z2 = await rm.ev('({ z: game.zoom.z, fx: game.r.fx.zoom[0] })');
    need(z2.z === 1 && z2.fx === 1, 'movimiento reducido: al cambiar de escena tampoco hay zoom de entrada');
  } finally { rm.close(); }
  const nm = await browser();
  try {
    await nm.open('scene=bucks_row&noenter&x=1000');
    const z = await nm.ev('({ z: game.zoom.z, pref: matchMedia("(prefers-reduced-motion: reduce)").matches })');
    need(!z.pref && z.z > 1.0 && z.z <= 1.07, `sin movimiento reducido: la entrada sigue asentándose desde 1,07 (${z.z.toFixed(3)})`);
  } finally { nm.close(); }

  // ---- QA-V5-016: at 640x360 and 800x360 nothing is under 11 CSS px and nothing runs off the window
  for (const [w, h] of [[640, 360], [800, 360]]) {
    const sm = await browser([], { w, h });
    try {
      await sm.open('scene=bucks_row&noenter&x=1000');
      await sm.ev(`game.ui.setObjective("Buscar en Buck's Row lo que la ronda no vio."); true`);
      const MEASURE = `(() => { const vw = innerWidth, vh = innerHeight; const out = { small: [], clipped: [], n: 0 }; const vis = (e) => { for (let p = e; p; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) return false; } const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const seen = new Set(); let n; while ((n = tw.nextNode())) { const t = n.textContent.trim(); const e = n.parentElement; if (!t || !e || e.closest('#kb-spots') || seen.has(e) || /^(SCRIPT|STYLE)$/.test(e.tagName)) continue; seen.add(e); if (!vis(e)) continue; out.n++; const r = e.getBoundingClientRect(), fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10.95) out.small.push(e.id || e.className || e.tagName); if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) out.clipped.push((e.id || e.className || e.tagName) + ':' + t.slice(0, 20)); } return out; })()`;
      const states = [['HUD', ''],
        ['diálogo', `void game.G.say('Pike', 'Nadie ha tocado nada desde que la ronda pasó. Dígame qué ve, Ashgrove.'); true`],
        ['opciones', `game.ui.advance(); void game.ui.choice(['El portón estaba abierto.', 'No vi a nadie.', 'Prefiero no responder.'], { prompt: '¿Qué le dice?' }); true`],
        ['cuaderno', `game.ui._choiceKeys && game.ui._choiceKeys[0].click(); game.ui.hideDialogue(); game.ui.openNotebook(game); true`],
        ['documento', `game.ui.closeNotebook(); void game.ui.doc('<h3>HOJA DE RONDAS</h3><p>Portón fuera de vista de 3:30 a 3:40.</p><p class="small">Copia del libro de la comisaría.</p>'); true`]];
      for (const [name, setup] of states) {
        if (setup) { await sm.ev(setup); await sleep(1200); }
        const m = await sm.ev(MEASURE);
        need(m.n > 0 && !m.small.length && !m.clipped.length, `${w}x${h} ${name}: ningún texto bajo 11 px ni fuera de la ventana (${m.n} textos${m.small.length ? '; pequeños: ' + m.small.join(', ') : ''}${m.clipped.length ? '; fuera: ' + m.clipped.join(', ') : ''})`);
      }
    } finally { sm.close(); }
  }

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
