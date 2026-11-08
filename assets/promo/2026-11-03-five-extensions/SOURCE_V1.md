# 海报构图源稿

最终画布1600×1000。使用随本目录保存的五款正式图标、canvas-design附带的Work Sans Regular/Bold，以及本机PingFang SC中文字体。只栅格化字体，不分发字体文件。

下面保留正式构图源代码，替换图片和字体加载路径后可在本地设计页复作；导出采用canvas.toBlob(..., image/png)，不归档临时HTTP服务或测试页面。

```js

const products=[
 {name:'HiTable',icon:'hitable',benefit:'网页里的表格，随手分析。',kind:'表格分析',fill:'#eff4e8',border:'#d7e1cf',x:80,y:310},
 {name:'Navigraph',icon:'navigraph',benefit:'浏览路径，直观记录与回看。',kind:'浏览可视化',fill:'#edf5f8',border:'#d4e3e9',x:570,y:310},
 {name:'SilentFeed',icon:'silentfeed',benefit:'过滤信息噪音，专注值得读的。',kind:'智能 RSS 阅读',fill:'#fff3e2',border:'#eedfc9',x:1060,y:310},
 {name:'AI Pulse',icon:'ai-pulse-chrome',benefit:'AI 服务余额、用量与状态。',kind:'AI 服务监控',fill:'#edf4f7',border:'#d7e3e6',x:325,y:575},
 {name:'CodeYears',icon:'codeyears',benefit:'让 GitHub 贡献，长成一座城。',kind:'贡献可视化',fill:'#eef3e9',border:'#d6e1ce',x:815,y:575,review:true},
];
const image=src=>new Promise((resolve,reject)=>{const i=new Image;i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
async function draw(){
 const bold=new FontFace('CollectionSans','url(/brand-bold.ttf)',{weight:'700'}),regular=new FontFace('CollectionSans','url(/brand-regular.ttf)',{weight:'400'});
 await Promise.all([bold.load(),regular.load()]);document.fonts.add(bold);document.fonts.add(regular);await document.fonts.ready;
 const icons=await Promise.all(products.map(p=>image('/icons/'+p.icon+'.png')));
 const canvas=document.querySelector('#poster'),c=canvas.getContext('2d',{alpha:false});
 c.fillStyle='#f7f5ef';c.fillRect(0,0,1600,1000);
 let glow=c.createRadialGradient(1330,50,0,1330,50,850);glow.addColorStop(0,'#dfead680');glow.addColorStop(1,'#dfead600');c.fillStyle=glow;c.fillRect(0,0,1600,1000);
 c.fillStyle='#6f8175';c.font='400 18px CollectionSans';c.fillText('XINGYU.WANG  /  CHROME COLLECTION',82,82);
 c.fillStyle='#183e31';c.font='700 82px "PingFang SC",sans-serif';c.fillText('5 款 Chrome 扩展',76,181);
 c.fillStyle='#64776b';c.font='400 29px "PingFang SC",sans-serif';c.fillText('给浏览、阅读和日常开发，多一点顺手。',82,242);
 products.forEach((p,index)=>{
  c.save();c.shadowColor='#2444320a';c.shadowBlur=22;c.shadowOffsetY=8;c.fillStyle=p.fill;c.beginPath();c.roundRect(p.x,p.y,460,230,22);c.fill();c.restore();
  c.lineWidth=1.5;c.strokeStyle=p.border;c.beginPath();c.roundRect(p.x+.75,p.y+.75,458.5,228.5,21);c.stroke();
  c.drawImage(icons[index],p.x+28,p.y+30,82,82);
  c.fillStyle='#203c31';c.font='700 32px CollectionSans';c.fillText(p.name,p.x+132,p.y+83);
  c.fillStyle=p.review?'#fff0d4':'#e0eddd';c.beginPath();c.roundRect(p.x+354,p.y+22,82,29,14);c.fill();
  c.fillStyle=p.review?'#8b601e':'#44703e';c.font='500 16px "PingFang SC",sans-serif';c.textAlign='center';c.fillText(p.review?'审核中':'已上线',p.x+395,p.y+42);c.textAlign='left';
  c.fillStyle='#304b3d';c.font='400 24px "PingFang SC",sans-serif';c.fillText(p.benefit,p.x+29,p.y+161);
  c.fillStyle='#78887b';c.font='400 18px "PingFang SC",sans-serif';c.fillText(p.kind,p.x+30,p.y+198);
 });
 c.strokeStyle='#d6dfd2';c.lineWidth=1;c.beginPath();c.moveTo(80,883);c.lineTo(1520,883);c.stroke();
 c.fillStyle='#214b3b';c.font='700 33px CollectionSans';c.fillText('xingyu.wang',80,946);
 c.textAlign='right';c.fillStyle='#667c6b';c.font='400 23px "PingFang SC",sans-serif';c.fillText('4 款已上线 · CodeYears 审核中',1520,943);c.textAlign='left';
 return canvas;
}

```

不同系统字体和浏览器栅格化可能产生不同PNG哈希。调整状态时先核对事实；不要将CodeYears审核中改为已上线，除非取得新的确认。
