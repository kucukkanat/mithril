// The UI↔worker message protocol lives in @mithril/runner-web — re-exported here so the
// playground's components keep their local import paths.
export type {
  DownloadReport,
  LogLevel,
  ResumeDirective,
  RunnerMessage,
  RunnerRequest,
  RunStatus,
  SuspendedInfo,
} from "@mithril/runner-web";

// The playground's approve/reject card sends a subset of core's full ResumeValue; the wider
// type keeps the docs UI forward-compatible with edit/resolve decisions.
export type { ResumeValue as ApprovalDecision } from "@mithril/runner-web";
