// 浏览器直接路径诊断/素材烘焙；不新增依赖或单元测试。
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { parseArgs } from 'node:util';
const require=createRequire(import.meta.url);
const { values }=parseArgs({options:{outDir:{type:'string'},bake:{type:'boolean'}}});
if(!values.outDir)throw Error('必须指定仓库外系统临时目录 --outDir /tmp/...');
const output=resolve(values.outDir),inside=relative(process.cwd(),output);
if(!inside||(!inside.startsWith('..')&&!isAbsolute(inside)))throw Error('诊断输出不能在仓库内');
await mkdir(output,{recursive:true});
const {chromium}=require(process.env.PLAYWRIGHT_MODULE??'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1.5});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4187/');await page.waitForLoadState('networkidle');
  if(values.bake){
    const entries=await page.evaluate(async()=> (await import('/bake.ts')).bakeCandidates());
    const folder=resolve('public/assets/city-candidates-residential');await mkdir(folder,{recursive:true});
    for(const entry of entries)await writeFile(join(folder,entry.metadata.file),Buffer.from(entry.png,'base64'));
    await writeFile(resolve('docs/design/city-model-expansion/residential/catalog.json'),JSON.stringify(Object.fromEntries(entries.map(e=>[e.id,e.metadata])),null,2)+'\n');
    await writeFile(join(output,'bake.json'),JSON.stringify(entries.map(({png,...entry})=>entry),null,2));
    console.log(`已烘焙 ${entries.length} 款，仅写独立候选目录。`);
  }else{
    await page.waitForFunction(()=>window.residentialProbe?.snapshot().sampling);
    const scenes=[];
    for(const years of ['1','3','20']){
      await page.selectOption('#years',years);
      await page.waitForFunction(n=>window.residentialProbe.snapshot().years.length===n&&document.querySelector('#stage canvas')?.width>0,Number(years));
      for(const label of ['fit','near','max']){
        await page.click('#'+label);const snapshot=await page.evaluate(()=>window.residentialProbe.snapshot());
        if(!snapshot.datesIdentical||!snapshot.allDatesMapped||snapshot.total!==snapshot.mappedTotal)throw Error('日期/数量守恒失败');
        scenes.push({label,...snapshot});await page.locator('#stage').screenshot({path:join(output,`${years}-${label}.png`)});
      }
    }
    await page.locator('#gallery').screenshot({path:join(output,'gallery.png')});
    await page.click('#close');const released=await page.locator('canvas').count();if(released!==0)throw Error('关闭未释放页面画布');
    await page.click('#open');await page.waitForFunction(()=>document.querySelector('#stage canvas')?.width>0);
    if(errors.length)throw Error(errors.join('\n'));
    await writeFile(join(output,'verification.json'),JSON.stringify({browser:await browser.version(),errors,released,scenes},null,2));
    console.log(`通过 ${scenes.length} 组，日期数量守恒、关闭重开正常。临时证据：${output}`);
  }
}finally{await browser.close()}
