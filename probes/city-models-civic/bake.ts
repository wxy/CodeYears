import { calibrate, drawUnit, loadUnit, type Point, type UnitSample } from '../../src/renderers/unit-calibration';
import samples from '../../docs/design/city-model-expansion/civic/calibration.json';
const sourceFiles=import.meta.glob('../../docs/design/city-model-expansion/civic/sources/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
/** 与 city-source-assets bakeUnit 的建筑路径相同；只在离线制作候选时调用。 */
export async function bake(){
 const result=[];
 for(const sample of samples as unknown as UnitSample[]){const image=await loadUnit(sourceFiles[`../../docs/design/city-model-expansion/civic/${sample.file}`]);try{const c=calibrate(sample),[x0,y0,x1,y1]=sample.crop;
 const points=([[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as Point[]).map(c.point);
 const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
 const padding=2,ratio=Math.min(4,(384-padding*2)/Math.max(maxX-minX,maxY-minY));const canvas=document.createElement('canvas');canvas.width=Math.min(384,Math.ceil((maxX-minX)*ratio)+4);canvas.height=Math.min(384,Math.ceil((maxY-minY)*ratio)+4);
 const context=canvas.getContext('2d')!;context.setTransform(ratio,0,0,ratio,2-minX*ratio,2-minY*ratio);context.imageSmoothingQuality='high';drawUnit(context,sample,image,true,true);
 result.push({id:sample.id,file:`/assets/city-candidates-civic/${sample.id}.png`,left:(minX-2/ratio)/96,top:(minY-2/ratio)/96,width:canvas.width/ratio/96,height:canvas.height/ratio/96,nativeWidth:sample.footprint[0],nativeDepth:sample.footprint[1],baselineHeight:c.actualHeight,sampleId:sample.id,pixels:[canvas.width,canvas.height],calibration:{mappedW:c.mappedW,mappedD:c.mappedD,clearance:c.clearance,actualHeight:c.actualHeight},data:canvas.toDataURL()});canvas.width=canvas.height=0;
 }finally{image.close()}}Object.assign(window,{civicBake:result});document.getElementById('status')!.textContent='离线候选烘焙完成';
}
