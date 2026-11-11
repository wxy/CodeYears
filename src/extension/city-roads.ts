import { localize, text, type Language, type MessageKey } from './i18n';

/** 本机的四向出口设置，按出发主页区分；不代表对方认可或公开发布的关系。 */
export function createCityRoads(host: HTMLElement, profileLogin: string, language: () => Language, mapType: () => 'city' | 'town', changed: (links: readonly ({href:string;label:string}|null)[]) => void) {
  const profile=profileLogin.toLowerCase(),key=`codeyears:roads:${profile}`;
  const username=/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;
  let slots:(string|null)[]=[null,null,null,null],ready=false,saving=false,disposed=false;
  let message:MessageKey|undefined;
  host.innerHTML=`<details id="roads-menu"><summary data-i18n="roadsLabel"></summary><section class="roads-panel">
    <h3 data-i18n="roadsHeading"></h3><p class="note" data-i18n="roadsHelp"></p>
    <ul class="roads-list"></ul>
    <form class="roads-form"><label><span data-i18n="roadUsername"></span><input name="login" type="text" maxlength="40" autocomplete="off" autocapitalize="none" spellcheck="false" required placeholder="octocat"></label><button type="submit" data-i18n="addRoad"></button></form>
    <output class="note" role="status" aria-live="polite"></output><button class="roads-retry" type="button" data-i18n="retry" hidden></button>
    <p class="note roads-local" data-i18n="roadsLocal"></p>
  </section></details>`;
  const menu=host.querySelector<HTMLDetailsElement>('details')!,form=host.querySelector<HTMLFormElement>('form')!;
  const input=host.querySelector<HTMLInputElement>('input')!,add=host.querySelector<HTMLButtonElement>('button[type=submit]')!;
  const list=host.querySelector<HTMLUListElement>('ul')!,status=host.querySelector<HTMLOutputElement>('output')!,retry=host.querySelector<HTMLButtonElement>('.roads-retry')!;
  const t=(id:MessageKey,values:readonly(string|number)[]=[])=>text(language(),id,values);
  const links=()=>slots.map(login=>login?{href:`https://github.com/${login}#codeyears-${mapType()}`,label:t('roadTo',[login])}:null);
  const render=()=>{
    if(disposed)return;
    localize(host,language());list.replaceChildren();
    slots.forEach((login,slot)=>{
      if(!login)return;
      const row=document.createElement('li'),link=document.createElement('a'),remove=document.createElement('button');
      link.href=links()[slot]!.href;link.textContent=t('roadTo',[login]);link.setAttribute('data-turbo','false');
      remove.type='button';remove.textContent=t('removeRoad');remove.setAttribute('aria-label',t('removeRoadTo',[login]));remove.disabled=!ready||saving;
      remove.onclick=()=>{const next=[...slots];next[slot]=null;void save(next)};
      row.append(link,remove);list.append(row);
    });
    input.disabled=add.disabled=!ready||saving||slots.every(Boolean);
    status.textContent=message?t(message):ready&&slots.every(Boolean)?t('roadsFull'):'';
    retry.hidden=ready||saving;
    changed(links());
  };
  // 存储是外部输入；在进入本组件时校验，后续只流转四个可信出口。
  const readSlots=(value:unknown):(string|null)[]=>{
    if(value===undefined)return [null,null,null,null];
    if(!Array.isArray(value)||value.length!==4||value.some(login=>login!==null&&(typeof login!=='string'||!username.test(login))))throw new Error('Invalid roads');
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
    try{await chrome.storage.local.set({[key]:next});if(disposed)return;slots=next;input.value=''}
    catch{message='roadsSaveError'}
    finally{saving=false;render()}
  }
  form.onsubmit=event=>{
    event.preventDefault();if(!ready||saving)return;
    const login=input.value.trim().replace(/^@/,'').toLowerCase();
    message=!username.test(login)?'roadInvalidUsername':login===profile?'roadSelf':slots.includes(login)?'roadDuplicate':undefined;
    if(message){render();return}
    const slot=slots.indexOf(null);if(slot<0)return;
    const next=[...slots];next[slot]=login;void save(next);
  };
  const storageChanged=(changes:Record<string,chrome.storage.StorageChange>,area:string)=>{
    if(area!=='local'||!changes[key])return;
    try{slots=readSlots(changes[key].newValue);ready=true;message=undefined}
    catch{ready=false;message='roadsReadError'}
    render();
  };
  const outside=(event:PointerEvent)=>{if(!event.composedPath().includes(menu))menu.open=false};
  const escape=(event:KeyboardEvent)=>{
    if(event.key!=='Escape'||!menu.open)return;
    event.preventDefault();event.stopPropagation();menu.open=false;menu.querySelector('summary')!.focus();
  };
  retry.onclick=()=>{void load()};
  chrome.storage.onChanged.addListener(storageChanged);document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape,true);
  void load();
  return {
    links,
    refresh:render,
    close(){menu.open=false},
    dispose(){disposed=true;chrome.storage.onChanged.removeListener(storageChanged);document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape,true);host.replaceChildren()},
  };
}
