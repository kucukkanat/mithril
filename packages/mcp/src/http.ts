import type { JsonValue } from "@mithril/core/protocol";
import { McpError, type McpTransport } from "./index.ts";

// Official MCP Streamable-HTTP transport. POSTs JSON-RPC to a single endpoint; the server may answer with a
// plain JSON body or a `text/event-stream` frame carrying the JSON-RPC response. It captures the
// server-assigned `Mcp-Session-Id` from any response and echoes it on every subsequent request, so the MCP
// session is managed for you. `fetch` is injectable, so this is testable with zero network (e.g. routed
// straight into an `mcpServer().serve`).

interface JsonRpcResponse {
  readonly result?: JsonValue;
  readonly error?: { readonly code: number; readonly message: string; readonly data?: JsonValue };
}

// Streamable HTTP may wrap the JSON-RPC response as an SSE `message` event: pull the concatenated `data:`
// lines and parse them.
function parseEventStream(text: string): unknown {
  const data = text
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim())
    .join("");
  return JSON.parse(data === "" ? text : data);
}

/**
 * Create an {@link McpTransport} that speaks MCP over Streamable HTTP.
 *
 * @param opts - `url` is the MCP endpoint; `fetch` injects the fetcher (default the global `fetch`);
 *   `headers` are sent on every request (e.g. auth); `sessionId` seeds the `Mcp-Session-Id` (usually you
 *   let the server assign it — the transport captures it from the `initialize` reply and reuses it).
 * @returns A transport ready for {@link mcpClient}.
 * @remarks Sends `Accept: application/json, text/event-stream` and handles either response shape. A
 *   server-assigned `Mcp-Session-Id` response header is captured and echoed on all later requests and
 *   notifications. JSON-RPC errors throw {@link McpError} (with the JSON-RPC `code`/`data`). `notify` posts
 *   a fire-and-forget notification (no id) and tolerates an empty `202 Accepted` body.
 * @example
 * ```ts
 * import { mcpClient, mcpTools } from "@mithril/mcp";
 * import { httpTransport } from "@mithril/mcp/http";
 *
 * const client = mcpClient(httpTransport({ url: "https://example.com/mcp", headers: { authorization: token } }));
 * const tools = await mcpTools(client);
 * ```
 */
export function httpTransport(opts: {
  readonly url: string;
  readonly fetch?: typeof fetch;
  readonly headers?: Readonly<Record<string, string>>;
  readonly sessionId?: string;
}): McpTransport {
  const doFetch = opts.fetch ?? fetch;
  let id = 0;
  let sessionId = opts.sessionId; // seeded by the caller or captured from the server's `initialize` reply

  async function post(payload: JsonValue, signal?: AbortSignal): Promise<Response> {
    return doFetch(opts.url, {
      method: "POST",
      ...(signal !== undefined ? { signal } : {}),
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(sessionId !== undefined ? { "mcp-session-id": sessionId } : {}),
        ...opts.headers,
      },
      body: JSON.stringify(payload),
    });
  }

  // Capture a server-assigned session id from any response so later requests carry it.
  function captureSession(res: Response): void {
    const sid = res.headers.get("mcp-session-id");
    if (sid !== null && sid !== "") sessionId = sid;
  }

  return {
    async request(method, params, signal): Promise<JsonValue> {
      const res = await post({ jsonrpc: "2.0", id: ++id, method, params }, signal);
      captureSession(res);
      if (!res.ok) throw new McpError(`MCP HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`, { code: res.status });
      const text = await res.text();
      const payload = (res.headers.get("content-type") ?? "").includes("text/event-stream") ? parseEventStream(text) : JSON.parse(text);
      const rpc = payload as JsonRpcResponse;
      if (rpc.error !== undefined) {
        throw new McpError(`MCP error ${rpc.error.code}: ${rpc.error.message}`, {
          code: rpc.error.code,
          ...(rpc.error.data !== undefined ? { data: rpc.error.data } : {}),
        });
      }
      return rpc.result ?? null;
    },
    async notify(method, params): Promise<void> {
      // A notification has no `id` and expects no JSON-RPC reply (servers answer `202 Accepted`, often
      // with an empty body). We only read the session header; the body, if any, is ignored.
      const res = await post({ jsonrpc: "2.0", method, params });
      captureSession(res);
      if (!res.ok) throw new McpError(`MCP HTTP ${res.status} on notification "${method}"`, { code: res.status });
    },
  };
}
