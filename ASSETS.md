# 素材与分发说明

项目代码按根目录 `LICENSE` 的 MIT 许可提供。用户于 2026-11-01 选择该许可证；这不把第三方依赖或生成图片自动改为 MIT。

## 运行素材

- `public/icons/`：从项目原生 SVG 图标导出，母版及方法见 `docs/design/app-icon/v1/README.md`，随项目代码采用 MIT。
- `public/assets/city/`：项目专用的 AI 生成透明建筑、植被、地面、奇观和城郊图片。它们作为 CodeYears 画面随扩展包提供；代码的 MIT 声明不另行承诺这些位图的独立复用授权。
- SVG 投影模板、标定 JSON 与程序绘制道路/车辆属于项目代码；运行时只使用本地资源。

生成提示、来源和标定分别保留在 `docs/design/city-buildings/`、`docs/design/city-units/v2/` 至 `v4/`、`docs/design/city-outskirts/`。部分提示使用城市建造游戏作为质感参考，并要求不复制游戏素材、标志或受保护的特色建筑；没有将游戏图片打包。不能仅凭提示就宣称已完成第三方权利核查。

2026-11-02完成运行包来源核对：59张运行PNG中，53张与仓库内设计源图字节或解码RGBA一致；六张早期建筑与`docs/design/city-buildings/v1/SPRITES.md`记录的原始生成文件解码RGBA一致。各代README、SOURCES及GENERATION记录指向本项目内置image_gen生成；未发现从商业游戏或图库下载的运行图片。

已查阅生成时有效的OpenAI个人[使用条款](https://openai.com/policies/row-terms-of-use/)（2026-01-01生效）与对应[服务协议第4节](https://openai.com/policies/services-agreement/)：在适用法律允许范围内，用户与OpenAI之间的输出权益归用户，输入仍须有相应权利；输出不保证唯一。该来源记录不把第三方权益或位图独立复用自动改成代码MIT，也不把本项目图片描述为人工绘制。设计板与源图留在仓库，不随发行 ZIP 重复打包；运行 PNG 不因打包而缩放或改写。

## 依赖

随包代码的第三方许可见 `THIRD_PARTY_NOTICES.md`。构建工具及类型依赖只用于开发，不把其整个 `node_modules/` 放入发行包。当前构建仍保留暂停的 Terrain/Three.js 分包，因此保留相应许可声明；首发入口只有 City。
