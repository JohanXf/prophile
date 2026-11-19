import { getStore, saveStore, createNewStoredUser } from "@/lib/local-store";

export interface LoginInput {
  identifier: string;
  method: "password" | "otp" | "passkey";
  password?: string;
  otpCode?: string;
  turnstileToken?: string;
}

export async function login(
  input: LoginInput
): Promise<{ twoFactor?: boolean; ticket?: string | null; success?: string; error?: string }> {
  const state = getStore();
  const clean = (input.identifier || "").toLowerCase().trim();
  const found = Object.values(state.users).find(
    (u) => u.username.toLowerCase() === clean || (u.email ?? "").toLowerCase() === clean
  );

  if (found) {
    state.currentUserId = found.id;
    saveStore(state);
    return { success: "Signed in!" };
  }

  const username = clean.includes("@") ? clean.split("@")[0] : clean || "rio";
  createNewStoredUser(username, clean.includes("@") ? clean : `${username}@prophile.com`);
  return { success: "Signed in!" };
}

export async function completeTwoFactorLogin(
  _ticket: string | undefined,
  _code: string
): Promise<{ success?: string; error?: string }> {
  const state = getStore();
  if (!state.currentUserId) state.currentUserId = 1;
  saveStore(state);
  return { success: "Signed in!" };
}

export async function beginPasskeyLogin(): Promise<{
  data?: { challengeId: string; options: Record<string, unknown> };
  error?: string;
}> {
  return {
    data: {
      challengeId: "passkey-challenge-1",
      options: { challenge: "dGVzdA" },
    },
  };
}

export async function completePasskeyLogin(
  _challengeId: string,
  _response: unknown
): Promise<{ success?: string; error?: string }> {
  const state = getStore();
  state.currentUserId = 1;
  saveStore(state);
  return { success: "Signed in with passkey!" };
}
