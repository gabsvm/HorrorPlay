// Capture one actual El Huésped scene at logical pixel scale using isolated
// Chromium/Edge CDP. Never changes saves, production code or unrelated Chrome
// processes. QA deep links skip story/entry scripts: this is VISUAL QA only.
// node web/art_review/scenery_refresh/scripts/capture_scene.mjs knackers before
// node web/art_review/scenery_refresh/scripts/capture_scene.mjs knackers after
// node web/art_review/scenery_refresh/scripts/capture_scene.mjs bucks_row after
// node web/art_review/scenery_refresh/scripts/capture_scene.mjs foreshore after
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../..');
const AUDIT = resolve(HERE, '..');
// Default player x per scene, near the lamp/crate props audited in T0. Values for
// knackers/bucks_row/foreshore are the historical ones; the rest were picked from
// the prop coordinates in web/src/scenes/*.js. Pass an explicit x as 4th argument
// (or --x=N) to capture another spot in the same scene.
// node web/art_review/scenery_refresh/scripts/capture_scene.mjs alleys audit_t0 1800
const SCENES = {
  knackers: 1810, bucks_row: 1470, foreshore: 1210,
  alleys: 700, goulston: 380, hanbury: 250, millers: 1320, mitre: 1380,
};
const scene = process.argv[2] || 'knackers';
if (!(scene in SCENES)) throw Error('Unsupported scene: ' + scene + ' (known: ' + Object.keys(SCENES).join(', ') + ')');
const label = process.argv[3] || 'after';
if (!/^[a-z0-9_-]+$/i.test(label)) throw Error('Bad output label');
const xFlag = process.argv.find((a) => a.startsWith('--x='));
const xArg = xFlag ? xFlag.slice(4) : process.argv[4];
const xExplicit = xArg !== undefined;
const X = xExplicit ? Number(xArg) : SCENES[scene];
if (!Number.isFinite(X) || X < 0 || X > 6000) throw Error('Bad x: ' + xArg);
const OUT = join(AUDIT, 'comparison', label);
await mkdir(OUT, { recursive: true });
const chrome = [
  process.env.CHROME, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
].find(x => x && existsSync(x));
if (!chrome) throw Error('Edge/Chrome not found');
const mime = { '.html':'text/html','.js':'text/javascript','.css':'text/css',
  '.png':'image/png','.json':'application/json','.woff2':'font/woff2',
  '.mp3':'audio/mpeg','.ogg':'audio/ogg' };
