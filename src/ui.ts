import macBodyUrl from "./assets/mac-body.png";
import smileFaceUrl from "./assets/smile-face.svg";
import type { AppState } from "./state";

const buttonLabels = { idle: "Start", running: "Pause", paused: "Resume" };

export function createMacintoshShell(root: HTMLElement): HTMLElement {
  const macintosh = document.createElement("div");
  macintosh.className = "macintosh";

  const artwork = document.createElement("img");
  artwork.className = "macintosh-body";
  artwork.src = macBodyUrl;
  artwork.alt = "";
  artwork.width = 1215;
  artwork.height = 1295;
  artwork.draggable = false;

  const screen = document.createElement("section");
  screen.className = "macintosh-screen";
  screen.setAttribute("aria-label", "Macintosh display");

  macintosh.append(artwork, screen);
  root.replaceChildren(macintosh);
  return screen;
}

export function renderBootScreen(
  screen: HTMLElement,
  openTimer: () => void,
): void {
  const bootButton = document.createElement("button");
  bootButton.className = "boot-screen";
  bootButton.type = "button";
  bootButton.setAttribute("aria-label", "Open Pomodoro timer");

  const smile = document.createElement("img");
  smile.className = "smile-face";
  smile.src = smileFaceUrl;
  smile.alt = "Happy Mac face";
  smile.width = 32;
  smile.height = 32;
  smile.draggable = false;

  bootButton.append(smile);
  bootButton.addEventListener("click", openTimer);
  screen.replaceChildren(bootButton);
}

export function renderTimerScreen(
  screen: HTMLElement,
  actions: {
    toggleTimer: () => void;
    resetTimer: () => void;
    skipTimer: () => void;
  },
): (state: AppState, remainingMs: number) => void {
  const timerScreen = document.createElement("div");
  timerScreen.className = "timer-screen";

  const time = document.createElement("div");
  time.className = "timer-digits";
  time.setAttribute("role", "timer");
  time.setAttribute("aria-live", "off");

  const status = document.createElement("p");
  status.className = "timer-status";
  status.setAttribute("role", "status");

  const controls = document.createElement("div");
  controls.className = "timer-controls";
  const toggle = document.createElement("button");
  const reset = document.createElement("button");
  const skip = document.createElement("button");
  toggle.type = reset.type = skip.type = "button";
  reset.textContent = "Reset";
  skip.textContent = "Skip";
  toggle.addEventListener("click", actions.toggleTimer);
  reset.addEventListener("click", actions.resetTimer);
  skip.addEventListener("click", actions.skipTimer);
  controls.append(toggle, reset, skip);

  timerScreen.append(time, controls, status);
  screen.replaceChildren(timerScreen);

  return (state, remainingMs) => {
    const name = state.timer.mode === "focus" ? "Focus" : "Break";
    time.setAttribute("aria-label", `${name} timer`);
    const seconds = Math.ceil(remainingMs / 1000);
    time.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    toggle.textContent = buttonLabels[state.timer.status];
    const message = state.timer.status === "paused" ? "Paused" : "";
    if (status.textContent !== message) status.textContent = message;
  };
}
