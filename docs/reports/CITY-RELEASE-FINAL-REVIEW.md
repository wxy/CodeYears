# City 首发最终组合独立审查

日期：2026-11-02（Asia/Shanghai）。结论：**本次指定最终组合未发现阻断 Chrome 首发的代码或重大公开说明问题；有一项 P3 隐私说明遗留需同步。** 这不是商店发布批准，也不把未覆盖的安装/后台/硬件范围写成通过。只读审查，不自动修复。

## 审查对象与方法

| 对象 | 固定完整 SHA |
| --- | --- |
| 共同基线 / PR base `codex/city-first-release-rc` | `0116ceac5d6785b3ddc595fe1937e5d047213c11` |
| #47 页内菜单、键盘、批次让出、每日表删除 | `af0d675f3ab1d245d2e88d01e728bc06cc636889` |
| #48 原生 Options / 构建打包 | `3bde9516125fc909c7e3e5722b25a7268fe677fd` |
| #49 README / 商店文案 / 示例图 | `77d94fc082801fd4edc8c7b62212e1d9ec83ecaf` |

工作区起始干净。正常 fetch 后核实基线和三个 PR head 完整 SHA，新建 `codex/city-release-final-review`。基线不含这三个开放 PR，因此在 TMP 解出基线，再依次应用各 PR 相对共同起点 `e3a609e84a821b2a792711c888f63f27edc120e5` 的完整 binary diff；三份补丁均直接应用成功，无人工冲突取舍。报告分支没有 cherry-pick 或带入其他人的源码/图片提交，只有本报告。

用户指定 `goal-driven-review`；已查完整云技能目录、executor 技能目录、仓库及环境技能位置，未找到同名 SKILL.md，不能声称执行了该技能包。本次采用目标→可能失效路径→源码/既有证据→最小组合核验→严重性判定的方法。已读取 AGENTS、首发任务、本地验收、产品/隐私/性能约定；以最新用户授权为准，不恢复已取消的 A/B 账户要求。

## 可操作发现

### P3：公开隐私说明仍承诺已删除的每日明细入口

