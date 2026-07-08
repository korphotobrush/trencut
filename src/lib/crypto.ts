// API 키 암호화/복호화 유틸 (AES-GCM, Web Crypto API 사용 - Workers 런타임 호환)
// ENCRYPTION_KEY는 .dev.vars / Cloudflare Secrets에 32바이트 base64로 저장

async function getKey(rawKey: string): Promise<CryptoKey> {
  const keyBytes = Uint8Array.from(atob(rawKey), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptValue(plain: string, rawKey: string): Promise<string> {
  const key = await getKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptValue(encoded: string, rawKey: string): Promise<string> {
  const key = await getKey(rawKey);
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const cipher = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
  return new TextDecoder().decode(plain);
}
