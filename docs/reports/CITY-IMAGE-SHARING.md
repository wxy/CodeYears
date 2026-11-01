# City 图片分享预览 · 云端交付

日期：2026-11-01。起点 `fcaf594398be9161a7bb7d52817a10effff6efe8`，分支 `codex/city-image-sharing`；PR base 为 `codex/city-connected-landscape`（依赖 #33），不向 main 重复交付、不合入。仅新增 `src/extension/city-share.ts` 和本报告；content、renderer、manifest、依赖及全局文档未改。

## 分享重试状态修正 · 2026-11-01

本地反馈先失败后重试打开系统面板、取消时仍残留失败文字。本轮仅在 share.onclick 的有效新尝试开始处清空 status，不改 AbortError 判断或跨 realm 行为，不扩大分享能力/生命周期。原生面板显示实际 PNG 的本地证据由组合报告维护，本云端不冒领。

针对性 Chromium 154 受控路径：先模拟 NotAllowedError，确认失败提示；再次点击时让 share Promise 保持 pending，立即确认旧文字已为空；随后以同 realm DOMException AbortError 取消，最终 status 仍为空、按钮恢复。`npm run check` 与 `git diff --check` 通过；未重跑首轮完整矩阵/构建，未补单测，过程脚本清理。跨 realm AbortError 是否需要另行处理保留给后续独立判断，本次不变更。

复现：按下方原有外部 Playwright 路径与浏览器参数，在 root 内创建本组件；share 第一次 reject NotAllowedError，第二次保存 reject 回调并等待，检查点击后 output 已为空，再 reject(new DOMException('user cancelled','AbortError'))，等待按钮恢复后核对 output 为空。prepare 使用本地 16×16 PNG，无真实贡献数据或远程上传。

## 接口与已实现行为

```ts
createCityShare(root: ShadowRoot, options: {
  prepare: () => Promise<{ blob: Blob; width: number; height: number }>;
  range: string;
  filename: string;
}): { open(): Promise<void>; dispose(): void }
```

创建时在 root 加入隔离样式及可关闭的原生 dialog；用户点击触发 open，先显示准备中，再等待本地 prepare 图片与解码成功，展示真实尺寸、PNG 预览、可编辑配文、保存与复制按钮。默认配文仅有范围、CodeYears 项目地址和标签，不自动加入身份、精确贡献量或原始每日数据。range/filename 以 value/textContent/DOM 属性赋值，不插入外部 HTML；没有远程上传、遥测或权限请求。

保存使用当前本地 blob URL 的下载 anchor，无 downloads 权限；复制用 clipboard.writeText，失败明确提示手动选择复制并选中配文，不降级申请权限。只有实际 File 通过 navigator.canShare({files}) 且有 navigator.share 时显示系统按钮；点击处理器在任何异步等待之前直接调用 share({files,text})，使用当时编辑后的配文。AbortError 取消不显示失败，其他失败保留保存/复制替代方式。

关闭按钮与 Escape 清空预览、配文和 File，立即 revoke URL；重开先清理旧结果。open 的代次与 dispose 标志防止晚到 prepare/解码、复制或分享结果更新旧会话。dispose 幂等关闭并移除 dialog/style，后续 open 无操作；不新增通用生命周期层。已经交给系统分享/下载的用户操作由浏览器处理，本模块不实现上传或后台队列。

本地调用方每次 City 成功生成后创建本组件，在城市关闭、重生成、身份清理、后台/导航等对应城市销毁路径 dispose。prepare 由本地 renderer 实现高分辨率 PNG、最长 8192 与像素预算；本模块只消费 Blob/尺寸，不分配导出画布、不定义 renderer 导出/缩放行为，也不重复实现其像素预算。open 的 Promise 在准备完成/失败/作废时结束，不要求等待用户关闭。

## 实际验证与局限

Linux、Node v24.19.0、npm 11.9.0；Chromium 154.0.8037.57 headless，1200×1050。实际浏览器加载本模块（Node 仅移除 TypeScript 类型），ShadowRoot 内真实 dialog、图片解码、下载 anchor 与 File。fixture 是本机 Canvas 生成的 2048×1024 PNG，非真实用户城市或已登录 MV3。

