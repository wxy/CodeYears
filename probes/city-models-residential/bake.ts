import data from '../../docs/design/city-model-expansion/residential/calibration.json';
import { calibrate, drawUnit, loadUnit, type Point, type UnitSample } from '../../src/renderers/unit-calibration';
const sources=import.meta.glob('../../docs/design/city-model-expansion/residential/sources/units/*.png',{eager:true,query:'?url',import:'default'});

/** 与 city-source-assets 的 bakeUnit 同一算法，输出仅写独立候选目录。 */
export async function bakeCandidates() {
  const results = [];
  for (const sample of data.assets as unknown as UnitSample[]) {
    const image = await loadUnit(new URL(sources[`../../${sample.file}`] as string, location.href).href);
    try {
      const c = calibrate(sample), [x0,y0,x1,y1] = sample.crop;
      const points = ([[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as Point[]).map(c.point);
      const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
      const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
      const padding=2,ratio=Math.min(4,380/Math.max(maxX-minX,maxY-minY));
      const canvas=document.createElement('canvas');
      canvas.width=Math.min(384,Math.ceil((maxX-minX)*ratio)+4);
      canvas.height=Math.min(384,Math.ceil((maxY-minY)*ratio)+4);
      const ctx=canvas.getContext('2d')!;
      ctx.setTransform(ratio,0,0,ratio,padding-minX*ratio,padding-minY*ratio);
      ctx.imageSmoothingQuality='high';drawUnit(ctx,sample,image,true,true);
      results.push({id:sample.id,png:canvas.toDataURL('image/png').split(',')[1],
        metadata:{file:`${sample.id}.png`,left:(minX-padding/ratio)/96,top:(minY-padding/ratio)/96,
          width:canvas.width/ratio/96,height:canvas.height/ratio/96,nativeWidth:sample.footprint[0],nativeDepth:sample.footprint[1],baselineHeight:c.actualHeight,sampleId:sample.id},
        calibration:{mappedW:c.mappedW,mappedD:c.mappedD,clearance:c.clearance,actualHeight:c.actualHeight,heightLimitedByFootprint:c.heightLimitedByFootprint},pixels:[canvas.width,canvas.height]});
      canvas.width=canvas.height=0;
    } finally { image.close(); }
  }
  return results;
}
