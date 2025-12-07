export type AppScreen = "boot" | "loading" | "timer" | "finished" | "settings";
export type TimerMode = "focus" | "break";
export type TimerStatus = "idle" | "running" | "paused";
export type DurationSettings = Record<TimerMode, number>;

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  endsAt: number | null;
  remainingMs: number;
  durations: DurationSettings;
}

export interface AppState {
  screen: AppScreen;
  timer: TimerState;
  completedMode: TimerMode | null;
  completedFocusSessions: number;
}
