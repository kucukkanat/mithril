import { type MithrilEvent, replay, type RunState } from "../protocol/index.ts";
import type { RunHandle, RunResult } from "./agent-types.ts";
import type { ResumeValue } from "./loop.ts";
import { MithrilError } from "./registry.ts";

// (generic over Out so a structured-output agent's stream resolves the typed value)

/** Hooks {@link makeRunHandle} needs from {@link Agent.stream} to power `cancel()` and in-process `resolve()`. */
export interface HandleControls<Out> {
  /** Abort the underlying run; the loop returns `"cancelled"` at the next step boundary. */
  cancel(reason?: string): void;
  /** Build a fresh streaming handle that resumes this run from its suspension token. */
  resume(token: string, resolution: ResumeValue): RunHandle<Out>;
}

/**
 * Wrap the loop generator in a {@link RunHandle} backed by a buffered broadcast.
 *
 * @typeParam Out - the run output type, resolved by {@link RunHandle.result}.
 * @param gen - the {@link agentLoop} generator to drive; it is consumed eagerly into a shared buffer so
 * every subscriber (`events`, `text`, the handle itself) replays the full stream independently.
 * @param runId - the run's id, surfaced as {@link RunHandle.runId}.
 * @param controls - {@link HandleControls} wiring `cancel()` (abort) and `resolve()` (streaming resume).
 * @returns a {@link RunHandle} whose `state()` replays the events buffered so far and whose `result()`
 * resolves with the terminal {@link RunResult} (or rejects if the loop throws).
 */
export function makeRunHandle<Out = string>(
  gen: AsyncGenerator<MithrilEvent, RunResult<Out>>,
  runId: string,
  controls: HandleControls<Out>,
): RunHandle<Out> {
  const buffer: MithrilEvent[] = [];
  const waiters: Array<() => void> = [];
  let ended = false;
  let failure: unknown;
  const wake = (): void => {
    for (const w of waiters.splice(0)) w();
  };

  const driver: Promise<RunResult<Out>> = (async () => {
    try {
      for (;;) {
        const r = await gen.next();
        if (r.done) {
          ended = true;
          wake();
          return r.value;
        }
        buffer.push(r.value);
        wake();
      }
    } catch (e) {
      failure = e;
      ended = true;
      wake();
      throw e;
    }
  })();

  async function* subscribe(): AsyncGenerator<MithrilEvent> {
    let i = 0;
    for (;;) {
      if (i < buffer.length) {
        const e = buffer[i];
        i++;
        if (e !== undefined) yield e;
        continue;
      }
      if (ended) {
        if (failure !== undefined) throw failure;
        return;
      }
      await new Promise<void>((res) => {
        waiters.push(res);
      });
    }
  }

  return {
    runId,
    events: { [Symbol.asyncIterator]: () => subscribe() },
    text: {
      [Symbol.asyncIterator]: async function* () {
        for await (const e of subscribe()) if (e.type === "text.delta") yield e.delta;
      },
    },
    [Symbol.asyncIterator]: () => subscribe(),
    state(): RunState {
      return replay(buffer);
    },
    result(): Promise<RunResult<Out>> {
      return driver;
    },
    cancel(reason?: string): void {
      controls.cancel(reason);
    },
    async resolve(resolution: ResumeValue): Promise<RunHandle<Out>> {
      const r = await driver;
      if (r.status !== "suspended") {
        throw new MithrilError("NOT_SUSPENDED", `resolve() requires a suspended run; this run ${r.status}.`);
      }
      return controls.resume(r.token, resolution);
    },
  };
}
