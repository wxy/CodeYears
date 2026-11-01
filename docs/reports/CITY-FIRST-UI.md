# City 首发扩展 UI · 云端报告

日期：2026-11-01。基线 `510e5237c07707c4c608b96e5f3739925ebbc20b`；分支 `codex/city-first-release-ui`。只修改 `src/extension/content.ts`、`src/extension/popup.ts`、manifest description，并新增本报告及 [City 发布准备清单](../RELEASE_READINESS.md)。未改权限、version、WAR、CSP、底层数据/缓存隔离、共享 renderer/types 或本地 probe，暂不合入。

## 实际变更

- 弹窗仅介绍 City；移除扩展中的视图选择与 Terrain 宣传，`createLandscape` 显式传入 `"city"`，不再通过 UI 调用 setView。Terrain 源码和构建分包保留，入口收起不等于已经移除包体。
- 默认保留年份范围、生成、加载/错误状态和城市控制；取消只在忙碌时显示。城市上方显示范围与贡献合计，不再横排每个年份的重复标签或显示 renderer detail。
- 已知身份文字、图例、缓存说明、刷新所选年份和清除此主页缓存放进默认关闭的“设置与数据说明”。移除独立“仅查看每日数据”按钮，但完成读取后的真实每日数量仍可独立展开，继续懒建数千行 DOM。
- 常态不显示网络/缓存年数、请求来源、实现说明；成功且无警告时主状态区收起。年度加载与“正在准备城市”进度、失败/取消、身份未知或变化、缓存读写警告、素材/渲染错误继续在主状态区显示，不藏入设置。
- 维持 loader 的 currentContext、实时身份确认、AbortController、页面后台清空和 pagehide/Turbo 导航销毁路径；没有放松权限或把失败当空数据。

## 实际验证

Linux 云端；Node v24.19.0、npm 11.9.0、Chromium 154.0.8037.57 headless，1280×1050。浏览器实际执行本轮构建 content.js、landscape.js 和正式 PNG；通过 Playwright route 提供合成 GitHub 页面、英文贡献 HTML 与内存 chrome.storage/runtime 替身。没有登录真实 GitHub、读取真实用户缓存或安装本轮 MV3。

固定 fixture：2024 闰年 366 天，第 i 天 count=i%8，总量 1275；全部日期与 ordinal 英文 tooltip 由脚本生成，走现有解析器、逐日/标题合计验证、历史 loader、缓存隔离及真实 City renderer。首次 fixture 缺 tooltip 的 ordinal 后缀被正式解析器拒绝；补正测试 HTML 后通过，没有改解析器迁就输入。

| 受控路径（10 项） | 实际结果 |
| --- | --- |
| City 成功 | 1 张城市 canvas；无视图选择/横排年度摘要/渲染诊断/inspect；设置与身份默认收起，取消默认隐藏；无警告时 status 为空，未请求 terrain-view 分包 |
| 控制/明细/设置（成功路径内） | 暂停变继续、缩放/重置可操作、跳过 100%、重播；展开前 0 行、展开后 366 行，首日真实数量 0；设置中刷新重新请求，清除后内存缓存为空且城市销毁 |
| HTTP 403 | 主状态显示原 HTTP 错误，未生成 canvas |
| 请求取消 | 主状态显示已取消，未生成 canvas |
| 实时身份变化 | 主状态显示会话身份无法确认/改变，未用旧缓存生成城市 |
| 身份未知 | 明确无缓存警告；storage get/set/remove 均为 0，仍可联网生成城市 |
| 缓存写入失败 | 真实结果可生成，同时主状态保留写缓存失败警告 |
| 素材失败 | 模拟 PNG 404，renderer 错误在主状态显示，未吞掉错误 |
| 导航 | 派发 Turbo 导航前事件，panel 销毁，GitHub 原 grid 仍为 1 |
| Popup 成功及权限错误（2 项） | 实际浏览器执行 popup.ts，受控 chrome.scripting 成功时提示年份范围，失败时原权限错误可见，无视图选择提示 |

上表“控制/明细/设置”包含在成功场景内；总计为脚本输出的成功、六类失败/警告、导航及两个 popup，共 10 项。pageerror 为 0。没有新增事后单元测试，仅临时直接路径浏览器诊断。

`npm ci --cache /tmp/codeyears-first-ui-cache --no-audit --no-fund`、`npm run check`（构建内执行）、临时构建和 `git diff --check`：PASS。manifest 与基线删除 description 后深度比较相等；无其他字段变化。content 20.43 kB/gzip 8.34 kB，popup 3.57 kB/gzip 1.85 kB；未修改的 landscape 122.41 kB/gzip 33.94 kB，Terrain 629.82 kB/gzip 142.97 kB。这些是打包结果，不是性能预算证据。

## 本地组合与发布边界

