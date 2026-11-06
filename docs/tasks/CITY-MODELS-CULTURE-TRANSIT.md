# 公共文化与小型站房模型任务

- 精确基线：`65a643073601c556013cd96f37d1fb8d23ed274e`，分支 `codex/cloud-city-culture-transit-models`，PR base `codex/city-organic-layout-prototype`。只提交独占目录和本任务文档；禁止合入、发布、修改主分支。
- 范围：公交站房、博物馆、小剧院/音乐厅、社区体育馆、市场大厅、钟楼文化馆。与学校/图书馆/消防等公共服务任务分开。
- 已完成：盘点terminal-b/stadium-a/hall/wonder-theater；实际验证内置imagegen；六款新图、透明原始来源、标定、≤384候选PNG、独立catalog、正式Canvas预览与重烘焙命令。无旧图冒充新增，无新增API key或收费API。
- 验证完成：npm ci、正式check、预览类型检查、两项/tmp构建、1/3/20年×三档缩放守恒、明暗底透明边、主要投影/地面退让与深度排序直接检查。没有在实现后补单元测试。
- 未完成：用户造型审查、正式映射/比例、真实GitHub/Mac GPU/完整硬件性能；不得据云端功能检查宣布通过。
- 2026-11-07早上入口：`npx vite --config probes/city-models-culture-transit/vite.config.ts`，打开`http://127.0.0.1:4187/`。
- 完整清单、成本、验证和限制见 [交付报告](../reports/CITY-MODELS-CULTURE-TRANSIT.md)；设计包见 [候选说明](../design/city-model-expansion/culture-transit/README.md)。
