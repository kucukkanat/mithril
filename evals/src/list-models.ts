/**
 * Convenience CLI: list the on-device local models the eval suite can run against. These come straight
 * from `@mithril/runner-web`'s {@link LOCAL_MODELS} catalog (the same source {@link selectedModels}
 * uses), so this list never drifts from what actually runs. Any model shown here is a valid value for
 * the `MITHRIL_EVAL_MODELS` filter (by repo id OR label).
 *
 * Run it:  bun run models
 */
import { LOCAL_MODELS } from "@mithril/runner-web";

/** Left-pad-free column: pad `value` with spaces to `width` (for a simple aligned table). */
function pad(value: string, width: number): string {
  return value.length >= width ? value : value + " ".repeat(width - value.length);
}

function main(): void {
  const rows = LOCAL_MODELS.map((m) => ({
    label: m.label,
    id: m.id,
    size: m.size,
    dtype: m.dtype ?? "—",
    tools: m.tools ? "yes" : "no",
  }));

  const widths = {
    label: Math.max(5, ...rows.map((r) => r.label.length)),
    id: Math.max(8, ...rows.map((r) => r.id.length)),
    size: Math.max(4, ...rows.map((r) => r.size.length)),
    dtype: Math.max(5, ...rows.map((r) => r.dtype.length)),
  };

  console.log(`\nLocal models available to the eval suite (${rows.length}):\n`);
  console.log(
    `  ${pad("MODEL", widths.label)}  ${pad("REPO ID", widths.id)}  ${pad("SIZE", widths.size)}  ${pad("DTYPE", widths.dtype)}  TOOLS`,
  );
  for (const r of rows) {
    console.log(
      `  ${pad(r.label, widths.label)}  ${pad(r.id, widths.id)}  ${pad(r.size, widths.size)}  ${pad(r.dtype, widths.dtype)}  ${r.tools}`,
    );
  }
  console.log(
    `\nRun a subset with MITHRIL_EVAL_MODELS — comma-separated repo ids OR labels, matched\n` +
      `case-insensitively and fuzzily (spaces/dashes/dots ignored; partials & typos OK), e.g.:\n` +
      `  MITHRIL_EVAL_MODELS="${rows[0]?.label ?? ""}" bun run eval:html\n`,
  );
}

main();
