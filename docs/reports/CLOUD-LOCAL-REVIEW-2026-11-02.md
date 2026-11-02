# 三项云端工作 · 本地审查与验收

日期：2026-11-02，Asia/Shanghai。用户要求审查昨晚任务与对应PR，重点检查平房/分级并完成必要本地验收，暂不合入，不扩大次要边界。此次为只读审查及验收，仅新增本报告；未修改云端代码、报告原文、运行映射或素材。

## 完成情况与审查范围

| 任务 | PR/最终提交 | 结论 |
| --- | --- | --- |
| 包核验/只读CI | [#40](https://github.com/wxy/CodeYears/pull/40)，`7e635ee7a2b88b55af54fcb0852ca14d6b49c93f` | 限定范围通过，无阻断发现 |
| 渐进加载验证 | [#41](https://github.com/wxy/CodeYears/pull/41)，`6e11289d86b6e9edabe5dc6c5324397813a5ea09` | 验证已交付；缓存身份请求被误判FAIL，应纠正文档，不能删身份复核 |
| 平房素材/分级 | [#42](https://github.com/wxy/CodeYears/pull/42)，`295459e7000f7a70bddf23616f93bb1ef0700587` | 10款PNG及设计方案真实存在，可作设计候选；尚未达到运行接入验收 |

三个云端chat最终turn均completed/idle，PR均OPEN，base均为codex/city-profile-tabs。GitHub对应head的自动代码审核均completed且has_any_findings=false；逐行reviewThreads为空，没有尚待回复的逐行审核意见。安全审核状态completed不等于本次完成专项安全审计。审查读取了全部改动范围、讨论与报告，不因自动审核无发现而省略实物核对。

发行核验与加载报告分别由只读子代理独立核对，主代理负责素材、分级及唯一浏览器验收。没有修改、合入、发布三个PR或向其添加评论。

## PR #40：发行核验

只新增约定的四个文件。CI为contents: read，checkout不保留凭证，无Secrets、产物上传、发布、自动合入或pull_request_target。脚本使用既有新鲜构建与发行允许清单，未扩张产品权限。

本地从git show导出正式脚本到独立TMP，以只读symlink提供所需仓库元数据，执行：

```sh
python3 TMP/scripts/verify-city-package.py release/codeyears-0.1.0-city.zip --build-dir /Volumes/MacSSD/develop/CodeYears/dist
```

正式ZIP 63文件、0.1.0、退出0；SHA-256为`7194f61976d9d2c3dc8d0a0e6bf1dbea1892fbd2dfb44a4a472000c4b7dfcbd8`，前后不变。三个独立损坏样本——缺content.js、额外合成.env、增加cookies权限——分别以1退出，错误对应准确。临时脚本/链接/样本已清理，未改dist/release。

GitHub实际两轮verify均SUCCESS：[push](https://github.com/wxy/CodeYears/actions/runs/41312243167/job/124864855328)、[PR](https://github.com/wxy/CodeYears/actions/runs/41312265614/job/124864924329)。素材分发权、安装验收和完整性能不是脚本可证明的事项。

## PR #41：报告裁决

**P2文档误判，高置信度。** 报告第7、137–143行将完整缓存仍联网确认身份标成FAIL。`docs/DATA_AND_PRIVACY.md:54`明确要求缓存命中仍实时确认访问者、不提供离线缓存展示；`load-year.ts:37/45`实现该约定。原始请求计数和断网结果有效，但结论应是“符合当前身份隔离协议；缓存避免年度数据请求，不承诺零网络”。此项不是运行缺陷；不应为消除FAIL而删除、放宽或共享身份确认。原PR待纠正，不在本次只读审查中代改。

独立重算云端公式：1092日/15153次、2024单年364日/4988次、20个ISO年7301日，以及稀疏1007/常规100947/密集438217均一致。报告区分skip强制完成与自然完成，其二十年自然时限“待验证”处置合理。未发现需要据此修改生产算法的证据。

### 本地补验：常规二十年自然完成

环境为本机macOS26.6.2、Chrome156.0.8078.76，独立Chrome窗口；正式dist/landscape.js与PNG，host1400×700，prefers-reduced-motion=false。运行源码检查点`6d17c18f18d6f30b57d21b4a16c0c8becc4de6b1`，本地HEAD后续仅文档。正式模块SHA-256：`d0dd4bed88def496dcb7f46ac8ef0d9048baf6845bd1768c2cf4a522396468b2`。没有重新构建相同源码，也没有调用skip/replay或注入动画帧。

临时页先“创建空场地”，后“填入二十年数据”。输入与云端常规公式完全一致：

```js
const isoStart=y=>{const d=new Date(Date.UTC(y,0,4));return +d-((d.getUTCDay()+6)%7)*86400000};
const years=Array.from({length:20},(_,i)=>2006+i), days=[];
for(let t=isoStart(2006);t<isoStart(2026);t+=86400000){
  const date=new Date(t).toISOString().slice(0,10);
  const i=(t-Date.UTC(2006,0,1))/86400000,y=+date.slice(0,4);
  days.push({date,count:i%11<3?0:(i*17+y*3)%39});
}
const field=createLandscape(host,[],onChange,'city',undefined,true,years);
await field.updateDays(days); // 返回后继续由正式RAF自然填入
```

复现时把临时HTML/脚本置于TMP，通过127.0.0.1:4199服务，/dist只读指向项目正式dist；按钮负责上述调用。被动封装RAF、drawImage与createElement，仍委托原API；仅在totalDays=7301首次completed时记录完成时间。独立“观察静止窗口”用1500ms墙钟timeout读取前后计数，不轮询/驱动帧，不在窗口内进行其他UI操作。临时持有canvas引用仅用来检查显式尺寸归零，不证明GC、进程内存或显存回收。

| 检查 | 本地实际结果 |
| --- | --- |
| 空场地 | 1主画布、3非零画布，素材请求0；尚未交付任何日期，场地已有绘制 |
| 数据范围 | 2006-01-02至2025-12-28，共7301日、100947次 |
| 自然完成 | completed，revealedDays/totalDays=7301/7301；素材21请求，未调用强制完成 |
| 本轮墙钟 | 素材与规划准备1560.2ms；updateDays resolve至自然完成745.1ms |
| 完成后1500ms | RAF28→28、drawImage58227→58227，计数稳定 |
| 关闭 | 主画布0，记录到的133个canvas均宽高归零，非零0 |
| 关闭后1500ms | RAF32→32、drawImage58227→58227，计数稳定 |

650ms是插值时钟目标，不是本次已取得的严格墙钟上限；本机样本约745ms自然完成，只限定通过常规二十年“可以自然结束/静止/关闭”路径。输入动作前后自动化自身有少量RAF计数，未归为应用持续帧；结论取独立无操作窗口。没有因此调参或扩建调度；稀疏/密集自然完成、FPS/长任务/功耗/内存预算、后台和真实MV3仍不在本次通过范围。CPU标识的默认沙箱读取失败，没有将未取得的硬件字段写成事实。

## PR #42：素材与分级

本地复核10款候选的SHA-256、RGBA、尺寸、alpha范围及alpha>8裁框均与manifest一致；矩阵为4平房+2单格低层+2横向+2纵深。10款所选轴的shear/vertical映射均为±0.5，记录退让均≥0.1；embedded manifest与JSON一致。该代数检查只验证所选线与包络，不能证明所有图像细边或隐藏角点准确。actualPeakHeightH均null且runtimeIntegrated=false，记录没有冒充精确实测或已集成。

将PR42的正式设计文件和四张既有引用从Git导出到TMP，通过127.0.0.1:4198展示原HTML。独立Chrome中成功加载10款和既有参考、表格10行、两张画布；浅/深切换和标尺隐藏目视通过。PNG未作像素修改；测试截图只临时观察，不保存。没有重跑不受设计文件影响的npm ci/build，也没有把设计板当作正式City集成。

**设计判断：** 四款平房轮廓/材质/院落可辨，方向与用户要求一致，推荐保留作为低贡献候选。固定绝对等级优先于随已加载最大值变化的相对等级；同一count跨年/批次的档位可保持一致，但邻域/合并/图片仍可能变化。建议以以下表作为待用户确认的首版候选，不在审查中冻结或接入：

| 真实每日count | 候选 |
| --- | --- |
| 未知/未来 | 待填充，不算0 |
| 0 | 自然地块；城市邻域才允许广场/铺装 |
| 1–2 | 平房 |
| 3–5 | 低层住宅/商住 |
| 6–19 | 公寓/楼房 |
| 20–49 | 办公/较高楼房 |
| 50+ | 大厦 |

10个相对分档合成对照计算复核一致；切点并非由真实用户分布优化得出，仍是提案。

**接入前待办，不作为设计PR新增的隐藏代码缺陷：** `shop-wide`所选支撑包络约0.718×0.331格，放在2×1逻辑地块上偏小；`shop-deep`约0.268×1.121格，放在1×2上偏窄。设计板现场可见其与同组合联排的密度差异。README第34/45/47/49行已披露退让、窄长和推断限制，因此不是未报告的生产回归；建议接入前重新确定原生占地或重新生成适合宽深比/高度的单元，不靠横向拉伸或强撑满修补。四角/峰值推断及原始光晕也须接入前复核，不能把RGBA存在等同透明边缘已美术通过。可以先审设计方向，暂不宣布10款都已生产可用。

本轮未制作新图片、变更分档或把候选复制进运行资源。素材权利和最终艺术取舍由维护者确认；不将MIT代码许可扩张为全部位图分发结论。

## 停止与留存

未见阻断运行主线的新增代码问题；PR40限定通过，PR41需要纠正文档误判，PR42设计可审但接入条件尚未完成。所有PR保持未合入。此次只归档验收报告到原PR39；正式代码、三个云端PR和用户未跟踪assets均不修改。临时服务/浏览器标签、导出文件、脚本、输入、计数与截图全部清理，只长期保留本报告。
