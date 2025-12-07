import type { AppState } from "./state";
import { createCompletionSound } from "./audio";
import {
  completeSession,
  createTimerState,
  getRemainingTime,
  pauseTimer,
  resetTimer,
  skipTimer,
  startTimer,
} from "./timer";
import {
  createMacintoshShell,
  renderBootScreen,
  renderFinishedScreen,
  renderSessionHearts,
  renderTimerScreen,
} from "./ui";

export function initializeApp(root: HTMLElement): void {
  const state: AppState = {
    screen: "boot",
    timer: createTimerState(),
    completedMode: null,
    completedFocusSessions: 0,
  };
  const screen = createMacintoshShell(root);
  const completionSound = createCompletionSound();
  let updateTimerView: ReturnType<typeof renderTimerScreen> | null = null;

  function refreshTimer(now = Date.now()): boolean {
    if (state.screen !== "timer") return false;
    const mode = state.timer.mode;
    if (completeSession(state.timer, now)) {
      if (mode === "focus") state.completedFocusSessions += 1;
      state.completedMode = mode;
      state.screen = "finished";
      updateTimerView = null;
      renderFinishedScreen(screen, state.completedMode, acknowledgeCompletion);
      renderSessionHearts(screen, state.completedFocusSessions);
      void completionSound.play();
      return true;
    }
    updateTimerView?.(state, getRemainingTime(state.timer, now));
    return false;
  }

  function toggleTimer(): void {
    const now = Date.now();
    if (refreshTimer(now)) return;
    completionSound.unlock();
    if (state.timer.status === "running") pauseTimer(state.timer, now);
    else startTimer(state.timer, now);
    refreshTimer();
  }

  function resetCurrentTimer(): void {
    if (refreshTimer()) return;
    resetTimer(state.timer);
    refreshTimer();
  }

  function skipCurrentTimer(): void {
    // An expired session already moves to the next mode during refresh.
    if (refreshTimer()) return;
    skipTimer(state.timer);
    refreshTimer();
  }

  function openTimer(): void {
    if (state.screen !== "boot") return;

    completionSound.unlock();
    showTimerScreen();
    window.setInterval(refreshTimer, 250);
  }

  function acknowledgeCompletion(): void {
    if (state.screen !== "finished") return;
    showTimerScreen();
  }

  function showTimerScreen(): void {
    state.screen = "timer";
    state.completedMode = null;
    updateTimerView = renderTimerScreen(screen, {
      toggleTimer,
      resetTimer: resetCurrentTimer,
      skipTimer: skipCurrentTimer,
    });
    renderSessionHearts(screen, state.completedFocusSessions);
    refreshTimer();
    screen.querySelector<HTMLButtonElement>(".timer-controls button")?.focus();
  }

  renderBootScreen(screen, openTimer);

  window.addEventListener("focus", () => refreshTimer());
  document.addEventListener("visibilitychange", () => refreshTimer());
  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable]")) return;

    if (state.screen === "finished" && (event.code === "Space" || event.code === "Enter")) {
      if (target instanceof HTMLElement && target.closest("button")) return;
      event.preventDefault();
      acknowledgeCompletion();
      return;
    }
    if (state.screen !== "timer") return;

    // Buttons keep their native Space action, including Reset and Skip.
    if (event.code === "Space" && target instanceof HTMLElement && target.closest("button")) return;
    if (event.code === "Space") {
      event.preventDefault();
      toggleTimer();
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      resetCurrentTimer();
    } else if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      skipCurrentTimer();
    }
  });
}
