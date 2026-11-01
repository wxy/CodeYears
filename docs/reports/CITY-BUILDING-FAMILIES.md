# 建筑高度、长条合并与变体选择 · 云端交付报告

日期：2026-11-01。本轮从 `0a10a652e11cedcfdc0deffe9dd173c264df6bbb` 继续，更新原分支 `codex/city-building-families` 和 PR #22，不新建 PR、不合入。首轮基线仍为 `ac876352e899528669a6a760240d14818c2398b6`。下方历史证据仅对应首轮，当前结果以本节为准。

## 实际实现

仅修改授权的四个文件。H3 合并顺序为 2×1、1×2、1×1；H4 为 2×2、2×1、1×2、1×1。H2 保持 2×2、1×1；不开放三格占地，不改同档、道路、年度边界、日期、数量或强度映射。H3/H4 长条按 w/d 分别选择 wide/deep A/B 固定 id，factor 1；H4 2×2 仍选 apartment-h2-a/b、factor 2。由调用方提供稳定 seed，不随缩放或播放变化。

## 实际检查

环境沿用 Linux、Node v24.19.0、npm 11.9.0、现有已安装锁文件依赖（本轮未重装、未改依赖）。

- `npm run check`：PASS。
- `npm run build -- --outDir /tmp/codeyears-building-strips-build`：PASS，三个构建完成；仓库外目录提示为正常警告。
- 十二种合法组合 × seed 0–255，共 3072 次主选择：候选、factor、相同输入稳定、输入不变均通过。
- 16 个直接规划场景：H3/H4 两方向两格可合、两方向三连成为 2+1、跨季度路不合；H4 2×2 保持、H3 2×2 拆两个 2×1；混档不合、H2 两方向长条均不开放、跨年度不合，均通过。
- 2006–2025 共 7305 天：6245 地块、3777 建筑，总量 133508。索引完整且唯一、逐地块数量守恒、同档成员、年度/季度边界、规划重复稳定及输入不变均通过。该分布产生 445 个 H3 2×1，其他新长条由上述受控场景覆盖，不将此 20 年样本称作所有占地覆盖。
- `git diff --check`：PASS。没有补写单元测试。检查通过后停止扩展范围。

## 复现本轮直接路径

在仓库根目录执行；一次性脚本无需保存到仓库：

