# 年度历史组装验证报告

日期：2026-10-30。任务 C；纯内部组合模块验证通过，尚未集成 UI。

## 基线与环境

- 远端 `origin/main` 经 `git fetch origin` 核实为 `a626ab47458586a6dba226c587cbfe03c95d4111`（PR #6 已合入）。初始本地 work 为 `12b00e2`，`git status --short` 为空，没有未提交工作需要迁移。
- 从 `origin/main` 建立 `codex/contribution-history-assembly`，未修改 main。
- 受检源码提交：`26a6bd77642c761aece2a78b4d64d767e4d3bb11`；后续提交只增加本报告。
- CodeYears 已连接云环境，Linux 6.18.57，Node v24.19.0，npm 11.9.0，TypeScript 7.0.2，Vite 8.3.5；现有锁文件安装，无依赖改动。
- 读取 AGENTS、PRODUCT、DEVELOPMENT_PLAN、CLOUD_DEVELOPMENT、DATA_AND_PRIVACY、PERFORMANCE 及只读数据契约/解析器。

## 实际命令与结果

```sh
git fetch origin
git rev-parse origin/main
git switch -c codex/contribution-history-assembly origin/main
mktemp -d /tmp/codeyears-history.XXXXXX
node /tmp/codeyears-history.Q0w2pT/check.mjs
npm ci --cache /tmp/codeyears-history.Q0w2pT/npm-cache
node /tmp/codeyears-history.Q0w2pT/check.mjs
npm run check
npm run build -- --outDir /tmp/codeyears-history.Q0w2pT/dist
git diff --check
```

先写下面完整检查，再运行；首次运行因 `history.ts` 尚不存在报 ERR_MODULE_NOT_FOUND（红灯）。实现后同一检查打印 `PASS: ordering, leap/zero, partial/empty, ambiguity rejection, immutable snapshot`；类型检查、构建、diff 检查均通过。构建仅验证已有扩展路径仍可构建，未把模块接入入口；新模块由直接检查执行。

最初网络命令在默认权限下不能连接代理；使用工具提供的网络权限后 fetch/gh 正常，无绕过代理。首次普通 `npm ci` 因默认 `/home/agent/.npm/_cacache` 不可写失败；改用独立临时 npm cache 后成功添加 29 个包，锁文件未修改。

## 可复现输入与检查

在仓库 `/workspace/CodeYears`、Node 24 环境，创建新的 `mktemp -d /tmp/codeyears-history.XXXXXX`，把下列内容保存为该目录的 `check.mjs`，运行 `node <该目录>/check.mjs`。若仓库位置不同，只改 import 的绝对路径。输入为确定性内存对象，无真实用户数据；稀疏日期仅用来检查组装器不造数据，年度完整覆盖仍由上游解析器保证。

```js
import assert from 'node:assert/strict';
import { assembleContributionHistory as assemble } from '/workspace/CodeYears/src/data/history.ts';
const record = (year, days, profileLogin = 'OcToCat') => ({year, days, profileLogin, fetchedAt:'2026-10-30T00:00:00Z', parserVersion:2});
const daily = (date, count) => ({date, count});
const old = record(2023, [daily('2023-01-01', 9)]);
const leap = record(2024, [daily('2024-02-29', 0), daily('2024-01-01', 7)]);
const records = [leap, old];
const years = [2024, 2023];
const before = JSON.stringify({records, years});
const full = assemble('octocat', years, records);
assert.deepEqual(full.days, [daily('2023-01-01',9), daily('2024-01-01',7), daily('2024-02-29',0)]);
assert.deepEqual(full.providedYears, [2023,2024]);
assert.deepEqual(full.missingYears, []);
assert.equal(full.status, 'complete');
assert.equal(JSON.stringify({records, years}), before);
for (const value of [full, full.days, ...full.days, full.providedYears, full.missingYears]) assert(Object.isFrozen(value));
leap.days[0].count = 100;
assert.equal(full.days.at(-1).count, 0);
const partial = assemble('octocat', [2025,2023,2024], [old]);
assert.equal(partial.status, 'partial');
assert.deepEqual(partial.missingYears, [2024,2025]);
assert.deepEqual(partial.days, old.days);
assert.equal(assemble('octocat', [2024], []).status, 'partial');
assert.equal(assemble('octocat', [], []).status, 'complete');
assert.throws(() => assemble('octocat', [2023], [old, old]), /Duplicate/);
assert.throws(() => assemble('octocat', [2023], [record(2023, [], 'another')]), /profile/);
assert.throws(() => assemble('octocat', [2024], [old]), /requested/);
assert.throws(() => assemble('octocat', [2023,2023], [old]), /Duplicate/);
console.log('PASS: ordering, leap/zero, partial/empty, ambiguity rejection, immutable snapshot');
```

输入同时覆盖倒序年度与倒序每日数据；2024-02-29 的真实 0 保留；缺少 2024/2025 明确 partial 且不补日；主页大小写兼容；重复期望/记录、跨主页和非所需年度抛错；输入 JSON 不变；返回对象、数组与日对象均冻结，后续修改来源日对象也不会改变结果。

## 未验收范围与交付

本模块信任内部已校验逐日数据，不处理 HTML、数量/日期合法性、年度覆盖、访问者身份识别、缓存或请求竞态；调用方须保证同一有效访问者作用域。complete 只表示期望年度记录齐全，不推进时间轴播放。没有浏览器、真实 GitHub、GPU 测量需求，未声称相关路径通过。

P1-G 仍待真实多账户、Edge、后台与 60Hz 证据；本模块不表示正式 City MVP / P2 完成。未改共享类型、解析、缓存、GitHub 适配、时间轴、全局计划、README、依赖、manifest 或入口。仅正式源码、任务和本报告入 Git。临时检查、npm 缓存和构建在独立系统临时目录，交付前删除；不保留原始日志或生成数据。

PR 将通过本地 gh 创建、base main，不合入、不额外评论；最终 PR 链接由交付消息提供。
