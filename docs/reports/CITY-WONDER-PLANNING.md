# City 奇观纯布局交付报告

日期：2026-11-01。基线 `c25436b0e2cfd418eb4c74a29a9be2f529d53623`；分支 `codex/city-wonder-planning`。仅新增 `src/renderers/city-wonders.ts`、本报告，并增量修改 `src/renderers/city-parcels.ts`。旧 #22/#23/#24 的合入历史不改动；新 PR 交付，暂不合入。

## 实际接口与行为

`planWeeklyCity(days, mergeTallRectangles = false, wonders = false)` 保留前两参数语义。第三参数默认关闭，现有调用不会生成奇观；开启时在普通同档合并前排名、预留候选，再由原合并算法处理未使用的每日 cell，避免拆坏已经合并的地块。`CityParcel.wonder?` 为 `wonder-stadium | wonder-theater | wonder-park`，普通 cell/parcel 不新增该属性。

候选只含完整加载的 3×3 或 4×3，不跨年度、七天行边界或季度道路，不填缺失/未来日期。3×3 选择 theater；4×3 按年度与格坐标整数种子的奇偶稳定选 stadium/park，不依赖缩放、播放或时钟。每年最多两处，按排名贪心预留，成员不重叠；不强制凑两处。

初版门槛：活跃 `count>0` 至少 90%，建筑 `count>5` 至少 80%，已有 `band>=2` 至少 75%，各项向上取整。3×3 分别要求 9、8、7 个，4×3 要求 11、10、9 个。先按建筑密度降序，再按试排分数 `mean * sqrt(w*d)` 降序，以贡献强度与覆盖面积兼顾，减少较小窗口均值优势；并列按 block/z/x 升序、宽度降序。允许异档成员，奇观 kind 为 building、band 为成员已有最高档；原始 cells 的 kind/band 不变。所有 indices 保留，日期通过原输入索引查询；count 是成员真实合计，mean 是合计/成员数，不添加虚构贡献或修改分档阈值。

以上门槛、排名和每年上限是初版设计参数，尚未证实是最佳策略。最高 band 是聚合元数据，不代表素材物理高度。连续每日 6 次在没有更高峰值时也可进入相对较高档，不额外添加绝对贡献门槛。

## 实际验证

Linux 云端，Node v24.19.0、npm 11.9.0、Vite 8.3.5。没有登录数据、Token、缓存或权限改动。

- `npm ci --cache /tmp/codeyears-wonder-npm-cache --no-audit --no-fund`：PASS，29 packages，锁文件未变。
- `npm run check`、`npm run build -- --outDir /tmp/codeyears-wonder-build`、`git diff --check`：PASS。仓库外构建目录警告正常。
- 临时纯路径诊断 19 个场景 PASS：密集异档可聚合，三个 id 可产生且稳定；全零/稀疏/纯低值不产生；3×3 中高档 7/9 接受、6/9 拒绝；内部缺日期、季度路、年首尾/跨年、不完整尾段不跨；排名保留高均值区域而非首个遍历区域。
- 所有场景检查成员唯一完整、矩形内索引/日期归属、逐地块 count/mean、季度边界、奇观门槛与最高 band、每年最多两处；重复调用一致，原输入和每日分类不变。
- 三类 20 年输入均 7305 天。默认关闭与显式 false，分别在 mergeTallRectangles 的 false/true 下，与 main 基线完整规划结果深度相等。

| 20 年输入 | 真实总量 | 普通地块（长条开启） | 开启奇观后地块 | 奇观数 |
| --- | --- | --- | --- | --- |
| 密集异档 | 406645 | 7305 | 6865 | 40（每年 2） |
| 常规混合 | 133508 | 6245 | 6213 | 5 |
| 全零 | 0 | 2928 | 2928 | 0 |

