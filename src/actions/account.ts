import { authFetch } from "@/lib/auth-client";
import { getStore, hydrateStoreFromServer } from "@/lib/local-store";
import { getActiveSessionsForUser, type ActiveSession } from "@/lib/auth/session";

export type Result<T = Record<string, never>> = { ok: true; data: T } | { ok: false; error: string };
export type AliasRow = { id: number; alias: string; createdAt: string };
export type AliasState = { aliases: AliasRow[]; tokens: number; slots: number; premium: boolean };
export type PasskeyRow = { id: number; name: string; createdAt: string; lastUsedAt: string | null };

async function apiJson<T>(url: string, init: RequestInit): Promise<Result<T>> {
  const res = await authFetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
  });
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: string };
  if (!res.ok) {
    return { ok: false, error: body.error || "Request failed." };
  }
  await hydrateStoreFromServer();
  return { ok: true, data: (body.data ?? {}) as T };
}

export async function updateUsername(raw: string): Promise<Result<{ username: string }>> {
  return apiJson("/api/account/username", {
    method: "PATCH",
    body: JSON.stringify({ username: raw }),
  });
}

export async function updateDisplayName(raw: string): Promise<Result<{ displayName: string }>> {
  return apiJson("/api/account/display-name", {
    method: "PATCH",
    body: JSON.stringify({ displayName: raw }),
  });
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
