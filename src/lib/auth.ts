/**
 * ورود پنل مدیریت.
 *
 * فعلاً تک‌رمزی است: رمز در متغیر محیطی ADMIN_PASSWORD و کوکی نشست با HMAC
 * امضا می‌شود تا قابل جعل نباشد. از Web Crypto استفاده می‌کند چون middleware
 * روی رانتایم edge اجرا می‌شود و ماژول crypto نود آنجا در دسترس نیست.
 *
 * وقتی ورود پیامکی کاربران ساخته شد، همین لایه به نقش ADMIN جدول User وصل می‌شود.
 */

export const SESSION_COOKIE = "misagh_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // ۱۲ ساعت

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(signature);
}

/** مقایسه بدون نشت زمانی */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET تنظیم نشده یا کوتاه است — حداقل ۱۶ کاراکتر لازم است");
  }
  return value;
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  return safeEqual(input, expected);
}

/** توکن نشست: زمان انقضا به‌همراه امضای همان زمان */
export async function createSession(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(String(expiresAt), secret());
  return `${expiresAt}.${signature}`;
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  try {
    const expected = await hmac(expiresAt, secret());
    return safeEqual(signature, expected);
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