密集输入为 2006-01-01 起连续 7305 天，count 循环 12/35/120。常规输入按下方取模规则，全零只保留日期。完整诊断包含断言和重复规划，其耗时不能作为单次算法耗时、FPS、内存或本机预算。没有补写单元测试，只执行一次性直接路径诊断。整理报告时临时命令分隔符冲突产生三个空文件，已清理，没有进入提交。

## 正式 LCG 数据复核与评分修正

本轮按本地同数据反馈，仅把建筑密度之后的均值排名改为 `mean * sqrt(area)`，真实 mean/count、门槛、每年上限及坐标 tie 均不变；不为类型设置配额。评分是试排参数，非验证出的最优方案。与修正前 `6838613` 比较，直接调用正式 `src/renderers/probe/data.ts` 的 `generateDays`；3 年取生成结果中 2023–2025，保留完整 LCG 历史，不重置种子。

| 正式输入 | 天数 / 真实总量 | 修正前 theater / 4×3 | 修正后 theater / 4×3 | 修正后 stadium / park | 普通 / 奇观地块 |
| --- | --- | --- | --- | --- | --- |
| regular 3 年 | 1096 / 13729 | 6 / 0 | 6 / 0 | 0 / 0 | 877 / 850 |
| regular 20 年 | 7305 / 93171 | 37 / 3 | 28 / 12 | 7 / 5 | 5878 / 5688 |
| dense 3 年 | 1096 / 139777 | 6 / 0 | 0 / 6 | 2 / 4 | 402 / 387 |
| dense 20 年 | 7305 / 913530 | 39 / 1 | 0 / 40 | 17 / 23 | 2809 / 2713 |

密集样本的 4×3 不再被小窗口均值排序系统性压后，常规 20 年也增加；常规 3 年仍全部为剧院，不承诺每类数据都有大占地或每种造型。原 19 场景与新增 4 组正式路径共 23 场景通过相同主路径断言：日期/数量守恒、成员不重叠、边界、门槛、分类/mean 不变、每年上限与确定性。正式 4 组默认关闭结果亦与基线深度相等；npm check/build 和 diff 检查通过。复现脚本包含旧评分对照，未增加单元测试。

## 启用与未验收边界

本地组合须接入 wonder 字段与三张原生素材：stadium 4×3、theater 3×3、park 4×3（实际高度以本地标定为准）；在同一份已校验数据上对比普通与 `planWeeklyCity(days,true,true)`。本分支未改 city-view/assets/catalog/landscape/preview，未取得三张新图，不声称素材加载、标定高度、对照页面、真实 Chrome 或最终画面验收通过。不能只开启第三参数而遗漏绘制端 wonder 选择与目录注册。

本地负责最终集成、同数据视觉对照和真实浏览器验收，本 PR 只提供纯布局依赖，暂不合入。park 依然是贡献成员的聚合表现；原低值 cell 语义不变，造型不代表活动类型，不增加游戏系统。

## 复现

仓库根目录执行。Node 直接加载 TypeScript 需要扩展名，以下仅在临时副本补 `.ts`；正式源码沿用项目 Bundler import，其余逻辑相同。输入、脚本、构建和缓存均清理，只保留报告。

