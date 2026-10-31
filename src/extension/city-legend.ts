/** 扩展 Shadow DOM 与本地预览共用；颜色继承宿主，不依赖城市素材或占地目录。 */
export const cityLegendStyles = `
  .city-legend { margin:0 0 16px; padding:14px 0 0; border-top:1px solid var(--borderColor-default,#d1d9e0); color:var(--fgColor-muted,#59636e); font-size:12px; line-height:1.65; }
  .city-legend[hidden] { display:none; }
  .city-legend h4 { margin:0 0 8px; color:var(--fgColor-default,#1f2328); font-size:12px; font-weight:600; }
  .city-legend ul { display:flex; flex-wrap:wrap; gap:6px 20px; margin:0 0 8px; padding:0; list-style:none; }
  .city-legend li { display:flex; align-items:baseline; gap:7px; }
  .city-legend strong { color:var(--fgColor-default,#1f2328); font-weight:600; font-variant-numeric:tabular-nums; }
  .city-legend p { margin:4px 0; }
`;

export function createCityLegend(): HTMLElement {
  const legend = document.createElement("aside");
  legend.className = "city-legend";
  legend.setAttribute("aria-label", "City 城市图例");
  legend.innerHTML = `
    <h4>读懂这座城 <span>· 每日贡献</span></h4>
    <ul>
      <li><strong>0</strong> 平地 · 草地、池塘或广场</li>
      <li><strong>1–2</strong> 幼树</li>
      <li><strong>3–5</strong> 树木 / 树林</li>
      <li><strong>6+</strong> 建筑</li>
    </ul>
    <p>建筑高度表示相对贡献强度；同档相邻格可融合，一座建筑可包含多个源日期。精确数量以每日明细为准。</p>
    <p>颜色仅为素材材质差异；五年景观带内的水体、树木及道路只作装饰。</p>
    <p>景观生长百分比表示动画进度，不表示真实日期播放进度。以上为当前规则，阈值尚未冻结。</p>`;
  return legend;
}
