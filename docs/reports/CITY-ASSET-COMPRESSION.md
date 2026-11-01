# City 运行素材无损压缩

日期：2026-11-01。基线为发布准备分支 `a98d2b9`；交付分支 `codex/city-lossless-assets`，PR base 为 `codex/city-release-preparation`，不合入。PR #35 暂缓，本任务未修改它。

## 决策与边界

采用**同格式 PNG 重编码**，不改运行资源名称、目录引用、尺寸、RGBA、alpha、投影或标定。只改 48 张 `public/assets/city/*.png` 与本报告；设计源图、图标、版本 0.1.0、MIT/第三方许可、隐私、manifest/权限/WAR、packager、缓存/时间轴/合并/交互全部不变。没有新增运行依赖或图片装载框架。

先比较现有 Pillow PNG 优化与 libwebp 无损，再在临时目录安装 Zopfli 扩大同格式优化。Pillow 12.3.0、libwebp 1.6.0、Zopfli Python 0.4.3；后者只在临时目录，未加入项目依赖。PNG 禁用 lossy_transparent/lossy_8bit，WebP 使用 lossless=True、exact=True、quality=100、method=6。每个候选都做完整解码比较，不以编码选项代替证据。

WebP 的离线 48/48 RGBA/alpha/尺寸校验虽然通过，**没有投产**：Chromium 154 默认 createImageBitmap 路径的 48 对 Canvas RGB 均有差异，alpha 一致；正式一年/二十年全景和近景的最终画布哈希也全部改变。apartment 样本进一步定位：默认/显式 premultiply 有 730357 个半透明像素差异，不透明像素无差异；显式 premultiplyAlpha=none 的样本差异为零。这是诊断，不是已验证的全量替代装载方案。本轮不扩张去改共享装载器，不把“文件采用无损模式”写成当前浏览器呈现也无差异。

所有原 PNG 为 8-bit RGBA；原分块仅 IHDR/IDAT/IEND/caBX，无 ICC、gAMA、sRGB、cHRM 色彩声明。优化移除非色彩的 caBX/C2PA 来源分块（原合计 1,085,748 bytes），不制造或替换色彩配置；设计源图保留，不把重编码后的运行派生图宣称为原始带签名文件。

## 实测体积

| 方案 | 48 张资源总 bytes | 相对原资源减少 | 采用情况 |
| --- | ---: | ---: | --- |
| 原始 PNG | 97,741,109 | 0.0000% | 基线 |
| Pillow PNG optimize | 91,626,445 | 6.2560% | 6.26%，低于强优化收益 |
| WebP lossless/exact | 64,393,190 | 34.1186% | 浏览器默认绘制差异，未采用 |
| 最终 PNG（逐张取最小无损候选） | 88,406,630 | 9.5502% | 已采用 |

基线 ZIP **97,947,300 bytes**（SHA-256 `ee650f16e403dfff105bb102cf9d2cf6068924da9011e6cea39153b9ac2578bb`）；优化 ZIP **88,612,821 bytes**（SHA-256 `33c5d6a124b357e28356d590ccd78da02a7b1837a41be162eb8cf66412e5500f`）。减少 **9,334,479 bytes / 9.5301%**；资源本身减少 9.5502%。不是 WebP 的约 34% 减幅，也没有借用缩图/有损压缩换取结果。

ZIP 完整性检查通过；前后均 62 个同名成员，逐项读取比较仅 48 张 assets/city PNG 改变，其余字节完全相同。因此版本、MIT/隐私、manifest/权限/WAR、图标、JS、包清单与装载路径未改。没有剔除未用候选或以按需生成替代正式资源。

源文件和 ZIP 大小不是运行时内存、显存、FPS 或功耗预算。

## 像素、路径与正式预览证据

48/48 张：Pillow 完整 RGBA、尺寸、模式和独立 alpha 字节比较通过；Chromium 154 createImageBitmap 默认解码→Canvas getImageData，全部 48 对 RGBA 字节差异为 **0**。所有尺寸保留，未裁剪、缩放、量化或改变透明像素的 RGB。最终 PNG 分块仅 IHDR/IDAT/IEND，和原图一样没有色彩配置声明。

`npm ci`（临时缓存）、`npm run build`（包含 `npm run check`）、既有 package-city.py、`git diff --check` 均通过。Node v24.19.0 / npm 11.9.0 / Chromium 154.0.8037.57，Linux headless、1280×1000、DPR1。下面四个最终画布 RGBA SHA-256 前后完全相同（画布均 1156×620），并保留相同示例日数、合计和奇观计数：

