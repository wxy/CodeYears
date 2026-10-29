/** 播放进度独立于数据获取进度；完整缓存也可以从历史起点重播。 */
export interface TimelineState {
  readonly status: "idle" | "playing" | "paused" | "completed";
  readonly revealedDays: number;
  readonly totalDays: number;
}
