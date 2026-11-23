import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleAuthProvider } from "@/lib/firebase";
import { authFetch, clearStoredLocalToken, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";

export interface RegisterInput {
  username: string;
  email: string;
  password?: string;
  turnstileToken?: string;
}

export function formatFirebaseAuthError(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code || "";
  if (code === "auth/popup-blocked") {
    return "Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.";
  }
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Google sign-in popup was closed before completing. Please try again.";
  }
  if (code === "auth/unauthorized-domain") {
    return "This domain is not authorized in Firebase Authentication. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
  }
  if (code === "auth/operation-not-allowed") {
    return "This sign-in provider is not enabled in Firebase Authentication.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error while contacting Google Auth. Check your connection and try again.";
  }
  return error instanceof Error ? error.message : fallback;
}

export async function registerWithGoogle(
  desiredUsername?: string
): Promise<{ success?: string; error?: string }> {
  try {
    clearStoredLocalToken();
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});

    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken(true);
    setInMemoryAuthToken(token);

    // Explicitly verify backend session creation before proceeding
    const meRes = await authFetch("/api/auth/me");
    const meData = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meData?.authenticated) {
      return {
        error:
          meData?.error ||
          "Google sign-in succeeded, but the server could not verify your Firebase token. Please try again.",
      };
    }

    if (desiredUsername && desiredUsername.trim().length >= 2) {
      await authFetch("/api/account/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: desiredUsername.trim() }),
      }).catch(() => {});
    }

    const nextState = await hydrateStoreFromServer(true);
    if (nextState.currentUserId == null) {
      return { error: "Account created, but failed to load session. Please refresh and sign in." };
    }

    return { success: "Account ready! Redirecting to your dashboard..." };
  } catch (error) {
    return { error: formatFirebaseAuthError(error, "Google sign-up failed.") };
  }
}

export async function register(input: RegisterInput): Promise<{ success?: string; error?: string }> {
  try {
    await firebaseSignOut(auth).catch(() => {});
    clearStoredLocalToken();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input.username,
        email: input.email,
        password: input.password || "",
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || "Registration failed." };
    }
    if (data.token) {
      setInMemoryAuthToken(data.token);
    }
    const nextState = await hydrateStoreFromServer(true);
    if (nextState.currentUserId == null) {
      return { error: "Account created, but could not start your session. Please try signing in." };
    }
    return { success: "Account created! Redirecting to your dashboard..." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Registration failed." };
  }
}
