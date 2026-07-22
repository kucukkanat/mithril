// Vendored mirror of @standard-schema/spec@1 (types only) so `@mithril/core` type-checks and runs with
// ZERO install in this environment. The published package will instead re-export the upstream type:
//   export type { StandardSchemaV1 } from "@standard-schema/spec";
// Keeping it local changes nothing at runtime — Standard Schema is a type-only contract (all values are
// supplied by the consumer's validator, e.g. Zod/Valibot/ArkType), so there is no code to depend on.

/**
 * The Standard Schema v1 contract — a validator-agnostic interface implemented
 * by Zod, Valibot, ArkType, and others.
 *
 * @typeParam Input - The value type accepted before validation.
 * @typeParam Output - The validated, parsed value type.
 *
 * @remarks
 * This is a type-only mirror of `@standard-schema/spec@1`, vendored so
 * `@mithril/core` type-checks with zero install. All runtime behaviour is
 * supplied by the consumer's validator; there is no code to depend on.
 */
// biome-ignore lint/style/useNamingConvention: the "~standard" key is fixed by the Standard Schema spec.
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  export interface Props<Input, Output> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    // `| undefined` is upstream-verbatim (@standard-schema/spec) and load-bearing: without it a consumer
    // compiling under `exactOptionalPropertyTypes: true` cannot assign a Zod/Valibot schema here.
    readonly types?: Types<Input, Output> | undefined;
  }
  export type Result<Output> = SuccessResult<Output> | FailureResult;
  export interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }
  export interface FailureResult {
    readonly issues: readonly Issue[];
  }
  export interface Issue {
    readonly message: string;
    readonly path?: readonly (PropertyKey | PathSegment)[] | undefined;
  }
  export interface PathSegment {
    readonly key: PropertyKey;
  }
  export interface Types<Input, Output> {
    readonly input: Input;
    readonly output: Output;
  }
  export type InferInput<T extends StandardSchemaV1> = NonNullable<T["~standard"]["types"]>["input"];
  export type InferOutput<T extends StandardSchemaV1> = NonNullable<T["~standard"]["types"]>["output"];
}
