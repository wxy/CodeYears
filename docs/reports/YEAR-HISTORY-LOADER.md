# 多年份顺序加载协调器验证报告

日期：2026-10-31。状态：独立前置模块已实现，受控浏览器直接路径验证通过；独立 PR 交付，暂不合入。

## 基线与环境

- 实际 `git fetch origin main` 得到 `a74f059662f542351e27e9074ba9d8d958c120b1`；从 FETCH_HEAD 新建 `codex/year-history-loader`，未继续修改已合入 PR #7。开始时 `git status --short` 为空，未重置或丢弃原有工作。
- 受检源码提交：`216c9a8206b451d5342348053a99e444ccb0135d`；后续提交只新增本报告。修改范围仅新增 load-history.ts、自己的任务与报告。
- 同一 CodeYears 已连接云环境；Linux 6.18.57 / x86_64，Node v24.19.0，npm 11.9.0，TypeScript 7.0.2，Vite 8.3.5，Chromium 154.0.8037.57（Debian 13），HeadlessChrome UA 154.0.0.0。
- 已读 AGENTS、DATA_AND_PRIVACY、DEVELOPMENT_PLAN、CLOUD_DEVELOPMENT、PRODUCT 和现有年度 loader / 组装 / 解析 / 缓存契约；使用现有锁文件与依赖，没有新增测试依赖。

## 实现前失败方式与验证边界

实现前先列出：年份乱序/并发、缺年误报完整、真实零/闰日/数量丢失、强制刷新未透传、第二年失败后继续请求、取消/身份改变后仍请求/报告/写入，以及输入被原地排序。随后先写完整浏览器检查（附录 A），打包验证因新增模块不存在而报 UNRESOLVED_IMPORT，再实现模块；未在实现后新增单元检查。

第一次打包检查脚本时 IIFE 不支持顶层 await，先把临时脚本包进 async main，才取得上述模块缺失的预期红灯。运行浏览器默认权限时 Crashpad socket 被拒；使用工具提供的网络权限后可以启动。file:// 诊断页被环境浏览器策略阻止，最终使用本轮临时回环 HTTP 服务与 DevTools 读出结果，不改浏览器策略、证书或产品配置。所有业务 fetch 均由受控边界返回内存 HTML；未接触真实 GitHub Cookie/Token 或登录资料。

真实模块链：loadContributionHistory → loadContributionYear → 在线身份读取 / year-cache / fetchContributionYear → parseContributionYear → assembleContributionHistory。只替换 fetch 与 chrome.storage.local 的外部实现，不替换年度 loader、解析器、身份比较、缓存校验或组装器。回环页面为一次性诊断，不是产品网站或正式 UI。

## 输入生成与结果

主页 `OcToCat`、已知访问者 `viewer-a` 为虚构输入。固定输入年度 `[2024, 2023]`；逐日以 UTC 日历从 1 月 1 日枚举到 12 月 31 日，0 起始 index。count 为：2 月 29 日或 index % 7 === 0 时为 0，否则为 index % 5 + 1。生成英文 tooltip 与年度标题合计，交给真实 DOMParser 和解析器验证；不使用颜色等级。

| 输入年度 | 生成天数 | 标题与逐日合计 |
| --- | ---: | ---: |
| 2023 | 365 | 936 |
| 2024 | 366 | 932 |

Chromium 实际输出 status PASS，共 9 组检查：

| 检查 | 实际结果 |
| --- | --- |
| 两年升序请求/进度、真实日期/count、零/闰日 | 顺序为 身份→2023→身份→进度2023→身份→2024→身份→进度2024；maxActive=1。最终 731 天全部日期/count 与生成输入严格相等，2024-02-29 count=0 |
| 部分历史/只读与输入不变 | 第一条进度为 partial、provided=[2023]、missing=[2024]，仅365天且数组冻结；之后 complete、missing=[]；输入年份仍为 [2024,2023] |
| 每年作用域缓存命中 | 复用真实 writeYearCache 写出的内存记录；两次缓存 get、零次 set、无年度网络请求，每年仍两次在线身份确认，source 均为 cache |
| forceRefresh 透传 | 对已存在的两年缓存强制刷新：零次 get、两次 set，2023/2024 均年度网络获取 |
| 第二年失败 | 以 [2025,2024,2023] 为目标，2024 年度返回 HTTP 503；Promise 拒绝，仅报告/缓存2023，missing=[2024,2025]，不请求2025 |
| 请求中取消 | 2024 年度 fetch 边界 abort；AbortError 拒绝，仅保留2023进度/写入，不请求2025 |
| currentContext 身份改变 | 2024 年响应时 currentContext 改为 viewer-b；真实年度 loader 拒绝，只缓存/报告2023，不请求2025 |
| 在线会话身份改变 | 2024 年响应后在线身份 HTML 改为 viewer-b；年度 loader 拒绝，不写入第二年、不请求第三年 |
| 回调/预先取消与重复年度 | 第一年进度中取消阻止下一请求；最后一年回调取消也拒绝。已取消 signal 或重复年度均在网络前拒绝 |

