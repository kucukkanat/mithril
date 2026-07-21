// URL-encode playground code into the location hash so runs are shareable and
// docs can deep-link "Open in playground". UTF-8 safe, URL-safe base64.

export function encodeCode(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCode(encoded: string): string | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Read `#code=…` from the current URL, if present. */
export function codeFromHash(): string | null {
  if (typeof location === "undefined") return null;
  const m = /[#&]code=([^&]+)/.exec(location.hash);
  return m?.[1] ? decodeCode(m[1]) : null;
}

/** Build a shareable absolute URL for the given code. */
export function shareUrl(code: string): string {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#code=${encodeCode(code)}`;
}
