/*
 * Integration: the creator program is executed by the REAL runner worker, its meta-tool bodies really
 * run, and their `emit` payloads really cross the worker boundary into a ProjectSpec.
 *
 * The model is the framework's own scripted double, so what is under test is the program's SHAPE —
 * the six tool declarations, the injected `emit` and `run` globals, the duplicate guard — rather than
 * any model's behaviour. Every unit of code under test is the shipping one.
 */
import { describe, expect, test } from "bun:test";
import type { RunnerMessage, RunnerRequest } from "@mithril/runner-web";
import { creatorProgram, creatorToSpec, parseCreatorEvents, type CreatorRequest } from "../src/lib/creator.ts";

const TIMEOUT_MS = 20_000;
const MODEL = { kind: "local", model: "m" } as const;

function runInWorker(request: RunnerRequest): Promise<readonly RunnerMessage[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../src/runner/worker-entry.ts", import.meta.url), { type: "module" });
    const messages: RunnerMessage[] = [];
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error(`worker did not finish within ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);
    worker.addEventListener("message", (ev: MessageEvent<RunnerMessage>) => {
      messages.push(ev.data);
      if (ev.data.type === "done" || ev.data.type === "error") {
        clearTimeout(timer);
        worker.terminate();
        resolve(messages);
      }
    });
    worker.postMessage(request);
  });
}

/** One scripted turn in which the model calls a meta-tool. */
const call = (id: string, name: string, input: unknown): string =>
  `[{ type: "tool.call", callId: ${JSON.stringify(id)}, name: ${JSON.stringify(name)}, input: ${JSON.stringify(input)} }, { type: "message.end", finishReason: "tool_calls", usage }]`;

/** The final turn: the model says something and stops. */
const say = (text: string): string => `[{ type: "text.delta", delta: ${JSON.stringify(text)} }, { type: "message.end", finishReason: "stop", usage }]`;

/**
 * The shipping program with only its `model:` line swapped for a scripted double — the tool
 * declarations, the `emit` calls inside them and the injected `run` are exactly what creatorProgram
 * emitted.
 */
function scripted(req: CreatorRequest, turns: readonly string[]): string {
  return creatorProgram(req, { kind: "code", expr: { code: "__scripted" } })
    .replace(
      `import { agent, tool } from "mithril";`,
      [`import { agent, tool } from "mithril";`, `import { scriptedProvider, testModel } from "@mithril/core/testkit";`].join("\n"),
    )
    .replace("const creator = agent({", [`const __scripted = testModel(scriptedProvider([${turns.join(", ")}]));`, `const creator = agent({`].join("\n"));
}

const REQ: CreatorRequest = { kind: "create", job: "a support agent that looks up orders" };

const payloads = (messages: readonly RunnerMessage[]): readonly unknown[] => messages.flatMap((m) => (m.type === "data" ? [m.payload] : []));

const WEATHER_TOOL = {
  name: "get_weather",
  description: "Use this when the user asks about current weather.",
  inputs: [{ name: "city", type: "text", description: "e.g. Oslo" }],
  code: "async ({ city }) => ({ city, tempC: 21 })",
};

describe("a creator run, end to end", () => {
  test(
    "the meta-tools execute in the worker and their definitions reach the host as data",
    async () => {
      const messages = await runInWorker({
        type: "run",
        code: scripted(REQ, [
          call("c1", "create_tool", WEATHER_TOOL),
          call("c2", "create_agent", { id: "assistant", purpose: "Answers weather questions.", instructions: "Answer weather questions.", tools: ["get_weather"] }),
          call("c3", "finish", { name: "Weather desk", entry: "assistant", summary: "Looks up live weather." }),
          say("Done."),
        ]),
      });

      expect(messages.find((m) => m.type === "error")).toBeUndefined();

      // The payloads arrive in call order, tagged, and carry what the model actually passed.
      const raw = payloads(messages);
      expect(raw.map((p) => (p as { kind: string }).kind)).toEqual(["tool", "agent", "finish"]);

      const events = parseCreatorEvents(raw);
      const { spec, notes, summary, finished } = creatorToSpec(events, MODEL, REQ.kind === "create" ? REQ.job : "");
      expect(finished).toBe(true);
      expect(summary).toBe("Looks up live weather.");
      expect(notes).toEqual([]);
      expect(spec.name).toBe("Weather desk");
      expect(spec.entry.target).toBe("assistant");
      expect(spec.decls.map((d) => `${d.kind}:${d.id}`)).toEqual(["tool:get_weather", "agent:assistant"]);

      // The model's real body survived the whole trip, unrewritten.
      const tool = spec.decls.find((d) => d.kind === "tool");
      expect(tool?.kind === "tool" && tool.execute.code).toBe(WEATHER_TOOL.code);
    },
    TIMEOUT_MS,
  );

  test(
    "a sub-agent built in one call arrives wired to its parent",
    async () => {
      const messages = await runInWorker({
        type: "run",
        code: scripted(REQ, [
          call("c1", "create_agent", { id: "assistant", purpose: "Routes.", instructions: "Route to a specialist.", tools: [] }),
          call("c2", "create_subagent", {
            id: "billing",
            purpose: "Handles billing.",
            instructions: "You handle billing questions.",
            tools: [],
            parent: "assistant",
            expose_name: "ask_billing",
            expose_description: "Use this for charges, invoices and refunds.",
          }),
          say("Done."),
        ]),
      });

      expect(messages.find((m) => m.type === "error")).toBeUndefined();
      const { spec } = creatorToSpec(parseCreatorEvents(payloads(messages)), MODEL, "j");
      expect(spec.decls.find((d) => d.kind === "subAgentTool")).toMatchObject({ id: "ask_billing", agentId: "billing" });
      expect(spec.decls.find((d) => d.kind === "agent" && d.id === "assistant")).toMatchObject({ tools: ["ask_billing"] });
      // The specialist exists only to be delegated to, so the run must not start inside it.
      expect(spec.entry.target).toBe("assistant");
    },
    TIMEOUT_MS,
  );

  test(
    "the duplicate guard refuses a repeated name instead of throwing",
    async () => {
      const messages = await runInWorker({
        type: "run",
        code: scripted(REQ, [
          call("c1", "create_tool", WEATHER_TOOL),
          call("c2", "create_tool", WEATHER_TOOL),
          call("c3", "create_agent", { id: "assistant", purpose: "p", instructions: "i", tools: ["get_weather"] }),
          say("Done."),
        ]),
      });

      // A refusal is information for the model, not a crash: the run completes and the second call
      // never became a definition.
      expect(messages.find((m) => m.type === "error")).toBeUndefined();
      expect(payloads(messages).filter((p) => (p as { kind: string }).kind === "tool")).toHaveLength(1);

      const results = messages.flatMap((m) => (m.type === "event" && m.event.type === "tool.result" ? [m.event] : []));
      expect(JSON.stringify(results)).toContain("already exists");
    },
    TIMEOUT_MS,
  );

  test(
    "a model that makes tools and never creates an agent still yields an openable project",
    async () => {
      const messages = await runInWorker({
        type: "run",
        code: scripted(REQ, [call("c1", "create_tool", WEATHER_TOOL), say("I have created the tool.")]),
      });

      expect(messages.find((m) => m.type === "error")).toBeUndefined();
      const { spec, notes, finished } = creatorToSpec(parseCreatorEvents(payloads(messages)), MODEL, "a weather bot");
      expect(finished).toBe(false);
      expect(spec.decls.find((d) => d.kind === "agent")).toMatchObject({ instructions: "a weather bot", tools: ["get_weather"] });
      expect(notes.some((n) => n.text.includes("Studio added one"))).toBe(true);
    },
    TIMEOUT_MS,
  );

  test(
    "prose where code belongs is carried verbatim, then replaced host-side",
    async () => {
      const messages = await runInWorker({
        type: "run",
        code: scripted(REQ, [
          call("c1", "create_tool", { ...WEATHER_TOOL, code: "First, call the weather API. Then return the temperature." }),
          call("c2", "create_agent", { id: "assistant", purpose: "p", instructions: "i", tools: ["get_weather"] }),
          say("Done."),
        ]),
      });

      // The worker does not judge the body — it emits what the model said, and the host decides.
      expect(JSON.stringify(payloads(messages))).toContain("First, call the weather API.");

      const { spec, notes } = creatorToSpec(parseCreatorEvents(payloads(messages)), MODEL, "j");
      const tool = spec.decls.find((d) => d.kind === "tool");
      expect(tool?.kind === "tool" && tool.execute.code).toContain("TODO");
      expect(notes.some((n) => n.text.includes("wasn't usable code"))).toBe(true);
    },
    TIMEOUT_MS,
  );
});
