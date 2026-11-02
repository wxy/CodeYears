# City 审查合入与发行准备

日期：2026-11-01。环境：本机 macOS、Node v26.7.0、Python 3.14.6。审查使用 goal-driven-review，目标是合入无严重问题的 City 主线，#35 暂缓，再推进发布必要事项；没有上传商店、创建公开 Release 或宣布上线。

## 审查与实际合入

读取各 PR 的 body、reviews、评论和逐行线程，并沿当前改动检查首发 UI、整周归年/源年筛选、路网/桥/年份地带、素材加载与释放、图标和缩放采样。未发现阻断这些 PR 合入的问题；没有未处理的逐行意见。#31/#33/#34 的自动摘要覆盖旧提交，不能当成当前提交全量通过；本轮直接复核相应最终差异。#36 后续自动审核已覆盖最终 `3958f99`，code_review completed/has_any_findings=false，security_review completed 且无逐行发现。

| 顺序 | PR / 交付 | 实际 merge commit |
| --- | --- | --- |
| 1 | #31 图片城郊 | `41e785707396a757ae6a4f19556860c706b9f80c` |
| 2 | #32 City 首发 UI | `cd74230074927d7651ebbae61e44ccaef58719f3` |
| 3 | #33 整周街区、贯通道路和年份绿带 | `a63059bf7b6e125b9e268b70c4772afb4a103bb1` |
| 4 | #34 已选 C 正式图标 | `6497479e95ddb10478d2f9703dbac993aef945f1` |
| 5 | #36 原生保存提示、普通年份文案与缩放采样 | `12518a9affb692f6b9b44ee3f18faf672d6eca4a` |

全部使用 merge 保留历史及精确 head 匹配。#33 在前两项合入后被 GitHub 提示冲突；本地 ort 合并没有内容冲突，同步 main 后树与原 `fcaf594` 完全相同，再合入。

#36 旧历史曾包含 #35。将本 PR 两项提交重排到已合入依赖的 main，保留历史报告，移除 #35 祖先；重排前 `533d21e` 与最终 `3958f99` 文件树完全相同。通过精确旧 SHA 的 force-with-lease 更新原 PR 后合入。最终查询 #35 仍为 **OPEN / DRAFT**，未单独或连带合入。

最终 City 只提示“调整缩放和平移后，在图上右键保存或复制”；运行源码及正式 City 预览无 exportImage/createCityShare/city-share/LandscapeImage/navigator.share/toBlob/toDataURL/contextmenu 残留。保留渲染所需离屏缓存，不提供独立图片生成或分享服务。

合入前实际运行 `npm ci --offline`、`npm run build`（含 check）、以下预览类型检查及 `git diff --check`，全部通过。图标 8 处 manifest 引用尺寸及构建字节与源文件一致；没有 CI checks，未把空检查列表描述成 CI 通过。

```sh
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM,DOM.Iterable --strict --skipLibCheck --types node,chrome --resolveJsonModule probes/city/main.ts probes/city/wonders.ts
```

真实 Chrome/MV3 原生菜单检查、用户保存反馈和此前 City 功能证据见 [原生保存报告](CITY-EXPORT-AND-ZOOM.md)、[整周接入报告](CITY-ISO-INTEGRATION.md)。本轮未刷新或改变用户正在观看的城市；不把本次静态/构建核对写成重复完成真实浏览器验收。

## 新分支与发布准备范围

从已合入 main `12518a9` 建立 `codex/city-release-preparation`，通过新的 PR 交付：

- package、lock、manifest 统一为 `0.1.0` 候选；只改版本元数据，不改权限或运行行为。此前全零版本不满足 Chrome 版本要求。
- 按用户明确选择补 MIT；Three.js 0.186.1 完整 MIT 声明随包提供。生成位图来源、代码与素材许可边界分开说明，不称权利核查已全部完成。
- 用户隐私说明解释主动注入、GitHub 同源请求、最小身份信息、缓存有效期与手动清除；过期不等于物理删除。准备 City 商店文案、权限字段依据和公开 URL 候选，不增加网站。
- `npm run package:city` 先构建，再用 Python 标准库按清单写 ZIP。只含运行文件与必要许可/隐私文件，根目录直接有 manifest；文件排序、固定 ZIP 时间/权限，不修改 PNG。输出到已忽略的 `release/`，不提交产物。

## 发行命令与针对性结果

```sh
npm run package:city
python3 scripts/package-city.py
git diff --check
```

完整构建和 ZIP 检查通过。第二条命令用同一构建重打包，验证同一工具环境的可复现性；两次 SHA-256 相同。

| 产物 | 实际结果 |
| --- | --- |
| `release/codeyears-0.1.0-city.zip` | 62 文件，97,947,300 bytes，约 93.41 MiB |
| SHA-256 | `ee650f16e403dfff105bb102cf9d2cf6068924da9011e6cea39153b9ac2578bb` |
| 内容核对 | ZIP CRC 全部通过；manifest 版本与 package/lock 一致，popup 脚本、1 个动态分包、图标及许可/隐私引用齐全 |
| 城市图片 | 48 张 PNG，共 97,741,109 bytes；ZIP 与 public 逐字节相同，未缩放、改色或改标定 |
| 排除内容 | 无源码、设计板、node_modules、测试输出、source map 或本地缓存；用户未跟踪的 assets/ 未触碰、未暂存 |
| 失败路径 | 在忽略的 dist 临时改成全零版本或加入 cookies 权限，实际打包命令均在覆盖候选前拒绝；原候选 SHA 不变，随后恢复 manifest |

输入为完整构建的 dist/public 正式资源；校验使用 Python ZipFile.testzip、JSON、PNG 头尺寸、逐文件字节比较、popup/dynamic import 路径核对和 hashlib SHA-256。测试命令通过 stdin 运行，未新增事后单元测试；临时改动恢复，没有留下测试输入、截图或日志。只保留本报告和正式本地发行候选，ZIP/构建不入 Git。

本轮改变版本、文档与打包流程，未改用户交互、解析、缓存、渲染或素材；因此选择构建及真实打包路径验证，不重复登录/刷新用户页面或扩大端到端矩阵。

## 仍需完成

1. 包体 93.41 MiB，几乎全部是 PNG。优先评估不损害视觉与投影的资源压缩，再结合当前二十年首屏/播放/缩放平移、静止/后台和重复关闭的性能验收；不为小装饰扩展功能。
2. 真实 A/B/退出登录及私有可见性、当前安装包完整路径；Edge 独立验收，未通过前不宣传已完整支持。鼠标缩放闪动仍待用户最终观感反馈，不能将采样修正推断写成已彻底解决。
3. 生成素材分发范围确认、无私有数据的正式商店截图、隐私 URL 在 main 合入后公开可访问检查，以及维护者账户/控制台字段。
4. 审核通过和公开发布尚未执行。新发布准备 PR 不沿用旧 PR 的合入授权；待审查后决定下一步。
