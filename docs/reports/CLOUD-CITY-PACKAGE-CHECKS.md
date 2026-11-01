# City 发行包自动核验报告

日期：2026-11-01。固定基线完整 SHA：`c9febba1eb4bfe704b5ca0a6e632d19824e80244`。
分支：`codex/cloud-city-package-checks`；PR base：`codex/city-profile-tabs`。未合入、未发布。

## 交付与结论

新增 `scripts/verify-city-package.py`、只读 GitHub Actions 和本任务/报告四个独占文件。
现有打包器、依赖、manifest、运行源码和 PNG 均未修改。
云端 Linux / Node v24.19.0 / npm 11.9.0 / Python 3.12.14实际 CLI 通过；不代表用户本机、真实 MV3、商店或性能验收。
GitHub Actions 的真实执行结果须查看 PR checks；本节只陈述本云端 CLI，不能由 CLI 通过推断 GitHub CI 已通过。

正式 ZIP：版本 `0.1.0`，63 文件，97,951,574 bytes；SHA-256：
`7194f61976d9d2c3dc8d0a0e6bf1dbea1892fbd2dfb44a4a472000c4b7dfcbd8`。
保留 `chunks/terrain-view-BGvIS1he.js`，没有擅自删 Terrain 或资源。

## 实际命令与环境问题

首次普通 `git fetch origin` 报代理连接失败；命令显式启用网络权限后正常 fetch，无绕过代理、换环境或新增登录。默认 fetch refspec 只含 main，因此另正常 fetch `codex/city-profile-tabs`，核实完整 SHA 后检出并新建指定分支。
首次 `npm ci` 使用不可写默认 `/home/agent/.npm` 缓存失败；改用 TMP 缓存后成功，未更改锁文件。

所有安装、构建与样本在系统 TMP 的仓库副本执行。可复现成功路径（先切到本 PR 提交）：

```sh
task_tmp=$(mktemp -d /tmp/codeyears-package.XXXXXX)
trap 'rm -rf "$task_tmp"' EXIT
git archive HEAD | tar -x -C "$task_tmp"
cd "$task_tmp"
npm ci --cache "$task_tmp/npm-cache"
npm run check
npm run build -- --outDir "$task_tmp/checked-dist"
npm run package:city
python3 scripts/verify-city-package.py release/codeyears-0.1.0-city.zip
```

以上命令实际运行成功。`package:city` 自身还会重新 check/build；未将命令未执行写成成功。
CLI 可指定 `--build-dir`；默认使用脚本所在仓库的 `dist`，要求同一检出的新鲜正式构建。

## CLI 验证范围

- ZIP 中每条路径唯一、相对且无上级/反斜杠/盘符路径；读取 CRC，不解压输入 ZIP。
- ZIP manifest、public manifest、package、锁文件及锁文件根 package 版本一致；Chrome 版本格式/上限/非全零规则。
- 固定 MV3、activeTab/scripting/storage、GitHub 自动入口的完整对象、WAR 资源及范围、CSP；禁止 host/optional 权限。manifest 还必须与当前检出一致。
- 正式清单为五个入口/manifest、构建的 popup JS 和 chunks、public 全部 City PNG、四个正式图标及四份许可/隐私/素材说明。精确集合排除源码、map、测试、缓存和凭证文件。
- 静态/动态模块及 getURL 的当前 Vite 输出、HTML src/href、CSS url、裸 PNG 引用必须存在；模板生成的 unit/outskirts 图片通过完整 public PNG 清单覆盖。catalog 中非运行候选路径不误当成发行资源。
- 全部文件与当前新鲜构建/根目录说明逐字节一致，额外内容藏在允许文件名下也会失败。NOTICE 不得为空或被换成另一份文件。

这是当前输出格式的窄验收脚本，不是通用 JS 解析器、恶意代码扫描器或任意来源 ZIP 的独立可信认证。需要可信检出与新鲜构建；未来打包边界或生成格式有变化时应显式审查脚本。当前许可文件的存在与一致性不替维护者确认 AI 位图生成条款、参考来源或分发权。