- 预览尺寸文字与 image.naturalWidth/Height 均为 2048×1024。已查看实际预览图；配文可修改，复制替身收到逐字一致的编辑内容。
- 实际浏览器 download 事件保存 `codeyears-city.png`，44,595 bytes；PNG 签名及 IHDR 尺寸 2048×1024 校验通过，不是仅断言按钮被点过。
- 本机 Chromium 的原生 share/canShare 均 undefined，实际走保存+复制降级，不声称已打开真实 OS 分享面板。受控 canShare 分别返回 false/true，验证以实际准备的 PNG File 调用，只有 true 才显示系统分享。
- 受控 share 依次模拟取消、失败、成功：取消后无错误，失败提示保存/复制；三次调用均记录 userActivation.isActive=true、当前编辑文本及正确文件名。仅证明按钮手势/数据调用，不替代真实系统分享目标兼容性。
- clipboard 拒绝时出现“手动选择复制”，配文被选中；未申请新权限。
- 关闭、Escape、重开和 dispose 共创建 5 个 blob URL，全部 5 个 revoke。关闭/销毁发生在 prepare 结束前时，晚到 Blob 不创建新 URL、不重开；旧 open 晚于新 open 完成时，不覆盖新配文或图像。销毁后 open 不重建 UI。
- prepare 拒绝显示简洁错误且无可保存旧图；浏览器 pageerror=0。未补写事后单元测试，只有可清理的直接路径 E2E。图片、脚本、下载文件与构建结束后清理，不提交。
- `npm run check`、`npm run build -- --outDir /tmp/codeyears-share-build`、`git diff --check` 通过。该模块尚未被 content 引用，构建成功不代表它已进入正式运行入口；报告不把未变化的主包体积当本模块新增开销。

本地仍须集成 renderer.prepare、content 事件与每个城市释放路径，验证真实高清城市、最长尺寸/预算、缩放不闪动、实际 Chrome/Edge 复制/下载/系统分享和身份变更。这里没有这些范围的验收证据，不把云端受控替身冒充本机结果；PR 暂不合入。

## 复现

仓库根目录执行。使用环境已有的外部 Playwright/Chromium，不改依赖；正常启用命令工具网络权限以创建 Chromium socket。页面请求由 route 拦截，本模块没有远程上传。

