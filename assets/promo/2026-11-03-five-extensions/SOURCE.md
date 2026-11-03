# 技术目录 V2 · 构图源稿

正式画布1600×1000，无渐变、阴影、发光或卡片材质。Big Shoulders Bold用于主数字，Instrument Sans Bold用于产品名，JetBrains Mono Regular用于索引标签，中文使用本机PingFang SC。字体仅栅格化进PNG，不分发字体文件。

以下是最终创作代码，图片来自本目录icons中的原样正式图标；替换字体及图标加载路径后可复作。不保留临时HTTP服务和捕获页面。

```js

const products=[
 ['HiTable','hitable','网页表格分析','DATA'],
 ['Navigraph','navigraph','浏览路径可视化','NAVIGATION'],
 ['SilentFeed','silentfeed','AI 驱动的 RSS 阅读','READING'],
 ['AI Pulse','ai-pulse-chrome','AI 服务用量与余额','MONITORING'],
 ['CodeYears','codeyears','GitHub 贡献城市','VISUALIZATION'],
];
const loadImage=src=>new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
async function draw(){
 const fonts=[['CatalogDisplay','/display.ttf'],['CatalogSans','/sans.ttf'],['CatalogMono','/mono.ttf']].map(([name,url])=>new FontFace(name,`url(${url})`));
 await Promise.all(fonts.map(async f=>document.fonts.add(await f.load())));await document.fonts.ready;
 const icons=await Promise.all(products.map(p=>loadImage('/icons/'+p[1]+'.png')));
 const canvas=document.querySelector('#poster'),c=canvas.getContext('2d',{alpha:false});
 c.fillStyle='#121516';c.fillRect(0,0,1600,1000);
 c.fillStyle='#eeeeE6';c.font='24px CatalogSans';c.fillText('XINGYU.WANG',80,76);
 c.fillStyle='#8b9497';c.font='16px CatalogMono';c.fillText('/ SOFTWARE COLLECTION',290,75);c.textAlign='right';c.fillText('2026.11 / CHROME',1520,75);c.textAlign='left';
 c.strokeStyle='#3b4244';c.lineWidth=1;c.beginPath();c.moveTo(80,114);c.lineTo(1520,114);c.stroke();
 c.fillStyle='#a5adae';c.font='17px CatalogMono';c.fillText('CHROME EXTENSIONS',83,184);
 c.fillStyle='#ed713d';c.font='310px CatalogDisplay';c.fillText('05',69,461);
 c.fillStyle='#efefe7';c.font='600 59px "PingFang SC",sans-serif';c.fillText('浏览器里的',80,573);c.fillText('五个小工具。',80,650);
 c.fillStyle='#929da0';c.font='16px CatalogMono';c.fillText('BROWSE / READ / BUILD',83,710);
 c.fillStyle='#ed713d';c.fillRect(84,760,7,7);c.fillStyle='#aeb5b5';c.font='20px "PingFang SC",sans-serif';c.fillText('4 款已上线 · 1 款审核中',105,773);
 const x=630,right=1520,top=167,rowHeight=132;
 products.forEach((p,index)=>{
  const y=top+index*rowHeight;
  c.strokeStyle='#333a3c';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(right,y);c.stroke();
  c.fillStyle='#858f92';c.font='17px CatalogMono';c.fillText(String(index+1).padStart(2,'0'),x+2,y+42);
  c.drawImage(icons[index],x+57,y+29,64,64);
  c.fillStyle='#efefe7';c.font='36px CatalogSans';c.fillText(p[0],x+153,y+54);
  c.fillStyle='#a4adaf';c.font='23px "PingFang SC",sans-serif';c.fillText(p[2],x+153,y+92);
  c.textAlign='right';c.fillStyle=index===4?'#ed713d':'#bdc6c3';c.font='17px CatalogMono';c.fillText(index===4?'IN REVIEW':'LIVE',right,y+42);
  c.fillStyle='#707d80';c.font='13px CatalogMono';c.fillText(p[3],right,y+90);c.textAlign='left';
 });
 c.strokeStyle='#333a3c';c.beginPath();c.moveTo(x,top+products.length*rowHeight);c.lineTo(right,top+products.length*rowHeight);c.stroke();
 c.strokeStyle='#3b4244';c.beginPath();c.moveTo(80,885);c.lineTo(1520,885);c.stroke();
 c.fillStyle='#eff0e7';c.font='27px CatalogSans';c.fillText('xingyu.wang/extensions',80,945);
 c.textAlign='right';c.fillStyle='#8e9a9d';c.font='19px "PingFang SC",sans-serif';c.fillText('CodeYears · Chrome Web Store 审核中',1520,942);c.textAlign='left';
 return canvas;
}

```

V1画面与代码分别保存在five-chrome-extensions-v1.png和SOURCE_V1.md；当前主推V2。不同系统字体栅格化可能产生不同哈希。修改任何发布标记前必须先核对实际状态。
