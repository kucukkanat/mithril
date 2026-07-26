import type { AnyTool, JsonSchemaConverter, JsonValue, RunContext } from "@mithril/core/protocol";
import { toJsonSchema, ZERO_USAGE } from "@mithril/core/protocol";
import { defaultRuntime } from "@mithril/core/agent";

// MCP server exposure: present a set of Mithril tools AS an MCP server. `handle` dispatches a single JSON-RPC
// request (initialize / tools/list / tools/call / ping) or notification; `serve` is a fetch-style wrapper you
// can mount on any HTTP server. Tool params are advertised via toJsonSchema; results are returned as MCP text
// content. The server negotiates the client's requested protocol version, assigns an `Mcp-Session-Id`, and
// answers notifications (e.g. `notifications/initialized`) with a bodyless `202 Accepted`.

const PROTOCOL_VERSION = "2025-06-18";

/** Identifies an {@link mcpServer} to connecting clients. */
export interface McpServerInfo {
  readonly name: string;
  readonly version: string;
}

/** A Mithril-tools-backed MCP server. Create one with {@link mcpServer}. */
export interface McpServer {
  /**
   * Dispatch one JSON-RPC request object and resolve its JSON-RPC response.
   *
   * @param signal - aborts the tool invocation this request triggers; `serve` passes the HTTP request's
   * own signal, so a client that disconnects cancels the work it asked for.
   */
  handle(request: JsonValue, signal?: AbortSignal): Promise<JsonValue>;
  /** Fetch-style handler: read a JSON-RPC request from `request`, dispatch it, and reply with JSON. */
  serve(request: Request): Promise<Response>;
}

interface JsonRpcRequest {
  readonly jsonrpc?: string;
  readonly id?: JsonValue;
  readonly method?: string;
  readonly params?: JsonValue;
}

function isAsyncGen(v: unknown): v is AsyncGenerator<unknown, unknown> {
  return typeof v === "object" && v !== null && Symbol.asyncIterator in v;
}

/**
 * Expose a set of Mithril {@link AnyTool}s as an MCP server.
 *
 * @param tools - the tools to advertise and run.
 * @param info - server identity returned on `initialize` (default `{ name: "mithril", version: "0.0.0" }`).
 * @param opts - `deps` are injected into each tool's `execute`; `toolSchema` is a {@link JsonSchemaConverter}
 *   for advertised parameters; `runtime` overrides the {@link RuntimeAdapter}.
 * @returns an {@link McpServer} with `handle` (one JSON-RPC call) and `serve` (a `fetch` handler).
 * @remarks Implements `initialize`, `tools/list`, and `tools/call`. A tool's output is wrapped as MCP text
 * content (`JSON.stringify` for non-strings); a thrown error becomes an `isError` text result. `ctx.suspend`
 * is unavailable in this standalone context and rejects. Any Mithril tool — including one wrapping a
 * sub-agent via `asTool` — can be served.
 * @example
 * ```ts
 * import { mcpServer } from "@mithril/mcp/server";
 *
 * const server = mcpServer([weatherTool], { name: "weather", version: "1.0.0" });
 * // mount on any HTTP framework:
 * Bun.serve({ port: 8787, fetch: (req) => server.serve(req) });
 * ```
 */
