import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleAuthProvider } from "@/lib/firebase";
import { clearStoredLocalToken, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";
import { formatFirebaseAuthError } from "@/actions/register";

export interface LoginInput {
  identifier: string;
  method?: "password" | "otp" | "passkey";
  password?: string;
  otpCode?: string;
  turnstileToken?: string;
}

export async function signInWithGoogleAction(): Promise<{ success?: string; error?: string }> {
  try {
    clearStoredLocalToken();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken(true);
    setInMemoryAuthToken(token);
    await hydrateStoreFromServer(true);
    return { success: "Signed in with Google!" };
  } catch (error) {
    return { error: formatFirebaseAuthError(error, "Google sign-in failed.") };
  }
}

export async function login(
  input: LoginInput
): Promise<{ twoFactor?: boolean; ticket?: string | null; success?: string; error?: string }> {
  try {
    await firebaseSignOut(auth).catch(() => {});
    clearStoredLocalToken();
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
    await hydrateStoreFromServer(true);
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
