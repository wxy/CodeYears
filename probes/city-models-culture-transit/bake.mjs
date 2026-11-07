// 仅重新烘焙本任务候选；须先关闭4192预览。无需额外依赖或API。
import {createServer} from 'vite';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const temporary=await mkdtemp(resolve(tmpdir(),'culture-transit-bake-'));
const server=await createServer({configFile:resolve(root,'probes/city-models-culture-transit/vite.config.ts')});
let browser,socket;
try{
 await server.listen();
 browser=spawn(process.env.CHROMIUM_BIN||'chromium',['--headless','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+temporary,'about:blank'],{stdio:'ignore'});
 browser.on('error',error=>console.error(error.message));
 let port;
 for(let i=0;i<100&&!port;i++){try{port=(await readFile(resolve(temporary,'DevToolsActivePort'),'utf8')).split('\n')[0]}catch{await new Promise(r=>setTimeout(r,100))}}
 if(!port)throw Error('Chromium启动失败；可用CHROMIUM_BIN指定已安装浏览器');
 const pages=await(await fetch(`http://127.0.0.1:${port}/json`)).json();socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});let seq=0;const pending=new Map();
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const [resolve,reject]=pending.get(m.id);pending.delete(m.id);m.error?reject(Error(JSON.stringify(m.error))):resolve(m.result)}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,[resolve,reject]);socket.send(JSON.stringify({id,method,params}))});
 await call('Page.navigate',{url:'http://127.0.0.1:4192/bake.html'});let baked;
 for(let i=0;i<160&&!baked;i++){await new Promise(r=>setTimeout(r,250));const r=await call('Runtime.evaluate',{expression:'window.baked',returnByValue:true});baked=r.result?.value}
 if(!baked||Object.keys(baked).length!==6)throw Error('六款候选未全部成功烘焙');
 const catalog={},metrics={};
 for(const [id,entry]of Object.entries(baked)){
  if(!/^ct-[a-z-]+$/.test(id))throw Error('非法候选id');
  await writeFile(resolve(root,'public/assets/city-candidates-culture-transit',id+'.png'),Buffer.from(entry.png,'base64'));catalog[id]=entry.metadata;metrics[id]=entry.calibration;
 }
 const design=resolve(root,'docs/design/city-model-expansion/culture-transit');
 await writeFile(resolve(design,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
 await writeFile(resolve(design,'calibration-results.json'),JSON.stringify(metrics,null,2)+'\n');
 console.log('六款候选烘焙完成；请核对 specifications.json 后提交。');
}finally{
 socket?.close();if(browser){browser.kill();await new Promise(r=>browser.exitCode!==null?r():browser.once('exit',r))}await server.close();await rm(temporary,{recursive:true,force:true});
}
