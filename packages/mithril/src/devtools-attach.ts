// The blessed zero-touch devtools entry point (spec §9.2): `import "mithril/devtools/attach"` fans every run
// in the process out to the local inspector, with no other code change. Re-exports the helpers for explicit
// control. No-ops in production unless MITHRIL_DEVTOOLS is set.
import "@mithril/devtools/attach";

export { attachDevtools, DEVTOOLS_CHANNEL, devtoolsEnabled } from "@mithril/devtools/attach";
