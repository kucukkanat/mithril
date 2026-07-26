import { expect, test } from "bun:test";
import type { JsonValue, StandardSchemaV1 } from "@mithril/core/protocol";
import { tool } from "@mithril/core/agent";
import { mcpClient, mcpTools, type McpTransport } from "../src/index.ts";
import { mcpServer } from "../src/server.ts";
import { httpTransport } from "../src/http.ts";

/*
 * Cancellation across the MCP boundary, both directions.
 *
 * Client side: a remote `tools/call` is the longest thing a run waits on. If the run's signal never reaches
 * it, cancelling returns while the server keeps working. Server side: a served tool got a context whose
 * signal could never fire, so a client hanging up left the tool running to completion.
 */

function schema<T>(): StandardSchemaV1<unknown, T> {
  return { "~standard": { version: 1, vendor: "t", validate: (v) => ({ value: v as T }) } };
}

const INIT: JsonValue = { protocolVersion: "2025-06-18", capabilities: {}, serverInfo: { name: "s", version: "1" } };

test("mcpTools threads the run's signal into callTool", async () => {
  let seen: AbortSignal | undefined;
  const transport: McpTransport = {
    async request(method, _params, signal) {
      if (method === "initialize") return INIT;
      if (method === "tools/list") return { tools: [{ name: "remote", description: "d" }] };
      seen = signal;
      return { content: [{ type: "text", text: "done" }] };
    },
  };
  const [remote] = await mcpTools(mcpClient(transport));
  expect(remote).toBeDefined();

  const ctrl = new AbortController();
  const ctx = { signal: ctrl.signal } as Parameters<NonNullable<typeof remote>["execute"]>[1];
  await remote?.execute({}, ctx);

  expect(seen).toBe(ctrl.signal);
});

test("the http transport passes the signal to fetch", async () => {
  let seen: AbortSignal | undefined;
  const t = httpTransport({
    url: "https://example.test/mcp",
    fetch: (async (_u: unknown, init?: { signal?: AbortSignal }) => {
      seen = init?.signal;
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} }), { headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch,
  });
  const ctrl = new AbortController();
  await t.request("tools/call", { name: "x", arguments: {} }, ctrl.signal);
  expect(seen).toBe(ctrl.signal);
});

test("a served tool sees the disconnecting client's abort", async () => {
  let toolSignal: AbortSignal | undefined;
  const slow = tool({
    name: "slow",
    description: "d",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_in, ctx) => {
      toolSignal = ctx.signal;
      return { ok: true };
    },
  });
  const server = mcpServer([slow]);
  const ctrl = new AbortController();
  const req = new Request("https://example.test/mcp", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "slow", arguments: {} } }),
    signal: ctrl.signal,
  });
  await server.serve(req);

  expect(toolSignal).toBeDefined();
  expect(toolSignal?.aborted).toBe(false);
  ctrl.abort();
  expect(toolSignal?.aborted).toBe(true);
});

test("each served call gets its own context, not one shared across calls", async () => {
  const runIds: string[] = [];
  const t = tool({
    name: "who",
    description: "d",
    inputSchema: schema<Record<string, never>>(),
    execute: async (_in, ctx) => {
      runIds.push(ctx.runId);
      return { ok: true };
    },
  });
  const server = mcpServer([t]);
  const call = (): Promise<JsonValue> => server.handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "who", arguments: {} } });
  await call();
  await call();
  expect(runIds).toHaveLength(2);
  expect(runIds[0]).not.toBe(runIds[1]);
});
