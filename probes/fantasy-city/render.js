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
  const pitch = 1.7, fieldWidth = 7*pitch, fieldLength = Math.max(...data.years.map(y=>y.rows))*pitch;
  const plans = new Map(data.years.map(year => [year.year,window.planFantasyCourtyards(year)]));
  const offsets = new Map(data.years.map((year, index) => [year.year, index*(fieldWidth+3)]));
  const east = offsets.get(data.years.at(-1).year)+fieldWidth;
  const riverX = offsets.get(data.years[2].year)-1.55;
  const offset = detail ? offsets.get(options.year) : 0;
  const bounds = detail
    ? {left: offset-1, right: offset+fieldWidth+1, top: options.firstRow*pitch-1, bottom: options.lastRow*pitch+1}
    : {left:-2.8,right:east+2.8,top:-3.2,bottom:fieldLength+3};
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
  ctx.globalAlpha = .30;ctx.fillStyle = pattern;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
  const vignette = ctx.createRadialGradient(canvas.width*.5,canvas.height*.48,canvas.width*.15,canvas.width*.5,canvas.height*.48,canvas.width*.65);
  vignette.addColorStop(0,'rgba(19,38,25,0)');vignette.addColorStop(1,'rgba(19,38,25,.30)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,canvas.width,canvas.height);

  // Decorative corridors are outside all three seven-column date grids.
  const riverLeft=[],riverRight=[];
  for(let y=-4;y<=fieldLength+4;y+=.45){const x=riverX+Math.sin(y*.12)*.10;riverLeft.push([x-.36,y]);riverRight.unshift([x+.36,y]);}
  polygon([...riverLeft,...riverRight],'#367c85','#78a7a2',Math.max(2,unit*.05));
  for(let i=0;i<270;i++){
    const y=-3+hash(i+71)*(fieldLength+6),x=riverX+Math.sin(y*.12)*.10+(hash(i+412)-.5)*.50;
    line([[x,y],[x+.10,y+.28]],'rgba(178,218,207,.28)',Math.max(1,unit*.012));
  }
  const roads=data.years.map(year=>({x:offsets.get(year.year)-.55,y:-.8,w:.45,h:fieldLength+1.6}));
  roads.push({x:-.55,y:-1.02,w:east+1.1,h:.45},{x:-.55,y:fieldLength+.58,w:east+1.1,h:.45},{x:riverX-1.02,y:-.8,w:.40,h:fieldLength+1.6});
  for(const road of roads){
    rectangle(road.x,road.y,road.w,road.h,'#b7aa82','#6b7656',Math.max(1,unit*.025));
    const long=road.h>road.w;
    for(let at=.13;at<(long?road.h:road.w);at+=.27){
      if(long)line([[road.x+.05,road.y+at],[road.x+road.w-.05,road.y+at]],'rgba(244,230,188,.55)',Math.max(1,unit*.014));
      else line([[road.x+at,road.y+.05],[road.x+at,road.y+road.h-.05]],'rgba(244,230,188,.55)',Math.max(1,unit*.014));
    }
  }
  for(const y of [12*pitch,31*pitch,45*pitch,fieldLength+.8]){
    rectangle(riverX-.95,y-.22,2.02,.44,'#b9b3a0','#626e69',Math.max(1,unit*.04));
    line([[riverX-.94,y-.21],[riverX+1.08,y-.21]],'#ded5b8',unit*.09);
    line([[riverX-.94,y+.21],[riverX+1.08,y+.21]],'#777e71',unit*.08);
    for(let x=riverX-.85;x<riverX+1.05;x+=.23)line([[x,y-.15],[x,y+.15]],'rgba(76,90,78,.35)',Math.max(1,unit*.012));
  }

  const queue=[],metadata={profile:data.profile,asOf:data.asOf,source:'anonymous-public',mode:detail?'detail':'overview',years:[],drawnBuildings:0,decorations:0,pitch};
  const sprite = (frame, x, y, scale, kind, extra={}) => queue.push({frame,x,y,scale,kind,depth:x+y,...extra});
  const footpath=points=>{line(points,'rgba(113,106,73,.65)',unit*.21);line(points,'#b8ae87',unit*.15);};
  const fence=(a,b,stone=false)=>{
    const steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.42));
    for(let i=0;i<steps;i++){
      const p=[a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps];
      const q=[a[0]+(b[0]-a[0])*(i+1)/steps,a[1]+(b[1]-a[1])*(i+1)/steps];
      queue.push({kind:'fence',depth:(p[0]+p[1]+q[0]+q[1])/2,draw:()=>{
        const [x,y]=project(...p),[xx,yy]=project(...q);
        ctx.strokeStyle=stone?'#8e927b':'#80643f';ctx.lineWidth=Math.max(1,unit*(stone ? .07 : .035));
        ctx.beginPath();ctx.moveTo(x,y-unit*.09);ctx.lineTo(xx,yy-unit*.09);ctx.stroke();
        if(!stone){ctx.lineWidth=Math.max(1,unit*.018);ctx.beginPath();ctx.moveTo(x,y-unit*.045);ctx.lineTo(xx,yy-unit*.045);ctx.stroke();}
        ctx.fillStyle=stone?'#aaa88e':'#96794b';ctx.fillRect(x-unit*.025,y-unit*.17,unit*.05,unit*.19);
      }});
    }
  };
  for(const year of years){
    const ox=offsets.get(year.year);
    const plan=plans.get(year.year);
    metadata.years.push({year:year.year,total:year.total,active:year.active,parcels:year.parcels.length,estates:plan.estates.length,combined:plan.estates.filter(p=>p.members.length>1).length,maxArea:Math.max(...plan.estates.map(p=>p.w*p.h)),sha256:year.sha256});
    // Zero-contribution dates have meadow, flowers and occasional low stones, never invented houses.
    for(const day of year.days){
      if(detail&&(day.y<options.firstRow||day.y>=options.lastRow))continue;
      if(day.count!==0)continue;
      const seed=year.year*371+day.x*7919+day.y*43;
      const x=ox+(day.x+.5)*pitch,y=(day.y+.5)*pitch;
      if(hash(seed)>.86)sprite(11,x,y,.40+hash(seed+1)*.17,'scenery');
      else if(hash(seed+5)>.64){
        const [px,py]=project(x,y);
        ctx.fillStyle=hash(seed+6)>.5?'#d8c77d':'#8cab60';
        for(let j=0;j<3;j++){const dx=(hash(seed+j*17)-.5)*unit*.6,dy=(hash(seed+j*23)-.5)*unit*.20;ctx.fillRect(px+dx,py+dy,Math.max(1,unit*.028),Math.max(1,unit*.022));}
      }
    }
    // Shared paths run on estate boundaries, never through a courtyard interior.
    for(const [a,b] of plan.edges)footpath([[ox+a[0]*pitch,a[1]*pitch],[ox+b[0]*pitch,b[1]*pitch]]);
    for(const y of plan.roots)footpath([[ox-.32,y*pitch],[ox,y*pitch]]);
    for(const parcel of plan.estates){
      if(detail&&(parcel.y+parcel.h<=options.firstRow||parcel.y>=options.lastRow))continue;
      const px=ox+parcel.x*pitch,py=parcel.y*pitch,w=parcel.w*pitch,h=parcel.h*pitch;
      const seed=year.year*104729+parcel.x*1297+parcel.y*7919;
      rectangle(px+.18,py+.18,w-.36,h-.36,parcel.tier<=1?'#8e985d':'#96a16e','rgba(75,92,60,.55)',Math.max(.8,unit*.018));
      rectangle(px+.31,py+.33,Math.min(w-.62,1.3),1.02,parcel.tier<=1?'#aa9a70':'#b6b08a');
      if(parcel.mean>5){
        const count=Math.round(parcel.w*parcel.h*12);
        for(let i=0;i<count;i++){
          const x=px+.36+hash(seed+i*13)*Math.min(w-.8,1.1),y=py+.38+hash(seed+i*31)*.85;
          rectangle(x,y,.12,.09,'rgba(224,213,177,.38)','rgba(123,123,95,.22)',Math.max(.5,unit*.008));
        }
      }
      const houseX=px+Math.min(w/2,.96),houseY=py+.83,gateX=px+w/2,gateY=py+h;
      const stone=parcel.tier>=3;
      fence([px+.17,py+.17],[px+w-.17,py+.17],stone);
      fence([px+.17,py+.17],[px+.17,py+h-.17],stone);
      fence([px+w-.17,py+.17],[px+w-.17,py+h-.17],stone);
      fence([px+.17,py+h-.17],[gateX-.23,py+h-.17],stone);
      fence([gateX+.23,py+h-.17],[px+w-.17,py+h-.17],stone);
      footpath([[gateX,gateY-.17],[gateX,gateY],[ox+parcel.gateNode.x*pitch,parcel.gateNode.y*pitch]]);
      footpath([[houseX-.12,houseY+.34],[houseX-.12,gateY-.38],[gateX,gateY-.38],[gateX,gateY-.17]]);
      // Planting beds use spare yard, with a clear centre route to the gate.
      const farm=parcel.tier<=1&&parcel.w*parcel.h>=3;
      if(parcel.w*parcel.h>1){
        for(let y=py+.42;y<py+h-.7;y+=.52)for(let x=px+.29;x<px+w-.55;x+=.80){
          if(x<px+1.6&&y<py+1.65)continue;
          if(Math.abs(x+.15-gateX)<.28||Math.abs(x+.15-(houseX-.12))<.24)continue;
          if(farm){
            rectangle(x,y,.30,.30,'#786944','#a18f58',unit*.009);
            for(let i=0;i<3;i++)line([[x+.03,y+.04+i*.09],[x+.27,y+.04+i*.09]],i%2?'#a4ad58':'#6f954f',unit*.025);
          }else{
            rectangle(x,y,.30,.26,'#6f864e','#b3a46b',unit*.01);
            for(let i=0;i<3;i++){
              const [sx,sy]=project(x+.05+i*.10,y+.13);
              ctx.fillStyle='#7d9956';ctx.beginPath();ctx.ellipse(sx,sy-unit*.018,unit*.046,unit*.035,0,0,Math.PI*2);ctx.fill();
              ctx.fillStyle=(seed+i)%2?'#e2c278':'#d9b3a1';ctx.fillRect(sx-unit*.012,sy-unit*.04,unit*.025,unit*.023);
            }
          }
        }
      }
      const frame=parcel.tier*2+(Math.floor(parcel.x/2)+year.year)%2;
      sprite(frame,houseX,houseY,1,'building',{year:year.year,parcelId:parcel.id});
    }
  }
  // Woodland surrounds the date grids; it is scenery and carries no contribution count.
  for(let i=0;i<Math.ceil(fieldLength/1.66);i++){
    const y=-2+i*1.66;
    sprite(10,-1.55-hash(i+12)*.55,y,.74+hash(i+5)*.13,'scenery');
    sprite(10,east+1.45+hash(i+81)*.65,y+.45,.73+hash(i+23)*.15,'scenery');
  }
  for(let i=0;i<Math.ceil((east+3)/1.48);i++){
    const x=-1.5+i*1.48;
    sprite(10,x,-2.5-hash(i+138)*.35,.67+hash(i+55)*.15,'scenery');
    sprite(10,x,fieldLength+2.1+hash(i+278)*.35,.68+hash(i+41)*.15,'scenery');
  }
  // Smaller planting borders help the close view retain the same scene structure.
  for(const year of years){const ox=offsets.get(year.year);for(let i=0;i<year.rows;i++)if(hash(i+year.year)>.65)sprite(11,ox-.05,i*pitch+.3,.28,'scenery');}
  queue.sort((a,b)=>a.depth-b.depth||a.x-b.x);
  const visibleBuildings=[];
  for(const item of queue){
    if(item.kind==='fence'){item.draw();continue;}
    const frame=catalog.frames[item.frame];
    const [x,y]=project(item.x,item.y);
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
      const [x,y]=project(offsets.get(year.year)+fieldWidth/2,-1.85);
      ctx.font=`600 ${Math.max(22,unit*.58)}px Georgia,serif`;ctx.textAlign='center';
      ctx.fillStyle='rgba(30,47,29,.6)';ctx.fillText(String(year.year),x+1,y+2);ctx.fillStyle='#f2ddb0';ctx.fillText(String(year.year),x,y);
    }
  }
  const topFade=ctx.createLinearGradient(0,0,0,header+90);topFade.addColorStop(0,'rgba(242,233,206,.98)');topFade.addColorStop(.6,'rgba(242,233,206,.93)');topFade.addColorStop(1,'rgba(242,233,206,0)');ctx.fillStyle=topFade;ctx.fillRect(0,0,canvas.width,header+90);
  ctx.textAlign='left';ctx.fillStyle='#263c2b';ctx.font=`600 ${detail?52:66}px "PingFang SC","Heiti SC",sans-serif`;
  ctx.fillText(detail?`${options.year} · 奇幻街区近景`:'wxy 的奇幻贡献之城',margin,detail?70:88);
  ctx.font=`${detail?24:30}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#5c6c4d';
  const total=data.years.reduce((n,y)=>n+y.total,0),count=data.years.reduce((n,y)=>n+plans.get(y.year).estates.length,0);
  ctx.fillText(detail?'同一真实地图 · 留出院落与连接小路 · 同繁荣档相邻地块合并':`2024–2026/11/10 · ${total.toLocaleString('en-US')} 次公开贡献 · ${count} 个庭院与农场`,margin,detail?112:139);
  const bottomFade=ctx.createLinearGradient(0,canvas.height-footer-45,0,canvas.height);bottomFade.addColorStop(0,'rgba(242,233,206,0)');bottomFade.addColorStop(1,'rgba(242,233,206,.95)');ctx.fillStyle=bottomFade;ctx.fillRect(0,canvas.height-footer-45,canvas.width,footer+45);
  ctx.font=`${detail?19:25}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#526347';
  ctx.fillText('房屋数量与位置来自真实日期地块；外观按区域均值选择。草地、道路与河流仅为装饰。',margin,canvas.height-40);
  metadata.width=canvas.width;metadata.height=canvas.height;
  metadata.unit=unit;
  return {canvas,metadata};
};