export function mcpServer(
  tools: readonly AnyTool<unknown>[],
  info: McpServerInfo = { name: "mithril", version: "0.0.0" },
  opts?: { readonly deps?: unknown; readonly toolSchema?: JsonSchemaConverter; readonly runtime?: RunContext<unknown>["runtime"] },
): McpServer {
  const rt = opts?.runtime ?? defaultRuntime();
  const byName = new Map(tools.map((t) => [t.name, t]));

  // Built PER CALL. A single shared context handed every tool the same runId and a signal that never
  // aborted, so a served tool could not observe the client going away and would run to completion after
  // the caller had hung up.
  const makeCtx = (signal: AbortSignal): RunContext<unknown> => ({
    deps: opts?.deps,
    runId: rt.randomUUID(),
    step: 0,
    signal,
    usage: ZERO_USAGE,
    // No enclosing run to charge: a served tool's spend belongs to whoever called the MCP server, and this
    // process has no view of that. Dropping it is honest; pretending to accrue it into ZERO_USAGE is not.
    reportUsage() {
      /* no run to charge in a standalone server context */
    },
    runtime: rt,
    // The served tool set is fixed at mcpServer() construction: there is no run to scope a registration
    // to, and MCP has no way to tell a connected client that the tool list changed mid-call. So reads
    // reflect the served tools and writes are refused, rather than silently doing nothing.
    tools: {
      summaries: () =>
        tools.map((t) => ({
          name: t.name,
          description: t.description,
          ...(t.version !== undefined ? { version: t.version } : {}),
          provenance: { kind: "static" } as const,
        })),
      has: (name) => byName.has(name),
      get: (name) => byName.get(name),
      register() {
        throw new Error("ctx.tools.register() is not supported when a tool is served over MCP");
      },
      revoke() {
        throw new Error("ctx.tools.revoke() is not supported when a tool is served over MCP");
      },
    },
    emit() {
      /* no event stream in a standalone server context */
    },
    suspend() {
      return Promise.reject(new Error("ctx.suspend() is not supported when a tool is served over MCP"));
    },
    journal(_key, fn) {
      return fn();
    },
  });

  const runTool = async (tool: AnyTool<unknown>, args: JsonValue, signal: AbortSignal): Promise<JsonValue> => {
    const validated = await tool.inputSchema["~standard"].validate(args);
    if (validated.issues !== undefined) {
      throw new Error(`invalid input: ${validated.issues.map((i) => i.message).join("; ")}`);
    }
    const ret = tool.execute(validated.value as never, makeCtx(signal));
    if (isAsyncGen(ret)) {
      const it = ret[Symbol.asyncIterator]();
      for (;;) {
        const r = await it.next();
        if (r.done) return r.value as JsonValue;
      }
    }
    return (await ret) as JsonValue;
  };

  const ok = (id: JsonValue | undefined, result: JsonValue): JsonValue => ({ jsonrpc: "2.0", id: id ?? null, result });
  const err = (id: JsonValue | undefined, code: number, message: string): JsonValue => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

  let sessionId: string | undefined; // assigned on `initialize`, echoed by `serve` as `Mcp-Session-Id`

  const handle = async (request: JsonValue, signal?: AbortSignal): Promise<JsonValue> => {
    const req = request as JsonRpcRequest;
    // A JSON-RPC notification carries no `id` and expects no reply (e.g. `notifications/initialized`);
    // acknowledge it with a null return that `serve` maps to a bodyless 202.
    if (req.id === undefined && (req.method ?? "").startsWith("notifications/")) return null;
    switch (req.method) {
      case "initialize": {
        // Negotiate: echo the client's requested protocol version when it sent one, else our default.
        const requested = (req.params as { readonly protocolVersion?: string } | undefined)?.protocolVersion;
        sessionId ??= rt.randomUUID();
        return ok(req.id, {
          protocolVersion: requested ?? PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: info.name, version: info.version },
        });
      }
      case "ping":
        return ok(req.id, {});
      case "tools/list":
        return ok(req.id, {
          tools: tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: toJsonSchema(t.inputSchema, opts?.toolSchema),
          })),
        });
      case "tools/call": {
        const params = (req.params ?? {}) as { readonly name?: string; readonly arguments?: JsonValue };
        const tool = params.name !== undefined ? byName.get(params.name) : undefined;
        if (tool === undefined) return err(req.id, -32602, `unknown tool: ${params.name ?? "(none)"}`);
        try {
          const output = await runTool(tool, params.arguments ?? {}, signal ?? new AbortController().signal);
          return ok(req.id, { content: [{ type: "text", text: typeof output === "string" ? output : JSON.stringify(output) }] });
        } catch (e) {
          return ok(req.id, { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true });
        }
      }
      default:
        return err(req.id, -32601, `method not found: ${req.method ?? "(none)"}`);
    }
  };

  const sessionHeader = (): Record<string, string> => (sessionId !== undefined ? { "mcp-session-id": sessionId } : {});

  return {
    handle,
    async serve(request: Request): Promise<Response> {
      let body: JsonValue;
      try {
        body = (await request.json()) as JsonValue;
      } catch {
        // Malformed JSON body — reply with a JSON-RPC parse error rather than throwing out of the handler.
        return new Response(JSON.stringify(err(null, -32700, "parse error: request body is not valid JSON")), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      // request.signal aborts when the HTTP client disconnects, so the tool stops with it.
      const response = await handle(body, request.signal);
      // A notification (handle → null) has no JSON-RPC reply: acknowledge with a bodyless 202.
      if (response === null) return new Response(null, { status: 202, headers: sessionHeader() });
      return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json", ...sessionHeader() } });
    },
  };
}
