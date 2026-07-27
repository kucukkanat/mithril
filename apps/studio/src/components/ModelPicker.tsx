/*
 * The Studio's model picker — now a thin adapter over the SHARED picker
 * (`@mithril-internal/model-picker`), which the docs playground mounts too.
 *
 * Only two things are Studio-specific and stay here: the spec's `ModelSpec` shape (the picker speaks
 * its own `ModelSelection`, so a `code` model's `CodeRegion` is unwrapped at this boundary) and where
 * connection settings come from (the settings store). Everything the user actually sees — the
 * segments, the fuzzy model search, the base-URL field, Test connection — is shared, so the two apps
 * can no longer drift.
 */

import type { ModelSelection } from "@mithril-internal/model-picker";
import { ModelPicker as SharedModelPicker } from "@mithril-internal/model-picker";
import type { ModelSpec } from "@mithril/spec";
import { useSettingsStore } from "../state/settingsStore.ts";

export interface ModelPickerProps {
  readonly value: ModelSpec;
  readonly onChange: (model: ModelSpec) => void;
  /** Hide the key field where the surrounding page already owns keys (Settings). */
  readonly showKey?: boolean;
}

/** The Studio offers every kind except `scripted` — a scripted double is the playground's affordance. */
const KINDS = ["live", "local", "code"] as const;

/** `ModelSpec` → the picker's vocabulary. The only lossy direction is `code`, whose region id is re-minted below. */
export function toSelection(model: ModelSpec): ModelSelection {
  switch (model.kind) {
    case "live":
      return { kind: "live", provider: model.provider, model: model.model };
    case "local":
      return { kind: "local", model: model.model, ...(model.dtype === undefined ? {} : { dtype: model.dtype }) };
    case "code":
      return { kind: "code", expr: model.expr.code };
  }
}

/** The picker's vocabulary → `ModelSpec`. `previous` is only used for the unreachable `scripted` case. */
export function toModelSpec(selection: ModelSelection, previous: ModelSpec): ModelSpec {
  switch (selection.kind) {
    case "live":
      return { kind: "live", provider: selection.provider, model: selection.model };
    case "local":
      return { kind: "local", model: selection.model, ...(selection.dtype === undefined ? {} : { dtype: selection.dtype }) };
    case "code":
      return { kind: "code", expr: { code: selection.expr } };
    case "scripted":
      // Unreachable: `scripted` is not in KINDS. Fall back rather than throw — a picker is not the
      // place to take the app down.
      return previous;
  }
}

export function ModelPicker({ value, onChange, showKey = true }: ModelPickerProps) {
  const connections = useSettingsStore((s) => s.connections);
  const setConnection = useSettingsStore((s) => s.setConnection);

  return (
    <SharedModelPicker
      value={toSelection(value)}
      onChange={(selection) => onChange(toModelSpec(selection, value))}
      kinds={KINDS}
      connections={connections}
      onConnectionChange={setConnection}
      showKey={showKey}
    />
  );
}
