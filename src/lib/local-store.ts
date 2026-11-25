import { resolveEffectConfig, DEFAULT_EFFECT_CONFIG, type EffectConfig } from "@/lib/effect-config";
import { SHOWCASE_TRACKS } from "@/components/home/showcase-tracks";
import type { CustomBadge } from "@/components/profile/layouts/ProfileBadges";
import type { DetailLayout } from "@/components/profile/layouts/ProfilePresetLayout";
import type { ProfileLink } from "@/lib/links";
import type { MusicTrack } from "@/lib/music";
import type { WidgetConfig } from "@/lib/widget-types";
import type { ProfileSection } from "@/lib/profile-sections";
import { authFetch, clearStoredLocalToken, isLocalTokenInMemory } from "@/lib/auth-client";

export interface StoredUserBase {
  id: number;
  uid?: string | null;
  username: string;
  needsUsername: boolean;
  email: string | null;
  ip: string | null;
  role: "user" | "admin" | "moderator";
  emailVerified: boolean;
  isPremium: boolean;
  hasImageHost: boolean;
  hasVerified: boolean;
  hasDonator: boolean;
  badgeTokens: number;
  aliasTokens: number;
  domainTokens: number;
  usernameLoginEnabled: boolean;
  discordId: string | null;
  discordUsername: string | null;
  views: number;
  likesCount: number;
  dislikesCount: number;
  passwordChangedAt: Date | null;
  twoFactorEnabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  displayName: string | null;
  location: string | null;
  timezone: string | null;
  occupation: string | null;
  bio: string | null;
  avatarUrl: string | null;
  avatarDecorationUrl: string | null;
  avatarDecorationHue: number | null;
  profileEffectUrl: string | null;
  profileEffectHue: number | null;
  avatarShape: "square" | "soft" | "rounded" | "circle" | null;
  bannerImageUrl: string | null;
  bannerBlend: boolean | null;
  bannerBackgroundShuffle: boolean | null;
  bannerBackgroundAutoplay: boolean | null;
  bannerBackgroundSound: boolean | null;
  pageBgColor: string | null;
  backgroundEffect: string | null;
  backgroundEffectIntensity: number | null;
  backgroundEffectColor: string | null;
  backgroundEffectAboveContainer: boolean | null;
  effectConfig: EffectConfig | null;
  borderEffect: string | null;
  borderEffectColor: string | null;
  cardEffect: string | null;
  cardTransition: string | null;
  usernameEffect: string | null;
  usernameGlowEnabled: boolean | null;
  cursorTrail: string | null;
  cursorTrailColor: string | null;
  clickEffect: string | null;
  clickSound: string | null;
  badgeGlowEnabled: boolean | null;
  badgeGlowStrength: number | null;
  badgeSize: number | null;
  badgeMonochromeEnabled: boolean | null;
  badgeMonochromeColor: string | null;
  badgeContainerStyle: "pill" | "none" | "separate" | null;
  badgeSpacing: number | null;
  badgeScrollStyle: "none" | "pingpong" | "left" | "right" | null;
  badgeScrollSpeed: number | null;
  badgeVisibleCount: number | null;
  badgeShimmerEnabled: boolean | null;
  entryTransition: string | null;
  enterScreenEnabled: boolean | null;
  enterScreenText: string | null;
  enterScreenFont: string | null;
  enterScreenFontSize: number | null;
  enterScreenFontWeight: number | null;
  enterScreenLetterSpacing: number | null;
  enterScreenColor: string | null;
  enterScreenOpacity: number | null;
  enterScreenBlur: number | null;
  enterScreenBlurColor: string | null;
  descriptionEffect: string | null;
  descriptionGlowEnabled: boolean | null;
  profileBgColor: string | null;
  profileBgOpacity: number | null;
  profileBorderColor: string | null;
  profileBorderOpacity: number | null;
  profileBorderWidth: number | null;
  profileBorderRadius: number | null;
  profileCardBlur: number | null;
  profileBackgroundBlur: number | null;
  profileShadowColor: string | null;
  profileShadowOpacity: number | null;
  profileOpacity: number | null;
  usernameFont: string | null;
  usernameFontSize: number | null;
  usernameFontWeight: number | null;
  usernameLetterSpacing: number | null;
  usernameColor: string | null;
  usernameMarginBottom: number | null;
  bioFont: string | null;
  bioFontSize: number | null;
  bioFontWeight: number | null;
  bioLetterSpacing: number | null;
  bioColor: string | null;
  otherFont: string | null;
  otherFontSize: number | null;
  otherFontWeight: number | null;
  otherLetterSpacing: number | null;
  otherColor: string | null;
  highlightFont: string | null;
  highlightFontSize: number | null;
  highlightFontWeight: number | null;
  highlightLetterSpacing: number | null;
  widgetPrimaryTextColor: string | null;
  widgetFont: string | null;
  widgetFontSize: number | null;
  widgetFontWeight: number | null;
  widgetLetterSpacing: number | null;
  widgetSecondaryFont: string | null;
  widgetSecondaryFontSize: number | null;
  widgetSecondaryFontWeight: number | null;
  widgetSecondaryLetterSpacing: number | null;
  widgetSecondaryTextColor: string | null;
  widgetBorderColor: string | null;
  widgetBorderOpacity: number | null;
  widgetBorderWidth: number | null;
  widgetBorderRadius: number | null;
  widgetCardColor: string | null;
  widgetCardOpacity: number | null;
  profileStructure: string | null;
  aboutSectionEnabled: boolean | null;
  aboutSectionTitle: string | null;
  aboutSectionDescription: string | null;
  widgetsSectionEnabled: boolean | null;
  profilePreset: string | null;
  wrapInCard: boolean | null;
  contentWidth: number | null;
  contentAlignment: string | null;
  avatarPlacement: string | null;
  joinDatePlacement: string | null;
  locationPlacement: string | null;
  occupationPlacement: string | null;
  uidPlacement: string | null;
  viewsPlacement: string | null;
  feedbackPlacement: string | null;
  detailLayout?: DetailLayout | null;
  joinDateEnabled: boolean | null;
  joinDateFormat: string | null;
  viewsEnabled: boolean | null;
  viewsAnimationEnabled: boolean | null;
  viewsAnimationStyle: "none" | "countup" | "digitalroll" | "slotroll" | "speeding" | null;
  embedTitle: string | null;
  embedDescription: string | null;
  embedColor: string | null;
  embedBackgroundUrl: string | null;
  embedIconUrl: string | null;
  faviconUrl: string | null;
  cursorUrl: string | null;
  tabTitle: string | null;
  tabTitleAnimated: boolean | null;
  viewsAnimationDuration: number | null;
  commentsEnabled: boolean | null;
  showCommentsPublicly: boolean | null;
  sectionTitleFont: string | null;
  sectionTitleFontSize: number | null;
  sectionTitleFontWeight: number | null;
  sectionTitleLetterSpacing: number | null;
  sectionDescFont: string | null;
  sectionDescFontSize: number | null;
  sectionDescFontWeight: number | null;
  sectionDescLetterSpacing: number | null;
  sectionTitleColor: string | null;
  sectionDescColor: string | null;
  musicPrimaryFont: string | null;
  musicPrimaryFontSize: number | null;
  musicPrimaryFontWeight: number | null;
  musicPrimaryLetterSpacing: number | null;
  musicSecondaryFont: string | null;
  musicSecondaryFontSize: number | null;
  musicSecondaryFontWeight: number | null;
  musicSecondaryLetterSpacing: number | null;
  musicLyricsFont: string | null;
  musicLyricsFontSize: number | null;
  musicLyricsFontWeight: number | null;
  musicLyricsLetterSpacing: number | null;
  musicPrimaryColor: string | null;
  musicSecondaryColor: string | null;
  musicLyricsColor: string | null;
  musicTracks: MusicTrack[] | null;
  musicPlayerStyle: string | null;
  musicAutoPlay: boolean | null;
  musicPlayerVolume: boolean | null;
  volumePlacement?: string | null;
  musicPlayerDefaultVolume: number | null;
  musicPlayerShuffle: boolean | null;
  musicPlayerArtBg: boolean | null;
  musicCardColor: string | null;
  musicCardOpacity: number | null;
  allowNewComments: boolean | null;
  feedbackEnabled: boolean | null;
  showFeedbackPublicly: boolean | null;
  showUidTooltip: boolean | null;
  showLocationTooltip: boolean | null;
  showOccupationTooltip: boolean | null;
  showLikesTooltip: boolean | null;
  showDislikesTooltip: boolean | null;
  showJoinDateTooltip: boolean | null;
  showViewsTooltip: boolean | null;
  showLinksTooltip: boolean | null;
  showBadgesTooltip: boolean | null;
  iconsGlowEnabled: boolean | null;
  joinDateIconGlow: boolean | null;
  locationIconGlow: boolean | null;
  occupationIconGlow: boolean | null;
  uidIconGlow: boolean | null;
  viewsIconGlow: boolean | null;
  feedbackIconGlow: boolean | null;
  linksSectionEnabled: boolean | null;
  linksSectionTitle: string | null;
  linksSectionDescription: string | null;
  linksSectionPosition: string | null;
  profileSections: ProfileSection[] | null;
  linksFont: string | null;
  linksFontSize: number | null;
  linksFontWeight: number | null;
  linksLetterSpacing: number | null;
  linksAlignment: string | null;
  linksSocialBackground: boolean | null;
  linksBorderRadius: number | null;
  linksIconSize: number | null;
  linksIconGap: number | null;
  linksIconColor: string | null;
  linksTextColor: string | null;
  widgets: WidgetConfig[] | null;
  links: ProfileLink[] | null;
  photoCollection?: import("@/lib/photo-collection").CollectionPhoto[] | null;
  photoCollectionLayout?: import("@/lib/photo-collection").CollectionLayoutId | null;
}

