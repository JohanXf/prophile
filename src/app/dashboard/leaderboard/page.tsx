import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import {
  getLeaderboardSync,
  LEADERBOARD_CATEGORIES,
  LEADERBOARD_PERIODS,
  type LeaderboardCategory,
  type LeaderboardPeriod,
} from "@/lib/features/leaderboard";
import LeaderboardClient from "./LeaderboardClient";

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const category: LeaderboardCategory = pick(searchParams.get("category") ?? undefined, LEADERBOARD_CATEGORIES, "views");
  const period: LeaderboardPeriod = pick(searchParams.get("period") ?? undefined, LEADERBOARD_PERIODS, "all");
  const page = Math.max(1, Math.min(10, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1));

  const entries = getLeaderboardSync(category, period);
  const { userId } = getCurrentSessionDataSync();

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="border-b border-white/4 pb-5 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] gap-2">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="text-white/40 hover:text-white tracking-tight">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/10" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#5b6cf5] font-normal tracking-tight">Leaderboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <LeaderboardClient entries={entries} category={category} period={period} page={page} currentUserId={userId ?? null} />
    </div>
  );
}