| 输入 | 显示 | 前后相同的 Canvas RGBA SHA-256 |
| --- | --- | --- |
| 1 年 / light | 全景 | `1eb415cc179772e08bb0134f039a2c9c63e87da47303df5ba8ee1c2e13521a62` |
| 1 年 / light | 放大两次 | `3a660aaf0d631c0577d5a6f46d15d1a332cf85931bb29e3f4091ad5b3cbbf873` |
| 20 年 / dark | 全景 | `8f050d2d4d10988e941dbb5cc0301c2ec929099d511a9d86bd6b341ffd588b9f` |
| 20 年 / dark | 放大两次 | `9306d0b08d97c56ea744fe221e9cfc51aad52f8765ec572894be3c13549d5552` |

正式预览加载响应均为 200，无 pageerror；实际加载路径全部属于保留的原资源清单。pagehide 关闭后，所有观测画布宽高归零，场景画布为 0。该检查不等价于测量 GPU 内存释放；没有迁移历史 FPS/内存/功耗结论。

原生路径风险先按本轮实际失败方式核对：透明像素 RGB 丢失/预乘舍入、色彩元信息变化、尺寸或 alpha 改变、遗漏/重复资源、WAR/清单路径不匹配、正式加载失败与关闭晚到资源。全量候选诊断在临时目录进行，不新增事后单元测试。

正式 City 预览使用 `npm run preview:city -- --port 4175`，常规 LCG，一年浅色（ISO 2024，364 天/4487 次）及二十年深色（ISO 2006–2025 与源数据交集，7301 天/93111 次），不是旧公历 7305 天窗口。跳过到完成后读取主 Canvas RGBA，再放大两次读取近景；导航 about:blank 触发已有 pagehide 关闭，核对创建过的画布尺寸全部清零、场景画布移除。不得把这些合成数据当真实用户贡献。

尚需本地重载最终 MV3 包及 Edge 复核，云端 Chromium/headless 不冒充已登录会话或硬件预算；没有上传商店或合入发布分支。

## 可复现方法

本轮过程路径均在 `/tmp/codeyears-assets-probe`。使用 `git show a98d2b9:public/assets/city/<name>.png` 取原始运行文件，不改 docs/design。正式 PNG 的逐文件字节数与 RGBA 哈希记录在下表，临时图片、候选 WebP、截图、脚本、日志、构建、ZIP 与工具安装在记录后清理，只保留正式资源和本报告。

以下重编码参数可在临时目录复跑，不写入项目依赖：

```sh
python3 -m pip install --target /tmp/codeyears-assets-probe/python --no-cache-dir zopfli==0.4.3
# Pillow 为本环境已有 12.3.0，libwebp 为 1.6.0。
```

```python
from pathlib import Path
from PIL import Image
import io, zopfli.png

# original 为从基线 git show 提取的某张 PNG；只处理 public/assets/city。
original = Path('/tmp/original.png').read_bytes()
im = Image.open(io.BytesIO(original)); im.load()
assert im.mode == 'RGBA'
im.save('/tmp/pillow.png', optimize=True, compress_level=9)
im.save('/tmp/candidate.webp', lossless=True, exact=True, quality=100, method=6)
encoded = zopfli.png.optimize(original, lossy_transparent=False,
    lossy_8bit=False, num_iterations=15, num_iterations_large=5)
choices = [original, Path('/tmp/pillow.png').read_bytes(), encoded]
best = min(choices, key=len)
check = Image.open(io.BytesIO(best)); check.load()
assert check.mode == im.mode and check.size == im.size
assert check.tobytes() == im.tobytes()  # 包含 alpha=0 处的 RGB
assert check.getchannel('A').tobytes() == im.getchannel('A').tobytes()
# 全量逐张通过后才写回对应正式 PNG；候选 WebP 不写回仓库。
```

构建和打包均使用现有正式脚本；为避免留下仓库构建/ZIP，把 package-city.py 与 package.json、LICENSE、THIRD_PARTY_NOTICES.md、ASSETS.md、PRIVACY.md 复制到临时 staging 的相同相对路径，build --outDir 指向 staging/dist，再运行 staging/scripts/package-city.py。先对基线执行，再对优化后执行；ZIP 成员内容逐项核对，差异只能是 48 张 PNG。正式预览脚本如下（before 在替换前、after 在替换后各执行一次）：

