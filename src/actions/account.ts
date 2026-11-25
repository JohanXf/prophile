import { authFetch } from "@/lib/auth-client";
import {
  applyUpdatedUserToStore,
  getStore,
  hydrateStoreFromServer,
  type StoredUserBase,
} from "@/lib/local-store";
import { auth, syncPublicProfileToFirestore } from "@/lib/firebase";
import { getActiveSessionsForUser, type ActiveSession } from "@/lib/auth/session";

export type Result<T = Record<string, never>> = { ok: true; data: T } | { ok: false; error: string };
export type AliasRow = { id: number; alias: string; createdAt: string };
export type AliasState = { aliases: AliasRow[]; tokens: number; slots: number; premium: boolean };
export type PasskeyRow = { id: number; name: string; createdAt: string; lastUsedAt: string | null };

async function apiJson<T>(url: string, init: RequestInit): Promise<Result<T> & { status?: number }> {
  try {
    const res = await authFetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    });
    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: string })
      : {};
    if (!res.ok) {
      const fallback =
        res.status === 404
          ? "Backend server API is unavailable on this URL (HTTP 404)."
          : res.status === 401
            ? "Your session expired. Please sign in again."
            : res.status === 503
              ? "Database is waking up — please try again in a moment."
              : `Request failed (HTTP ${res.status}).`;
      return { ok: false, error: body.error || fallback, status: res.status };
    }
    void hydrateStoreFromServer(true);
    return { ok: true, data: (body.data ?? {}) as T, status: res.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error. Please try again.",
    };
  }
}

export async function updateUsername(raw: string): Promise<Result<{ username: string }>> {
  const clean = raw.toLowerCase().trim();
  const res = await apiJson<{ username: string }>("/api/account/username", {
    method: "PATCH",
    body: JSON.stringify({ username: clean }),
  });

  const state = getStore();
  const currentUser = state.currentUserId != null ? state.users[state.currentUserId] : null;

  if (!res.ok && res.status === 404 && currentUser) {
    if (!/^[a-z0-9_.-]{2,24}$/.test(clean)) {
      return { ok: false, error: "Username must be 2–24 characters (letters, numbers, ., _, -)." };
    }
    const updated: StoredUserBase = { ...currentUser, username: clean, needsUsername: false, updatedAt: new Date() };
    applyUpdatedUserToStore(updated);
    if (auth.currentUser?.emailVerified) {
      void syncPublicProfileToFirestore({
        uid: updated.id,
        username: updated.username,
        displayName: updated.displayName || updated.username,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        bannerUrl: updated.bannerImageUrl,
        location: updated.location,
        occupation: updated.occupation,
      }).catch(() => {});
    }
    return { ok: true, data: { username: clean } };
  }

  if (res.ok && currentUser) {
    applyUpdatedUserToStore({
      ...currentUser,
      username: res.data.username || clean,
      needsUsername: false,
      updatedAt: new Date(),
    });
  }
  return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.error };
}

export async function updateDisplayName(raw: string): Promise<Result<{ displayName: string }>> {
  const displayName = raw.trim().slice(0, 48);
  const res = await apiJson<{ displayName: string }>("/api/account/display-name", {
    method: "PATCH",
    body: JSON.stringify({ displayName }),
  });

  const state = getStore();
  const currentUser = state.currentUserId != null ? state.users[state.currentUserId] : null;

  if (!res.ok && res.status === 404 && currentUser) {
    const updated: StoredUserBase = { ...currentUser, displayName, updatedAt: new Date() };
    applyUpdatedUserToStore(updated);
    if (auth.currentUser?.emailVerified) {
      void syncPublicProfileToFirestore({
        uid: updated.id,
        username: updated.username,
        displayName: updated.displayName || updated.username,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        bannerUrl: updated.bannerImageUrl,
        location: updated.location,
        occupation: updated.occupation,
      }).catch(() => {});
    }
    return { ok: true, data: { displayName } };
  }

  if (res.ok && currentUser) {
    applyUpdatedUserToStore({
      ...currentUser,
      displayName: res.data.displayName ?? displayName,
      updatedAt: new Date(),
    });
  }
  return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.error };
}

