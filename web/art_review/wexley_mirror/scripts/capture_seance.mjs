// T1 wexley_mirror: capture the real seance engine scene at logical pixel
// scale (isolated Chromium/Edge CDP). Visual QA only: never touches saves,
// production code or unrelated browser processes.
//   node web/art_review/wexley_mirror/scripts/capture_seance.mjs before
//   node web/art_review/wexley_mirror/scripts/capture_seance.mjs before --cracked
//   node web/art_review/wexley_mirror/scripts/capture_seance.mjs after --cracked --x=700
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, relative, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB = resolve(HERE, '../../..');
const TASK = resolve(HERE, '..');
const SCENE = 'seance';
const label = process.argv[2] || 'after';
if (!/^[a-z0-9_-]+$/i.test(label)) throw Error('Bad output label');
const xFlag = process.argv.find((a) => a.startsWith('--x='));
const X = xFlag ? Number(xFlag.slice(4)) : 700;
if (!Number.isFinite(X) || X < 0 || X > 6000) throw Error('Bad x: ' + X);
const cracked = process.argv.includes('--cracked');
const tag = label + (cracked ? '_cracked' : '');
const OUT = join(TASK, 'work', tag);
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
const profile = await mkdtemp(join(tmpdir(), 'elh-mirror-qa-'));
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
  const flags = cracked ? '&flags=mirror_cracked' : '';
  const url='http://127.0.0.1:'+server.address().port+'/index.html?scene='+SCENE+'&noenter&x='+X+flags;
  await send('Page.navigate',{url});
  let loaded=false;
  for(let i=0;i<120;i++){
    await sleep(170);
    const ready=await ev('window.game?.scene?.id === '+JSON.stringify(SCENE)+' && game.r.presented > 3').catch(()=>false);
    if(ready){loaded=true;break;}
  }
  if(!loaded)throw Error('Scene not ready');
  // noEnter skips enter(), so scene.G is unset: link it for the live cracked overlay.
  await ev('(() => {game.scene.G=game.G;game.r.fx.fade=0;game.r.fx.zoom=[1,.5,.5];game.zoomTarget=null;game.zoom={z:1,x:game.player.x,y:460};game.r.cam.shake=0;game.ui.showHud(false);return true;})()');
  await sleep(850);
  const results=[];
  for(const [width,height] of [[640,360],[1280,720]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await sleep(600);
    const state=await ev('({scene:game.scene.id,x:game.player.x,y:game.player.y,camX:game.r.cam.x,frames:game.r.presented,cracked:!!game.state.flags.mirror_cracked})');
    const data=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
    const name='seance_x'+X+(cracked?'_cracked':'')+'_'+width+'x'+height+'.png';
    await writeFile(join(OUT,name),Buffer.from(data.data,'base64'));
    console.log('CAPTURE',tag,name,JSON.stringify(state));
    results.push({name,state,width,height});
  }
  await writeFile(join(OUT,'seance_capture_log.json'),JSON.stringify({scene:SCENE,label:tag,x:X,cracked,
    method:'actual canvas/render in Chrome; QA scene deep-link, no story entrance',
    androidTested:false,results},null,2));
} finally {
  try{ws?.close();}catch{}
  try{proc?.kill();}catch{}
  server.close();
  await sleep(650);
  await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:300}).catch(()=>{});
}