```js
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];try{for(const [range,theme] of [['1','light'],['20','dark']]){
 const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1}),errors=[],loaded=[],closed=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.url().includes('/assets/city/')){assert.equal(r.status(),200);loaded.push(new URL(r.url()).pathname.split('/').at(-1))}});page.on('console',m=>{if(m.text().startsWith('ASSET_CLOSE '))closed.push(JSON.parse(m.text().slice(12)))});
 await page.addInitScript(()=>{window.__canvases=[];const create=document.createElement.bind(document);document.createElement=function(tag,...args){const el=create(tag,...args);if(tag==='canvas')window.__canvases.push(el);return el}});
 if(process.argv[2]==='webp')await page.route('**/assets/city/*.png',r=>r.fulfill({path:'/tmp/codeyears-assets-probe/webp/'+new URL(r.request().url()).pathname.split('/').at(-1).replace(/\.png$/,'.webp'),contentType:'image/webp'}));
 await page.goto('http://127.0.0.1:4175');await page.selectOption('#range',range);await page.selectOption('#appearance',theme);await page.waitForFunction(()=>document.querySelector('#scene canvas')&&document.querySelector('#scene-detail').textContent.includes('固定视角'));await page.click('#skip');await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('100%'));await page.waitForTimeout(180);
 const snapshot=async()=>page.evaluate(async()=>{const c=document.querySelector('#scene canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');return {width:c.width,height:c.height,hash,summary:document.querySelector('#summary').textContent,detail:document.querySelector('#scene-detail').textContent}});
 const full=await snapshot();await page.click('#zoom-in');await page.click('#zoom-in');await page.waitForTimeout(180);const near=await snapshot();await page.screenshot({path:`/tmp/codeyears-assets-probe/${process.argv[2]}-${range}.png`});
 await page.evaluate(()=>window.addEventListener('pagehide',()=>console.log('ASSET_CLOSE '+JSON.stringify({canvases:window.__canvases.length,live:window.__canvases.filter(c=>c.width&&c.height).length,scene:document.querySelectorAll('#scene canvas').length}))));await page.goto('about:blank');assert.equal(errors.length,0);assert.equal(closed.length,1);assert.equal(closed[0].live,0);assert.equal(closed[0].scene,0);results.push({range,theme,full,near,loaded:[...new Set(loaded)].sort(),close:closed[0]});await page.close();
 }fs.writeFileSync(`/tmp/codeyears-assets-probe/${process.argv[2]}-preview.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({browser:await browser.version(),results,status:'PASS'}));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

