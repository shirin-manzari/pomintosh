import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { TimerState } from "./state";

let pendingUpdate = Promise.resolve();

export function startDesktopDrag(event: MouseEvent): void {
  if (!isTauri() || event.button !== 0) return;
  const target = event.target;
  if (!(target instanceof HTMLElement) || target.closest(".macintosh-screen")) return;
  event.preventDefault();
  void getCurrentWindow().startDragging().catch((error: unknown) => {
    console.warn("Could not move the desktop window:", error);
  });
}

export function initializeDesktop(refreshTimer: () => void): void {
  if (!isTauri()) return;
  void listen("session-deadline", refreshTimer).catch((error: unknown) => {
    console.warn("Desktop events unavailable:", error);
  });
}

export function syncDesktopTimer(timer: TimerState): void {
  if (!isTauri()) return;
  const endsAt = timer.status === "running" ? timer.endsAt : null;
  const mode = timer.mode;
  // Preserve click order when Start, Pause, or Reset happen close together.
  pendingUpdate = pendingUpdate
    .then(() => invoke<void>("set_notification_deadline", { endsAt, mode }))
    .catch((error: unknown) => {
      console.warn("Desktop notification scheduling unavailable:", error);
    });
}
