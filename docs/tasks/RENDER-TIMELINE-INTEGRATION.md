# 渲染原型复用时间轴

状态：[PR #10 已提交](https://github.com/wxy/CodeYears/pull/10)，未合入；旧/新实现直接路径验证通过。行为契约与验证范围在修改源码前确定。2026-10-30。

分支 `codex/render-timeline-integration` 从实际 main `a626ab47458586a6dba226c587cbfe03c95d4111` 创建；首步 GitHub fetch 成功后才开始本任务。没有复用其他失败环境的代码。按任务提供的保持行为规范执行，不依赖云端缺失的本机流程技能文件。

## 可观察行为与非目标（修改源码前确定）

- 全量 7305 天仍从 0 生长，约 8 秒活动播放完成。首次帧与继续后的首次帧只建立时间基点，不补算初始化或暂停等待。
- 暂停/继续/跳过保持现有入口；暂停不继续生长，完成与静止不续帧。已经排队的单次补绘可以完成，不能因暂停丢掉 resize/skip 的画面。
- 标签隐藏时取消 RAF 并冻结时间；原先播放的恢复播放，手动暂停的保持暂停；恢复可单次补绘。现有 playing 指标继续表达播放意图，隐藏时不因内部冻结改变该含义。
- resize/skip 在静止状态保留一次补绘；上下文丢失、关闭后不再调度。关闭继续释放几何、程序、上下文与监听。
- City/Terrain 的几何、高度、材质、主题、相机、DPR、输入规则及所有快照字段保持原样。不修改时间轴、数据、缓存、扩展、依赖或全局计划，不新增诊断字段。
- 本任务仅验证独立时间轴到既有 3D 原型的接口；不正式集成扩展，不宣称 P1-G/P2 或新修订的本机 GPU 性能已通过。

## 调用边界与最小替换

现有 `probes/rendering/main.ts` 调用 `createScene` 的 pause/resume/skip/dispose/snapshot，不需要修改。场景复用只读 `src/timeline/controller.ts` 的 `createTimeline` 管理累计播放时长和整数呈现天数；RAF、帧间隔采样、单次补绘、可见性策略和 WebGL 仍由场景持有。复用既有 playing 作为播放意图，控制器可因隐藏暂时冻结；不新增诊断字段，不拆新框架或抽象层。

## 有依据的失败方式与直接检查（修改源码前确定）

1. 将控制器时间戳直接跨过隐藏或暂停区间，导致恢复跳进度。检查暂停冻结、继续首帧、隐藏冻结和恢复首帧。
2. 统一恢复播放误伤手动暂停，或丢失隐藏前播放意图。分别检查手动暂停后隐藏/恢复与播放中隐藏/恢复。
3. 以播放状态为唯一调度条件，或在 pause 时无条件清空 RAF，漏掉静止 resize/skip 的一次补绘。检查自然完成后 resize、暂停后 skip，均落一帧后停止。
4. 完成、上下文丢失或关闭后续帧；或控制器呈现天数没有驱动几何。检查两种视图完整生长到 7305、预期资源/三角形及释放，丢失后交互不重启帧。

先以未改的 main 实现执行同一直接浏览器检查，再最小替换并复跑。City/regular/Signature 与 Terrain/dense/Natural 各一次完整生长及控制路径，不重复六组性能跑分或扩大极端矩阵。用真实 RAF 推进；可见性处理以明确标注的人工 document.hidden 条件诊断，不能当作真实标签验收。没有隔离单元测试需求，也不在实现后补写单元测试。

## 运行方式

仓库根目录，为本轮新建独立系统临时目录：

```sh
render_timeline_tmp=$(mktemp -d /tmp/codeyears-render-timeline.XXXXXX)
npm ci --cache "$render_timeline_tmp/npm-cache"
npm run check
npx tsc --noEmit -p probes/rendering/tsconfig.json
npm run build -- --outDir "$render_timeline_tmp/extension-dist"
npx vite build --config probes/rendering/vite.config.ts --outDir "$render_timeline_tmp/render-dist"
python -m http.server 4176 --bind 127.0.0.1 --directory "$render_timeline_tmp/render-dist"
```

打开本地地址，通过现有按钮和 `window.renderProbe.snapshot()` 观察。旧版与新版构建分别放本轮临时目录的 baseline/candidate 子目录。自动化驱动、日志、浏览器资料和产物仅留在本轮临时目录；完成报告后停止本轮服务并清理。

## 实际交付边界

源码仅改 `src/renderers/probe/scene.ts`，入口保持不变。旧版/新版各两种视图的完整生长、暂停/继续/跳过、静止补绘、上下文丢失和关闭路径已验证；人工可见性条件仅证明处理路径，真实标签行为和新修订的本机 GPU 性能仍待验收。过程中的采样修正、首轮时长断言未通过、最终结果与局限均见 [报告](../reports/RENDER-TIMELINE-INTEGRATION.md)。目标路径通过后停止扩展检查。
