# 0.1.2 提审后发布与清理

日期：2026-11-08。维护者确认0.1.2已提交Chrome商店审核，并授权完成GitHub发布与清理。本记录随截图PR #77交付。

## 发布边界

- GitHub v0.1.2已于本轮较早时公开，本次补齐媒体和已提审状态，不新建重复版本或移动tag。tag继续指向ae88de94237f76c5f2d718abc3822832e7dc3753。
- Chrome商店状态来自维护者确认：已提审，审核通过和新版上线尚未确认。工具未操作或读取商店后台。
- 原0.1.2运行ZIP保持23,502,810 bytes，SHA-256为89b16d821f1f9995dbfb2e300a1b1a0aac3c8a04593ecb3721e455de22f26d64，权限与运行源码不变。
- 新媒体ZIP包含九张1280×800 RGB JPEG、两张既有宣传PNG、元数据和说明。图片字节与拍摄交付版本一致，仅归档说明补入已提审状态。
- 官网提审状态、真实图片与来源由独立PR https://github.com/wxy/xingyu.wang/pull/56 同步；版本化图片路径避免0.1.1缩略图缓存。编译由Vercel对应提交的预览构建检查通过，生产定向核对另记于发行回执。

## 资源与清理检查

核对原分支HEAD和分支头均在main历史中，主仓库不依赖旧副本对象库；进程检查没有旧预览或测试资料占用。独有的工作文件、暂存版本及八份副本的原Git索引/配置、引用、完整源码哈希和模式先保留，再核对副本内容未变。

初次批量删除被自动审批拒绝后，没有执行该删除；维护者随后明确逐项批准删除八份旧副本并保留恢复资料，才执行清理。

删除清单：

- release/codeyears-store-media-0.1.1：3,101,033 bytes。
- release/codeyears-store-media-0.1.2：6,970,473 bytes。
- dist/chunks/terrain-view-TDzz2lrq.js：629,832 bytes。
- dist/assets/options-BM2Gk8pv.js：751 bytes。
- dist/assets/options-CjZa3kO9.js：751 bytes。
- dist/assets/popup-BSoqFkSk.js：1,078 bytes。
- dist/assets/popup-CpytkqbX.js：1,078 bytes。
- dist/assets/shared-CO2RNU6N.js：18,144 bytes。
- dist/assets/shared-D2mfd3IN.js：18,077 bytes。
- work/building-hover-20261108/source：210,816,852 bytes。
- work/loading-reuse-20261108/source：159,186,851 bytes。
- work/local-prototypes-20261106/source：115,508,363 bytes。
- work/local-prototypes-20261106/integrated：25,081,837 bytes。
- work/local-prototypes-20261106/loading：8,301,555 bytes。
- work/model-integration-20261107/source：330,698,337 bytes。
- work/model-integration-20261107/integrated：319,766,344 bytes。
- work/wider-streets-20261107/integrated：46,335,866 bytes。
- work/local-prototypes-20261106/tmp：25,125,354 bytes。
- work/local-prototypes-20261106/open-local-tests.cjs：1,896 bytes。

删除文件逻辑体积合计1,251,564,472 bytes（约1.25 GB，不作为物理磁盘回收量）。保留4份独有源码/暂存内容共41,814 bytes，以及Git状态和恢复清单，位于忽略目录work/cleanup-retained-20261108。主仓库源码、原始美术、在用dist、依赖、各正式版本ZIP/校验文件、图片和报告均保留。五项云端实验的协调记录继续保留，未混入正式版本。

媒体解压副本与保留ZIP的13文件清单和字节完全相同后才删除。7份旧hash编译块不在正式ZIP中，且未被当前JS/HTML/manifest引用；额外512像素图标与正式源图相同，继续保留。清理后的在用dist通过python3 scripts/verify-city-package.py release/codeyears-0.1.2-city.zip --build-dir dist：118文件、CRC、清单、引用、版本、权限和通知均PASS。

本轮仅修改正式媒体与发布文档，使用图片完整解码/尺寸/模式/哈希、文档引用、归档CRC和git diff --check；不重复本地编译运行源码。对应PR按仓库要求执行CI。临时目录在报告后清理，仅正式报告、图片、制品及恢复资料长期保留。

媒体归档：6,954,634 bytes；SHA-256 ed877b7fb5644fe04816edccb2607c0ac412bd01a040cefdda65fad3e0b3f6d4。
