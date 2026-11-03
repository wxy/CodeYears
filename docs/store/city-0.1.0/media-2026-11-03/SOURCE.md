# 宣传图块构图源说明

这里只保留正式设计参数，不归档演示服务或捕获脚本。

输入为本报告所述1238×703原始城市Canvas（同一三年数据，展开后放大一次）、正式 `public/icons/codeyears-512.png`，以及 Work Sans Bold 字体。字体仅栅格化进PNG，未分发字体文件；本机使用canvas-design技能附带字体，SHA-256 `240d125fc9f8561363dc1ea3f513501253bd70942f41468f48f0b0cafb0c82e2`。

以下是最终构图核心，可在本地设计页中复作。`city`为已加载的原始城市PNG，`icon`为已加载的512px图标；先用FontFace加载粗体并注册名为 `CodeYearsBrand` 的字体。所有城市缩放保持比例，色彩渐变仅是品牌构图层。

```js
function drawPromoTiles(city, icon) {
 const small=document.createElement('canvas');small.width=440;small.height=280;const s=small.getContext('2d',{alpha:false});
 s.fillStyle='#0a2c2e';s.fillRect(0,0,440,280);
 const ratio=city.width/1238;
 s.drawImage(city,80*ratio,84*ratio,1100*ratio,560*ratio,0,56,440,224);
 let gradient=s.createLinearGradient(0,0,0,124);gradient.addColorStop(0,'#0a2c2e');gradient.addColorStop(.45,'#0a2c2e');gradient.addColorStop(1,'#0a2c2e00');s.fillStyle=gradient;s.fillRect(0,0,440,124);
 s.drawImage(icon,376,17,44,44);s.font='700 33px CodeYearsBrand';s.fillStyle='#f6f5e9';s.fillText('CodeYears',21,48);
 gradient=s.createLinearGradient(0,239,0,280);gradient.addColorStop(0,'#092b2800');gradient.addColorStop(1,'#092b28c9');s.fillStyle=gradient;s.fillRect(0,239,440,41);
 s.font='10px system-ui';s.fillStyle='#f1f3e8';s.fillText('Demo data',19,266);
 const marquee=document.createElement('canvas');marquee.width=1400;marquee.height=560;const m=marquee.getContext('2d',{alpha:false});
 m.fillStyle='#09282a';m.fillRect(0,0,1400,560);m.drawImage(city,80*ratio,74*ratio,1080*ratio,550*ratio,300,0,1100,560);
 gradient=m.createLinearGradient(180,0,660,0);gradient.addColorStop(0,'#09282a');gradient.addColorStop(.48,'#09282aee');gradient.addColorStop(1,'#09282a00');m.fillStyle=gradient;m.fillRect(0,0,660,560);
 gradient=m.createLinearGradient(0,400,0,560);gradient.addColorStop(0,'#09282a00');gradient.addColorStop(1,'#09282a66');m.fillStyle=gradient;m.fillRect(0,400,1400,160);
 m.drawImage(icon,68,151,76,76);m.font='700 62px CodeYearsBrand';m.fillStyle='#f6f5e9';m.fillText('CodeYears',66,310);m.font='14px system-ui';m.fillStyle='#c6d6c5';m.fillText('Demo data',70,516);

 return { small, marquee };
}
// 使用 canvas.toBlob(callback, 'image/png') 导出，无alpha的RGB画布。
```

没有重绘建筑、改变数量或添加产品不存在的控件。PNG中的城市不是新的渲染主题，截图中的正式界面未应用宣传渐变。不同浏览器的字体栅格化可能产生不同文件哈希。

## 运行包核对

| 原始运行文件 | Bytes | SHA-256 |
| --- | ---: | --- |
| entry.js | 10254 | `0ccf5a290d446b0505d6c9759e44adc39085237799c47f6313a8a891d9b669e9` |
| content.js | 47671 | `2a3d141e904828d0ff1e878b30ef4243fe73c6ebfa6e656439fa1c18fb1e028d` |
| landscape.js | 147631 | `543bf4f799b71599c27ea5eac15dded874409b12325c53796f350d92effcc0ac` |

这些哈希指实际发行包中的原文件；本机演示适配头不写回这些文件或发行包。

## 最终交付文件

| 文件 | Bytes | SHA-256 |
| --- | ---: | --- |
| global/01-city-overview.jpg | 204852 | `2b5e0d8b29e329d6ac3ee23102ee92ed858c7c2e7a1e786fa9b08c7e716047b7` |
| global/marquee-promo.png | 1227924 | `b4b2ea65038e6581a94ef18d7092e5837be4472bd015420bfdb1fa92c169b304` |
| global/small-promo.png | 219009 | `ece453000157811dfa484e87a6f01a003806c708c1e40c371b4cd01ff96a5846` |
| localized/en/01-neighborhood-detail.jpg | 210473 | `6d68361c8eb8412a76f03da65987ba9ee9c777b35d5e321d41a150dc03904223` |
| localized/zh_CN/01-profile-controls.jpg | 135036 | `80e50bdd1cb17c89e0018395b2d3e8a1889d13015bd133bb777d80fa21a376f4` |