来源和缓存 warning 通过每年进度传给调用方；未自行合并或吞掉年度异常。全部成功才返回完整历史；本模块没有持久层、自动重试、并发队列、预取或播放动作。

## 实际命令与复现

本轮独立目录：`/tmp/codeyears-year-loader.IYP4UF`。以下为成功路径实际命令；前述启动/打包失败另列于验证边界，不计为通过。

```sh
git fetch origin main
git rev-parse FETCH_HEAD
git switch -c codex/year-history-loader FETCH_HEAD
mktemp -d /tmp/codeyears-year-loader.XXXXXX
# 实现前先写 checks.js 和 build-check.mjs，再运行取得缺模块红灯。
node /tmp/codeyears-year-loader.IYP4UF/build-check.mjs
# 实现后：
npm ci --cache /tmp/codeyears-year-loader.IYP4UF/npm-cache
npm run check
npm run build -- --outDir /tmp/codeyears-year-loader.IYP4UF/dist
node /tmp/codeyears-year-loader.IYP4UF/build-check.mjs
node /tmp/codeyears-year-loader.IYP4UF/browser-driver.mjs
git diff --check
```

锁文件安装、类型检查、MV3 构建、诊断打包、9组浏览器检查与 diff 检查均通过。在年度返回后增加 signal 检查后，复跑同一既有检查仍 PASS（无新增测试断言）；进度回调后的取消检查自首次实现即存在。正式构建不包含尚未接入入口的协调器，协调器由9模块诊断包在 Chromium 中直接执行。

复现时新建系统临时目录，将下列三个脚本和 HTML 存入该目录；把附录脚本中的 `/tmp/codeyears-year-loader.IYP4UF` 全部替换为新目录。如果仓库路径不同，同样替换 `/workspace/CodeYears`。安装现有依赖后先运行 build-check，再创建 `<临时目录>/browser/check.html`，再运行 browser-driver。驱动启动回环服务和独立临时 Chromium，输出 PASS/FAIL 并关闭本次服务与进程。浏览器启动需要环境允许本地 socket。

`browser/check.html`：

```html
<!doctype html><meta charset="utf-8"><body>RUNNING<script src="check.js"></script></body>
```

## 未验收项与清理

受控 HTML、内存存储和模拟身份不等于真实 GitHub、多账户/退出登录、SSO/私有可见性或真实 chrome.storage.local 验收。未做正式 MV3 入口/UI 集成、Edge、渲染/GPU/后台性能检查；不继承其他提交的硬件 PASS。本模块是集成前置能力，P1-G 的真实身份与浏览器门槛仍按主线报告收敛，不宣称正式 City / Time Travel 完成。

信任已有年度 loader 的身份确认/取消机制及内部已校验记录，不复制 HTML、数量、覆盖或缓存校验。onProgress 是同步回调，已交付快照可由调用方保留；本轮未扩展异步回调或快速往返身份变化的时序矩阵。

所有临时页面、脚本、浏览器资料、日志、npm cache 和构建均在本轮独立系统临时目录；提交仅正式源码和任务/报告，交付结束删除该目录。只通过本地 gh 创建独立 PR，暂不合入，不发额外 GitHub 评论。

## 附录 A：实现前写好的浏览器检查

