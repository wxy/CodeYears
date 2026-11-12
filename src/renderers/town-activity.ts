import type { DailyContribution } from '../data/types';

export interface TownActivityPhase {
  indices:number[];
  startDate:string;
  endDate:string;
  count:number;
  activeDays:number;
  density:number;
}

/** 仅按是否有贡献识别时间阶段；数量保持原值，不参加边界优化。 */
export async function planTownActivity(days:readonly DailyContribution[],signal?:AbortSignal):Promise<TownActivityPhase[]> {
  signal?.throwIfAborted();
  const length=days.length,penalty=6,day=86400000;
  const active=new Uint32Array(length+1),timestamps=new Float64Array(length),xlogx=new Float64Array(length+1);
  let work=0,sliceStarted=performance.now();
  const shouldYield=()=>((++work&255)===0)&&performance.now()-sliceStarted>=8;
  const yieldTask=async()=>{
    signal?.throwIfAborted();
    const scheduler=(globalThis as typeof globalThis&{scheduler?:{yield?:()=>Promise<void>}}).scheduler;
    if(scheduler?.yield)await scheduler.yield();
    else await new Promise<void>(resolve=>setTimeout(resolve,0));
    signal?.throwIfAborted();sliceStarted=performance.now();
  };
  for(let i=0;i<length;i++){
    active[i+1]=active[i]+Number(days[i].count>0);
    timestamps[i]=Date.parse(`${days[i].date}T00:00:00Z`);
    xlogx[i+1]=(i+1)*Math.log(i+1);
    if(shouldYield())await yieldTask();
  }
  const phases:TownActivityPhase[]=[],cost=new Float64Array(length+1),previous=new Uint32Array(length+1);
  for(let start=0;start<length;){
    let end=start+1;
    while(end<length&&timestamps[end]-timestamps[end-1]===day){
      end++;if(shouldYield())await yieldTask();
    }
    const positive=active[end]-active[start];
    let boundaries=[start,end];
    if(positive!==0&&positive!==end-start){
      const endpoints:number[]=[];
      for(let i=start+1;i<end;i++){
        if((days[i].count>0)!==(days[i-1].count>0))endpoints.push(i);
        if(shouldYield())await yieldTask();
      }
      endpoints.push(end);
      // 同值串内两侧NLL之和对切点凹，最优切点在串端点，不需要串内候选。
      const candidates=new Uint32Array(endpoints.length+1),values=new Float64Array(endpoints.length+1);
      candidates[0]=start;
      let candidateCount=1;
      cost[start]=-penalty;
      for(const e of endpoints){
        let best=Infinity,bestStart=start;
        const activeEnd=active[e];
        for(let i=0;i<candidateCount;i++){
          const s=candidates[i],m=e-s,k=activeEnd-active[s];
          const candidate=cost[s]+xlogx[m]-xlogx[k]-xlogx[m-k]+penalty;
          values[i]=candidate;
          if(candidate<best){best=candidate;bestStart=s}
          if(shouldYield())await yieldTask();
        }
        cost[e]=best;previous[e]=bestStart;
        // C(s,u)>=C(s,e)+C(e,u)：已被e支配的起点不可能改善任何未来解。
        let retained=0;
        for(let i=0;i<candidateCount;i++){
          if(values[i]<best+penalty)candidates[retained++]=candidates[i];
          if(shouldYield())await yieldTask();
        }
        candidates[retained++]=e;candidateCount=retained;
      }
      boundaries=[end];
      for(let e=end;e>start;){
        e=previous[e];boundaries.push(e);if(shouldYield())await yieldTask();
      }
      boundaries.reverse();
    }
    for(let i=1;i<boundaries.length;i++){
      const first=boundaries[i-1],last=boundaries[i],indices:number[]=[];
      let count=0;
      for(let index=first;index<last;index++){
        indices.push(index);count+=days[index].count;
        if(shouldYield())await yieldTask();
      }
      const activeDays=active[last]-active[first];
      phases.push({indices,startDate:days[first].date,endDate:days[last-1].date,
        count,activeDays,density:activeDays/indices.length});
    }
    start=end;
  }
  signal?.throwIfAborted();
  return phases;
}
