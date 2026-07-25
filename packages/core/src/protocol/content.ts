import type { JsonValue } from "./primitives.ts";

// Multimodal message content — the parts a `user` (or pre-seeded `assistant`) message can carry beyond plain
// text: images and files. Runtime-agnostic and browser-safe: binary sources (Uint8Array) are normalized to a
// JSON-safe `data:` URL string at the input boundary, so message history and resumable tokens round-trip
// through `JSON.stringify`. Providers translate the normalized parts into their own wire format.

/**
 * One part of a multimodal message. `image`/`file` sources may be a URL (`https:`/`data:`), a bare base64
 * string (with `mediaType`), or raw bytes (`Uint8Array`) — all normalized to a `data:`/URL string for storage
 * and transport via {@link normalizeContent}.
 */
export type ContentPart =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "image"; readonly image: string | Uint8Array; readonly mediaType?: string }
  | { readonly type: "file"; readonly data: string | Uint8Array; readonly mediaType: string; readonly filename?: string };

const B64_CHUNK = 0x8000;

// Encode bytes as base64 with the browser-safe global `btoa` (present in browsers, Node ≥18, and Bun),
// chunked so a large buffer never overflows the argument list of `String.fromCharCode`.
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += B64_CHUNK) bin += String.fromCharCode(...bytes.subarray(i, i + B64_CHUNK));
  return btoa(bin);
}

function isUrl(s: string): boolean {
  return s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:");
}

// Turn any accepted source into a JSON-safe string: raw bytes → a `data:` URL; a bare base64 string with a
// known media type → a `data:` URL; an existing URL (`http(s):`/`data:`) → unchanged.
function toStoredSource(src: string | Uint8Array, mediaType: string | undefined): string {
  if (typeof src !== "string") return `data:${mediaType ?? "application/octet-stream"};base64,${bytesToBase64(src)}`;
  if (isUrl(src)) return src;
  return mediaType !== undefined ? `data:${mediaType};base64,${src}` : src;
}

/** Normalize one part so its binary source becomes a JSON-safe string (URLs pass through). */
export function normalizeContentPart(part: ContentPart): ContentPart {
  if (part.type === "text") return part;
  if (part.type === "image") {
    return { type: "image", image: toStoredSource(part.image, part.mediaType), ...(part.mediaType !== undefined ? { mediaType: part.mediaType } : {}) };
  }
  return { type: "file", data: toStoredSource(part.data, part.mediaType), mediaType: part.mediaType, ...(part.filename !== undefined ? { filename: part.filename } : {}) };
}

/** Normalize a message's content: a string passes through; parts are each {@link normalizeContentPart}-ed. */
export function normalizeContent(content: string | readonly ContentPart[]): string | readonly ContentPart[] {
  return typeof content === "string" ? content : content.map(normalizeContentPart);
}

/** A media source resolved for a provider body: an external URL, or inline base64 with its media type. */
export type MediaSource = { readonly kind: "url"; readonly url: string } | { readonly kind: "base64"; readonly mediaType: string; readonly data: string };

/**
 * Resolve a normalized source string into a provider-ready form: a `data:` URL splits into `{ base64,
 * mediaType }`; an `http(s):` URL stays a URL. Providers that inline bytes (Anthropic, Google) use the base64
 * branch; providers that accept a URL directly (OpenAI `image_url`) can pass the string through.
 */
export function toMediaSource(source: string, fallbackMediaType?: string): MediaSource {
  if (source.startsWith("data:")) {
    const comma = source.indexOf(",");
    const header = source.slice(5, comma < 0 ? source.length : comma);
    const mediaType = header.split(";")[0] || fallbackMediaType || "application/octet-stream";
    return { kind: "base64", mediaType, data: comma < 0 ? "" : source.slice(comma + 1) };
  }
  return { kind: "url", url: source };
}

/** Flatten content to plain text (for logging / the reducer's string-only {@link Message}). */
export function contentToText(content: string | readonly ContentPart[]): string {
  if (typeof content === "string") return content;
  return content.map((p) => (p.type === "text" ? p.text : p.type === "image" ? "[image]" : `[file: ${p.filename ?? p.mediaType}]`)).join(" ");
}

/** Project content into a JSON-safe value (for the `run.start` event). Assumes sources are already normalized. */
export function contentToJson(content: string | readonly ContentPart[]): JsonValue {
  if (typeof content === "string") return content;
  return content.map((p) => {
    if (p.type === "text") return { type: "text", text: p.text };
    if (p.type === "image") return { type: "image", image: typeof p.image === "string" ? p.image : "", ...(p.mediaType !== undefined ? { mediaType: p.mediaType } : {}) };
    return { type: "file", data: typeof p.data === "string" ? p.data : "", mediaType: p.mediaType, ...(p.filename !== undefined ? { filename: p.filename } : {}) };
  });
}
