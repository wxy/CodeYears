import * as THREE from "three";
import type { DailyContribution } from "../data/types";
import type { LandscapeView } from "./types";

/** 连续高度场保留；只在切入 Terrain 时加载 Three.js 并创建 WebGL。 */
export function createTerrainView(days: readonly DailyContribution[], onLost: () => void): LandscapeView {
  const columns=Math.ceil(Math.sqrt(days.length)*1.3),rows=Math.ceil(days.length/columns);
  const width=columns*1.6+Math.floor((columns-1)/4)*2.2+Math.max(6,columns*1.6*.13),depth=rows*1.6+Math.floor((rows-1)/4)*2.2+Math.floor((rows-1)/16)*1.2;
  const radius=Math.hypot(width,depth)/2,raw=days.map(day=>Math.log1p(day.count)),weights=[1,2,3,4,3,2,1];
  let smooth:readonly number[]=raw;
  for(let pass=0;pass<2;pass++){
    const previous=smooth;
    smooth=raw.map((_,i)=>{const r=Math.floor(i/columns),c=i%columns;let sum=0,total=0;
      for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const row=r+dz,col=c+dx,index=row*columns+col;
        if(row>=0&&row<rows&&col>=0&&col<columns&&index<days.length){const w=weights[dz+3]*weights[dx+3];sum+=previous[index]*w;total+=w}}
      return sum/total;
    });
  }
  const valley=Math.min(...smooth),relief=Math.max(Math.max(...smooth)-valley,.01),heightScale=Math.hypot(width,depth)*.16;
  const heights=smooth.map(value=>Math.pow((value-valley)/relief,1.45)*heightScale);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setClearColor(0,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  const scene=new THREE.Scene(),ambient=new THREE.HemisphereLight(0xdce9f5,0x758368,2.1),sun=new THREE.DirectionalLight(0xffead1,3.1);sun.position.set(-radius,radius*2,radius);scene.add(ambient,sun);
  const distance=radius*3+30,camera=new THREE.OrthographicCamera(-20,20,12,-12,.1,distance*6);camera.position.set(distance/Math.SQRT2,distance/Math.sqrt(3),distance/Math.SQRT2);camera.lookAt(0,2,0);
  const surface=document.createElement("canvas");surface.width=surface.height=512;const ctx=surface.getContext("2d")!,pixels=ctx.createImageData(512,512);let seed=739391;
  for(let i=0;i<pixels.data.length;i+=4){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;const value=212+(seed>>>0)%44;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255}ctx.putImageData(pixels,0,0);
  ctx.globalCompositeOperation="destination-in";const mask=ctx.createRadialGradient(256,256,160,256,256,300);mask.addColorStop(0,"white");mask.addColorStop(1,"transparent");ctx.fillStyle=mask;ctx.fillRect(0,0,512,512);
  const map=new THREE.CanvasTexture(surface);map.colorSpace=THREE.SRGBColorSpace;map.flipY=false;
  const level={value:0},peak={value:heightScale},material=new THREE.MeshStandardMaterial({map,roughness:.96,transparent:true,alphaTest:.02});
  const color=(hex:number)=>`vec3(${new THREE.Color(hex).toArray().map(v=>v.toFixed(5)).join(",")})`;
  material.onBeforeCompile=shader=>{
    shader.uniforms.uLevel=level;shader.uniforms.uPeak=peak;
    shader.vertexShader="uniform float uLevel; varying float vHeight;\n"+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\ntransformed.y=min(transformed.y,uLevel);vHeight=transformed.y;").replace("#include <beginnormal_vertex>","#include <beginnormal_vertex>\nif(position.y>uLevel)objectNormal=vec3(0.,1.,0.);");
    shader.fragmentShader="varying float vHeight; uniform float uPeak;\n"+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",`#include <color_fragment>\nfloat a=vHeight/uPeak;vec3 c=mix(${color(0x53834f)},${color(0x87967b)},smoothstep(.08,.46,a));c=mix(c,${color(0x96988e)},smoothstep(.48,.75,a));c=mix(c,${color(0xf1f4f3)},smoothstep(.75,.91,a));diffuseColor.rgb*=c;`);
  };
  let mesh:THREE.Mesh|undefined,step=0,lastWidth=0,lastHeight=0;
  function rebuild(next:number){
    if(mesh){scene.remove(mesh);mesh.geometry.dispose()}
    step=next;const positions:number[]=[],normals:number[]=[],uvs:number[]=[],indices:number[]=[],normal=new THREE.Vector3();let max=1;
    const sample=(x:number,z:number)=>heights[Math.min(THREE.MathUtils.clamp(Math.round(z-.5),0,rows-1)*columns+THREE.MathUtils.clamp(Math.round(x-.5),0,columns-1),days.length-1)];
    const heightAt=(x:number,z:number)=>{
      const x0=Math.floor(x/step)*step,z0=Math.floor(z/step)*step,tx=(x-x0)/step,tz=(z-z0)/step;
      const h=THREE.MathUtils.lerp(THREE.MathUtils.lerp(sample(x0,z0),sample(x0+step,z0),tx),THREE.MathUtils.lerp(sample(x0,z0+step),sample(x0+step,z0+step),tx),tz);
      const nx=x/columns*2-1,nz=z/rows*2-1,edge=Math.pow(Math.abs(nx)**6+Math.abs(nz)**6,1/6),folds=.84+.12*(1-Math.abs(Math.sin(nx*17+nz*9+Math.sin(nz*11))))+.04*Math.sin(nx*39-nz*28);
      return h*folds*(1-THREE.MathUtils.smoothstep(edge+Math.sin(nx*7+nz*4)*.025,.7,1.02));
    };
    const add=(x:number,z:number,w:number,d:number)=>{
      const offset=positions.length/3;
      for(const [px,pz] of [[x,z],[x+w,z],[x+w,z+d],[x,z+d],[x+w/2,z+d/2]]){
        const h=heightAt(px,pz);max=Math.max(max,h);positions.push(px/columns*width-width/2,h,pz/rows*depth-depth/2);uvs.push(px/columns,pz/rows);
        normal.set((heightAt(px-.25,pz)-heightAt(px+.25,pz))/(.5*width/columns),1,(heightAt(px,pz-.25)-heightAt(px,pz+.25))/(.5*depth/rows)).normalize();normals.push(normal.x,normal.y,normal.z);
      }
      indices.push(offset,offset+4,offset+1,offset+1,offset+4,offset+2,offset+2,offset+4,offset+3,offset+3,offset+4,offset);
    };
    for(let z=0;z<rows;z+=step)for(let x=0;x<columns;x+=step){const w=Math.min(step,columns-x),d=Math.min(step,rows-z);
      if((z+d-1)*columns+x+w<=days.length)add(x,z,w,d);else for(let r=z;r<z+d&&r*columns+x<days.length;r++)add(x,r,Math.min(w,days.length-r*columns-x),1)}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
    peak.value=max;mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
  }
  const lost=(event:Event)=>{event.preventDefault();onLost()};renderer.domElement.addEventListener("webglcontextlost",lost);
  return{
    canvas:renderer.domElement,description:()=>`连续时光山脉 · ${step===1?"精细":"宏观"}视图 · 固定视角，拖动平移`,
    draw(progress,v){
      if(lastWidth!==v.width||lastHeight!==v.height){lastWidth=v.width;lastHeight=v.height;renderer.setPixelRatio(v.dpr);renderer.setSize(v.width,v.height,false)}
      const aspect=v.width/v.height,half=Math.max(radius*.72+3,radius/aspect)*1.08,pixel=half*2/v.height/v.zoom;
      camera.left=-half*aspect-v.panX*pixel;camera.right=half*aspect-v.panX*pixel;camera.top=half+v.panY*pixel;camera.bottom=-half+v.panY*pixel;camera.zoom=v.zoom;camera.updateProjectionMatrix();
      const pixels=v.height*(width/columns)*v.zoom/(half*2),next=pixels>=8?1:pixels>=3.5?2:4;if(next!==step)rebuild(next);
      level.value=(1-Math.pow(1-progress,1.4))*peak.value;ambient.color.set(v.dark?0xb9cbee:0xdce9f5);sun.color.set(v.dark?0xc6d8f2:0xffead1);sun.intensity=v.dark?1.8:3.1;renderer.render(scene,camera);
    },
    dispose(){renderer.domElement.removeEventListener("webglcontextlost",lost);mesh?.geometry.dispose();material.dispose();map.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();surface.width=surface.height=0},
  };
}