```sh
npm run check
npm run build -- --outDir /tmp/codeyears-building-strips-build
node --experimental-strip-types --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { planWeeklyCity } from './src/renderers/city-parcels.ts';
import { selectCityBuilding as select } from './src/renderers/city-building-style.ts';
const cases=[
[1,1,1,'townhouse-a','mixed-use-b',1],[1,2,1,'police-a','fire-b',1],[1,3,3,'stadium-a','terminal-b',1],
[2,1,1,'apartment-h2-a','apartment-h2-b',1],[2,2,2,'townhouse-a','mixed-use-b',2],
[3,1,1,'office-h3-a','office-h3-b',1],[3,2,1,'office-wide-h3-a','office-wide-h3-b',1],[3,1,2,'office-deep-h3-a','office-deep-h3-b',1],
[4,1,1,'tower-h4-a','tower-h4-b',1],[4,2,2,'apartment-h2-a','apartment-h2-b',2],[4,2,1,'tower-wide-h4-a','tower-wide-h4-b',1],[4,1,2,'tower-deep-h4-a','tower-deep-h4-b',1]];
for(const [band,w,d,a,b,factor] of cases) {
 const p={band,w,d},before=JSON.stringify(p),ids=new Set();
 for(let seed=0;seed<256;seed++){const r=select(p,seed);assert.deepEqual(r,{id:seed%2?b:a,factor});assert.deepEqual(select(p,seed),r);ids.add(r.id);}
 assert.equal(ids.size,2);assert.equal(JSON.stringify(p),before);
}
function fixture(points) {
 const days=Array.from({length:366},(_,i)=>({date:new Date(Date.UTC(2024,0,1)+i*86400000).toISOString().slice(0,10),count:0}));
 days[365].count=120;
 for(const [x,z,count] of points)days[x*7+z].count=count;
 const plan=planWeeklyCity(days);
 return plan.parcels.filter(p=>p.x<50&&p.kind==='building');
}
let scenarios=0;
function expect(points,shapes){assert.deepEqual(fixture(points).map(p=>[p.band,p.w,p.d]),shapes);scenarios++;}
for(const [band,count] of [[3,35],[4,120]]) {
 expect([[2,0,count],[3,0,count]],[[band,2,1]]);
 expect([[2,0,count],[2,1,count]],[[band,1,2]]);
 expect([[2,0,count],[3,0,count],[4,0,count]],[[band,2,1],[band,1,1]]);
 expect([[2,0,count],[2,1,count],[2,2,count]],[[band,1,2],[band,1,1]]);
 expect([[12,0,count],[13,0,count]],[[band,1,1],[band,1,1]]);
}
expect([[2,0,120],[3,0,120],[2,1,120],[3,1,120]],[[4,2,2]]);
expect([[2,0,35],[3,0,35],[2,1,35],[3,1,35]],[[3,2,1],[3,2,1]]);
expect([[2,0,35],[3,0,120]],[[3,1,1],[4,1,1]]);
expect([[2,0,12],[3,0,12]],[[2,1,1],[2,1,1]]);
expect([[2,0,12],[2,1,12]],[[2,1,1],[2,1,1]]);
const annual=planWeeklyCity([{date:'2023-12-31',count:120},{date:'2024-01-01',count:120}]);
assert.equal(annual.parcels.length,2);assert(annual.parcels.every(p=>p.indices.length===1));scenarios++;
const days=Array.from({length:7305},(_,i)=>({date:new Date(Date.UTC(2006,0,1)+i*86400000).toISOString().slice(0,10),count:i%13===0?120:i%7===0?35:i%5===0?12:i%3===0?6:i%6}));
const before=JSON.stringify(days),plan=planWeeklyCity(days),seen=new Set(),counts={};
for(const p of plan.parcels){
 for(const i of p.indices){assert(!seen.has(i));seen.add(i);assert.equal(Number(days[i].date.slice(0,4)),plan.districts[p.block].year);}
 assert(!plan.districts[p.block].breaks.some(x=>p.x<x&&x<p.x+p.w));
 assert.equal(p.count,p.indices.reduce((s,i)=>s+days[i].count,0));
 assert(p.indices.every(i=>plan.cells.find(c=>c.indices[0]===i).band===p.band));
 if(p.kind==='building'){
  const row=cases.find(([band,w,d])=>band===p.band&&w===p.w&&d===p.d);assert(row);
  const hash=Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791),seed=(hash^(hash>>>16))>>>0;
  const r=select(p,seed);assert(row.slice(3,5).includes(r.id));assert.equal(r.factor,row[5]);assert.deepEqual(select(p,seed),r);
  const key=`H${p.band}:${p.w}x${p.d}`;counts[key]=(counts[key]??0)+1;
 }
}
assert.equal(seen.size,days.length);assert.equal(JSON.stringify(days),before);assert.deepEqual(planWeeklyCity(days),plan);
assert.equal(plan.parcels.reduce((s,p)=>s+p.count,0),133508);
console.log(JSON.stringify({combinations:cases.length,seedCalls:cases.length*256,scenarios,days:days.length,parcels:plan.parcels.length,buildings:plan.parcels.filter(p=>p.kind==='building').length,total:133508,counts,status:'PASS'}));
JS
git diff --check
rm -rf /tmp/codeyears-building-strips-build
```

## 未验收范围与本地组合责任

本分支未取得八张新长条 PNG，不宣称素材已加载、H3/H4 原生比例或本机视觉验收通过；原六张 1×1 素材也未进入本检出。这里交付规划与选择依赖，本地负责生成/标定/登记素材、在 city-view 接入函数，并将本提交组合进已有功能 PR #24，完成最终加载、比例、遮挡、整体画面和缩放/播放稳定验证。无真实 Chrome/Edge 会话或硬件性能验收。本分支 city-view 仍为原有选择逻辑，构建成功仅证明当前源码可构建，不能视为新长条已完成运行时接入。

临时脚本、缓存、构建不提交；仅保留可复现报告。原 PR #22 更新后仍不合入。

---

# 首轮建筑高度与变体选择 · 历史报告

日期：2026-11-01。基线 `ac876352e899528669a6a760240d14818c2398b6`，分支 `codex/city-building-families`。范围与八项完整映射见[任务契约](../tasks/CITY-BUILDING-FAMILIES.md)。

## 实际实现与结果

新增唯一运行接口 `selectCityBuilding`，type import 现有 CityParcel。由调用方提供稳定 seed，函数按无符号 32 位奇偶选 A/B，仅返回 id 与统一 factor；不读视口、时间或随机源，不修改输入。以合法地块为前提按 band 和宽度分支，无重复输入校验。保留现有规划的全部合法占地与设施，不改合并、数量或设施频率。

Linux 云端，Node v24.19.0、npm 11.9.0、Vite 8.3.5：

| 检查 | 实际结果 |
| --- | --- |
| `npm ci` | 首次因默认 `/home/agent/.npm/_cacache` 不可写而失败；改用下列临时缓存成功，29 packages；锁文件未改 |
| `npm run check` | PASS |
| `npm run build -- --outDir /tmp/codeyears-building-families-build` | PASS；扩展三个构建均完成，目录在仓库外提示为正常警告 |
| 八组合直接执行 | 每组 seed 0–255，共 2048 次主选择，各有且只有指定两个候选，factor 全匹配；相同输入重复执行一致，输入不变 |
| 20 年现有规划路径 | 2006–2025 共 7305 天，6690 地块、4222 建筑，总量 133508；成员索引唯一完整覆盖，合计守恒，全部建筑匹配合法候选与 factor，选择后规划快照不变 |
| `git diff --check` | PASS |