export type FullUser = StoredUserBase & EffectConfig;

export interface StoredTemplate {
  id: number;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  useCount: number;
  favoriteCount: number;
  favoritedByViewer: boolean;
  favorited?: boolean;
  requiresPremium?: boolean;
  tags?: string[];
  createdAt: string;
  creatorId: number;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  config: Record<string, unknown>;
}

export interface StoredComment {
  id: number;
  profileId: number;
  authorId: number;
  content: string;
  createdAt: string;
  pinned: boolean;
  likesCount: number;
  likedByMe: boolean;
  replyToId: number | null;
}

export interface StoredImageFile {
  id: number;
  userId: number;
  publicName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  favorite: boolean;
  hasPassword: boolean;
  password?: string | null;
  views: number;
  createdAt: string;
}

export interface StoreState {
  hydrated: boolean;
  currentUserId: number | null;
  sessionUserId: number | null;
  users: Record<number, StoredUserBase>;
  backgrounds: Record<number, string[]>;
  userBackgrounds: Record<number, string[]>;
  equippedBadges: Record<number, string[]>;
  ownedBadges: Record<number, string[]>;
  customBadges: Record<number, CustomBadge[]>;
  aliases: Record<number, Array<{ id: number; alias: string; createdAt: string }>>;
  domains: Array<{
    id: number;
    userId: number;
    hostname: string;
    type: "profile" | "image_host";
    visibility: "private" | "public";
    status: "pending" | "active";
    dcvTarget: string | null;
  }>;
  templates: StoredTemplate[];
  comments: StoredComment[];
  imageFiles: StoredImageFile[];
  imageHostFiles: Array<{
    id: number;
    url: string;
    name: string;
    size: number;
    kind: "image" | "video";
    favorite: boolean;
    locked: boolean;
    password?: string | null;
    createdAt: number;
  }>;
}

