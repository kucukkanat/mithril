/*
 * Regression: pressing Stop during a build must actually end the build.
 *
 * `RunnerClient.stop()` publishes a terminal `idle` snapshot (not `done`/`error`), so a subscriber
 * that only watches for `done`/`error` never settles — which left the Studio stuck on "building"
 * with the Stop button doing nothing visible. The worker here never answers, so the ONLY thing that
 * can resolve `start()` is the stop.
 */
import { describe, expect, test } from "bun:test";

/** A worker that accepts the run and then stays silent forever. */
class SilentWorker {
  onmessage: unknown = null;
  onerror: unknown = null;
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  terminate(): void {}
}

/*
 * The store spawns its worker lazily via a bare `new Worker`, so the stub must be global — but only
 * for as long as that spawn takes: bun runs every test file in one process, and a leaked stub kills
 * the real worker-backed integration tests.
 */
const g = globalThis as unknown as { Worker: unknown };
const realWorker = g.Worker;
g.Worker = SilentWorker;

const { useCreatorStore } = await import("../src/state/creatorStore.ts");
describe("stopping a build", () => {
  test("settles the run and leaves the partial build reviewable", async () => {
    const store = useCreatorStore.getState();
    const started = store.start({ kind: "create", job: "a support agent" }, { kind: "local", model: "m" }, false, {});

    await Promise.resolve(); // the gate is async; let `start` reach the run
    // Still building: nothing has come back from the worker.
    expect(useCreatorStore.getState().running).toBe(true);
    expect(useCreatorStore.getState().phase).toBe("building");

    useCreatorStore.getState().stop();
    await started;

    const after = useCreatorStore.getState();
    expect(after.running).toBe(false);
    expect(after.phase).toBe("review");
    expect(after.outcome?.stoppedEarly).toBe(true);

    g.Worker = realWorker;
  });
});