```sh
npm run check
npm run build -- --outDir /tmp/codeyears-share-build
mkdir -p /tmp/codeyears-share-probe
cat > /tmp/codeyears-share-probe/check.cjs <<'CITY_SHARE_E2E'
const fs=require('node:fs'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const context=await browser.newContext({acceptDownloads:true,viewport:{width:1200,height:1050}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://github.com/**',r=>r.fulfill({contentType:'text/html',body:'<h1>City share controlled preview</h1><div id="host"></div>'}));await page.goto('https://github.com/fixture-user');
 await page.addScriptTag({content:stripTypeScriptTypes(fs.readFileSync('src/extension/city-share.ts','utf8')).replace(/export /g,'')});
 const native=await page.evaluate(async()=>{
  window.root=document.querySelector('#host').attachShadow({mode:'open'});root.innerHTML='<button id="launch">导出图片</button>';
  const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const g=canvas.getContext('2d');g.fillStyle='#edf0e6';g.fillRect(0,0,2048,1024);g.fillStyle='#6f8c81';for(let i=0;i<8;i++)g.fillRect(180+i*210,400-i%3*70,130,240+i%3*70);window.fixture={blob:await new Promise(r=>canvas.toBlob(r,'image/png')),width:2048,height:1024};
  window.created=[];window.revoked=[];const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);URL.createObjectURL=b=>{const url=create(b);created.push(url);return url};URL.revokeObjectURL=url=>{revoked.push(url);revoke(url)};
  window.clipboard=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{if(window.copyFail)throw new DOMException('fixture denied','NotAllowedError');clipboard.push(text)}}});
  window.mount=(prepare=async()=>fixture)=>{window.component?.dispose();window.component=createCityShare(root,{prepare,range:'2020–2025',filename:'codeyears-city.png'});root.querySelector('#launch').onclick=()=>{window.openPromise=component.open()}};
  mount();return {share:typeof navigator.share,canShare:typeof navigator.canShare};
 });
 const root=page.locator('#host'),dialog=root.locator('dialog'),launch=root.locator('#launch');
 await launch.click();await dialog.locator('.cy-share-ready').waitFor();assert.equal(await dialog.locator('.cy-share-size').textContent(),'2048 × 1024 像素');assert.equal(await dialog.locator('img').evaluate(i=>[i.naturalWidth,i.naturalHeight]).then(JSON.stringify),'[2048,1024]');
 assert.equal(await dialog.locator('.cy-share-system').isVisible(),false);assert((await dialog.locator('textarea').inputValue()).includes('2020–2025'));await dialog.locator('textarea').fill('我的城市\n编辑后的配文');await dialog.locator('.cy-share-copy').click();assert.deepEqual(await page.evaluate(()=>clipboard),['我的城市\n编辑后的配文']);
 const event=page.waitForEvent('download');await dialog.locator('.cy-share-save').click();const download=await event;assert.equal(download.suggestedFilename(),'codeyears-city.png');await download.saveAs('/tmp/codeyears-share-probe/download.png');const png=fs.readFileSync('/tmp/codeyears-share-probe/download.png');assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),2048);assert.equal(png.readUInt32BE(20),1024);
 await page.screenshot({path:'/tmp/codeyears-share-probe/preview.png'});
 await page.evaluate(()=>window.copyFail=true);await dialog.locator('.cy-share-copy').click();assert((await dialog.locator('output').textContent()).includes('手动选择复制'));assert.equal(await dialog.locator('textarea').evaluate(t=>t.selectionEnd-t.selectionStart), '我的城市\n编辑后的配文'.length);
 await dialog.locator('.cy-share-close').click();assert.equal(await dialog.getAttribute('open'),null);assert.equal(await page.evaluate(()=>created.length===revoked.length),true);
 // canShare is evaluated with the actual prepared File; share call captures active click and edited text.
 await page.evaluate(()=>{window.capChecks=[];window.shareCalls=[];Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>{capChecks.push({length:data.files.length,name:data.files[0].name,type:data.files[0].type,size:data.files[0].size});return true}});Object.defineProperty(navigator,'share',{configurable:true,value:data=>{shareCalls.push({text:data.text,files:data.files.map(f=>f.name),active:navigator.userActivation.isActive});return window.shareMode==='cancel'?Promise.reject(new DOMException('user cancelled','AbortError')):window.shareMode==='fail'?Promise.reject(new DOMException('fixture denied','NotAllowedError')):Promise.resolve()}});window.copyFail=false;mount()});
 await launch.click();await dialog.locator('.cy-share-system').waitFor();await dialog.locator('textarea').fill('分享新配文');await page.evaluate(()=>window.shareMode='cancel');await dialog.locator('.cy-share-system').click();await page.waitForTimeout(20);assert.equal(await dialog.locator('output').textContent(),'');await page.evaluate(()=>window.shareMode='fail');await dialog.locator('.cy-share-system').click();assert((await dialog.locator('output').textContent()).includes('保存图片或复制配文'));await page.evaluate(()=>window.shareMode='success');await dialog.locator('.cy-share-system').click();assert((await dialog.locator('output').textContent()).includes('系统分享'));const shareCalls=await page.evaluate(()=>shareCalls);assert(shareCalls.every(c=>c.active&&c.text==='分享新配文'&&c.files[0]==='codeyears-city.png'));assert(await page.evaluate(()=>capChecks.every(c=>c.length===1&&c.type==='image/png'&&c.size>0)));
 await page.keyboard.press('Escape');assert.equal(await dialog.getAttribute('open'),null);assert(await page.evaluate(()=>created.length===revoked.length));
 // Unsupported files never show the native button, but download and copy remain.
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});mount()});await launch.click();await dialog.locator('.cy-share-ready').waitFor();assert.equal(await dialog.locator('.cy-share-system').isVisible(),false);assert(await dialog.locator('.cy-share-save').isVisible());
 // Reopening releases the previous ready URL; disposal releases the replacement and removes UI.
 await page.evaluate(()=>window.openPromise=component.open());await dialog.locator('.cy-share-ready').waitFor();assert.equal(await page.evaluate(()=>created.length-revoked.length),1);await page.evaluate(()=>component.dispose());assert.equal(await root.locator('dialog').count(),0);assert(await page.evaluate(()=>created.length===revoked.length));
 // Close before prepare resolves: no URL is created and the old result cannot reopen.
 await page.evaluate(()=>{mount(()=>new Promise(r=>window.resolveLate=r))});await launch.click();await dialog.waitFor();await dialog.locator('.cy-share-close').click();const before=await page.evaluate(()=>created.length);await page.evaluate(async()=>{resolveLate(fixture);await openPromise});assert.equal(await dialog.getAttribute('open'),null);assert.equal(await page.evaluate(()=>created.length),before);
 // Dispose before resolve: same guarantee, including an attempted later open().
 await page.evaluate(()=>{mount(()=>new Promise(r=>window.resolveLate=r))});await launch.click();await page.evaluate(async()=>{component.dispose();resolveLate(fixture);await openPromise;await component.open()});assert.equal(await root.locator('dialog').count(),0);assert.equal(await page.evaluate(()=>created.length),before);
 // A late first open cannot overwrite a newer open that has already succeeded.
 await page.evaluate(()=>{let n=0;mount(()=>++n===1?new Promise(r=>window.resolveFirst=r):Promise.resolve(fixture))});await launch.click();await page.evaluate(()=>window.newOpen=component.open());await dialog.locator('.cy-share-ready').waitFor();await dialog.locator('textarea').fill('保留新结果');await page.evaluate(async()=>{resolveFirst(fixture);await openPromise});assert.equal(await dialog.locator('textarea').inputValue(),'保留新结果');await page.evaluate(()=>component.dispose());
 await page.evaluate(()=>mount(async()=>{throw Error('fixture export failed')}));await launch.click();await page.waitForFunction(()=>root.querySelector('output').textContent.includes('图片准备失败'));assert.equal(await dialog.locator('.cy-share-ready').isVisible(),false);await page.evaluate(()=>component.dispose());assert(await page.evaluate(()=>created.length===revoked.length));
 assert.equal(errors.length,0);console.log(JSON.stringify({browser:await browser.version(),native,downloadBytes:png.length,shareCalls,urls:await page.evaluate(()=>({created:created.length,revoked:revoked.length})),pageErrors:errors,status:'PASS'}));await context.close();
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
CITY_SHARE_E2E
node /tmp/codeyears-share-probe/check.cjs
git diff --check
rm -rf /tmp/codeyears-share-probe /tmp/codeyears-share-build
```
