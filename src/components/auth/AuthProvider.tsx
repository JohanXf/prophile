import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, googleAuthProvider, syncPublicProfileToFirestore } from "@/lib/firebase";
import {
  authFetch,
  clearStoredLocalToken,
  isLocalTokenInMemory,
  setInMemoryAuthToken,
} from "@/lib/auth-client";
import { hydrateStoreFromServer, getStore, subscribeStore, type FullUser, hydrateFullUser } from "@/lib/local-store";
import { formatFirebaseAuthError } from "@/actions/register";

interface AuthContextValue {
  firebaseUser: User | null;
  user: FullUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithEmail: (identifier: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  registerWithEmail: (input: {
    username: string;
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  user: null,
  isAuthenticated: false,
  loading: true,
  signInWithEmail: async () => ({ ok: false }),
  registerWithEmail: async () => ({ ok: false }),
  signInWithGoogle: async () => ({ ok: false }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0);

  useEffect(() => subscribeStore(() => setVersion((v) => v + 1)), []);

  const refreshSession = useCallback(async () => {
    await hydrateStoreFromServer(true);
  }, []);

  useEffect(() => {
    void hydrateStoreFromServer();
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      const hasLocalSession = isLocalTokenInMemory();
      if (fbUser && !hasLocalSession) {
        try {
          const token = await fbUser.getIdToken();
          setInMemoryAuthToken(token);
        } catch {
          if (!isLocalTokenInMemory()) setInMemoryAuthToken(null);
        }
      } else if (!fbUser && !hasLocalSession) {
        setInMemoryAuthToken(null);
      }
      const nextState = await hydrateStoreFromServer(Boolean(fbUser && !hasLocalSession));
      if (fbUser && !hasLocalSession && fbUser.emailVerified && nextState.currentUserId != null) {
        const syncedUser = hydrateFullUser(nextState.users[nextState.currentUserId]);
        if (syncedUser) {
          const bgs = nextState.backgrounds[syncedUser.id] ?? [];
          const badges = nextState.equippedBadges[syncedUser.id] ?? [];
          void syncPublicProfileToFirestore({
            uid: syncedUser.id,
            username: syncedUser.username,
            displayName: syncedUser.displayName || syncedUser.username,
            bio: syncedUser.bio,
            avatarUrl: syncedUser.avatarUrl,
            bannerUrl: syncedUser.bannerImageUrl || bgs[0] || null,
            location: syncedUser.location,
            occupation: syncedUser.occupation,
            badges,
          }).catch(() => {
            // Firestore sync error is already logged by handleFirestoreError
          });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (identifier: string, password: string) => {
    try {
      const sendLogin = () =>
        fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

      let res = await sendLogin();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        await new Promise((r) => setTimeout(r, 900));
        res = await sendLogin();
      }

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => ({}))
        : {};

      if (!res.ok) {
        return {
          ok: false,
          error: data.error || `Invalid email or password (HTTP ${res.status}).`,
        };
      }

      await firebaseSignOut(auth).catch(() => {});
      clearStoredLocalToken();
      if (data.token) {
        setInMemoryAuthToken(data.token);
      }
      const nextState = await hydrateStoreFromServer(true);
      if (nextState.currentUserId == null) {
        return { ok: false, error: "Sign-in succeeded, but failed to load your session. Please try again." };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Sign-in failed." };
    }
  }, []);

  const registerWithEmail = useCallback(
    async (input: { username: string; email: string; password: string }) => {
      try {
        const sendRegister = () =>
          fetch("/api/auth/register", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });

        let res = await sendRegister();
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          await new Promise((r) => setTimeout(r, 900));
          res = await sendRegister();
        }

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => ({}))
          : {};

        if (!res.ok) {
          const fallback =
            res.status === 404
              ? "Registration API is unreachable on this preview URL (HTTP 404). Please open the live app URL and try again."
              : res.status >= 500
                ? `Server error while creating account (HTTP ${res.status}). Please try again.`
                : `Registration failed (HTTP ${res.status}).`;
          return { ok: false, error: data.error || fallback };
        }

        await firebaseSignOut(auth).catch(() => {});
        clearStoredLocalToken();
        if (data.token) {
          setInMemoryAuthToken(data.token);
        }
        const nextState = await hydrateStoreFromServer(true);
        if (nextState.currentUserId == null) {
          return { ok: false, error: "Account created, but failed to start your session. Please sign in." };
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Registration failed." };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      clearStoredLocalToken();
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken(true);
      setInMemoryAuthToken(token);

      const meRes = await authFetch("/api/auth/me");
      const meData = await meRes.json().catch(() => ({}));
      if (!meRes.ok || !meData?.authenticated) {
        return {
          ok: false,
          error:
            meData?.error ||
            "Google sign-in succeeded, but the server could not verify your Firebase token. Please try again.",
        };
      }

      const nextState = await hydrateStoreFromServer(true);
      if (nextState.currentUserId == null) {
        return { ok: false, error: "Signed in with Google, but failed to load session. Please try again." };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: formatFirebaseAuthError(error, "Google sign-in failed.") };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    clearStoredLocalToken();
    setInMemoryAuthToken(null);
    await hydrateStoreFromServer(true);
  }, []);

  const store = getStore();
  const dbUser = store.currentUserId != null ? hydrateFullUser(store.users[store.currentUserId]) : null;

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: dbUser,
        isAuthenticated: Boolean(dbUser),
        loading,
        signInWithEmail,
        registerWithEmail,
        signInWithGoogle,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
