/*
 * A tiny, browser-safe WebGPU capability probe — shared by the docs playground and the Studio so both
 * gate WebGPU-only models (see `requiresWebGPU`) identically. No Node/Bun builtins: it only touches
 * `navigator.gpu`, guarded, so it stays runtime-agnostic (`check:browser-safe`). Returns `false` anywhere
 * WebGPU is absent (Node/Bun, older browsers, blocked adapters).
 */

interface GpuLike {
  requestAdapter(): Promise<unknown>;
}

/**
 * Resolve whether this runtime can actually run a WebGPU model — presence of `navigator.gpu` **and** a
 * grantable adapter (some browsers expose the API but hand back `null`, e.g. no compatible GPU / a policy
 * block). Never throws; a rejected/absent adapter resolves to `false`.
 */
export async function hasWebGPU(): Promise<boolean> {
  const nav = (globalThis as { navigator?: { gpu?: GpuLike } }).navigator;
  const gpu = nav?.gpu;
  if (gpu === undefined) return false;
  try {
    return (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}
