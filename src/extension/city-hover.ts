import type { DailyContribution } from '../data/types';
import { browserCalendarDate } from '../data/calendar-date';
import { isoWeekDate, isoYearStart } from '../data/iso-week';
import { confirmViewer, sameContext } from '../platform/github/load-year';
import { fetchProjectActivities, type ProjectActivity } from '../platform/github/project-details';
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

function describeProjects(activities:readonly ProjectActivity[],language:Language):{repository:string;text:string}[] {
  const zh=language==='zh-CN',groups=new Map<string,ProjectActivity[]>();
  for(const activity of activities){const key=activity.repository.toLowerCase(),list=groups.get(key)??[];if(!list.some(a=>a.kind===activity.kind&&a.url===activity.url&&a.date===activity.date))list.push(activity);groups.set(key,list)}
  return [...groups.values()].map(items=>{
    const days=new Set(items.map(a=>a.date)).size,commits=items.reduce((sum,a)=>sum+(a.commits??0),0);
    const prs=new Set(items.filter(a=>a.kind==='pull-request').map(a=>a.url)).size;
    const reviews=new Set(items.filter(a=>a.kind==='review').map(a=>a.url)).size;
    const kind=(value:ProjectActivity['kind'])=>items.some(a=>a.kind===value);
    const verbs=[kind('commits')?(zh?'提交代码':'code commits'):'',kind('pull-request')?(zh?'发起 PR':'opening PRs'):'',kind('review')?(zh?'参与评审':'reviews'):'',kind('issue')?(zh?'提出 Issue':'opening issues'):''].filter(Boolean);
    const intensity=commits>=20||prs>=3||reviews>=3?(zh?'贡献较集中':'Concentrated activity'):days>=2?(zh?'持续参与':'Repeated contributions'):(zh?'有一些贡献':'Some contributions');
    return {repository:items[0].repository,text:`${intensity}${zh?'，主要是':' · '}${verbs.join(zh?'、':', ')}`,days,commits,links:items.length};
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
  const cache=new Map<string,{activities:ProjectActivity[];expires:number}>();
  let cacheScope='',key='',timer=0,closeTimer=0,request:AbortController|undefined,anchor={x:0,y:0};
  const dismiss=(immediate:boolean)=>{
    clearTimeout(timer);timer=0;clearTimeout(closeTimer);request?.abort();request=undefined;key='';
    options.highlight();
    card.removeAttribute('data-open');host.removeAttribute('aria-describedby');
    const finish=()=>{closeTimer=0;card.hidden=true;card.replaceChildren()};
    if(immediate||card.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
    else closeTimer=window.setTimeout(finish,100);
  };
  // 身份、导航和画面变化立即清除；普通移出才保留短暂的淡出。
  const hide=()=>dismiss(true),leave=()=>dismiss(false);
  const render=(days:readonly DailyContribution[],activities:readonly ProjectActivity[],pending:boolean)=>{
    const language=options.language(),zh=language==='zh-CN';
    card.replaceChildren();const heading=document.createElement('div');heading.className='building-hover-time';heading.textContent=describeTime(days,language);card.append(heading);
    const projects=describeProjects(activities,language);
    if(projects.length){
      const project=projects[0],row=document.createElement('p'),name=document.createElement('strong');name.textContent=project.repository;row.append(name,document.createTextNode(`${zh?'：':': '}${project.text}`));card.append(row);
      if(projects.length>1){const others=document.createElement('p');others.textContent=`${zh?'同期也参与了 ':'Also contributed to '}${projects.slice(1,3).map(p=>p.repository).join(zh?'、':', ')}${projects.length>3?(zh?' 等项目。':' and other projects.'):(zh?'。':'.')}`;card.append(others)}
    }
    else{
      const mean=days.reduce((sum,d)=>sum+d.count,0)/days.length,row=document.createElement('p');
      row.textContent=zh?(mean>=20?'这一时段贡献较集中。':mean>=6?'这一时段贡献较活跃。':'这一时段有一些贡献活动。'):(mean>=20?'Concentrated contribution activity.':mean>=6?'An active period of contributions.':'Some contribution activity during this period.');card.append(row);
      const note=document.createElement('p');note.className='building-hover-note';note.textContent=pending?(zh?'正在补充相关项目…':'Finding related projects…'):(zh?'暂未取得相关项目。':'Related projects are not available yet.');card.append(note);
    }
    clearTimeout(closeTimer);closeTimer=0;
    card.hidden=false;host.setAttribute('aria-describedby',card.id);
    const parent=host.parentElement!.getBoundingClientRect(),point=host.getBoundingClientRect();
    const x=anchor.x+point.left-parent.left,y=anchor.y+point.top-parent.top;
    card.style.left=`${Math.max(8,Math.min(parent.width-card.offsetWidth-8,x+16))}px`;
    card.style.top=`${Math.max(8,Math.min(parent.height-card.offsetHeight-8,y+16))}px`;
    card.setAttribute('data-open','');
  };
  async function show(days:readonly DailyContribution[],target:string){
    render(days,[],true);
    const context=options.context(),known=context.viewer.state==='known';
    const identity=context.viewer.state==='unknown'?'public':context.viewer.identity.kind==='signed-out'?'signed-out':`user:${context.viewer.identity.login.toLowerCase()}`;
    const scope=`${identity}:${context.profileLogin.toLowerCase()}`;
    if(!known||cacheScope!==scope){cache.clear();cacheScope=scope}
    for(const [date,entry]of cache)if(entry.expires<=Date.now())cache.delete(date);
    const dates=days.map(d=>d.date),missing=dates.filter(date=>!cache.has(date));
    const controller=new AbortController();request=controller;const signal=controller.signal;
    const confirm=async()=>{if(known)await confirmViewer(context,signal);signal.throwIfAborted();if(!sameContext(context,options.currentContext()))throw new Error('GitHub session changed')};
    const loaded=new Map<string,ProjectActivity[]>(),failures:string[]=[];let cursor=0,published=0,complete=false,publishing:Promise<void>|undefined;
    const collect=()=>dates.flatMap(date=>loaded.get(date)??cache.get(date)?.activities??[]);
    const publish=()=>publishing??=(async()=>{
      await confirm();
      if(signal.aborted||key!==target)return;
      if(known)for(const [date,activities]of loaded)cache.set(date,{activities,expires:Date.now()+5*60000});
      published=loaded.size;render(days,collect(),!complete);
    })().finally(()=>{publishing=undefined});
    try{
      await confirm();
      if(signal.aborted||key!==target)return;
      if(!missing.length){render(days,collect(),false);return}
      if(collect().length)render(days,collect(),true);
      await Promise.all(Array.from({length:Math.min(2,missing.length)},async()=>{
        while(cursor<missing.length){
          const date=missing[cursor++];signal.throwIfAborted();
          let activities:ProjectActivity[];
          try{activities=await fetchProjectActivities(context,date,signal)}
          catch(error){signal.throwIfAborted();failures.push(error instanceof Error?error.message:'未知请求错误');return}
          loaded.set(date,activities);await publish();
        }
      }));
      complete=true;
      if(loaded.size>published)await publish();
      if(!signal.aborted&&key===target){
        const activities=collect();
        // 仅记录本地阶段与数量，不输出日期、仓库名、响应正文或会话信息。
        if(!activities.length)console.warn(`[CodeYears] 建筑项目详情：${failures.length?[...new Set(failures)].join('；'):'单日活动已解析，但没有可展示的项目活动'}（成员日 ${dates.length}，已请求 ${cursor}，解析成功 ${loaded.size}）。`);
        render(days,activities,false);
      }
    }catch{
      if(!signal.aborted){cache.clear();hide();options.invalidate()}
      return;
    }
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
  return {hide,clear(){hide();cache.clear()},dispose(){hide();cache.clear();resize.disconnect();card.remove();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);host.removeEventListener('pointerdown',hide);host.removeEventListener('wheel',hide);host.removeEventListener('keydown',hide);document.removeEventListener('visibilitychange',visibility)}};
}
