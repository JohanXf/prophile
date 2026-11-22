import crypto from "crypto";
import type { Request, Response } from "express";

const SESSION_COOKIE_NAME = "prophile_session";
const TOKEN_PREFIX = "prophile.";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.SQL_PASSWORD ||
    process.env.GEMINI_API_KEY ||
    "prophile-local-session-signing-key-v1"
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !password) return false;
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export interface SessionPayload {
  userId: number;
  email?: string | null;
  exp: number;
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

export function signSessionToken(userId: number, email?: string | null): string {
  const payload: SessionPayload = {
    userId,
    email: email ?? null,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(payloadB64)
    .digest();
  return `${TOKEN_PREFIX}${payloadB64}.${base64UrlEncode(sig)}`;
}

export function isLocalSessionToken(token: string | null | undefined): boolean {
  return Boolean(token && token.startsWith(TOKEN_PREFIX));
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  const dotIdx = rest.indexOf(".");
  if (dotIdx <= 0) return null;

  const payloadB64 = rest.slice(0, dotIdx);
  const sigB64 = rest.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) return null;

  try {
    const expectedSig = crypto
      .createHmac("sha256", getSessionSecret())
      .update(payloadB64)
      .digest();
    const actualSig = base64UrlDecode(sigB64);
    if (actualSig.length !== expectedSig.length || !crypto.timingSafeEqual(actualSig, expectedSig)) {
      return null;
    }

    const parsed = JSON.parse(base64UrlDecode(payloadB64).toString("utf8")) as SessionPayload;
    if (!parsed || typeof parsed.userId !== "number" || typeof parsed.exp !== "number") {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function parseCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const pairs = raw.split(";");
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.slice(0, eqIdx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

export function getSessionCookieToken(req: Request): string | null {
  return parseCookie(req, SESSION_COOKIE_NAME);
}

export function setSessionCookie(res: Response, token: string): void {
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  const isSecure =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.APP_URL?.startsWith("https://"));

  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=${maxAgeSeconds}`,
    isSecure ? `SameSite=None; Secure` : `SameSite=Lax`,
  ];
  res.setHeader("Set-Cookie", attributes.join("; "));
}

export function clearSessionCookie(res: Response): void {
  const isSecure =
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.APP_URL?.startsWith("https://"));

  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `Max-Age=0`,
    isSecure ? `SameSite=None; Secure` : `SameSite=Lax`,
  ];
  res.setHeader("Set-Cookie", attributes.join("; "));
}
