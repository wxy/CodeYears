# City 0.1.0 里程碑归档

日期：2026-11-03。本报告记录本轮发布前归档与复核，不代表Chrome商店已通过审核。用户确认初步版本已提交审核，并再次明确CodeYears仍在审核中。

## 版本与冻结包

- #53材料/官网链接、#54三张本地化截图与两张宣传图块，均已核对无冲突、CI通过、无未处理审核意见，按用户授权保留历史合入。
- 本轮归档基线为 `0f572bd92a21d4f9812c2ec5cacac89293184a53`。运行代码与 `7498d324c8c2d082871d479ea04592ee4af247a2` 一致；后续改动仅为文档和正式媒体。缩放组件没有在本轮实施。
- 保留的冻结候选为 `release/codeyears-0.1.0-city.zip`：0.1.0，79文件，112526864 bytes，SHA-256 `b0f004a227a68d8acce314343cf91cc053121a35ca09f009aa48106a99208018`。ZIP与当前项目dist的入口、面板、渲染器一致，全部通知文件也一致。
- 用户在Google控制台实际选择的ZIP未由工具独立读取。GitHub附件沿用此前提供的冻结候选，不为归档重打、替换或撤回商店审核。
- 商店素材压缩包 `codeyears-store-media-2026-11-03.zip`：8文件，1988966 bytes，SHA-256 `6e2ee17454e024deaf7b0773230f27aaf33b5e0b11fbd5ca594345c245225a76`。保留正式媒体、来源和日期说明；素材制作时的状态文字属于历史记录。

## 已完成的本地清理

- 移除 `work/icon-concepts`、`work/local-city-browser`、`work/local-city-performance`、`work/store-visuals` 和 `work/website-codeyears` 五个完成的独立检出。逐个确认Git工作区干净、提交已合入相应主线、没有以其为工作目录的进程；未发现待保留的用户环境文件。
- `work/reports/PR-4-5-REVIEW-2026-10-30.md` 是唯一未纳入Git的历史报告，已迁入 `docs/archive/reports/` 并加日期说明，不删除审查结论。
- 清理已合入主线的本地分支，包括仅建立、尚无实现的缩放分支。未强制删除未知提交；有一个分支仍跟踪旧PR引用，解除该旧关联后以Git普通安全检查删除。
- 三个未合并的旧集成分支已推送 `archive/2026-11-03/…` 标签并逐个核对提交；用户明确确认清单后删除旧本地分支引用。已放弃的图片分享实验包含在归档历史中，不进入0.1.0代码。
- 删除旧 `codeyears-0.1.0-city-rc-20261102.zip` 及其校验文件；旧ZIP为112526882 bytes，SHA-256 `f178bf6e63d50b5092e90f7c20b6cc9c9d0d7cb479efb6c46278e4fed5091898`，与最终候选的隐私状态文字、渲染分包不同，已被最终包替代。
- 保留当前dist（用户正在加载的目录）、开发依赖、当前候选及校验文件、商店媒体包、全部正式源素材与设计板。清理前后逐文件SHA-256确认原有assets、当前ZIP和媒体ZIP不变。
- 另一个活动任务的 `codex/poster-010-review` 检出位于Dot目录，未清理、合入或改写；它不属于旧检出。

## 远程分支状态

初次批量删除被自动审批拒绝后，用户对具体56项清单明确授权“按清单删除这些历史分支”。执行前重新核对全部HEAD与归档标签，以预期提交租约和原子推送删除56个远程历史分支，再清理3个已保存标签的旧本地引用；执行后复查只有main、当前归档与另一个活动海报分支。详细提交见[清理记录](../archive/BRANCHES-2026-11-03.md)。

## 验证与限度

本轮只改文档和归档，不新增运行功能；本机类型检查通过，不手动重复完整构建、真实浏览器、20年性能或账户矩阵。CI仍按现有工作流运行；已有功能证据继续绑定原报告和对应SHA。

```sh
python3 scripts/verify-city-package.py release/codeyears-0.1.0-city.zip --build-dir dist
git diff --exit-code 7498d324c8c2d082871d479ea04592ee4af247a2 -- src public scripts package.json package-lock.json vite.config.ts tsconfig.json PRIVACY.md LICENSE ASSETS.md THIRD_PARTY_NOTICES.md
git diff --check
```

实际结果：79文件、版本、CRC、清单、引用、权限和通知全部通过；运行源码、配置、打包通知与冻结基线无差异；文档差异检查通过。这是对现有正式构建和冻结包的复核，不宣称本轮产生新的fresh build。

发布说明源见[双语版本说明](../releases/v0.1.0.md)，正式发布结果以[GitHub v0.1.0](https://github.com/wxy/CodeYears/releases/tag/v0.1.0)为准。Chrome审核与GitHub发布分开记录。临时清理计划和命令过程输出在交付后清除，仅长期保留正式报告。
