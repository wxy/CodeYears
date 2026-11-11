import catalog from './town-baked-catalog.json';
import { closeCityImages, type CityImages, type CitySprite } from './city-assets';

const sprites:Record<string,Omit<CitySprite,'canvas'>&{file:string}>=catalog;

/** 校准在构建素材时完成；运行时只解码所选小镇PNG。 */
export async function loadTownImages(base:string,ids:readonly string[],signal?:AbortSignal):Promise<CityImages>{
  const images:CityImages={};
  try{
    signal?.throwIfAborted();
    const pending=[...new Set(ids)].map(async id=>{
      const entry=sprites[id];if(!entry)throw new Error(`未找到小镇素材：${id}`);
      const response=await fetch(new URL(entry.file,base),{signal});if(!response.ok)throw new Error(`小镇素材读取失败：${response.status}`);
      const bitmap=await createImageBitmap(await response.blob()),canvas=document.createElement('canvas');
      try{
        signal?.throwIfAborted();canvas.width=bitmap.width;canvas.height=bitmap.height;
        const context=canvas.getContext('2d');if(!context)throw new Error('无法创建小镇素材画布。');
        context.drawImage(bitmap,0,0);const {file:_file,...metadata}=entry;return {[id]:{canvas,...metadata}};
      }catch(error){canvas.width=canvas.height=0;throw error;}
      finally{bitmap.close();}
    });
    const results=await Promise.allSettled(pending);
    for(const result of results)if(result.status==='fulfilled')Object.assign(images,result.value);
    const failed=results.find(result=>result.status==='rejected');
    if(failed)throw new Error('小镇素材加载失败，请重新生成。',{cause:failed.reason});
    signal?.throwIfAborted();return images;
  }catch(error){closeCityImages(images);throw error;}
}
