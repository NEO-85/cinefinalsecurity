/**
 * ══════════════════════════════════════════════════════════════
 *  CINETARO API — CRYPTO MODULE
 * ══════════════════════════════════════════════════════════════
 *
 *  TWO LAYERS OF ENCRYPTION:
 *
 *  1. CLIENT LAYER (AES-256-GCM):
 *     Encrypts the API response so network tab shows binary.
 *     Client CAN decrypt this — it's to hide data in transit.
 *
 *  2. SESSION LAYER (AES-256-GCM + separate key):
 *     Server-only key. Creates opaque session tokens.
 *     Client NEVER sees the decryption key.
 *     Used for stream proxy — URLs never leave the server.
 *
 *  FORMAT: [12-byte IV] [AES-GCM ciphertext + 16-byte auth tag]
 *
 *  All base64 uses URL-safe encoding (no +, /, =) so tokens
 *  work safely in URL paths like /file2/TOKEN/path
 *
 * ══════════════════════════════════════════════════════════════
 */

/* ── URL-safe base64 helpers (no +, /, =) ── */
function toUrlSafeB64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafeB64(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/* ── CLIENT LAYER ── */
const CLIENT_PASS = "cinetaro-x7k9-stream-v2-2024";
const CLIENT_SALT = "cinetaro-salt-v1-x7";

async function deriveClientKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw", enc.encode(CLIENT_PASS), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(CLIENT_SALT), iterations: 100000, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, usage
  );
}

export async function encryptPayload(data: string): Promise<ArrayBuffer> {
  const key = await deriveClientKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(data)
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return result.buffer;
}

export const CLIENT_PASS_B64 = "Y2luZXRhcm8teDdrOS1zdHJlYW0tdjItMjAyNA==";
export const CLIENT_SALT_B64 = "Y2luZXRhcm8tc2FsdC12MS14Nw==";

/* ── SESSION LAYER (server-only key — NEVER sent to client) ── */
const SESSION_PASS = "cinetaro-proxy-k9m2-sessions-2024-x7";
const SESSION_SALT = "cinetaro-session-salt-v3";

async function deriveSessionKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey(
    "raw", enc.encode(SESSION_PASS), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(SESSION_SALT), iterations: 100000, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, usage
  );
}

/** Create a session token: encrypts {baseUrl, servers, exp} → URL-safe base64 string */
export async function createSessionToken(data: {
  baseUrl: string;
  servers: string[];
}): Promise<string> {
  const key = await deriveSessionKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = JSON.stringify({
    ...data,
    exp: Math.floor(Date.now() / 1000) + 7200, // 2 hours
  });
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(payload)
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return toUrlSafeB64(result.buffer);
}

/** Decode a session token: URL-safe base64 → {baseUrl, servers, exp} */
export async function decodeSessionToken(
  token: string
): Promise<{ baseUrl: string; servers: string[]; exp: number } | null> {
  try {
    const key = await deriveSessionKey(["decrypt"]);
    const binary = fromUrlSafeB64(token);
    const iv = binary.slice(0, 12);
    const ct = binary.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, key, ct
    );
    const data = JSON.parse(new TextDecoder().decode(decrypted));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Encrypt a URL for use as proxy parameter (URL-safe base64) */
export async function encryptUrl(url: string): Promise<string> {
  const key = await deriveSessionKey(["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, new TextEncoder().encode(url)
  );
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  return toUrlSafeB64(result.buffer);
}

/** Decrypt a URL from proxy parameter */
export async function decryptUrl(token: string): Promise<string | null> {
  try {
    const key = await deriveSessionKey(["decrypt"]);
    const binary = fromUrlSafeB64(token);
    const iv = binary.slice(0, 12);
    const ct = binary.slice(12);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, key, ct
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}
