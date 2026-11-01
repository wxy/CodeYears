# CodeYears 应用图标 · v1

日期：2026-11-01。用户已选择 **C「等轴街区」**作为当前正式应用图标，已在扩展 manifest 注册。A/B 保留为设计探索，不作为当前图标。

![三个方向与已选 C、实际小尺寸](proposal-board.png)

| 方向 | 创意 | 状态与取舍 |
| --- | --- | --- |
| A · 代码成城 | 代码括号围住三座高低楼宇，表达贡献积累成城 | 初稿推荐方向，现保留为探索；小尺寸轮廓清楚，场景感更抽象 |
| B · 时间环 | 开放的 C 形时间环包住城市，琥珀色刻度强调时间积累 | 保留为探索；更强调“年”，但也接近通用时间/数据符号 |
| **C · 等轴街区（已选）** | 固定 2:1 等轴投影的绿色阶梯楼宇与琥珀贡献地砖，暖石色底 | **当前正式图标**；与实际城市呼应，保持整块街区的剪影，在 16 px 时不依赖细节 |

三个方向都不使用 GitHub 标志、日期数字或细小窗格。C 母版按原始方形比例直接导出，每个尺寸独立栅格化；圆角外透明，不裁切、拉伸或额外旋转。

## 正式资产与接入

- 矢量母版：`codeyears-c-city-block.svg`，512×512，可编辑的正式来源。
- 发行 PNG：`public/icons/codeyears-{16,32,48,128}.png`，均由 C 母版直接导出，分别用于工具栏及扩展管理等尺寸。
- 大图：`public/icons/codeyears-512.png`，正式设计资产，不注册额外 manifest 尺寸。
- `public/manifest.json` 的 `icons` 与 `action.default_icon` 均引用 16/32/48/128 PNG；没有增加权限或公开资源范围。
- Vite 已有 public 目录复制行为会将 PNG 原样放进构建目录 `icons/`；无需新构建规则或运行时图像依赖。
- `proposal-board.svg` / `proposal-board.png`：1600×1040 正式对照板，标记 C 已选；浅深背景中的 48/32/16 样张按实际像素绘制，未放大。
- A/B 原生 SVG 作为设计探索保留。

配色为松绿、浅叶绿、暖石色，少量琥珀点缀；无复杂阴影、窗格或装饰文字。C 绿色明暗面保持楼体关系，暖石底让浅深工具栏下都能辨认整体外形。

导出命令（将 `SIZE` 换为 16、32、48、128 或 512）：

```sh
rsvg-convert -w SIZE -h SIZE -o public/icons/codeyears-SIZE.png docs/design/app-icon/v1/codeyears-c-city-block.svg
```

## 本次验证与范围

- 使用本机 `rsvg-convert 2.62.3` 导出正式 PNG；SVG XML 解析、各 PNG 的 RGBA 模式/尺寸/透明圆角与小尺寸目视核对通过。
- `npm ci`、`npm run build -- --outDir <系统临时目录>`（含类型检查）通过。构建目录的 manifest 图标引用均存在，5 个 PNG 与正式源文件逐一一致；除两个图标字段外，manifest 与接入前内容深度一致，权限不变。
- `git diff --check` 通过；临时构建与 QA 文件清理，PNG 是正式产品资产，保留在 Git。
- 尚未在真实 Chrome/Edge 的扩展管理页与工具栏验收；本次构建验证不代替该项。图标接入之外不改变产品界面、数据或渲染功能。
