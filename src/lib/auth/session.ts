import { getStore, saveStore } from "@/lib/local-store";

export type ActiveSession = {
  jti: string;
  ua: string;
  ip: string | null;
  createdAt: string | null;
  current: boolean;
  expiresAt: string | null;
};

export async function createSession(userId: number) {
  const state = getStore();
  state.currentUserId = userId;
  saveStore(state);
}

export async function revokeAllSessions(_userId: number) {}

export async function revokeSession(_userId: number, _jti: string): Promise<boolean> {
  return true;
}

export async function revokeOtherSessions(_userId: number, _currentJti: string): Promise<number> {
  return 0;
}

export async function getActiveSessionsForUser(_userId: number): Promise<ActiveSession[]> {
  return [
    {
      jti: "current-session-jti",
      ua: typeof navigator !== "undefined" ? navigator.userAgent : "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
      ip: "127.0.0.1",
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      current: true,
      expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
    },
  ];
}

export async function deleteSession() {
  const state = getStore();
  state.currentUserId = null;
  saveStore(state);
}

export async function getSessionUserId(): Promise<number | undefined> {
  const state = getStore();
  return state.currentUserId ?? undefined;
}

export async function isAuthenticated(): Promise<boolean> {
  const state = getStore();
  return state.currentUserId != null;
}

export async function getCurrentJti(): Promise<string | null> {
  return "current-session-jti";
}
