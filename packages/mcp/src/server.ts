import type { AnyTool, JsonSchemaConverter, JsonValue, RunContext } from "@mithril/core/protocol";
import { toJsonSchema, ZERO_USAGE } from "@mithril/core/protocol";
import { defaultRuntime } from "@mithril/core/agent";

// MCP server exposure: present a set of Mithril tools AS an MCP server. `handle` dispatches a single JSON-RPC
// request (initialize / tools/list / tools/call); `serve` is a fetch-style wrapper you can mount on any HTTP
// server. Tool params are advertised via toJsonSchema; results are returned as MCP text content.

const PROTOCOL_VERSION = "2024-11-05";

/** Identifies an {@link mcpServer} to connecting clients. */
export interface McpServerInfo {
  readonly name: string;
  readonly version: string;
}

/** A Mithril-tools-backed MCP server. Create one with {@link mcpServer}. */
export interface McpServer {
  /** Dispatch one JSON-RPC request object and resolve its JSON-RPC response. */
  handle(request: JsonValue): Promise<JsonValue>;
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

  const ctx: RunContext<unknown> = {
    deps: opts?.deps,
    runId: rt.randomUUID(),
    step: 0,
    signal: new AbortController().signal,
    usage: ZERO_USAGE,
    runtime: rt,
    emit() {
      /* no event stream in a standalone server context */
    },
    suspend() {
      return Promise.reject(new Error("ctx.suspend() is not supported when a tool is served over MCP"));
    },
    journal(_key, fn) {
      return fn();
    },
  };

  const runTool = async (tool: AnyTool<unknown>, args: JsonValue): Promise<JsonValue> => {
    const validated = await tool.inputSchema["~standard"].validate(args);
    if (validated.issues !== undefined) {
      throw new Error(`invalid input: ${validated.issues.map((i) => i.message).join("; ")}`);
    }
    const ret = tool.execute(validated.value as never, ctx);
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

  const handle = async (request: JsonValue): Promise<JsonValue> => {
    const req = request as JsonRpcRequest;
    switch (req.method) {
      case "initialize":
        return ok(req.id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: info.name, version: info.version } });
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
          const output = await runTool(tool, params.arguments ?? {});
          return ok(req.id, { content: [{ type: "text", text: typeof output === "string" ? output : JSON.stringify(output) }] });
        } catch (e) {
          return ok(req.id, { content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }], isError: true });
        }
      }
      default:
        return err(req.id, -32601, `method not found: ${req.method ?? "(none)"}`);
    }
  };

  return {
    handle,
    async serve(request: Request): Promise<Response> {
      const body = (await request.json()) as JsonValue;
      const response = await handle(body);
      return new Response(JSON.stringify(response), { status: 200, headers: { "content-type": "application/json" } });
    },
  };
}
