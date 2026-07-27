/**
 * The shared model picker — one provider-setup + model-selection surface for the docs playground and
 * the Studio.
 *
 * Import the component and its stylesheet:
 *
 * ```ts
 * import { ModelPicker } from "@mithril-internal/model-picker";
 * import "@mithril-internal/model-picker/model-picker.css";
 * ```
 *
 * The catalog, fuzzy search, and connection probe it is built on live in `@mithril/runner-web`, so
 * non-React callers (and tests) can use them without pulling in the UI.
 */

export { ModelPicker, type ModelPickerProps } from "./ModelPicker.tsx";
export { ModelCombobox, type ModelComboboxProps } from "./ModelCombobox.tsx";
export { ProviderSetup, type ProviderSetupProps } from "./ProviderSetup.tsx";
export type { ModelKind, ModelSelection, ProviderConnection, ProviderConnections } from "./types.ts";
export { connectionEnv, providersOf, selectionEnv } from "./env.ts";
