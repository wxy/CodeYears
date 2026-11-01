# ISO 整周城市布局

2026-11-01。从origin/codex/city-connected-landscape的`a148afcab9ee203e64fa155a59bdff46b7d44b16`建立codex/city-iso-week-layout。仅修改city-parcels.ts、city-layout.ts与本报告；共享iso-week helper、请求/缓存/权限、view、路网、UI与全局文档均不动。提交供root接入原PR #33，不另建PR、不合入main。已读DATA_AND_PRIVACY与PERFORMANCE，验证不使用真实用户隐私数据，不迁移旧硬件预算结论。

## 风险与实现

先识别风险：12/29–1/3所属年可能不同于date前四位；52/53周改变宽度与末段余量；闰日不能丢失；跨年日期索引/总量必须唯一；普通合并/奇观不能跨13/26/39周道路；部分输入不能用填零伪装整周年。

正式planner现在预计算共享isoWeekDate，以其year分block、week-1为x、weekday-1为z；区块按ISO年升序，monday=isoYearStart，weeks=isoYearWeeks。只创建实际输入cells，原date/count和成员索引不写回、不移动；跨公历1/1的同一ISO周自然留在同一block。强度分档、普通合并与奇观选择算法保持原语义，仍按实际完整矩形与道路边界处理。

季度改为显示分段：固定breaks=[13,26,39]，不是公历季度；53周放第四段。layout道路起点固定[13,26.8,40.6]，weekX=week+前三边界已跨越数量×.8，不再每季补到14列。width=max(输入ISO区块weeks)+2.4，52周年单独为54.4，含53周年为55.4。前三quarterPadding为0，只有混排时52周年末端余量为1。其他API保留，包括CITY_YEAR_WIDTH作为52周基础宽54.4；动态layout.width是实际画幅依据。

## 实际浏览器验证

云端Linux6.18.57、Node v24.19.0、Chromium154.0.8037.57 headless、Playwright1440×1000。通过现有preview:city Vite临时页面导入正式planWeeklyCity/createCityLayout、planCityScene/loadCityImages/createCityView。没有提交事后单元测试或修改现有预览源码。

确定性日期输入：UTC逐日枚举，count=1+(UTC毫秒/86400000 %29)；另使用现有generateDays('regular')公历二十年。检查每个cell的ISO年与独立“该日期所在周四的公历年”一致，星期行与UTC周一基准一致，x在实际52/53周范围；parcel成员索引恰好覆盖所有输入且无重复、总量相同，输入JSON前后不变；所有parcel（含奇观）均不跨13/26/39边界；逐周检查weekX仅插入三次.8、前三余量始终0。

| 输入 | 实际日期数 | 合计 | 结果 |
| --- | ---: | ---: | --- |
| 公历2005-01-01至2027-12-31 | 8400 | 125955 | 唯一覆盖；自然触及ISO2004–2027，无丢日 |
| ISO2005–2027逐年完整枚举 | 每年364或371 | 按输入分别守恒 | 23组各只有对应ISO区块，整年=weeks×7；53周年2009/2015/2020/2026 |
| 2020-12-28至2021-01-10 | 14 | 189 | 同周跨公历年仍为ISO2020-W53，下周为ISO2021-W01 |
| 仅2021-01-01(count7)、2021-01-04(count11) | 2 | 18 | ISO2020/2021各一真实cell，不填中间缺日或未来日期 |
| 原regular公历2006–2025 | 7305 | 93171 | 索引/总量不变；自然触及ISO2005和2026两端区块 |
| 完整ISO2006–2025 | 7301 | 109550 | 20区块，普通合并/奇观守恒，40处奇观 |

广范围包括2008/2012/2016/2020/2024闰日，均由唯一覆盖检查保留。混合ISO2020(53周)/2021(52周)实得quarterPadding=[0,0,0,0]/[0,0,0,1]；全部52周年单独无末端余量。公历二十年与ISO二十年日期数不同是年界选择变化，不是planner删改数量；root需用相邻公历年补取/过滤为选定ISO周年，不能直接把旧公历示例称为20个完整ISO年。

正式renderer实际加载资源并draw(progress=1)：ISO2020为371天/width55.4，完整ISO2006–2025为7301天/width55.4，两组均成功绘制1200×600画布，分别传入浅/深viewport，无运行异常，随后dispose与closeCityImages。该检查证明真实planner/renderer调用链可运行，不代替root的真实窗口构图与交互验收；未修改view里范围外的布局假设。

npm run check、npm run build -- --outDir /tmp/iso-city-build、git diff --check通过。临时脚本/日志/构建清理，仅保留本报告。没有新增日期库、边界兼容框架或事后单测。

## 未验收与接续

root负责ISO周年选择/相邻公历年获取与过滤、统一路网出口/桥端点及UI语义、真实Chrome/MV3画面和完整性能预算。此分支仅planner/layout修正，不修改隐私与数据请求边界，不宣称用户最终视觉接受；不另开PR，交由root共享提交合入原PR33统一交付，暂不合入main。
