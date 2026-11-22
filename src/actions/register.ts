import { signInWithPopup } from "firebase/auth";
import { auth, googleAuthProvider } from "@/lib/firebase";
import { authFetch, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";
import { navigateTo } from "@/shims/next-navigation";

export interface RegisterInput {
  username: string;
  email: string;
  password?: string;
  turnstileToken?: string;
}

export async function registerWithGoogle(desiredUsername?: string): Promise<{ success?: string; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const token = await result.user.getIdToken();
    setInMemoryAuthToken(token);

    if (desiredUsername && desiredUsername.trim().length >= 2) {
      await authFetch("/api/account/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: desiredUsername.trim() }),
      }).catch(() => {});
    }

    await hydrateStoreFromServer();
    navigateTo("/dashboard", false);
    return { success: "Account ready! Redirecting to your dashboard..." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Google sign-up failed." };
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || "Registration failed." };
    }
    if (data.token) {
      setInMemoryAuthToken(data.token);
    }
    await hydrateStoreFromServer();
    return { success: "Account created! Redirecting to your dashboard..." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Registration failed." };
  }
}
