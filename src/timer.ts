import type { DurationSettings, TimerState } from "./state";

export const DEFAULT_DURATIONS: DurationSettings = {
  focus: 25 * 60 * 1000,
  break: 5 * 60 * 1000,
};

export function createTimerState(durations: DurationSettings = DEFAULT_DURATIONS): TimerState {
  return {
    mode: "focus",
    status: "idle",
    endsAt: null,
    remainingMs: durations.focus,
    durations: { ...durations },
  };
}

export function getRemainingTime(timer: TimerState, now = Date.now()): number {
  if (timer.status === "running" && timer.endsAt !== null) {
    return Math.max(0, timer.endsAt - now);
  }
  return Math.max(0, timer.remainingMs);
}

export function startTimer(timer: TimerState, now = Date.now()): void {
  if (timer.status === "running") return;
  timer.endsAt = now + timer.remainingMs;
  timer.status = "running";
}

export function pauseTimer(timer: TimerState, now = Date.now()): void {
  if (timer.status !== "running") return;
  timer.remainingMs = getRemainingTime(timer, now);
  timer.endsAt = null;
  timer.status = "paused";
}

export function resetTimer(timer: TimerState): void {
  timer.remainingMs = timer.durations[timer.mode];
  timer.endsAt = null;
  timer.status = "idle";
}

export function skipTimer(timer: TimerState): void {
  timer.mode = timer.mode === "focus" ? "break" : "focus";
  resetTimer(timer);
}

export function completeSession(timer: TimerState, now = Date.now()): boolean {
  if (timer.status !== "running" || getRemainingTime(timer, now) > 0) return false;
  skipTimer(timer);
  return true;
}
