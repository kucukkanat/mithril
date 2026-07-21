/**
 * Deterministic test doubles for `@mithril/core` — a scripted, zero-network provider for exercising the
 * agent loop end-to-end.
 *
 * @remarks Pair {@link scriptedProvider} (replays fixed provider chunks turn-by-turn) with
 * {@link testModel} (wraps it in a self-wiring {@link ModelHandle}) to drive {@link agent}/{@link agentLoop}
 * without any real provider call.
 *
 * @packageDocumentation
 */

import type { ModelHandle, ModelId, Provider, ProviderChunk, ProviderSpec } from "../protocol/index.ts";

// A deterministic provider for tests: each call to chat() replays the next scripted "turn" of chunks. This
// is the record/replay philosophy as a test double — the loop is exercised end-to-end with zero network.

const TEST_SPEC: ProviderSpec = {
  id: "test",
  models: {
    x: {
      capabilities: {
        tools: true,
        structuredOutput: true,
        reasoning: false,
        promptCaching: false,
        vision: false,
        browserSafe: true,
      },
      pricing: {
        inputMicroUsdPerToken: 0,
        outputMicroUsdPerToken: 0,
        cacheReadMicroUsdPerToken: 0,
        cacheWriteMicroUsdPerToken: 0,
        reasoningMicroUsdPerToken: 0,
      },
      contextWindow: 1000,
    },
  },
};

/**
 * Build a deterministic {@link Provider} that replays a fixed script of provider chunks.
 *
 * @param turns - one array of {@link ProviderChunk}s per model turn; the Nth `chat()` call yields the Nth
 * turn (an exhausted script yields an empty turn).
 * @returns a `Provider` whose `spec` advertises a single `test/x` model and never touches the network.
 * @remarks Turn state is per-provider and mutates across `chat()` calls, so use a fresh provider per test.
 * @example
 * ```ts
 * import { scriptedProvider, testModel } from "@mithril/core/testkit";
 * import { agent } from "@mithril/core/agent";
 *
 * const provider = scriptedProvider([
 *   [
 *     { type: "text.delta", delta: "Hi there" },
 *     { type: "message.end", finishReason: "stop", usage: ZERO_DELTA },
 *   ],
 * ]);
 * const result = await agent({ model: testModel(provider), instructions: "…" }).run("hello");
 * ```
 */
export function scriptedProvider(turns: readonly (readonly ProviderChunk[])[]): Provider {
  let i = 0;
  return {
    spec: TEST_SPEC,
    async *chat() {
      const turn = turns[i] ?? [];
      i++;
      for (const chunk of turn) yield chunk;
    },
  };
}

/**
 * Wrap a test {@link Provider} in a self-wiring {@link ModelHandle} for direct use as an agent's `model`.
 *
 * @param provider - the provider to bind, typically from {@link scriptedProvider}.
 * @param id - the model id (default `"test/x"`, matching the scripted provider's spec).
 * @returns a `ModelHandle` that carries its provider, so no {@link ProviderRegistry} is needed.
 */
export function testModel(provider: Provider, id: ModelId = "test/x"): ModelHandle {
  return { id, provider };
}