```sh
npm ci --cache /tmp/codeyears-wonder-npm-cache --no-audit --no-fund
npm run check
npm run build -- --outDir /tmp/codeyears-wonder-build
mkdir -p /tmp/codeyears-wonder-probe
git show c25436b0e2cfd418eb4c74a29a9be2f529d53623:src/renderers/city-parcels.ts > /tmp/codeyears-wonder-probe/baseline.ts
python3 - <<'PY'
from pathlib import Path
root=Path('/tmp/codeyears-wonder-probe')
s=Path('src/renderers/city-parcels.ts').read_text().replace("'./city-wonders'", "'./city-wonders.ts'")
(root/'city-parcels.ts').write_text(s)
(root/'city-wonders.ts').write_text(Path('src/renderers/city-wonders.ts').read_text())
import subprocess
(root/'previous-wonders.ts').write_text(subprocess.check_output(['git','show','6838613:src/renderers/city-wonders.ts'],text=True))
(root/'previous-parcels.ts').write_text(s.replace("'./city-wonders.ts'", "'./previous-wonders.ts'"))
(root/'probe-data.ts').write_text(Path('src/renderers/probe/data.ts').read_text())
PY
cat > /tmp/codeyears-wonder-probe/check.mjs <<'JS'
import assert from 'node:assert/strict';
import {generateDays} from './probe-data.ts';
import {planWeeklyCity as previous} from './previous-parcels.ts';
import {performance} from 'node:perf_hooks';
import {planWeeklyCity as plan} from './city-parcels.ts';
import {planWeeklyCity as baseline} from './baseline.ts';
const date=i=>new Date(Date.UTC(2024,0,1)+i*86400000).toISOString().slice(0,10);
const rectangle=(x,z,w,d,counts=[12,35,120])=>Array.from({length:w*d},(_,i)=>({date:date((x+i%w)*7+z+Math.floor(i/w)),count:counts[i%counts.length]}));
const wonders=p=>p.parcels.filter(p=>p.wonder);
let scenarios=0;
function check(days){
 const before=JSON.stringify(days),p=plan(days,true,true),seen=new Set(),byIndex=new Map(p.cells.map(c=>[c.indices[0],c]));
 assert.equal(JSON.stringify(days),before);assert.deepEqual(plan(days,true,true),p);
 assert.deepEqual(p.cells,plan(days,true,false).cells);
 for(const q of p.parcels){
  assert.equal(q.indices.length,q.w*q.d);assert.equal(q.count,q.indices.reduce((s,i)=>s+days[i].count,0));assert.equal(q.mean,q.count/q.indices.length);
  const district=p.districts[q.block];assert(!district.breaks.some(x=>q.x<x&&x<q.x+q.w));
  for(const i of q.indices){assert(!seen.has(i));seen.add(i);const c=byIndex.get(i);assert.equal(c.block,q.block);assert(c.x>=q.x&&c.x<q.x+q.w&&c.z>=q.z&&c.z<q.z+q.d);assert.equal(+days[i].date.slice(0,4),district.year);}
  if(q.wonder){
   assert.equal(q.kind,'building');assert.equal(q.d,3);assert.equal(q.w,q.wonder==='wonder-theater'?3:4);
   const m=q.indices.map(i=>byIndex.get(i));assert(m.filter(c=>c.count>0).length>=Math.ceil(m.length*.9));assert(m.filter(c=>c.count>5).length>=Math.ceil(m.length*.8));assert(m.filter(c=>c.band>=2).length>=Math.ceil(m.length*.75));assert.equal(q.band,Math.max(...m.map(c=>c.band)));
  }
 }
 assert.equal(seen.size,days.length);assert.equal(p.parcels.reduce((s,q)=>s+q.count,0),days.reduce((s,q)=>s+q.count,0));
 for(let block=0;block<p.blocks;block++)assert(wonders(p).filter(q=>q.block===block).length<=2);
 scenarios++;return p;
}
const theater=check(rectangle(2,1,3,3));assert.equal(wonders(theater).length,1);assert.equal(wonders(theater)[0].wonder,'wonder-theater');assert(new Set(theater.cells.map(c=>c.band)).size>1);
const ids=new Set();
for(const z of [0,1]){const p=check(rectangle(2,z,4,3));assert.equal(wonders(p)[0].w,4);ids.add(wonders(p)[0].wonder);}
assert.deepEqual([...ids].sort(),['wonder-park','wonder-stadium']);
for(const counts of [[0],[0,0,12],[1]])assert.equal(wonders(check(rectangle(2,1,4,3,counts))).length,0);
assert.equal(wonders(check([...rectangle(2,1,4,3,[6]),{date:date(300),count:120}])).length,0);
// Keep maximum count 120 to set the existing band scale. Seven of nine band>=2 passes; six fails.
const seven=rectangle(2,1,3,3,[35]);seven[0].count=6;seven[1].count=6;seven[8].count=120;
assert.equal(wonders(check(seven)).length,1);const six=structuredClone(seven);six[2].count=6;assert.equal(wonders(check(six)).length,0);
// Twelve cells allow one zero, but never two; a 3x3 fallback may still qualify.
const oneZero=rectangle(2,1,4,3,[35]);oneZero[5].count=0;assert.equal(wonders(check(oneZero))[0].w,4);
const missing=rectangle(2,1,3,3);missing.splice(4,1);assert.equal(wonders(check(missing)).length,0);
const road=check(rectangle(12,1,3,3));assert(road.districts[0].breaks.includes(13));assert.equal(wonders(road).length,0);
const early=Array.from({length:14},(_,i)=>({date:new Date(Date.UTC(2023,0,1)+i*86400000).toISOString().slice(0,10),count:35}));assert.equal(wonders(check(early)).length,0);
const end=Array.from({length:14},(_,i)=>({date:new Date(Date.UTC(2024,11,25)+i*86400000).toISOString().slice(0,10),count:35}));assert.equal(wonders(check(end)).length,0);
const partial=rectangle(2,1,3,3).slice(0,8);assert.equal(wonders(check(partial)).length,0);
const ranked=check([...rectangle(2,0,3,3,[12]),...rectangle(7,0,3,3,[35]),...rectangle(17,0,3,3,[120])]);assert.deepEqual(wonders(ranked).map(q=>q.x),[17,7]);
const dense=Array.from({length:7305},(_,i)=>({date:new Date(Date.UTC(2006,0,1)+i*86400000).toISOString().slice(0,10),count:[12,35,120][i%3]}));
const regular=dense.map((q,i)=>({...q,count:i%13===0?120:i%7===0?35:i%5===0?12:i%3===0?6:i%6}));
const summaries=[];
for(const [name,days] of [['dense',dense],['regular',regular],['zero',dense.map(q=>({...q,count:0}))]]){
 for(const tall of [false,true]){assert.deepEqual(plan(days,tall),baseline(days,tall));assert.deepEqual(plan(days,tall,false),baseline(days,tall));}
 const start=performance.now(),p=check(days),elapsed=performance.now()-start;
 if(name==='dense'){assert.equal(wonders(p).length,40);assert(p.districts.every((_,b)=>wonders(p).filter(q=>q.block===b).length===2));}
 if(name==='zero')assert.equal(wonders(p).length,0);
 summaries.push({name,days:days.length,total:days.reduce((s,q)=>s+q.count,0),ordinary:plan(days,true).parcels.length,parcels:p.parcels.length,wonders:wonders(p).length,probeMs:+elapsed.toFixed(1)});
}
console.log(JSON.stringify({status:'PASS',scenarios,variants:[...ids,'wonder-theater'],summaries}));
const lcg=[];
for(const density of ['regular','dense'])for(const years of [3,20]){
 const days=generateDays(density).filter(q=>years===20||q.date>='2023-01-01');
 for(const tall of [false,true])assert.deepEqual(plan(days,tall),baseline(days,tall));
 const p=check(days),old=previous(days,true,true);
 const summarize=q=>({theater:wonders(q).filter(v=>v.w===3).length,wide:wonders(q).filter(v=>v.w===4).length,ids:wonders(q).reduce((s,v)=>(s[v.wonder]=(s[v.wonder]??0)+1,s),{})});
 const current=summarize(p),before=summarize(old);
 if(density==='dense')assert(current.wide>0);assert(current.wide>=before.wide);
 lcg.push({density,years,days:days.length,total:days.reduce((s,d)=>s+d.count,0),before,current,ordinary:plan(days,true).parcels.length,parcels:p.parcels.length});
}
console.log(JSON.stringify({lcg,scenarios,status:'PASS'}));
JS
node --experimental-strip-types /tmp/codeyears-wonder-probe/check.mjs
git diff --check
rm -rf /tmp/codeyears-wonder-probe /tmp/codeyears-wonder-build /tmp/codeyears-wonder-npm-cache
```
