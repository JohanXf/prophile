"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TopFade from "@/components/ui/top-fade";
import LeaderboardClient from "@/app/dashboard/leaderboard/LeaderboardClient";
import { useSearchParams } from "next/navigation";
import { getStore } from "@/lib/local-store";
import {
  getLeaderboardSync,
  LEADERBOARD_CATEGORIES,
  LEADERBOARD_PERIODS,
  type LeaderboardCategory,
  type LeaderboardPeriod,
} from "@/lib/features/leaderboard";

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const category: LeaderboardCategory = pick(searchParams.get("category"), LEADERBOARD_CATEGORIES, "views");
  const period: LeaderboardPeriod = pick(searchParams.get("period"), LEADERBOARD_PERIODS, "all");
  const page = Math.max(1, Math.min(10, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1));

  const state = getStore();
  const auth = state.sessionUserId !== null;
  const entries = getLeaderboardSync(category, period);

  return (
    <div className="min-h-screen flex flex-col">
      <TopFade />
      <Navbar isAuthenticated={auth} />

      <section className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(ellipse_at_top,rgba(91,108,245,0.16),rgba(91,108,245,0.05)_42%,transparent_72%)]"
        />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#8b93f0] font-medium">
              Top 100
            </p>
            <h1
              className="mt-3 text-5xl md:text-7xl font-semibold text-white tracking-[-0.03em] leading-[0.95]"
              style={{ fontFamily: "var(--font-poppins)" }}
            >
              Leaderboard
            </h1>
          </div>
          <p className="max-w-sm text-[15px] text-white/45 leading-relaxed md:pb-2">
            The most viewed profiles on prophile. Pick a category and a time span to see who&apos;s leading.
          </p>
        </div>
      </section>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <LeaderboardClient
          entries={entries}
          category={category}
          period={period}
          page={page}
          currentUserId={state.sessionUserId ?? null}
          basePath="/leaderboard"
          showHeader={false}
        />
      </main>

      <Footer />
    </div>
  );
}