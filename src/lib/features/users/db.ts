import {
  getStore,
  hydrateFullUser,
  type FullUser,
} from "@/lib/local-store";
import type { CustomBadge } from "@/components/profile/layouts/ProfileBadges";
import type { DomainState, AvailableDomain } from "@/lib/features/domains";

export type { FullUser };

export interface RawViewBin {
  d: string;
  c: number;
}

export interface DeviceStats {
  ios: number;
  android: number;
  windows: number;
  mac: number;
  other: number;
}

export type CountryViewStat = { country: string; count: number };

export function getAnalyticsDataSync(): RawViewBin[] {
  const bins: RawViewBin[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400 * 1000);
    const d = dt.toISOString().split("T")[0];
    const wave = Math.round(45 + Math.sin(i * 0.45) * 28 + ((i * 17) % 35));
    bins.push({ d, c: Math.max(8, wave) });
  }
  return bins;
}

export function getHourlyViewsSync(): RawViewBin[] {
  const bins: RawViewBin[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 3600 * 1000);
    const h = dt.toISOString().slice(0, 13);
    bins.push({ d: h, c: Math.max(2, Math.round(12 + Math.cos(i * 0.5) * 9)) });
  }
  return bins;
}

export function getDeviceStatsSync(): DeviceStats {
  return {
    ios: 420,
    android: 310,
    windows: 540,
    mac: 290,
    other: 85,
  };
}

export function getCountryViewStatsSync(): CountryViewStat[] {
  return [
    { country: "US", count: 642 },
    { country: "GB", count: 284 },
    { country: "DE", count: 219 },
    { country: "JP", count: 195 },
    { country: "CA", count: 168 },
    { country: "IN", count: 154 },
    { country: "FR", count: 121 },
    { country: "BR", count: 98 },
    { country: "AU", count: 87 },
    { country: "KR", count: 76 },
  ];
}

export function getCurrentSessionDataSync() {
  const state = getStore();
  const fallbackUser = Object.values(state.users)[0] ?? null;
  const userId = state.currentUserId ?? fallbackUser?.id ?? 0;
  const rawUser = state.currentUserId != null ? state.users[state.currentUserId] : null;
  const user = hydrateFullUser(rawUser);
  const backgrounds = state.backgrounds[userId] ?? [];
  const equippedBadges = state.equippedBadges[userId] ?? [];
  const ownedBadges = state.ownedBadges[userId] ?? [];
  const customBadges = state.customBadges[userId] ?? [];
  const aliases = (state.aliases[userId] ?? []).map((a) => ({
    id: a.id,
    alias: a.alias,
    createdAt: new Date(a.createdAt),
  }));

  const ownDomains = state.domains.filter((d) => d.userId === userId);
  const available: AvailableDomain[] = state.domains
    .filter((d) => d.status === "active" && (d.visibility === "public" || d.userId === userId))
    .map((d) => ({
      id: d.id,
      hostname: d.hostname,
      type: d.type,
      owner: state.users[d.userId]?.username ?? "prophile",
      own: d.userId === userId,
    }));

  const domains: DomainState = {
    username: user?.username ?? "prophile",
    tokens: user?.domainTokens ?? 1,
    domains: ownDomains.map((d) => ({
      id: d.id,
      hostname: d.hostname,
      type: d.type,
      visibility: d.visibility,
      status: d.status,
      dcvTarget: d.dcvTarget,
    })),
    available,
    profileDomainId: null,
    imageDomainId: null,
  };

  const featuredAvatars: Record<string, string | null> = {};
  for (const u of Object.values(state.users)) {
    featuredAvatars[u.username] = u.avatarUrl;
  }

  return {
    userId,
    isAuthenticated: state.currentUserId != null && Boolean(user),
    user,
    backgrounds,
    equippedBadges,
    ownedBadges,
    customBadges,
    badgeTokens: user?.badgeTokens ?? 1,
    rawViews: getAnalyticsDataSync(),
    hourlyViews: getHourlyViewsSync(),
    deviceStats: getDeviceStatsSync(),
    countryStats: getCountryViewStatsSync(),
    aliases,
    domains,
    featuredAvatars,
    commentsReceived: [],
    commentsGiven: [],
    feedbackReceived: [],
    feedbackGiven: [],
  };
}

export async function getUserByEmail(email: string): Promise<FullUser | null> {
  const state = getStore();
  const clean = email.toLowerCase().trim();
  const found = Object.values(state.users).find((u) => (u.email ?? "").toLowerCase() === clean);
  return hydrateFullUser(found);
}

export async function getUserByUsername(username: string): Promise<FullUser | null> {
  const state = getStore();
  const clean = username.toLowerCase().trim();
  const found = Object.values(state.users).find((u) => u.username.toLowerCase() === clean);
  return hydrateFullUser(found);
}

export async function getUserById(id: number): Promise<FullUser | null> {
  const state = getStore();
  return hydrateFullUser(state.users[id]);
}

export async function userHasPassword(_id: number): Promise<boolean> {
  return false;
}

export async function getUserForSession(id: number) {
  const user = await getUserById(id);
  if (!user) return null;
  return { id: user.id, passwordChangedAt: user.passwordChangedAt };
}

export async function getUserBackgrounds(userId: number): Promise<string[]> {
  const state = getStore();
  return state.backgrounds[userId] ?? [];
}

export async function getAnalyticsData(_userId: number): Promise<RawViewBin[]> {
  return getAnalyticsDataSync();
}

export async function getHourlyViews(_userId: number): Promise<RawViewBin[]> {
  return getHourlyViewsSync();
}

export async function getDeviceStats(_userId: number): Promise<DeviceStats> {
  return getDeviceStatsSync();
}

export async function getCountryViewStats(_userId: number): Promise<CountryViewStat[]> {
  return getCountryViewStatsSync();
}

export async function getCustomBadges(userId: number): Promise<CustomBadge[]> {
  const state = getStore();
  return state.customBadges[userId] ?? [];
}

export async function getAliasOwner(alias: string): Promise<{ userId: number; username: string } | null> {
  const state = getStore();
  const clean = alias.toLowerCase().trim();
  for (const [uidStr, list] of Object.entries(state.aliases)) {
    const uid = Number(uidStr);
    if (list.some((a) => a.alias.toLowerCase() === clean)) {
      const u = state.users[uid];
      if (u) return { userId: uid, username: u.username };
    }
  }
  return null;
}

export async function getUserAliases(userId: number) {
  const state = getStore();
  const list = state.aliases[userId] ?? [];
  return list.map((a) => ({
    id: a.id,
    alias: a.alias,
    createdAt: new Date(a.createdAt),
  }));
}

export async function getEquippedBadgeIds(userId: number): Promise<string[]> {
  const state = getStore();
  return state.equippedBadges[userId] ?? [];
}

export async function updatePassword(_email: string, _passwordUnhashed: string) {
  // Handled via Firebase Auth
}
