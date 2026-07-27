/*
 * The notify loop's isolation guarantee. A subscriber that throws (React's nested-update guard is
 * the real-world one) must not abort the state machine: every OTHER subscriber still runs, and the
 * work the client does after `set` — notably `terminate()` on a done/error message — still happens.
 * Regression: a throw on `done` left the worker alive and the terminal status unpublished.
 */
import { expect, test } from "bun:test";
import { createRunnerClient } from "../src/index.ts";
import type { RunnerMessage } from "../src/protocol.ts";

interface FakeWorker {
  onmessage: ((ev: MessageEvent<RunnerMessage>) => void) | null;
  onerror: ((ev: { message: string }) => void) | null;
  postMessage(): void;
  terminate(): void;
}

// The client reports a throwing subscriber through the global `reportError` (so it surfaces exactly
// like an uncaught error in a browser). Capture it here instead — an error that really escaped would
// otherwise fail the test run, which is the behaviour we're asserting is contained.
function captureReported(): { readonly errors: readonly unknown[]; restore: () => void } {
  const original = globalThis.reportError;
  const errors: unknown[] = [];
  globalThis.reportError = (err: unknown): void => {
    errors.push(err);
  };
  return { errors, restore: () => void (globalThis.reportError = original) };
}

function fakeClient() {
  let terminated = 0;
  const worker: FakeWorker = {
    onmessage: null,
    onerror: null,
    postMessage() {},
    terminate() {
      terminated++;
    },
  };
  const client = createRunnerClient(() => worker as unknown as Worker);
  const send = (msg: RunnerMessage): void => worker.onmessage?.({ data: msg } as MessageEvent<RunnerMessage>);
  return { client, send, terminated: () => terminated };
}

test("a throwing subscriber does not stop the worker from being terminated on done", () => {
  const reported = captureReported();
  try {
    const { client, send, terminated } = fakeClient();
    client.subscribe(() => {
      throw new Error("nested update limit");
    });
    client.run("noop");
    send({ type: "done" });
    expect(client.getSnapshot().status).toBe("done");
    expect(terminated()).toBeGreaterThan(0);
  } finally {
    reported.restore();
  }
});

test("a throwing subscriber does not starve the ones after it, and is reported not swallowed", () => {
  const reported = captureReported();
  try {
    const { client, send } = fakeClient();
    let seen = 0;
    client.subscribe(() => {
      throw new Error("boom");
    });
    client.subscribe(() => {
      seen++;
    });
    client.run("noop");
    send({ type: "log", level: "log", text: "hello" });
    expect(seen).toBeGreaterThan(0);
    expect(client.getSnapshot().logs).toHaveLength(1);
    expect(reported.errors.length).toBeGreaterThan(0);
  } finally {
    reported.restore();
  }
});

test("a throwing subscriber still lets an error message publish its terminal status", () => {
  const reported = captureReported();
  try {
    const { client, send, terminated } = fakeClient();
    client.subscribe(() => {
      throw new Error("boom");
    });
    client.run("noop");
    send({ type: "error", message: "401 unauthorized" });
    const snap = client.getSnapshot();
    expect(snap.status).toBe("error");
    expect(snap.errorHint).toBe("Invalid or missing API key — check the key for this provider.");
    expect(terminated()).toBeGreaterThan(0);
  } finally {
    reported.restore();
  }
});
