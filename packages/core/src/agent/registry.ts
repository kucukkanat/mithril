import type {
  ModelId,
  ModelInput,
  Provider,
  ProviderRegistry,
  ProviderSpec,
  Transport,
} from "../protocol/index.ts";

/**
 * The library's typed error, carrying a stable machine-readable `code` alongside the message.
 *
 * @remarks Thrown throughout the agent layer — e.g. `NO_PROVIDER` (unresolvable model),
 * `INVALID_TOOL_INPUT` (schema validation), `BAD_TOKEN` (unsupported resume-token version), and
 * `NOT_IMPLEMENTED` (unwired suspension tiers). Discriminate on `.code` rather than the message text.
 */
export class MithrilError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "MithrilError";
  }
}

/**
 * {@link MithrilError} codes that denote a transient failure worth retrying — a provider/network hiccup,
 * not a programming or validation error.
 *
 * @remarks Consumed by {@link toSerializedError} to set {@link SerializedError.retryable}, which a
 * fallback/cascade layer can key off. Deliberately conservative: validation/config errors are excluded.
 */
export const RETRYABLE_CODES: ReadonlySet<string> = new Set<string>(["PROVIDER_ERROR"]);

/**
 * Assemble a {@link ProviderRegistry} from one or more providers, keyed by each provider's spec id.
 *
 * @param providers - the providers to register; the `provider` segment of a `provider/model` id selects one.
 * @returns a registry exposing the collected `specs` and a `resolve(model)` lookup.
 * @throws {@link MithrilError} `NO_PROVIDER` from `resolve` when no registered provider matches the model id.
 */
export function providerRegistry(...providers: readonly Provider[]): ProviderRegistry {
  const byId = new Map<string, Provider>();
  const specs: ProviderSpec[] = [];
  for (const p of providers) {
    byId.set(p.spec.id, p);
    specs.push(p.spec);
  }
  return {
    specs,
    resolve(model: ModelId): Provider {
      const providerId = model.split("/")[0] ?? "";
      const provider = byId.get(providerId);
      if (provider === undefined) {
        throw new MithrilError(
          "NO_PROVIDER",
          `No provider for "${model}". Use model: anthropic("…") (a self-wiring handle), or pass providers:.`,
        );
      }
      return provider;
    },
  };
}

/**
 * Resolve a {@link ModelInput} to its concrete id and serving provider.
 *
 * @param model - a self-wiring {@link ModelHandle} (carries its own provider) or a bare `provider/model` id.
 * @param registry - the {@link ProviderRegistry} used to look up the provider for a bare-string model.
 * @returns the resolved `{ id, provider }`.
 * @throws {@link MithrilError} `NO_PROVIDER` when `model` is a bare string but no registry is supplied, or
 * when the registry has no matching provider.
 */
export function resolveModel(
  model: ModelInput,
  registry?: ProviderRegistry,
): { readonly id: ModelId; readonly provider: Provider } {
  if (typeof model !== "string") return { id: model.id, provider: model.provider };
  if (registry === undefined) {
    throw new MithrilError(
      "NO_PROVIDER",
      `Model "${model}" is a bare string but no provider registry was given. Pass providers:, or use a model handle.`,
    );
  }
  return { id: model, provider: registry.resolve(model) };
}

/**
 * Resolve the {@link Transport} for a run, defaulting to BYOK from the environment.
 *
 * @param explicit - a caller-supplied transport; returned unchanged when present.
 * @param modelId - the resolved model id; its `provider` segment selects the `<PROVIDER>_API_KEY` env var.
 * @returns the explicit transport, or a `byok` transport reading `<PROVIDER>_API_KEY` (empty string if unset).
 */
export function resolveTransport(explicit: Transport | undefined, modelId: ModelId): Transport {
  if (explicit !== undefined) return explicit;
  const providerId = modelId.split("/")[0] ?? "";
  const envVar = `${providerId.toUpperCase()}_API_KEY`;
  const apiKey = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[
    envVar
  ];
  return { kind: "byok", apiKey: apiKey ?? "" };
}
