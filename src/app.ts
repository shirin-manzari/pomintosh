import type { AppState, DurationSettings } from "./state";
import { loadSettings, saveSettings } from "./storage";
import { createAppSounds } from "./audio";
import { initializeDesktop, syncDesktopTimer } from "./desktop";
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
  renderLoadingScreen,
  renderSessionHearts,
  renderSettingsScreen,
  renderTimerScreen,
} from "./ui";

export function initializeApp(root: HTMLElement): void {
  const state: AppState = {
    screen: "boot",
    timer: createTimerState(loadSettings()),
    completedMode: null,
    completedFocusSessions: 0,
  };
  const screen = createMacintoshShell(root);
  const sounds = createAppSounds();
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
      void sounds.playCompletion();
      return true;
    }
    updateTimerView?.(state, getRemainingTime(state.timer, now));
    return false;
  }

  function toggleTimer(): void {
    const now = Date.now();
    if (refreshTimer(now)) return;
    sounds.unlock();
    if (state.timer.status === "running") pauseTimer(state.timer, now);
    else startTimer(state.timer, now);
    syncDesktopTimer(state.timer);
    refreshTimer();
  }

  function resetCurrentTimer(): void {
    if (refreshTimer()) return;
    resetTimer(state.timer);
    syncDesktopTimer(state.timer);
    refreshTimer();
  }

  function skipCurrentTimer(): void {
    // An expired session already moves to the next mode during refresh.
    if (refreshTimer()) return;
    skipTimer(state.timer);
    syncDesktopTimer(state.timer);
    refreshTimer();
  }

  function openTimer(): void {
    if (state.screen !== "boot") return;

    sounds.unlock();
    void sounds.playStartup();
    state.screen = "loading";
    const loadingDurationMs = 900;
    renderLoadingScreen(screen, loadingDurationMs);
    window.setTimeout(() => {
      showTimerScreen();
      window.setInterval(refreshTimer, 250);
    }, loadingDurationMs);
  }

  function acknowledgeCompletion(): void {
    if (state.screen !== "finished") return;
    showTimerScreen();
  }

  function openSettings(): void {
    const now = Date.now();
    if (refreshTimer(now)) return;
    pauseTimer(state.timer, now);
    syncDesktopTimer(state.timer);
    state.screen = "settings";
    updateTimerView = null;
    renderSettingsScreen(screen, state.timer.durations, saveDurations, cancelSettings);
  }

  function saveDurations(durations: DurationSettings): boolean {
    if (!saveSettings(durations)) return false;
    state.timer.durations = { ...durations };
    resetTimer(state.timer);
    syncDesktopTimer(state.timer);
    showTimerScreen();
    return true;
  }

  function cancelSettings(): void {
    if (state.screen !== "settings") return;
    showTimerScreen();
    screen.querySelector<HTMLButtonElement>(".settings-button")?.focus();
  }

  function showTimerScreen(): void {
    state.screen = "timer";
    state.completedMode = null;
    updateTimerView = renderTimerScreen(screen, {
      toggleTimer,
      resetTimer: resetCurrentTimer,
      skipTimer: skipCurrentTimer,
      openSettings,
    });
    renderSessionHearts(screen, state.completedFocusSessions);
    refreshTimer();
    screen.querySelector<HTMLButtonElement>(".timer-controls button")?.focus();
  }

  renderBootScreen(screen, openTimer);
  initializeDesktop(() => refreshTimer());
  syncDesktopTimer(state.timer);

  window.addEventListener("focus", () => refreshTimer());
  document.addEventListener("visibilitychange", () => refreshTimer());
  window.addEventListener("pageshow", () => refreshTimer());
  document.addEventListener("keydown", (event) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (state.screen === "settings" && event.key === "Escape") {
      event.preventDefault();
      cancelSettings();
      return;
    }
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
