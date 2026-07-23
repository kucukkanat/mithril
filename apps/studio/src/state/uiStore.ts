/*
 * Cross-cutting UI state that isn't a project or a setting: the command palette + shortcut cheat-sheet
 * open flags, a "run intent" nonce (so ⌘↵ can trigger a run from anywhere), and the one-time
 * post-run coach-mark dismissal (persisted).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  readonly paletteOpen: boolean;
  readonly cheatsheetOpen: boolean;
  /**
   * A one-shot "run the agent" intent. A consumable BOOLEAN (not a nonce): `requestRun()` sets it before
   * navigating to /run, and the Run page consumes it on mount — so an intent raised *before* the Run page
   * exists is still honored (a mount-local ref could never see a pre-mount change).
   */
  readonly runRequested: boolean;
  /** True once the user has dismissed the one post-run coach-mark. */
  readonly coachDismissed: boolean;
  setPalette(open: boolean): void;
  setCheatsheet(open: boolean): void;
  requestRun(): void;
  consumeRun(): void;
  dismissCoach(): void;
  resetCoach(): void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      paletteOpen: false,
      cheatsheetOpen: false,
      runRequested: false,
      coachDismissed: false,
      setPalette: (open) => set({ paletteOpen: open, ...(open ? { cheatsheetOpen: false } : {}) }),
      setCheatsheet: (open) => set({ cheatsheetOpen: open, ...(open ? { paletteOpen: false } : {}) }),
      requestRun: () => set({ runRequested: true }),
      consumeRun: () => set({ runRequested: false }),
      dismissCoach: () => set({ coachDismissed: true }),
      resetCoach: () => set({ coachDismissed: false }),
    }),
    { name: "mithril-studio-ui", partialize: (s) => ({ coachDismissed: s.coachDismissed }) },
  ),
);
