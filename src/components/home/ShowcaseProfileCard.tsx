"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import ProfileBadges, { type CustomBadge } from "@/components/profile/layouts/ProfileBadges";
import { getStore, subscribeStore, hydrateFullUser } from "@/lib/local-store";

const FONT = "var(--font-comfortaa)";
const MUTED = "#878a93";

type ShowcaseData = {
  uid: number;
  username: string;
  name: string;
  avatarUrl: string;
  bannerUrl: string;
  badges: string[];
  customBadges?: CustomBadge[];
  badgeMonoEnabled?: boolean;
  badgeMonoColor?: string | null;
  location?: string | null;
  job?: string | null;
  joined: string;
  bio: ReactNode;
  exists: boolean;
};

function formatJoinDate(iso?: string | Date | null): string {
  if (!iso) return "Nov 19, '26";
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "Nov 19, '26";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yr = String(d.getFullYear()).slice(-2);
  return `${months[d.getMonth()]} ${d.getDate()}, '${yr}`;
}

function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".mp4") || clean.endsWith(".webm") || clean.endsWith(".mov");
}

function buildFaizenShowcase(): ShowcaseData {
  const store = getStore();
  const rawUser = Object.values(store.users).find(
    (u) => u.username.toLowerCase() === "faizen"
  );
  const liveUser = rawUser ? hydrateFullUser(rawUser) : null;

  if (liveUser) {
    const equipped = store.equippedBadges[liveUser.id] ?? ["early", "premium", "verified"];
    const customBadges: CustomBadge[] = (store.customBadges[liveUser.id] ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      iconUrl: b.iconUrl,
    }));
    const backgrounds = store.backgrounds[liveUser.id] ?? [];
    const bannerUrl =
      liveUser.bannerImageUrl ||
      backgrounds[0] ||
      "/showcase/rio/banner.png";
    const avatarUrl = liveUser.avatarUrl || "/showcase/saraansx.jpg";
    const bioLines: string[] = (liveUser.bio || "Building cool things on prophile.")
      .split("\n")
      .filter((line: string) => line.trim().length > 0);

    return {
      uid: liveUser.id,
      username: liveUser.username,
      name: liveUser.displayName || liveUser.username,
      avatarUrl,
      bannerUrl,
      badges: equipped,
      customBadges,
      badgeMonoEnabled: liveUser.badgeMonochromeEnabled ?? false,
      badgeMonoColor: liveUser.badgeMonochromeColor ?? null,
      location: liveUser.location || null,
      job: liveUser.occupation || null,
      joined: formatJoinDate(liveUser.createdAt),
      bio: (
        <>
          {bioLines.map((line: string, idx: number) => (
            <p key={idx}>{line}</p>
          ))}
        </>
      ),
      exists: true,
    };
  }

  return {
    uid: 1,
    username: "faizen",
    name: "faizen",
    avatarUrl: "/showcase/saraansx.jpg",
    bannerUrl: "/showcase/rio/banner.png",
    badges: ["owner", "developer", "early", "premium", "verified"],
    location: "prophile/faizen",
    job: "Creator",
    joined: "Nov 19, '26",
    bio: (
      <>
        <p>
          <em>One clean link for everything I build &amp; share.</em>
        </p>
        <p className="mt-2 text-white/60">
          prophile/<u>faizen</u>
        </p>
      </>
    ),
    exists: false,
  };
}

function Card({ p }: { p: ShowcaseData }) {
  const content = (
    <div
      className="relative w-full max-w-[700px] overflow-hidden rounded-[24px] border border-white/[0.08] bg-black/10 backdrop-blur-[5px] shadow-[0_40px_120px_rgba(0,0,0,0.7)] select-none transition-colors hover:border-[#f05e23]/30"
      style={{ fontFamily: FONT }}
    >
      <div
        className="relative h-[160px] w-full overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.6) 75%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.6) 75%, transparent 100%)",
        }}
      >
        {isVideoUrl(p.bannerUrl) ? (
          <video
            src={p.bannerUrl}
            autoPlay
            muted
            loop
            playsInline
            aria-label={`${p.name}'s banner`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={p.bannerUrl}
            alt={`${p.name}'s banner`}
            fill
            sizes="700px"
            priority
            unoptimized
            draggable={false}
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      <div className="flex items-start gap-5 px-6 mt-2.5">
        <div className="relative w-[88px] h-[88px] shrink-0 overflow-hidden rounded-full border border-white/5 bg-[#0a0a0a] shadow-xl">
          <Image
            src={p.avatarUrl}
            alt={`${p.name}'s avatar`}
            fill
            sizes="88px"
            priority
            unoptimized
            draggable={false}
            className="object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col items-start text-left -mt-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[20px] text-white tracking-tight mb-2 truncate">{p.name}</h3>
            {p.badges.length > 0 && (
              <div className="mb-2">
                <ProfileBadges
                  badgeIds={p.badges}
                  customBadges={p.customBadges}
                  glowEnabled
                  glowStrength={35}
                  badgeSize={19}
                  monoEnabled={p.badgeMonoEnabled ?? false}
                  monoColor={p.badgeMonoColor ?? null}
                  containerStyle="pill"
                  badgeSpacing={5}
                  shimmerEnabled
                />
              </div>
            )}
          </div>

          {(p.location || p.job) && (
            <div className="mt-1 flex items-center gap-3 text-[12px]" style={{ color: MUTED }}>
              {p.location && (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" aria-hidden>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {p.location}
                </span>
              )}
              {p.job && (
                <span className="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80" aria-hidden>
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                  {p.job}
                </span>
              )}
            </div>
          )}

          <div className="mt-1.5 w-full text-[13px] leading-relaxed text-white">{p.bio}</div>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 pt-6 pb-4 text-[12px]" style={{ color: MUTED }}>
        <span className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80" aria-hidden>
            <path d="M4 9h16" />
            <path d="M4 15h16" />
            <path d="M10 3 8 21" />
            <path d="M16 3l-2 18" />
          </svg>
          {p.uid}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 512 512" fill="currentColor" className="shrink-0 opacity-80" aria-hidden>
            <path d="M480 128a64 64 0 0 0-64-64h-16V48.45c0-8.61-6.62-16-15.23-16.43A16 16 0 0 0 368 48v16H144V48.45c0-8.61-6.62-16-15.23-16.43A16 16 0 0 0 112 48v16H96a64 64 0 0 0-64 64v12a4 4 0 0 0 4 4h440a4 4 0 0 0 4-4zM32 416a64 64 0 0 0 64 64h320a64 64 0 0 0 64-64V180a4 4 0 0 0-4-4H36a4 4 0 0 0-4 4z" />
          </svg>
          {p.joined}
        </span>
      </div>
    </div>
  );

  if (p.exists) {
    return (
      <Link href={`/${p.username}`} className="block w-full max-w-[700px]">
        {content}
      </Link>
    );
  }
  return content;
}

export default function ShowcaseProfileCard() {
  const [, setTick] = useState(0);

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);

  const profile = buildFaizenShowcase();

  return (
    <div className="grid w-full max-w-[700px] place-items-center">
      <div className="w-full flex justify-center">
        <Card p={profile} />
      </div>
    </div>
  );
}
