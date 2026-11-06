export interface CityTrafficSignal {x:number;z:number;heads:('x'|'z')[]}

/** 灯杆、遮光罩与三色灯用矢量预备；近景缓存按实际像素绘制，不放大小位图。 */
export function createCityTrafficSignalPainter(signals:readonly CityTrafficSignal[]):(context:CanvasRenderingContext2D)=>void {
  const commands:{path:Path2D;color:string}[]=[];
  const project=(x:number,z:number,h=0):[number,number]=>[(x-z)*.5,(x+z)*.25-h*.5];
  const face=(points:[number,number][],color:string)=>{
    const path=new Path2D();points.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();commands.push({path,color});
  };
  for(const {x,z,heads}of [...signals].sort((a,b)=>a.x+a.z-b.x-b.z)){
    face([project(x-.05,z-.05),project(x+.05,z-.05),project(x+.05,z+.05),project(x-.05,z+.05)],'#71817a');
    const base=project(x,z),top=project(x,z,.72);
    face([[base[0]-.012,base[1]],[base[0]+.012,base[1]],[top[0]+.012,top[1]],[top[0]-.012,top[1]]],'#43565a');
    face([[base[0]-.009,base[1]],[base[0]-.003,base[1]],[top[0]-.003,top[1]],[top[0]-.009,top[1]]],'#b9c6bf');
    for(const axis of heads){
      const arm=project(x+(axis==='x'?.26:0),z+(axis==='z'?.26:0),.72);
      // 将细杆转成固定宽面，避免近景仍受旧的灯具位图像素限制。
      face([[top[0],top[1]-.009],[arm[0],arm[1]-.009],[arm[0],arm[1]+.009],[top[0],top[1]+.009]],'#52666a');
      const px=arm[0],py=arm[1],slant=axis==='x'?.018:-.018;
      face([[px-.038,py-.014],[px+.038,py+slant-.014],[px+.038,py+slant+.16],[px-.038,py+.16]],'#1b3036');
      face([[px-.042,py-.025],[px+.042,py+slant-.025],[px+.042,py+slant-.008],[px-.042,py-.008]],'#6d817e');
      for(let light=0;light<3;light++){
        const active=light===(axis==='x'?2:0),circle=new Path2D();
        circle.ellipse(px,py+slant/2+.025+light*.052,.021,.019,0,0,Math.PI*2);
        commands.push({path:circle,color:active?(axis==='x'?'#59d99d':'#f07960'):'#425a59'});
        if(active){const glint=new Path2D();glint.ellipse(px-.005,py+slant/2+.02+light*.052,.006,.005,0,0,Math.PI*2);commands.push({path:glint,color:'#edf3d8'})}
      }
    }
  }
  return context=>{context.save();for(const {path,color}of commands){context.fillStyle=color;context.fill(path)}context.restore()};
}