```js
import { loadContributionHistory } from '/workspace/CodeYears/src/platform/github/load-history.ts';
async function main() {

const assert = (ok, message) => { if (!ok) throw new Error(message); };
const equal = (actual, expected, message) => assert(JSON.stringify(actual) === JSON.stringify(expected), `${message}: ${JSON.stringify(actual)}`);
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const generated = new Map();
function fixture(year) {
  let total = 0;
  const cells = [], tips = [], days = [];
  for (let time = Date.UTC(year,0,1), index = 0; time < Date.UTC(year+1,0,1); time += 86400000, index++) {
    const date = new Date(time), text = date.toISOString().slice(0,10);
    const count = text.endsWith('02-29') || index % 7 === 0 ? 0 : index % 5 + 1;
    total += count;
    days.push({date:text,count});
    cells.push(`<td id="d${index}" data-date="${text}"></td>`);
    tips.push(`<tool-tip for="d${index}">${count || 'No'} contributions on ${months[date.getUTCMonth()]} ${date.getUTCDate()}th.</tool-tip>`);
  }
  const html = `<h2>${total} contributions in ${year}</h2><table class="ContributionCalendar-grid"><tbody><tr>${cells.join('')}</tr></tbody></table>${tips.join('')}`;
  generated.set(year, {days,total,html});
  return html;
}
fixture(2023); fixture(2024);
const context = {profileLogin:'OcToCat',viewer:{state:'known',identity:{kind:'authenticated',login:'viewer-a'}}};
let current, viewer, controller, events, store, gets, sets, hook, liveIndex, active, maxActive;
function reset() {
  current = context; viewer = 'viewer-a'; controller = new AbortController(); events = [];
  store = {}; gets = 0; sets = 0; hook = undefined; liveIndex = 0; active = 0; maxActive = 0;
}
globalThis.chrome = {storage:{local:{
  async get(name) { gets++; return name === null ? structuredClone(store) : {[name]:structuredClone(store[name])}; },
  async set(records) { sets++; Object.assign(store, structuredClone(records)); },
  async remove(names) { for (const name of names) delete store[name]; },
}}};
globalThis.fetch = async (input, options) => {
  const url = new URL(input); const year = url.searchParams.has('from') ? Number(url.searchParams.get('from').slice(0,4)) : undefined;
  const event = year ? `year:${year}` : `live:${++liveIndex}`;
  assert(options.signal === controller.signal, 'signal passed through');
  assert(options.credentials === 'same-origin' && options.cache === 'no-store', 'real network options');
  options.signal.throwIfAborted(); events.push(event); active++; maxActive = Math.max(maxActive,active);
  try {
    await Promise.resolve();
    const status = hook ? await hook({year,event,signal:options.signal}) : undefined;
    options.signal.throwIfAborted();
    const html = year ? generated.get(year)?.html : `<meta name="user-login" content="${viewer}">`;
    assert(html !== undefined || status, `unexpected year ${year}`);
    const response = new Response(html || '', {status:status || 200,headers:{'content-type':'text/html'}});
    Object.defineProperty(response,'url',{value:url.href});
    return response;
  } finally { active--; }
};
const run = (years, forceRefresh, onProgress) => loadContributionHistory(context,years,forceRefresh,controller.signal,()=>current,onProgress);
async function rejects(action, pattern) {
  try { await action(); } catch (error) { assert(pattern.test(error.name+' '+error.message), `wrong rejection ${error}`); return; }
  throw new Error('expected rejection');
}
const passed = [];
reset();
assert(events.length === 0, 'no eager requests');
const input = [2024,2023], progress = [];
const complete = await run(input,false,p => { progress.push(p); events.push(`progress:${p.year}`); });
equal(input,[2024,2023],'input unchanged');
equal(events,['live:1','year:2023','live:2','progress:2023','live:3','year:2024','live:4','progress:2024'],'ascending sequential progress');
assert(maxActive === 1,'one request at a time');
equal(progress.map(p=>[p.year,p.source,p.warning,p.history.status,p.history.providedYears,p.history.missingYears]),[[2023,'network','','partial',[2023],[2024]],[2024,'network','','complete',[2023,2024],[]]],'partial and complete progress');
assert(progress[0].history.days.length === 365,'missing year not filled');
assert(Object.isFrozen(progress[0].history.days),'readonly snapshot');
equal(complete.days,[...generated.get(2023).days,...generated.get(2024).days],'exact daily counts/order');
assert(complete.days.length === 731 && complete.days.find(d=>d.date==='2024-02-29').count === 0,'leap/zero');
passed.push('ascending two-year network load and progress, counts/leap/zero, immutable partial');
// Reuse stored records from the real cache write path; only storage API is simulated.
events=[]; gets=0; sets=0;
const cached=[];
await run([2024,2023],false,p=>cached.push(p));
equal(events,['live:5','live:6','live:7','live:8'],'cache still confirms each viewer');
equal(cached.map(p=>p.source),['cache','cache'],'both cache hits');
assert(gets===2 && sets===0,'two cache reads');
passed.push('per-year validated scoped cache hits');
events=[]; gets=0; sets=0;
await run([2024,2023],true);
equal(events,['live:9','year:2023','live:10','live:11','year:2024','live:12'],'force refresh requests each year');
assert(gets===0 && sets===2,'forceRefresh skips every cache read');
passed.push('forceRefresh reaches both annual loads');
reset(); const failedProgress=[];
hook = ({year}) => year===2024 ? 503 : undefined;
await rejects(()=>run([2025,2024,2023],false,p=>failedProgress.push(p)),/HTTP 503/);
equal(events,['live:1','year:2023','live:2','live:3','year:2024'],'second-year failure stops third');
equal(failedProgress.map(p=>p.history.missingYears),[[2024,2025]],'failure retains partial');
assert(sets===1,'only verified first year stored');
passed.push('second-year HTTP failure rejects and stops remaining requests');
reset(); const reason = new DOMException('controlled cancellation','AbortError');
hook = ({year}) => { if (year===2024) controller.abort(reason); };
const cancelled=[];
await rejects(()=>run([2025,2024,2023],false,p=>cancelled.push(p)),/AbortError/);
equal(events,['live:1','year:2023','live:2','live:3','year:2024'],'in-flight abort stops third');
assert(cancelled.length===1 && sets===1,'abort publishes no unverified year');
passed.push('in-flight signal cancellation rejects and stops remaining requests');
reset(); const changed=[];
hook = ({year}) => { if (year===2024) current={...context,viewer:{state:'known',identity:{kind:'authenticated',login:'viewer-b'}}}; };
await rejects(()=>run([2025,2024,2023],false,p=>changed.push(p)),/身份已改变/);
equal(events,['live:1','year:2023','live:2','live:3','year:2024','live:4'],'currentContext change stops third');
assert(changed.length===1 && sets===1,'changed context never stored/reported second year');
passed.push('currentContext identity change rejected by real annual loader');
reset();
hook=({year})=>{ if(year===2024) viewer='viewer-b'; };
await rejects(()=>run([2025,2024,2023],false),/身份无法确认或已经改变/);
assert(!events.includes('year:2025') && sets===1,'live viewer switch stops third');
passed.push('live session identity change rejected by real annual loader');
reset();
await rejects(()=>run([2024,2023],false,()=>controller.abort(reason)),/AbortError/);
equal(events,['live:1','year:2023','live:2'],'between-year cancellation prevents next request');
reset();
await rejects(()=>run([2023],false,()=>controller.abort(reason)),/AbortError/);
passed.push('progress callback cancellation rejects, including last year');
reset();
await rejects(()=>run([2023,2023],false),/Duplicate/);
assert(events.length===0,'ambiguous requested years reject before network');
controller.abort(reason);
await rejects(()=>run([2023],false),/AbortError/);
assert(events.length===0,'pre-cancelled signal makes no requests');
passed.push('duplicate/pre-aborted inputs stop without network');
document.body.textContent = JSON.stringify({status:'PASS',groups:passed,fixture:[...generated].map(([year,v])=>({year,days:v.days.length,total:v.total})),userAgent:navigator.userAgent},null,2);

}
main().catch(error=>{document.body.textContent=JSON.stringify({status:"FAIL",error:String(error),stack:error.stack});});
```

