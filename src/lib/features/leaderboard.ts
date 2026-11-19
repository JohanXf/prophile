import { getStore } from "@/lib/local-store";

export const LEADERBOARD_CATEGORIES = ["views", "likes", "comments", "badges", "aliases"] as const;
export const LEADERBOARD_PERIODS = ["today", "week", "month", "all"] as const;
export type LeaderboardCategory = (typeof LEADERBOARD_CATEGORIES)[number];
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const LEADERBOARD_SIZE = 100;

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
  premium: boolean;
  score: number;
};

const PERIOD_MULTIPLIER: Record<LeaderboardPeriod, number> = {
  today: 0.04,
  week: 0.22,
  month: 0.65,
  all: 1,
};

export function getLeaderboardSync(
  category: LeaderboardCategory = "views",
  period: LeaderboardPeriod = "all"
): LeaderboardEntry[] {
  const state = getStore();
  const mult = PERIOD_MULTIPLIER[period] ?? 1;
  const users = Object.values(state.users);

  const scored = users.map((u) => {
    let raw = 0;
    if (category === "views") raw = u.views;
    else if (category === "likes") raw = u.likesCount;
    else if (category === "comments") {
      raw = state.comments.filter((c) => c.profileId === u.id).length + Math.round(u.likesCount / 40);
    } else if (category === "badges") {
      raw = (state.customBadges[u.id]?.length ?? 0) + u.badgeTokens;
    } else if (category === "aliases") {
      raw = (state.aliases[u.id]?.length ?? 0) + u.aliasTokens;
    }
    const score = period === "all" ? raw : Math.max(1, Math.round(raw * mult));
    return {
      userId: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      verified: u.hasVerified,
      premium: u.isPremium,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score || a.userId - b.userId);

  return scored.slice(0, LEADERBOARD_SIZE).map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export async function getLeaderboard(
  category: LeaderboardCategory = "views",
  period: LeaderboardPeriod = "all"
): Promise<LeaderboardEntry[]> {
  return getLeaderboardSync(category, period);
}

export async function invalidateLeaderboardCache(): Promise<void> {}
