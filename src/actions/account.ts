import { getStore, saveStore } from "@/lib/local-store";
import { getActiveSessionsForUser, type ActiveSession } from "@/lib/auth/session";

export type Result<T = Record<string, never>> = { ok: true; data: T } | { ok: false; error: string };
export type AliasRow = { id: number; alias: string; createdAt: string };
export type AliasState = { aliases: AliasRow[]; tokens: number; slots: number; premium: boolean };
export type PasskeyRow = { id: number; name: string; createdAt: string; lastUsedAt: string | null };

function currentAliasState(): AliasState {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid];
  const aliases = state.aliases[uid] ?? [];
  const tokens = user?.aliasTokens ?? 2;
  const premium = !!user?.isPremium;
  return {
    aliases,
    tokens,
    slots: tokens + (premium ? 2 : 0),
    premium,
  };
}

export async function updateUsername(raw: string): Promise<Result<{ username: string }>> {
  const clean = raw.toLowerCase().trim();
  if (!clean || clean.length < 2) return { ok: false, error: "Username must be at least 2 characters." };
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].username = clean;
    saveStore(state);
  }
  return { ok: true, data: { username: clean } };
}

export async function updateDisplayName(raw: string): Promise<Result<{ displayName: string }>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].displayName = raw.trim();
    saveStore(state);
  }
  return { ok: true, data: { displayName: raw.trim() } };
}

export async function addAlias(raw: string): Promise<Result<AliasState>> {
  const clean = raw.toLowerCase().trim();
  if (!clean) return { ok: false, error: "Alias is required." };
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const list = state.aliases[uid] ?? [];
  list.push({ id: Date.now(), alias: clean, createdAt: new Date().toISOString() });
  state.aliases[uid] = list;
  saveStore(state);
  return { ok: true, data: currentAliasState() };
}

export async function editAlias(id: number, raw: string): Promise<Result<AliasState>> {
  const clean = raw.toLowerCase().trim();
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.aliases[uid] = (state.aliases[uid] ?? []).map((a) => (a.id === id ? { ...a, alias: clean } : a));
  saveStore(state);
  return { ok: true, data: currentAliasState() };
}

export async function deleteAlias(id: number): Promise<Result<AliasState>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.aliases[uid] = (state.aliases[uid] ?? []).filter((a) => a.id !== id);
  saveStore(state);
  return { ok: true, data: currentAliasState() };
}

export async function swapAliasWithUsername(id: number): Promise<Result<AliasState & { username: string }>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid];
  const list = state.aliases[uid] ?? [];
  const target = list.find((a) => a.id === id);
  if (!user || !target) return { ok: false, error: "Alias not found." };
  const oldUsername = user.username;
  user.username = target.alias;
  target.alias = oldUsername;
  saveStore(state);
  return { ok: true, data: { ...currentAliasState(), username: user.username } };
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
  const uid = state.currentUserId ?? 1;
  return { ok: true, data: { email: state.users[uid]?.email ?? "user@prophile.com" } };
}

export async function completeDiscordOnboarding(
  rawUsername: string,
  _rawPassword: string
): Promise<Result<{ username: string }>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const clean = rawUsername.toLowerCase().trim() || "rio";
  if (state.users[uid]) {
    state.users[uid].username = clean;
    state.users[uid].needsUsername = false;
    saveStore(state);
  }
  return { ok: true, data: { username: clean } };
}

export async function updatePassword(_current: string, _next: string): Promise<Result> {
  return { ok: true, data: {} };
}

export async function startTwoFactorSetup(): Promise<Result<{ qr: string; secret: string }>> {
  return { ok: true, data: { qr: "/Favicon.png", secret: "JBSWY3DPEHPK3PXP" } };
}

export async function confirmTwoFactorSetup(_code: string): Promise<Result> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].twoFactorEnabledAt = new Date();
    saveStore(state);
  }
  return { ok: true, data: {} };
}

export async function disableTwoFactor(_code: string): Promise<Result> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].twoFactorEnabledAt = null;
    saveStore(state);
  }
  return { ok: true, data: {} };
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
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].discordId = null;
    state.users[uid].discordUsername = null;
    saveStore(state);
  }
  return { ok: true, data: {} };
}

export async function setUsernameLoginEnabled(enabled: boolean): Promise<Result<{ enabled: boolean }>> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  if (state.users[uid]) {
    state.users[uid].usernameLoginEnabled = enabled;
    saveStore(state);
  }
  return { ok: true, data: { enabled } };
}

export async function getActiveSessions(): Promise<Result<ActiveSession[]>> {
  const sessions = await getActiveSessionsForUser(1);
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
