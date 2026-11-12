import type { DailyContribution } from '../data/types';
import { confirmViewer, sameContext } from '../platform/github/load-year';
import { fetchProjectActivities, type ProjectActivity, type DayActivities } from '../platform/github/project-details';
import type { GitHubPageContext } from '../platform/github/types';
import type { Language } from './language';

/** 只标记建筑的真实成员日；其余日期不代表零贡献。 */
function memberCalendar(days:readonly DailyContribution[],language:Language):HTMLElement {
  const zh=language==='zh-CN',locale=zh?'zh-CN':'en-US',months=new Map<string,Map<string,number>>();
  for(const day of days){const month=day.date.slice(0,7),members=months.get(month)??new Map<string,number>();members.set(day.date,day.count);months.set(month,members)}
  const calendar=document.createElement('div');calendar.className='building-hover-calendar';
  for(const [month,members]of [...months].sort(([a],[b])=>a.localeCompare(b))){
    const [year,number]=month.split('-').map(Number),first=new Date(Date.UTC(year,number-1,1));
    const table=document.createElement('table'),caption=document.createElement('caption');
    caption.textContent=new Intl.DateTimeFormat(locale,{year:'numeric',month:'long',timeZone:'UTC'}).format(first);table.append(caption);
    const head=document.createElement('thead'),headRow=document.createElement('tr');
    const labels=zh?['一','二','三','四','五','六','日']:['M','T','W','T','F','S','S'];
    for(let weekday=0;weekday<7;weekday++){
      const th=document.createElement('th');th.scope='col';th.textContent=labels[weekday];
      th.setAttribute('aria-label',new Intl.DateTimeFormat(locale,{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(2024,0,1+weekday))));headRow.append(th);
    }
    head.append(headRow);table.append(head);
    const body=document.createElement('tbody'),offset=(first.getUTCDay()+6)%7,last=new Date(Date.UTC(year,number,0)).getUTCDate();
    for(let cell=0;cell<Math.ceil((offset+last)/7)*7;cell++){
      if(cell%7===0)body.append(document.createElement('tr'));
      const td=document.createElement('td'),day=cell-offset+1;
      if(day>=1&&day<=last){
        const date=`${month}-${String(day).padStart(2,'0')}`,count=members.get(date);td.textContent=String(day);
        const description=count===undefined?(zh?`${date}，不属于此建筑`:`${date}, not part of this building`):(zh?`${date}，${count.toLocaleString(locale)} 次贡献，属于此建筑`:`${date}, ${count.toLocaleString(locale)} contributions, part of this building`);
        td.title=description;td.setAttribute('aria-label',description);if(count!==undefined)td.className='building-hover-member';
      }
      body.lastElementChild!.append(td);
    }
    table.append(body);calendar.append(table);
  }
  return calendar;
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
  context():GitHubPageContext;
  currentContext():GitHubPageContext;
  language():Language;
  highlight(point?:{x:number;y:number}):void;
  invalidate():void;
}) {
  const card=document.createElement('aside');card.className='building-hover';card.id='building-hover';card.hidden=true;card.setAttribute('role','tooltip');card.tabIndex=0;
  host.parentElement!.append(card);
  const cache=new Map<string,{details:DayActivities;expires:number}>();
  let cacheScope='',key='',timer=0,closeTimer=0,request:AbortController|undefined,anchor={x:0,y:0},reveal:Animation|undefined;
  const syncCache=(context:GitHubPageContext)=>{
    const identity=context.viewer.state==='unknown'?'public':context.viewer.identity.kind==='signed-out'?'signed-out':`user:${context.viewer.identity.login.toLowerCase()}`;
    const scope=`${identity}:${context.profileLogin.toLowerCase()}`;
    if(cacheScope!==scope){cache.clear();cacheScope=scope}
    for(const [date,entry]of cache)if(entry.expires<=Date.now())cache.delete(date);
  };
  const confirm=async(context:GitHubPageContext,signal:AbortSignal)=>{
    if(context.viewer.state==='known')await confirmViewer(context,signal);
    signal.throwIfAborted();
    if(!sameContext(context,options.currentContext()))throw new Error('GitHub session changed');
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
    const before=card.hidden?undefined:card.getBoundingClientRect(),scrollTop=card.scrollTop;reveal?.cancel();reveal=undefined;
    const language=options.language(),zh=language==='zh-CN';
    card.replaceChildren();const heading=document.createElement('div');heading.className='building-hover-time';
    const total=days.reduce((sum,day)=>sum+day.count,0),activeDays=days.filter(day=>day.count>0).length,locale=zh?'zh-CN':'en-US';
    const mean=activeDays?total/activeDays:0,average=mean.toLocaleString(locale,{maximumFractionDigits:1});
    heading.textContent=zh?`累计 ${total.toLocaleString(locale)} 次贡献 · 活跃日均 ${average} 次`:`${total.toLocaleString(locale)} total contributions · ${average} per active day`;
    const legend=document.createElement('p');legend.className='building-hover-note';legend.textContent=zh?'标记日期属于此建筑':'Marked dates belong to this building';
    card.setAttribute('aria-label',zh?'建筑贡献日期与活动':'Building contribution dates and activity');card.append(heading,legend,memberCalendar(days,language));
    const projects=describeProjects(details.projects,language,partial);
    if(details.joinedGitHub){const milestone=document.createElement('p');milestone.className='building-hover-milestone';milestone.textContent=zh?'加入 GitHub · 开发旅程的起点':'Joined GitHub · The beginning of the journey';card.append(milestone)}
    for(const project of projects.slice(0,2)){
      const row=document.createElement('p'),name=document.createElement('strong');name.textContent=project.repository;row.append(name,document.createElement('br'),document.createTextNode(project.text));card.append(row);
    }
    if(projects.length>2){const more=document.createElement('p');more.className='building-hover-note';more.textContent=zh?`另有 ${projects.length-2} 个项目`:`${projects.length-2} other projects`;card.append(more)}
    if(!projects.length&&!details.joinedGitHub){
      const mean=days.reduce((sum,d)=>sum+d.count,0)/days.length,row=document.createElement('p');
      row.textContent=zh?(mean>=20?'这一时段贡献较集中。':mean>=6?'这一时段贡献较活跃。':'这一时段有一些贡献活动。'):(mean>=20?'Concentrated contribution activity.':mean>=6?'An active period of contributions.':'Some contribution activity during this period.');card.append(row);
      const note=document.createElement('p');note.className='building-hover-note';note.textContent=pending?(zh?'正在补充相关项目…':'Finding related projects…'):(zh?'暂未取得相关项目。':'Related projects are not available yet.');card.append(note);
    }
    clearTimeout(closeTimer);closeTimer=0;card.hidden=false;host.setAttribute('aria-describedby',card.id);
    if(!before){
      const parent=host.parentElement!.getBoundingClientRect(),point=host.getBoundingClientRect();
      const x=anchor.x+point.left-parent.left,y=anchor.y+point.top-parent.top;
      const maxW=Math.min(420,parent.width-16),maxH=Math.min(440,parent.height-16);
      const toLeft=x+16+maxW>parent.width-8&&x>parent.width/2,toUp=y+16+maxH>parent.height-8&&y>parent.height/2;
      card.style[toLeft?'right':'left']=`${Math.max(8,Math.min(toLeft?parent.width-x+16:x+16,parent.width-maxW-8))}px`;
      card.style[toUp?'bottom':'top']=`${Math.max(8,Math.min(toUp?parent.height-y+16:y+16,parent.height-maxH-8))}px`;
      card.style.maxHeight=`${maxH}px`;
    }
    card.scrollTop=scrollTop;const after=card.getBoundingClientRect();card.setAttribute('data-open','');
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
    if(missing.length)render(days,{projects:[],joinedGitHub:false},true,true);
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
      const previous=collect();if(previous.projects.length||previous.joinedGitHub)render(days,previous,true,true);
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
    }catch{if(!signal.aborted){cache.clear();hide();options.invalidate()}}
  }
  const move=(event:PointerEvent)=>{
    if(event.buttons||event.pointerType==='touch'){hide();return}
    const rect=host.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,days=options.pick(x,y);
    const next=days?.length?days.map(d=>d.date).join('|'):'';
    if(next===key)return;
    // 已显示卡片与命中点之间只保留一个小三角通道，允许跨过定位间隙。
    if(!card.hidden&&key){
      const bounds=card.getBoundingClientRect(),origin={x:anchor.x+rect.left,y:anchor.y+rect.top};
      const edges:[{x:number;y:number},{x:number;y:number}][]=[];
      if(origin.x<bounds.left||origin.x>bounds.right){const x=origin.x<bounds.left?bounds.left:bounds.right;edges.push([{x,y:bounds.top},{x,y:bounds.bottom}])}
      if(origin.y<bounds.top||origin.y>bounds.bottom){const y=origin.y<bounds.top?bounds.top:bounds.bottom;edges.push([{x:bounds.left,y},{x:bounds.right,y}])}
      const cross=(p:{x:number;y:number},q:{x:number;y:number})=>(q.x-p.x)*(event.clientY-p.y)-(q.y-p.y)*(event.clientX-p.x);
      if(edges.some(([a,b])=>{const signs=[cross(origin,a),cross(a,b),cross(b,origin)];return signs.every(value=>value>=0)||signs.every(value=>value<=0)}))return;
    }
    leave();if(!next||!days)return;
    key=next;anchor={x,y};options.highlight(anchor);timer=window.setTimeout(()=>{timer=0;void show(days,next)},300);
  };
  const hostLeave=(event:PointerEvent)=>{if(event.relatedTarget instanceof Node&&card.contains(event.relatedTarget))return;leave()};
  const cardLeave=(event:PointerEvent)=>{if(event.relatedTarget instanceof Node&&host.contains(event.relatedTarget))return;leave()};
  const focusLeave=(event:FocusEvent)=>{if(event.relatedTarget instanceof Node&&(card.contains(event.relatedTarget)||host.contains(event.relatedTarget)))return;hide()};
  const cardWheel=(event:WheelEvent)=>event.stopPropagation();
  const hostKey=(event:KeyboardEvent)=>{if(event.key!=='Tab')hide()};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')hide()};
  const visibility=()=>{if(document.hidden)hide()};
  const resize=new ResizeObserver(hide);resize.observe(host);
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',hostLeave);host.addEventListener('pointerdown',hide);host.addEventListener('wheel',hide,{passive:true});host.addEventListener('keydown',hostKey);card.addEventListener('pointerleave',cardLeave);card.addEventListener('focusout',focusLeave);card.addEventListener('wheel',cardWheel,{passive:true});document.addEventListener('keydown',escape);document.addEventListener('visibilitychange',visibility);
  return {hide,async inspectDay(date:string,signal:AbortSignal):Promise<DayActivities|undefined>{
    const context=options.context();syncCache(context);await confirm(context,signal);
    const cached=cache.get(date);if(cached)return cached.details;
    let details:DayActivities;
    try{details=await fetchProjectActivities(context,date,signal)}
    catch(error){signal.throwIfAborted();console.warn('[CodeYears] 注册里程碑读取未完成：'+(error instanceof Error?error.message:'未知请求错误'));return}
    await confirm(context,signal);cache.set(date,{details,expires:Date.now()+5*60000});return details;
  },clear(){hide();cache.clear()},dispose(){hide();cache.clear();resize.disconnect();card.remove();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',hostLeave);host.removeEventListener('pointerdown',hide);host.removeEventListener('wheel',hide);host.removeEventListener('keydown',hostKey);card.removeEventListener('pointerleave',cardLeave);card.removeEventListener('focusout',focusLeave);card.removeEventListener('wheel',cardWheel);document.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',visibility)}};
}
