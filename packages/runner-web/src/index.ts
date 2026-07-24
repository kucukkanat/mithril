/**
 * In-browser runner for Mithril agents. The worker half (`@mithril/runner-web/worker`) transpiles
 * user TypeScript with sucrase, injects the REAL framework packages through a require shim, and
 * streams every MithrilEvent back; this entry is the main-thread half — the message
 * {@link RunnerRequest | protocol}, the {@link createRunnerClient | client state machine}, and the
 * shared provider/model {@link LIVE_PROVIDERS | catalog}.
 *
 * @packageDocumentation
 */

export type {
  DownloadReport,
  LogLevel,
  ResumeDirective,
  ResumeValue,
  RunnerMessage,
  RunnerRequest,
  RunStatus,
  SuspendedInfo,
} from "./protocol.ts";
export {
  createRunnerClient,
  describeRunnerError,
  IDLE_RUNNER_SNAPSHOT,
  type LogLine,
  type RunnerClient,
  type RunnerRunOptions,
  type RunnerSnapshot,
} from "./client.ts";
export {
  ALL_BACKENDS,
  DEFAULT_LOCAL_MODEL,
  LIVE_PROVIDERS,
  liveProvider,
  LOCAL_MODELS,
  localModel,
  modelBackends,
  requiresWebGPU,
  type Backend,
  type LiveProvider,
  type LiveProviderId,
  type LocalModel,
  type ProviderMode,
} from "./catalog.ts";
export { hasWebGPU } from "./webgpu.ts";