export async function addAlias(raw: string): Promise<Result<AliasState>> {
  return apiJson("/api/account/aliases", {
    method: "POST",
    body: JSON.stringify({ alias: raw }),
  });
}

export async function editAlias(id: number, raw: string): Promise<Result<AliasState>> {
  return apiJson(`/api/account/aliases/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ alias: raw }),
  });
}

export async function deleteAlias(id: number): Promise<Result<AliasState>> {
  return apiJson(`/api/account/aliases/${id}`, {
    method: "DELETE",
  });
}

export async function swapAliasWithUsername(id: number): Promise<Result<AliasState & { username: string }>> {
  return apiJson(`/api/account/aliases/${id}/swap`, {
    method: "POST",
  });
}

export async function verifyPasswordAndSendCurrentOtp(_rawPassword: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function verifyCurrentEmailOtp(_rawCode: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function sendNewEmailOtp(raw: string): Promise<Result<{ email: string }>> {
  return { ok: true, data: { email: raw.trim() } };
}

export async function confirmNewEmailOtp(_rawCode: string): Promise<Result<{ email: string }>> {
  const state = getStore();
  const uid = state.currentUserId;
  return { ok: true, data: { email: (uid != null ? state.users[uid]?.email : null) ?? "" } };
}

export async function completeDiscordOnboarding(
  rawUsername: string,
  _rawPassword: string
): Promise<Result<{ username: string }>> {
  return updateUsername(rawUsername);
}

export async function updatePassword(current: string, next: string): Promise<Result> {
  return apiJson("/api/account/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword: current, newPassword: next }),
  });
}

export async function startTwoFactorSetup(): Promise<Result<{ qr: string; secret: string }>> {
  return { ok: true, data: { qr: "/Favicon.png", secret: "JBSWY3DPEHPK3PXP" } };
}

export async function confirmTwoFactorSetup(_code: string): Promise<Result> {
  return apiJson("/api/account/settings", {
    method: "PATCH",
    body: JSON.stringify({ twoFactorEnabled: true }),
  });
}

export async function disableTwoFactor(_code: string): Promise<Result> {
  return apiJson("/api/account/settings", {
    method: "PATCH",
    body: JSON.stringify({ twoFactorEnabled: false }),
  });
}

export async function beginAddPasskey(): Promise<Result<Record<string, unknown>>> {
  return { ok: true, data: { challenge: "dGVzdA" } };
}

export async function finishAddPasskey(_response: unknown, rawName: string): Promise<Result<PasskeyRow[]>> {
  return {
    ok: true,
    data: [{ id: Date.now(), name: rawName || "Passkey", createdAt: new Date().toISOString(), lastUsedAt: null }],
  };
}

export async function removePasskey(_id: number): Promise<Result<PasskeyRow[]>> {
  return { ok: true, data: [] };
}

export async function disconnectDiscord(): Promise<Result> {
  return apiJson("/api/account/settings", {
    method: "PATCH",
    body: JSON.stringify({ disconnectDiscord: true }),
  });
}

export async function setUsernameLoginEnabled(enabled: boolean): Promise<Result<{ enabled: boolean }>> {
  const res = await apiJson("/api/account/settings", {
    method: "PATCH",
    body: JSON.stringify({ usernameLoginEnabled: enabled }),
  });
  if (!res.ok) return res;
  return { ok: true, data: { enabled } };
}

export async function getActiveSessions(): Promise<Result<ActiveSession[]>> {
  const state = getStore();
  const sessions = await getActiveSessionsForUser(state.currentUserId ?? 1);
  return { ok: true, data: sessions };
}

export async function revokeSessionAction(_jti: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function revokeOtherSessionsAction(): Promise<Result<{ revoked: number }>> {
  return { ok: true, data: { revoked: 0 } };
}

export async function verifyPasswordForDelete(_rawPassword: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function verifyOtpForDelete(_rawCode: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function confirmDeleteAccount(): Promise<Result> {
  return { ok: true, data: {} };
}

export async function cancelDeleteVerification(): Promise<Result> {
  return { ok: true, data: {} };
}
