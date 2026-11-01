# 建筑高度与变体选择 · 云端交付报告

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

规划路径复用现有 city-view seed 算法以验证兼容；最终调用方仍负责按年份和成员日期生成稳定 seed，本函数不负责日期哈希。设施保持现有规划频率，未作新增设施或密度优化。

## 未验收与本地组合责任

六张新 PNG 未进入本检出，不声称真实素材加载、H2/H3/H4 标定、视觉或本机验收通过。报告中的 H 和 factor 是选择契约；已有低矮设施的实际高度不因返回 factor 1 而视为 H1 美术达标。

本 PR 是本地组合 PR 的明确依赖：本地完成六张原生 1×1 素材及标定、CITY_UNIT_CATALOG 注册、city-view 接入，并验证标准/两倍复用、地面与高度等比、居中退让、造型差异、遮挡与整体画面、明暗边缘、重播/缩放/平移稳定。这里没有运行浏览器视觉路径，因为新素材及接入均不在本分支；已执行不依赖素材的最小规划路径。

真实 Chrome/Edge、GitHub 会话、实际硬件帧耗时/内存/功耗及最终整体画面仍未验收。仅提交本函数、任务文档与报告；通过独立 PR 向 main 交付，暂不合入。
