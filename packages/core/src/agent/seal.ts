import type { RuntimeAdapter } from "../protocol/index.ts";

// §5.3/§5.4 — sealed run tokens. Three-part authenticated envelope `header.payload.digest` where the digest
// covers `header + "." + payload` (so kid/codec are tamper-evident and readable BEFORE verification). This
// slice implements the HMAC (integrity) codec; AES-GCM confidentiality is a follow-up.

/**
 * A source of signing/verification keys for sealed tokens, indexed by key id (`kid`).
 *
 * @remarks `current()` supplies the `{ kid, key }` used to sign new tokens ({@link seal}); `resolve(kid)`
 * picks a (possibly retired) key by the `kid` embedded in a token's envelope, so verification survives
 * rotation ({@link open}). Build a single-key keyring with {@link singleKeyring}.
 */
export interface Keyring {
  current(): Promise<{ readonly kid: string; readonly key: CryptoKey }>; // sign new tokens with this
  resolve(kid: string): Promise<CryptoKey | undefined>; // verify: pick a (possibly retired) key by envelope kid
}

/**
 * Thrown when a sealed token fails to open — bad envelope, unknown `kid`, codec mismatch, size overflow,
 * an unavailable `crypto.subtle`, or a failed HMAC verification (possible tampering).
 */
export class StateIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateIntegrityError";
  }
}

function subtleOf(rt?: RuntimeAdapter): SubtleCrypto {
  const s = rt?.subtle ?? globalThis.crypto.subtle;
  if (s === undefined) throw new StateIntegrityError("crypto.subtle is unavailable (insecure context); use durable-local, not sealed tokens.");
  return s;
}

/**
 * Generate an extractable HMAC-SHA-256 signing key for sealing tokens.
 *
 * @param rt - optional {@link RuntimeAdapter} providing `subtle`; falls back to `globalThis.crypto.subtle`.
 * @returns a `CryptoKey` usable for `sign`/`verify`, e.g. wrapped in a {@link singleKeyring}.
 * @throws {@link StateIntegrityError} when `crypto.subtle` is unavailable (insecure context).
 */
export function generateStateKey(rt?: RuntimeAdapter): Promise<CryptoKey> {
  return subtleOf(rt).generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign", "verify"]);
}

// §5.3 codec seam. The signing (HMAC) is always applied; a codec optionally transforms the payload bytes
// before signing (identity for integrity-only, AES-GCM for at-rest confidentiality).
/**
 * A payload transform applied before signing (encode) and after verifying (decode) in the seal envelope.
 *
 * @remarks The HMAC signature is always applied by {@link seal}; the codec optionally transforms the
 * payload bytes underneath it. `id` is recorded in the envelope header and checked on {@link open}.
 * Built-ins: {@link hmacCodec} (identity — integrity only) and {@link aesGcmCodec} (at-rest confidentiality).
 */
export interface SealCodec {
  readonly id: string;
  encode(bytes: Uint8Array, rt?: RuntimeAdapter): Promise<Uint8Array>;
  decode(bytes: Uint8Array, rt?: RuntimeAdapter): Promise<Uint8Array>;
}

/**
 * The identity {@link SealCodec} (`id: "hmac"`): integrity-only, leaving the payload bytes untransformed.
 *
 * @returns a codec that passes bytes through unchanged; the outer HMAC provides tamper-evidence.
 */
export function hmacCodec(): SealCodec {
  return {
    id: "hmac",
    async encode(bytes) {
      return bytes;
    },
    async decode(bytes) {
      return bytes;
    },
  };
}

/**
 * Generate an extractable AES-GCM-256 key for the {@link aesGcmCodec} confidentiality codec.
 *
 * @param rt - optional {@link RuntimeAdapter} providing `subtle`; falls back to `globalThis.crypto.subtle`.
 * @returns a `CryptoKey` usable for `encrypt`/`decrypt`.
 * @throws {@link StateIntegrityError} when `crypto.subtle` is unavailable (insecure context).
 */
export function generateEncryptionKey(rt?: RuntimeAdapter): Promise<CryptoKey> {
  return subtleOf(rt).generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/**
 * Build an AES-GCM {@link SealCodec} (`id: "aesgcm"`) for at-rest confidentiality of sealed payloads.
 *
 * @param key - the AES-GCM key (see {@link generateEncryptionKey}).
 * @returns a codec that encrypts on `encode` and decrypts on `decode`, prepending a random 12-byte IV to
 * each ciphertext (OQ-2 — for checkpoints holding PII).
 * @remarks Pass it to both {@link seal} and {@link open}; the envelope's recorded codec id must match on open.
 */
export function aesGcmCodec(key: CryptoKey): SealCodec {
  return {
    id: "aesgcm",
    async encode(bytes, rt) {
      const subtle = subtleOf(rt);
      const iv = new Uint8Array(12);
      (rt?.getRandomValues ?? ((a: Uint8Array) => (globalThis.crypto.getRandomValues(a), a)))(iv);
      const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv: ab(iv) }, key, ab(bytes)));
      const out = new Uint8Array(iv.length + ct.length);
      out.set(iv);
      out.set(ct, iv.length);
      return out;
    },
    async decode(bytes, rt) {
      const subtle = subtleOf(rt);
      const pt = await subtle.decrypt({ name: "AES-GCM", iv: ab(bytes.slice(0, 12)) }, key, ab(bytes.slice(12)));
      return new Uint8Array(pt);
    },
  };
}

