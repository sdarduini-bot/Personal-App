const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "pedro_trainer_secret_key_change_in_production_9988223344556677";

function stringToArrayBuffer(str: string): ArrayBuffer {
  const enc = new TextEncoder();
  const uint8 = enc.encode(str);
  const ab = new ArrayBuffer(uint8.byteLength);
  new Uint8Array(ab).set(uint8);
  return ab;
}

function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createWebSessionToken(): Promise<string> {
  const payload = JSON.stringify({
    role: "trainer",
    createdAt: Date.now(),
    nonce: Math.random().toString(36).substring(2),
  });

  const keyBuffer = stringToArrayBuffer(AUTH_SECRET);
  const dataBuffer = stringToArrayBuffer(payload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
  const signature = bufferToHex(signatureBuffer);

  const token = btoa(`${payload}.${signature}`)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return token;
}

export async function verifyWebSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;

  try {
    let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const decoded = atob(b64);

    const lastDot = decoded.lastIndexOf(".");
    if (lastDot === -1) return false;

    const payload = decoded.substring(0, lastDot);
    const providedSig = decoded.substring(lastDot + 1);

    const keyBuffer = stringToArrayBuffer(AUTH_SECRET);
    const dataBuffer = stringToArrayBuffer(payload);

    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedBuffer = await crypto.subtle.sign("HMAC", key, dataBuffer);
    const expectedSig = bufferToHex(expectedBuffer);

    if (providedSig !== expectedSig) {
      return false;
    }

    const data = JSON.parse(payload);
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    if (Date.now() - data.createdAt > maxAge) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
