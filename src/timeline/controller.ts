import type { TimelineState } from "./types";

/**
 * Playback over a fixed, available day range. Fetch/cache progress is not input.
 * The caller supplies monotonic timestamps in milliseconds and owns scheduling.
 */
export function createTimeline(totalDays: number, durationMs = 8000) {
  if (!Number.isSafeInteger(totalDays) || totalDays < 0) {
    throw new RangeError("totalDays must be a non-negative safe integer");
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError("durationMs must be positive and finite");
  }

  let status: TimelineState["status"] = "idle";
  let revealedDays = 0;
  let elapsedMs = 0;
  let lastTime = 0;

  function checkTime(nowMs: number) {
    if (!Number.isFinite(nowMs)) throw new RangeError("timestamp must be finite");
  }

  function play(nowMs: number) {
    checkTime(nowMs);
    if (status !== "idle" && status !== "paused") return;
    // Re-anchor when resuming so time spent paused never advances playback.
    lastTime = nowMs;
    status = totalDays === 0 ? "completed" : "playing";
  }

  return {
    /** A fresh value snapshot; the returned state cannot change controller state. */
    getState(): TimelineState {
      return { status, revealedDays, totalDays };
    },
    /** Start idle playback or continue paused playback; completed needs replay. */
    play,
    pause() {
      if (status === "playing") status = "paused";
    },
    advance(nowMs: number) {
      checkTime(nowMs);
      if (status !== "playing") return;
      elapsedMs = Math.min(durationMs, elapsedMs + Math.max(0, nowMs - lastTime));
      lastTime = Math.max(lastTime, nowMs);
      revealedDays = Math.floor(totalDays * (elapsedMs / durationMs));
      if (elapsedMs === durationMs) status = "completed";
    },
    skip() {
      elapsedMs = durationMs;
      revealedDays = totalDays;
      status = "completed";
    },
    /** Reset presentation only; the caller's loaded data is retained. */
    replay(nowMs: number) {
      checkTime(nowMs);
      elapsedMs = 0;
      revealedDays = 0;
      status = "idle";
      play(nowMs);
    },
  };
}
