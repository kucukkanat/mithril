import { useEffect } from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { ProjectListPage } from "./pages/ProjectListPage.tsx";
import { DesignerPage } from "./pages/DesignerPage.tsx";
import { RunPage } from "./pages/RunPage.tsx";
import { SettingsPage } from "./pages/SettingsPage.tsx";
import { CommandPalette } from "./components/CommandPalette.tsx";
import { ShortcutCheatsheet } from "./components/ShortcutCheatsheet.tsx";
import { installShortcuts } from "./lib/shortcuts.ts";

// Hash routing keeps the app deployable on any static host with zero rewrite rules — and leaves
// the path namespace clean for the future `#s=` share-URL codec.
const router = createHashRouter([
  { path: "/", element: <ProjectListPage /> },
  { path: "/p/:id", element: <DesignerPage /> },
  { path: "/p/:id/run", element: <RunPage /> },
  { path: "/settings", element: <SettingsPage /> },
]);

export function App() {
  // The global keyboard layer + palette live OUTSIDE the route tree (they drive the router directly),
  // so they work identically on every page.
  useEffect(() => installShortcuts(router), []);
  return (
    <>
      <RouterProvider router={router} />
      <CommandPalette router={router} />
      <ShortcutCheatsheet />
    </>
  );
}
