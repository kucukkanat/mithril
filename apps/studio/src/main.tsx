import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
// Self-hosted, latin-subset only — the three type voices the token layer names. Archivo ships as a
// variable font so 400–700 costs one file; the other two are pinned to the weights actually used.
import "@fontsource-variable/archivo/wght.css";
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "@mithril-internal/design-tokens/tokens.css";
import "@mithril/devtools/ui.css";
import "./styles/app.css";

const root = document.getElementById("root");
if (root === null) throw new Error("Missing #root element");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