/**
 * The common single-key {@link Keyring}: signs and verifies with one key under a fixed `kid`.
 *
 * @param key - the signing/verification key (or a promise of it).
 * @param kid - the key id embedded in the envelope (default `"k1"`).
 * @returns a keyring whose `current()` always returns this key and whose `resolve(id)` returns it only for
 * the matching `kid`. Rotate by composing a keyring whose `current()` is new while `resolve()` retains the old.
 */
export function singleKeyring(key: CryptoKey | Promise<CryptoKey>, kid = "k1"): Keyring {
  const k = Promise.resolve(key);
  return {
    async current() {
      return { kid, key: await k };
    },
    async resolve(id) {
      return id === kid ? await k : undefined;
    },
  };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Copy into a fresh ArrayBuffer (a BufferSource) — dodges the generic Uint8Array<ArrayBufferLike> vs
// ArrayBufferView<ArrayBuffer> mismatch in the lib's WebCrypto types.
function ab(u: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u.byteLength);
  new Uint8Array(out).set(u);
  return out;
}

function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Seal a string into a signed, tamper-evident `header.payload.digest` envelope.
 *
 * @param body - the plaintext to protect (e.g. a run resume token from {@link RunResult}).
 * @param keyring - supplies the current signing key and its `kid`.
 * @param rt - optional {@link RuntimeAdapter} providing `subtle`; falls back to `globalThis.crypto.subtle`.
 * @param codec - the payload {@link SealCodec}; defaults to {@link hmacCodec} (integrity-only).
 * @returns the sealed token string. The HMAC digest covers `header + "." + payload`, so `kid`/codec are
 * readable and tamper-evident before verification.
 * @throws {@link StateIntegrityError} when `crypto.subtle` is unavailable (insecure context).
 * @example
 * ```ts
 * import { seal, open, singleKeyring, generateStateKey } from "@mithril/core/agent";
 *
 * const keyring = singleKeyring(await generateStateKey());
 * const token = await seal(runResult.token, keyring); // runResult.status === "suspended"
 * // …persist `token`; later, verify + recover the original body:
 * const body = await open(token, keyring);
 * ```
 */
export async function seal(body: string, keyring: Keyring, rt?: RuntimeAdapter, codec: SealCodec = hmacCodec()): Promise<string> {
  const subtle = subtleOf(rt);
  const { kid, key } = await keyring.current();
  const header = b64url(encoder.encode(JSON.stringify({ v: 1, kid, codec: codec.id })));
  const payload = b64url(await codec.encode(encoder.encode(body), rt));
  const sig = new Uint8Array(await subtle.sign("HMAC", key, ab(encoder.encode(`${header}.${payload}`))));
  return `${header}.${payload}.${b64url(sig)}`;
}

/**
 * Verify a sealed token and recover its original body.
 *
 * @param token - a `header.payload.digest` string produced by {@link seal}.
 * @param keyring - resolves the verification key by the envelope's `kid`.
 * @param rt - optional {@link RuntimeAdapter} providing `subtle`; falls back to `globalThis.crypto.subtle`.
 * @param opts - `codec` must match the sealing codec (default {@link hmacCodec}); `maxBytes` caps token size
 * (default 4 MiB) as a cheap DoS guard before any crypto runs.
 * @returns the recovered plaintext body.
 * @throws {@link StateIntegrityError} on oversize input, a malformed 3-part envelope or header, an
 * unresolvable `kid`, failed HMAC verification (possible tampering), or a codec-id mismatch.
 * @example
 * ```ts
 * import { open, StateIntegrityError } from "@mithril/core/agent";
 *
 * try {
 *   const body = await open(token, keyring);
 *   const result = await agent.resume(body, { kind: "approve" }, { deps });
 * } catch (err) {
 *   if (err instanceof StateIntegrityError) {
 *     // tampered, expired key, or wrong codec — reject the token
 *   }
 * }
 * ```
 */
export async function open(
  token: string,
  keyring: Keyring,
  rt?: RuntimeAdapter,
  opts?: { readonly codec?: SealCodec; readonly maxBytes?: number },
): Promise<string> {
  const maxBytes = opts?.maxBytes ?? 4 * 1024 * 1024;
  if (token.length > maxBytes) throw new StateIntegrityError("token exceeds maxBytes");
  const parts = token.split(".");
  const [header, payload, digest] = parts;
  if (parts.length !== 3 || header === undefined || payload === undefined || digest === undefined) {
    throw new StateIntegrityError("expected a 3-part sealed token (header.payload.digest)");
  }
  let meta: { readonly v: number; readonly kid: string; readonly codec: string };
  try {
    meta = JSON.parse(decoder.decode(unb64url(header))) as { readonly v: number; readonly kid: string; readonly codec: string };
  } catch {
    throw new StateIntegrityError("malformed token header");
  }
  const key = await keyring.resolve(meta.kid);
  if (key === undefined) throw new StateIntegrityError(`no verify key for kid "${meta.kid}"`);
  const subtle = subtleOf(rt);
  const ok = await subtle.verify("HMAC", key, ab(unb64url(digest)), ab(encoder.encode(`${header}.${payload}`)));
  if (!ok) throw new StateIntegrityError("HMAC verification failed (possible tampering)");
  // verified — now safe to decode (and, for aesgcm, decrypt) the payload
  const codec = opts?.codec ?? hmacCodec();
  if (meta.codec !== codec.id) {
    throw new StateIntegrityError(`codec mismatch: token uses "${meta.codec}", opener provided "${codec.id}"`);
  }
  return decoder.decode(await codec.decode(unb64url(payload), rt));
}
