// Pacing bench (V4-10): a new game in headless Chrome, played as a normal first run: the intro is not skipped,
// and the player reads with a model of a reader (the constants are in oneRun). A line takes 700 ms plus 40 ms per
// character after it is typed; a document 2000 ms plus 25 ms per character (about 40 characters a second: an
// optimistic reader); the signature 1.5 s; a choice 1.2 s, and its first option. Each wait starts after a poll of
// 150 ms and the CDP calls, so the real timings run 0.15 to 0.4 s longer than the model. It records when the player
// first has control of Thomas, and the stages on the way. The reader is a model, not a measurement of a person:
// playtests (F17) are the measurement. Nothing is sent anywhere.
//   node web/tools/pacing-bench.mjs [runs=1]        (needs Google Chrome; CHROME=path overrides the default)
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { rmSync } from 'node:fs';
import { join } from 'node:path';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 5317, DEBUG = 9360;
const root = fileURLToPath(new URL('..', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const runs = Math.max(1, Number(process.argv[2]) || 1);

// one server for every run; it serves the game files the page loads. It is killed on any exit.
const server = spawn('python', ['tools/serve.py', String(PORT)], { cwd: root, stdio: 'ignore' });
process.on('exit', () => server.kill());
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await sleep(200); } }

async function oneRun(n) {
  const profile = join(tmpdir(), `elh-bench-${Date.now()}-${n}`);
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profile}`, '--window-size=1280,720', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  chrome.on('error', (e) => console.error(`Chrome: ${e.message}`));
  let ws = null;
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${DEBUG}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(200); } }
    if (!target) throw new Error(`Chrome no abrió la depuración en el puerto ${DEBUG}`);
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const pend = new Map();
    ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
    const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

    await send('Runtime.enable'); await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://localhost:${PORT}/?metrics` });
    for (let i = 0; i < 100; i++) { if (await ev(`!!window.game && [...document.querySelectorAll('.menu-btn')].some(b => b.textContent === 'Nueva partida')`)) break; await sleep(200); }
    // the title menu's own button, through its click handler
    await ev(`window.__t0 = performance.now(); [...document.querySelectorAll('.menu-btn')].find(b => b.textContent === 'Nueva partida').click(), true`);
    // control: the script is idle, no menu, no intro card on screen, and Thomas is in a scene
    const control = `(() => {
      const intro = document.getElementById('intro');
      const onScreen = intro && !intro.classList.contains('hidden');
      return !!window.game && !game.running && !game.inMenu && !!game.state.scene && !onScreen;
    })()`;
    // the reader: a line or a document waits for a click, a choice for a pick, the signature for its OK
    const WAITING = `(() => {
      const ui = game.ui;
      if (!document.getElementById('name-entry').classList.contains('hidden')) return { kind: 'name', read: 1500 };   // the signature: the prefilled name is kept
      if (document.querySelector('#choices button')) return { kind: 'choice', read: 1200 };
      if (ui._advance && ui.el.dlgNext.style.visibility === 'visible') return { kind: 'line', read: 700 + 40 * ui.el.dlgText.textContent.length };
      if (ui._docClose && !ui.el.doc.classList.contains('hidden')) return { kind: 'doc', read: 2000 + 25 * ui.el.docBody.textContent.length };
      return null;
    })()`;
    const ACT = {
      line: `game.ui.advance()`,
      choice: `document.querySelector('#choices button').click()`,
      doc: `document.getElementById('doc-close').click()`,
      name: `document.getElementById('name-ok').click()`,
    };
    const reads = { line: 0, choice: 0, doc: 0, name: 0 };
    let controlMs = null, objectiveMs = null, objective = null, pending = null;
    const at = {};   // milestones: when each stage first shows (ms from the click)
    const t0 = Date.now();
    while (Date.now() - t0 < 900000) {
      const now = await ev('Math.round(performance.now() - window.__t0)');
      const seen = await ev(`({ intro: document.getElementById('intro').classList.contains('hidden') === false, name: !document.getElementById('name-entry').classList.contains('hidden'), card: !document.getElementById('card').classList.contains('hidden'), introDone: document.getElementById('intro').classList.contains('hidden') })`);
      if (seen.intro && at.intro == null) at.intro = now;
      if (seen.introDone && at.intro != null && at.introDone == null) at.introDone = now;
      if (seen.name && at.name == null) at.name = now;
      if (seen.card && at.card == null) at.card = now;
      if (controlMs == null && await ev(control)) controlMs = now;
      if (objectiveMs == null) {
        const o = await ev('(window.game && game.state.objective) || ""');
        if (o) { objectiveMs = now; objective = o; }
      }
      if (controlMs != null && objectiveMs != null) break;
      const waiting = await ev(WAITING);
      if (!waiting) pending = null;
      else if (!pending) pending = { at: Date.now() + waiting.read, kind: waiting.kind };
      if (pending && Date.now() >= pending.at) {
        await ev(ACT[pending.kind]);
        reads[pending.kind]++;
        pending = null;
      }
      await sleep(150);
    }
    const scene = await ev('window.game && game.state.scene');
    const errors = await ev('(window.game && game.scriptErrors) || []');
    return { run: n, controlMs, objectiveMs, objective, scene, at, reads, errors };
  } finally {
    if (ws) ws.close();
    chrome.kill();
    // the profile is ours; Windows keeps Chrome's files locked for a moment after it exits, so the delete waits and retries
    await sleep(1500);
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch { /* left for the temp folder's own cleanup */ }
  }
}

const results = [];
try {
  for (let n = 1; n <= runs; n++) results.push(await oneRun(n));
} finally {
  server.kill();
}
const ok = results.filter((r) => r.controlMs != null);
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
console.log(JSON.stringify({ runs: results, medianControlMs: ok.length ? med(ok.map((r) => r.controlMs)) : null }, null, 2));
