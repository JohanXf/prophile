import { signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, ensureFirestoreUserAccount, googleAuthProvider } from "@/lib/firebase";
import { authFetch, clearStoredLocalToken, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer, upsertFirebaseSessionInStore } from "@/lib/local-store";

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

    let backendAvailable = false;
    try {
      const meRes = await authFetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json().catch(() => ({}));
        if (meData?.authenticated) {
          backendAvailable = true;
        }
      } else if (meRes.status !== 404) {
        const meData = await meRes.json().catch(() => ({}));
        return {
          error:
            meData?.error ||
            "Google sign-in succeeded, but the server could not verify your Firebase token. Please try again.",
        };
      }
    } catch {
      // Fall through to Firebase + Firestore client session
    }

    if (backendAvailable) {
      if (desiredUsername && desiredUsername.trim().length >= 2) {
        await authFetch("/api/account/username", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: desiredUsername.trim() }),
        }).catch(() => {});
      }

      const nextState = await hydrateStoreFromServer(true);
      if (nextState.currentUserId != null) {
        return { success: "Account ready! Redirecting to your dashboard..." };
      }
    }

    // Fallback: static/client-only deployment — persist directly via Firebase Auth + Firestore
    const firestoreRecord = await ensureFirestoreUserAccount(result.user, desiredUsername);
    upsertFirebaseSessionInStore(firestoreRecord);
    return { success: "Account ready! Redirecting to your dashboard..." };
  } catch (error) {
    return { error: formatFirebaseAuthError(error, "Google sign-up failed.") };
  }
}

export async function register(input: RegisterInput): Promise<{ success?: string; error?: string }> {
  try {
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
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await res.json().catch(() => ({}))
      : {};
    if (!res.ok) {
      if (res.status === 404) {
        return {
          error:
            "Email/password sign-up requires the backend server (HTTP 404 on this URL). Click 'Continue with Google' below to create your account right away.",
        };
      }
      return { error: data.error || `Registration failed (HTTP ${res.status}).` };
    }
    await firebaseSignOut(auth).catch(() => {});
    clearStoredLocalToken();
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
