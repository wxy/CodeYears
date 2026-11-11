/* Local design prototype. Input is supplied by a temporary, local-only harness.
 * This file does not fetch GitHub, persist contribution data, or run in the extension. */
window.renderCodeYearsFantasy = async function renderCodeYearsFantasy(data, assetUrls, options) {
  const loadImage = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load prototype artwork: ${url}`));
    image.src = url;
  });
  const [atlas, ground, catalog, formAtlas, formCatalog, magicAtlas, magicCatalog, lifeAtlas, lifeCatalog, classicProjection, magicCompact] = await Promise.all([
    loadImage(assetUrls.atlas), loadImage(assetUrls.ground),
    fetch(assetUrls.catalog).then(response => response.json()),
    loadImage(assetUrls.forms), fetch(assetUrls.formCatalog).then(response => response.json()),
    loadImage(assetUrls.magic),fetch(assetUrls.magicCatalog).then(response=>response.json()),
    loadImage(assetUrls.life),fetch(assetUrls.lifeCatalog).then(response=>response.json()),
    fetch(assetUrls.classicProjection).then(response=>response.json()),
    loadImage(assetUrls.magicCompact),
  ]);
  classicProjection.cottages.forEach((frame,i)=>Object.assign(catalog.frames[i],frame));
  classicProjection.forms.forEach((frame,i)=>Object.assign(formCatalog.frames[i],frame));
  const sources={cottages:{image:atlas,catalog},forms:{image:formAtlas,catalog:formCatalog},magic:{image:magicAtlas,catalog:magicCatalog},life:{image:lifeAtlas,catalog:lifeCatalog}};
  for(const source of Object.values(sources))for(const frame of source.catalog.frames){
    if(frame.ground||frame.ellipse||frame.worldHeight)window.prepareFantasyProjection(frame);
  }
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

  const queue=[],metadata={profile:data.profile,asOf:data.asOf,source:'anonymous-public',mode:detail?'detail':'overview',years:[],drawnUnits:0,decorations:0,pitch,forms:{},layouts:[],life:{},plazas:[],projection:[]};
  for(const [name,source] of Object.entries(sources))source.catalog.frames.forEach((frame,index)=>{
    if(frame.projection)metadata.projection.push({atlas:name,index,ground:frame.ground,ellipse:frame.ellipse,shear:frame.projection.shear,vertical:frame.projection.vertical});
  });
  const sprite = (frame, x, y, scale, kind, extra={}) => queue.push({frame,x,y,scale,kind,depth:x+y,...extra});
  const ornament=(atlas,frame,x,y,scale,role)=>sprite(frame,x,y,scale,'ornament',{atlas,role});
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
    const edgeKey=(a,b)=>[a.join(','),b.join(',')].sort().join('|');
    const roadEdges=new Set(plan.edges.map(([a,b])=>edgeKey(a,b)));
    const daily=new Map(year.days.map(day=>[`${day.x},${day.y}`,day]));
    const squareBuckets=new Map();
    for(const day of year.days){
      if(day.count!==0||![[1,0],[-1,0],[0,1],[0,-1]].some(([x,y])=>(daily.get(`${day.x+x},${day.y+y}`)?.count||0)>0))continue;
      const {x,y}=day;
      const edge=[[[x,y],[x+1,y]],[[x,y+1],[x+1,y+1]],[[x,y],[x,y+1]],[[x+1,y],[x+1,y+1]]].find(([a,b])=>roadEdges.has(edgeKey(a,b)));
      if(!edge)continue;
      const bucket=Math.floor(y/4),rank=hash(year.year+x*479+y*37);
      if(!squareBuckets.has(bucket)||rank<squareBuckets.get(bucket).rank)squareBuckets.set(bucket,{day,edge,rank,bucket});
    }
    const squares=new Map([...squareBuckets.values()].map(p=>[`${p.day.x},${p.day.y}`,p]));
    // Public amenities and nature may use known zero dates; never invent contribution houses.
    for(const day of year.days){
      if(detail&&(day.y<options.firstRow||day.y>=options.lastRow))continue;
      if(day.count!==0)continue;
      const seed=year.year*371+day.x*7919+day.y*43;
      const x=ox+(day.x+.5)*pitch,y=(day.y+.5)*pitch;
      const square=squares.get(`${day.x},${day.y}`);
      if(square){
        rectangle(x-.61,y-.61,1.22,1.22,'#b7b28f','#8a9771',unit*.018);
        const [[ax,ay],[bx,by]]=square.edge;
        footpath([[x,y],[ox+(ax+bx)/2*pitch,(ay+by)/2*pitch]]);
        const kinds=[['magic',6],['life',6],['life',8],['life',7],['magic',8]];
        const [source,index]=kinds[(square.bucket+year.year)%kinds.length];
        ornament(source,index,x,y,1,'public-facility');
        ornament('magic',7,x+.48,y-.38,.85,'leyline-lamp');
        ornament('life',5,x-.48,y+.40,.65,'flowering-tree');
        metadata.plazas.push({year:year.year,x:day.x,y:day.y,count:day.count,edge:square.edge,kind:(source==='magic'?magicCatalog:lifeCatalog).frames[index].family});
      }
      else if(hash(seed)>.88)ornament('life',5,x,y,.85,'flowering-tree');
      else if(hash(seed+77)>.98)ornament('life',3+Math.floor(hash(seed+7)*2),x,y,.85,'animal-group');
      else if(hash(seed)>.80)sprite(11,x,y,.40+hash(seed+1)*.17,'scenery');
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
      const form=window.planFantasyBuildingForm({...parcel,year:year.year},formCatalog,pitch,magicCatalog);
      const box={x:px+form.footprint.x,y:py+form.footprint.y,w:form.footprint.w,h:form.footprint.h};
      const entryX=px+form.entry.x,entryY=py+form.entry.y;
      rectangle(px+.18,py+.18,w-.36,h-.36,parcel.tier<=1?'#8e985d':'#96a16e','rgba(75,92,60,.55)',Math.max(.8,unit*.018));
      rectangle(box.x-.04,box.y-.04,box.w+.08,box.h+.08,parcel.tier<=1?'#aa9a70':'#b6b08a');
      if(parcel.mean>5){
        const count=Math.round(box.w*box.h*7);
        for(let i=0;i<count;i++){
          const x=box.x+hash(seed+i*13)*(box.w-.14),y=box.y+hash(seed+i*31)*(box.h-.12);
          rectangle(x,y,.12,.09,'rgba(224,213,177,.38)','rgba(123,123,95,.22)',Math.max(.5,unit*.008));
        }
      }
      const gateX=px+w/2,gateY=py+h;
      const stone=parcel.tier>=3;
      fence([px+.17,py+.17],[px+w-.17,py+.17],stone);
      fence([px+.17,py+.17],[px+.17,py+h-.17],stone);
      fence([px+w-.17,py+.17],[px+w-.17,py+h-.17],stone);
      fence([px+.17,py+h-.17],[gateX-.23,py+h-.17],stone);
      fence([gateX+.23,py+h-.17],[px+w-.17,py+h-.17],stone);
      footpath([[gateX,gateY-.17],[gateX,gateY],[ox+parcel.gateNode.x*pitch,parcel.gateNode.y*pitch]]);
      footpath([[entryX,entryY],[entryX,gateY-.38],[gateX,gateY-.38],[gateX,gateY-.17]]);
      // Planting beds use spare yard, with a clear centre route to the gate.
      const farm=form.family.includes('farmstead');
      if(parcel.w*parcel.h>1){
        for(let y=py+.42;y<py+h-.7;y+=.52)for(let x=px+.29;x<px+w-.55;x+=.72){
          if(x+.30>box.x-.12&&x<box.x+box.w+.12&&y+.30>box.y-.12&&y<box.y+box.h+.12)continue;
          if(y+.30>entryY&&Math.abs(x+.15-entryX)<.24)continue;
          if(y+.30>gateY-.5&&Math.abs(x+.15-gateX)<.28)continue;
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
      sprite(form.frame,px+form.anchor.x,py+form.anchor.y,form.scale,'building',{year:year.year,parcelId:parcel.id,form});
      ornament('life',parcel.tier>=2?(seed%2?0:2):1,entryX+.1,entryY+.08,1,'resident-group');
      if(farm)ornament('life',3,px+.50,py+h-.43,.85,'animal-group');
      metadata.forms[form.family]=(metadata.forms[form.family]||0)+1;
      metadata.layouts.push({year:year.year,id:parcel.id,family:form.family,footprint:form.footprint,parcel:{w,h},entry:form.entry});
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
  const visibleUnits=[];
  for(const item of queue){
    if(item.kind==='fence'){item.draw();continue;}
    const source=sources[item.kind==='building'?item.form.atlas:item.atlas||'cottages'];
    const frame=source.catalog.frames[item.frame],cal=frame.projection;
    const [x,y]=project(item.x,item.y);
    const scale=cal?unit*cal.scale*item.scale:unit*1.60/320*item.scale;
    const mirror=item.kind==='building'&&item.form.mirror;
    const anchor=cal?cal.anchor:[frame.footx,frame.footy];
    const bounds=cal?cal.corners.map(([px,py])=>[x+(mirror?-px:px)*unit*item.scale,y+py*unit*item.scale]):[[x-anchor[0]*scale,y-anchor[1]*scale],[x+(frame.sw-anchor[0])*scale,y+(frame.sh-anchor[1])*scale]];
    ctx.save();
    ctx.translate(x,y);if(mirror)ctx.scale(-1,1);ctx.scale(scale,scale);
    if(cal)ctx.transform(1,cal.shear,0,cal.vertical,0,0);
    ctx.translate(-anchor[0],-anchor[1]);
    ctx.drawImage(frame.source==='magic-town-v1.png'?magicCompact:source.image,frame.sx,frame.sy,frame.sw,frame.sh,0,0,frame.sw,frame.sh);
    ctx.restore();
    if(item.kind==='building'){
      metadata.drawnUnits++;
      if(Math.max(...bounds.map(p=>p[0]))>0&&Math.min(...bounds.map(p=>p[0]))<canvas.width&&Math.max(...bounds.map(p=>p[1]))>header&&Math.min(...bounds.map(p=>p[1]))<canvas.height-footer)visibleUnits.push({year:item.year,id:item.parcelId});
    }else {metadata.decorations++;if(item.role)metadata.life[item.role]=(metadata.life[item.role]||0)+1;}
  }
  metadata.visibleUnits=visibleUnits.length;
  if(!detail){
    for(const year of years){
      const [x,y]=project(offsets.get(year.year)+fieldWidth/2,-1.85);
      ctx.font=`600 ${Math.max(22,unit*.58)}px Georgia,serif`;ctx.textAlign='center';
      ctx.fillStyle='rgba(30,47,29,.6)';ctx.fillText(String(year.year),x+1,y+2);ctx.fillStyle='#f2ddb0';ctx.fillText(String(year.year),x,y);
    }
  }
  const topFade=ctx.createLinearGradient(0,0,0,header+90);topFade.addColorStop(0,'rgba(242,233,206,.98)');topFade.addColorStop(.6,'rgba(242,233,206,.93)');topFade.addColorStop(1,'rgba(242,233,206,0)');ctx.fillStyle=topFade;ctx.fillRect(0,0,canvas.width,header+90);
  ctx.textAlign='left';ctx.fillStyle='#263c2b';ctx.font=`600 ${detail?52:66}px "PingFang SC","Heiti SC",sans-serif`;
  ctx.fillText(detail?`${options.year} · 西欧魔法小镇`:'wxy 的西欧魔法小镇',margin,detail?70:88);
  ctx.font=`${detail?24:30}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#5c6c4d';
  const total=data.years.reduce((n,y)=>n+y.total,0),count=data.years.reduce((n,y)=>n+plans.get(y.year).estates.length,0);
  ctx.fillText(detail?'圆形工坊与观星台 · 居民、家畜与花树 · 魔法设施与公共广场':`2024–${data.asOf.replaceAll('-','/')} · ${total.toLocaleString('en-US')} 次公开贡献 · ${count} 个建筑单元`,margin,detail?112:139);
  const bottomFade=ctx.createLinearGradient(0,canvas.height-footer-45,0,canvas.height);bottomFade.addColorStop(0,'rgba(242,233,206,0)');bottomFade.addColorStop(1,'rgba(242,233,206,.95)');ctx.fillStyle=bottomFade;ctx.fillRect(0,canvas.height-footer-45,canvas.width,footer+45);
  ctx.font=`${detail?19:25}px "PingFang SC","Heiti SC",sans-serif`;ctx.fillStyle='#526347';
  ctx.fillText('建筑地块来自真实贡献；人物、动物、花树与公共设施仅表现生活场景。',margin,canvas.height-40);
  metadata.width=canvas.width;metadata.height=canvas.height;
  metadata.unit=unit;
  return {canvas,metadata};
};
