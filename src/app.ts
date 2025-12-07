import type { AppState } from "./state";
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
  renderTimerScreen,
} from "./ui";

export function initializeApp(root: HTMLElement): void {
  const state: AppState = {
    screen: "boot",
    timer: createTimerState(),
  };
  const screen = createMacintoshShell(root);
  let updateTimerView: ReturnType<typeof renderTimerScreen> | null = null;

  function refreshTimer(now = Date.now()): boolean {
    if (state.screen !== "timer") return false;
    if (completeSession(state.timer, now)) {
      updateTimerView?.(state, getRemainingTime(state.timer, now));
      return true;
    }
    updateTimerView?.(state, getRemainingTime(state.timer, now));
    return false;
  }

  function toggleTimer(): void {
    const now = Date.now();
    if (refreshTimer(now)) return;
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

    showTimerScreen();
    window.setInterval(refreshTimer, 250);
  }

  function showTimerScreen(): void {
    state.screen = "timer";
    updateTimerView = renderTimerScreen(screen, {
      toggleTimer,
      resetTimer: resetCurrentTimer,
      skipTimer: skipCurrentTimer,
    });
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
