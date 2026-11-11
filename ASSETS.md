# 素材与分发说明

项目代码按根目录 `LICENSE` 的 MIT 许可提供。用户于 2026-11-01 选择该许可证；这不把第三方依赖或生成图片自动改为 MIT。

## 运行素材

- `public/icons/`：从项目原生 SVG 图标导出，母版及方法见 `docs/design/app-icon/v1/README.md`，随项目代码采用 MIT。
- `public/assets/city/`：保留的设计源素材，包含项目专用的 AI 生成透明建筑、植被、地面、奇观和城郊图片。源文件不再直接进入下一版发行包；代码的 MIT 声明不另行承诺这些位图的独立复用授权。
- `public/assets/city-runtime/`：由设计源素材及标定流程生成的98张运行PNG；发行时复制到`assets/city/`，保持原资源权限范围。包括幼树的独立标定结果及注册纪念塔，不分发目录未引用的旧候选图。
- SVG 投影模板、标定 JSON 与程序绘制道路属于项目代码；运行时只使用本地资源。
- `public/assets/town-runtime/`：2026-11-11新增魔法小镇的45张预烘焙 PNG，发行时复制到 `assets/town/`。源图、完整提示词与校准记录保存在 `docs/design/ancient-town-concepts/2026-11-10/`、`2026-11-11/`，均为内置图像工具基于已有项目风格生成/修订的通用素材；没有提交真实贡献数据给图像工具。建筑、居民、动物、花树和公共设施的位图不因此自动改为代码 MIT；参考项目的原草地图未复制成扩展运行依赖。

生成提示、来源和标定分别保留在 `docs/design/city-buildings/`、`docs/design/city-units/v2/` 至 `v4/`、`docs/design/city-outskirts/`、`docs/design/city-transport/` 和 `docs/design/city-model-expansion/`。部分提示使用城市建造游戏作为质感参考，并要求不复制游戏素材、标志或受保护的特色建筑；没有将游戏图片打包。不能仅凭提示就宣称已完成第三方权利核查。

2026-11-02完成0.1.0运行包来源核对：59张PNG中，53张与仓库内设计源图字节或解码RGBA一致；六张早期建筑与`docs/design/city-buildings/v1/SPRITES.md`记录的原始生成文件解码RGBA一致。各代README、SOURCES及GENERATION记录指向本项目内置image_gen生成；未发现从商业游戏或图库下载的运行图片。

已查阅生成时有效的OpenAI个人[使用条款](https://openai.com/policies/row-terms-of-use/)（2026-01-01生效）与对应[服务协议第4节](https://openai.com/policies/services-agreement/)：在适用法律允许范围内，用户与OpenAI之间的输出权益归用户，输入仍须有相应权利；输出不保证唯一。该来源记录不把第三方权益或位图独立复用自动改成代码MIT，也不把本项目图片描述为人工绘制。设计板与大尺寸源图完整留在仓库；下一版运行PNG提前完成原有缩放、低alpha清理和投影标定，保持当前实际绘制尺寸与空间元数据，不新增有损编码。生成步骤见[素材工具](scripts/city-assets/README.md)，实际样本、全量画质和包体验证见[报告](docs/reports/CITY-PREBAKED-ASSETS.md)。

## 2026-11-07 建筑扩充

本轮新增19款内置imagegen精绘模型（住宅商铺8、公共服务5、交通文体6），正式运行PNG合计2,706,912 bytes，均为透明RGBA且长边不超过384像素。消防站与警务小站沿用既有图片，不计入新生成数量。源图、提示词与标定保留于`docs/design/city-model-expansion/{residential,civic,culture-transit}/`；用于统一素材生成器的输入副本位于`public/assets/city/unit-{id}.png`，源图不进入发行包。云端候选PNG经审查后原样纳入运行目录，没有额外放大导出或有损转换。

## 2026-11-07 桥梁扩充

第二版精绘石拱桥与单桥墩现代梁桥替代旧运行桥图，新增两张、停用一张。两图为内置imagegen生成及编辑，含透明边长边不超过1152像素，合计1,208,377 bytes，较旧运行桥图净增801,596 bytes。源图、完整提示词及标定见`docs/design/city-transport/v2/`，不进入发行包；运行仍按场景选型按需解码。第一版源图保留。

## 2026-11-08 注册纪念塔

新增内置imagegen生成的加入GitHub纪念高塔，1×1占地，运行PNG为123×384透明RGBA、75,521 bytes；正式运行目录由97张增为98张。源图、完整生成/透明清理提示与标定保留在[素材记录](docs/design/github-joining-tower/README.md)，大尺寸源图不进入发行包。沿用按需解码及既有命中/预滤波/销毁，不在浏览器内生成图片。图中GitHub/Octocat标识不意味着获得其品牌的独立复用授权，位图分发仍沿用本文件的边界。

## 2026-11-08 石墩透视修正

石拱桥下部改用内置imagegen定向编辑的刚性石墩，取消逐列伸缩，按共享水位裁去入水部分。桥面保留原像素，运行图仍1152×789、643,712 bytes，减少19,419 bytes，不增加PNG数量；梁桥不变。新源图、提示和标定见[第三版记录](docs/design/city-transport/v3/README.md)，源图不进入发行包。

## 2026-11-08 单墩梁桥方向修正

单墩梁桥采用沿桥宽的横向盖梁与居中短直柱。内置imagegen只提供混凝土纹理，支撑面按桥面共用2:1坐标离线贴材质，避免直接采用方向不准确的生成外形。运行PNG仍1152×828、565,443 bytes，增加20,197 bytes，不增加图数；桥面像素保留。材料源图、提示和几何参数见[第四版记录](docs/design/city-transport/v4/README.md)，源图不进入发行包。

## 依赖

随包代码的第三方许可见 `THIRD_PARTY_NOTICES.md`。构建工具及类型依赖只用于开发，不把其整个 `node_modules/` 放入发行包。当前构建仍保留暂停的 Terrain/Three.js 分包，因此保留相应许可声明；首发入口只有 City。
