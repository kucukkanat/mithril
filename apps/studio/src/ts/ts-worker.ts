/// <reference lib="webworker" />
/*
 * The TypeScript worker: loads the real compiler LAZILY (its own cached chunk, never in the main
 * bundle) and answers parse requests from the code view. Kept separate from the runner worker —
 * parsing must stay responsive while a run is in flight.
 */
import { parseProject, type ParseResult } from "@mithril/spec/parse";
import type { ProjectSpec } from "@mithril/spec";

export interface TsParseRequest {
  readonly id: number;
  readonly source: string;
  readonly prev?: ProjectSpec;
}

export interface TsParseResponse {
  readonly id: number;
  readonly result: ParseResult;
}

const tsPromise = import("typescript").then((m) => ("default" in m ? m.default : m));

self.addEventListener("message", (ev: MessageEvent<TsParseRequest>) => {
  const { id, source, prev } = ev.data;
  void tsPromise.then((ts) => {
    const result = parseProject(source, ts, prev);
    (self as unknown as { postMessage(m: TsParseResponse): void }).postMessage({ id, result });
  });
});
