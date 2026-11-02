# City 首发页内体验与键盘收口

日期：2026-11-02。工作包A，依据 [首发安排](CITY-FIRST-RELEASE-2026-11-02.md)。固定共同基线 `e3a609e84a821b2a792711c888f63f27edc120e5`（包含main `4024b76`），分支 `codex/city-release-page-polish`，PR base `codex/city-first-release-rc`；不合入、不发布。

## 独占范围

仅 `src/extension/content.ts`、`src/renderers/landscape.ts` 与本文/[报告](../reports/CITY-RELEASE-PAGE-POLISH.md)。保留现有数据、缓存、身份核对、日期、语言偏好协议、布局/素材/时间轴和缩放倍率API；不改entry、公共locale JSON、依赖锁或其他工作包。用户已取消独立测试账户与A/B切换验收，不索取凭证，不扩展独立导出/分享。

## 交付目标

- 更多菜单按当前主页操作与帮助/数据说明分组，帮助与图例可折叠，复用既有消息。
- 跨两个Shadow DOM识别外部点击（包括画布、工具、原生页面），关闭菜单且不抢焦点；切回原图关闭。
- Esc先关菜单并恢复其summary焦点；再次Esc收起展开视图并回到展开按钮。document级监听随dispose移除。
- 城市容器作为稳定Tab入口，清楚提示方向键与焦点。仅城市聚焦时处理无修饰方向键，每次移动40 CSS像素并请求既有按需帧。控件/页面滚动/浏览器快捷键保留原行为，换canvas、切语言及展开/收起仍可用。
- 按交互风险运行正式构建、正式PNG与正式parser/loader的受控端到端；不补实现镜像单元测试。所有过程材料TMP，完成清理，只保留报告。云端结果不代表真实MV3或硬件性能。
