import macBodyUrl from "./assets/mac-body.png";
import smileFaceUrl from "./assets/smile-face.svg";
import heartUrl from "./assets/heart.svg";
import settingsUrl from "./assets/settings.svg";
import type { AppState, DurationSettings, TimerMode } from "./state";
import { isValidDuration, MAX_DURATION_MS } from "./storage";

const buttonLabels = { idle: "Start", running: "Pause", paused: "Resume" };

export function renderSessionHearts(screen: HTMLElement, count: number): void {
  if (count === 0) return;

  const hearts = document.createElement("div");
  hearts.className = "session-hearts";
  hearts.setAttribute("role", "img");
  hearts.setAttribute("aria-label", `${count} completed focus ${count === 1 ? "session" : "sessions"}`);

  const heart = document.createElement("img");
  heart.src = heartUrl;
  heart.alt = "";
  heart.width = 9;
  heart.height = 8;
  heart.draggable = false;
  hearts.append(heart);

  if (count > 1) {
    const extra = document.createElement("span");
    extra.textContent = String(count);
    hearts.append(extra);
  }
  screen.append(hearts);
}

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
    openSettings: () => void;
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

  const settings = document.createElement("button");
  settings.className = "settings-button";
  settings.type = "button";
  settings.setAttribute("aria-label", "Settings");
  const settingsIcon = document.createElement("img");
  settingsIcon.src = settingsUrl;
  settingsIcon.alt = "";
  settingsIcon.width = settingsIcon.height = 16;
  settingsIcon.draggable = false;
  settings.append(settingsIcon);
  settings.addEventListener("click", actions.openSettings);

  timerScreen.append(time, controls, status, settings);
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

function createDurationField(form: HTMLFormElement, mode: TimerMode, durationMs: number) {
  const row = document.createElement("div");
  row.className = "duration-row";
  const label = document.createElement("label");
  label.textContent = mode === "focus" ? "Focus" : "Break";
  label.htmlFor = `${mode}-duration`;

  const input = document.createElement("input");
  input.id = label.htmlFor;
  input.type = "number";
  input.min = "1";
  input.step = "1";

  const unit = document.createElement("select");
  unit.setAttribute("aria-label", `${label.textContent} time unit`);
  unit.add(new Option("min", "60000"));
  unit.add(new Option("sec", "1000"));
  unit.value = durationMs % 60000 === 0 ? "60000" : "1000";
  input.value = String(durationMs / Number(unit.value));

  function updateLimit(): void {
    input.max = String(MAX_DURATION_MS / Number(unit.value));
  }
  unit.addEventListener("change", updateLimit);
  updateLimit();
  row.append(label, input, unit);
  form.append(row);
  return { input, unit };
}

export function renderSettingsScreen(
  screen: HTMLElement,
  durations: DurationSettings,
  saveDurations: (durations: DurationSettings) => boolean,
  cancelSettings: () => void,
): void {
  const form = document.createElement("form");
  form.className = "settings-screen";
  form.noValidate = true;
  const heading = document.createElement("h1");
  heading.textContent = "Settings";
  const note = document.createElement("p");
  note.className = "settings-note";
  note.hidden = true;
  const fields = {
    focus: createDurationField(form, "focus", durations.focus),
    break: createDurationField(form, "break", durations.break),
  };

  const controls = document.createElement("div");
  controls.className = "settings-controls";
  const save = document.createElement("button");
  save.type = "submit";
  save.textContent = "Save";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", cancelSettings);
  controls.append(save, cancel);
  form.prepend(heading, note);
  form.append(controls);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const settings = {
      focus: fields.focus.input.valueAsNumber * Number(fields.focus.unit.value),
      break: fields.break.input.valueAsNumber * Number(fields.break.unit.value),
    };
    for (const mode of ["focus", "break"] as const) {
      const valid = isValidDuration(settings[mode]) && Number.isInteger(fields[mode].input.valueAsNumber);
      fields[mode].input.setAttribute("aria-invalid", String(!valid));
      if (!valid) {
        note.hidden = false;
        note.textContent = settings[mode] > MAX_DURATION_MS
          ? "Max 180 min / 10800 sec."
          : "Use whole numbers above 0.";
        note.setAttribute("role", "alert");
        fields[mode].input.focus();
        return;
      }
    }
    if (!saveDurations(settings)) {
      note.hidden = false;
      note.textContent = "Could not save preferences.";
      note.setAttribute("role", "alert");
    }
  });
  screen.replaceChildren(form);
  fields.focus.input.focus();
}

export function renderFinishedScreen(
  screen: HTMLElement,
  completedMode: TimerMode,
  acknowledgeCompletion: () => void,
): void {
  const finished = document.createElement("button");
  finished.className = "finished-screen";
  finished.type = "button";

  const message = document.createElement("span");
  message.className = "finished-message";
  message.textContent =
    completedMode === "focus" ? "Focus complete!" : "Break complete!";

  const prompt = document.createElement("span");
  prompt.className = "finished-prompt";
  prompt.textContent =
    completedMode === "focus" ? "Continue to break" : "Continue to focus";

  finished.append(message, prompt);
  finished.addEventListener("click", acknowledgeCompletion);
  screen.replaceChildren(finished);
  finished.focus();
}
