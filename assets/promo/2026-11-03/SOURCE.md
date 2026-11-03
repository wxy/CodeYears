# 海报构图源稿

正式创意源稿，非测试附件。制作使用原生Canvas与固定版本City渲染器；没有AI重绘产品。

在临时Vite制作页设置 `@codeyears` 指向本项目 `src`，`publicDir` 指向 `public`，加载HTML中1600×2000的 `#poster` canvas、`#status`说明和`#save`按钮。以下TypeScript作为入口；将 `__CANVAS_FONTS__` 换成本机canvas-design字体目录，并设置 `/save-poster` 接口接收最终PNG blob。制作页不作为扩展功能或独立网站发布。

本机长期保留的完整制作页位于用户指定 dots 目录的 `projects/2026-11-03-codeyears-010-poster/source`。复作命令：`dots/bin/run-task 2026-11-03-codeyears-010-poster -- env CODEYEARS_SOURCE=<本仓库固定版本路径> node <Vite入口> --config vite.config.mjs --configLoader native`。本次源码版本与原始数据生成规则见README。

```ts
import {planCityScene, createCityView} from '@codeyears/renderers/city-view.ts';
import {loadCityImages,closeCityImages} from '@codeyears/renderers/city-assets.ts';

const brand = new FontFace('Brand', 'url(/@fs/__CANVAS_FONTS__/WorkSans-Bold.ttf)');
const mono = new FontFace('Mono', 'url(/@fs/__CANVAS_FONTS__/DMMono-Regular.ttf)');
document.fonts.add(await brand.load());document.fonts.add(await mono.load());
const icon = new Image();icon.src='/icons/codeyears-512.png';await icon.decode();
const days=[];let seed=20240101;
for(let t=Date.UTC(2023,0,1);t<=Date.UTC(2026,10,3);t+=86400000){
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;
 const date=new Date(t),index=Math.floor((t-Date.UTC(date.getUTCFullYear(),0,1))/86400000),section=Math.floor(index/7)%13;
 const count=section<3?(seed%3===0?1:0):section<6?1+seed%5:section<10?6+seed%20:25+seed%61;
 const day=date.toISOString().slice(0,10);if(day>='2024-01-01')days.push({date:day,count});
}
// 展示 2024–2026 ISO 周年，保留日期/数量本身；不把边界日期生成第四条街区。
import {isoWeekDate} from '@codeyears/data/iso-week.ts';
const selected=days.filter(day=>isoWeekDate(day.date).year>=2024&&isoWeekDate(day.date).year<=2026);
const scene=planCityScene(selected,true);
const images=await loadCityImages(new URL('/assets/city/',location.href).href,scene.keys);
const city=createCityView(scene,images);
const poster=document.querySelector('#poster');const c=poster.getContext('2d',{alpha:false});
const W=1600,H=2000,zh='"PingFang SC","Hiragino Sans GB",sans-serif';
const ink='#ecf0df',mint='#c0dfb2',muted='#a4b9a7';
function text(str,x,y,size=28,color=ink,weight=400,font=zh){c.font=`${weight} ${size}px ${font}`;c.fillStyle=color;c.fillText(str,x,y);}
function rule(x1,y1,x2,y2){c.strokeStyle='#aec5a129';c.lineWidth=1;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
c.fillStyle='#082328';c.fillRect(0,0,W,H);
const ambient=c.createRadialGradient(1120,1160,0,1120,1160,1260);ambient.addColorStop(0,'#285344');ambient.addColorStop(.62,'#123d34');ambient.addColorStop(1,'#082328');c.fillStyle=ambient;c.fillRect(0,0,W,H);
c.drawImage(icon,100,92,82,82);text('CodeYears',208,151,48,ink,700,'Brand');
c.textAlign='right';text('GITHUB CONTRIBUTION CITY',1500,143,18,muted,400,'Mono');c.textAlign='left';
// 审核状态来自用户 2026-11-03 明确告知，不推断已获准商店安装。
c.fillStyle='#183e35';c.beginPath();c.roundRect(100,224,686,66,33);c.fill();c.strokeStyle='#bed9ac45';c.lineWidth=1;c.stroke();
c.fillStyle=mint;c.beginPath();c.arc(128,257,5,0,Math.PI*2);c.fill();text('0.1.0 · 已提交 Chrome 商店审核',151,267,27,mint);
text('代码岁月，',94,458,130,ink,600);
text('自成一座城。',94,624,146,mint,600);
text('把 GitHub 贡献记录，变成可以探索的城市。',102,709,35,'#b9cbb4');

city.draw(1,{width:1600,height:1060,dpr:1.5,zoom:1.65,panX:0,panY:-35,dark:false});
const layer=document.createElement('canvas');layer.width=W;layer.height=H;const l=layer.getContext('2d');
l.drawImage(city.canvas,0,750,1600,1060);
l.globalCompositeOperation='destination-in';
const mask=l.createLinearGradient(0,750,0,1810);mask.addColorStop(0,'#0000');mask.addColorStop(.16,'#000');mask.addColorStop(.77,'#000');mask.addColorStop(1,'#0000');l.fillStyle=mask;l.fillRect(0,0,W,H);
// 水平方向只渐隐外围背景，不重绘或重着色城市、道路和建筑。
l.globalCompositeOperation='destination-in';const sides=l.createLinearGradient(0,0,W,0);sides.addColorStop(0,'#0000');sides.addColorStop(.07,'#000');sides.addColorStop(.93,'#000');sides.addColorStop(1,'#0000');l.fillStyle=sides;l.fillRect(0,0,W,H);
c.drawImage(layer,0,0);layer.width=layer.height=0;
text('2024—2026 / CITY VIEW',100,1640,18,'#a8c2a3',400,'Mono');
c.textAlign='right';text('0.1.0 产品画面 · 示例贡献数据',1500,1640,21,'#b7c9ac');c.textAlign='left';
rule(100,1699,1500,1699);
const features=[['01','完全免费',100],['02','无需 GitHub Token',565],['03','数据留在本机',1100]];
for(const [number,label,x]of features){text(number,x,1756,18,muted,400,'Mono');text(label,x,1811,32,ink,500);}
rule(511,1744,511,1812);rule(1046,1744,1046,1812);
rule(100,1860,1500,1860);
text('了解 CodeYears',100,1924,24,mint,500);
c.textAlign='right';text('xingyu.wang/zh/extensions/codeyears',1500,1924,24,'#c4d1be',400,'Mono');c.textAlign='left';
const blob=await new Promise(resolve=>poster.toBlob(resolve,'image/png'));
const save=document.querySelector('#save');save.disabled=false;save.onclick=async()=>{await fetch('/save-poster',{method:'POST',body:blob});save.textContent='正式海报已保存';};
city.dispose();closeCityImages(images);
document.querySelector('#status').textContent=`1600 × 2000 正式海报已完成。${selected.length} 天合成数据，0.1.0 审核中；没有修改产品。`;
```
