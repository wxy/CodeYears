/* Shared offline projection used by the scale preview and PNG bake. */
window.prepareTownScaleImages = async function prepareTownScaleImages({ frames, load, maxEdge = 752 }) {
  const sprites = {};
  for (const f of frames) {
  const im=await load(f.source),p=f.projection,ratio=maxEdge/Math.max(f.width,f.height),padding=4;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(f.width*ratio)+padding*2;canvas.height=Math.ceil(f.height*ratio)+padding*2;
  const c=canvas.getContext('2d');c.imageSmoothingQuality='high';c.translate(padding+(p.center[0]-f.left)*ratio,padding+(p.center[1]-f.top)*ratio);
  c.scale(p.scale*ratio/2,p.scale*ratio/2);c.transform(1,p.shear,0,p.vertical,0,0);c.translate(-p.anchor[0],-p.anchor[1]);c.drawImage(im,...f.crop,0,0,f.crop[2],f.crop[3]);c.resetTransform();
  const pixels=c.getImageData(0,0,canvas.width,canvas.height);for(let i=3;i<pixels.data.length;i+=4){const a=pixels.data[i];if(a<=8)pixels.data[i]=0;else if(a<32)pixels.data[i]=Math.round(a*(a-8)/24);}c.putImageData(pixels,0,0);
  sprites[f.id]={...f,canvas,left:f.left-padding/ratio,top:f.top-padding/ratio,width:canvas.width/ratio,height:canvas.height/ratio};
  }
  return sprites;
};
