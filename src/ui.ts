import macBodyUrl from "./assets/mac-body.png";
import smileFaceUrl from "./assets/smile-face.svg";
import type { AppState } from "./state";

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

export function renderScreen(
  screen: HTMLElement,
  state: AppState,
  openTimer: () => void,
): void {
  if (state.screen === "boot") {
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
    return;
  }

  const timerScreen = document.createElement("div");
  timerScreen.className = "timer-screen";

  const mode = document.createElement("h1");
  mode.textContent = "Focus";
  mode.tabIndex = -1;

  const time = document.createElement("p");
  time.className = "timer-digits";
  time.textContent = "25:00";
  time.setAttribute("aria-label", "25 minutes");

  const status = document.createElement("p");
  status.className = "timer-status";
  status.textContent = "ready for a focus session";

  timerScreen.append(mode, time, status);
  screen.replaceChildren(timerScreen);
}
