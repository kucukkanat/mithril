import type { AnyTool, ChatRequest, JsonSchemaConverter } from "@mithril/core/protocol";
import { toJsonSchema } from "@mithril/core/protocol";

// Map a Mithril ChatRequest to an OpenAI chat-completions request body. Tool-result messages are paired to
// their originating assistant tool_calls BY ORDER (the loop emits them sequentially), so no tool_call_id
// needs to be threaded through the protocol.

function toOpenAITool(t: AnyTool<unknown>, convert?: JsonSchemaConverter): unknown {
  // Real JSON Schema when the input schema self-describes or a converter is supplied; permissive otherwise.
  return {
    type: "function",
    function: { name: t.name, description: t.description, parameters: toJsonSchema(t.inputSchema, convert) },
  };
}

export function toOpenAIBody(req: ChatRequest, convert?: JsonSchemaConverter): string {
  const model = req.model.includes("/") ? req.model.slice(req.model.indexOf("/") + 1) : req.model;
  const messages: unknown[] = [];
  if (req.system !== "") messages.push({ role: "system", content: req.system });

  const pendingCallIds: string[] = [];
  for (const m of req.messages) {
    if (m.role === "assistant" && m.toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: m.content === "" ? null : m.content,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.callId,
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.input) },
        })),
      });
      for (const tc of m.toolCalls) pendingCallIds.push(tc.callId);
    } else if (m.role === "tool") {
      const id = pendingCallIds.shift();
      messages.push({ role: "tool", content: m.content, ...(id !== undefined ? { tool_call_id: id } : {}) });
    } else {
      messages.push({ role: m.role, content: m.content });
    }
  }

  const body: Record<string, unknown> = {
    model,
    stream: true,
    stream_options: { include_usage: true },
    messages,
  };
  if (req.tools.length > 0) body["tools"] = req.tools.map((t) => toOpenAITool(t, convert));
  if (req.output !== undefined) body["response_format"] = { type: "json_object" }; // JSON mode
  return JSON.stringify(body);
}
