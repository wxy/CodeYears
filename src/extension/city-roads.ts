import { localize, text, type Language, type MessageKey } from './i18n';
import type { CityRoadControl } from '../renderers/landscape';
import type { GitHubPageContext } from '../platform/github/types';
import { confirmViewer, sameContext } from '../platform/github/load-year';
import { readCityJourney, rememberCityJourney, type CityStop } from './city-travel';

const MAX_ROADS=8;
interface RoadOptions {
  context():GitHubPageContext;
  currentContext():GitHubPageContext;
  language():Language;
  mapType():CityStop['map'];
  changed(controls:readonly CityRoadControl[],returnPost?:HTMLElement):void;
}

/** 只有当前已登录的城主可以编辑；旅行返程属于当前标签的访问者。 */
export function createCityRoads(host:HTMLElement,options:RoadOptions) {
  const profile=options.context().profileLogin.toLowerCase(),key=`codeyears:roads:${profile}`;
  const username=/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;
  const lifetime=new AbortController();
  let slots:(string|null)[]=[null,null,null,null],ready=false,saving=false,disposed=false,editing=false;
  let message:MessageKey|undefined,selection:{kind:'road';slot:number}|{kind:'return'}|undefined;
  let rendered:CityRoadControl[]=[],returnPost:HTMLAnchorElement|undefined;
  const owner=(context:GitHubPageContext)=>context.profileLogin.toLowerCase()===profile&&context.viewer.state==='known'&&context.viewer.identity.kind==='authenticated'&&context.viewer.identity.login.toLowerCase()===profile;
  const canEdit=()=>owner(options.currentContext());
  const t=(id:MessageKey,values:readonly(string|number)[]=[])=>text(options.language(),id,values);
  host.hidden=true;
  host.innerHTML=`<section class="roads-panel" role="dialog" aria-labelledby="road-editor-title">
    <div class="road-editor-heading"><h3 id="road-editor-title"></h3><button class="road-close" type="button" data-i18n-label="closeRoadEditor">×</button></div>
    <div class="road-destination" hidden></div><ul class="road-return-list" hidden></ul>
    <button class="road-change" type="button" data-i18n="changeRoad" hidden></button>
    <form class="roads-form" hidden><label><span data-i18n="roadUsername"></span><input name="login" type="text" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="octocat"></label><button type="submit" data-i18n="saveRoad"></button></form>
    <output class="note" role="status" aria-live="polite"></output><button class="roads-retry" type="button" data-i18n="retry" hidden></button>
    <div class="road-editor-actions"><span class="note road-count"></span><button class="road-remove" type="button" data-i18n="removeRoad" hidden></button></div>
    <p class="note roads-local"></p>
  </section>`;
  const form=host.querySelector<HTMLFormElement>('form')!,input=host.querySelector<HTMLInputElement>('input')!;
  const submit=host.querySelector<HTMLButtonElement>('button[type=submit]')!,remove=host.querySelector<HTMLButtonElement>('.road-remove')!;
  const change=host.querySelector<HTMLButtonElement>('.road-change')!,status=host.querySelector<HTMLOutputElement>('output')!;
  const retry=host.querySelector<HTMLButtonElement>('.roads-retry')!,destination=host.querySelector<HTMLElement>('.road-destination')!;
  const returns=host.querySelector<HTMLUListElement>('.road-return-list')!;
  // Shadow DOM 外的 GitHub 快捷键不能识别内部 INPUT；保留原生编辑与提交。
  for(const name of ['keydown','keypress','keyup'])input.addEventListener(name,event=>event.stopPropagation());
  const journey=()=>readCityJourney(options.currentContext());
  const close=(restoreFocus=false)=>{
    const selected=selection;selection=undefined;host.hidden=true;
    if(restoreFocus&&selected)(selected.kind==='return'?returnPost:rendered[selected.slot]?.sign)?.focus();
  };
  const makeLink=(stop:CityStop,returning=false)=>{
    const link=document.createElement('a');link.className=returning?'road-return-link':'city-road-destination';
    link.href=`https://github.com/${stop.login}#codeyears-${stop.map}`;link.textContent=t(returning?'returnToCity':'cityName',[stop.login]);link.setAttribute('data-turbo','false');
    link.onclick=event=>{
      if(event.defaultPrevented||event.button!==0)return;
      try{rememberCityJourney(options.currentContext(),options.mapType(),stop)}
      catch{event.preventDefault();message='roadTravelError';host.hidden=false;updateEditor()}
    };
    return link;
  };
  const updateEditor=()=>{
    localize(host,options.language());
    const own=canEdit(),back=selection?.kind==='return',login=selection?.kind==='road'?slots[selection.slot]:null;
    const returnRoad=!!login&&journey().some(stop=>stop.login===login);
    host.querySelector('#road-editor-title')!.textContent=login&&!editing&&!back?login:t(back?'returnRoadHeading':login?'roadsHeading':own?'addRoadHeading':'unknownRoad');
    form.hidden=!own||!editing||back;input.disabled=submit.disabled=!own||!ready||saving;
    remove.hidden=!own||!login||back;remove.disabled=saving;
    change.hidden=!own||!login||editing||back;change.disabled=saving;
    destination.hidden=!login||editing||back;destination.replaceChildren();
    if(login&&!editing&&!back)destination.append(makeLink({login,map:options.mapType()}));
    returns.hidden=!back&&!returnRoad;returns.replaceChildren();
    if(back||returnRoad)for(const stop of [...journey()].reverse()){const row=document.createElement('li');row.append(makeLink(stop,true));returns.append(row)}
    status.textContent=message?t(message):'';retry.hidden=ready||saving||!own||back;
    host.querySelector<HTMLElement>('.road-editor-actions')!.hidden=!own||back;
    host.querySelector('.road-count')!.textContent=t('roadCount',[slots.filter(Boolean).length,MAX_ROADS]);
    host.querySelector('.roads-local')!.textContent=t(back?'returnRoadLocal':own?'roadsLocal':'roadsOwnerOnly');
  };
  const open=(selected:NonNullable<typeof selection>,anchor:HTMLElement)=>{
    if(selected.kind==='return'&&!journey().length)return;
    selection=selected;editing=selected.kind==='road'&&!slots[selected.slot]&&canEdit();
    message=ready?undefined:'roadsReadError';input.value=selected.kind==='road'?slots[selected.slot]??'':'';host.hidden=false;
    updateEditor();
    const area=host.parentElement!.getBoundingClientRect(),point=anchor.getBoundingClientRect();
    const left=Math.max(8,Math.min(area.width-host.offsetWidth-8,point.left-area.left));
    const below=point.bottom-area.top+8,top=below+host.offsetHeight<=area.height-8?below:point.top-area.top-host.offsetHeight-8;
    host.style.left=`${left}px`;host.style.top=`${Math.max(8,top)}px`;
    if(!form.hidden&&ready&&!saving){input.focus();input.select()}
    else host.querySelector<HTMLButtonElement>('.road-close')!.focus();
  };
  const render=()=>{
    if(disposed)return;
    updateEditor();
    const own=canEdit(),entries=[...slots];
    const trail=journey(),previous=trail.at(-1);
    if(own&&ready&&entries.every(Boolean)&&entries.length<MAX_ROADS)entries.push(null);
    rendered=entries.map((login,slot)=>{
      const returnRoad=!!login&&trail.some(stop=>stop.login===login);
      const sign=login?makeLink({login,map:options.mapType()}):document.createElement('button');
      sign.textContent='';sign.className='city-road-sign';sign.dataset.roadSlot=String(slot);sign.dataset.destination=login??'';
      if(sign instanceof HTMLButtonElement){sign.type='button';sign.disabled=saving;sign.onclick=()=>open({kind:'road',slot},sign)}
      const label=login??(own?t('addRoadAt',[slot+1]):t('unknownRoad'));sign.title=login&&own?`${login} · ${t('roadEditHint')}`:label;sign.setAttribute('aria-label',label);
      if(returnRoad)sign.title+=` · ${t('roadReturnHint')}`;
      if(login&&(own||returnRoad))menu(sign,{kind:'road',slot});
      let surface:HTMLAnchorElement|HTMLButtonElement;
      if(login)surface=makeLink({login,map:options.mapType()});
      else{surface=document.createElement('button');surface.type='button';surface.onclick=()=>open({kind:'road',slot},sign)}
      surface.textContent='';surface.className='city-road-surface';surface.tabIndex=-1;surface.setAttribute('aria-hidden','true');surface.title=label;
      return {sign,surface,label:login??''};
    });
    returnPost=undefined;
    if(previous&&!slots.includes(previous.login)){
      returnPost=makeLink(trail.at(-1)!,true);returnPost.textContent='';returnPost.className='city-road-sign city-return-post';returnPost.title=`${t('returnToCity',[trail.at(-1)!.login])} · ${t('roadReturnHint')}`;returnPost.setAttribute('aria-label',t('returnToCity',[trail.at(-1)!.login]));
      returnPost.dataset.cityLabel=trail.at(-1)!.login;menu(returnPost,{kind:'return'});
    }
    options.changed(rendered,returnPost);
  };
  const menu=(anchor:HTMLElement,selected:NonNullable<typeof selection>)=>{
    anchor.oncontextmenu=event=>{event.preventDefault();open(selected,anchor)};
    anchor.onkeydown=event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();event.stopPropagation();open(selected,anchor)}};
  };
  const readSlots=(value:unknown):(string|null)[]=>{
    if(value===undefined)return [null,null,null,null];
    if(!Array.isArray(value)||value.length<4||value.length>MAX_ROADS||value.some(login=>login!==null&&(typeof login!=='string'||!username.test(login))))throw new Error('Invalid roads');
    const next=value.map(login=>typeof login==='string'?login.toLowerCase():null),logins=next.filter(login=>login!==null);
    if(logins.includes(profile)||new Set(logins).size!==logins.length)throw new Error('Invalid roads');
    return next;
  };
  async function load(){
    saving=true;message=undefined;render();
    try{const stored=await chrome.storage.local.get(key);if(disposed)return;slots=readSlots(stored[key]);ready=true}
    catch{message='roadsReadError';ready=false}
    finally{saving=false;render()}
  }
  async function save(next:(string|null)[]){
    const before=options.currentContext();
    if(!owner(before)){message='roadsOwnerOnly';render();return}
    saving=true;message=undefined;render();
    try{
      await confirmViewer(before,lifetime.signal);lifetime.signal.throwIfAborted();
      if(!sameContext(before,options.currentContext()))throw new Error('Changed visitor');
      await chrome.storage.local.set({[key]:next});if(disposed)return;slots=next;close();
    }catch{if(!disposed)message='roadOwnerCheckFailed'}
    finally{saving=false;render()}
  }
  form.onsubmit=event=>{
    event.preventDefault();if(!ready||saving||selection?.kind!=='road'||!canEdit())return;
    const slot=selection.slot,login=input.value.trim().replace(/^@/,'').toLowerCase();
    message=!username.test(login)?'roadInvalidUsername':login===profile?'roadSelf':slots.some((target,index)=>index!==slot&&target===login)?'roadDuplicate':undefined;
    if(message){updateEditor();return}
    const next=[...slots];next[slot]=login;void save(next);
  };
  remove.onclick=()=>{
    if(selection?.kind!=='road'||saving||!canEdit())return;
    const next=[...slots];next[selection.slot]=null;void save(next);
  };
  change.onclick=()=>{if(canEdit()){editing=true;updateEditor();input.focus();input.select()}};
  const storageChanged=(changes:Record<string,chrome.storage.StorageChange>,area:string)=>{
    if(area==='local'&&changes[key])void load();
  };
  const outside=(event:PointerEvent)=>{if(!event.composedPath().includes(host))close()};
  const escape=(event:KeyboardEvent)=>{
    if(event.key!=='Escape'||event.isComposing||host.hidden)return;
    event.preventDefault();event.stopPropagation();close(true);
  };
  const wheel=(event:WheelEvent)=>{if(!event.composedPath().includes(host))close()};
  const resize=()=>close();
  host.querySelector<HTMLButtonElement>('.road-close')!.onclick=()=>close(true);retry.onclick=()=>{void load()};
  chrome.storage.onChanged.addListener(storageChanged);document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);
  host.parentElement!.addEventListener('wheel',wheel,{passive:true});window.addEventListener('resize',resize);
  void load();
  return {
    controls:()=>rendered,
    returnPost:()=>returnPost,
    refresh:render,
    close,
    dispose(){disposed=true;lifetime.abort();chrome.storage.onChanged.removeListener(storageChanged);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);host.parentElement!.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize);host.replaceChildren()},
  };
}
