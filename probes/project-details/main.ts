import { fetchDetails, memberDates, parseDetails, validDate } from './details';
import type { DayDetails } from './details';

const host = document.createElement('div');
host.id = 'codeyears-project-details-probe';
document.getElementById(host.id)?.remove();
document.body.append(host);
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>
:host{display:block;position:relative;z-index:10000;background:#f6f8fa;color:#182230;font:14px/1.5 system-ui;padding:24px;border:2px solid #0969da}h1{font-size:22px}label{display:block;margin:12px 0}textarea,input{display:block;width:95%;padding:8px;font:inherit}button{margin:6px;padding:8px 16px}article{border-top:1px solid #afb8c1;padding:12px 0}a{color:#0969da}pre{white-space:pre-wrap;overflow-wrap:anywhere}p{max-width:80ch}
</style><h1>建筑对应项目 · 独立工程探针</h1>
<p>匿名公开模式（credentials: omit），无存储。只展示可见的相关项目，详情不完整，不承诺主要项目排名。当前不接正式城市与悬停。</p>
<label>GitHub 用户<input id="login" value="wxy"></label>
<label>规划输入日期（每行 YYYY-MM-DD，可选逗号后附参考 count；手填值未经本探针校验）<textarea id="days" rows="4">2024-04-27
2024-04-28
2026-11-04</textarea></label>
<label>建筑成员 indices（对应上面的输入，0 开始；不展开中间日期）<input id="indices" value="0,2"></label>
<button id="public">读取匿名公开详情</button><button id="synthetic">运行合成成员过滤示例</button><button id="cancel">取消</button><button id="close">关闭并清除</button>
<p id="status" role="status">尚未请求。最多选择 12 个成员日期，逐日请求，不自动翻页。</p><div id="results"></div>`;
const input = (id: string) => root.querySelector<HTMLInputElement>(`#${id}`)!;
const status = root.querySelector<HTMLElement>('#status')!;
const results = root.querySelector<HTMLElement>('#results')!;
let active: AbortController | undefined;
function show(value: DayDetails, reference: number | undefined, synthetic: boolean) {
  const article = document.createElement('article');
  const title = document.createElement('h2');
  title.textContent = `${value.date} · ${value.state === 'visible' ? '取得可见详情' : '无可见详情（不等于真实零值）'}`;
  const source = document.createElement('a');
  source.href = value.source; source.target = '_blank'; source.rel = 'noopener noreferrer'; source.textContent = synthetic ? 'GitHub 日期入口（合成结果未从此取数）' : 'GitHub 原始日期来源';
  const content = document.createElement('pre');
  content.textContent = JSON.stringify({ evidence: synthetic ? 'synthetic' : 'anonymous-public', referenceCount: reference ?? '未知；不填零', ...value }, null, 2);
  const links = document.createElement('ul');
  for (const detail of value.details) {
    const row = document.createElement('li'), link = document.createElement('a');
    link.href = detail.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = `${detail.repository} · ${detail.kind}${detail.count === undefined ? '' : ` · ${detail.count}`}`;
    row.append(link); links.append(row);
  }
  article.append(title, source, links, content); results.append(article);
}
async function run(synthetic: boolean) {
  active?.abort();
  const controller = new AbortController(); active = controller;
  results.replaceChildren();
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('#public, #synthetic')];
  buttons.forEach(button => button.disabled = true);
  let requests = 0;
  try {
    if (synthetic) { input('days').value = '2024-01-01,0\n2024-01-02,9\n2024-01-08'; input('indices').value = '0,2'; }
    const days = input('days').value.trim().split(/\n/).map(line => {
      const [date, raw] = line.trim().split(',');
      const count = raw === undefined || raw.trim() === '' ? undefined : Number(raw);
      if (!validDate(date) || (count !== undefined && (!Number.isSafeInteger(count) || count < 0))) throw new Error('输入日期或参考数量无效');
      return { date, count };
    });
    if (new Set(days.map(day => day.date)).size !== days.length) throw new Error('输入日期重复');
    const indices = input('indices').value.split(',').map(value => value.trim() === '' ? NaN : Number(value));
    const dates = memberDates(days, indices);
    if (!dates.length || dates.length > 12) throw new Error('请选择 1–12 个成员日期');
    const login = input('login').value.trim();
    status.textContent = `${synthetic ? '合成验证' : '匿名公开'}；成员 ${dates.join(', ')}；读取中`;
    for (const date of dates) {
      controller.signal.throwIfAborted();
      try {
        let value: DayDetails;
        if (synthetic) {
          // 过程数据即时生成；中间日期不请求、不展示，不代表真实 GitHub 成功。
          const html = `<div class="contribution-activity-listing"><h3>${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</h3><p>${login} had no activity during this period.</p></div>`;
          value = parseDetails(new DOMParser().parseFromString(html, 'text/html'), login, date);
        } else { requests++; value = await fetchDetails(login, date, controller.signal); }
        show(value, days.find(day => day.date === date)?.count, synthetic);
      } catch (error) {
        controller.signal.throwIfAborted();
        const article = document.createElement('article');
        article.textContent = `${date} · 取数失败：${error instanceof Error ? error.message : String(error)}。参考 count 保持不变，不生成零值。`;
        results.append(article);
      }
    }
    status.textContent = `${synthetic ? '合成验证完成（不是真实取数）' : '匿名公开请求结束（逐日结果见下方）'}；成员 ${dates.join(', ')}；尝试请求 ${requests} 次；详情不保证覆盖每日合计。`;
  } catch (error) {
    status.textContent = `停止：${controller.signal.aborted ? '已取消' : error instanceof Error ? error.message : String(error)}；尝试请求 ${requests} 次。`;
  } finally { if (active === controller) { active = undefined; buttons.forEach(button => button.disabled = false); } }
}
root.querySelector('#public')!.addEventListener('click', () => void run(false));
root.querySelector('#synthetic')!.addEventListener('click', () => void run(true));
root.querySelector('#cancel')!.addEventListener('click', () => active?.abort());
root.querySelector('#close')!.addEventListener('click', () => { active?.abort(); host.remove(); });
