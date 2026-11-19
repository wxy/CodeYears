import type { LandscapeView, LandscapeViewport } from './types';
import { organizationFace, type OrganizationPoster } from './city-organization-boards';

/** 原生链接位于牌面的屏幕投影上。空间不足时，名录承接尚未摆入城里的组织。 */
export function createOrganizationLinks(host:HTMLElement,panBy:(dx:number,dy:number)=>void) {
  const layer=document.createElement('div');layer.className='city-organization-layer';
  const style=document.createElement('style');
  style.textContent=`
    .city-organization-layer { position:absolute; z-index:1; inset:0; overflow:clip; pointer-events:none; container:city-map / size; }
    .city-org-link { position:absolute; display:block; pointer-events:auto; transform-origin:0 0; -webkit-user-drag:none; }
    .city-org-link[hidden],.city-org-directory[hidden] { display:none; }
    .city-org-link:hover,.city-org-link:focus-visible { outline:2px solid #318286; outline-offset:1px; }
    .city-org-link>canvas { display:block; position:absolute; pointer-events:none; }
    .city-org-tooltip { position:absolute; z-index:2; translate:-50% -100%; padding:3px 7px; border-radius:5px; font:600 12px/1.4 system-ui,sans-serif; background:#213838; color:white; overflow-wrap:anywhere; }
    .city-map-corner { position:absolute; z-index:1; inset-inline-start:12px; inset-block-end:12px; inline-size:min(264px,calc(100% - 24px)); display:flex; flex-direction:column; align-items:flex-start; gap:8px; }
    .city-map-credit { display:block; inline-size:100%; block-size:68px; border-radius:13px; pointer-events:auto; }
    .city-map-credit[hidden] { display:none; }
    .city-map-credit:hover { box-shadow:inset 0 0 0 1px #efe0a9; }
    .city-map-credit:focus-visible { outline:2px solid #efe0a9; outline-offset:2px; }
    .city-org-directory { max-inline-size:100%; pointer-events:auto; padding:3px; border:1px solid var(--borderColor-default,#b8c4bc); border-radius:7px; background:var(--bgColor-default,#fff); color:var(--fgColor-default,#263c3a); }
    .city-org-directory summary { cursor:pointer; padding:3px 7px; font:600 12px/1.4 system-ui,sans-serif; }
    .city-org-directory ul { list-style:none; padding:0; margin:4px; max-block-size:min(150px,32cqh); max-inline-size:min(250px,65cqw); overflow:auto; overscroll-behavior:contain; touch-action:pan-y; }
    .city-org-directory li a { display:block; padding:4px; color:var(--fgColor-accent,#0969da); overflow-wrap:anywhere; }
    @container city-map (width < 410px) { .city-map-corner { inset-block-end:56px; } }
  `;
  const directory=document.createElement('details');directory.className='city-org-directory';directory.hidden=true;
  const summary=document.createElement('summary'),list=document.createElement('ul');
  const tooltip=document.createElement('span');tooltip.className='city-org-tooltip';tooltip.hidden=true;tooltip.setAttribute('aria-hidden','true');
  const corner=document.createElement('div');corner.className='city-map-corner';
  directory.append(summary,list);corner.append(directory);layer.append(style,tooltip,corner);host.append(layer);
  const inset=100*organizationFace.inset/organizationFace.size;
  let links:HTMLAnchorElement[]=[],visibleCount=-1,label='Organizations';
  let selected:HTMLAnchorElement|undefined;
  const clearTooltip=()=>{selected=undefined;tooltip.hidden=true};
  const positionTooltip=()=>{
    if(!selected)return;
    const rect=selected.getBoundingClientRect(),bounds=layer.getBoundingClientRect(),radius=tooltip.offsetWidth/2;
    tooltip.style.left=Math.min(Math.max(radius+4,rect.left+rect.width/2-bounds.left),bounds.width-radius-4)+'px';
    tooltip.style.top=Math.max(tooltip.offsetHeight+3,rect.top-bounds.top-4)+'px';
  };
  const showTooltip=(event:Event)=>{
    selected=event.currentTarget as HTMLAnchorElement;
    tooltip.textContent=selected.getAttribute('aria-label');tooltip.hidden=false;positionTooltip();
    if(event.type==='focus'&&selected.matches(':focus-visible')){
      const face=selected.getBoundingClientRect(),map=layer.getBoundingClientRect();
      if(face.right>map.right||face.left<map.left||face.top<map.top||face.bottom>map.bottom){
        panBy(map.left+(map.width-face.width)/2-face.left,map.top+(map.height-face.height)/2-face.top);
      }
    }
  };
  return {
    corner,
    setPosters(posters:readonly OrganizationPoster[],name:string){
      const root=layer.getRootNode(),focused=root instanceof ShadowRoot?root.activeElement:document.activeElement;
      const focusedLink=focused instanceof HTMLAnchorElement?focused.href:undefined;
      clearTooltip();label=name;links.forEach(link=>link.remove());list.replaceChildren();
      links=posters.map(({login,artwork,displayOnly})=>{
        const link=document.createElement('a');link.className='city-org-link';link.hidden=true;
        link.href='https://github.com/'+login;link.setAttribute('aria-label','@'+login);
        if(displayOnly){
          artwork.setAttribute('aria-hidden','true');
          artwork.style.cssText=`left:${inset}%;top:${inset}%;width:${100-2*inset}%;height:${100-2*inset}%`;
          link.append(artwork);
        }
        link.addEventListener('mouseenter',showTooltip);link.addEventListener('focus',showTooltip);
        link.addEventListener('mouseleave',clearTooltip);link.addEventListener('blur',clearTooltip);
        layer.insertBefore(link,tooltip);
        return link;
      });
      visibleCount=-1;
      return focusedLink;
    },
    position(view:LandscapeView|undefined,viewport:LandscapeViewport,restoreFocus?:string){
      const faces=view?.organizationFaces?.(viewport)??[];
      if(visibleCount!==faces.length){
        visibleCount=faces.length;list.replaceChildren();
        links.forEach((link,i)=>{
          link.hidden=i>=faces.length;
          if(link.hidden){
            const entry=document.createElement('li'),target=document.createElement('a');
            target.href=link.href;target.textContent=link.getAttribute('aria-label');
            entry.append(target);list.append(entry);
          }
        });
        const more=links.length-faces.length;
        summary.textContent=label+' +'+more;
        if(selected?.hidden)clearTooltip();
      }
      directory.hidden=links.length===faces.length||!view?.organizationFaces;
      if(directory.hidden)directory.open=false;
      faces.forEach(({left,top,size,slope},i)=>{
        Object.assign(links[i].style,{left:left+'px',top:top+'px',width:size+'px',height:size+'px',transform:`matrix(1,${slope},0,1,0,0)`});
      });
      if(restoreFocus){
        const destination=links.find(link=>!link.hidden&&link.href===restoreFocus)
          ??(directory.open?[...list.querySelectorAll('a')].find(link=>link.href===restoreFocus):undefined);
        destination?.focus({preventScroll:true});
      }
      positionTooltip();
    },
    dispose(){layer.remove();links=[]},
  };
}
