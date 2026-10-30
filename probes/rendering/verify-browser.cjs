// Full browser diagnostic, optional external Playwright; no application dependency.
const {chromium}=require(process.env.PROBE_PLAYWRIGHT_MODULE || 'playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PROBE_CHROMIUM || '/usr/bin/chromium',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
 const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.goto(process.env.PROBE_URL || 'http://127.0.0.1:4173');
 const snap=()=>page.evaluate(()=>window.renderProbe.snapshot());
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 console.log('browser',await browser.version()); console.log('initial',await snap(),requests);
 console.log('data',await page.evaluate(()=>['sparse','regular','dense'].map(d=>{const a=window.renderProbe.generateDays(d);return {d,n:a.length,first:a[0],last:a.at(-1),leaps:a.filter(x=>x.date.endsWith('02-29')).length,total:a.reduce((s,x)=>s+x.count,0),zero:a.filter(x=>!x.count).length}})));
 for(const mode of ['city','terrain'])for(const density of ['sparse','regular','dense']){
  await page.selectOption('#mode',mode);await page.selectOption('#density',density);await page.selectOption('#theme',density==='dense'?'Natural':'Signature');
  await page.click('#open');await page.waitForFunction(()=>window.renderProbe.snapshot().active?.frames>2);
  await wait(400);await page.click('#pause');
  // The final redraw may still be pending; measure the paused window after it settles.
  await page.waitForFunction(()=>window.renderProbe.snapshot().active?.pendingFrame===false);
  const p=await snap();await wait(400);const p2=await snap();if(p.active.frames!==p2.active.frames)throw Error('pause frames');
  await page.click('#resume');await wait(400);const r=await snap();if(r.active.visibleDays<=p.active.visibleDays)throw Error('resume');
  await page.click('#skip');await wait(150);const final=await snap();await wait(500);const idle=await snap();if(final.active.frames!==idle.active.frames||idle.active.pendingFrame||idle.active.visibleDays!==7305)throw Error('idle');
  console.log('case',mode,density,{pauseFrames:p2.active.frames-p.active.frames,resumeDays:r.active.visibleDays-p.active.visibleDays,final:idle});
  await page.click('#close');console.log('closed',await snap());
 }
 await page.selectOption('#mode','city');await page.click('#open');await page.waitForFunction(()=>window.renderProbe.snapshot().active?.frames>2);
 const backend=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');return {vendor:gl.getParameter(gl.VENDOR),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}});console.log('backend',backend);
 // Real visibility transitions via DevTools lifecycle; verify document.hidden explicitly.
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setPageVisibilityState',{visibilityState:'hidden'}).catch(e=>console.log('visibility-command-unavailable',e.message));
 console.log('visibility',await page.evaluate(()=>document.hidden));
 await page.evaluate(()=>window.renderProbe.close());
 // Complete uninterrupted growth, then observe static endpoint.
 await page.evaluate(()=>window.renderProbe.open());await page.waitForFunction(()=>window.renderProbe.snapshot().active?.visibleDays===7305,{},{timeout:20000});console.log('complete-growth',await snap());
 await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(600,400);await page.mouse.up();await page.mouse.wheel(0,100);await wait(150);console.log('interaction',await snap());
 await page.goto('about:blank'); console.log('errors',errors);await browser.close();if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
