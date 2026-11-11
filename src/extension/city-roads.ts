import { localize, text, type Language, type MessageKey } from './i18n';
import type { CityRoadControl } from '../renderers/landscape';

const MAX_ROADS=8;

/** 路牌直接管理本机目的地；前四个出口和已保存槽位保持稳定。 */
export function createCityRoads(host: HTMLElement, profileLogin: string, language: () => Language, mapType: () => 'city' | 'town', changed: (controls: readonly CityRoadControl[]) => void) {
  const profile=profileLogin.toLowerCase(),key=`codeyears:roads:${profile}`;
  const username=/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;
  let slots:(string|null)[]=[null,null,null,null],ready=false,saving=false,disposed=false;
  let message:MessageKey|undefined,activeSlot:number|undefined;
  let rendered:CityRoadControl[]=[];
  host.hidden=true;
  host.innerHTML=`<section class="roads-panel" role="dialog" aria-labelledby="road-editor-title">
    <div class="road-editor-heading"><h3 id="road-editor-title" data-i18n="roadsHeading"></h3><button class="road-close" type="button" data-i18n-label="closeRoadEditor">×</button></div>
    <form class="roads-form"><label><span data-i18n="roadUsername"></span><input name="login" type="text" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="octocat"></label><button type="submit" data-i18n="saveRoad"></button></form>
    <output class="note" role="status" aria-live="polite"></output><button class="roads-retry" type="button" data-i18n="retry" hidden></button>
    <div class="road-editor-actions"><span class="note road-count"></span><button class="road-remove" type="button" data-i18n="removeRoad" hidden></button></div>
    <p class="note roads-local" data-i18n="roadsLocal"></p>
  </section>`;
  const form=host.querySelector<HTMLFormElement>('form')!,input=host.querySelector<HTMLInputElement>('input')!;
  const submit=host.querySelector<HTMLButtonElement>('button[type=submit]')!,remove=host.querySelector<HTMLButtonElement>('.road-remove')!;
  const status=host.querySelector<HTMLOutputElement>('output')!,retry=host.querySelector<HTMLButtonElement>('.roads-retry')!;
  // GitHub 的页面快捷键看到的是 Shadow DOM 外层，不能识别这里的 INPUT。
  // 只隔离输入框事件，保留浏览器原生输入、编辑、粘贴和表单提交。
  for(const name of ['keydown','keypress','keyup'])input.addEventListener(name,event=>event.stopPropagation());
  const t=(id:MessageKey,values:readonly(string|number)[]=[])=>text(language(),id,values);
  const close=(restoreFocus=false)=>{
    const slot=activeSlot;activeSlot=undefined;host.hidden=true;
    if(restoreFocus&&slot!==undefined)rendered[slot]?.sign.querySelector<HTMLElement>('button')?.focus();
  };
  const open=(slot:number,anchor:HTMLElement)=>{
    activeSlot=slot;message=ready?undefined:'roadsReadError';input.value=slots[slot]??'';host.hidden=false;
    updateEditor();
    const area=host.parentElement!.getBoundingClientRect(),point=anchor.getBoundingClientRect();
    const left=Math.max(8,Math.min(area.width-host.offsetWidth-8,point.left-area.left));
    const below=point.bottom-area.top+8,top=below+host.offsetHeight<=area.height-8?below:point.top-area.top-host.offsetHeight-8;
    host.style.left=`${left}px`;host.style.top=`${Math.max(8,top)}px`;
    if(ready&&!saving){input.focus();input.select()}else retry.focus();
  };
  const updateEditor=()=>{
    localize(host,language());input.disabled=submit.disabled=!ready||saving;
    remove.hidden=activeSlot===undefined||!slots[activeSlot];remove.disabled=saving;
    status.textContent=message?t(message):'';retry.hidden=ready||saving;
    host.querySelector('.road-count')!.textContent=t('roadCount',[slots.filter(Boolean).length,MAX_ROADS]);
  };
  const render=()=>{
    if(disposed)return;
    updateEditor();
    const entries=[...slots];
    // 已有出口全部指定后提供一个可添加的分岔出口，最多八条。
    if(ready&&entries.every(Boolean)&&entries.length<MAX_ROADS)entries.push(null);
    rendered=entries.map((login,slot)=>{
      const sign=document.createElement('span');sign.className='city-road-sign';sign.dataset.roadSlot=String(slot);
      const edit=document.createElement('button');edit.type='button';edit.disabled=saving;
      let surface:HTMLAnchorElement|undefined;
      if(login){
        const link=document.createElement('a');link.className='city-road-link city-road-destination';link.href=`https://github.com/${login}#codeyears-${mapType()}`;link.textContent=t('roadTo',[login]);link.setAttribute('data-turbo','false');
        surface=link.cloneNode(false) as HTMLAnchorElement;surface.className='city-road-link city-road-surface';surface.tabIndex=-1;surface.setAttribute('aria-hidden','true');surface.title=t('roadTo',[login]);
        edit.className='road-edit';edit.textContent='⋯';edit.setAttribute('aria-label',t('editRoadTo',[login]));sign.append(link,edit);
      }else{
        edit.className='road-add';edit.textContent=t('addRoadSign');edit.setAttribute('aria-label',t('addRoadAt',[slot+1]));sign.append(edit);
      }
      edit.onclick=()=>open(slot,edit);
      return {sign,surface};
    });
    changed(rendered);
  };
  // 沿用四槽设置；只在外部存储边界校验，内部使用四至八个可信槽位。
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
    saving=true;message=undefined;render();
    try{await chrome.storage.local.set({[key]:next});if(disposed)return;slots=next;close()}
    catch{message='roadsSaveError'}
    finally{saving=false;render()}
  }
  form.onsubmit=event=>{
    event.preventDefault();if(!ready||saving||activeSlot===undefined)return;
    const login=input.value.trim().replace(/^@/,'').toLowerCase();
    message=!username.test(login)?'roadInvalidUsername':login===profile?'roadSelf':slots.some((target,slot)=>slot!==activeSlot&&target===login)?'roadDuplicate':undefined;
    if(message){updateEditor();return}
    const next=[...slots];next[activeSlot]=login;void save(next);
  };
  remove.onclick=()=>{
    if(activeSlot===undefined||saving)return;
    const next=[...slots];next[activeSlot]=null;void save(next);
  };
  const storageChanged=(changes:Record<string,chrome.storage.StorageChange>,area:string)=>{
    if(area!=='local'||!changes[key])return;
    try{slots=readSlots(changes[key].newValue);ready=true;message=undefined}
    catch{ready=false;message='roadsReadError'}
    render();
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
    refresh:render,
    close,
    dispose(){disposed=true;chrome.storage.onChanged.removeListener(storageChanged);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);host.parentElement!.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize);host.replaceChildren()},
  };
}
