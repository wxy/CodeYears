/** 计划中的内部数据契约。P1 解析器在外部输入边界验证后才能生成此类型。 */
export interface DailyContribution {
  /** GitHub 页面给出的日历日期，YYYY-MM-DD；不经本地时区重新切日。 */
  readonly date: string;
  /** 真实每日数量；不能由颜色等级推算。缺失日期不能填 0。 */
  readonly count: number;
}

export interface ContributionYear {
  readonly profileLogin: string;
  readonly year: number;
  readonly days: readonly DailyContribution[];
  readonly fetchedAt: string;
  readonly parserVersion: number;
}
