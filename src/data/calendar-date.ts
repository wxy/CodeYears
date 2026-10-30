/** 请求与显示截止使用浏览器本地日历日期；不将 GitHub 的日期标签重新换算时区。 */
export function browserCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