## 针对性端到端损坏样本

先在任务说明列出失败输入，再实现脚本，最后用实际 `python3 scripts/verify-city-package.py ZIP --build-dir DIST` 调用；没有新增单元测试。
正确 ZIP 退出 0；下列 **21 个** 独立损坏输入均退出 1：

| 输入变更 | 实际结果摘要 |
| --- | --- |
| 删 content.js | missing content.js |
| 删 Terrain chunk | missing chunks/terrain-view-BGvIS1he.js |
| 删 unit-townhouse-a.png | missing assets/city/unit-townhouse-a.png |
| 加 src/test.ts | extra src/test.ts |
| 加 content.js.map | extra content.js.map |
| 加 cache/user.json | extra cache/user.json |
| 加 .env（仅合成 FAKE_ONLY=1） | extra .env |
| permissions 加 cookies | permissions changed |
| host_permissions 加 all_urls | host/optional permissions forbidden |
| 自动入口 matches 改 all_urls | automatic entry scope changed |
| WAR matches 改 all_urls | resource exposure changed |
| ZIP 版本改 0.1.1 | version mismatch |
| ZIP 版本改 0.0.0 | invalid Chrome version |
| 删 THIRD_PARTY_NOTICES.md | missing THIRD_PARTY_NOTICES.md |
| 再加同名 entry.js | duplicate ZIP path |
| 加 ../fixture.txt | unsafe ZIP path |
| 加 /fixture.txt | unsafe ZIP path |
| entry.js 追加合成注释 | content differs from fresh build/source |
| 翻转 PNG payload 一个字节，保留原 CRC | ZIP CRC failure |
| 同时在构建和 ZIP 的 landscape.js 追加 import("./chunks/missing-fixture.js") | missing reference；独立于字节对比检查 |
| 仅把临时检出锁文件 packages[""].version 改为 0.1.2 | version mismatch |

复现损坏方法：在 TMP 使用 Python stdlib ZipFile 读取正式包，向另一个 ZIP 逐条写入，针对表格分别跳过、追加或改写对应条目；每次只改变一项并用 CLI 验证非零退出。改写 manifest 时用 json.loads/dumps，其他文件保持原 bytes；同名条目直接再次 writestr。CRC 样本复制原 ZIP，按 ZipInfo.header_offset + 30 + 本地头 filename/extra 长度定位 PNG 数据区，翻转第 100 字节，不重写 CRC。锁版本样本只改临时副本并在那里执行脚本。每项结束删除样本，修改构建/锁文件的样本用 finally 恢复。
首次重复条目夹具复用被写入操作改变偏移的 ZipInfo 后再次读取原文件，导致夹具自身失败；改为直接写合成重复内容后重跑，21 项均取得上述结果。此过程失败不是产品或 CLI 的通过证据。
完整过程日志、临时脚本、依赖缓存、ZIP 和构建在报告后清理；仅本可复现说明长期保留。

## CI 与待验收

CI 为 pull_request、选定分支 push 与 workflow_dispatch，仅 `contents: read`，checkout 不保留 Git 凭证；Node 24、现有锁文件、TMP 构建与退出清理。无 pull_request_target、Secrets、写权限、发布、Release、自动合入或产物上传。
Actions v4 依据官方来源核对，访问日期 2026-11-01：[checkout v4](https://github.com/actions/checkout/blob/v4/README.md)、[setup-node v4](https://github.com/actions/setup-node/blob/v4/README.md)。setup-node 的 Node 版本输入与 action 自身运行时是不同概念。
工作流 YAML 已实际解析，permissions 为 contents: read；构建序列已在云端执行。GitHub runner 上是否启动、成功或需要审批，以 PR 的实际检查状态为准，最终交付答复单独报告查询结果。
未验收项：真实 Chrome/Edge 安装、身份/缓存矩阵、性能预算、素材权利确认和商店发布，均属于本任务之外的既有门槛。
