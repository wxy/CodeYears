import type { DailyContribution } from '../data/types';
import { browserCalendarDate } from '../data/calendar-date';
import { isoWeekDate, isoYearStart } from '../data/iso-week';
import { confirmViewer, sameContext } from '../platform/github/load-year';
import { fetchProjectActivities, type ProjectActivity, type DayActivities } from '../platform/github/project-details';
import type { GitHubPageContext } from '../platform/github/types';
import type { Language } from './language';

const WEEK=7*86400000;

/** 用成员日的周/星期模式概括节奏，不把不连续日期展开成连续工作。 */
function describeTime(days:readonly DailyContribution[],language:Language):string {
  const zh=language==='zh-CN',groups=new Map<number,{year:number;week:number;weekdays:number[]}>();
  for(const day of days){
    const value=isoWeekDate(day.date),monday=isoYearStart(value.year)+(value.week-1)*WEEK;
    const group=groups.get(monday)??{year:value.year,week:value.week,weekdays:[]};
    if(!group.weekdays.includes(value.weekday))group.weekdays.push(value.weekday);
    groups.set(monday,group);
  }
  const entries=[...groups.entries()].sort((a,b)=>a[0]-b[0]);
  const weekdays=(values:number[])=>{
    const sorted=[...values].sort((a,b)=>a-b),names=zh?['周一','周二','周三','周四','周五','周六','周日']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const runs:number[][]=[];
    for(const value of sorted){const last=runs.at(-1);if(last&&last.at(-1)!+1===value)last.push(value);else runs.push([value])}
    return runs.map(run=>run.length===1?names[run[0]-1]:`${names[run[0]-1]}${zh?'至':'–'}${names[run.at(-1)!-1]}`).join(zh?'、':', ');
  };
  const now=isoWeekDate(browserCalendarDate(new Date())),thisMonday=isoYearStart(now.year)+(now.week-1)*WEEK;
  const relative=(monday:number)=>monday===thisMonday?(zh?'本周':'This week'):monday===thisMonday-WEEK?(zh?'上周':'Last week'):undefined;
  const first=entries[0][1],last=entries.at(-1)![1];
  const samePattern=entries.every(([,g])=>weekdays(g.weekdays)===weekdays(first.weekdays));
  const consecutive=entries.every(([monday],i)=>i===0||monday===entries[i-1][0]+WEEK);
  if(entries.length===1)return `${relative(entries[0][0])??(zh?`${first.year} · 第${first.week}周`:`${first.year} · W${first.week}`)}${zh?'，':' · '}${weekdays(first.weekdays)}`;
  if(samePattern&&consecutive){
    if(entries.length===2&&entries[0][0]===thisMonday-WEEK)return zh?`上周和本周的${weekdays(first.weekdays)}`:`Last week and this week · ${weekdays(first.weekdays)}`;
    return zh?`${first.year} · 第${first.week}—${last.week}周，每周${weekdays(first.weekdays).replace(/^周/,'')}`:`${first.year} · W${first.week}–${last.week} · ${weekdays(first.weekdays)} each week`;
  }
  return `${first.year} · `+entries.map(([monday,g])=>`${relative(monday)??(zh?`第${g.week}周`:`W${g.week}`)}${zh?'的':' · '}${weekdays(g.weekdays)}`).join(zh?'；':'; ');
}

function describeProjects(activities:readonly ProjectActivity[],language:Language,partial:boolean):{repository:string;text:string;example?:string}[] {
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
    return {repository:items[0].repository,text:metrics.join(' · '),example:items.find(a=>a.title)?.title,days,commits,links:items.length};
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
  const card=document.createElement('aside');card.className='building-hover';card.id='building-hover';card.hidden=true;card.setAttribute('role','tooltip');
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
    const before=card.hidden?undefined:card.getBoundingClientRect();reveal?.cancel();reveal=undefined;
    const language=options.language(),zh=language==='zh-CN';
    card.replaceChildren();const heading=document.createElement('div');heading.className='building-hover-time';heading.textContent=describeTime(days,language);card.append(heading);
    const projects=describeProjects(details.projects,language,partial);
    if(details.joinedGitHub){const milestone=document.createElement('p');milestone.className='building-hover-milestone';milestone.textContent=zh?'加入 GitHub · 开发旅程的起点':'Joined GitHub · The beginning of the journey';card.append(milestone)}
    for(const [index,project]of projects.slice(0,2).entries()){
      const row=document.createElement('p'),name=document.createElement('strong');name.textContent=project.repository;row.append(name,document.createElement('br'),document.createTextNode(project.text));card.append(row);
      if(index===0&&project.example){const example=document.createElement('p');example.className='building-hover-example';example.textContent=`${zh?'例如：':'For example: '}${project.example}`;card.append(example)}
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
        if(!details.projects.length&&!details.joinedGitHub)console.warn(`[CodeYears] 建筑项目详情：${failures.length?[...new Set(failures)].join('；'):'单日活动已解析，但没有可展示的项目活动'}（成员日 ${dates.length}，已请求 ${cursor}，解析成功 ${loaded.size}）。`);
        render(days,details,false,partial());
      }
    }catch{if(!signal.aborted){cache.clear();hide();options.invalidate()}}
  }
  const move=(event:PointerEvent)=>{
    if(event.buttons||event.pointerType==='touch'){hide();return}
    const rect=host.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top,days=options.pick(x,y);
    const next=days?.length?days.map(d=>d.date).join('|'):'';
    if(next===key)return;
    leave();if(!next||!days)return;
    key=next;anchor={x,y};options.highlight(anchor);timer=window.setTimeout(()=>{timer=0;void show(days,next)},300);
  };
  const visibility=()=>{if(document.hidden)hide()};
  const resize=new ResizeObserver(hide);resize.observe(host);
  host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);host.addEventListener('pointerdown',hide);host.addEventListener('wheel',hide,{passive:true});host.addEventListener('keydown',hide);document.addEventListener('visibilitychange',visibility);
  return {hide,async inspectDay(date:string,signal:AbortSignal):Promise<DayActivities|undefined>{
    const context=options.context();syncCache(context);await confirm(context,signal);
    const cached=cache.get(date);if(cached)return cached.details;
    let details:DayActivities;
    try{details=await fetchProjectActivities(context,date,signal)}
    catch(error){signal.throwIfAborted();console.warn('[CodeYears] 注册里程碑读取未完成：'+(error instanceof Error?error.message:'未知请求错误'));return}
    await confirm(context,signal);cache.set(date,{details,expires:Date.now()+5*60000});return details;
  },clear(){hide();cache.clear()},dispose(){hide();cache.clear();resize.disconnect();card.remove();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);host.removeEventListener('pointerdown',hide);host.removeEventListener('wheel',hide);host.removeEventListener('keydown',hide);document.removeEventListener('visibilitychange',visibility)}};
}
