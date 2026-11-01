# ISO 周年 UI 请求范围 · 云端报告

日期：2026-11-01。起点为原 PR #33 的 `a148afc`（`codex/city-connected-landscape`），本分支 `codex/city-iso-week-range`。只改 `src/extension/content.ts` 并新增本报告，不改共享 ISO helper、planner、布局/渲染、manifest、缓存或全局隐私文档。提交供主代理合入 #33 统一交付，不另开重复 PR，不合 main。

## 修复前输入与实际变更

先写临时浏览器输入：2020/2021/2025 ISO 周年、当前未结束、两端可用源年不足、尚未开始、相邻源年失败/取消及连续周年范围。再构建起点、运行该输入；首个场景明确失败：选择 2020 实际只请求 `[2020]`，预期 `[2019,2020,2021]`。随后才修改实现，没有补写单元测试或改解析器。

选择器与提示明确年份为 ISO 周年：周一到周日归周四所在年，真实源 date 不变，周年合计可能不同于 GitHub 公历年度。直接复用共享 `isoYearStart(start)` 与 `isoYearStart(end+1)` 得到包含起点、不含终点的窗口；计算最后源年时先减一天，避免在周年恰好跨公历边界时多请求一年。

必要公历源年范围限制在页面 yearlinks 最小/最大年及当前公历年内，连续逐年交给原 `loadContributionHistory`，刷新同样请求这些源年。缓存仍由原 loader 按公历年/访问者/主页隔离。所有可请求源年完整成功后，才按 `[firstDate,endDate)` 筛选 `visibleDays`；城市输入、合计与每日表格全部使用同一筛选结果，不计窗口外日期，不改 date/count。

源年受可用入口限制时，主状态明确“周年边界不完整”，保留真实提供日期；范围尚未结束时提示不补未来零值。筛选后为空则显示“所选 ISO 周年尚无已提供的日期”，不把空数组交给 renderer。相邻源年失败或取消仍走原整体停止路径，不用前面成功的部分生成城市。进度条 max、已完成数与失败提示都按实际公历源年个数；成功主 UI 不新增来源/缓存诊断。

刷新、清除、身份警告、后台清空及导航销毁沿用既有路径；本轮未改这些规则。当前 UI 可选周年仍取页面已有年份入口，不额外开放未来周年或账号最早入口前的未知年份。

## 实际浏览器结果

Linux、Node v24.19.0、npm 11.9.0、Chromium 154.0.8037.57 headless，1280×1050，受控 UTC 日期。用实际构建 content/landscape、正式 PNG、正式 HTML 解析器和 loader；Playwright route 替代 GitHub 响应，内存 chrome.storage/runtime 替身，不访问真实登录会话。fixture 的每日 count 为 `UTC日期毫秒/86400000 % 9`，当前源年只提供截至受控今日的日期。

| 场景 | 实际公历源年 | 展示日期（含两端） | 天数 / 合计 | 结果 |
| --- | --- | --- | --- | --- |
| 2020 ISO | 2019/2020/2021 | 2019-12-30—2021-01-03 | 371 / 1484 | PASS |
| 2021 ISO | 2021/2022 | 2021-01-04—2022-01-02 | 364 / 1450 | PASS，含 2022-01-01/02 |
| 2025 ISO | 2024/2025 | 2024-12-30—2025-12-28 | 364 / 1451 | PASS，含前一年末两天、排除 2025 末三天 |
| 当前 2025，今日 07-16 | 2024/2025 | 2024-12-30—2025-07-16 | 199 / 800 | PASS，无未来年/零值补齐 |
| 最早入口 2020，选 2020 | 2020/2021 | 2020-01-01—2021-01-03 | 369 / 1476 | PASS，边界不完整警告，不请求 2019 |
| 最新入口 2020，选 2020 | 2019/2020 | 2019-12-30—2020-12-31 | 368 / 1469 | PASS，边界不完整警告，不请求不可用 2021 |
| 今日 2021-01-01，选 2021 | 2021 | 无 | 无 | PASS，明确尚无日期，未建 canvas/明细 |
| 2020 的相邻 2021 HTTP 403 | 2019/2020/2021 | 无展示 | 无 | PASS，两年先成功也不生成部分城市 |
| 2020 的相邻 2021 请求取消 | 2019/2020/2021 | 无展示 | 无 | PASS，显示取消，未建 canvas/明细 |
| 连续 2020–2021 ISO | 2019/2020/2021/2022 | 2019-12-30—2022-01-02 | 735 / 2934 | PASS，无重复/窗口外合计 |

