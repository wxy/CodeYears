/* Visible edge directions calibrate the camera; the support envelope only fits/anchors it. */
window.prepareFantasyProjection = function prepareFantasyProjection(frame) {
  let shear=0,vertical=1,points,anchor;
  if(frame.ground){
    const [l,f,r]=frame.ground;
    const [wa,wb]=frame.axes?.W??[l,f],[da,db]=frame.axes?.D??[f,r];
    const mw=(wb[1]-wa[1])/(wb[0]-wa[0]),md=(db[1]-da[1])/(db[0]-da[0]);
    vertical=1/(mw-md);shear=-(mw+md)/(2*(mw-md));
    points=[l,f,r,[l[0]+r[0]-f[0],l[1]+r[1]-f[1]]];
    anchor=[(l[0]+r[0])/2,(l[1]+r[1])/2];
  }else if(frame.ellipse){
    const [x,y,rx,ry]=frame.ellipse;vertical=rx/(2*ry);anchor=[x,y];
    points=Array.from({length:32},(_,i)=>[x+Math.cos(i*Math.PI/16)*rx,y+Math.sin(i*Math.PI/16)*ry]);
  }else{
    anchor=frame.anchor;points=[anchor];
  }
  const map=([x,y])=>[x-anchor[0],shear*(x-anchor[0])+vertical*(y-anchor[1])];
  const plane=points.map(map),ws=plane.map(([x,y])=>x/2+y),ds=plane.map(([x,y])=>-x/2+y);
  const span=[Math.max(...ws)-Math.min(...ws),Math.max(...ds)-Math.min(...ds)];
  const fitScale=frame.worldHeight
    ?frame.worldHeight/(vertical*(frame.bounds[3]-frame.bounds[1]))
    :Math.min(frame.footprint[0]/span[0],frame.footprint[1]/span[1]);
  const ref=frame.heightReference;
  const sourceHeight=ref?map(ref.base)[1]-map(ref.top)[1]:0;
  const scale=ref?Math.min(fitScale,ref.target/sourceHeight):fitScale;
  const corners=[[0,0],[frame.sw,0],[frame.sw,frame.sh],[0,frame.sh]].map(map).map(([x,y])=>[x*scale,y*scale]);
  frame.projection={shear,vertical,anchor,scale,span:span.map(v=>v*scale),corners,referenceHeight:sourceHeight*scale,heightLimited:scale<fitScale,
    directionBasis:frame.axes?'annotated-edge-pairs':frame.ellipse?'horizontal-base-ellipse':frame.ground?'support-envelope-only':'contact-and-size-only'};
  return frame.projection;
};
