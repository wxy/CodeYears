/* Local design prototype. Input is supplied by a temporary, local-only harness.
 * This file does not fetch GitHub, persist contribution data, or run in the extension. */
window.renderCodeYearsFantasy = async function renderCodeYearsFantasy(data, assetUrls, options) {
  const loadImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load prototype artwork: ${url}`));
    image.src = url;
  });
  const [atlas, ground, catalog] = await Promise.all([
    loadImage(assetUrls.atlas), loadImage(assetUrls.ground),
    fetch(assetUrls.catalog).then(response => response.json()),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const detail = options.year !== undefined;
  const years = detail ? data.years.filter(year => year.year === options.year) : data.years;
  const offsets = new Map(data.years.map((year, index) => [year.year, index * 10]));
  const offset = detail ? offsets.get(options.year) : 0;
  const bounds = detail
    ? {left: offset - .8, right: offset + 7.8, top: options.firstRow - .8, bottom: options.lastRow + .8}
    : {left: -2.8, right: 29.2, top: -3.2, bottom: 55.5};
  const raw = (x, y) => [x - y, (x + y) / 2];
  const corners = [raw(bounds.left, bounds.top), raw(bounds.right, bounds.top), raw(bounds.left, bounds.bottom), raw(bounds.right, bounds.bottom)];
  const minX = Math.min(...corners.map(p => p[0]));
  const maxX = Math.max(...corners.map(p => p[0]));
  const minY = Math.min(...corners.map(p => p[1])) - 1.8;
  const maxY = Math.max(...corners.map(p => p[1]));
  const header = detail ? 155 : 185, footer = 85, margin = 75;
  const unit = Math.min((canvas.width - margin * 2) / (maxX - minX), (canvas.height - header - footer) / (maxY - minY));
  const originX = (canvas.width - (maxX - minX) * unit) / 2 - minX * unit;
  const originY = header + (canvas.height - header - footer - (maxY - minY) * unit) / 2 - minY * unit;
  const project = (x, y) => [originX + (x - y) * unit, originY + (x + y) * unit / 2];
  const hash = value => {
    let n = value | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const polygon = (points, fill, stroke, lineWidth = 1) => {
    ctx.beginPath();
    points.forEach((p, index) => { const [x, y] = project(...p); if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); }
  };
  const rectangle = (x, y, w, h, fill, stroke, width = 1) => polygon([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],fill,stroke,width);
  const line = (points, color, width) => {
    ctx.beginPath();
    points.forEach((p, i) => { const [x, y] = project(...p); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';ctx.stroke();
  };
  ctx.fillStyle = '#87915a';ctx.fillRect(0,0,canvas.width,canvas.height);
  const pattern = ctx.createPattern(ground, 'repeat');
  pattern.setTransform(new DOMMatrix().scale(Math.max(.18, unit / 150)));
  ctx.globalAlpha = .67;ctx.fillStyle = pattern;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
  const vignette = ctx.createRadialGradient(canvas.width*.5,canvas.height*.48,canvas.width*.15,canvas.width*.5,canvas.height*.48,canvas.width*.65);
  vignette.addColorStop(0,'rgba(19,38,25,0)');vignette.addColorStop(1,'rgba(19,38,25,.30)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,canvas.width,canvas.height);

  // Decorative corridors are outside all three seven-column date grids.
  const riverLeft=[],riverRight=[];
  for(let y=-4;y<=57;y+=.45){const x=18.65+Math.sin(y*.19)*.14;riverLeft.push([x-.39,y]);riverRight.unshift([x+.39,y]);}
  polygon([...riverLeft,...riverRight],'#367c85','#78a7a2',Math.max(2,unit*.05));
  for(let i=0;i<270;i++){
    const y=-3+hash(i+71)*59,x=18.65+Math.sin(y*.19)*.14+(hash(i+412)-.5)*.55;
    line([[x,y],[x+.10,y+.28]],'rgba(178,218,207,.28)',Math.max(1,unit*.012));
  }
  const roads=[{x:-.58,y:-1,w:.52,h:55.5},{x:8.3,y:-1,w:.65,h:55.5},{x:17.35,y:-1,w:.48,h:55.5},{x:19.46,y:-1,w:.40,h:55.5},{x:27.25,y:-1,w:.5,h:55.5},
    {x:-.58,y:-1.15,w:28.33,h:.55},{x:-.58,y:53.55,w:28.33,h:.55}];
  for(const road of roads){
    rectangle(road.x,road.y,road.w,road.h,'#b7aa82','#6b7656',Math.max(1,unit*.025));
    const long=road.h>road.w;
    for(let at=.13;at<(long?road.h:road.w);at+=.27){
      if(long)line([[road.x+.05,road.y+at],[road.x+road.w-.05,road.y+at]],'rgba(244,230,188,.55)',Math.max(1,unit*.014));
      else line([[road.x+at,road.y+.05],[road.x+at,road.y+road.h-.05]],'rgba(244,230,188,.55)',Math.max(1,unit*.014));
    }
  }
  for(const y of [12,31,45,53.7]){
    rectangle(17.5,y-.22,2.35,.44,'#b9b3a0','#626e69',Math.max(1,unit*.04));
    line([[17.52,y-.21],[19.83,y-.21]],'#ded5b8',unit*.09);
    line([[17.52,y+.21],[19.83,y+.21]],'#777e71',unit*.08);
    for(let x=17.6;x<19.8;x+=.23)line([[x,y-.15],[x,y+.15]],'rgba(76,90,78,.35)',Math.max(1,unit*.012));
  }

  const queue=[],metadata={profile:data.profile,asOf:data.asOf,source:'anonymous-public',mode:detail?'detail':'overview',years:[],drawnBuildings:0,decorations:0};
  const sprite = (frame, x, y, scale, kind, extra={}) => queue.push({frame,x,y,scale,kind,depth:x+y,...extra});
  for(const year of years){
    const ox=offsets.get(year.year);
    metadata.years.push({year:year.year,total:year.total,active:year.active,parcels:year.parcels.length,sha256:year.sha256});
    // Zero-contribution dates have meadow, flowers and occasional low stones, never invented houses.
    for(const day of year.days){
      if(detail&&(day.y<options.firstRow||day.y>=options.lastRow))continue;
      if(day.count!==0)continue;
      const seed=year.year*371+day.x*7919+day.y*43;
      const x=ox+day.x+.5,y=day.y+.5;
      if(hash(seed)>.86)sprite(11,x,y,.40+hash(seed+1)*.17,'scenery');
      else if(hash(seed+5)>.64){
        const [px,py]=project(x,y);
        ctx.fillStyle=hash(seed+6)>.5?'#d8c77d':'#8cab60';
        for(let j=0;j<3;j++){const dx=(hash(seed+j*17)-.5)*unit*.6,dy=(hash(seed+j*23)-.5)*unit*.20;ctx.fillRect(px+dx,py+dy,Math.max(1,unit*.028),Math.max(1,unit*.022));}
      }
    }
    for(const parcel of year.parcels){
      if(detail&&(parcel.y+parcel.h<=options.firstRow||parcel.y>=options.lastRow))continue;
      const px=ox+parcel.x,py=parcel.y;
      const seed=year.year*104729+parcel.x*1297+parcel.y*7919;
      rectangle(px+.07,py+.07,parcel.w-.14,parcel.h-.14,parcel.mean<=5?'rgba(184,163,111,.72)':'rgba(190,180,146,.86)','rgba(82,100,66,.38)',Math.max(.7,unit*.014));
      if(parcel.mean>5){
        const count=Math.round(parcel.w*parcel.h*12);
        for(let i=0;i<count;i++){
          const x=px+.14+hash(seed+i*13)*(parcel.w-.28),y=py+.14+hash(seed+i*31)*(parcel.h-.28);
          rectangle(x,y,.12,.09,'rgba(224,213,177,.38)','rgba(123,123,95,.22)',Math.max(.5,unit*.008));
        }
      }
      if(parcel.w*parcel.h>1){
        line([[px+.10,py+.10],[px+parcel.w-.1,py+.10]],'#7c633c',Math.max(1,unit*.035));
        line([[px+.10,py+.10],[px+.10,py+parcel.h-.1]],'#9b8150',Math.max(1,unit*.03));
        const posts=Math.max(2,Math.round((parcel.w+parcel.h)*2));
        for(let j=0;j<=posts;j++){
          const along=j/posts*(parcel.w+parcel.h-.4);
          const x=along<parcel.w-.2?px+.1+along:px+.1;
          const y=along<parcel.w-.2?py+.1:py+.1+along-(parcel.w-.2);
          const [sx,sy]=project(x,y);ctx.fillStyle='#80633c';ctx.fillRect(sx-unit*.017,sy-unit*.12,Math.max(1,unit*.034),unit*.13);
        }
      }
      const tier=parcel.mean<=2?0:parcel.mean<=5?1:parcel.mean<=19?2:parcel.mean<=49?3:4;
      const frame=tier*2+(hash(seed+113)>.5?1:0);
      sprite(frame,px+parcel.w/2,py+parcel.h/2,1,'building',{year:year.year,parcelId:parcel.id});
    }
  }
  // Woodland surrounds the date grids; it is scenery and carries no contribution count.
  for(let i=0;i<35;i++){
    const y=-2+i*1.66;
    sprite(10,-1.55-hash(i+12)*.55,y,.74+hash(i+5)*.13,'scenery');
    sprite(10,28.35+hash(i+81)*.65,y+.45,.73+hash(i+23)*.15,'scenery');
  }
  for(let i=0;i<21;i++){
    const x=-1.5+i*1.48;
    sprite(10,x,-2.5-hash(i+138)*.35,.67+hash(i+55)*.15,'scenery');
    sprite(10,x,55.1+hash(i+278)*.35,.68+hash(i+41)*.15,'scenery');
  }
  // Smaller planting borders help the close view retain the same scene structure.
  for(const year of years){const ox=offsets.get(year.year);for(let i=0;i<27;i++)if(hash(i+year.year)>.5)sprite(11,ox-.05,i*2+.3,.28,'scenery');}
  queue.sort((a,b)=>a.depth-b.depth||a.x-b.x);
  const visibleBuildings=[];
  for(const item of queue){
    const frame=catalog.frames[item.frame];
    const [x,y]=project(item.x+.34,item.y+.34);
    const scale=unit*1.60/320*item.scale;
    const dx=x-frame.footx*scale,dy=y-frame.footy*scale;
    ctx.drawImage(atlas,frame.sx,frame.sy,frame.sw,frame.sh,dx,dy,frame.sw*scale,frame.sh*scale);
    if(item.kind==='building'){
      metadata.drawnBuildings++;
      if(dx+frame.sw*scale>0&&dx<canvas.width&&dy+frame.sh*scale>header&&dy<canvas.height-footer)visibleBuildings.push({year:item.year,id:item.parcelId});
    }else metadata.decorations++;
  }
  metadata.visibleBuildings=visibleBuildings.length;
  if(!detail){
    for(const year of years){
      const [x,y]=project(offsets.get(year.year)+3.5,-1.85);
      ctx.font=`600 ${Math.max(22,unit*.58)}px Georgia,serif`;ctx.textAlign='center';
      ctx.fillStyle='rgba(30,47,29,.6)';ctx.fillText(String(year.year),x+1,y+2);ctx.fillStyle='#f2ddb0';ctx.fillText(String(year.year),x,y);
    }
  }
  const topFade=ctx.createLinearGradient(0,0,0,header+90);topFade.addColorStop(0,'rgba(242,233,206,.98)');topFade.addColorStop(.6,'rgba(242,233,206,.93)');topFade.addColorStop(1,'rgba(242,233,206,0)');ctx.fillStyle=topFade;ctx.fillRect(0,0,canvas.width,header+90);
  ctx.textAlign='left';ctx.fillStyle='#263c2b';ctx.font=`600 ${detail?52:66}px "PingFang SC","Heiti SC",sans-serif`;
  ctx.fillText(detail?'2026 · 奇幻街区近景':'wxy 的奇幻贡献之城',margin,detail?70:88);
  ctx.font=`${detail?24:30}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#5c6c4d';
  const total=data.years.reduce((n,y)=>n+y.total,0),count=data.years.reduce((n,y)=>n+y.parcels.length,0);
  ctx.fillText(detail?'同一真实地图的局部取景 · 西式奇幻 · 公开贡献快照':`2024–2026/11/10 · ${total.toLocaleString('en-US')} 次公开贡献 · ${count} 个真实合并地块`,margin,detail?112:139);
  const bottomFade=ctx.createLinearGradient(0,canvas.height-footer-45,0,canvas.height);bottomFade.addColorStop(0,'rgba(242,233,206,0)');bottomFade.addColorStop(1,'rgba(242,233,206,.95)');ctx.fillStyle=bottomFade;ctx.fillRect(0,canvas.height-footer-45,canvas.width,footer+45);
  ctx.font=`${detail?19:25}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#526347';
  ctx.fillText('房屋数量与位置来自真实日期地块；外观按区域均值选择。草地、道路与河流仅为装饰。',margin,canvas.height-40);
  metadata.width=canvas.width;metadata.height=canvas.height;
  metadata.unit=unit;
  return {canvas,metadata};
};
