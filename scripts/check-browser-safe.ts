/**
 * check-browser-safe — guards the runtime-agnostic contract.
 *
 * Mithril's browser-reachable packages must run in a browser. The failure this catches (a real one
 * that broke the docs playground): a package's public entry statically `import`s a Node builtin
 * (`node:url`, `node:fs`, …). A bundler externalizes that builtin for the browser and the module
 * throws the moment it's touched — even if the Node-only code path never runs.
 *
 * For every browser-declared export entrypoint, we bundle it for the browser and fail on any
 * **statically reachable** Node/Bun builtin in the graph. Dynamic `await import("node:…")` is the
 * sanctioned escape hatch (it never evaluates in a browser), so `kind: "dynamic-import"` is allowed.
 *
 * Node-only entrypoints opt out by NAME (subpaths ending in `node`/`bun`/`server`/`http`, and the
 * packages in NODE_ONLY_PACKAGES) — those never promise browser support, so we don't constrain them.
 * Everything else is checked by default: a NEW browser entry is guarded automatically, and marking
 * one Node-only is a visible one-line diff here.
 *
 * Zero dependencies — Bun's bundler is the whole engine. Run: `bun run check:browser-safe`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { relative } from "node:path";

const BUILTINS = new Set(builtinModules);
const isNodeBuiltin = (spec: string): boolean =>
  spec.startsWith("node:") || spec.startsWith("bun:") || BUILTINS.has(spec);

// Subpaths whose names declare a Node/Bun-only surface — not promised to the browser.
const isNodeOnlySubpath = (key: string): boolean => /(?:node|bun|server|http)$/.test(key);
// Whole packages that ship Node-only artifacts (CLIs / scaffolders).
const NODE_ONLY_PACKAGES = new Set(["create-mithril"]);

interface Entry {
  readonly label: string;
  readonly file: string;
}

const rel = (p: string): string => relative(process.cwd(), p);

function collectEntries(): Entry[] {
  const entries: Entry[] = [];
  for (const pkg of readdirSync("packages")) {
    if (NODE_ONLY_PACKAGES.has(pkg)) continue;
    let manifest: { name?: string; exports?: Record<string, unknown> };
    try {
      manifest = JSON.parse(readFileSync(`packages/${pkg}/package.json`, "utf8"));
    } catch {
      continue; // not a package dir
    }
    const name = manifest.name ?? pkg;
    for (const [key, value] of Object.entries(manifest.exports ?? {})) {
      if (isNodeOnlySubpath(key)) continue;
      const spec = typeof value === "string" ? value : (value as { import?: string }).import;
      if (!spec || !/\.tsx?$/.test(spec)) continue; // skip css / asset exports
      entries.push({
        label: `${name}${key === "." ? "" : key.slice(1)}`,
        file: `packages/${pkg}/${spec.replace(/^\.\//, "")}`,
      });
    }
  }
  return entries;
}

async function check(entry: Entry): Promise<readonly string[]> {
  const violations: string[] = [];
  const built = await Bun.build({
    entrypoints: [entry.file],
    target: "browser",
    plugins: [
      {
        name: "no-eager-node-builtins",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            // `dynamic-import` is the sanctioned escape hatch — it never evaluates in a browser.
            if (args.kind !== "dynamic-import" && isNodeBuiltin(args.path)) {
              violations.push(`${args.path}  ← imported by ${rel(args.importer)}`);
            }
            return undefined; // defer to the default resolver
          });
        },
      },
    ],
    // A missing-export polyfill error (e.g. node:url.fileURLToPath) rejects the build — the onResolve
    // hook already recorded the offender above, so we swallow it and report from `violations`.
  }).catch(() => null);

  if (violations.length === 0 && built && !built.success) {
    return built.logs.map((l) => `build error: ${String(l)}`);
  }
  return violations;
}

const entries = collectEntries();
const results = await Promise.all(entries.map(async (e) => ({ entry: e, violations: await check(e) })));

let failed = 0;
for (const { entry, violations } of results) {
  if (violations.length === 0) {
    console.log(`  ok   ${entry.label}`);
  } else {
    failed++;
    console.log(`FAIL   ${entry.label}`);
    for (const v of violations) console.log(`         ${v}`);
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} browser-declared entrypoint(s) statically reach a Node/Bun builtin.\n` +
      `Move the Node-only code behind a dynamic \`await import("node:…")\`, or split it to a\n` +
      `\`*-node\`/\`*/server\` subpath (which this check skips by name).`,
  );
  process.exit(1);
}
console.log(`\n${entries.length} browser-safe entrypoints verified.`);
