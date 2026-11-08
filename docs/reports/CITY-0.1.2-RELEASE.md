# CodeYears 0.1.2 发行检查

日期：2026-11-08。用户要求保留CodeYears名称并发布0.1.2；基线为main `5c6d2e60b3becdbb5900d98cb7478a1fbf9b6bba`。本次仅同步package、lock、manifest版本及发行/隐私文档，运行实现与该基线相同。未纳入#71–#75五个探索PR，没有调整权限或依赖。

## 制品与来源

- `codeyears-0.1.2-city.zip`：118文件，23,502,810 bytes，SHA-256 `89b16d821f1f9995dbfb2e300a1b1a0aac3c8a04593ecb3721e455de22f26d64`。
- 包含98张正式运行PNG；设计原图、候选、probes、缓存、测试数据、source map和node_modules不进入ZIP。包体增加来自已合入的新素材和更清晰的野外纹理，不继承0.1.1的7.87 MB或约93%缩包结论。
- 所有版本字段为0.1.2；权限仍为activeTab、scripting、storage，GitHub入口及资源范围、CSP、选项页和中英文包内名称不变。
- 独立干净目录构建，未从本机在用dist搜集旧块。ZIP及校验文件为正式附件，保留于忽略的release目录，不进入Git；0.1.0/0.1.1附件保持原样。

## 方法与实际结果

macOS、Node26.7.0、npm11.19.0、Chrome157.0.8103.38 headless。临时目录用`git archive`导出基线，叠加本轮版本和PRIVACY文件，独立安装锁定依赖；未复制用户缓存、凭证或环境文件。

```sh
npm ci --cache <task_tmp>/npm-cache
npm run build
python3 scripts/package-city.py
python3 scripts/verify-city-package.py release/codeyears-0.1.2-city.zip
git diff --check
```

安装成功、0 vulnerabilities；build内TypeScript检查通过。ZIP CRC、清单、动态图片目录/目录表、JS/HTML/manifest资源引用、文件逐字节对照、许可通知、本地化字段、版本与权限核验均PASS。许可证文件存在不扩大为第三方素材权益保证。

浏览器检查由本次独立临时Chrome资料访问127.0.0.1页面，使用新构建content.js与landscape.js及原字节运行PNG。仅在临时提供的content模块前声明演示location；GitHub请求替换为受控英文HTML及对应Response URL，runtime资源URL映射本地构建，storage为演示内存接口。没有控制现有Chrome、改Codex设置、向真实GitHub注入脚本或读取登录凭证。

可复现输入：年度入口2023–2026，默认选择2024–2026；从各源年1月1日逐日生成，当年截至浏览器本地日期。周日数量0，其余日期依次轮换`[2,5,12,30,60][(i++ + year)%5]`，i每源年从0开始；HTML标题为生成总量，日期格和英文tool-tip完整对应。身份替身为release-viewer，主页为release-example。单日活动返回release-example/project的6次提交与同一PR链接，并故意在PR锚文本放入具体事项标题，检查该标题不进入浮层。所有输入为示例数据。

| 路径 | 实际结果 |
| --- | --- |
| 首次激活 | 三个源年读取完成，峰值并发2；1080×340 Canvas非空；总量19,408；无重试/错误遮罩 |
| 完整场景deactivate→activate | 同一Canvas对象；年度请求0、素材请求0、主画布新增绘制0；仍执行实时身份确认 |
| 建筑命中与悬停 | 出现建筑高光，显示“2025 · 第2周，周一”、仓库及“6次提交 · 1个PR”；无具体事项标题 |
| 移开再悬停同一建筑 | 项目内容复用，活动请求0，主画布新增绘制0 |
| 语言及缩放 | 中文初始100%；切English后Apply正常；全景50%；本样本最大1270%（受素材细节约束，未超过2000%） |
| 浏览器执行 | runtime异常0；全程身份请求10、年度3、单日活动1，不把缓存解释为零网络请求 |

该检查覆盖正式构建的组件与受控请求完整路径，不是商店签名MV3、真实GitHub登录页或真实后台标签切换的新验收。此前用户已在自己的GitHub确认项目内容和高光可见，后续桥墩等目视反馈与各次修正仍按原报告记录；不把本次受控成功推广到完整私有贡献、独立账户身份矩阵、Edge或硬件内存/GPU/功耗预算。没有新增事后单元测试。临时脚本、HTML、Chrome资料、日志、构建、依赖与测试输入在记录后清理，仅保留报告与正式发行附件。

## 发布与商店

通过独立版本PR交付后，GitHub tag/Release及附件状态再做远端核对。Chrome商店后台未由工具操作，0.1.2未上传或提交审核；用户后续上传本版ZIP并确认隐私披露后，单独记录提审/上线。现有0.1.1截图仍为历史正式素材，本次未重拍。官网政策与版本由独立PR同步，部署不等于商店审核通过。
