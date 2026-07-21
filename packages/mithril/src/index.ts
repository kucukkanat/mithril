// The blessed path: one import. Batteries-included re-exports of the core protocol + agent surface.
// Providers are subpath imports (`mithril/openai`, `mithril/anthropic`) so their code tree-shakes out of
// bundles that don't use them.
export * from "@mithril/core/protocol";
export * from "@mithril/core/agent";
