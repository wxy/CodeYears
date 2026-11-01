# City 静态车辆 · 云端交付报告

日期：2026-11-01。基线 `63327cb60c44d0f01c1ae43e2daaed6cb94d200d`；分支 `codex/city-static-vehicles`。只新增 `src/renderers/city-vehicles.ts` 和本报告，其他源码、图片、目录与依赖未改。不合入。

## 接口与实际实现

```ts
export type CityVehicleKind = 'sedan' | 'suv' | 'van' | 'bus';
export interface CityVehicle {
  x: number; z: number; angle: number; kind: CityVehicleKind; color: string; elevation?: number;
}
export function createCityVehiclePainter(vehicles: readonly CityVehicle[]): (context: CanvasRenderingContext2D) => void;
```

x/z 是车体地面中心，angle 是 `atan2(dz,dx)` 弧度，车头沿局部纵轴正向。模型先按 angle 旋转世界地面坐标，再统一投影为 `[.5*(x-z), .25*(x+z)-.5*h]`，高度不旋转，竖边保持竖直。elevation 默认 0，加入车身、轮胎与接触阴影的投影高度，供桥面使用。

| 车型 | 世界长度 | 车身宽度 | 顶棚高度 | 造型区别 |
| --- | --- | --- | --- | --- |
| sedan | .55 | .25 | .155 | 较低斜背、分离前后舱与双侧窗 |
| suv | .62 | .27 | .19 | 较高长顶、较大侧窗 |
| van | .72 | .27 | .215 | 封闭货舱、前排侧窗与货舱压线 |
| bus | 1.0 | .28 | .23 | 长车身、五段排窗与更大轮胎 |

在 .4 宽车道内保留横向余量；轮胎向外约 .004，阴影另留很小包络。可见侧面/端面、顶面、车窗、深色底盘、双车轮与轮毂、暖白前灯/红色尾灯区分方向。调用方直接传入 CSS 车身颜色，顶面柔和提亮、侧面克制压暗；样板使用蓝灰、灰绿、陶土与灰紫，不内置随机配色。

创建 painter 时复制参数、准备全部世界投影 Path2D 与阴影、明暗色字符串，并按地面深度 x+z 排车，车内按面深度排面，窗/把手与所属面一起排序。paint 只提交预备路径，不创建路径、画布、图片、模型、随机数或定时器；save/restore 保留调用方变换与绘制状态。没有资源解码、独立生命周期或交通模拟，闭包随当前 groundPaint 释放即可。车辆数量上限、路段/车道/桥面布置由主代理控制，一般不超过 180 辆；本模块不替调用方截断或重新抽样。

## 实际检查

Linux 云端，Node v24.19.0、npm 11.9.0、Chromium 154.0.8037.57，headless、1600×1060、DPR 1、Canvas 2D。使用环境已有外部 Playwright，不改仓库依赖。首次未启用网络权限的 Chromium 启动因 socket 权限失败；在命令工具正常启用网络权限后成功，无代理/CA 绕过。

- `npm run check`、`npm run build -- --outDir /tmp/codeyears-vehicle-build`、`git diff --check`：PASS。临时目录构建警告正常。模块尚未接入，主构建不代表车辆已出现在城市运行包；真实浏览器样板直接加载本模块。
- 浏览器 4 车型 × W/D 正反 × 浅/深背景，共 32 个样板已绘制并人工查看；车身三面、四向车头/尾灯、车型差异与颜色可辨。首轮查看后修正窗片排序，最终版本复跑通过。
- 16 个车型/方向的重复栅格 hash 完全一致，正反方向 hash 不同；elevation .6 在每世界单位 200 CSS px 时，包络精确上移 60 px，横向包络不变。额外样板将巴士与同高度桥面一起抬升，接触位置一致。
- 相同轿车按 96/192/384 px 每世界单位绘制，含阴影的包络为 42×25 / 82×49 / 162×98 px；只放大显示，没有重选车型或修改世界尺寸。车型方向诊断在 200 px/单位下包络宽：轿车 86、SUV 94、厢车 104、巴士 134 px，含阴影，不用该值冒充实体车宽。
- 180 辆冻结输入创建 painter 后重复 paint 两次，空列表也可调用；paint 新增 Path2D 为 0，禁止 document.createElement 的情况下仍可绘制，输入未变、context 的 fillStyle/transform 保持。累计样板及诊断准备路径 5667 条，此数包含多次独立构造，不代表单次 180 辆的内存或路径预算。
- 浏览器 pageerror 为 0。没有补写单元测试；检查通过后停止扩大范围。临时样板、截图、日志、浏览器 profile 与构建不提交，结束后清理。

