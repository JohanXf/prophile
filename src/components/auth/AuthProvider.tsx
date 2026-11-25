import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import {
  auth,
  ensureFirestoreUserAccount,
  googleAuthProvider,
  syncPublicProfileToFirestore,
} from "@/lib/firebase";
import {
  authFetch,
  clearStoredLocalToken,
  isLocalTokenInMemory,
  setInMemoryAuthToken,
} from "@/lib/auth-client";
import {
  applyUpdatedUserToStore,
  hydrateStoreFromServer,
  getStore,
  subscribeStore,
  type FullUser,
  hydrateFullUser,
  upsertFirebaseSessionInStore,
} from "@/lib/local-store";
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
    const initialBootstrap = hydrateStoreFromServer(false);
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

      const nextState =
        fbUser && !hasLocalSession
          ? await hydrateStoreFromServer(true)
          : await initialBootstrap;

      if (fbUser && !hasLocalSession) {
        if (nextState.currentUserId != null && fbUser.emailVerified) {
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
        } else if (nextState.currentUserId == null) {
          // Backend /api/bootstrap unavailable (e.g. static deployment) — hydrate from Firestore
          try {
            const firestoreRecord = await ensureFirestoreUserAccount(fbUser);
            upsertFirebaseSessionInStore(firestoreRecord);
          } catch {
            // ignore
          }
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
        const fallback =
          res.status === 404
            ? "Email/password sign-in requires the backend server (HTTP 404 on this URL). Click 'Continue with Google' below to sign in right away."
            : `Invalid email or password (HTTP ${res.status}).`;
        return {
          ok: false,
          error: data.error || fallback,
        };
      }

      await firebaseSignOut(auth).catch(() => {});
      clearStoredLocalToken();
      if (data.token) {
        setInMemoryAuthToken(data.token);
      }
      if (data.user) {
        applyUpdatedUserToStore(data.user);
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
              ? "Email/password sign-up requires the backend server (HTTP 404 on this URL). Click 'Continue with Google' below to create your account right away."
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
        if (data.user) {
          applyUpdatedUserToStore(data.user);
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
            ok: false,
            error:
              meData?.error ||
              "Google sign-in succeeded, but the server could not verify your Firebase token. Please try again.",
          };
        }
      } catch {
        // Fall through to Firebase + Firestore client session
      }

      if (backendAvailable) {
        const nextState = await hydrateStoreFromServer(true);
        if (nextState.currentUserId != null) {
          return { ok: true };
        }
      }

      // Fallback when Express /api routes are unavailable (static host / preview)
      const firestoreRecord = await ensureFirestoreUserAccount(result.user);
      upsertFirebaseSessionInStore(firestoreRecord);
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
