import { localize, type Language } from './i18n';

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

export function createCityLegend(language: Language = 'zh-CN',town=false): HTMLElement {
  const legend = document.createElement("aside");
  legend.className = "city-legend";
  legend.dataset.i18nLabel = 'legendLabel';
  legend.innerHTML = town?`
    <h4 data-i18n="townLegendHeading"></h4>
    <ul>
      <li><strong>1–9</strong> <span data-i18n="townLegendRustic"></span></li>
      <li><strong>10–49</strong> <span data-i18n="townLegendFarm"></span></li>
      <li><strong>50–199</strong> <span data-i18n="townLegendWorkshop"></span></li>
      <li><strong>200+</strong> <span data-i18n="townLegendArcane"></span></li>
    </ul><p data-i18n="townLegendRegions"></p><p data-i18n="townLegendLife"></p><p data-i18n="legendMissing"></p>`:`
    <h4 data-i18n="legendHeading"></h4>
    <ul>
      <li><strong>0</strong> <span data-i18n="legendZero"></span></li>
      <li><strong>1–2</strong> <span data-i18n="legendBungalow"></span></li>
      <li><strong>3–5</strong> <span data-i18n="legendLowRise"></span></li>
      <li><strong>6–19</strong> <span data-i18n="legendApartment"></span></li>
      <li><strong>20–49</strong> <span data-i18n="legendOffice"></span></li>
      <li><strong>50+</strong> <span data-i18n="legendTower"></span></li>
    </ul>
    <p data-i18n="legendLevels"></p><p data-i18n="legendWonders"></p>
    <p data-i18n="legendNature"></p><p data-i18n="legendMissing"></p>`;
  const label = document.createDocumentFragment(); label.append(legend);
  localize(label, language);
  return legend;
}