构建只验证当前基线扩展仍能构建。新函数尚未被 city-view 引用，不以此声称函数已打入运行包或新素材已加载。没有新增或补写单元测试；下列是一次性受控直接路径复现，输入和产物不提交。

## 复现

在仓库根目录执行，使用现有锁文件与代理/CA：

```sh
npm ci --cache /tmp/codeyears-building-npm-cache --no-audit --no-fund
npm run check
npm run build -- --outDir /tmp/codeyears-building-families-build
node --experimental-strip-types --input-type=module <<'JS'
import assert from 'node:assert/strict';
import { selectCityBuilding as select } from './src/renderers/city-building-style.ts';
import { planWeeklyCity } from './src/renderers/city-parcels.ts';
const cases = [
  [1,1,1,'townhouse-a','mixed-use-b',1],
  [1,2,1,'police-a','fire-b',1],
  [1,3,3,'stadium-a','terminal-b',1],
  [2,1,1,'apartment-h2-a','apartment-h2-b',1],
  [2,2,2,'townhouse-a','mixed-use-b',2],
  [3,1,1,'office-h3-a','office-h3-b',1],
  [4,1,1,'tower-h4-a','tower-h4-b',1],
  [4,2,2,'apartment-h2-a','apartment-h2-b',2],
];
for (const [band,w,d,a,b,factor] of cases) {
  const p={x:4,z:1,w,d,band,block:0,kind:'building',
    indices:Array.from({length:w*d},(_,i)=>i),count:12*w*d,mean:12};
  const before=JSON.stringify(p), ids=new Set();
  for(let seed=0;seed<256;seed++) {
    const result=select(p,seed);
    assert.deepEqual(result,{id:seed%2?b:a,factor});
    assert.deepEqual(select(p,seed),result); ids.add(result.id);
  }
  assert.equal(ids.size,2); assert.equal(JSON.stringify(p),before);
}
const days=Array.from({length:7305},(_,i)=>({
  date:new Date(Date.UTC(2006,0,1)+i*86400000).toISOString().slice(0,10),
  count:i%13===0?120:i%7===0?35:i%5===0?12:i%3===0?6:i%6
}));
const weekly=planWeeklyCity(days), before=JSON.stringify(weekly), seen=new Set();
for(const p of weekly.parcels) {
  for(const i of p.indices) { assert(!seen.has(i)); seen.add(i); }
  if(p.kind!=='building') continue;
  const row=cases.find(([band,w,d])=>band===p.band&&w===p.w&&d===p.d);
  assert(row);
  const hash=Math.imul(p.block+1,73856093)^Math.imul(p.x+1,19349663)^Math.imul(p.z+1,83492791);
  const seed=(hash^(hash>>>16))>>>0, result=select(p,seed);
  assert(row.slice(3,5).includes(result.id)); assert.equal(result.factor,row[5]);
  assert.deepEqual(select(p,seed),result);
}
assert.equal(seen.size,days.length);
assert.equal(weekly.parcels.reduce((s,p)=>s+p.count,0),days.reduce((s,p)=>s+p.count,0));
assert.equal(JSON.stringify(weekly),before);
console.log({days:days.length,parcels:weekly.parcels.length,
  buildings:weekly.parcels.filter(p=>p.kind==='building').length,
  total:days.reduce((s,p)=>s+p.count,0),status:'PASS'});
JS
git diff --check
rm -rf /tmp/codeyears-building-families-build /tmp/codeyears-building-npm-cache
```

规划路径复用现有 city-view 基于 block/x/z 的 seed 算法以验证兼容；由调用方提供稳定 seed，不随缩放或播放变化。设施保持现有规划频率，未作新增设施或密度优化。

## 未验收与本地组合责任

六张新 PNG 未进入本检出，不声称真实素材加载、H2/H3/H4 标定、视觉或本机验收通过。报告中的 H 和 factor 是选择契约；已有低矮设施的实际高度不因返回 factor 1 而视为 H1 美术达标。

本 PR 是本地组合 PR 的明确依赖：本地完成六张原生 1×1 素材及标定、CITY_UNIT_CATALOG 注册、city-view 接入，并验证标准/两倍复用、地面与高度等比、居中退让、造型差异、遮挡与整体画面、明暗边缘、重播/缩放/平移稳定。这里没有运行浏览器视觉路径，因为新素材及接入均不在本分支；已执行不依赖素材的最小规划路径。

真实 Chrome/Edge、GitHub 会话、实际硬件帧耗时/内存/功耗及最终整体画面仍未验收。仅提交本函数、任务文档与报告；通过独立 PR 向 main 交付，暂不合入。