function buildEmptyState(): StoreState {
  return {
    hydrated: false,
    currentUserId: null,
    sessionUserId: null,
    users: {},
    backgrounds: {},
    userBackgrounds: {},
    equippedBadges: {},
    ownedBadges: {},
    customBadges: {},
    aliases: {},
    domains: [],
    templates: [],
    comments: [],
    imageFiles: [],
    imageHostFiles: [],
  };
}

let memoryState: StoreState = buildEmptyState();

function reviveDates(user: StoredUserBase): StoredUserBase {
  return {
    ...user,
    effectConfig: user.effectConfig ?? { ...DEFAULT_EFFECT_CONFIG },
    musicTracks: user.musicTracks ?? SHOWCASE_TRACKS,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    passwordChangedAt: user.passwordChangedAt ? new Date(user.passwordChangedAt) : null,
    twoFactorEnabledAt: user.twoFactorEnabledAt ? new Date(user.twoFactorEnabledAt) : null,
  };
}

function notifySubscribers() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("prophile:store-updated"));
  }
}

export function getStore(): StoreState {
  memoryState.sessionUserId = memoryState.currentUserId;
  memoryState.userBackgrounds = memoryState.backgrounds;
  return memoryState;
}

export function saveStore(next?: StoreState) {
  const state = next ?? memoryState;
  state.sessionUserId = state.currentUserId;
  state.userBackgrounds = state.backgrounds;
  memoryState = state;
  notifySubscribers();
}

