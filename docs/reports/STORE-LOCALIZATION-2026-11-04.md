# 商店截图语言分组与下一版名称

日期：2026-11-04。本报告区分线上0.1.0观察、下一版源码修改与待完成的商店验收。

## 已确认的线上结果

用户报告0.1.0已上架，中文环境只显示一张中文图。工具通过真实Chrome原生界面读取公开详情页，看到版本0.1.0、更新日期2026年11月4日和“添加至Chrome”入口；画廊只有一个媒体按钮，画面为中文页内操作图。未点击安装，没有验收商店签名包。

随后在独立的应用内浏览器只读打开同一项目的英文和法语页面，读取图片列表并查看实际画面：

| 语言 | 可复查地址 | 实际结果 |
| --- | --- | --- |
| 简体中文 | [hl=zh-CN](https://chromewebstore.google.com/detail/codeyears/mhbphbpbjbndjhodbdmijdopidhcibia?hl=zh-CN) | 中文Chrome当前语言页面只有1张中文页内操作图，没有全球全景 |
| 英文 | [hl=en](https://chromewebstore.google.com/detail/codeyears/mhbphbpbjbndjhodbdmijdopidhcibia?hl=en) | 只有1张英文展开近景，没有全球全景 |
| 法语，扩展未单独支持 | [hl=fr](https://chromewebstore.google.com/detail/codeyears/mhbphbpbjbndjhodbdmijdopidhcibia?hl=fr) | 只有1张英文展开全景，与原全球素材场景一致 |

中文实际读取的是已打开的无`hl`参数页面，商店界面和文案均为中文；表内给出便于后续复查的显式语言链接。英文和法语实际使用表内参数。三个页面的观察支持当前商店“当地组替换、缺少当地组时回退全球组”的行为，没有对其他项目或全部语言做穷举。

2026-11-03媒体说明曾据官方排列顺序推测“当地截图之后还会追加全球截图”，这项未实测预期被线上结果否定。已在旧媒体说明中更正，保留原素材的来源与规格。问题位于商店素材分组方案，不是贡献数据、渲染器或界面语言切换故障。

## 官方文档与判断边界

- [商店字段与本地化](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)：支持按扩展的`_locales`分别提供截图；文档列出当地与全球媒体的排列顺序，没有明确写出截图替换/回退条件，不能仅据排列说明认定会合并。
- [Manifest名称](https://developer.chrome.com/docs/extensions/reference/manifest/name)：商店、安装对话框及扩展管理页显示包内`name`，支持本地化，上限75字符。
- [标题建议](https://developer.chrome.com/docs/webstore/best-listing)和[元数据政策](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements)：标题应简短且描述核心功能，避免关键词堆砌。冒号不是强制格式；功能短语有助于识别用途，不能据此承诺搜索排名提升。

## 本次源码与下一版约定

- `public/manifest.json.name`改为`__MSG_extensionName__`。英文词库提供`CodeYears: GitHub Contribution City`（35字符），中文词库提供`CodeYears：GitHub 贡献之城`（21字符）。保留默认英文词库，未新增支持语言。商店/浏览器选择元数据语言，扩展内手动语言偏好不改写商店名称。
- 发行校验脚本沿用既有本地化字段校验，将`name`纳入检查；无需新建隔离测试。名称以源码词库和包内词库一致为验收对象。
- 下一版每个支持语言各制作全景、展开近景、页内操作三张完整截图。全球组完整复用英文组，数量、顺序及文件哈希一致。具体上传与上线验收见[商店材料](../STORE_LISTING.md#下一版截图与上传验收)。
- 本轮不制作尚未定版界面的新截图，不上传商店。0.1.0冻结包与版本号保留；下一次发布定版时再递增版本、制作正式新包并提交审核。

## 验证记录

验证范围为元数据静态检查、受影响的构建与发行文件一致性；没有改变用户操作、数据请求、缓存或渲染行为，因此不重复这些流程的端到端测试。上述公开商店页面核对只证明已上线0.1.0的显示结果。

本机环境：macOS，Node v26.7.0、npm 11.19.0、Python 3。使用本PR源码的独立临时副本，按锁文件安装；构建、ZIP和依赖缓存全部位于任务临时目录。可在本PR checkout中复作：

```sh
set -e
task_tmp=$(mktemp -d "${TMPDIR%/}/codeyears-store-metadata.XXXXXX")
trap 'rm -rf "$task_tmp"' EXIT
git archive HEAD | tar -x -C "$task_tmp"
cd "$task_tmp"
npm ci --cache "$task_tmp/npm-cache"
npm run check
npm run build
python3 scripts/package-city.py
python3 scripts/verify-city-package.py release/codeyears-0.1.0-city.zip
```

结果：`npm ci`、`npm run check`、`npm run build`及发行校验全部通过，临时ZIP共79文件、112526913 bytes，CRC、清单、资源引用、权限和通知检查通过。初次沙箱内安装因无法解析npm仓库而失败，获准联网后按同一锁文件完成安装；不把这次环境失败记为产品故障。

元数据静态检查通过：三处清单本地化引用均可在两套词库解析，词库键一致；两种名称低于75字符且与可复制商店标题一致。临时ZIP中的清单保留名称占位符，两份词库与源码逐字节一致，改动文档的本地链接有效；`git diff --check`通过。原冻结包只读核对SHA-256仍为`b0f004a227a68d8acce314343cf91cc053121a35ca09f009aa48106a99208018`，未被临时开发构建替换。

尚未验收：新名称在真实安装提示/管理页及商店的显示、三组新版多图制作/上传/上线、商店签名包安装、搜索排名变化。没有新建登录会话或更改用户浏览器语言设置。过程截图未保存入库，任务临时目录中的构建、ZIP、依赖缓存与日志已清理，仅保留本报告。
