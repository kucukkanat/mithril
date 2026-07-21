import { expect, test } from "bun:test";
import { aesGcmCodec, generateEncryptionKey, generateStateKey, open, seal, singleKeyring, StateIntegrityError } from "../src/agent/index.ts";

test("seal → open round-trips", async () => {
  const keyring = singleKeyring(await generateStateKey());
  const token = await seal(JSON.stringify({ hello: "world" }), keyring);
  expect(token.split(".").length).toBe(3);
  const body = await open(token, keyring);
  expect(JSON.parse(body)).toEqual({ hello: "world" });
});

test("a tampered payload is rejected", async () => {
  const keyring = singleKeyring(await generateStateKey());
  const token = await seal("original", keyring);
  const [h, _p, d] = token.split(".");
  const forged = `${h}.${btoa("evil").replace(/=+$/, "")}.${d}`;
  await expect(open(forged, keyring)).rejects.toBeInstanceOf(StateIntegrityError);
});

test("a token signed by a different key is rejected", async () => {
  const a = singleKeyring(await generateStateKey());
  const b = singleKeyring(await generateStateKey());
  const token = await seal("secret", a);
  await expect(open(token, b)).rejects.toBeInstanceOf(StateIntegrityError);
});

test("a non-3-part token is rejected", async () => {
  const keyring = singleKeyring(await generateStateKey());
  await expect(open("not.a.valid.token.shape", keyring)).rejects.toBeInstanceOf(StateIntegrityError);
});

test("AES-GCM codec adds confidentiality (encrypted at rest, still round-trips)", async () => {
  const keyring = singleKeyring(await generateStateKey());
  const codec = aesGcmCodec(await generateEncryptionKey());
  const token = await seal(JSON.stringify({ ssn: "123-45-6789" }), keyring, undefined, codec);
  expect(token).not.toContain("123-45-6789"); // the PII is not in the token payload
  const body = await open(token, keyring, undefined, { codec });
  expect(JSON.parse(body)).toEqual({ ssn: "123-45-6789" });
});
