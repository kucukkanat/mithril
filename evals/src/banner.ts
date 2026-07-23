/**
 * A small, dependency-free terminal banner shown at the top of every eval run, so a developer sees —
 * at a glance, before promptfoo's own output scrolls by — exactly which models and suites are about to
 * run. Rendered from {@link selectedModels}, so it always reflects the real (possibly filtered) matrix.
 *
 * Styling is Mithril-metallic but restrained, and **degrades gracefully**: colors/box-drawing are
 * emitted only to a real TTY (and suppressed under `NO_COLOR` or `TERM=dumb`), so piped/CI logs stay
 * clean plain text.
 */
import type { EvalModel } from "./models.ts";

const useColor = process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined && process.env["TERM"] !== "dumb";

/** Wrap `s` in an ANSI SGR code, or return it untouched when color is disabled. */
function sgr(code: string, s: string): string {
  return useColor ? `\x1b[${code}m${s}\x1b[0m` : s;
}
const bold = (s: string): string => sgr("1", s);
const dim = (s: string): string => sgr("2", s);
const cyan = (s: string): string => sgr("36", s);
const silver = (s: string): string => sgr("37", s);
const yellow = (s: string): string => sgr("33", s);

/** Visible length of a string, ignoring ANSI escape codes (for box-width math). */
function visibleLen(s: string): number {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "").length;
}

/** Right-pad `raw` (uncolored) to `width` visible columns. */
function pad(raw: string, width: number): string {
  return raw.length >= width ? raw : raw + " ".repeat(width - raw.length);
}

/** Render the collected inner lines inside a rounded box, sizing to the widest visible line. */
function box(lines: readonly string[]): string {
  const width = Math.max(0, ...lines.map(visibleLen));
  const top = dim(`╭${"─".repeat(width + 2)}╮`);
  const bottom = dim(`╰${"─".repeat(width + 2)}╯`);
  const body = lines
    .map((line) => `${dim("│")} ${line}${" ".repeat(width - visibleLen(line))} ${dim("│")}`)
    .join("\n");
  return `${top}\n${body}\n${bottom}`;
}

/**
 * Print the run banner: a titled box listing every model to be evaluated (label, size, dtype, repo id)
 * and the suites that will run. `sizeOf` supplies the catalog size string for a model's repo id.
 */
export function printRunBanner(
  models: readonly EvalModel[],
  suites: readonly string[],
  sizeOf: (repoId: string) => string | undefined,
  healingVariants: readonly string[] = ["full"],
): void {
  const filter = process.env["MITHRIL_EVAL_MODELS"];
  const lines: string[] = [];

  lines.push(bold(silver("◈ Mithril evals")));
  const variantScope = healingVariants.length > 1 ? ` · ${healingVariants.length} healing variants` : "";
  const scope = `${models.length} model${models.length === 1 ? "" : "s"} · ${suites.length} suite${suites.length === 1 ? "" : "s"}${variantScope} · on-device · CPU · no network`;
  lines.push(dim(scope));
  if (filter !== undefined && filter.trim().length > 0) {
    lines.push(dim(`filter: MITHRIL_EVAL_MODELS=${JSON.stringify(filter)}`));
  }
  if (healingVariants.length > 1) {
    lines.push(dim(`healing: ${healingVariants.join(dim(" · "))}`));
  }
  lines.push("");

  if (models.length === 0) {
    lines.push(yellow("no models matched the filter — nothing to run (try 'bun run models')"));
  } else {
    const wLabel = Math.max(5, ...models.map((m) => m.label.length));
    const sizes = models.map((m) => sizeOf(m.repoId) ?? "—");
    const wSize = Math.max(4, ...sizes.map((s) => s.length));
    const wDtype = Math.max(5, ...models.map((m) => (m.dtype ?? "—").length));

    lines.push(dim(`${pad("MODEL", wLabel)}  ${pad("SIZE", wSize)}  ${pad("DTYPE", wDtype)}  REPO ID`));
    models.forEach((m, i) => {
      const label = cyan(pad(m.label, wLabel));
      const size = pad(sizes[i] ?? "—", wSize);
      const dtype = pad(m.dtype ?? "—", wDtype);
      lines.push(`${bold(label)}  ${size}  ${dtype}  ${dim(m.repoId)}`);
    });
    lines.push("");
    lines.push(`${dim("Suites:")} ${silver(suites.join(dim(" · ")))}`);
  }

  process.stdout.write(`\n${box(lines)}\n\n`);
}
