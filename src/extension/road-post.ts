/** 与地图共用直立方向和 2:1 地面投影的金属 / 木制小路牌。 */
export function roadPostArt(town:boolean,returning=false):string {
  const board=town?'#94673e':'#397461',edge=town?'#553c29':'#224d43';
  return `<svg class="road-post-art" viewBox="0 0 52 66" aria-hidden="true" focusable="false">
    <ellipse cx="26" cy="60" rx="14" ry="5" fill="#243527" opacity=".18"/>
    <path d="M18 57 26 53 34 57 26 61Z" fill="${town?'#aaa18a':'#9da5a2'}" stroke="${town?'#746b57':'#737e7c'}" stroke-width="1"/>
    <path d="M24 23H29V57L26 59 24 57Z" fill="${town?'#795335':'#929e9d'}"/>
    <path d="M27 25V56" stroke="${town?'#b58d59':'#d4dcda'}" stroke-width="1.5"/>
    <path d="M7 11H37L47 20 37 29H7L9 20Z" fill="${edge}" transform="translate(0 2)"/>
    <path d="M7 10H37L47 19 37 28H7L9 19Z" fill="${returning?(town?'#756346':'#426d8b'):board}" stroke="${edge}" stroke-width="1.5"/>
    <path d="M11 13H36L43 19 36 25H11" fill="none" stroke="${town?'#caa56a':'#c7ded0'}" stroke-width="1" opacity=".75"/>
    ${town?'<path d="M12 16H18M31 23H36M13 23H17" stroke="#60412c" stroke-width=".8"/>':''}
    ${returning?'<path d="M32 22V20C32 16 25 16 21 17M24 13 20 17 24 21" fill="none" stroke="#f9edcb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>':'<path d="M20 19H32M28 15 33 19 28 23" fill="none" stroke="#f7f0d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'}
    <circle cx="12" cy="19" r="1" fill="${town?'#dec18a':'#e0e6e2'}"/>
  </svg>`;
}
