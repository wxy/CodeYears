import type { GitHubPageContext } from '../platform/github/types';

// 已打开的标签页可能仍持有旧版保存的 town 站点。
interface CityStop { login:string; map:'city'|'town' }
interface CityJourney { viewer:string; target:string; trail:CityStop[] }
const PENDING='codeyears:journey:arrival';
// GitHub 初始化会重写 history.state；浏览器的历史项 key 不随之变化。
const entryKey=()=>`codeyears:journey:entry:${window.navigation.currentEntry!.key}`;
const loginPattern=/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i;
const viewerKey=(context:GitHubPageContext)=>context.viewer.state==='unknown'?undefined:context.viewer.identity.kind==='signed-out'?'signed-out':`user:${context.viewer.identity.login.toLowerCase()}`;

/** 会话存储是边界；只接受同一访问者、当前目的城市的路径。 */
function decode(value:unknown,context:GitHubPageContext):CityJourney|undefined {
  if(!value||typeof value!=='object')return;
  const journey=value as CityJourney;
  if(journey.viewer!==viewerKey(context)||journey.target!==context.profileLogin.toLowerCase()||!Array.isArray(journey.trail)||
    journey.trail.some(stop=>!stop||typeof stop.login!=='string'||!loginPattern.test(stop.login)||(stop.map!=='city'&&stop.map!=='town')))return;
  return journey;
}

export function readCityJourney(context:GitHubPageContext):readonly CityStop[] {
  if(!viewerKey(context))return [];
  const parse=(raw:string|null):unknown=>{if(!raw)return;try{return JSON.parse(raw)}catch{return undefined}};
  const saved=decode(parse(sessionStorage.getItem(entryKey())),context);
  if(saved)return saved.trail;
  const pending=sessionStorage.getItem(PENDING);
  if(!pending)return [];
  sessionStorage.removeItem(PENDING);
  const arrival=decode(parse(pending),context);
  if(!arrival)return [];
  sessionStorage.setItem(entryKey(),JSON.stringify(arrival));
  return arrival.trail;
}

/** 只写当前标签的旅行路径；不写任何城市的持久化道路设置。 */
export function rememberCityJourney(context:GitHubPageContext,destination:string):void {
  const viewer=viewerKey(context);
  if(!viewer)throw new Error('Unknown visitor');
  const trail:CityStop[]=[...readCityJourney(context),{login:context.profileLogin.toLowerCase(),map:'city'}];
  const returning=trail.findIndex(stop=>stop.login===destination);
  const next=returning<0?trail:trail.slice(0,returning);
  sessionStorage.setItem(PENDING,JSON.stringify({viewer,target:destination,trail:next} satisfies CityJourney));
  sessionStorage.setItem(entryKey(),JSON.stringify({viewer,target:context.profileLogin.toLowerCase(),trail:trail.slice(0,-1)} satisfies CityJourney));
  const source=new URL(location.href);source.hash='codeyears-city';
  history.replaceState(history.state,'',source);
}
