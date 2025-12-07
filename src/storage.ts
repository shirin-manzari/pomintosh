import type { DurationSettings } from "./state";
import { DEFAULT_DURATIONS } from "./timer.ts";

const settingsKey = "minimac-durations-v1";
export const MAX_DURATION_MS = 180 * 60 * 1000;

export function isValidDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value)
    && value >= 1000 && value <= MAX_DURATION_MS && value % 1000 === 0;
}

export function loadSettings(storage?: Pick<Storage, "getItem">): DurationSettings {
  try {
    const raw = (storage ?? localStorage).getItem(settingsKey);
    const saved: unknown = raw ? JSON.parse(raw) : null;
    if (typeof saved === "object" && saved !== null && "focus" in saved && "break" in saved
      && isValidDuration(saved.focus) && isValidDuration(saved.break)) {
      return { focus: saved.focus, break: saved.break };
    }
  } catch {
    // Unavailable storage or invalid JSON should not prevent startup.
  }
  return { ...DEFAULT_DURATIONS };
}

export function saveSettings(settings: DurationSettings, storage?: Pick<Storage, "setItem">): boolean {
  if (!isValidDuration(settings.focus) || !isValidDuration(settings.break)) return false;
  try {
    (storage ?? localStorage).setItem(settingsKey, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
