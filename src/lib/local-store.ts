import { resolveEffectConfig, DEFAULT_EFFECT_CONFIG, type EffectConfig } from "@/lib/effect-config";
import { SHOWCASE_TRACKS } from "@/components/home/showcase-tracks";
import type { CustomBadge } from "@/components/profile/layouts/ProfileBadges";
import type { DetailLayout } from "@/components/profile/layouts/ProfilePresetLayout";
import type { ProfileLink } from "@/lib/links";
import type { MusicTrack } from "@/lib/music";
import type { WidgetConfig } from "@/lib/widget-types";
import type { ProfileSection } from "@/lib/profile-sections";

export interface StoredUserBase {
  id: number;
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
  musicPlayerVolume: boolean | null;
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

const STORAGE_KEY = "prophile_store_v1";

function createDefaultUser(overrides: Partial<StoredUserBase> & { id: number; username: string }): StoredUserBase {
  const now = new Date("2026-10-15T12:00:00Z");
  return {
    needsUsername: false,
    email: `${overrides.username}@prophile.com`,
    ip: "127.0.0.1",
    role: "user",
    emailVerified: true,
    isPremium: false,
    hasImageHost: false,
    hasVerified: false,
    hasDonator: false,
    badgeTokens: 1,
    aliasTokens: 1,
    domainTokens: 1,
    usernameLoginEnabled: true,
    discordId: null,
    discordUsername: null,
    views: 120,
    likesCount: 18,
    dislikesCount: 0,
    passwordChangedAt: now,
    twoFactorEnabledAt: null,
    createdAt: now,
    updatedAt: now,
    displayName: overrides.username,
    location: "Tokyo, JP",
    timezone: "Asia/Tokyo",
    occupation: "Creator",
    bio: "Welcome to my prophile page.",
    avatarUrl: "/showcase/saraansx.jpg",
    avatarDecorationUrl: null,
    avatarDecorationHue: 0,
    profileEffectUrl: null,
    profileEffectHue: 0,
    avatarShape: "circle",
    bannerImageUrl: "/showcase/rio/banner.png",
    bannerBlend: true,
    bannerBackgroundShuffle: false,
    bannerBackgroundAutoplay: true,
    bannerBackgroundSound: false,
    pageBgColor: "#050505",
    backgroundEffect: "aurora",
    backgroundEffectIntensity: 55,
    backgroundEffectColor: "#5b6cf5",
    backgroundEffectAboveContainer: false,
    effectConfig: { ...DEFAULT_EFFECT_CONFIG },
    borderEffect: "none",
    borderEffectColor: "#5b6cf5",
    cardEffect: "none",
    cardTransition: "fade",
    usernameEffect: "none",
    usernameGlowEnabled: true,
    cursorTrail: "none",
    cursorTrailColor: "#5b6cf5",
    clickEffect: "none",
    clickSound: "none",
    badgeGlowEnabled: true,
    badgeGlowStrength: 35,
    badgeSize: 19,
    badgeMonochromeEnabled: false,
    badgeMonochromeColor: "#ffffff",
    badgeContainerStyle: "pill",
    badgeSpacing: 5,
    badgeScrollStyle: "none",
    badgeScrollSpeed: 40,
    badgeVisibleCount: 6,
    badgeShimmerEnabled: true,
    entryTransition: "fade",
    enterScreenEnabled: false,
    enterScreenText: "click to enter...",
    enterScreenFont: "comfortaa",
    enterScreenFontSize: 15,
    enterScreenFontWeight: 500,
    enterScreenLetterSpacing: 2,
    enterScreenColor: "#ffffff",
    enterScreenOpacity: 85,
    enterScreenBlur: 18,
    enterScreenBlurColor: "#050505",
    descriptionEffect: "none",
    descriptionGlowEnabled: false,
    profileBgColor: "#0c0c0c",
    profileBgOpacity: 65,
    profileBorderColor: "#ffffff",
    profileBorderOpacity: 10,
    profileBorderWidth: 1,
    profileBorderRadius: 24,
    profileCardBlur: 16,
    profileBackgroundBlur: 0,
    profileShadowColor: "#000000",
    profileShadowOpacity: 60,
    profileOpacity: 100,
    usernameFont: "comfortaa",
    usernameFontSize: 22,
    usernameFontWeight: 600,
    usernameLetterSpacing: 0,
    usernameColor: "#ffffff",
    usernameMarginBottom: 8,
    bioFont: "comfortaa",
    bioFontSize: 14,
    bioFontWeight: 400,
    bioLetterSpacing: 0,
    bioColor: "#d4d4d8",
    otherFont: "comfortaa",
    otherFontSize: 13,
    otherFontWeight: 400,
    otherLetterSpacing: 0,
    otherColor: "#a1a1aa",
    highlightFont: "comfortaa",
    highlightFontSize: 13,
    highlightFontWeight: 400,
    highlightLetterSpacing: 0,
    widgetPrimaryTextColor: "#ffffff",
    widgetFont: "comfortaa",
    widgetFontSize: 13,
    widgetFontWeight: 400,
    widgetLetterSpacing: 0,
    widgetSecondaryFont: "comfortaa",
    widgetSecondaryFontSize: 12,
    widgetSecondaryFontWeight: 400,
    widgetSecondaryLetterSpacing: 0,
    widgetSecondaryTextColor: "#a1a1aa",
    widgetBorderColor: "#ffffff",
    widgetBorderOpacity: 10,
    widgetBorderWidth: 1,
    widgetBorderRadius: 24,
    widgetCardColor: "#101010",
    widgetCardOpacity: 80,
    profileStructure: "classic",
    aboutSectionEnabled: true,
    aboutSectionTitle: "About Me",
    aboutSectionDescription: "",
    widgetsSectionEnabled: true,
    profilePreset: "banner",
    wrapInCard: true,
    contentWidth: 700,
    contentAlignment: "left",
    avatarPlacement: "left",
    joinDatePlacement: "footer",
    locationPlacement: "header",
    occupationPlacement: "header",
    uidPlacement: "footer",
    viewsPlacement: "footer",
    feedbackPlacement: "footer",
    joinDateEnabled: true,
    joinDateFormat: "short",
    viewsEnabled: true,
    viewsAnimationEnabled: true,
    viewsAnimationStyle: "countup",
    embedTitle: `${overrides.username} — prophile`,
    embedDescription: `Check out ${overrides.username}'s profile on prophile`,
    embedColor: "#5b6cf5",
    embedBackgroundUrl: null,
    embedIconUrl: null,
    faviconUrl: null,
    cursorUrl: null,
    tabTitle: `@${overrides.username} | prophile`,
    tabTitleAnimated: false,
    viewsAnimationDuration: 1200,
    commentsEnabled: true,
    showCommentsPublicly: true,
    sectionTitleFont: "comfortaa",
    sectionTitleFontSize: 15,
    sectionTitleFontWeight: 500,
    sectionTitleLetterSpacing: 0,
    sectionDescFont: "comfortaa",
    sectionDescFontSize: 12.5,
    sectionDescFontWeight: 400,
    sectionDescLetterSpacing: 0,
    sectionTitleColor: "#ffffff",
    sectionDescColor: "#a1a1aa",
    musicPrimaryFont: "inter",
    musicPrimaryFontSize: 15,
    musicPrimaryFontWeight: 400,
    musicPrimaryLetterSpacing: 0,
    musicSecondaryFont: "inter",
    musicSecondaryFontSize: 12.5,
    musicSecondaryFontWeight: 400,
    musicSecondaryLetterSpacing: 0,
    musicLyricsFont: "inter",
    musicLyricsFontSize: 14,
    musicLyricsFontWeight: 400,
    musicLyricsLetterSpacing: 0,
    musicPrimaryColor: "#ffffff",
    musicSecondaryColor: "#a1a1aa",
    musicLyricsColor: "#ffffff",
    musicTracks: SHOWCASE_TRACKS,
    musicPlayerStyle: "lyrics",
    musicPlayerVolume: true,
    musicPlayerDefaultVolume: 35,
    musicPlayerShuffle: false,
    musicPlayerArtBg: true,
    musicCardColor: "#101010",
    musicCardOpacity: 85,
    allowNewComments: true,
    feedbackEnabled: true,
    showFeedbackPublicly: true,
    showUidTooltip: true,
    showLocationTooltip: true,
    showOccupationTooltip: true,
    showLikesTooltip: true,
    showDislikesTooltip: false,
    showJoinDateTooltip: true,
    showViewsTooltip: true,
    showLinksTooltip: true,
    showBadgesTooltip: true,
    iconsGlowEnabled: false,
    joinDateIconGlow: false,
    locationIconGlow: false,
    occupationIconGlow: false,
    uidIconGlow: false,
    viewsIconGlow: false,
    feedbackIconGlow: false,
    linksSectionEnabled: true,
    linksSectionTitle: "Links",
    linksSectionDescription: "",
    linksSectionPosition: "top",
    profileSections: null,
    linksFont: "comfortaa",
    linksFontSize: 14,
    linksFontWeight: 400,
    linksLetterSpacing: 0,
    linksAlignment: "center",
    linksSocialBackground: true,
    linksBorderRadius: 16,
    linksIconSize: 20,
    linksIconGap: 10,
    linksIconColor: null,
    linksTextColor: "#ffffff",
    links: [
      { id: "lnk-1", title: "GitHub", url: "https://github.com/prophile", icon: "github", variant: "small", color: null },
      { id: "lnk-2", title: "Spotify", url: "https://open.spotify.com", icon: "spotify", variant: "small", color: null },
      { id: "lnk-3", title: "Discord Server", url: "https://discord.gg/prophile", icon: "discord", variant: "big", color: null },
    ],
    widgets: [
      { id: "w-1", platform: "spotify", type: "spotify-track", targetId: "chanel", useLinked: false, enabled: true },
      { id: "w-2", platform: "github", type: "github-user", targetId: "saraansx", useLinked: false, enabled: true },
    ],
    ...overrides,
  };
}

function buildInitialState(): StoreState {
  const rio = createDefaultUser({
    id: 1,
    username: "rio",
    displayName: "rio .",
    role: "admin",
    isPremium: true,
    hasImageHost: true,
    hasVerified: true,
    hasDonator: true,
    badgeTokens: 4,
    aliasTokens: 4,
    domainTokens: 2,
    discordId: "100000000000000001",
    discordUsername: "rio",
    views: 48920,
    likesCount: 3412,
    location: "cat :3",
    occupation: "idk .",
    bio: "Writing code nobody understand's\nCoffee ohh yeahh\ndiscord.gg/prophile",
    avatarUrl: "/showcase/rio/avatar.png",
    bannerImageUrl: "/showcase/rio/banner.png",
    badgeMonochromeEnabled: true,
    badgeMonochromeColor: "#393636",
    badgeContainerStyle: "none",
  });

  const rex = createDefaultUser({
    id: 2,
    username: "rex",
    displayName: "rex.",
    role: "admin",
    isPremium: true,
    hasImageHost: true,
    hasVerified: true,
    hasDonator: true,
    badgeTokens: 5,
    aliasTokens: 5,
    domainTokens: 3,
    views: 39410,
    likesCount: 2890,
    location: "cat :3",
    occupation: "Founder",
    bio: "Hi. I own prophile",
    avatarUrl: "/showcase/rex/avatar.png",
    bannerImageUrl: "/showcase/rex/banner.mp4",
  });

  const featuredExtras: Array<{ username: string; displayName: string; avatar: string; views: number; likes: number; bio: string; location: string }> = [
    { username: "saraansx", displayName: "saraansx", avatar: "/showcase/saraansx.jpg", views: 29450, likes: 1940, bio: "Digital artist & full-stack creative.", location: "Seoul, KR" },
    { username: "ok", displayName: "ok", avatar: "/showcase/mia.jpg", views: 24180, likes: 1620, bio: "minimalist sound designer", location: "London, UK" },
    { username: "ma", displayName: "ma", avatar: "/showcase/ohjoy.jpg", views: 19840, likes: 1410, bio: "building cool things on the web", location: "New York, US" },
    { username: "coffeeholic", displayName: "coffeeholic", avatar: "/showcase/rio/avatar.png", views: 16720, likes: 1180, bio: "powered by espresso & shaders", location: "Berlin, DE" },
    { username: "qq", displayName: "qq", avatar: "/showcase/rex/avatar.png", views: 14300, likes: 980, bio: "radiant peak // late night queues", location: "Toronto, CA" },
    { username: "xd", displayName: "xd", avatar: "/showcase/mrbeast.jpg", views: 12950, likes: 870, bio: "content & motion graphics", location: "Los Angeles, US" },
    { username: "miloj", displayName: "miloj", avatar: "/showcase/saraansx.jpg", views: 11400, likes: 760, bio: "music producer // beats & synths", location: "Buenos Aires, AR" },
    { username: "uno", displayName: "uno", avatar: "/showcase/mia.jpg", views: 9820, likes: 640, bio: "one link to rule them all", location: "Paris, FR" },
    { username: "sat_halder", displayName: "Sat Halder", avatar: "/showcase/ohjoy.jpg", views: 8410, likes: 590, bio: "systems engineer & open source", location: "Bengaluru, IN" },
    { username: "axmyouknow", displayName: "axm", avatar: "/showcase/rio/avatar.png", views: 7650, likes: 510, bio: "ui/ux & creative coding", location: "Amsterdam, NL" },
    { username: "kqll", displayName: "kqll", avatar: "/showcase/rex/avatar.png", views: 6890, likes: 440, bio: "competitive fps player", location: "Stockholm, SE" },
    { username: "zenitx", displayName: "zenitx", avatar: "/showcase/saraansx.jpg", views: 5920, likes: 390, bio: "3D environments & shaders", location: "Osaka, JP" },
    { username: "xylen", displayName: "xylen", avatar: "/showcase/mia.jpg", views: 4810, likes: 320, bio: "indie game dev", location: "Sydney, AU" },
    { username: "katrixgamerz", displayName: "Katrix", avatar: "/showcase/mrbeast.jpg", views: 3950, likes: 275, bio: "streaming daily", location: "Singapore, SG" },
    { username: "e2f", displayName: "e2f", avatar: "/showcase/ohjoy.jpg", views: 3210, likes: 210, bio: "security researcher", location: "Zurich, CH" },
  ];

  const users: Record<number, StoredUserBase> = {
    1: rio,
    2: rex,
  };
  const backgrounds: Record<number, string[]> = {
    1: ["/showcase/rio/banner.png"],
    2: ["/showcase/rex/banner.mp4"],
  };
  const equippedBadges: Record<number, string[]> = {
    1: ["owner", "developer", "early", "premium", "image-host", "verified", "guild-tag"],
    2: ["custom-aa196642e9fd", "owner", "developer"],
  };
  const ownedBadges: Record<number, string[]> = {
    1: ["owner", "developer", "early", "premium", "image-host", "verified", "donator", "guild-tag", "views-1k", "views-10k", "likes-100", "likes-1k"],
    2: ["custom-aa196642e9fd", "owner", "developer", "early", "premium", "verified", "donator"],
  };
  const customBadges: Record<number, CustomBadge[]> = {
    1: [],
    2: [{ id: "custom-aa196642e9fd", name: "< 3", iconUrl: "/showcase/rex/badge-heart.gif" }],
  };
  const aliases: Record<number, Array<{ id: number; alias: string; createdAt: string }>> = {
    1: [
      { id: 1, alias: "r", createdAt: "2026-10-16T00:00:00Z" },
      { id: 2, alias: "rio.dev", createdAt: "2026-10-18T00:00:00Z" },
    ],
    2: [{ id: 3, alias: "x", createdAt: "2026-10-16T00:00:00Z" }],
  };

  featuredExtras.forEach((item, idx) => {
    const id = idx + 3;
    users[id] = createDefaultUser({
      id,
      username: item.username,
      displayName: item.displayName,
      avatarUrl: item.avatar,
      views: item.views,
      likesCount: item.likes,
      bio: item.bio,
      location: item.location,
      isPremium: idx < 8,
      hasVerified: idx < 5,
      hasDonator: idx < 4,
    });
    backgrounds[id] = ["/showcase/rio/banner.png"];
    equippedBadges[id] = idx < 5 ? ["early", "premium", "verified"] : ["early", "premium"];
    ownedBadges[id] = ["early", "premium", "verified", "donator"];
    customBadges[id] = [];
    aliases[id] = [];
  });

  const templates: StoredTemplate[] = [
    {
      id: 1,
      slug: "midnight-aurora",
      name: "Midnight Aurora",
      thumbnailUrl: "/showcase/rio/banner.png",
      isPublic: true,
      useCount: 428,
      favoriteCount: 142,
      favoritedByViewer: true,
      createdAt: "2026-10-20T12:00:00Z",
      creatorId: 1,
      creatorUsername: "rio",
      creatorAvatarUrl: "/showcase/rio/avatar.png",
      config: {
        backgroundEffect: "aurora",
        pageBgColor: "#050508",
        profileBgColor: "#0c0c14",
        profileBgOpacity: 60,
        profileBorderColor: "#5b6cf5",
        profileBorderOpacity: 25,
        profileBorderWidth: 1,
        profileBorderRadius: 24,
        profileCardBlur: 18,
        usernameGlowEnabled: true,
      },
    },
    {
      id: 2,
      slug: "obsidian-minimal",
      name: "Obsidian Minimal",
      thumbnailUrl: "/showcase.jpg",
      isPublic: true,
      useCount: 319,
      favoriteCount: 98,
      favoritedByViewer: false,
      createdAt: "2026-10-22T15:30:00Z",
      creatorId: 2,
      creatorUsername: "rex",
      creatorAvatarUrl: "/showcase/rex/avatar.png",
      config: {
        backgroundEffect: "none",
        pageBgColor: "#040404",
        profileBgColor: "#0a0a0a",
        profileBgOpacity: 85,
        profileBorderColor: "#ffffff",
        profileBorderOpacity: 8,
        profileBorderWidth: 1,
        profileBorderRadius: 20,
        profileCardBlur: 10,
      },
    },
    {
      id: 3,
      slug: "cyber-colorbends",
      name: "Cyber ColorBends",
      thumbnailUrl: "/showcase/chanel.webp",
      isPublic: true,
      useCount: 275,
      favoriteCount: 84,
      favoritedByViewer: false,
      createdAt: "2026-10-25T09:15:00Z",
      creatorId: 3,
      creatorUsername: "saraansx",
      creatorAvatarUrl: "/showcase/saraansx.jpg",
      config: {
        backgroundEffect: "colorbends",
        pageBgColor: "#050505",
        profileBgColor: "#101018",
        profileBgOpacity: 50,
        profileBorderColor: "#8b93e8",
        profileBorderOpacity: 30,
        profileBorderWidth: 1,
        profileBorderRadius: 28,
        profileCardBlur: 22,
      },
    },
  ];

  const comments: StoredComment[] = [
    {
      id: 1,
      profileId: 1,
      authorId: 2,
      content: "Cleanest profile setup on prophile 🔥",
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      pinned: true,
      likesCount: 14,
      likedByMe: true,
      replyToId: null,
    },
    {
      id: 2,
      profileId: 1,
      authorId: 3,
      content: "Love the synced lyrics music player and custom badges!",
      createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
      pinned: false,
      likesCount: 7,
      likedByMe: false,
      replyToId: null,
    },
  ];

  const imageFiles: StoredImageFile[] = [
    {
      id: 1,
      userId: 1,
      publicName: "rio-banner.png",
      originalName: "banner.png",
      mimeType: "image/png",
      sizeBytes: 142800,
      url: "/showcase/rio/banner.png",
      favorite: true,
      hasPassword: false,
      views: 84,
      createdAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    },
    {
      id: 2,
      userId: 1,
      publicName: "chanel-cover.webp",
      originalName: "chanel.webp",
      mimeType: "image/webp",
      sizeBytes: 48200,
      url: "/showcase/chanel.webp",
      favorite: false,
      hasPassword: false,
      views: 39,
      createdAt: new Date(Date.now() - 86400 * 1000 * 5).toISOString(),
    },
  ];

  return {
    currentUserId: 1,
    sessionUserId: 1,
    users,
    backgrounds,
    userBackgrounds: backgrounds,
    equippedBadges,
    ownedBadges,
    customBadges,
    aliases,
    domains: [
      {
        id: 1,
        userId: 1,
        hostname: "links.prophile.gg",
        type: "profile",
        visibility: "public",
        status: "active",
        dcvTarget: null,
      },
    ],
    templates,
    comments,
    imageFiles,
    imageHostFiles: [
      {
        id: 1,
        url: "/showcase/rio/banner.png",
        name: "rio-banner.png",
        size: 142800,
        kind: "image",
        favorite: true,
        locked: false,
        createdAt: Date.now() - 86400 * 1000 * 2,
      },
      {
        id: 2,
        url: "/showcase/chanel.webp",
        name: "chanel-cover.webp",
        size: 48200,
        kind: "image",
        favorite: false,
        locked: false,
        createdAt: Date.now() - 86400 * 1000 * 5,
      },
    ],
  };
}

let memoryState: StoreState | null = null;

function reviveDates(user: StoredUserBase): StoredUserBase {
  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    passwordChangedAt: user.passwordChangedAt ? new Date(user.passwordChangedAt) : null,
    twoFactorEnabledAt: user.twoFactorEnabledAt ? new Date(user.twoFactorEnabledAt) : null,
  };
}