成功场景实际展开每日表，核对首尾、日数、索引日期唯一、逐日合计及 UI 合计；实际创建 City canvas，并可跳过到 100%。10 场景 pageerror 为 0。当前 planner 的 ISO 周年/13 周分段由另一项任务交付，这里验证真实源范围与 renderer 输入，不宣称已验收其几何/路段规则。

`npm run build -- --outDir /tmp/codeyears-iso-build`（含 `npm run check`）、`git diff --check`：PASS。未改依赖，沿用现有锁文件安装结果；content 21.61 kB/gzip 8.81 kB。这是 UI 直接路径与构建证据，不代表本机已登录 MV3、Edge、真实缓存身份矩阵或硬件性能预算已验收。主代理组合 #33 后需本地重载验收。

## 复现与清理

以下脚本先于实现建立，修复后复用；浏览器由外部已有 Playwright 启动，不改项目依赖。正常启用命令工具网络权限以创建 Chromium socket，所有 GitHub 请求由 fixture 拦截。受控时钟只是 E2E 输入，不进入产品代码。输入、脚本、构建与浏览器过程文件结束后清理，只保留报告。

```sh
npm run build -- --outDir /tmp/codeyears-iso-build
mkdir -p /tmp/codeyears-iso-probe
cat > /tmp/codeyears-iso-probe/check.cjs <<'ISO_BROWSER_CASES'
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
const out='/tmp/codeyears-iso-build',DAY=86400000;
// Expected ISO boundaries are literal regression inputs, written before changing content.ts.
const cases=[
{name:'2020 full',year:2020,min:2019,max:2021,now:'2026-11-01T12:00:00Z',source:[2019,2020,2021],first:'2019-12-30',last:'2021-01-03',length:371},
{name:'2021 full',year:2021,min:2020,max:2022,now:'2026-11-01T12:00:00Z',source:[2021,2022],first:'2021-01-04',last:'2022-01-02',length:364},
{name:'2025 full',year:2025,min:2024,max:2026,now:'2026-11-01T12:00:00Z',source:[2024,2025],first:'2024-12-30',last:'2025-12-28',length:364},
{name:'current partial',year:2025,min:2024,max:2025,now:'2025-07-16T12:00:00Z',source:[2024,2025],first:'2024-12-30',last:'2025-07-16',length:199},
{name:'earliest missing',year:2020,min:2020,max:2021,now:'2026-11-01T12:00:00Z',source:[2020,2021],first:'2020-01-01',last:'2021-01-03',length:369,warning:'边界不完整'},
{name:'latest missing',year:2020,min:2019,max:2020,now:'2026-11-01T12:00:00Z',source:[2019,2020],first:'2019-12-30',last:'2020-12-31',length:368,warning:'边界不完整'},
{name:'not started',year:2021,min:2020,max:2021,now:'2021-01-01T12:00:00Z',source:[2021],empty:true},
{name:'neighbor failure',year:2020,min:2019,max:2021,now:'2026-11-01T12:00:00Z',source:[2019,2020,2021],fail:2021},
{name:'neighbor cancel',year:2020,min:2019,max:2021,now:'2026-11-01T12:00:00Z',source:[2019,2020,2021],cancel:2021},
{name:'combined range',year:2020,end:2021,min:2019,max:2022,now:'2026-11-01T12:00:00Z',source:[2019,2020,2021,2022],first:'2019-12-30',last:'2022-01-02',length:735},
];
const count=date=>(Date.parse(date)/DAY)%9;
function html(year,now){const end=Math.min(Date.UTC(year+1,0,1),Date.parse(now.slice(0,10))+DAY),days=[];for(let t=Date.UTC(year,0,1);t<end;t+=DAY){const d=new Date(t),date=d.toISOString().slice(0,10),n=d.getUTCDate(),suffix=n%100>=11&&n%100<=13?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');days.push({date,count:count(date),label:`${d.toLocaleString('en-US',{month:'long',timeZone:'UTC'})} ${n}${suffix}`})}return `<h2>${days.reduce((s,d)=>s+d.count,0)} contributions in ${year}</h2><table class="ContributionCalendar-grid"><tbody>${days.map((d,i)=>`<tr><td id="d${i}" data-date="${d.date}"></td></tr>`).join('')}</tbody></table>${days.map((d,i)=>`<tool-tip for="d${i}">${d.count||'No'} contributions on ${d.label}.</tool-tip>`).join('')}`}
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];try{for(const item of cases){
 const context=await browser.newContext({timezoneId:'UTC',viewport:{width:1280,height:1050}}),page=await context.newPage(),source=[],errors=[];let cancelReached;const reached=new Promise(r=>cancelReached=r);page.on('pageerror',e=>errors.push(String(e)));await page.clock.install({time:new Date(item.now)});
 await page.addInitScript(()=>{window.__store={};window.chrome={runtime:{getURL:p=>'https://github.com/__extension/'+p},storage:{local:{get:async key=>key?{[key]:window.__store[key]}:{...window.__store},set:async v=>Object.assign(window.__store,v),remove:async keys=>keys.forEach(k=>delete window.__store[k])}}}});
 await page.route('https://github.com/**',async route=>{const url=new URL(route.request().url());if(url.pathname.startsWith('/__extension/')){const file=path.join(out,url.pathname.slice(13));return route.fulfill({path:file,contentType:file.endsWith('.js')?'text/javascript':'image/png'})}
 if(url.searchParams.has('from')){const year=+url.searchParams.get('from').slice(0,4);source.push(year);if(item.cancel===year){cancelReached();await new Promise(r=>setTimeout(r,500))}return route.fulfill(item.fail===year?{status:403,contentType:'text/html',body:'fixture denied'}:{contentType:'text/html',body:html(year,item.now)}).catch(()=>{})}
 return route.fulfill({contentType:'text/html',body:`<meta name="user-login" content="fixture-viewer"><div class="js-yearly-contributions"><table class="ContributionCalendar-grid"></table>${Array.from({length:item.max-item.min+1},(_,i)=>`<a id="year-link-${item.min+i}"></a>`).join('')}</div>`})});
 await page.goto('https://github.com/fixture-user');await page.addScriptTag({content:fs.readFileSync(out+'/content.js','utf8')});const panel=page.locator('#codeyears-data-probe');await panel.locator('#start-year').selectOption(String(item.year));await panel.locator('#year').selectOption(String(item.end||item.year));await panel.locator('#run').click();
 if(item.cancel){await reached;await panel.locator('#cancel').click()}
 await page.waitForFunction(()=>!document.querySelector('#codeyears-data-probe').shadowRoot.querySelector('#run').disabled);assert.deepEqual(source,item.source,item.name+' source calendar years');
 if(item.fail||item.cancel||item.empty){const status=await panel.locator('#status').textContent();assert(status.includes(item.fail?'HTTP 403':item.cancel?'已取消':'尚无'),item.name+' status '+status);assert.equal(await panel.locator('#scene canvas').count(),0);assert.equal(await panel.locator('#details').isVisible(),false)}else{
 await panel.locator('#scene canvas').waitFor({timeout:30000});await panel.locator('#details summary').click();await page.waitForFunction(()=>document.querySelector('#codeyears-data-probe').shadowRoot.querySelectorAll('tbody tr').length>0);const rows=await panel.locator('tbody tr').evaluateAll(rows=>rows.map(r=>[r.children[0].textContent,+r.children[1].textContent]));assert.equal(rows.length,item.length,item.name);assert.equal(rows[0][0],item.first);assert.equal(rows.at(-1)[0],item.last);assert.equal(new Set(rows.map(r=>r[0])).size,rows.length);let expected=0;for(let t=Date.parse(item.first);t<=Date.parse(item.last);t+=DAY)expected+=count(new Date(t).toISOString().slice(0,10));assert.equal(rows.reduce((s,r)=>s+r[1],0),expected);assert((await panel.locator('#city-summary').textContent()).includes(expected.toLocaleString('en-US')));if(item.warning)assert((await panel.locator('#status').textContent()).includes(item.warning));
 // Confirm the actual City timeline can reach its completed state.
 await panel.locator('#skip').click();assert((await panel.locator('#progress').textContent()).includes('100%'));results.push({name:item.name,days:rows.length,total:expected,first:rows[0][0],last:rows.at(-1)[0],source});
 }
 assert.equal(errors.length,0);if(item.empty||item.fail||item.cancel)results.push({name:item.name,source,status:'stopped'});await context.close();
 }console.log(JSON.stringify({browser:await browser.version(),results,status:'PASS'}))}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
ISO_BROWSER_CASES
node /tmp/codeyears-iso-probe/check.cjs
git diff --check
rm -rf /tmp/codeyears-iso-probe /tmp/codeyears-iso-build
```
