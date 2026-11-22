import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut, type User } from "firebase/auth";
import { auth, googleAuthProvider } from "@/lib/firebase";
import { authFetch, isLocalTokenInMemory, setInMemoryAuthToken } from "@/lib/auth-client";
import { hydrateStoreFromServer, getStore, subscribeStore, type FullUser, hydrateFullUser } from "@/lib/local-store";

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
    await hydrateStoreFromServer();
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setInMemoryAuthToken(token);
        } catch {
          if (!isLocalTokenInMemory()) setInMemoryAuthToken(null);
        }
      } else if (!isLocalTokenInMemory()) {
        setInMemoryAuthToken(null);
      }
      await hydrateStoreFromServer();
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || "Invalid email or password." };
      }
      if (data.token) {
        setInMemoryAuthToken(data.token);
      }
      await hydrateStoreFromServer();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Sign-in failed." };
    }
  }, []);

  const registerWithEmail = useCallback(
    async (input: { username: string; email: string; password: string }) => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { ok: false, error: data.error || "Registration failed." };
        }
        if (data.token) {
          setInMemoryAuthToken(data.token);
        }
        await hydrateStoreFromServer();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Registration failed." };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setInMemoryAuthToken(token);
      await hydrateStoreFromServer();
      return { ok: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Google sign-in failed.";
      return { ok: false, error: msg };
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
    setInMemoryAuthToken(null);
    await hydrateStoreFromServer();
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
