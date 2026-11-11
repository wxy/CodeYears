// Direct browser path checks, no user profile. Requires Playwright available to Node.
// Start the preview first; all generated evidence must be in an explicit /tmp directory.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.argv[2];
assert(out?.startsWith('/tmp/'),'Provide a /tmp evidence directory');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1,reducedMotion:'no-preference'});
const page=await context.newPage(),errors=[],rows=[];let assets=0;
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/assets/city-runtime/'))assets++;});
await page.addInitScript(()=>{
  const p=CanvasRenderingContext2D.prototype,counters={main:0,other:0};
  for(const method of ['drawImage','clearRect','fillRect','fill','stroke']){const original=p[method];p[method]=function(...args){counters[this.canvas.dataset.role==='main'?'main':'other']++;return original.apply(this,args);};}
  window.canvasCalls=counters;
});
const snap=()=>page.evaluate(()=>({...window.lifeProbe.snapshot(),calls:{...window.canvasCalls}}));
const ready=()=>page.waitForFunction(()=>window.lifeProbe?.snapshot().ready,null,{timeout:60000});
const stable=async(ms=800)=>{const a=await snap();await page.waitForTimeout(ms);const b=await snap();assert.equal(b.animation.frames,a.animation.frames);assert.equal(b.animation.pending,false);assert.deepEqual(b.calls,a.calls);return {before:a.animation.frames,after:b.animation.frames,pending:b.animation.pending,elapsed:b.animation.elapsed};};
try{
 await page.goto(process.env.LIFE_URL||'http://127.0.0.1:4184');await ready();
 for(const sample of ['regular','sparse','dense','multi']){
  await page.selectOption('#sample',sample);await ready();assert.equal((await snap()).tracks.length,2);
  for(const camera of ['wide','near']){
   await page.click('#'+camera);
   let baseline;
   for(const mode of ['0','1','2']){
    await page.selectOption('#mode',mode);await page.waitForTimeout(250);const a=await snap();
    await page.waitForTimeout(1800);const b=await snap();
    assert.equal(b.mainDraws,a.mainDraws);assert.deepEqual(b.calls,a.calls);
    if(mode==='0'){assert.equal(b.animation.frames,a.animation.frames);assert.equal(b.animation.pending,false);baseline={input:b.input,viewport:b.viewport};}
    else{assert(b.animation.frames>a.animation.frames);assert.equal(b.animation.requested,Number(mode));assert.equal(b.animation.spriteUploads,2);}
    assert.deepEqual({input:b.input,viewport:b.viewport},baseline);
    rows.push({sample,camera,mode,input:b.input,mainDelta:b.mainDraws-a.mainDraws,canvasDelta:{main:b.calls.main-a.calls.main,other:b.calls.other-a.calls.other},frames:b.animation.frames-a.animation.frames,animation:b.animation,heapBefore:a.heap,heapAfter:b.heap});
    await page.locator('#stage').screenshot({path:`${out}/${sample}-${camera}-${mode}.png`});
   }
  }
  console.log('matrix',sample,'passed');
 }
 const lifecycle={};
 await page.click('#pause');lifecycle.pause=await stable();await page.click('#pause');await page.waitForTimeout(200);
 const beforeSwitch=await snap(),requests=assets;await page.click('#switch');lifecycle.official=await stable();await page.click('#switch');await page.waitForTimeout(250);
 assert.equal(assets,requests);assert.equal((await snap()).mainDraws,beforeSwitch.mainDraws);lifecycle.reuse={assetRequestsDelta:assets-requests,mainDelta:(await snap()).mainDraws-beforeSwitch.mainDraws};
 await page.emulateMedia({reducedMotion:'reduce'});lifecycle.reduced=await stable();await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(250);assert((await snap()).animation.pending);
 // Record real tab visibility first; headless Chromium may keep both targets visible.
 const other=await context.newPage();await other.goto('about:blank');await other.bringToFront();
 lifecycle.background={actualHidden:await page.evaluate(()=>document.hidden)};
 if(lifecycle.background.actualHidden)lifecycle.background.stop=await stable();
 await other.close();await page.bringToFront();
 if(!lifecycle.background.actualHidden){
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  lifecycle.background.controlledHidden=await stable();
  const sleeping=await snap();await page.waitForTimeout(1000);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);
  lifecycle.background.controlledResumeDelta=(await snap()).animation.elapsed-sleeping.animation.elapsed;
  assert(lifecycle.background.controlledResumeDelta<.3);
 }
 const beforePan=await snap();await page.mouse.move(650,450);await page.mouse.down();await page.mouse.move(690,470,{steps:4});await page.mouse.up();
 assert((await snap()).mainDraws>beforePan.mainDraws);await page.click('#in');await page.click('#out');
 await page.selectOption('#mode','0');for(let i=0;i<35;i++)await page.click('#out');const low=(await snap()).viewport.zoom;assert.equal(low,.9375);
 for(let i=0;i<60;i++)await page.click('#in');const high=(await snap()).viewport.zoom;assert(high<=37.5);lifecycle.zoom={lowPercent:low/1.875*100,highPercent:high/1.875*100};
 await page.selectOption('#mode','2');await page.waitForTimeout(200);await page.click('#dispose');lifecycle.dispose=await stable();assert.equal((await snap()).animation.spritePixels,0);assert.equal(await page.locator('#stage canvas').count(),0);
 await page.click('#restore');await ready();await page.waitForTimeout(250);assert((await snap()).animation.pending);lifecycle.restore={canvases:await page.locator('#stage canvas').count(),uploads:(await snap()).animation.spriteUploads};
 await page.click('#pause');const frozen=await snap();await page.waitForTimeout(1200);await page.click('#pause');await page.waitForTimeout(100);const resumed=await snap();assert(resumed.animation.elapsed-frozen.animation.elapsed<.3);lifecycle.noCatchUp={elapsedDelta:resumed.animation.elapsed-frozen.animation.elapsed};
 assert.deepEqual(errors,[]);
 // CDP durations cover browser main-thread work as well as the callback's own stopwatch.
 await page.click('#near');
 const perfSession=await context.newCDPSession(page);await perfSession.send('Performance.enable');
 const values=async()=>Object.fromEntries((await perfSession.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
 const browserCosts=[];
 for(const mode of ['0','1','2']){
  await page.selectOption('#mode',mode);await page.waitForTimeout(300);const a=await values();await page.waitForTimeout(3000);const b=await values(),metrics={};
  for(const k of ['TaskDuration','ScriptDuration','RecalcStyleDuration','LayoutDuration','RecalcStyleCount','LayoutCount'])metrics[k]=b[k]-a[k];
  browserCosts.push({mode,seconds:b.Timestamp-a.Timestamp,metrics});
 }
 const system=await page.evaluate(()=>({userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,renderer:(()=>{const gl=document.createElement('canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null;})()}));
 await writeFile(`${out}/results.json`,JSON.stringify({system,rows,lifecycle,browserCosts,errors},null,2));console.log(JSON.stringify({system,lifecycle,browserCosts,rows:rows.length}));
}finally{await context.close();await browser.close();}
