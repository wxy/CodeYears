# 城市运行素材生成器

该工具是正式素材制作流程，使用浏览器现有Canvas标定代码生成运行PNG，不修改大尺寸源图。`npm run build`只打包已生成的运行图，不在每次构建中启动浏览器。

## 生成与核对

在项目根目录运行：

```sh
task_tmp=$(mktemp -d "${TMPDIR%/}/codeyears-assets.XXXXXX")
npm run bake:city -- --outDir "$task_tmp/generated"
```

打开`http://127.0.0.1:4198`。服务仅监听本机，写入接口使用当次随机令牌。先点击“生成并核对四类样本”，检查建筑、树林、平地和自然地面；RGBA差异为零后再点击“生成并核对全部素材”。每张PNG编码后均实际解码回Canvas，尺寸及RGBA逐字节一致才允许保存结果。保存目录由启动命令指定，不能使用大尺寸源图目录。

全量通过后，将输出PNG替换到`public/assets/city-runtime/`，将`catalog.json`复制为`src/renderers/city-baked-catalog.json`；目录内PNG必须与目录表一一对应。重新载入工具，点击“核对已安装运行图的城市场景”：比较旧源图流程和实际运行加载器在1/3/20年、全景/150%/最大倍率下的最终Canvas。这里的“安装”指已放入项目运行资源目录，不是商店安装验收。

正式运行PNG和目录表属于产品素材，应提交Git。大尺寸源图、标定或共享转换代码变化时重新生成，并在目标浏览器重做画质核对。不同浏览器的Canvas缩放/编码实现可能不同，记录本次生成和验证版本；本轮没有引入跨浏览器像素完全相同的承诺。

## 目录边界

- `public/assets/city/`及`docs/design/`保留输入，构建不改写、不复制到发行目录。
- `city-source-assets.ts`、`unit-calibration.ts`及`city-outskirts.ts`保留源图加载、透明边缘和标定过程，供生成器及设计预览使用。
- `city-assets.ts`加载小图及烘焙后的空间元数据，不再重做源图转换；程序绘制的铺装和交通信号灯沿用原实现。
- 构建把`city-runtime/`复制为`dist/assets/city/`，扩展的权限、资源URL前缀及按场景加载方式不变。

结束后停止本地服务，关闭生成器页面。记录报告后清除`task_tmp`，不保存过程截图、日志或临时安装包。冻结0.1.0发行ZIP不由本轮命令覆盖；需要打包验证时在临时staging目录运行现有打包和核验脚本。