## 接入责任与未验收范围

主代理负责 2/4/8 车道路网、车道线、实际路口桥梁对齐、稳定布车与最终排序集成；调用方先设置与地面相同的世界变换，再在适当道路/桥面绘制阶段调用 painter。模型按地面深度整车排序，不能代替桥梁栏杆、建筑及其他渲染层的遮挡安排。车辆仅作静态装饰，不表示贡献活动类型，不参与日期合并或数量映射。

本轮是云端独立浏览器样板，尚未验收城市整体道路、实际桥梁遮挡、真实扩展 Chrome/Edge、实际设备性能/内存/功耗。180 车诊断证明接口可绘制与 paint 不新建路径，不是 FPS 或城市性能预算。本地独立 Chrome 窗口完成最终整体验收，本 PR 暂不合入。

## 复现

以下一次性浏览器诊断在仓库根目录运行。使用现有外部 Playwright 路径和 Chromium；其他环境可在临时脚本中改为相应已安装路径，不更改项目依赖。命令工具须正常启用网络权限以便 Chromium 建立内部 socket。Node stripTypeScriptTypes 仅移除类型，正式源码不改。

```sh
npm run check
npm run build -- --outDir /tmp/codeyears-vehicle-build
mkdir -p /tmp/codeyears-vehicle-probe
cat > /tmp/codeyears-vehicle-probe/browser.cjs <<'VEHICLE_PROBE'
const fs=require('node:fs');
const {stripTypeScriptTypes}=require('node:module');
const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
 const page=await browser.newPage({viewport:{width:1600,height:1060},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setContent('<style>body{margin:0;background:#e4e7de}canvas{display:block}</style><canvas width="1600" height="1060"></canvas>');
 await page.addScriptTag({content:stripTypeScriptTypes(fs.readFileSync('src/renderers/city-vehicles.ts','utf8')).replace(/export /g,'')});
 const results=await page.evaluate(()=>{
  const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
  const native=window.Path2D;let paths=0;
  window.Path2D=new Proxy(native,{construct(t,args){paths++;return Reflect.construct(t,args)}});
  const canvas=document.querySelector('canvas'),g=canvas.getContext('2d');
  const kinds=['sedan','suv','van','bus'],colors=['#7a939e','#8c9b83','#ae8b73','#8d819c'];
  function label(text,x,y,color='#46534f',size=15){g.setTransform(1,0,0,1,0,0);g.font=`${size}px sans-serif`;g.fillStyle=color;g.fillText(text,x,y)}
  for(let theme=0;theme<2;theme++){
   g.fillStyle=theme?'#202b30':'#eceee5';g.fillRect(theme*800,0,800,720);
   label(theme?'Dark / muted paint':'Light / muted paint',theme*800+24,34,theme?'#cbd7cc':'#46534f',21);
   for(let dir=0;dir<4;dir++){
    label(['+W head','+D head','−W head','−D head'][dir],theme*800+dir*200+40,70,theme?'#cbd7cc':'#46534f');
    for(let k=0;k<4;k++){
     const cx=theme*800+dir*200+100,cy=145+k*140,angle=dir*Math.PI/2;
     g.setTransform(300,0,0,300,cx,cy);
     const c=Math.cos(angle),s=Math.sin(angle),road=new Path2D();
     [[-.7,-.2],[.7,-.2],[.7,.2],[-.7,.2]].forEach(([u,v],i)=>{const x=c*u-s*v,z=s*u+c*v;const p=[.5*(x-z),.25*(x+z)];if(i)road.lineTo(...p);else road.moveTo(...p)});road.closePath();g.fillStyle=theme?'#3b474b':'#6c7777';g.fill(road);
     createCityVehiclePainter([{x:0,z:0,angle,kind:kinds[k],color:colors[k]}])(g);
     label(kinds[k],cx-23,cy+63,theme?'#b3c2bc':'#53625d');
    }
   }
  }
  label('Bridge elevation .6: same vehicle, same projected contact plane offset',24,754);
  for(let j=0;j<2;j++){
   g.setTransform(300,0,0,300,280+j*430,855);
   const h=j*.6,p=new Path2D();[[-.65,-.28],[.65,-.28],[.65,.28],[-.65,.28]].forEach(([x,z],i)=>{if(i)p.lineTo(.5*(x-z),.25*(x+z)-.5*h);else p.moveTo(.5*(x-z),.25*(x+z)-.5*h)});p.closePath();g.fillStyle='#667a7b';g.fill(p);
   createCityVehiclePainter([{x:0,z:0,angle:0,kind:'bus',color:colors[3],elevation:h}])(g);
  }
  label('Projected zoom (same .55 × .25 sedan): 96 / 192 / 384 pixels per world unit',24,916);
  for(let j=0;j<3;j++){const scale=[96,192,384][j];g.setTransform(scale,0,0,scale,240+j*400,990);createCityVehiclePainter([{x:0,z:0,angle:Math.PI/2,kind:'sedan',color:colors[0]}])(g);label(String(scale),220+j*400,1040)}
  g.setTransform(1,0,0,1,0,0);
  const probe=document.createElement('canvas');probe.width=300;probe.height=300;const ctx=probe.getContext('2d');
  function raster(vehicle,scale=200){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,300,300);ctx.setTransform(scale,0,0,scale,150,190);createCityVehiclePainter([vehicle])(ctx);const pixels=ctx.getImageData(0,0,300,300).data;let left=300,right=-1,top=300,bottom=-1,hash=0;for(let y=0;y<300;y++)for(let x=0;x<300;x++){const i=(y*300+x)*4;if(pixels[i+3]){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}for(let j=0;j<4;j++)hash=(Math.imul(hash,31)+pixels[i+j])>>>0}return {left,right,top,bottom,width:right-left+1,height:bottom-top+1,hash}}
  const samples=[];
  for(const kind of kinds)for(let dir=0;dir<4;dir++){
   const vehicle={x:0,z:0,angle:dir*Math.PI/2,kind,color:'#7a939e'};
   const a=raster(vehicle),b=raster(vehicle);assert(a.hash===b.hash,'repeat raster');
   const high=raster({...vehicle,elevation:.6});assert(a.top-high.top===60&&a.bottom-high.bottom===60&&a.left===high.left&&a.right===high.right,'elevation shift');
   const opposite=raster({...vehicle,angle:vehicle.angle+Math.PI});assert(opposite.hash!==a.hash,'front/rear distinct');
   samples.push({kind,dir,width:a.width,height:a.height});
  }
  const zoom=[96,192,384].map(scale=>raster({x:0,z:0,angle:0,kind:'sedan',color:'#7a939e'},scale));assert(zoom[1].width>zoom[0].width&&zoom[2].width>zoom[1].width,'scale width');
  const vehicles=Object.freeze(Array.from({length:180},(_,i)=>Object.freeze({x:i%18,z:Math.floor(i/18),angle:i%4*Math.PI/2,kind:kinds[i%4],color:colors[i%4],elevation:i%2*.6})));
  const before=JSON.stringify(vehicles),painter=createCityVehiclePainter(vehicles),prepared=paths;
  const originalCreate=document.createElement;document.createElement=()=>{throw Error('paint created element')};
  ctx.setTransform(10,0,0,10,30,30);ctx.fillStyle='#abcdef';const transform=ctx.getTransform().toString();
  painter(ctx);painter(ctx);createCityVehiclePainter([])(ctx);
  document.createElement=originalCreate;
  assert(paths===prepared,'paint allocated path');assert(ctx.fillStyle==='#abcdef'&&ctx.getTransform().toString()===transform,'context state');assert(JSON.stringify(vehicles)===before,'input mutation');
  window.Path2D=native;
  return {samples,zoom:zoom.map(v=>({width:v.width,height:v.height})),preparedPaths:prepared,paintNewPaths:paths-prepared,cars:vehicles.length,status:'PASS'};
 });
 await page.screenshot({path:'/tmp/codeyears-vehicle-probe/sample.png'});
 console.log(JSON.stringify({browser:await browser.version(),errors,results}));
 if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
VEHICLE_PROBE
node /tmp/codeyears-vehicle-probe/browser.cjs
git diff --check
rm -rf /tmp/codeyears-vehicle-probe /tmp/codeyears-vehicle-build
```
