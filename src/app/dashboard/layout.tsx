"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import LoginForm from "@/components/auth/LoginForm";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { UnsavedChangesProvider } from "@/components/dashboard/UnsavedChangesProvider";
import { profileFontVariables } from "@/lib/profile-fonts";
import PickUsernameModal from "@/components/dashboard/PickUsernameModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-[#f05e23]/30 border-t-[#f05e23] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div
        className="min-h-screen bg-[#050505] flex items-center justify-center p-4"
        style={{ fontFamily: "var(--font-comfortaa)" }}
      >
        <div className="w-full max-w-md bg-[#0c0c0c] border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_24px_64px_rgba(0,0,0,0.65)]">
          <Link href="/" className="mb-5 hover:opacity-80 transition-opacity">
            <Image
              src="/Favicon.png"
              alt="prophile"
              width={48}
              height={48}
              className="w-11 h-11 object-contain"
            />
          </Link>
          <h1 className="text-xl font-medium text-white tracking-tight">
            Sign in to your dashboard
          </h1>
          <p className="text-sm text-white/50 mt-2 mb-6 leading-relaxed">
            Sign in with your email and password or Google to manage your prophile page.
          </p>

          <LoginForm />

          <div className="mt-6 flex items-center gap-4 text-xs text-white/40">
            <Link
              href="/register"
              className="text-[#f05e23] hover:text-[#f69267] transition-colors"
            >
              Create an account
            </Link>
            <span>·</span>
            <Link
              href="/"
              className="hover:text-white/80 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${profileFontVariables} dashboard-no-caret contents`}>
      <UnsavedChangesProvider>
        <DashboardShell
          username={user.username}
          userId={user.id}
          avatarUrl={user.avatarUrl ?? undefined}
          decorationUrl={user.avatarDecorationUrl ?? undefined}
          decorationHue={user.avatarDecorationHue ?? 0}
        >
          {children}
        </DashboardShell>
        {user.needsUsername && <PickUsernameModal />}
      </UnsavedChangesProvider>
    </div>
  );
}