位置：[固定基线 PRIVACY.md 第21行](https://github.com/wxy/CodeYears/blob/0116ceac5d6785b3ddc595fe1937e5d047213c11/PRIVACY.md#L21)。组合中该文件不由三个 PR 修改，仍写“也可展开每日明细”。

证据：#47 最终 `src/extension/content.ts` 第81–94行仅有主页操作、帮助和图例，已经删除每日表/入口；第222–226行仍用局部 `visibleDays` 计算总量。[#47 最终源码](https://github.com/wxy/CodeYears/blob/af0d675f3ab1d245d2e88d01e728bc06cc636889/src/extension/content.ts#L222)。#49 的 README 与商店正文已同步删除该功能，本地最终验收也确认无 table/#details。

建议：由隐私文档维护者删除该句中“也可展开每日明细”，保留原有刷新/清除的身份作用域说明。本审查不改文件。此项是公开操作说明不同步，不是数据读取、存储、删除范围被隐瞒，也没有造成内部精确数据丢失；判为非阻断 P3，不为它扩张实现或重跑 UI 矩阵。

## 按首发目标的判定

| 目标 / 失效风险 | 本次审查证据与判定 |
| --- | --- |
| 激活、取消、导航后旧结果复活 | entry.ts 第127–147行的 selection/disposed/active 检查保留；第200–209行导航/pagehide/隐藏走 dispose/deactivate。content.ts 第199–215行在动态模块、批次执行前检查请求；abort 立即 dispose 对应 field。deactivate 第260–263行先置 inactive、abort、清 controller，再释放与清状态；旧 finally 只在 controller 相同时解锁。未发现本轮新增的晚到回填或旧请求清掉新状态。 |
| 0ms 让出破坏顺序或 resolve 合同 | content.ts 第183、204–218行仍由同一 painting Promise 链顺序 await field.updateDays；load-history.ts 第31–38行仍升序加载并交付冻结年度快照。landscape.ts 第126–131行仅在规划前让出普通任务，恢复立即检查 assetAbort/disposed/generation；第134–149行仍等素材、先画新层再换层，随后才 resolve；未等待650ms动画。串行调用不会互相递增代次而淘汰，取消后不会进入规划。未发现顺序、快照或取消合同被打破；不扩张成未要求的并发 API。 |
| 释放与输入监听遗留 | landscape.ts 第152–155行 abort、代次、RAF、observer/媒体监听、键盘监听及图片释放成套保留；prepare/loadCityImages 的晚到结果有取消关闭路径。content.ts 第282行移除新增 document 监听。既有本机五轮关闭归零为外部证据，未在云端重做性能/长周期认证。 |
| More / 展开 / Esc 吞原页面操作 | outsidePointer 只关 More，不 preventDefault 或强抢焦点；composedPath 跨两个 ShadowRoot。escapeMenu 仅 active+More open 时消费 Escape 并恢复 summary；dialog.cancel 统一 collapse、搬回同一 panel/toolbar。closedby=any 交给目标 Chrome 原生 light-dismiss，不增加全页坐标猜测。scene 方向键只在本身聚焦、target为host、无修饰键时处理，dispose移除。结合已给出的最终真实Chrome遮罩/内容/Esc证据，无新增阻断；未重复整个 UI 矩阵。 |
| Options / locale / manifest / 打包不一致 | 组合 manifest 相比基线只新增 options_ui；原权限、GitHub content_scripts、WAR和CSP完全一致。options.ts 复用语言读/存/resolve，只读写语言键，失败回原偏好；entry.ts 第18行原 storage.onChanged 联动仍在，popup.ts 未改。Vite多入口与显式options/shared JS清单对应；本次实际组合包79文件核验通过。现有用户原生Options/Saved/刷新与GitHub联动证据不冒充本云端新增实测。 |
| 删除表格误删精确数据/缓存/总量/绘制 | 原 src/data、src/cache、src/platform/github 全部文件与固定基线逐字节一致；删除的是表格DOM、tbody与仅供表格使用的面板状态。content.ts 第207行仍把真实筛选快照交给renderer，第222–226行仍以原count求和；history组装复制原date/count并冻结，不补零。city-view/weekly/parcels映射未被本轮改变；构建renderer/content也逐字节匹配#47最终源文件。无数据丢失发现。 |
| README / 商店 / 隐私重大不实 | README/中英商店正文只宣称City与当前菜单/Options；准确限定Chrome候选、未发布、Edge未验收；不宣称暂停/跳过/重播、独立分享、60FPS或完整预算通过。说明ISO范围/装饰/合成截图；两图SHA及1280×800尺寸与metadata一致，保留e3a609e截图源SHA，不冒称最终提交截图。隐私的GitHub自动入口、语言键、缓存作用域和无遥测/后端与代码相符；唯一直接功能遗留见上方P3。 |

以上行号指本次固定组合中的源文件；#47文件与其最终提交完全相同，Options/打包文件来自#48。base中的词库/图例同步仍保留。未把“词库里还有未使用的 dailyData key”当作运行功能或阻断。

## 现有 PR 审核意见

通过 `gh pr view --json headRefOid,reviews,comments,statusCheckRollup`、REST pulls/comments 与 GraphQL reviewThreads 核对：

| PR | 实际审核状态与判断 |
| --- | --- |
| #47 | Code Review 摘要无发现，但对应旧 `d6f009563332766697ef24cf0b03765a71affe1f`；不覆盖最终批次/遮罩/每日表删除。当前行内线程0；本次独立检查最终差异，无可归为阻断的具体遗漏。 |
| #48 | Code Review 摘要对应最终 `3bde951...`，无发现，行内线程0；本次组合核对未发现反证。 |
| #49 | Code Review 摘要无发现，但对应旧 `d1623e68273595e949d6f616ede6abaefa90db02`；不覆盖最终文案同步。当前行内线程0；本次按实际源码/本机证据逐项核对其后续说明，无重大不实。 |

没有现存的具体行内问题需要确认真假或降级；“摘要完成”不等于最终 head 已被自动审核，安全摘要的 null 也不解释为全面安全保证。三个指定最终 head 的 GitHub verify 均实际 SUCCESS：[#47](https://github.com/wxy/CodeYears/actions/runs/41455101153)、[#48](https://github.com/wxy/CodeYears/actions/runs/41444776958)、[#49](https://github.com/wxy/CodeYears/actions/runs/41455117833)。这些单 PR CI 不替代本次组合核验。

## 本次实际命令与结果

正常连接使用现有环境/代理，命令显式启用网络；无新增Token/独立登录/后端。环境Linux、Node v24.19.0、npm11.9.0、Python3.12.14。仅在TMP组合副本执行：

```sh
# 在报告分支工作区创建TMP并组合；三个PR的共同起点仍为e3a609e
review_tmp=$(mktemp -d /tmp/codeyears-final-review.XXXXXX)
mkdir "$review_tmp/combined"
git archive 0116ceac5d6785b3ddc595fe1937e5d047213c11 | tar -x -C "$review_tmp/combined"
for pr_head in af0d675f3ab1d245d2e88d01e728bc06cc636889 3bde9516125fc909c7e3e5722b25a7268fe677fd 77d94fc082801fd4edc8c7b62212e1d9ec83ecaf; do
  git diff --binary e3a609e84a821b2a792711c888f63f27edc120e5 "$pr_head" > "$review_tmp/$pr_head.patch"
  git -C "$review_tmp/combined" apply "$review_tmp/$pr_head.patch" || exit 1
done
cd "$review_tmp/combined"
npm ci --cache "$review_tmp/npm-cache"
npm run check
npm run package:city
python3 scripts/verify-city-package.py release/codeyears-0.1.0-city.zip
# 报告完成后回到工作区并删除整个review_tmp
```

全部实际退出0；package:city内含check/build，不另外重复构建。本次Linux ZIP为79文件、112,526,878 bytes，SHA-256 `b83cac1a93d2591536f0c4ca5c64aad278beac3b2731bb2db7652f26f03279f1`；landscape.js为147631 bytes、SHA-256 `543bf4f799b71599c27ea5eac15dded874409b12325c53796f350d92effcc0ac`；manifest SHA-256 `7a7cc95598af604c91927563d8cb71a7be06ec85f90003445e186827ffb7ec53`。

本地既有报告的ZIP/renderer哈希与本Linux构建不同；本次仅确认指定源码组合及自身新鲜构建的CRC/正式清单/版本/引用/权限/通知通过，不声称逐字节复刻本机产物，也未取得本机文件作字节差异定位。manifest哈希与本地记录相同。没有将这次CLI核验写成真实MV3或商店安装验收。

另以Python只读比对确认：数据/缓存/平台、entry/popup/language、package/锁文件、所有运行PNG均与固定基线一致；manifest只加options_ui；content/landscape源文件等于#47最终文件；两张商店PNG哈希/尺寸匹配元数据。未新增单元测试或通用校验框架，没有重复此前UI矩阵/二十年性能跑分；本次没有需要另造浏览器流程才能判定的未决代码疑点。

## 未覆盖与交付边界

- 既有真实Chrome156菜单/遮罩/内容点击/Esc焦点，以及用户原生Options/English Saved/刷新和GitHub联动，由本地主代理/用户提供；未冒称本次云端操作。每日表删除已获授权及真实中英验收。
- 已有本机三密度7301天自然完成、常规2747.4ms/最长任务93ms及五轮关闭Canvas/位图/待执行RAF归零，只说明报告中对应条件，不推导60FPS、精确GPU、功耗或长期内存预算。
- Edge、真实后台、干净安装/首次站点提示、商店账户仍未验证；这些既有发布外部条件不能由源码审查消除。没有上传、审核或发布。缩放百分比/最大倍率继续后置。
- 用户已取消隔离测试账户/A-B切换；该矩阵未覆盖，不作为本轮索取账号/密码/Cookie的阻塞，不改既有身份逻辑。
- TMP中的补丁、组合源码副本、示例图副本、安装缓存、构建、ZIP、GitHub响应及日志在结束时清理；Git只新增本报告，无运行修改、他人提交或过程产物。不合入本报告PR或其他PR。
