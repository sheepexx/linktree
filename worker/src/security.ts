const encoder = new TextEncoder();
const BASE32_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function bytesToHex(bytes: Uint8Array): string {
  let result = "";
  for (const byte of bytes) result += byte.toString(16).padStart(2, "0");
  return result;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export function requireStrongSecret(secret: string | undefined): string {
  if (!secret || encoder.encode(secret).byteLength < 32) {
    throw new Error("Required Worker secret is missing or too short.");
  }
  return secret;
}

export async function hmacHex(
  secret: string,
  domain: string,
  value: string,
): Promise<string> {
  const key = await importHmacKey(requireStrongSecret(secret));
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${domain}\0${value}`),
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export function constantTimeEqual(left: string, right: string): boolean {
  const maximumLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < maximumLength; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

export function randomVerificationCode(): string {
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / 10_000) * 10_000;
  let value: number;

  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= limit);

  return String(value % 10_000).padStart(4, "0");
}

export function randomOpaqueToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function createCommissionRequestId(now = new Date()): string {
  const date = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(
    bytes,
    (value) => BASE32_ALPHABET[value & 31],
  ).join("");

  return `SXP-${date}-${suffix}`;
}

export function normalizeEmail(email: string): string {
  return email.normalize("NFKC").trim().toLowerCase();
}

export function isChallengeExpired(
  expiresAtSeconds: number,
  nowSeconds: number,
): boolean {
  return expiresAtSeconds <= nowSeconds;
}

export function hasAttemptsRemaining(
  attempts: number,
  maximumAttempts: number,
): boolean {
  return attempts < maximumAttempts;
}