export function updateStore(updater: (state: StoreState) => void) {
  const state = getStore();
  updater(state);
  saveStore(state);
}

export function subscribeStore(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener("prophile:store-updated", handler);
  return () => window.removeEventListener("prophile:store-updated", handler);
}

export function hydrateFullUser(user: StoredUserBase | undefined | null): FullUser | null {
  if (!user) return null;
  const revived = reviveDates(user);
  const fx = resolveEffectConfig(revived.effectConfig);
  return {
    ...revived,
    ...fx,
    detailLayout: revived.detailLayout ?? fx.detailLayout ?? null,
  };
}

let inflightHydration: Promise<StoreState> | null = null;
let hydrationSeq = 0;

export async function hydrateStoreFromServer(force = false): Promise<StoreState> {
  if (inflightHydration && !force) return inflightHydration;
  const seq = ++hydrationSeq;
  const task = (async () => {
    try {
      const res = await authFetch("/api/bootstrap");
      if (!res.ok) {
        return memoryState;
      }
      const data = (await res.json()) as StoreState;
      if (seq !== hydrationSeq) {
        return memoryState;
      }
      const revivedUsers: Record<number, StoredUserBase> = {};
      for (const [k, v] of Object.entries(data.users ?? {})) {
        revivedUsers[Number(k)] = reviveDates(v);
      }
      if (data.currentUserId == null && isLocalTokenInMemory()) {
        clearStoredLocalToken();
      }
      memoryState = {
        ...buildEmptyState(),
        ...data,
        hydrated: true,
        users: revivedUsers,
        currentUserId: data.currentUserId ?? null,
        sessionUserId: data.currentUserId ?? null,
        userBackgrounds: data.backgrounds ?? {},
      };
      notifySubscribers();
      return memoryState;
    } catch {
      return memoryState;
    } finally {
      if (seq === hydrationSeq) {
        inflightHydration = null;
      }
    }
  })();
  inflightHydration = task;
  return task;
}

export function upsertFirebaseSessionInStore(profile: {
  uidNum: number;
  ownerUid: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  badges?: string[];
}): StoreState {
  const existingByUid = Object.values(memoryState.users).find(
    (u) => u.uid === profile.ownerUid || u.username.toLowerCase() === profile.username.toLowerCase()
  );
  const id = existingByUid?.id ?? profile.uidNum;
  const now = new Date();

  const isOwner =
    profile.email.toLowerCase() === "faizennahmed@gmail.com" ||
    profile.email.toLowerCase() === "testsohoj@gmail.com" ||
    profile.username.toLowerCase() === "faizen";

  const userRecord = {
    ...(existingByUid ?? {}),
    id,
    uid: profile.ownerUid,
    username: profile.username,
    needsUsername: false,
    email: profile.email,
    role: existingByUid?.role ?? (isOwner ? "admin" : "user"),
    emailVerified: true,
    isPremium: existingByUid?.isPremium ?? isOwner,
    hasImageHost: existingByUid?.hasImageHost ?? isOwner,
    hasVerified: existingByUid?.hasVerified ?? isOwner,
    hasDonator: existingByUid?.hasDonator ?? false,
    badgeTokens: existingByUid?.badgeTokens ?? (isOwner ? 10 : 1),
    aliasTokens: existingByUid?.aliasTokens ?? (isOwner ? 10 : 1),
    domainTokens: existingByUid?.domainTokens ?? (isOwner ? 5 : 1),
    usernameLoginEnabled: existingByUid?.usernameLoginEnabled ?? true,
    views: existingByUid?.views ?? 1,
    likesCount: existingByUid?.likesCount ?? 0,
    dislikesCount: existingByUid?.dislikesCount ?? 0,
    displayName: profile.displayName || profile.username,
    location: profile.location ?? existingByUid?.location ?? null,
    occupation: profile.occupation ?? existingByUid?.occupation ?? null,
    bio: profile.bio ?? existingByUid?.bio ?? "Welcome to my prophile page.",
    avatarUrl: profile.avatarUrl ?? existingByUid?.avatarUrl ?? null,
    bannerImageUrl: profile.bannerUrl ?? existingByUid?.bannerImageUrl ?? null,
    createdAt: existingByUid?.createdAt ?? now,
    updatedAt: now,
    effectConfig: existingByUid?.effectConfig ?? { ...DEFAULT_EFFECT_CONFIG },
  } as StoredUserBase;

  memoryState = {
    ...memoryState,
    hydrated: true,
    currentUserId: id,
    sessionUserId: id,
    users: {
      ...memoryState.users,
      [id]: reviveDates(userRecord),
    },
    equippedBadges: {
      ...memoryState.equippedBadges,
      [id]: profile.badges ?? memoryState.equippedBadges[id] ?? ["early"],
    },
    ownedBadges: {
      ...memoryState.ownedBadges,
      [id]: Array.from(
        new Set([...(memoryState.ownedBadges[id] ?? []), ...(profile.badges ?? ["early"])])
      ),
    },
  };
  notifySubscribers();
  return memoryState;
}

