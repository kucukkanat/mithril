/*
 * The default module registry the require-shim serves to sandboxed snippets. Every entry is the
 * REAL package — the same source that ships to npm — statically imported so the host bundler
 * (Vite/Rollup, or Bun in tests) resolves and bundles it into the worker chunk.
 */

import * as coreAgent from "@mithril/core/agent";
import * as coreProtocol from "@mithril/core/protocol";
import * as testkit from "@mithril/core/testkit";
import * as memory from "@mithril/memory";
import * as kv from "@mithril/kv";
import * as kvIndexedDb from "@mithril/kv/indexeddb";
import * as fs from "@mithril/fs";
import * as fsOpfs from "@mithril/fs/opfs";
import * as vectors from "@mithril/vectors";
import * as workflows from "@mithril/workflows";
import * as otel from "@mithril/otel";
import * as mithrilMeta from "mithril";
import { anthropic } from "mithril/anthropic";
import { openai, openaiProvider } from "mithril/openai";
import { google } from "@mithril/providers/google";
import { transformers as transformersRaw, DEFAULT_MODEL } from "mithril/transformers";
import { z } from "zod";
import type { DownloadReport } from "./protocol.ts";

/** Options for {@link defaultModules}. */
export interface DefaultModulesOptions {
  /**
   * Receives local-model weight download / load progress. The registry wraps the `transformers`
   * handle so a plain `transformers("…")` in a snippet streams progress with no user plumbing.
   */
  readonly onProgress?: (report: DownloadReport) => void;
}

/**
 * Build the default registry of modules a sandboxed snippet may `import`. Keys are the import
 * specifiers; values are the already-evaluated module namespaces the require-shim hands back.
 *
 * Extend or override per host via {@link InstallRunnerOptions.extraModules | installRunner's extraModules}.
 */
export function defaultModules(opts?: DefaultModulesOptions): Record<string, unknown> {
  const onProgress = opts?.onProgress;
  // Wrap the local handle so weight-download/load progress rides the host's progress channel.
  const transformers: typeof transformersRaw =
    onProgress === undefined
      ? transformersRaw
      : (model, o) => transformersRaw(model, { ...o, onProgress });
  return {
    mithril: mithrilMeta,
    "mithril/anthropic": { anthropic },
    "mithril/openai": { openai, openaiProvider },
    "mithril/transformers": { transformers, DEFAULT_MODEL },
    "@mithril/providers/google": { google },
    "@mithril/core/agent": coreAgent,
    "@mithril/core/protocol": coreProtocol,
    "@mithril/core/testkit": testkit,
    "@mithril/memory": memory,
    "@mithril/kv": kv,
    "@mithril/kv/indexeddb": kvIndexedDb,
    "@mithril/fs": fs,
    "@mithril/fs/opfs": fsOpfs,
    "@mithril/vectors": vectors,
    "@mithril/workflows": workflows,
    "@mithril/otel": otel,
    zod: { z },
  };
}
