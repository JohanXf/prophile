import { signInWithPopup } from "firebase/auth";
import { auth, googleAuthProvider } from "@/lib/firebase";
import { setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";

export interface LoginInput {
  identifier: string;
  method?: "password" | "otp" | "passkey";
  password?: string;
  otpCode?: string;
  turnstileToken?: string;
}

export async function signInWithGoogleAction(): Promise<{ success?: string; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken();
    setInMemoryAuthToken(token);
    await hydrateStoreFromServer();
    return { success: "Signed in with Google!" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Google sign-in failed." };
  }
}

export async function login(
  input: LoginInput
): Promise<{ twoFactor?: boolean; ticket?: string | null; success?: string; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: input.identifier,
        password: input.password || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || "Invalid email or password." };
    }
    if (data.token) {
      setInMemoryAuthToken(data.token);
    }
    await hydrateStoreFromServer();
    return { success: "Signed in! Redirecting..." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign-in failed." };
  }
}

export async function completeTwoFactorLogin(
  _ticket: string | undefined,
  _code: string
): Promise<{ success?: string; error?: string }> {
  return { error: "Two-factor login is not enabled for this account." };
}

export async function beginPasskeyLogin(): Promise<{
  data?: { challengeId: string; options: Record<string, unknown> };
  error?: string;
}> {
  return { error: "Passkey login is not configured. Please use email and password or Google." };
}

export async function completePasskeyLogin(
  _challengeId: string,
  _response: unknown
): Promise<{ success?: string; error?: string }> {
  return { error: "Passkey login is not configured." };
}
