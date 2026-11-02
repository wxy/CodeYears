# 深色 V2 排版源稿

本轮按用户反馈先修改宣传视觉，产品源码不变。沿用 [浅色版本的复作方法](SOURCE.md)，入口替换为下方 TypeScript；本机 PNG 导出接口改为 `/export/hero-v2` 和 `/export/detail-v2`。画布仍为 1600 × 1000，字体与生成数据不变。

V2 使用深青色渐变、低对比透视网格、城市外侧柔光、轻微色调处理、边缘渐隐和新版文字排布。它是标明状态的宣传视觉概念，不是当前扩展截图，也没有新增夜景主题或发光建筑功能。

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
const white = '#e4f4ec', muted = '#8caeaa', mint = '#a5e5b9';
const zh = '"PingFang SC", "Hiragino Sans GB", sans-serif';
function label(ctx, text, x, y, size = 20, color = muted, font = zh, weight = 400) {
  ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${font}`; ctx.fillText(text, x, y);
}
function background(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#071318'; ctx.fillRect(0, 0, 1600, 1000);
  const ambient = ctx.createRadialGradient(1090, 560, 30, 1090, 560, 930);
  ambient.addColorStop(0, '#204c47'); ambient.addColorStop(.55, '#102b2d'); ambient.addColorStop(1, '#071318');
  ctx.fillStyle = ambient; ctx.fillRect(0, 0, 1600, 1000);
  // 透视网格呼应贡献日历，保持低对比，不抢城市主体。
  ctx.save(); ctx.strokeStyle = '#8cc1ad'; ctx.globalAlpha = .045; ctx.lineWidth = 1;
  for (let x = -1500; x < 2600; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 1050); ctx.lineTo(x + 1550, 275); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 275); ctx.lineTo(x + 1550, 1050); ctx.stroke();
  }
  ctx.restore();
  label(ctx, 'CodeYears', 76, 83, 36, white, 'Instrument');
  ctx.strokeStyle = '#60898066'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(296, 56); ctx.lineTo(296, 84); ctx.stroke();
  label(ctx, 'GITHUB CONTRIBUTIONS, REIMAGINED.', 320, 77, 14, muted, 'DMMono');
  ctx.textAlign = 'right'; label(ctx, '开发中 · 视觉概念', 1524, 77, 19, '#b6cfc5'); ctx.textAlign = 'left';
  return ctx;
}
function cityLayer(ctx, x, y, width, height, zoom, panX, panY, fadeTop = false) {
  city.draw(1, { width, height, dpr: 1.5, zoom, panX, panY, dark: true });
  const layer = document.createElement('canvas'); layer.width = 1600; layer.height = 1000;
  const l = layer.getContext('2d');
  l.save(); l.globalAlpha = .18; l.filter = 'blur(26px) saturate(1.2)'; l.drawImage(city.canvas, x, y, width, height); l.restore();
  l.save(); l.filter = 'brightness(.89) saturate(.86) contrast(1.1)'; l.drawImage(city.canvas, x, y, width, height); l.restore();
  if (fadeTop) {
    l.globalCompositeOperation = 'destination-in';
    const mask = l.createLinearGradient(0, y, 0, y + 205); mask.addColorStop(0, '#0000'); mask.addColorStop(.35, '#0009'); mask.addColorStop(1, '#000');
    l.fillStyle = mask; l.fillRect(0, 0, 1600, 1000);
  }
  ctx.drawImage(layer, 0, 0); layer.width = layer.height = 0;
}
function footer(ctx, mode) {
  const veil = ctx.createLinearGradient(0, 821, 0, 1000); veil.addColorStop(0, '#07131800'); veil.addColorStop(.6, '#071318eb'); veil.addColorStop(1, '#071318');
  ctx.fillStyle = veil; ctx.fillRect(0, 821, 1600, 179);
  label(ctx, mode, 80, 892, 15, '#99bcb1', 'DMMono');
  ctx.strokeStyle = '#8fbea02b'; ctx.beginPath(); ctx.moveTo(80, 922); ctx.lineTo(1520, 922); ctx.stroke();
  label(ctx, '宣传视觉概念 · 示例数据', 80, 966, 18, '#8ca99f');
  ctx.textAlign = 'right'; label(ctx, 'github.com/wxy/CodeYears', 1520, 966, 18, '#96b6a9', 'DMMono'); ctx.textAlign = 'left';
}
const hero = document.querySelector('#hero');
const h = background(hero);
cityLayer(h, 184, 213, 1460, 728, 1.14, 44, 10);
const shade = h.createLinearGradient(0, 0, 730, 0); shade.addColorStop(0, '#071318ed'); shade.addColorStop(.54, '#07131850'); shade.addColorStop(1, '#07131800');
h.fillStyle = shade; h.fillRect(0, 112, 730, 675);
label(h, '让每一次贡献，', 76, 224, 82, white, zh, 600);
label(h, '长成一座城。', 76, 329, 90, mint, zh, 600);
label(h, '把 GitHub 记录，变成自己的风景。', 80, 395, 26, '#b2cbc0');
label(h, 'CITY', 82, 699, 17, mint, 'DMMono');
label(h, '代码岁月，在此生长。', 80, 740, 24, '#d0e3d8');
footer(h, '01 / CONTRIBUTION CITY                         2023—2025');

const detail = document.querySelector('#detail');
const d = background(detail);
cityLayer(d, -130, 256, 1830, 650, 2.7, 25, 40, true);
label(d, '放大你的代码岁月。', 76, 215, 76, white, zh, 600);
label(d, '每个街区，都藏着日常的积累。', 81, 279, 27, '#add2bd');
footer(d, '02 / A CLOSER LOOK                            SAME CITY.');

for (const [id, canvas] of [['hero', hero], ['detail', detail]]) {
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const button = document.querySelector(`#download-${id}`);
  button.href = '#'; button.removeAttribute('download');
  button.onclick = async event => { event.preventDefault(); await fetch(`/export/${id}-v2`, { method: 'POST', body: blob }); button.textContent = `${id === 'hero' ? '城市主图' : '建筑细节'} V2 PNG 已保存`; };
}
city.dispose(); closeCityImages(images);
document.querySelector('#status').textContent = '深色 V2 已生成。1600 × 1000 PNG；宣传视觉概念；当前渲染器＋示例数据，未改变产品。';
```