const server = createServer(async (req,res) => {
  try {
    const path = resolve(WEB, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    const rel = relative(WEB, path);
    if (rel.startsWith('..') || rel.startsWith('/') || rel.startsWith('\\') || rel.includes(':') || !(await stat(path)).isFile()) throw Error('bad path');
    res.writeHead(200, {'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(await readFile(path));
  } catch {res.writeHead(404);res.end();}
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = await mkdtemp(join(tmpdir(), 'elh-visual-qa-'));
let proc, ws;
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = 37000 + Math.floor(Math.random() * 7000);
  proc = spawn(chrome, ['--headless=new','--no-first-run','--no-default-browser-check',
    '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
    '--window-size=1280,720','about:blank'], {stdio:'ignore',windowsHide:true});
  let target;
  for(let i=0;i<100&&!target;i++){
    try {
      const r=await fetch('http://127.0.0.1:' + port + '/json/new?about:blank',{method:'PUT'});
      if(r.ok)target=await r.json();
    }catch{}
    if(!target)await sleep(170);
  }
  if(!target)throw Error('Browser CDP unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
  let id=0;
  const pending=new Map();
  ws.addEventListener('message',e=>{
    const v=JSON.parse(e.data);
    if(v.id&&pending.has(v.id)){pending.get(v.id)(v);pending.delete(v.id);}
  });
  const send = (method,params={}) => new Promise((r,j)=>{
    const n=++id;
    const timeout=setTimeout(()=>{pending.delete(n);j(Error('CDP timeout '+method));},30000);
    pending.set(n,v=>{clearTimeout(timeout);v.error?j(Error(v.error.message)):r(v.result);});
    ws.send(JSON.stringify({id:n,method,params}));
  });
  const ev=async expr=>{
    const v=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
    if(v.exceptionDetails)throw Error(v.exceptionDetails.text);
    return v.result.value;
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  const url='http://127.0.0.1:'+server.address().port+'/index.html?scene='+scene+'&noenter&x='+X;
  await send('Page.navigate',{url});
  let loaded=false;
  for(let i=0;i<120;i++){
    await sleep(170);
    const ready=await ev('window.game?.scene?.id === '+JSON.stringify(scene)+' && game.r.presented > 3').catch(()=>false);
    if(ready){loaded=true;break;}
  }
  if(!loaded)throw Error('Scene not ready');
  await ev('(() => {game.r.fx.fade=0;game.r.fx.zoom=[1,.5,.5];game.zoomTarget=null;game.zoom={z:1,x:game.player.x,y:460};game.r.cam.shake=0;game.ui.showHud(false);return true;})()');
  await sleep(850);
  const results=[];
  for(const [width,height] of [[640,360],[1280,720]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await sleep(600);
    const state=await ev('({scene:game.scene.id,x:game.player.x,y:game.player.y,camX:game.r.cam.x,frames:game.r.presented})');
    const data=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    // With an explicit x, tag the file so several spots per scene can coexist;
    // without it keep the historical plain name.
    const name=xExplicit?scene+'_x'+X+'_'+width+'x'+height+'.png':scene+'_'+width+'x'+height+'.png';
    await writeFile(join(OUT,name),Buffer.from(data.data,'base64'));
    console.log('CAPTURE',label,name,JSON.stringify(state));
    results.push({name,state,width,height});
  }
  if (scene === 'knackers' && process.argv.includes('--exchange')) {
    // QA-only scenario using the REAL actor clock, never FAST. We prepare
    // inventory/first-meeting state, then call the actual hotspot.use.
    // This verifies staging, not story discovery by a human player.
    await ev('(() => {game.scene.G=game.G;game.state.flags.wren_met=true;game.state.items.push("penique");game.player.x=1735;window.__qaExchange={done:false};const h=game.scene.hotspots.find(h=>h.id==="wren");game.run(()=>h.use(game.G,"penique")).then(()=>{window.__qaExchange.done=true;});return true;})()');
    const samples=[];
    for(let i=0;i<145;i++){
      await sleep(120);
      const s=await ev('(() => {const w=game.actor("Wren");return {wx:w?.x,wy:w?.y,coins:!!game.state.flags.wren_coin_on_post,paid:!!game.state.flags.wren_paid,talking:!!w?.talking,pose:w?.pose,done:!!window.__qaExchange?.done,running:game.running,errors:game.scriptErrors?.map(e=>e.message)||[]};})()');
      samples.push(s);
      if(s.errors.length)throw Error('Wren script error: '+s.errors.join(';'));
      if (s.done || (samples.some(p=>p.coins)&&samples.some(p=>p.wy>605)&&!s.coins)) break;
    }
    const summary={sawCoin:samples.some(s=>s.coins),grounded:samples.some(s=>s.wy>=620),descended:samples.some(s=>s.wy>561&&s.wy<620),removed:samples.some(s=>s.paid&&!s.coins&&s.wy>=620),initial:samples[0],last:samples[samples.length-1],samples:samples.length};
    await writeFile(join(OUT,'knackers_wren_exchange_trace.json'),JSON.stringify({note:'Real-time actor movement; QA prepared flags; not full playthrough',summary,samples},null,2));
    if(!(summary.sawCoin&&summary.grounded&&summary.descended&&summary.removed))throw Error('Wren exchange assertions: '+JSON.stringify(summary));
    console.log('EXCHANGE PASS',JSON.stringify(summary));
  }
  await writeFile(join(OUT,(xExplicit?scene+'_x'+X:scene)+'_capture_log.json'),JSON.stringify({scene,label,x:X,
    method:'actual canvas/render in Chrome; QA scene deep-link, no story entrance',
    androidTested:false,results},null,2));
} finally {
  try{ws?.close();}catch{}
  try{proc?.kill();}catch{}
  server.close();
  await sleep(650);
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300}).catch(()=>{});
}