本地还须组合季度道路统一对齐、两侧年份雕塑及外围地貌，并重载实际扩展验收。这里不修改 renderer 内部年份标签或实现雕塑，只移除 content 的重复年度标签。尚未验证本轮已登录 MV3、真实权限提示、多身份/后台全矩阵、Edge 或当前硬件预算。

发布准备清单基于仓库实物和查阅的 Chrome/Edge 官方文档，区分缺项、历史证据与本轮结果；未选择许可证、制作图标、变更版本、上传商店或提交审核。不得将缩减 UI 或受控浏览器通过写成已经可发布。

## 复现

仓库根目录执行以下一次性脚本。需已有外部 Playwright（本环境路径如下），不写入项目依赖。命令工具正常启用网络权限以便 Chromium 创建内部 socket；路由拦截测试请求，不访问真实贡献数据。脚本末尾浏览器关闭，过程文件在记录后清理。

```sh
npm ci --cache /tmp/codeyears-first-ui-cache --no-audit --no-fund
npm run build -- --outDir /tmp/codeyears-first-ui-build
mkdir -p /tmp/codeyears-first-ui-probe
cat > /tmp/codeyears-first-ui-probe/check.cjs <<'FIRST_UI_BROWSER'
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {stripTypeScriptTypes}=require('node:module'),{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const out='/tmp/codeyears-first-ui-build';
const base='<html><head><meta name="user-login" content="fixture-viewer"></head><body><div class="js-yearly-contributions"><table class="ContributionCalendar-grid"></table><a id="year-link-2024"></a><a id="year-link-2023"></a></div></body></html>';
const days=Array.from({length:366},(_,i)=>{const d=new Date(Date.UTC(2024,0,1)+i*86400000);return {date:d.toISOString().slice(0,10),count:i%8,month:d.toLocaleString('en-US',{month:'long',timeZone:'UTC'}),day:d.getUTCDate()}});
const total=days.reduce((s,d)=>s+d.count,0),fragment=`<h2>${total} contributions in 2024</h2><table class="ContributionCalendar-grid"><tbody>${days.map((d,i)=>`<tr><td id="d${i}" data-date="${d.date}"></td></tr>`).join('')}</tbody></table>${days.map((d,i)=>`<tool-tip for="d${i}">${d.count||'No'} contributions on ${d.month} ${d.day}${d.day%100>=11&&d.day%100<=13?'th':({1:'st',2:'nd',3:'rd'}[d.day%10]||'th')}.</tool-tip>`).join('')}`;
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];try{
 async function open(mode='success'){
  const context=await browser.newContext({viewport:{width:1280,height:1050}});const p=await context.newPage(),requests=[],errors=[];p.on('pageerror',e=>errors.push(String(e)));
  await p.addInitScript(({mode})=>{window.__store={};window.__ops={get:0,set:0,remove:0};window.chrome={runtime:{getURL:p=>'https://github.com/__extension/'+p},storage:{local:{get:async key=>{window.__ops.get++;return key?{[key]:window.__store[key]}:{...window.__store}},set:async values=>{window.__ops.set++;if(mode==='writefail')throw Error('fixture quota');Object.assign(window.__store,values)},remove:async keys=>{window.__ops.remove++;keys.forEach(k=>delete window.__store[k])}}}}},{mode});
  await p.route('https://github.com/**',async route=>{const url=new URL(route.request().url());requests.push(url.pathname+url.search);
   if(url.pathname.startsWith('/__extension/')){const file=path.join(out,url.pathname.slice('/__extension/'.length));if(mode==='assetfail'&&file.endsWith('.png'))return route.fulfill({status:404,body:'fixture missing'});return route.fulfill({path:file,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'text/html'})}
   if(url.searchParams.has('from')){if(mode==='cancel')await new Promise(r=>setTimeout(r,500));return route.fulfill(mode==='httpfail'?{status:403,contentType:'text/html',body:'denied'}:{contentType:'text/html',body:fragment}).catch(()=>{})}
   let html=base;if(mode==='unknown')html=base.replace('<meta name="user-login" content="fixture-viewer">','');if(mode==='changed'&&route.request().resourceType()!=='document')html=base.replace('fixture-viewer','other-viewer');return route.fulfill({contentType:'text/html',body:html});
  });
  await p.goto('https://github.com/fixture-user');await p.addScriptTag({content:fs.readFileSync(out+'/content.js','utf8')});const panel=p.locator('#codeyears-data-probe');await panel.locator('#start-year').selectOption('2024');
  return {context,p,panel,requests,errors};
 }
 let s=await open();const {p,panel}=s;
 assert.equal(await panel.locator('#view,#year-summary,#scene-detail,#inspect').count(),0);assert.equal(await panel.locator('#data-settings').getAttribute('open'),null);assert.equal(await panel.locator('#identity').isVisible(),false);assert.equal(await panel.locator('#cancel').isVisible(),false);
 await panel.locator('#run').click();await panel.locator('#scene canvas').waitFor({timeout:30000});assert.equal(await panel.locator('#details tbody tr').count(),0);assert.equal(await panel.locator('#status').textContent(),'');assert(!s.requests.some(v=>v.includes('terrain-view')));
 await panel.locator('#pause').click();await p.waitForTimeout(60);assert.equal(await panel.locator('#pause').textContent(),'继续');await panel.locator('#zoom-in').click();await panel.locator('#zoom-out').click();await panel.locator('#reset-view').click();await panel.locator('#skip').click();await p.waitForTimeout(60);assert((await panel.locator('#progress').textContent()).includes('100%'));await panel.locator('#replay').click();
 await panel.locator('#details summary').click();await p.waitForFunction(()=>document.querySelector('#codeyears-data-probe').shadowRoot.querySelectorAll('tbody tr').length===366);assert.equal(await panel.locator('tbody tr').first().textContent(),'2024-01-010');
 await panel.locator('#data-settings summary').click();assert(await panel.locator('#identity').isVisible());const prior=s.requests.filter(v=>v.includes('from=')).length;await panel.locator('#refresh').click();await p.waitForFunction(n=>window.__ops.set>n,await p.evaluate(()=>window.__ops.set));await panel.locator('#scene canvas').waitFor();assert(s.requests.filter(v=>v.includes('from=')).length>prior);
 await panel.locator('#clear').click();await p.waitForFunction(()=>document.querySelector('#codeyears-data-probe').shadowRoot.querySelector('#status').textContent.includes('已清除'));assert.equal(await panel.locator('#scene canvas').count(),0);assert.equal(await p.evaluate(()=>Object.keys(window.__store).length),0);
 assert.equal(s.errors.length,0);results.push('success: City only, controls, lazy 366 rows, settings/refresh/clear, no Terrain request');await s.context.close();
 for(const mode of ['httpfail','cancel','changed','unknown','writefail','assetfail']){
  s=await open(mode);const {p,panel}=s;console.log('case',mode);await panel.locator('#run').click();
  if(mode==='cancel'){await panel.locator('#cancel').waitFor();await panel.locator('#cancel').click()}
  if(['unknown','writefail'].includes(mode)){await panel.locator('#scene canvas').waitFor({timeout:30000});const msg=await panel.locator('#status').textContent();assert(msg.includes(mode==='unknown'?'身份未识别':'缓存写入失败'));if(mode==='unknown')assert.deepEqual(await p.evaluate(()=>window.__ops),{get:0,set:0,remove:0});}
  else{await p.waitForFunction(mode=>{const msg=document.querySelector('#codeyears-data-probe').shadowRoot.querySelector('#status').textContent;return mode==='assetfail'?msg.includes('失败'):mode==='changed'?msg.includes('身份无法确认'):mode==='cancel'?msg.includes('已取消'):msg.includes('HTTP 403')},mode);if(mode!=='assetfail')assert.equal(await panel.locator('#scene canvas').count(),0)}
  assert.equal(s.errors.length,0);results.push(mode+': visible feedback');await s.context.close();
 }
 s=await open();await s.panel.locator('#run').click();await s.panel.locator('#scene canvas').waitFor({timeout:30000});await s.p.evaluate(()=>document.dispatchEvent(new Event('turbo:before-render')));assert.equal(await s.p.locator('#codeyears-data-probe').count(),0);assert.equal(await s.p.locator('.ContributionCalendar-grid').count(),1);results.push('navigation: panel disposed, GitHub grid retained');await s.context.close();
 // Popup source runs in a real page with Chrome API outcomes controlled, not an installed extension.
 for(const deny of [false,true]){const page=await browser.newPage();await page.setContent('<div id="app"></div>');await page.evaluate(deny=>{window.chrome={tabs:{query:async()=>[{id:1,url:'https://github.com/fixture-user'}]},scripting:{executeScript:async()=>{if(deny)throw Error('扩展注入权限不可用');return[{result:true}]}}} },deny);await page.addScriptTag({content:stripTypeScriptTypes(fs.readFileSync('src/extension/popup.ts','utf8'))});assert(!(await page.locator('#app').innerText()).includes('Terrain'));await page.locator('button').click();await page.waitForFunction(()=>document.querySelector('#app').shadowRoot.querySelector('output').textContent.length>0);const message=await page.locator('output').textContent();assert(message.includes(deny?'权限不可用':'年份范围'));assert(!message.includes('视图'));results.push('popup '+(deny?'permission error':'success'));await page.close();}
 console.log(JSON.stringify({browser:await browser.version(),total,results,status:'PASS'}));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
FIRST_UI_BROWSER
node /tmp/codeyears-first-ui-probe/check.cjs
git diff --check
rm -rf /tmp/codeyears-first-ui-probe /tmp/codeyears-first-ui-build /tmp/codeyears-first-ui-cache
```
