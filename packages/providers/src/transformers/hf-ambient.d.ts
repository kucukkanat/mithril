// Hand-written ambient types for the SUBSET of `@huggingface/transformers` the edge uses, so strict `tsc`
// passes with the optional peer UNINSTALLED (it is dynamic-import()ed only at runtime in the browser). No
// `any`. Pin against the installed version's real types when the peer is present.

declare module "@huggingface/transformers" {
  export interface ProgressInfo {
    readonly status: string;
    readonly name?: string;
    readonly file?: string;
    readonly progress?: number;
    readonly loaded?: number;
    readonly total?: number;
  }
  export interface FromPretrainedOptions {
    readonly device?: string;
    readonly dtype?: string;
    readonly progress_callback?: (info: ProgressInfo) => void;
  }
  export interface Tensor {
    readonly dims: readonly number[];
  }
  export interface ChatMessage {
    readonly role: string;
    readonly content: string;
  }
  export interface ApplyChatTemplateOptions {
    readonly tools?: readonly unknown[];
    readonly add_generation_prompt?: boolean;
    readonly return_dict?: boolean;
    readonly tokenize?: boolean;
  }
  export interface EncodedInputs {
    readonly input_ids: Tensor;
    readonly [k: string]: unknown;
  }
  export interface PreTrainedTokenizer {
    apply_chat_template(messages: readonly ChatMessage[], options: ApplyChatTemplateOptions): EncodedInputs;
    get_chat_template?(): string | undefined;
  }
  export interface GenerateOptions {
    readonly max_new_tokens?: number;
    readonly do_sample?: boolean;
    readonly streamer?: unknown;
    readonly stopping_criteria?: unknown;
    readonly return_dict_in_generate?: boolean;
    readonly [k: string]: unknown;
  }
  export interface GenerateOutput {
    readonly sequences: Tensor;
  }
  export interface PreTrainedModel {
    generate(options: GenerateOptions): Promise<GenerateOutput>;
  }
  export const AutoTokenizer: {
    from_pretrained(id: string, options?: FromPretrainedOptions): Promise<PreTrainedTokenizer>;
  };
  export const AutoModelForCausalLM: {
    from_pretrained(id: string, options?: FromPretrainedOptions): Promise<PreTrainedModel>;
  };
  export interface TextStreamerOptions {
    readonly skip_prompt?: boolean;
    readonly skip_special_tokens?: boolean;
    readonly callback_function?: (text: string) => void;
  }
  export class TextStreamer {
    constructor(tokenizer: PreTrainedTokenizer, options: TextStreamerOptions);
  }
  export class InterruptableStoppingCriteria {
    interrupt(): void;
  }
  export const env: { [k: string]: unknown };
}
