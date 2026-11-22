import { auth } from "@/lib/firebase";

let inMemoryIdToken: string | null = null;

export function setInMemoryAuthToken(token: string | null) {
  inMemoryIdToken = token;
}

export function getInMemoryAuthToken(): string | null {
  return inMemoryIdToken;
}

export function isLocalTokenInMemory(): boolean {
  return Boolean(inMemoryIdToken && inMemoryIdToken.startsWith("prophile."));
}

export async function getFreshAuthToken(): Promise<string | null> {
  if (isLocalTokenInMemory()) {
    return inMemoryIdToken;
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
