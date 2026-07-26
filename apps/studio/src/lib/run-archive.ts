/*
 * The run archive — what the runtime actually emitted, kept.
 *
 * Every run in Studio used to end the same way: `shapeOf(events)` was extracted, a verdict was stored, and
 * the events themselves were dropped on the floor. So the moment a run went wrong, the evidence explaining
 * WHY was already gone — you could see that a case failed, never what the model was thinking when it did.
 *
 * In the session this was built for, the answer was sitting in a `reasoning.delta`: the model saying "the
 * calendarreader might need some input to generate the list... without that info, I can't call the
 * function". That sentence was emitted, rendered 90 characters wide, and discarded.
 *
 * A sibling record at `runs:<projectId>`, like the casebook, and for the same reason: it is not a
 * declaration, so it has no business inside ProjectSpec. Ring-buffered, because an event log is unbounded
 * and a browser quota is not.
 */
import { indexedDbKv } from "@mithril/kv/indexeddb";
import type { MithrilEvent } from "@mithril/core/protocol";

/** How many runs are kept per project. Oldest are dropped first. */
export const ARCHIVE_LIMIT = 25;
/** Events kept per run. A runaway loop must not be able to fill the origin's storage quota. */
export const EVENTS_PER_RUN = 2_000;

/** One archived run. */
export interface ArchivedRun {
  readonly id: string;
  /** Epoch ms the run finished. */
  readonly at: number;
  /** What started it — a case id, or `null` for a scratch chat turn. */
  readonly caseId: string | null;
  /** The input the run was given, for identifying it in a list. */
  readonly input: string;
  readonly status: "done" | "error";
  readonly events: readonly MithrilEvent[];
  /** Set when the archive dropped events to stay inside the per-run cap — never silently truncated. */
  readonly truncated?: number;
}

const kv = indexedDbKv({ dbName: "mithril-studio", storeName: "projects" });
const key = (projectId: string): string => `runs:${projectId}`;

/** Every archived run for a project, newest first. */
export async function loadRuns(projectId: string): Promise<readonly ArchivedRun[]> {
  return (await kv.get<readonly ArchivedRun[]>(key(projectId))) ?? [];
}

/**
 * Append one run, newest first, dropping the oldest past {@link ARCHIVE_LIMIT}.
 *
 * @param projectId - the project the run belongs to.
 * @param run - the finished run to keep.
 * @returns the archive as it now stands.
 *
 * @remarks A run over {@link EVENTS_PER_RUN} events keeps its HEAD, not its tail: the divergence that
 * explains a bad run is near the start (the first tool call, the first refusal), while the tail is usually
 * repetition. `truncated` records how many were dropped, so the UI can say so rather than imply completeness.
 */
export function appendRun(existing: readonly ArchivedRun[], run: ArchivedRun): readonly ArchivedRun[] {
  const trimmed: ArchivedRun =
    run.events.length > EVENTS_PER_RUN
      ? { ...run, events: run.events.slice(0, EVENTS_PER_RUN), truncated: run.events.length - EVENTS_PER_RUN }
      : run;
  return [trimmed, ...existing].slice(0, ARCHIVE_LIMIT);
}

/** Persist one finished run. */
export async function recordRun(projectId: string, run: ArchivedRun): Promise<readonly ArchivedRun[]> {
  const next = appendRun(await loadRuns(projectId), run);
  await kv.set(key(projectId), next);
  return next;
}

/** Drop a project's archive. Called alongside deleteProject so nothing is orphaned. */
export async function deleteRuns(projectId: string): Promise<void> {
  await kv.delete(key(projectId));
}

export const newRunId = (): string => `r-${crypto.randomUUID().slice(0, 8)}`;

/**
 * The model's own reasoning for one run, joined whole.
 *
 * @param events - the archived run's events.
 * @returns every `reasoning.delta` concatenated, or `""` when the model emitted none.
 *
 * @remarks The devtools selector truncates reasoning to a 90-character preview, which is fine for a live
 * ticker and useless for diagnosis — the sentence that explains a refusal is rarely in the first 90
 * characters. This returns the whole thing.
 */
export function reasoningOf(events: readonly MithrilEvent[]): string {
  return events.flatMap((e) => (e.type === "reasoning.delta" ? [e.delta] : [])).join("");
}

/** Every tool call in a run, with what it returned or how it failed. */
export interface ToolTrace {
  readonly name: string;
  readonly input: unknown;
  readonly output?: unknown;
  readonly error?: string;
}

/**
 * Pair each `tool.call` with its `tool.result` or `tool.error`.
 *
 * @param events - the archived run's events.
 * @returns one entry per call, in call order.
 *
 * @remarks Paired by `callId`, and by the LAST matching call when ids repeat — several providers mint them
 * from a counter that restarts each request, so the same id legitimately recurs across steps.
 */
export function toolTrace(events: readonly MithrilEvent[]): readonly ToolTrace[] {
  const order: string[] = [];
  const byId = new Map<string, ToolTrace>();
  for (const e of events) {
    if (e.type === "tool.call") {
      order.push(e.callId);
      byId.set(e.callId, { name: e.name, input: e.input });
    } else if (e.type === "tool.result") {
      const cur = byId.get(e.callId);
      if (cur !== undefined) byId.set(e.callId, { ...cur, output: e.output });
    } else if (e.type === "tool.error") {
      const cur = byId.get(e.callId);
      if (cur !== undefined) byId.set(e.callId, { ...cur, error: e.error.message });
    }
  }
  return order.flatMap((id) => {
    const t = byId.get(id);
    return t === undefined ? [] : [t];
  });
}
