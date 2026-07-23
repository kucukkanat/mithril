/*
 * The client state machine, driven with a fake worker (no real Worker needed). Guards the frozen-Stop
 * regression: stopping an in-flight run must publish a terminal status so a React host leaves the
 * running state, while a stop AFTER a run already finished must not clobber the terminal status.
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

function fakeClient() {
  const worker: FakeWorker = { onmessage: null, onerror: null, postMessage() {}, terminate() {} };
  const client = createRunnerClient(() => worker as unknown as Worker);
  const send = (msg: RunnerMessage): void => worker.onmessage?.({ data: msg } as MessageEvent<RunnerMessage>);
  return { client, send };
}

test("stop() on an in-flight run returns status to idle so the composer un-freezes", () => {
  const { client } = fakeClient();
  client.run("noop");
  expect(client.getSnapshot().status).toBe("running");
  client.stop();
  expect(client.getSnapshot().status).toBe("idle");
});

test("stop() after a run already finished leaves the terminal status untouched", () => {
  const { client, send } = fakeClient();
  client.run("noop");
  send({ type: "done" });
  expect(client.getSnapshot().status).toBe("done");
  client.stop();
  expect(client.getSnapshot().status).toBe("done");
});

test("accumulated events survive a stop (only the status changes)", () => {
  const { client, send } = fakeClient();
  client.run("noop");
  send({ type: "log", level: "log", text: "hello" });
  client.stop();
  const snap = client.getSnapshot();
  expect(snap.status).toBe("idle");
  expect(snap.logs).toHaveLength(1);
});
