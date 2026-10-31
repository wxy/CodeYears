const YEAR_TONES = ["#b57965", "#8aaabc", "#d2bd96", "#7f949f"] as const;

/** 年份街区使用稳定色系；不表示贡献数量或权限。 */
export const yearTone = (year: number): string => YEAR_TONES[year % YEAR_TONES.length];
