import { requestHTML } from './probe';
import type { GitHubPageContext } from './types';

export interface ProjectActivity {
  date: string;
  repository: string;
  kind: 'commits' | 'pull-request' | 'review' | 'issue';
  url: string;
  commits?: number;
}

/** 与建筑成员日一一对应，只解析同源活动区域，不展开仓库或PR正文。 */
export async function fetchProjectActivities(context: GitHubPageContext, date: string, signal: AbortSignal): Promise<ProjectActivity[]> {
  const url=new URL(`/${context.profileLogin}`,'https://github.com');
  url.search=new URLSearchParams({tab:'overview',from:date,to:date}).toString();
  const doc=await requestHTML(url,signal,true),areas=doc.querySelectorAll('.contribution-activity-listing');
  if(areas.length!==1)throw new Error('项目活动区域无法确认');
  const area=areas[0],clean=(node:Element|null)=>node?.textContent?.replace(/\s+/g,' ').trim()??'';
  const expected=new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  if(clean(area.querySelector('h3'))!==expected)throw new Error('项目活动日期无法确认');
  const activities:ProjectActivity[]=[];
  if(!area.querySelector('.TimelineItem')&&!clean(area).includes(`${context.profileLogin} had no activity during this period.`))throw new Error('项目活动结构无法确认');
  for(const item of area.querySelectorAll('.TimelineItem')){
    const summary=clean(item.querySelector('.TimelineItem-body > details-toggle > details > summary'));
    const kind:ProjectActivity['kind']|undefined=/^Created [\d,]+ commits? in /.test(summary)?'commits':
      /^Opened [\d,]+ (?:other )?pull requests? in /.test(summary)?'pull-request':
      /^Reviewed [\d,]+ pull requests? in /.test(summary)?'review':/^Opened [\d,]+ issues? in /.test(summary)?'issue':undefined;
    if(!kind)continue;
    const selector=kind==='commits'?'a[href*="/commits?"]':`a[data-hovercard-type="${kind==='issue'?'issue':'pull_request'}"]`;
    for(const anchor of item.querySelectorAll<HTMLAnchorElement>(selector)){
      const link=new URL(anchor.getAttribute('href')??'','https://github.com');
      const match=link.pathname.match(/^\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/(commits|pull\/\d+|issues\/\d+)$/);
      if(link.origin!=='https://github.com'||!match)throw new Error('项目活动链接无法确认');
      if(kind==='commits'?match[2]!=='commits':!match[2].startsWith(kind==='issue'?'issues/':'pull/'))throw new Error('项目活动类型无法确认');
      let commits:number|undefined;
      if(kind==='commits'){
        const count=clean(anchor).match(/^([\d,]+) commits?$/);
        const next=new Date(Date.parse(date)+86400000).toISOString().slice(0,10);
        if(!count||link.searchParams.get('since')!==date||link.searchParams.get('until')!==next)throw new Error('提交日期无法确认');
        commits=Number(count[1].replaceAll(',',''));
        if(!Number.isSafeInteger(commits)||commits<0)throw new Error('提交数量无法确认');
      }
      if(!activities.some(a=>a.kind===kind&&a.url===link.href))activities.push({date,repository:match[1],kind,url:link.href,...(commits===undefined?{}:{commits})});
    }
  }
  return activities;
}
