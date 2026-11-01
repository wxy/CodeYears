# City 渐进加载验证报告

日期：2026-11-01（Asia/Shanghai）。固定基线 `c9febba1eb4bfe704b5ca0a6e632d19824e80244`，分支 `codex/cloud-city-loading-validation`，PR base `codex/city-profile-tabs`。只新增本报告及自己的任务说明，未修运行源码，未合入或发布。

## 结论

**部分通过，仍有明确 FAIL / 待验证。** 正式构建的受控页面完整路径通过空地、逐年填入、最终明细、失败/取消清除、素材失败重试、重新进入隔离及关闭释放。二十年三类合成数据的日期、数量与融合成员守恒通过，强制完成后停帧/释放通过。二十年自然填入的实际650ms时限没有通过本环境验收，不能用强制完成代替。**完整缓存不增加网络等待这一目标 FAIL：现有实现仍逐年联网确认身份**；保护身份的行为应保留，产品目标与缓存使用协议需另行收敛。

这些是 Linux headless Chromium、软件绘制与受控身份下的结果，不是用户 Mac 性能、真实登录 MV3、Edge、后台或商店发布验收。

## 基线、环境与实际命令

已读 AGENTS.md、本轮 OVERNIGHT 安排、PRODUCT、DATA_AND_PRIVACY、PERFORMANCE、DEVELOPMENT_PLAN、CLOUD_DEVELOPMENT 及 CITY-PROFILE-TABS 实现报告。使用 [cloud-environment-runtime](skill://plugin_connector_1p_c5b7d5df5d7081918f2c4be5a633ed5d/cloud-environment-runtime/SKILL.md) 检查环境/网络，未变更环境配置或引入凭证。

- 原共享 CodeYears 云环境；Linux 6.18.57 x86_64，Node v24.19.0，npm 11.9.0，系统 Chromium 154.0.8037.57（Debian 13）。Playwright Python 使用环境已有安装。
- 视口1440×900、DPR1。页面主画布1424×340，二十年独立host1400×700。实际渲染是 Canvas 2D；仅另建诊断WebGL上下文读出软件后端 `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`，不把这个字符串当作City使用WebGL的证据。
- network policy unrestricted/enforced、observations_current=true；vpn_configured=false，没有新增Token/登录。
- 初次默认沙箱 fetch 连接proxy:8080失败；显式网络权限后正常代理成功。默认remote fetch只含main，随后显式fetch目标ref，未用main代替基线。
- 首次npm ci因默认 `/home/agent/.npm/_cacache` 不可写失败，不能算成功；改任务TMP缓存后npm ci、check、正式build全部通过。初次HTTP监听因缺网络权限失败，显式权限后绑定成功。

实际成功命令（执行器网络选项 `with_additional_permissions.network.enabled=true`）：

```sh
git fetch origin
git fetch origin refs/heads/codex/city-profile-tabs:refs/remotes/origin/codex/city-profile-tabs
git rev-parse origin/codex/city-profile-tabs
# c9febba1eb4bfe704b5ca0a6e632d19824e80244
git checkout --detach c9febba1eb4bfe704b5ca0a6e632d19824e80244
git rev-parse HEAD
git switch -c codex/cloud-city-loading-validation
mkdir -p /tmp/codeyears-loading-validation
npm ci --cache /tmp/codeyears-loading-validation/npm-cache
npm run check
npm run build -- --outDir /tmp/codeyears-loading-validation/dist
```

正式构建含entry/content/landscape与原PNG；未使用探针替代正式渲染器。额外将现有planCityScene/isoYearStart编译为TMP诊断模块，只读规划结果作守恒交叉核对，没有覆盖正式模块。

## 受控页面与复现协议

临时 `ThreadingHTTPServer` 监听127.0.0.1:4196；浏览器仅访问本次本地夹具。将正式dist作为静态根；**仅服务entry.js/content.js时，把字节串 `https://github.com` 替为 `http://127.0.0.1:4196`**，其他正式JS/PNG原样返回。没有改源码、parser、loader、身份比较或日期筛选。

主页路径 `/codeyears-demo`，DOM为 `.js-yearly-contributions > .position-relative` 内的 `h2#js-contribution-activity-description` 与唯一 `table.ContributionCalendar-grid`；overview为root内同级、活动流水在root外，年度a入口2008–2025。meta user-login=`fixture-viewer`。主页正常导航响应带此DOM；正式loader的完整主页身份请求（Accept:text/html、无query）仅返回同一meta。年度请求读取query.from年份，返回下述合成HTML。Chrome runtime.getURL返回本HTTP origin下路径；storage.local.get/set/remove使用内存对象与structuredClone；均是替身，不代表真实Chrome权限、持久化或登录。

年度HTML的可重建规则：

```python
# 每个公历源年逐日，从1月1日到12月31日；没有删掉0，也不造未知日。
i = (date - datetime.date(2006, 1, 1)).days
y = date.year
count = 0 if i % 11 < 3 else (i * 17 + y * 3) % 39
# h2: f'{sum(counts)} contributions in {y}'
# 唯一table.ContributionCalendar-grid内每个日期:
# <td id="d{index}" data-date="YYYY-MM-DD"></td>
# table外对应:
# <tool-tip for="d{index}">{count or 'No'} contributions on {EnglishMonth} {day}th.</tool-tip>
# 使用正式parser接受的英文格式，数量与h2精确一致；不使用data-level推算。
```

复跑操作顺序：新浏览器页→城市→三源年2023/2024/2025依次延迟6秒响应→首年后点放大或先放大→观察364/730/1092天→更多/明细核对日期与合计→切回/重新进入→重复关闭。失败轮用新页清内存缓存，正常响应中的第二源年改HTTP403；身份轮只在第二年度请求之后的完整主页确认返回other-viewer。素材失败轮PNG返回503、重试前恢复200。取消年度轮延迟年度5秒；PNG等待轮年度不延迟、每PNG延迟3秒，**先等storage中3个完整年度均写入且取消仍可用，再点取消**，10秒后核对无晚到覆盖。修改范围须先结束/切回（忙碌期间下拉框禁用），再用2024单年重新进入。

浏览器启动实际使用 `executable_path='/usr/bin/chromium', headless=True`，参数 `--no-sandbox`；软件后端轮加 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`。隔离节流的补充轮加 `--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows`。后者是受控测试设置，不代表真实后台行为。

被动封装Canvas drawImage、createImageBitmap/close、document.createElement、Element.replaceWith与RAF回调计数，仍调用原API，不驱动额外帧。保存临时canvas引用仅用于关闭后尺寸归零检查。换层时同步读取新旧画布alpha非零像素数。Playwright等待部分阶段会自行用RAF轮询，**累计RAF计数不能全部归于应用**；停帧窗口只用墙钟等待，不轮询、不注入帧。没有将计数冒充FPS、显存或完整内存测量。

## 完整页面实际结果

| 路径 | 结果与证据 |
| --- | --- |
| 空地先出 | PASS。首年度仍等待时同步已有1424×340画布，aria为空场地，cache=0、bitmap open/close=0，drawImage已调用3次（含空地），没有提前解码PNG。源码构造时无loadCityImages调用，只有updateDays加载。 |
| 首年→部分→完整 | PASS。6秒源年轮依次cache=1/2/3、aria已呈现364/730/1092天，最终合计15,153；源年完整覆盖与标题合计经正式parser验证。网络完成和显示完成分别观察，未用一次resolve判定动画完成。 |
| 日期与数量 | PASS。真实渲染面板的明细1092行，首2023-01-02/count21，末2025-12-28/count10，总15,153，与输入ISO过滤一致。缺失的ISO边界日期没有补零；完整公历2023–2025并非1092天，应按实际ISO窗口筛选。 |
| 不闪空 | PASS（可观察交换边界）。3次replaceWith前后alpha非零像素64858→106387、106387→106387、106387→106387，尺寸始终相同。该证据证明交换的新旧层非空，不声称逐像素美术验收。 |
| 取景不变/观看缩放 | PASS。初始地面矩形 `[401.7830065359477,12,620.4339869281046,316]`；放大1.25倍后各批保持 `[324.2287581699346,-27.5,775.5424836601308,395]`，新旧主画布尺寸相同。只在数据更新时交换层，zoomBy不调用planCityScene（landscape.ts:89/108）。 |
| 第二源年HTTP403 | PASS。曾写首年缓存1项，随后显示明确HTTP403、重试可用，部分贡献层清掉并重建空地；bitmap38/38，空地活画布3。 |
| 年度读取中取消 | PASS。提示“已取消读取/场地尚未完成”，保留空地，5秒后无覆盖；关闭live canvas=0。 |
| 仅PNG等待时取消 | PASS。取消前cache=3、仍busy、空地、bitmap36/36、活画布27；取消后空地、活画布3，10秒后仍相同，RAF4/draw44不变；未误算为成功完成。 |
| 素材503与重试 | PASS。失败显示“城市素材加载失败，请重新生成风景。”并清部分场地；恢复PNG后同页面重试得1092天/15,153，无重试按钮。 |
| 切回/重新进入 | PASS。源年/素材仍等待时切回，再恢复正常重新进入；5秒后只保留新结果1092天/15,153。关闭无主画布。 |
| 更改范围并重新进入 | PASS。2024单年最终364天/4,988，旧三年结果未覆盖，bitmap198/198。此轮年度缓存已存在，不冒充未缓存旧年度响应竞态；真正进行中取消/重新进入由前行覆盖。 |
| 完成后停帧 | PASS（三年自然完成）。无轮询1.5秒窗口：RAF40→40、draw1583→1583，label已呈现1092天。 |
| 关闭后停帧/释放 | PASS（可观察资源）。再等1.5秒仍RAF40/draw1583，主画布移除，所有记录canvas宽高归零，live=0，bitmap78/78。另连续三次关闭live均0，最终bitmap210/210。未测实际进程内存/显存或浏览器内部HTTP连接回收。 |

普通页面轮未捕获应用未处理pageerror。失败后的3个非零canvas是重建空地的主/远地面/未绘制细节画布，并非泄漏；切回关闭后归零。临时夹具持有canvas引用会影响JS GC，故仅声明显式资源尺寸释放。

## 二十个ISO展示年份

2006–2025，**2006-01-02至2025-12-28（含），7301个真实日**，不是公历7305天。由isoYearStart生成上/下界；每个日期计算i/y，同公式固定复现：

| 输入 | count公式 | 最终days/cells/唯一成员 | 原始总量/parcel总量 | parcel数 |
| --- | --- | --- | --- | --- |
| 稀疏 | `i % 29 === 0 ? 1 + i % 7 : 0` | 7301 / 7301 / 7301 | 1007 / 1007 | 3248 |
| 常规 | `i % 11 < 3 ? 0 : (i * 17 + y * 3) % 39` | 7301 / 7301 / 7301 | 100947 / 100947 | 5569 |
| 密集 | `20 + (i * 17 + y * 3) % 81` | 7301 / 7301 / 7301 | 438217 / 438217 | 3805 |

每种输入按真实日期过滤为截至公历2006/2010/2025的三批：364/1825/7301天。每批planCityScene结果均验证：parcel.indices长度=days长度、Set长度相同、每成员索引有效、parcel.count总和=原始count总和；并检查空输入weekly.cells为空。未知日期不是count0。所有融合成员均来自该批days，按最早成员进入呈现前缀时整体出现（city-view.ts:73–74），不能把revealedDays等同已绘制日数。

调用的是正式dist/landscape.js，assetBase沿用正式PNG；`createLandscape(host, [], callback, 'city', undefined, true, years)`，随后await updateDays(batch)。当前源码签名共七个实参，reservedYears为最后一个；未因任务描述序号差异添加无效参数。生产loader不接受2006/2007，故二十年是正式renderer的独立合成负载证据，**并未冒充2006年HTML已经过正式loader**。三源年页面验证则全程经过正式parser/loader。

updateDays刚resolve时三种输入都仍为playing，符合只等素材及换层的合同。首轮同时运行其他受控浏览器/配置轮，可能相互影响，不用于最终结论；随后按顺序重跑、停其他控制轮，并放在可见视口、加上述节流禁用参数。

**二十年自然动画时限：待验证。** 墙钟等待900ms及后续窗口后仍观测playing，最终一轮自然前缀3369/3228/3088，document.hidden=false；早期轮甚至长时间仅少量RAF。这说明本headless软件会话不能证明实际650ms内呈现结束，也不能据此将问题定为生产动画算法缺陷。源码fraction以RAF时间戳差/650计算；缺少稳定显示时钟/硬件证据，未修改共享实现。真实硬件上必须复跑自然完成。

为继续核对最终画面与关闭，明确调用公开API `field.skip()`，待一次正式绘制后观察1.2秒。**此步骤仅证明强制完成，不算自然动画通过。** 三种state均completed/7301，主画布非空，关闭旧层宽高为0。该窗口累计RAF/draw分别13/9146、26/26929、39/41618且前后不变（跨三种共享计数器）；最终bitmap累计30/30、72/72、106/106，三次dispose后所有canvas尺寸归零。PNG源位图计数不是浏览器内存预算。

复现核心（在上述服务页console或Playwright evaluate中；planner为下文临时只读编译模块）：

```js
const { createLandscape } = await import('/landscape.js');
const { planCityScene, isoYearStart } = await import('/planner.js');
const years = Array.from({length:20}, (_,i)=>2006+i);
const all = [];
for (let t=isoYearStart(2006); t<isoYearStart(2026); t+=86400000) {
  const date=new Date(t).toISOString().slice(0,10);
  const i=(t-Date.UTC(2006,0,1))/86400000, y=+date.slice(0,4);
  all.push({date,count:i%11<3?0:(i*17+y*3)%39}); // 换上表公式复跑其他两种
}
const host=document.createElement('div');
host.style.cssText='width:1400px;height:700px'; document.body.prepend(host);
const field=createLandscape(host,[],console.log,'city',undefined,true,years);
for (const end of [2006,2010,2025]) {
  const days=all.filter(d=>+d.date.slice(0,4)<=end);
  const scene=planCityScene(days,true,years), members=scene.weekly.parcels.flatMap(p=>p.indices);
  console.assert(scene.weekly.cells.length===days.length && members.length===days.length);
  console.assert(new Set(members).size===days.length && members.every(i=>i>=0&&i<days.length));
  console.assert(scene.weekly.parcels.reduce((s,p)=>s+p.count,0)===days.reduce((s,d)=>s+d.count,0));
  await field.updateDays(days); await new Promise(r=>setTimeout(r,900));
}
// 先记录自然状态，再明确区分这一步为强制完成
field.skip(); await new Promise(r=>setTimeout(r,1000)); field.dispose();
```

临时planner entry仅两行导出仓库绝对路径的 `src/renderers/city-view.ts` 的planCityScene与 `src/data/iso-week.ts` 的isoYearStart；用已装Vite build，configFile:false/publicDir:false/lib.formats:['es']/emptyOutDir:false/outDir为任务TMP/dist、fileName返回planner.js。此额外模块不提交、不计入正式构建检查。所有合成输入都在运行时生成，不提交fixture。

## 发现、具体位置与最小建议

### FAIL：完整缓存仍受网络身份确认阻塞

独立补充页使用默认1280×720视口，主画布1264×340。先正常获取三年，year请求3、identity请求6、缓存3项；切回后重新进入，year仍3、identity增至12。再切回，阻断无query、Accept:text/html的身份确认请求，保留全部缓存：identity增至13即失败，显示“Failed to fetch”、空地与重试，缓存仍3项。**完整缓存没有重新请求年度数据，但依然必须等待网络。** 不能把2.53秒/2.60秒的本次重入墙钟时间当作纯身份延迟或硬件性能，PNG也会重新加载/烘焙。

位置：`src/platform/github/load-year.ts:37` 每年在读缓存前await confirmViewer；`:45`命中后再次await；`load-history.ts:34`按年度顺序调用。失败并清除部分画面符合当前隐私保护，不能简单删除确认或相信当前标签页旧meta。

最小建议：先确认“无额外年度数据网络等待”是否才是目标；若要求完整缓存真正无网络等待，必须另定可证明新鲜的访问者确认协议，不能只修改renderer。可独立评审同一生成请求内共享身份确认以减少往返，但它仍有网络等待，且不得跨导航/身份变化复用，不能宣称满足零等待。本报告只提供复现与建议，不擅自改共享加载器。

### PASS：第二源年期间身份变化会清空部分结果

补充轮按页面请求数切换响应，而非复用前轮全局服务日志：第一年成功，第二年已发出时身份确认返回other-viewer。year=2、identity=4、cache=1；界面提示“当前 GitHub 会话身份无法确认或已经改变”，空地、重试可用，bitmap42/42。此前普通身份轮因服务日志累计在首年即拒绝，只证明首年身份保护，不拿它冒充第二年证据。本补充轮才是第二源年身份变化的实际结果。

### 待验证：二十年自然填入时限与真实画面

位置 `src/renderers/landscape.ts:45–49` 以RAF时间差驱动650ms；`city-view.ts` 的 draw 执行缓存/增量地面和素材绘制。本环境出现墙钟和RAF动画推进不匹配；三源年自然完成与停帧通过，但不能推广到二十年。最小后续是固定同输入在用户真实Chrome前台观测RAF时间戳、长任务与最终完成状态，确认瓶颈再决定是否修复；不要仅凭软件会话等待超时增加常驻定时器或无条件轮询。当前没有足够证据指定确定的生产修复。

## 未完成与清理

- 二十年三种输入自然完成的650ms实际时限、用户Mac硬件性能/功耗/内存预算待验证；强制完成不抵消此缺口。
- 未进行真实登录MV3、跨标签A/B/退出登录、Edge、非调试后台和真实GitHub响应验证。身份与storage是明确替身；已有其他报告不自动迁移为本次通过。
- 取景/换层有像素与坐标证据；未做完整艺术视觉验收、所有极端竞态或进程内部资源测量。没有因这些边界扩写源码或补单元测试。
- 停止本任务HTTP服务器，关闭所有本次Playwright浏览器；临时HTML/脚本/输入、响应、日志、npm缓存、构建和诊断模块所在 `/tmp/codeyears-loading-validation` 删除。没有提交截图、合成输入或构建文件；长期只留本报告和任务说明。
- `git diff --check`通过；提交前核对只新增本任务两个Markdown文件。通过独立报告PR交付，等待审查，不合入、不发布。
