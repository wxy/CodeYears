/* Local prototype: choose a floor plan without changing contribution parcels. */
window.planFantasyBuildingForm = function planFantasyBuildingForm(parcel, catalog, pitch, magic) {
  const width=parcel.w*pitch,height=parcel.h*pitch,area=parcel.w*parcel.h;
  const seed=parcel.year+parcel.x*7+parcel.y*13;
  if(area===1&&parcel.tier<2)return {
    family:'cottage',atlas:'cottages',frame:parcel.tier*2+(Math.floor(parcel.x/2)+parcel.year)%2,
    footprint:{x:.24,y:.18,w:1.15,h:1.05},anchor:{x:.815,y:.705},entry:{x:.73,y:1.23},scale:1,
  };
  if(area===1&&seed%3!==0)return {
    family:'cottage',atlas:'cottages',frame:parcel.tier*2+(Math.floor(parcel.x/2)+parcel.year)%2,
    footprint:{x:.24,y:.18,w:1.15,h:1.05},anchor:{x:.815,y:.705},entry:{x:.73,y:1.23},scale:1,
  };
  let frame,mirror=false;
  let atlas='forms';
  if(area===1){frame=parcel.tier>=3?0:1;atlas='magic';}
  else if(parcel.tier<=1&&area>=4){
    if(parcel.w>=2&&parcel.h>=2)frame=6;
    else {frame=7;mirror=parcel.w>parcel.h;}
  }else if(parcel.w>=2&&parcel.h>=2){
    frame=parcel.w/parcel.h>=1.6?5:parcel.tier>=3?4:3;atlas='magic';
  }else{
    const long=Math.max(parcel.w,parcel.h)>=3;
    if(parcel.tier>=2&&seed%3===0){frame=2;atlas='magic';}
    else frame=(long?3:0)+(parcel.tier>=2?1:0);
    mirror=parcel.w>parcel.h;
  }
  const art=(atlas==='magic'?magic:catalog).frames[frame];
  const nominalWidth=art.footprint[mirror?1:0],nominalHeight=art.footprint[mirror?0:1];
  const scale=Math.min((width-.60)/nominalWidth,(height-.72)/nominalHeight,1.15);
  const w=nominalWidth*scale,h=nominalHeight*scale;
  const footprint={x:(width-w)/2,y:.28,w,h};
  return {
    family:art.family,atlas,frame,mirror,scale,footprint,
    anchor:{x:footprint.x+w/2,y:footprint.y+h/2},
    entry:{x:footprint.x+w/2,y:footprint.y+h},
  };
};
