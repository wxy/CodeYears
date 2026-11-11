# 小镇统一尺度运行资源验证

后续版本：地貌背景、年份方向、材质道路与更宽松的32日合并已继续更新，见[本轮报告](TOWN-LANDSCAPE-V2.md)。下文保留共同尺度接入当时44张资源及对应验证快照。

日期：2026-11-11。基线：2103aee 隔离工作树；本报告只覆盖离线资源管线，贡献规划、页面切换和正式浏览器地图由集成任务另行验证。

`scripts/town-scale.mjs` 从设计预览抽出实际尺度准备；预览与 baker 共用测得的门/成人尺度，不再按地面包络缩小。`scale-sprites.js` 共用投影和 alpha 清理，`work-window.js` 共用同一 life-0 演员及逐项瓶子/木撑裁切；工坊人物已烘焙到 mage-0。原始设计 PNG 未修改。

成人参考高 0.8、普通门 1.0；魔法温室半身推定、圆基底和设施参考仍按各观察文件记录的误差/推定处理，不将本次输出升级为物理测量。运行素材排除旧动物组合、长椅和未选建筑。

每栋独立庭院侧 .3、后 .2、前 .8；court.width=W+.6，depth=D+1。building 原点在 court 内 (.3,.2)。doorX/doorZ 相对 building 原点，gateX 相对 court 原点；court PNG 原点即 court 原点。两层精确命名 court-<id>-back/front，材质/自然断口/院门使用既有 private-courtyards.js。镜像交换 W/D、doorX/Z；全部新实例按 factor=1 使用。

## 复现

macOS，本机 Google Chrome Headless，Node v26.7.0；baker 只监听 127.0.0.1。无需网络下载或 Token。

```sh
node --check scripts/town-scale.mjs
node --check scripts/bake-town-assets.mjs
node --check scripts/preview-town-scale.mjs
node --check probes/fantasy-city/scale-sprites.js
node --check probes/fantasy-city/work-window.js
node scripts/bake-town-assets.mjs --outDir public/assets/town-runtime --catalog src/renderers/town-baked-catalog.json --board "$TASK_TMP/baked-board.png" --proof "$TASK_TMP/baked-proof.json"
node scripts/preview-town-scale.mjs --outDir "$TASK_TMP/scale-preview" --metrics "$TASK_TMP/scale-preview-metrics.json"
```

TASK_TMP 须设为当次系统临时目录。设计预览仅在当前 catalogue 仍具备旧农场三素材时绘制旧版比较；新版 catalogue 已停用 forms-7-x 时只绘制新版，不伪造旧比较。

## 实际结果

- 44 张 PNG 与 catalogue 一一对应；总压缩字节 2,364,185。全部为非空 RGBA、长边 ≤384、四条边保持透明留白。全量解码 RGBA 理论像素存储约 9,674,712 字节；运行时仍按选中 ID 解码，这不是内存峰值测量。
- 12 个建筑方向、24 张独立围院前后层、8 类居民／树／公共设施；三个镜像的宽深与门坐标互换通过检查。围院尺寸及命名检查通过。
- 实际 Chrome 完成源 PNG → 共用尺度投影 → 窗内居民合成 → alpha 清理 →裁切 PNG，查看了44资源总览、mage-0及其围院前后层。瓶子/木撑保留在人物前方；没有新增源图人物缩放规则。
- 共享设计预览实际完成17帧、9类建筑和11座围院，newFactor=1、workWindowActors=1、农舍/畜舍围院 noOverlap=true；查看了新农场图。
- 本阶段执行 JS 语法检查和上述浏览器资源路径。未新增单元测试；未在资源子任务重复 npm ci/check/build，主集成任务负责完整构建及地图E2E。

## 建筑真实占地及门位