export function getStore(): StoreState {
  if (memoryState) {
    memoryState.sessionUserId = memoryState.currentUserId;
    memoryState.userBackgrounds = memoryState.backgrounds;
    if (!memoryState.imageHostFiles) memoryState.imageHostFiles = [];
    return memoryState;
  }
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        if (parsed && parsed.users) {
          for (const k of Object.keys(parsed.users)) {
            const numKey = Number(k);
            parsed.users[numKey] = reviveDates(parsed.users[numKey]);
          }
          parsed.sessionUserId = parsed.currentUserId;
          parsed.userBackgrounds = parsed.backgrounds;
          if (!parsed.imageHostFiles) parsed.imageHostFiles = [];
          memoryState = parsed;
          return memoryState;
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }
  memoryState = buildInitialState();
  saveStore(memoryState);
  return memoryState;
}

export function saveStore(next?: StoreState) {
  const state = next ?? memoryState;
  if (!state) return;
  state.sessionUserId = state.currentUserId;
  state.userBackgrounds = state.backgrounds;
  memoryState = state;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent("prophile:store-updated"));
    } catch {
      // ignore quota errors
    }
  }
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

export function createNewStoredUser(username: string, email: string): FullUser {
  const state = getStore();
  const cleanUsername = username.toLowerCase().trim() || `user_${Math.floor(Math.random() * 9000 + 1000)}`;
  const existing = Object.values(state.users).find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    state.currentUserId = existing.id;
    saveStore(state);
    return hydrateFullUser(existing)!;
  }
  const nextId = Math.max(0, ...Object.keys(state.users).map(Number)) + 1;
  const newUser = createDefaultUser({
    id: nextId,
    username: cleanUsername,
    displayName: cleanUsername,
    email: email.toLowerCase().trim() || `${cleanUsername}@prophile.com`,
    isPremium: true,
    hasVerified: true,
    hasImageHost: true,
    hasDonator: true,
    badgeTokens: 3,
    aliasTokens: 3,
    domainTokens: 2,
    views: 1,
    likesCount: 1,
  });
  state.users[nextId] = newUser;
  state.backgrounds[nextId] = ["/showcase/rio/banner.png"];
  state.equippedBadges[nextId] = ["early", "premium", "verified"];
  state.ownedBadges[nextId] = ["early", "premium", "verified", "donator", "image-host"];
  state.customBadges[nextId] = [];
  state.aliases[nextId] = [];
  state.currentUserId = nextId;
  saveStore(state);
  return hydrateFullUser(newUser)!;
}
