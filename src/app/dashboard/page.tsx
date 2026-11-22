import Link from "next/link";
import { getCurrentSessionDataSync } from "@/lib/features/users/db";
import { AnalyticsChart, DeviceChart } from "@/components/charts/LazyCharts";
import { WorldMapCard } from "@/components/dashboard/LazyWorldMap";
import RecentComments from "@/components/dashboard/RecentComments";
import RecentFeedback from "@/components/dashboard/RecentFeedback";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { isPremiumActive } from "@/lib/premium";
import ProfileCompletion from "@/components/dashboard/ProfileCompletion";
import { ArrowUpRight, Music, Link2, Sparkles, Award, LayoutGrid, SlidersHorizontal } from "lucide-react";

const QUICK_ACTIONS = [
  {
    label: "Profile & Bio",
    detail: "Avatar, bio & background",
    href: "/dashboard/customize/profile/general",
    icon: SlidersHorizontal,
  },
  {
    label: "Appearance",
    detail: "Card blur, borders & style",
    href: "/dashboard/customize/profile/appearance",
    icon: Sparkles,
  },
  {
    label: "Music Player",
    detail: "Tracks, autoplay & deck",
    href: "/dashboard/customize/music",
    icon: Music,
  },
  {
    label: "Links",
    detail: "Socials & custom buttons",
    href: "/dashboard/customize/links",
    icon: Link2,
  },
  {
    label: "Badges",
    detail: "Equip & order badges",
    href: "/dashboard/customize/badges",
    icon: Award,
  },
  {
    label: "Widgets",
    detail: "Cards & live embeds",
    href: "/dashboard/customize/profile/widgets",
    icon: LayoutGrid,
  },
];

export default function DashboardPage() {
  const {
    user,
    backgrounds,
    equippedBadges: badges,
    rawViews,
    hourlyViews,
    deviceStats,
    countryStats,
    commentsReceived,
    commentsGiven,
    feedbackReceived,
    feedbackGiven,
  } = getCurrentSessionDataSync();
  const premium = isPremiumActive(user);

  const completionSteps = [
    { label: "Upload an avatar", done: !!user?.avatarUrl, href: "/dashboard/customize/profile/general" },
    { label: "Add a background", done: backgrounds.length > 0, href: "/dashboard/customize/profile/general" },
    { label: "Write a short bio", done: !!user?.bio?.trim(), href: "/dashboard/customize/profile/general" },
    { label: "Add a link", done: (user?.links?.length ?? 0) > 0, href: "/dashboard/customize/links" },
    { label: "Add a music track", done: (user?.musicTracks?.length ?? 0) > 0, href: "/dashboard/customize/music" },
    { label: "Add a widget", done: (user?.widgets?.length ?? 0) > 0, href: "/dashboard/customize/profile/widgets" },
    { label: "Equip a badge", done: badges.length > 0, href: "/dashboard/customize/badges" },
    { label: "Connect Discord", done: !!user?.discordId, href: "/dashboard/customize/badges" },
  ];

  return (
    <div className="flex flex-col gap-8" style={{ fontFamily: "var(--font-comfortaa)" }}>
      <div className="border-b border-white/4 pb-5 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 flex items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList className="text-[13px] gap-2">
            <BreadcrumbItem>
              <BreadcrumbPage className="text-[#f05e23] font-light tracking-tight" style={{ fontFamily: "var(--font-comfortaa)" }}>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {user?.username && (
          <Link
            href={`/${user.username}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f05e23]/30 bg-[#f05e23]/12 hover:bg-[#f05e23]/22 px-3.5 py-1.5 text-[12.5px] text-white transition-colors whitespace-nowrap shrink-0"
          >
            <span>Open /{user.username}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#f05e23]" />
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-light text-white tracking-tight" style={{ fontFamily: "var(--font-comfortaa)" }}>Welcome back, {user?.username || "User"}</h1>
          <p className="text-white/35 text-sm mt-1">Manage your page, music, badges, and live stats from one place.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "USER ID", value: user?.id ? String(user.id) : "—", icon: <span className="font-normal text-lg">#</span>, color: "#f05e23", numeric: true },
          { label: "TOTAL VIEWS", value: user?.views != null ? String(user.views) : "0", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>, color: "#f05e23", numeric: true },
          { label: "USERNAME", value: user?.username || "—", icon: <span className="font-normal text-lg">@</span>, color: "#f05e23", numeric: false },
          { label: "PLAN", value: user?.role === "admin" ? "Owner" : premium ? "Premium" : "Free", icon: <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true"><path d="M396.31 32H264l84.19 112.26L396.31 32Zm-280.62 0 48.12 112.26L248 32H115.69ZM256 74.67 192 160h128l-64-85.33Zm166.95-23.61L376.26 160H488L422.95 51.06Zm-333.9 0L23 160h112.74L89.05 51.06ZM146.68 192H24l222.8 288h.53L146.68 192Zm218.64 0L264.67 480h.53L488 192H365.32Zm-35.93 0H182.61L256 400l73.39-208Z" /></svg>, color: "#f05e23", numeric: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white/2 border border-white/4 rounded-2xl sm:rounded-[20px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-white/8 transition-colors"
          >
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wide sm:tracking-wider text-white/50 font-normal whitespace-nowrap">
                {stat.label}
              </span>
              <span className={`text-white text-[15px] sm:text-base font-normal leading-none truncate ${stat.numeric ? "tabular-nums" : ""}`}>
                {stat.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section aria-label="Quick actions" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-[0.16em] text-white/40 font-normal">Quick Jump</h2>
          <Link href="/dashboard/settings" className="text-xs text-white/45 hover:text-[#f05e23] transition-colors">
            Account settings
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group bg-[#121212] border border-white/[0.06] hover:border-[#f05e23]/35 hover:bg-[#171311] rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#f05e23]/12 text-[#f05e23] flex items-center justify-center group-hover:bg-[#f05e23]/20 transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] text-white font-normal leading-tight truncate">{action.label}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 truncate">{action.detail}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <ProfileCompletion steps={completionSteps} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 min-w-0 min-h-0">
          <AnalyticsChart totalViews={user?.views || 0} initialData={rawViews} hourlyData={hourlyViews} />
        </div>

        <div className="lg:col-span-1 min-w-0 min-h-0">
          <DeviceChart stats={deviceStats} />
        </div>
      </div>

      <div className="mb-6">
        <WorldMapCard data={countryStats} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <RecentComments
          initialReceived={commentsReceived}
          initialGiven={commentsGiven}
          initialReceivedHasMore={false}
          initialGivenHasMore={false}
          initialReceivedTotal={commentsReceived.length}
          initialGivenTotal={commentsGiven.length}
        />
        <RecentFeedback
          initialReceived={feedbackReceived}
          initialGiven={feedbackGiven}
          initialReceivedHasMore={false}
          initialGivenHasMore={false}
          initialReceivedTotal={feedbackReceived.length}
          initialGivenTotal={feedbackGiven.length}
        />
      </div>
    </div>
  );
}
