import type { AppState } from "./state";
import { createMacintoshShell, renderScreen } from "./ui";

export function initializeApp(root: HTMLElement): void {
  const state: AppState = { screen: "boot" };
  const screen = createMacintoshShell(root);

  function openTimer(): void {
    if (state.screen !== "boot") return;

    state.screen = "timer";
    renderScreen(screen, state, openTimer);
    screen.querySelector<HTMLElement>("h1")?.focus();
  }

  renderScreen(screen, state, openTimer);
}
