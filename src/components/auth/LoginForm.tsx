"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FloatingInput from "@/components/ui/floating-input-base";
import { useAuth } from "@/components/auth/AuthProvider";
import { sanitizeNextPath } from "@/lib/auth/redirect";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = sanitizeNextPath(searchParams.get("next"));
  const { signInWithEmail, signInWithGoogle, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || googleBusy) return;
    setError(null);
    setSuccess(null);

    if (!identifier.trim()) {
      setError("Please enter your email or username.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setBusy(true);
    const res = await signInWithEmail(identifier.trim(), password);
    if (!res.ok) {
      setError(res.error || "Invalid email or password.");
      setBusy(false);
      return;
    }
    setSuccess("Signed in! Redirecting...");
    router.push(redirectTo);
  };

  const handleGoogleSignIn = async () => {
    if (busy || googleBusy) return;
    setGoogleBusy(true);
    setError(null);
    setSuccess(null);
    const res = await signInWithGoogle();
    if (!res.ok) {
      setError(res.error || "Sign-in was cancelled or failed. Please try again.");
      setGoogleBusy(false);
      return;
    }
    setSuccess("Signed in! Redirecting...");
    router.push(redirectTo);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <form onSubmit={handleEmailSignIn} className="w-full flex flex-col gap-3.5">
        <FloatingInput
          id="login-identifier"
          label="Email or Username"
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="username"
        />

        <FloatingInput
          id="login-password"
          label="Password"
          isPassword
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={busy || googleBusy}
          className="w-full h-11 rounded-xl bg-[#f05e23] hover:bg-[#d64e18] text-white transition-all font-medium text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_6px_24px_rgba(240,94,35,0.28)]"
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-0.5">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] uppercase tracking-wider text-white/35">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy || googleBusy}
        className="w-full h-11 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white transition-all font-medium text-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
          />
        </svg>
        {googleBusy ? "Signing in..." : "Continue with Google"}
      </button>

      {error && (
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl px-3.5 py-2.5 text-red-400 text-xs text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-3.5 py-2.5 text-emerald-400 text-xs text-center">
          {success}
        </div>
      )}
    </div>
  );
};

export default LoginForm;