```

浏览器逐图核对：用 createImageBitmap 加载原始 PNG 与优化 PNG，drawImage 到同尺寸 Canvas（每次 clearRect），读取 getImageData 全 RGBA 字节逐一比较；关闭 bitmap 并清零临时 canvas。WebP 诊断使用同样默认路径；单张排查再对比 premultiplyAlpha=none/premultiply。不能把 WebP 在 Pillow 的通过结果替换成浏览器通过。

## 逐文件审计表

RGBA SHA-256 是基线与正式优化文件各自解码后完整字节的相同哈希，包含全透明处 RGB 与 alpha；每张的 alpha 通道还单独逐字节比较通过。下列宽高前后相等，单位为像素，文件仍为 RGBA PNG。

| 文件 | 宽×高 | 原 bytes | 优化 bytes | 前后相同的 RGBA SHA-256 |
| --- | --- | ---: | ---: | --- |
| apartment.png | 1254×1254 | 2257385 | 2091849 | `9fcc2019b4360eed90c5cf4f6bfe378ea6ced36af7d5422ba0d478b892e270df` |
| hall.png | 1254×1254 | 1472235 | 1347034 | `f8f4000c4ad637be4cb6327a00ea1f2641fccf4a5b89f48eed591addd2a19ec5` |
| house.png | 1254×1254 | 2343808 | 2193264 | `bac85f9bea836f446730671fee53d7245c5f8d8ffa15a75e74e7fe50a23615c3` |
| office.png | 1254×1254 | 1933665 | 1789868 | `60b69c39c2fb6f1c597925c6d7e6ac08786d5574f15c86fe3d53a03a1a5c03c3` |
| outskirts-forest.png | 1536×1024 | 3235806 | 2996772 | `525293c5d309cd6e04dea0fed4b5049eb7af27688b0612af4b2f82c543fbb87e` |
| outskirts-hills.png | 1536×1024 | 2732744 | 2495979 | `7050d14d3ad34b45f5c4b6dea99dd53d3b8d751ee64c7a0cea8967156eabbe54` |
| outskirts-meadow.png | 1536×1024 | 2918248 | 2650419 | `798fb107056b2864c7b70f932b235174b7e7a4028e68b54c229e26b09f0a4123` |
| stadium.png | 1254×1254 | 2296146 | 2070104 | `940805e351ab45ed1f7d7d426cb2760955b0ba3cd8eaceb4738f0aebec2529e3` |
| tower.png | 1254×1254 | 1514095 | 1431623 | `70e4389e13ceb9d9e63898197b13a1735da9b300ee0ace2f1a1c831b3a7f8071` |
| unit-apartment-h2-a.png | 1024×1536 | 2701848 | 2529475 | `241c431761591b1830559302cfd416de43ffc80fe7f8f45cbcbcaa8adec28f81` |
| unit-apartment-h2-b.png | 1040×1513 | 2109479 | 1960461 | `b1986cc667f43a470111ea4743403c616e25242b322c5cfdde21ed027ac00810` |
| unit-broadleaf-a.png | 1254×1254 | 2524750 | 2292521 | `7da8038b53f22b84ddba93720d842530b3e64a4e51c70ce35a6723c09f661f93` |
| unit-conifer-b.png | 1254×1254 | 1401940 | 1267880 | `4369ce36d055b3c03a255a15a50bdece8c1670a185d8a1f42639c2f04b0cf067` |
| unit-fire-b.png | 1536×1024 | 2107979 | 1864501 | `5df22c9efb9087c82a40b90bfd7653c70ef7c144006514b72fe4caf1b6ade1c8` |
| unit-forest-2x2-a.png | 1254×1254 | 3051160 | 2725128 | `f4ad7744b4f0b256eb68d721b06eff890c86426af37ed585324e0c4286b87b55` |
| unit-forest-2x2-b.png | 1254×1254 | 2549486 | 2298119 | `6d237cd75015742c5529c50a8a4a1befe7e9f2967cc5bd95a3bdd76225cc93d6` |
| unit-grass-1x1-a.png | 1774×887 | 1299636 | 1140092 | `f8b341f3dc67b2f282c6bdd4a42271d54f1f224b50214ad473de10b9a51de3e8` |
| unit-grass-1x1-b.png | 1774×887 | 1225466 | 1075853 | `1e759c89731809dda1f78f82a656dbe2af77b3b07eaa22096a124d506279df90` |
| unit-grass-2x2-a.png | 1774×887 | 2017609 | 1764533 | `7a77fd6abc5effd5e6928ced3320e4e8e3254d8f3b161089a83a1948e342075c` |
| unit-grass-2x2-b.png | 1774×887 | 2146018 | 1884970 | `257056af1da4e5a55b60f1f6b4d54c7cc1ea1ac8e074ab2b2d3572ab1657620e` |
| unit-mixed-use-b.png | 1254×1254 | 1860210 | 1675730 | `553e807675848e1331657185f5768ab1f62d039801ac46827c586f4f62c59120` |
| unit-office-deep-h3-a.png | 1024×1536 | 1932335 | 1716148 | `b6c3b611039a4764472d0943fadaf7505ef4466770c955e8978722c661700c4b` |
| unit-office-deep-h3-b.png | 1024×1536 | 2021521 | 1801956 | `003990cff25df74caed8364ce1dd80536a2dff86e2af250afe6ee63ae1004255` |
| unit-office-h3-a.png | 1024×1536 | 2040875 | 1834988 | `d73cdee65ae1314f0b0c1d787aa96d96676317609ebbb47ec723df9cccb0f596` |
| unit-office-h3-b.png | 1024×1536 | 1891603 | 1682208 | `466d29dca4c8da1483369773196259491b1ba17821ec5ef05923e2416b9da0e1` |
| unit-office-wide-h3-a.png | 1024×1536 | 2102492 | 1879426 | `1142b621390968139ae87351f46d66b0f8074d790afb1936b89afc9d60bbdb17` |
| unit-office-wide-h3-b.png | 1024×1536 | 2107423 | 1859625 | `8361e7a0d378898b217a2d4774dc5485856e144a95a4889b57d135dc6ba08ff1` |
| unit-plaza-a.png | 1536×1024 | 2050435 | 1834393 | `4fef6ca743762f0b5096d0ef762e454908a202fa4e853c4671ca7b38ea34331f` |
| unit-plaza-b.png | 1774×887 | 1047410 | 919882 | `3bf83acf8159d37c2411690bd8c84d5fd190019a901bfaacc9881b89f8bf52be` |
| unit-police-a.png | 1536×1024 | 2073867 | 1865247 | `6b0de103d91d23f59dd7713a8a3b98c61545488e1cbe5c5666cf05c24c6e6815` |
| unit-pond-a.png | 1774×887 | 1727045 | 1617315 | `e54d26486af64966a8ba2946deaf57943a6f9f42a3f3691d53dad6d5e59b9713` |
| unit-pond-b.png | 1774×887 | 1525145 | 1442117 | `baa8feadd709f2d089e4065c14268340cc750f50e0cc2ce81745224ffa0aa188` |
| unit-small-grove-1x2-a.png | 1254×1254 | 2343233 | 2115479 | `4442962dbe070a54da3f353fa07b5ea081eeb9fbff44e7b7f4a3003d722868bd` |
| unit-small-grove-1x2-b.png | 1254×1254 | 2259439 | 2015786 | `2c6bd5e11d9a9892a20a4c28cd10dd33ffb4aa5f0b0ad0be670e5e0817929179` |
| unit-small-grove-2x1-a.png | 1254×1254 | 2566847 | 2322685 | `87e64aae7420cb0fb2fb084f7b46b5db6ce05c2bfbd06cbd4985d3e646039edf` |
| unit-small-grove-2x1-b.png | 1254×1254 | 2420814 | 2150964 | `22a32bc7344c2764bcc2cd6cb466b250ecb34f6879f9d81c476902e23af8a41f` |
| unit-stadium-a.png | 1254×1254 | 1735374 | 1607260 | `4a33c5bb4d223395ab69bc220ec8ef2d80a6c89a9cf235458ff6864b7a6671b4` |
| unit-terminal-b.png | 1254×1254 | 1964451 | 1804266 | `520cd5e78303a4e1a4a7d8634514fc8d7919fb06f61f2fdb0fc951057e2212ca` |
| unit-tower-deep-h4-a.png | 1024×1536 | 1782894 | 1572807 | `04d3d8ee465df62368f869f74903b01e82c4ed4cd87cbdd6733045f727c8f534` |
| unit-tower-deep-h4-b.png | 1024×1536 | 1712275 | 1491288 | `3ed4df4c8ddd5765652965283fabbc91caf0b801829b0b08551624fd8b3c0700` |
| unit-tower-h4-a.png | 1024×1536 | 1385455 | 1173105 | `a1f1aa1638b83d2604911223b59602a65822cc25fdb6278440ae76951200e7f3` |
| unit-tower-h4-b.png | 1086×1448 | 764032 | 721227 | `888ebef57418d3f190a283cb4aabaf2d8363a20232e0cbf802ac4a138ab80623` |
| unit-tower-wide-h4-a.png | 1024×1536 | 1777071 | 1564901 | `ca5e03e8e48884cce0fca64d364f29437cea003df58c0035445d587dbbcd8557` |
| unit-tower-wide-h4-b.png | 1024×1536 | 1829295 | 1610602 | `0222024c7c1b99ccc5d09a4379f7996a7eef9579a1033f3ad8e7c820f85be987` |
| unit-townhouse-a.png | 1254×1254 | 1778572 | 1643720 | `4c7f8aab24d64076ad7c61dcb1909a90cf81ead0a5a1f4a423e97944e516b353` |
| unit-wonder-park.png | 1448×1086 | 2089887 | 1903108 | `0d20ea3a94c6420210b3c48f8c7cae3aad4dfcb3b3782aaf987c4651e9ba96b1` |
| unit-wonder-stadium.png | 1536×1024 | 2517446 | 2314457 | `ee08ed7e8e03e88f56cb83e873690138237fcc8daabc56125f2c07714df8c86a` |
| unit-wonder-theater.png | 1536×1024 | 2594160 | 2395495 | `4506cb54b2423e74b0b3a44fbd27e0a567980747e8c6fa1af436d3f06d6be1da` |
