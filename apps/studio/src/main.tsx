import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
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
