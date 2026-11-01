# 图片排版源稿

正式创意源稿，非测试附件。使用当前 City 渲染器直接生成画布，没有 AI 重绘或后期修改城市图像。

画布尺寸 1600 × 1000；渲染 DPR 1.5；输入为 `generateDays("regular")`（种子 20060101）筛出的 2023-01-01 至 2025-12-31，共 1096 天。以下 TypeScript 可作为临时 Vite 页面的入口，页面需包含 `hero`、`detail` 两个 1600 × 1000 canvas、`download-hero`、`download-detail` 链接和 `status` 状态。

复作时更新 `/@fs/` 后的本机项目与字体目录。为临时 Vite 服务设置项目 `public` 为 `publicDir` 并允许这些目录；导出部分的本机 `/export/hero`、`/export/detail` POST 接口分别接收 PNG blob 并保存文件。不请求 GitHub 或其他网络服务。临时页面和服务不属于产品。

中文使用 macOS PingFang SC，英文产品名使用 Instrument Sans Regular，技术标记使用 DM Mono Regular；英文字体来自 canvas-design 自带的 OFL 字体。

```ts
import { planCityScene, createCityView } from '/@fs/__CODEYEARS__/src/renderers/city-view.ts';
import { loadCityImages, closeCityImages } from '/@fs/__CODEYEARS__/src/renderers/city-assets.ts';
import { generateDays } from '/@fs/__CODEYEARS__/src/renderers/probe/data.ts';

const sans = new FontFace('Instrument', 'url(/@fs/__CANVAS_FONTS__/InstrumentSans-Regular.ttf)');
const mono = new FontFace('DMMono', 'url(/@fs/__CANVAS_FONTS__/DMMono-Regular.ttf)');
document.fonts.add(await sans.load()); document.fonts.add(await mono.load());
const days = generateDays('regular').filter(day => day.date >= '2023-01-01');
const scene = planCityScene(days);
const images = await loadCityImages(new URL('/assets/city/', location.href).href, scene.keys);
const city = createCityView(scene, images);
const ink = '#203c30', muted = '#667669', green = '#3c7956';
const zh = '"PingFang SC", "Hiragino Sans GB", sans-serif';
function label(ctx, text, x, y, size = 20, color = muted, font = zh, weight = 400) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${font}`; ctx.fillText(text, x, y);
}
function foundation(canvas, number, mode) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f4ee'; ctx.fillRect(0, 0, 1600, 1000);
  label(ctx, 'CodeYears', 80, 84, 36, ink, 'Instrument');
  ctx.fillStyle = green; ctx.beginPath(); ctx.arc(1269, 72, 5, 0, Math.PI * 2); ctx.fill();
  label(ctx, '开发中预览', 1287, 79, 20, ink);
  label(ctx, number, 1483, 79, 18, muted, 'DMMono');
  ctx.strokeStyle = '#cfd7ca'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(80, 914); ctx.lineTo(1520, 914); ctx.stroke();
  label(ctx, '当前程序渲染 · 示例数据', 80, 958, 18, muted);
  ctx.textAlign = 'right'; label(ctx, 'github.com/wxy/CodeYears', 1520, 958, 19, muted, 'DMMono'); ctx.textAlign = 'left';
  label(ctx, mode, 80, 873, 17, muted, 'DMMono');
  return ctx;
}
function drawCity(ctx, x, y, width, height, zoom, panX = 0, panY = 0) {
  city.draw(1, { width, height, dpr: 1.5, zoom, panX, panY, dark: false });
  ctx.drawImage(city.canvas, x, y, width, height);
}
const hero = document.querySelector('#hero');
const h = foundation(hero, '01', 'CITY / 2023—2025');
drawCity(h, 410, 210, 1120, 650, 1.04);
label(h, '代码岁月，', 80, 223, 74, ink, zh, 600);
label(h, '自成一座城。', 80, 320, 74, ink, zh, 600);
label(h, '让 GitHub 贡献记录', 84, 399, 26);
label(h, '长成自己的风景。', 84, 440, 26);
label(h, 'GitHub 贡献可视化', 82, 795, 21, ink);

const detail = document.querySelector('#detail');
const d = foundation(detail, '02', 'CITY / A CLOSER LOOK');
label(d, '每天的积累，都有了形状。', 80, 217, 64, ink, zh, 600);
label(d, '同一座城，换个距离看看。', 84, 274, 25);
drawCity(d, 80, 313, 1440, 499, 2.7, 0, 25);

for (const [id, canvas] of [['hero', hero], ['detail', detail]]) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const button = document.querySelector(`#download-${id}`);
  button.href = '#'; button.removeAttribute('download');
  button.onclick = async event => { event.preventDefault(); await fetch(`/export/${id}`, { method: 'POST', body: blob }); button.textContent = `${id === 'hero' ? '城市主图' : '建筑细节'} PNG 已保存`; };
}
city.dispose(); closeCityImages(images);
document.querySelector('#status').textContent = '两张图片已生成。1600 × 1000 PNG；2023–2025 确定性示例数据，无真实账户信息。';
```
