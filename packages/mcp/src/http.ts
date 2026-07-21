import type { JsonValue } from "@mithril/core/protocol";
import type { McpTransport } from "./index.ts";

// Official MCP Streamable-HTTP transport. POSTs JSON-RPC to a single endpoint; the server may answer with a
// plain JSON body or a `text/event-stream` frame carrying the JSON-RPC response. `fetch` is injectable, so
// this is testable with zero network (e.g. routed straight into an `mcpServer().serve`).

interface JsonRpcResponse {
  readonly result?: JsonValue;
  readonly error?: { readonly code: number; readonly message: string };
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
 *   `headers` are sent on every request (e.g. auth); `sessionId` is echoed as `Mcp-Session-Id`.
 * @returns A transport ready for {@link mcpClient}.
 * @remarks Sends `Accept: application/json, text/event-stream` and handles either response shape. JSON-RPC
 * errors are thrown as `Error`. Notifications (methods with no reply) are not modeled — `request` always
 * expects a response.
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
  return {
    async request(method, params): Promise<JsonValue> {
      const body = JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params });
      const res = await doFetch(opts.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          ...(opts.sessionId !== undefined ? { "mcp-session-id": opts.sessionId } : {}),
          ...opts.headers,
        },
        body,
      });
      if (!res.ok) throw new Error(`MCP HTTP ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
      const text = await res.text();
      const payload = (res.headers.get("content-type") ?? "").includes("text/event-stream")
        ? parseEventStream(text)
        : JSON.parse(text);
      const rpc = payload as JsonRpcResponse;
      if (rpc.error !== undefined) throw new Error(`MCP error ${rpc.error.code}: ${rpc.error.message}`);
      return rpc.result ?? null;
    },
  };
}