## 附录 B：诊断打包脚本

```js
import { build } from '/workspace/CodeYears/node_modules/vite/dist/node/index.js';
await build({configFile:false,publicDir:false,build:{outDir:'/tmp/codeyears-year-loader.IYP4UF/browser',lib:{entry:'/tmp/codeyears-year-loader.IYP4UF/checks.js',formats:['iife'],name:'HistoryLoaderCheck',fileName:()=> 'check.js'}}});
```

## 附录 C：浏览器驱动

```js
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, openSync, writeFileSync, mkdtempSync } from 'node:fs';
const root='/tmp/codeyears-year-loader.IYP4UF';
const server=createServer((req,res)=>{
 const script=req.url==='/check.js';
 res.setHeader('Content-Type',script?'text/javascript':'text/html');
 res.end(readFileSync(`${root}/browser/${script?'check.js':'check.html'}`));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const profile=mkdtempSync(`${root}/chromium-cdp-`);
const browser=spawn('chromium',['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore',openSync(`${root}/cdp.log`,'w'),openSync(`${root}/cdp-error.log`,'w')]});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try {
 let port;
 for(let i=0;i<100;i++) {try { port=readFileSync(`${profile}/DevToolsActivePort`,'utf8').split('\n')[0]; break;}catch{await delay(100);}}
 if(!port) throw new Error('Browser port did not become ready');
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 const target=targets.find(t=>t.type==='page');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 let id=0;const calls=new Map();
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(calls.has(m.id)){const {resolve,reject}=calls.get(m.id);calls.delete(m.id);m.error?reject(m.error):resolve(m.result);}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const next=++id;calls.set(next,{resolve,reject});socket.send(JSON.stringify({id:next,method,params}));});
 await call('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/check.html`});
 let body='';
 for(let i=0;i<100;i++) {
  const res=await call('Runtime.evaluate',{expression:'document.body?.textContent',returnByValue:true});
  body=res.result.value||'';
  if(body.includes('"status"')) break;
  await delay(100);
 }
 writeFileSync(`${root}/browser-result.json`,body);
 console.log(body);
 if(!body.includes('"PASS"')) process.exitCode=1;
} finally {socket?.close();browser.kill('SIGTERM');server.close();}
```
