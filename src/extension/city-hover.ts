import type { DailyContribution } from '../data/types';
import { confirmViewer, ensureCurrent, ViewerChangedError } from '../platform/github/load-year';
import { fetchProjectActivities, type ProjectActivity, type DayActivities } from '../platform/github/project-details';
import { isProfileOwner, type GitHubPageContext } from '../platform/github/types';
import type { Language } from './language';

/** 只合并真正连续的成员日，跨周地块保留中间的空档。 */
function describeDates(days:readonly DailyContribution[],language:Language):string {
  const dates=days.map(day=>day.date).sort();
  const format=new Intl.DateTimeFormat(language,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'});
  const ranges:string[]=[];
  let first=dates[0],previous=first;
  for(const next of dates.slice(1)){
    if(Date.parse(next)-Date.parse(previous)!==86400000){
      ranges.push(format.formatRange(new Date(first),new Date(previous)));
      first=next;
    }
    previous=next;
  }
  ranges.push(format.formatRange(new Date(first),new Date(previous)));
  return ranges.join(language==='zh-CN'?'、':', ');
}

function describeProjects(activities:readonly ProjectActivity[],language:Language,partial:boolean):{repository:string;text:string}[] {
  const zh=language==='zh-CN',groups=new Map<string,ProjectActivity[]>();
  for(const activity of activities){const key=activity.repository.toLowerCase(),list=groups.get(key)??[];if(!list.some(a=>a.kind===activity.kind&&a.url===activity.url&&a.date===activity.date))list.push(activity);groups.set(key,list)}
  return [...groups.values()].map(items=>{
    const days=new Set(items.map(a=>a.date)).size,commits=items.reduce((sum,a)=>sum+(a.commits??0),0);
    const prs=new Set(items.filter(a=>a.kind==='pull-request').map(a=>a.url)).size;
    const reviews=new Set(items.filter(a=>a.kind==='review').map(a=>a.url)).size;
    const issues=new Set(items.filter(a=>a.kind==='issue').map(a=>a.url)).size;
    const kind=(value:ProjectActivity['kind'])=>items.some(a=>a.kind===value);
    const amount=(value:number,incomplete=partial)=>`${incomplete?'≥':''}${value.toLocaleString(zh?'zh-CN':'en-US')}`;
    const metrics=[kind('commits')?(commits?`${amount(commits,partial||items.some(a=>a.kind==='commits'&&a.commits===undefined))}${zh?' 次提交':commits===1?' commit':' commits'}`:(zh?'提交代码（数量未列出）':'Code commits (count unavailable)')):'',
      prs?`${amount(prs)}${zh?' 个 PR':prs===1?' PR':' PRs'}`:'',reviews?(zh?`评审 ${amount(reviews)} 个 PR`:`Reviewed ${amount(reviews)} ${reviews===1?'PR':'PRs'}`):'',issues?`${amount(issues)}${zh?' 个 Issue':issues===1?' issue':' issues'}`:''].filter(Boolean);
    return {repository:items[0].repository,text:metrics.join(' · '),days,commits,links:items.length};
  }).sort((a,b)=>b.days-a.days||b.commits-a.commits||b.links-a.links||a.repository.localeCompare(b.repository));
}

export function createCityHover(host:HTMLElement,options:{
  pick(x:number,y:number):readonly DailyContribution[]|undefined;
  step(backward:boolean):{x:number;y:number}|undefined;
  context():GitHubPageContext;
  currentContext():GitHubPageContext;
  language():Language;
  highlight(point?:{x:number;y:number}):void;
  invalidate(changed:boolean):void;
}) {
  const card=document.createElement('aside');card.className='building-hover';card.id='building-hover';card.hidden=true;card.setAttribute('role','tooltip');
  host.parentElement!.append(card);
  const cache=new Map<string,{details:DayActivities;expires:number}>();
  let cacheScope='',key='',timer=0,closeTimer=0,request:AbortController|undefined,anchor={x:0,y:0},reveal:Animation|undefined;
  const syncCache=(context:GitHubPageContext)=>{
    const scope=`${isProfileOwner(context)?'owner':'public'}:${context.profileLogin.toLowerCase()}`;
    if(cacheScope!==scope){cache.clear();cacheScope=scope}
    for(const [date,entry]of cache)if(entry.expires<=Date.now())cache.delete(date);
  };
  const confirm=async(context:GitHubPageContext,signal:AbortSignal)=>{
    ensureCurrent(context,signal,options.currentContext);
    if(isProfileOwner(context)){await confirmViewer(context,signal);ensureCurrent(context,signal,options.currentContext)}
  };
  const dismiss=(immediate:boolean)=>{
    clearTimeout(timer);timer=0;clearTimeout(closeTimer);request?.abort();request=undefined;key='';reveal?.cancel();reveal=undefined;
    options.highlight();card.removeAttribute('data-open');host.removeAttribute('aria-describedby');
    const finish=()=>{closeTimer=0;card.hidden=true;card.replaceChildren();card.style.left=card.style.right=card.style.top=card.style.bottom=''};
    if(immediate||card.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
    else closeTimer=window.setTimeout(finish,100);
  };
  const hide=()=>dismiss(true),leave=()=>dismiss(false);
  const render=(days:readonly DailyContribution[],details:DayActivities,pending:boolean,partial=false)=>{
    const before=card.hidden?undefined:card.getBoundingClientRect();reveal?.cancel();reveal=undefined;
    const language=options.language(),zh=language==='zh-CN';
    const total=days.reduce((sum,day)=>sum+day.count,0);
    const heading=document.createElement('strong'),timing=document.createElement('div');
    heading.textContent=zh?`${days.length} 个活跃日，共 ${total.toLocaleString(language)} 次贡献`:
      `${days.length} active ${days.length===1?'day':'days'} · ${total.toLocaleString(language)} ${total===1?'contribution':'contributions'}`;
    timing.className='building-hover-time';timing.textContent=describeDates(days,language);
    card.replaceChildren(heading,timing);
    const projects=describeProjects(details.projects,language,partial);
    if(details.joinedGitHub){const milestone=document.createElement('p');milestone.className='building-hover-milestone';milestone.textContent=zh?'加入 GitHub · 开发旅程的起点':'Joined GitHub · The beginning of the journey';card.append(milestone)}
    for(const project of projects.slice(0,2)){
      const row=document.createElement('p'),name=document.createElement('strong');name.textContent=project.repository;row.append(name,document.createElement('br'),document.createTextNode(project.text));card.append(row);
    }
    if(projects.length>2){const more=document.createElement('p');more.className='building-hover-note';more.textContent=zh?`另有 ${projects.length-2} 个项目`:`${projects.length-2} other projects`;card.append(more)}
    if(!projects.length&&!details.joinedGitHub){
      const note=document.createElement('p');note.className='building-hover-note';note.textContent=pending?(zh?'正在补充相关项目…':'Finding related projects…'):(zh?'暂未取得相关项目。':'Related projects are not available yet.');card.append(note);
    }
    clearTimeout(closeTimer);closeTimer=0;card.hidden=false;host.setAttribute('aria-describedby',card.id);
    if(!before){
      const parent=host.parentElement!.getBoundingClientRect(),point=host.getBoundingClientRect();
      const x=anchor.x+point.left-parent.left,y=anchor.y+point.top-parent.top;
      const maxW=Math.min(340,parent.width-16),maxH=Math.min(240,parent.height-16);
      const toLeft=x+16+maxW>parent.width-8&&x>parent.width/2,toUp=y+16+maxH>parent.height-8&&y>parent.height/2;
      card.style[toLeft?'right':'left']=`${Math.max(8,Math.min(toLeft?parent.width-x+16:x+16,parent.width-maxW-8))}px`;
      card.style[toUp?'bottom':'top']=`${Math.max(8,Math.min(toUp?parent.height-y+16:y+16,parent.height-maxH-8))}px`;
      card.style.maxHeight=`${maxH}px`;
    }
    const after=card.getBoundingClientRect();card.setAttribute('data-open','');
    if((!before||before.width!==after.width||before.height!==after.height)&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const dx=Math.max(0,after.width-(before?.width??4)),dy=Math.max(0,after.height-(before?.height??4));
      const inset=[card.style.bottom?dy:0,card.style.right?0:dx,card.style.bottom?0:dy,card.style.right?dx:0].map(value=>`${value}px`).join(' ');
      // 锚点与文字不平移，只揭开新增区域；一次测量后由浏览器执行短动画。
      reveal=card.animate([{clipPath:`inset(${inset} round 10px)`},{clipPath:'inset(0px 0px 0px 0px round 10px)'}],{duration:160,easing:'cubic-bezier(.23,1,.32,1)'});
    }
  };
  async function show(days:readonly DailyContribution[],target:string){
    const context=options.context();syncCache(context);
    const dates=days.map(d=>d.date),missing=dates.filter(date=>!cache.has(date));
    const controller=new AbortController();request=controller;const signal=controller.signal;
    const loaded=new Map<string,DayActivities>(),failures:string[]=[];let cursor=0,published=0,complete=false,publishing:Promise<void>|undefined;
    const collect=():DayActivities=>{
      const projects:ProjectActivity[]=[];let joinedGitHub=false;
      for(const date of dates){const details=loaded.get(date)??cache.get(date)?.details;if(details){projects.push(...details.projects);joinedGitHub||=details.joinedGitHub}}
      return {projects,joinedGitHub};
    };
    const partial=()=>dates.some(date=>!loaded.has(date)&&!cache.has(date));
    const publish=()=>publishing??=(async()=>{
      await confirm(context,signal);if(signal.aborted||key!==target)return;
      for(const [date,details]of loaded)cache.set(date,{details,expires:Date.now()+5*60000});
      published=loaded.size;render(days,collect(),!complete,partial());
    })().finally(()=>{publishing=undefined});
    try{
      await confirm(context,signal);if(signal.aborted||key!==target)return;
      if(!missing.length){render(days,collect(),false);return}
      render(days,collect(),true,true);
      await Promise.all(Array.from({length:Math.min(2,missing.length)},async()=>{
        while(cursor<missing.length){
          const date=missing[cursor++];signal.throwIfAborted();let details:DayActivities;
          try{details=await fetchProjectActivities(context,date,signal)}
          catch(error){signal.throwIfAborted();failures.push(error instanceof Error?error.message:'未知请求错误');return}
          loaded.set(date,details);await publish();
        }
      }));
      complete=true;if(loaded.size>published)await publish();
      if(!signal.aborted&&key===target){
        const details=collect();
        if(failures.length&&!details.projects.length&&!details.joinedGitHub)console.warn(`[CodeYears] 建筑项目详情：${[...new Set(failures)].join('；')}（成员日 ${dates.length}，已请求 ${cursor}，解析成功 ${loaded.size}）。`);
        render(days,details,false,partial());
      }
    }catch(error){if(!signal.aborted){cache.clear();hide();options.invalidate(error instanceof ViewerChangedError)}}
  }
  const select=(x:number,y:number,immediate:boolean)=>{
    const days=options.pick(x,y),next=days?.length?days.map(d=>d.date).join('|'):'';
    if(next===key)return;
    hide();if(!next||!days)return;
    key=next;anchor={x,y};options.highlight(anchor);
    if(immediate)void show(days,next);
    else timer=window.setTimeout(()=>{timer=0;void show(days,next)},300);
  };
  let touch:{id:number;x:number;y:number}|undefined;
  const down=(event:PointerEvent)=>{
    hide();touch=undefined;
    if(event.pointerType==='touch'&&event.isPrimary&&!(event.target instanceof Element&&event.target.closest('a,button,.city-organization-layer'))){
      touch={id:event.pointerId,x:event.clientX,y:event.clientY};
    }
  };
  const move=(event:PointerEvent)=>{
    if(event.pointerType==='touch'){
      if(touch?.id===event.pointerId&&Math.hypot(event.clientX-touch.x,event.clientY-touch.y)>6)touch=undefined;
      return;
    }
    if(event.buttons || event.target instanceof Element && event.target.closest('.city-organization-layer')){hide();return}
    const rect=host.getBoundingClientRect();
    card.removeAttribute('aria-live');select(event.clientX-rect.left,event.clientY-rect.top,false);
  };
  const up=(event:PointerEvent)=>{
    if(touch?.id!==event.pointerId)return;
    touch=undefined;const rect=host.getBoundingClientRect();
    card.removeAttribute('aria-live');select(event.clientX-rect.left,event.clientY-rect.top,true);
  };
  const cancelTouch=()=>{touch=undefined};
  const exit=(event:PointerEvent)=>{if(event.pointerType!=='touch')leave()};
  const keydown=(event:KeyboardEvent)=>{
    if(event.target!==host||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key==='Enter'){
      const point=options.step(event.shiftKey);
      if(!point)return;
      event.preventDefault();event.stopPropagation();card.setAttribute('aria-live','polite');select(point.x,point.y,true);
    }else if(event.key==='Escape'&&key){
      event.preventDefault();event.stopPropagation();hide();
    }else hide();
  };
  const outside=(event:PointerEvent)=>{if(key&&!event.composedPath().includes(host))hide()};
  const visibility=()=>{if(document.hidden)hide()};
  const resize=new ResizeObserver(hide);resize.observe(host);
  const listeners=new AbortController(),{signal}=listeners;
  host.addEventListener('pointermove',move,{signal});host.addEventListener('pointerleave',exit,{signal});
  host.addEventListener('pointerdown',down,{signal});host.addEventListener('pointerup',up,{signal});host.addEventListener('pointercancel',cancelTouch,{signal});
  host.addEventListener('wheel',hide,{passive:true,signal});host.addEventListener('keydown',keydown,{signal});host.addEventListener('blur',hide,{signal});
  document.addEventListener('pointerdown',outside,{signal});document.addEventListener('visibilitychange',visibility,{signal});
  return {hide,async inspectDay(date:string,signal:AbortSignal):Promise<DayActivities|undefined>{
    const context=options.context();syncCache(context);await confirm(context,signal);
    const cached=cache.get(date);if(cached)return cached.details;
    let details:DayActivities;
    try{details=await fetchProjectActivities(context,date,signal)}
    catch(error){signal.throwIfAborted();console.warn('[CodeYears] 注册里程碑读取未完成：'+(error instanceof Error?error.message:'未知请求错误'));return}
    await confirm(context,signal);cache.set(date,{details,expires:Date.now()+5*60000});return details;
  },clear(){hide();cache.clear()},dispose(){listeners.abort();hide();cache.clear();resize.disconnect();card.remove()}};
}
