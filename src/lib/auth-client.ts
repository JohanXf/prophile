import { auth } from "@/lib/firebase";

const LOCAL_TOKEN_STORAGE_KEY = "prophile:session_token";

function readStoredLocalToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = window.localStorage.getItem(LOCAL_TOKEN_STORAGE_KEY);
    return val && val.startsWith("prophile.") ? val : null;
  } catch {
    return null;
  }
}

function writeStoredLocalToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token && token.startsWith("prophile.")) {
      window.localStorage.setItem(LOCAL_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(LOCAL_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage access errors
  }
}

let inMemoryIdToken: string | null = readStoredLocalToken();

export function setInMemoryAuthToken(token: string | null) {
  inMemoryIdToken = token;
  if (token && token.startsWith("prophile.")) {
    writeStoredLocalToken(token);
  } else {
    writeStoredLocalToken(null);
  }
}

export function clearStoredLocalToken() {
  if (inMemoryIdToken?.startsWith("prophile.")) {
    inMemoryIdToken = null;
  }
  writeStoredLocalToken(null);
}

export function getInMemoryAuthToken(): string | null {
  if (!inMemoryIdToken) {
    inMemoryIdToken = readStoredLocalToken();
  }
  return inMemoryIdToken;
}

export function isLocalTokenInMemory(): boolean {
  const tok = getInMemoryAuthToken();
  return Boolean(tok && tok.startsWith("prophile."));
}

export async function getFreshAuthToken(): Promise<string | null> {
  const current = getInMemoryAuthToken();
  if (current && current.startsWith("prophile.")) {
    return current;
  }
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      inMemoryIdToken = token;
      return token;
    } catch {
      return inMemoryIdToken;
    }
  }
  return inMemoryIdToken;
}

export async function getAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const token = await getFreshAuthToken();
  const headers: Record<string, string> = { ...(extra ?? {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getFreshAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}