export function applyUpdatedUserToStore(updatedUser: StoredUserBase | null | undefined) {
  if (!updatedUser || typeof updatedUser.id !== "number") return;
  const revived = reviveDates(updatedUser);
  memoryState = {
    ...memoryState,
    hydrated: true,
    users: {
      ...memoryState.users,
      [revived.id]: revived,
    },
  };
  notifySubscribers();
}

export function applyUpdatedBackgroundsToStore(userId: number, urls: string[]) {
  memoryState = {
    ...memoryState,
    backgrounds: {
      ...memoryState.backgrounds,
      [userId]: urls,
    },
    userBackgrounds: {
      ...memoryState.userBackgrounds,
      [userId]: urls,
    },
  };
  notifySubscribers();
}

export function upsertPublicProfileInStore(profile: {
  uid: number;
  ownerUid: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  location?: string;
  occupation?: string;
  badges?: string[];
}) {
  const existing = Object.values(memoryState.users).find(
    (u) => u.username.toLowerCase() === profile.username.toLowerCase()
  );
  if (existing) return existing;
  const now = new Date();
  const id = profile.uid || 900001;
  const isOwner = profile.username.toLowerCase() === "faizen";
  const record = {
    id,
    uid: profile.ownerUid,
    username: profile.username,
    needsUsername: false,
    email: null,
    role: isOwner ? "admin" : "user",
    emailVerified: true,
    isPremium: isOwner,
    hasImageHost: isOwner,
    hasVerified: isOwner,
    hasDonator: false,
    badgeTokens: 1,
    aliasTokens: 1,
    domainTokens: 1,
    usernameLoginEnabled: true,
    views: 1,
    likesCount: 0,
    dislikesCount: 0,
    displayName: profile.displayName || profile.username,
    location: profile.location ?? null,
    occupation: profile.occupation ?? null,
    bio: profile.bio ?? "Welcome to my prophile page.",
    avatarUrl: profile.avatarUrl ?? null,
    bannerImageUrl: profile.bannerUrl ?? null,
    createdAt: now,
    updatedAt: now,
    effectConfig: { ...DEFAULT_EFFECT_CONFIG },
  } as StoredUserBase;

  memoryState = {
    ...memoryState,
    hydrated: true,
    users: {
      ...memoryState.users,
      [id]: reviveDates(record),
    },
    equippedBadges: {
      ...memoryState.equippedBadges,
      [id]: profile.badges ?? ["early"],
    },
    backgrounds: {
      ...memoryState.backgrounds,
      [id]: profile.bannerUrl ? [profile.bannerUrl] : [],
    },
    userBackgrounds: {
      ...memoryState.userBackgrounds,
      [id]: profile.bannerUrl ? [profile.bannerUrl] : [],
    },
  };
  notifySubscribers();
  return record;
}


