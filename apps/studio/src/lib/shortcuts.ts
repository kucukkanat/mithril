/*
 * The global keyboard layer, installed once at the app root. It drives navigation directly through the
 * router object (no hook needed, so it can live outside the route tree) and toggles the ⌘K palette /
 * "?" cheat-sheet via the UI store. Text inputs keep their own keys — only ⌘K and Esc fire while typing.
 */
import type { createHashRouter } from "react-router-dom";
import { useUiStore } from "../state/uiStore.ts";

type Router = ReturnType<typeof createHashRouter>;

export function currentProjectId(pathname: string): string | null {
  return pathname.match(/^\/p\/([^/]+)/)?.[1] ?? null;
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
}

export function installShortcuts(router: Router): () => void {
  let lastG = 0;
  const nav = (path: string): void => {
    void router.navigate(path);
  };
  const onKey = (e: KeyboardEvent): void => {
    const ui = useUiStore.getState();
    const pid = currentProjectId(router.state.location.pathname);
    const mod = e.metaKey || e.ctrlKey;

    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      ui.setPalette(!ui.paletteOpen);
      return;
    }
    if (e.key === "Escape") {
      if (ui.paletteOpen) ui.setPalette(false);
      if (ui.cheatsheetOpen) ui.setCheatsheet(false);
      return;
    }
    // Everything below yields to text inputs (so ⌘⏎-to-send etc. keep working).
    if (isTyping(e.target)) return;

    if (mod && e.key === "Enter" && pid !== null) {
      e.preventDefault();
      ui.requestRun();
      if (!router.state.location.pathname.endsWith("/run")) nav(`/p/${pid}/run`);
      return;
    }
    if (mod && pid !== null && (e.key === "1" || e.key === "2" || e.key === "3")) {
      e.preventDefault();
      nav(e.key === "1" ? `/p/${pid}` : e.key === "2" ? `/p/${pid}/run` : `/p/${pid}/evals`);
      return;
    }
    if (e.key === "?") {
      e.preventDefault();
      ui.setCheatsheet(!ui.cheatsheetOpen);
      return;
    }
    // Linear-style `g d` / `g r` / `g e` chords.
    if (e.key === "g") {
      lastG = e.timeStamp;
      return;
    }
    if (pid !== null && e.timeStamp - lastG < 700 && (e.key === "d" || e.key === "r" || e.key === "e")) {
      lastG = 0;
      nav(e.key === "d" ? `/p/${pid}` : e.key === "r" ? `/p/${pid}/run` : `/p/${pid}/evals`);
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}