| ID | 建筑 W×D | 围院 W×D | gateX | doorX / doorZ |
|---|---:|---:|---:|---:|
| cottages-1 | 1.315440×1.234943 | 1.915440×2.234943 | 0.912266 | 0.612266 / 1.128835 |
| forms-0 | 1.704396×4.033760 | 2.304396×5.033760 | 1.148718 | 0.848718 / 3.779318 |
| forms-0-x | 4.033760×1.704396 | 4.633760×2.704396 | 4.079318 | 3.779318 / 0.848718 |
| stable-0 | 1.051067×1.133741 | 1.651067×2.133741 | 0.596186 | 0.296186 / 0.925639 |
| magic-0 | 2.074180×2.074180 | 2.674180×3.074180 | 1.490031 | 1.190031 / 1.310815 |
| magic-2 | 2.765560×5.263070 | 3.365560×6.263070 | 1.682780 | 1.382780 / 5.263070 |
| magic-2-x | 5.263070×2.765560 | 5.863070×3.765560 | 5.363070 | 5.263070 / 1.382780 |
| magic-3 | 4.102564×3.294329 | 4.702564×4.294329 | 2.351282 | 2.051282 / 3.294329 |
| mage-0 | 2.157160×0.960913 | 2.757160×1.960913 | 1.087465 | 0.787465 / 0.592098 |
| guild-0 | 5.229513×3.538462 | 5.829513×4.538462 | 0.957300 | 0.657300 / 3.144322 |
| guild-0-x | 3.538462×5.229513 | 4.138462×6.229513 | 3.444322 | 3.144322 / 0.657300 |
| academy-0 | 5.972686×5.972686 | 6.572686×6.972686 | 1.294162 | 0.994162 / 4.244579 |

## PNG 清单

| 文件（均在 public/assets/town-runtime） | 像素 | 字节 |
|---|---:|---:|
| cottages-1.png | 229×293 | 141,186 |
| court-cottages-1-back.png | 344×186 | 7,048 |
| court-cottages-1-front.png | 352×133 | 5,538 |
| forms-0.png | 199×183 | 72,962 |
| court-forms-0-back.png | 358×183 | 5,087 |
| court-forms-0-front.png | 363×148 | 4,482 |
| forms-0-x.png | 199×183 | 72,865 |
| court-forms-0-x-back.png | 358×198 | 5,295 |
| court-forms-0-x-front.png | 363×138 | 4,344 |
| stable-0.png | 121×199 | 54,109 |
| court-stable-0-back.png | 341×183 | 7,037 |
| court-stable-0-front.png | 350×140 | 6,403 |
| magic-0.png | 197×287 | 126,442 |
| court-magic-0-back.png | 353×181 | 5,165 |
| court-magic-0-front.png | 359×125 | 4,453 |
| magic-2.png | 355×221 | 136,038 |
| court-magic-2-back.png | 363×176 | 4,761 |
| court-magic-2-front.png | 367×138 | 4,171 |
| magic-2-x.png | 355×221 | 135,999 |
| court-magic-2-x-back.png | 363×198 | 5,058 |
| court-magic-2-x-front.png | 367×130 | 3,948 |
| magic-3.png | 336×248 | 155,805 |
| court-magic-3-back.png | 361×160 | 8,314 |
| court-magic-3-front.png | 365×115 | 7,728 |
| mage-0.png | 184×254 | 97,404 |
| court-mage-0-back.png | 351×161 | 5,297 |
| court-mage-0-front.png | 355×139 | 4,582 |
| guild-0.png | 294×223 | 144,806 |
| court-guild-0-back.png | 364×121 | 3,976 |
| court-guild-0-front.png | 368×122 | 3,899 |
| guild-0-x.png | 294×223 | 144,864 |
| court-guild-0-x-back.png | 364×194 | 4,969 |
| court-guild-0-x-front.png | 368×129 | 4,018 |
| academy-0.png | 357×206 | 165,672 |
| court-academy-0-back.png | 368×131 | 3,821 |
| court-academy-0-front.png | 370×109 | 3,477 |
| life-0.png | 169×298 | 100,439 |
| life-1.png | 289×295 | 163,022 |
| life-2.png | 183×287 | 103,898 |
| life-5.png | 288×289 | 155,405 |
| life-8.png | 144×297 | 88,400 |
| magic-6.png | 120×245 | 60,983 |
| magic-7.png | 101×250 | 46,946 |
| magic-8.png | 117×267 | 74,069 |

Catalogue SHA-256：`dd21b753836df8d8189f8eb611bccbd16f823dbb8184f54ae2447190d11ace98`。

过程图、完整 proof、浏览器 profile 和日志不进入 Git；浏览器 profile 已由脚本清理，剩余本轮检查附件由主集成任务在报告汇总后清理。
