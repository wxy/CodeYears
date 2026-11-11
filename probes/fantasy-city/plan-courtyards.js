/* Design-probe planning on already validated real contribution rectangles.
 * Similarity here means the same existing visual prosperity band. */
window.planFantasyCourtyards = function planFantasyCourtyards(year) {
  const tier = mean => mean<=2?0:mean<=5?1:mean<=19?2:mean<=49?3:4;
  const base = new Map(year.parcels.map(p => [p.id, {...p,tier:tier(p.mean)}]));
  const original = new Int32Array(7*year.rows).fill(-1);
  const counts = new Map(year.days.map(day => [day.y*7+day.x,day.count]));
  for(const p of base.values())for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)original[y*7+x]=p.id;
  const candidates=[];
  for(let y=0;y<year.rows;y++)for(let x=0;x<7;x++){
    if(original[y*7+x]<0)continue;
    for(let w=1;w<=7-x;w++){
      const members=new Set();let band;
      for(let h=1;h<=year.rows-y;h++){
        let compatible=true;
        for(let xx=x;xx<x+w;xx++){
          const id=original[(y+h-1)*7+xx];
          if(id<0||(band!==undefined&&base.get(id).tier!==band)){compatible=false;break;}
          band=base.get(id).tier;members.add(id);
        }
        if(!compatible)break;
        // A courtyard may combine complete base parcels, but never cut one.
        if([...members].some(id=>{const p=base.get(id);return p.x<x||p.y<y||p.x+p.w>x+w||p.y+p.h>y+h;}))continue;
        candidates.push({x,y,w,h,tier:band,members:[...members].sort((a,b)=>a-b)});
      }
    }
  }
  candidates.sort((a,b)=>b.w*b.h-a.w*a.h||Math.min(b.w,b.h)/Math.max(b.w,b.h)-Math.min(a.w,a.h)/Math.max(a.w,a.h)||a.y-b.y||a.x-b.x);
  const used=new Set(),estates=[];
  for(const candidate of candidates){
    if(candidate.members.some(id=>used.has(id)))continue;
    candidate.members.forEach(id=>used.add(id));
    let total=0;
    for(let y=candidate.y;y<candidate.y+candidate.h;y++)for(let x=candidate.x;x<candidate.x+candidate.w;x++)total+=counts.get(y*7+x);
    estates.push({...candidate,id:estates.length+1,total,mean:total/(candidate.w*candidate.h)});
  }
  const owners=new Int32Array(7*year.rows).fill(-1);
  for(const p of estates)for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++)owners[y*7+x]=p.id;
  const owner=(x,y)=>x<0||x>=7||y<0||y>=year.rows?-1:owners[y*7+x];
  const allowed=(x,y,nx,ny)=>{
    const a=x!==nx?owner(Math.min(x,nx),y-1):owner(x-1,Math.min(y,ny));
    const b=x!==nx?owner(Math.min(x,nx),y):owner(x,Math.min(y,ny));
    return !(a>=0&&a===b);
  };
  // Boundary-only paths from every courtyard gate to the common west-side lane.
  const stride=8,parent=new Int32Array(stride*(year.rows+1)).fill(-1),queue=[];
  for(let y=0;y<=year.rows;y++){const id=y*stride;parent[id]=id;queue.push(id);}
  for(let head=0;head<queue.length;head++){
    const id=queue[head],x=id%stride,y=Math.floor(id/stride);
    for(const [nx,ny] of [[x+1,y],[x,y-1],[x,y+1],[x-1,y]]){
      if(nx<0||nx>7||ny<0||ny>year.rows)continue;
      const next=ny*stride+nx;
      if(parent[next]!==-1||!allowed(x,y,nx,ny))continue;
      parent[next]=id;queue.push(next);
    }
  }
  const edges=new Map(),roots=new Set();
  for(const estate of estates){
    estate.gate={x:estate.x+estate.w/2,y:estate.y+estate.h};
    const x=Math.round(estate.gate.x),y=estate.gate.y;
    let id=y*stride+x;
    if(parent[id]<0)throw new Error('A courtyard gate has no boundary-only route');
    estate.gateNode={x,y};
    while(parent[id]!==id){
      const next=parent[id],key=`${Math.min(id,next)}:${Math.max(id,next)}`;
      edges.set(key,[[id%stride,Math.floor(id/stride)],[next%stride,Math.floor(next/stride)]]);id=next;
    }
    roots.add(Math.floor(id/stride));
  }
  return {estates,edges:[...edges.values()],roots:[...roots],baseCount:year.parcels.length};
};
