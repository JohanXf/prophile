import crypto from "crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./index.ts";
import {
  users,
  userBackgrounds,
  userBadges,
  customBadges,
  aliases,
  domains,
  templates,
  templateFavorites,
  comments,
  commentLikes,
  profileFeedback,
  imageHostFiles,
  mediaObjects,
} from "./schema.ts";
import { DEFAULT_PROFILE_SETTINGS } from "./defaults.ts";
import { hashPassword, verifyPassword } from "../lib/password-auth.ts";

export type DbUserRow = typeof users.$inferSelect;

export interface HydratedProfileUser {
  id: number;
  uid: string | null;
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
  passwordChangedAt: string | null;
  twoFactorEnabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  displayName: string | null;
  location: string | null;
  timezone: string | null;
  occupation: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerImageUrl: string | null;
  [key: string]: unknown;
}

const DIRECT_USER_COLUMNS = new Set([
  "username",
  "needsUsername",
  "email",
  "role",
  "emailVerified",
  "isPremium",
  "hasImageHost",
  "hasVerified",
  "hasDonator",
  "badgeTokens",
  "aliasTokens",
  "domainTokens",
  "usernameLoginEnabled",
  "discordId",
  "discordUsername",
  "views",
  "likesCount",
  "dislikesCount",
  "displayName",
  "location",
  "timezone",
  "occupation",
  "bio",
  "avatarUrl",
  "bannerImageUrl",
]);

export function serializeUserRow(row: DbUserRow): HydratedProfileUser {
  const settings = (row.profileSettings ?? {}) as Record<string, unknown>;
  const mergedEffectConfig = {
    ...((DEFAULT_PROFILE_SETTINGS.effectConfig as Record<string, unknown>) ?? {}),
    ...((settings.effectConfig as Record<string, unknown>) ?? {}),
  };

  return {
    ...DEFAULT_PROFILE_SETTINGS,
    ...settings,
    effectConfig: mergedEffectConfig,
    id: row.id,
    uid: row.uid ?? null,
    username: row.username,
    needsUsername: row.needsUsername,
    email: row.email ?? null,
    ip: null,
    role: (row.role as "user" | "admin" | "moderator") ?? "user",
    emailVerified: row.emailVerified,
    isPremium: row.isPremium,
    hasImageHost: row.hasImageHost,
    hasVerified: row.hasVerified,
    hasDonator: row.hasDonator,
    badgeTokens: row.badgeTokens,
    aliasTokens: row.aliasTokens,
    domainTokens: row.domainTokens,
    usernameLoginEnabled: row.usernameLoginEnabled,
    discordId: row.discordId ?? null,
    discordUsername: row.discordUsername ?? null,
    views: row.views,
    likesCount: row.likesCount,
    dislikesCount: row.dislikesCount,
    passwordChangedAt: row.passwordChangedAt ? row.passwordChangedAt.toISOString() : null,
    twoFactorEnabledAt: row.twoFactorEnabledAt ? row.twoFactorEnabledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    displayName: row.displayName ?? row.username,
    location: row.location ?? null,
    timezone: row.timezone ?? null,
    occupation: row.occupation ?? null,
    bio: row.bio ?? null,
    avatarUrl: row.avatarUrl ?? "/showcase/saraansx.jpg",
    bannerImageUrl: row.bannerImageUrl ?? "/showcase/rio/banner.png",
    embedTitle:
      (settings.embedTitle as string | null) ?? `${row.username} — prophile`,
    embedDescription:
      (settings.embedDescription as string | null) ??
      `Check out ${row.username}'s profile on prophile`,
    tabTitle: (settings.tabTitle as string | null) ?? `@${row.username} | prophile`,
  };
}

let seedPromise: Promise<void> | null = null;
let seeded = false;

export async function ensureSeedData(): Promise<void> {
  if (seeded) return;
  if (!seedPromise) {
    seedPromise = runSeed().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}

export const OWNER_GRANTED_BADGES = [
  "owner",
  "developer",
  "staff",
  "early",
  "verified",
  "premium",
  "image-host",
  "donator",
  "featured",
  "helper",
  "bug-hunter",
  "booster",
  "guild-tag",
  "domain",
  "gifter",
  "suggestor",
] as const;

async function ensureOwnerAccount(): Promise<number | null> {
  const email = "testsohoj@gmail.com";
  const existing = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email} OR lower(${users.username}) = 'faizen'`)
    .limit(1);

  if (existing[0]) {
    const owner = existing[0];
    const updates: Record<string, unknown> = {};
    if (!owner.passwordHash) updates.passwordHash = hashPassword("sohoj6900");
    if (owner.role !== "admin") updates.role = "admin";
    if (!owner.isPremium) updates.isPremium = true;
    if (!owner.hasImageHost) updates.hasImageHost = true;
    if (!owner.hasVerified) updates.hasVerified = true;
    if (!owner.hasDonator) updates.hasDonator = true;
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await db.update(users).set(updates).where(eq(users.id, owner.id));
    }

    const existingBadges = await db
      .select({ badgeId: userBadges.badgeId })
      .from(userBadges)
      .where(eq(userBadges.userId, owner.id));
    const existingSet = new Set(existingBadges.map((b) => b.badgeId));
    const defaultEquipped = new Set(["owner", "developer", "staff", "early", "verified", "premium"]);
    for (const [idx, badgeId] of OWNER_GRANTED_BADGES.entries()) {
      if (!existingSet.has(badgeId)) {
        await db
          .insert(userBadges)
          .values({
            userId: owner.id,
            badgeId,
            owned: true,
            equipped: defaultEquipped.has(badgeId),
            position: idx,
          })
          .onConflictDoNothing();
      }
    }
    return owner.id;
  }

  const username = await allocateUniqueUsername("faizen");
  const [created] = await db
    .insert(users)
    .values({
      uid: `local_faizen`,
      username,
      needsUsername: false,
      email,
      passwordHash: hashPassword("sohoj6900"),
      role: "admin",
      emailVerified: true,
      isPremium: true,
      hasImageHost: true,
      hasVerified: true,
      hasDonator: true,
      badgeTokens: 10,
      aliasTokens: 10,
      domainTokens: 5,
      usernameLoginEnabled: true,
      views: 1,
      likesCount: 0,
      dislikesCount: 0,
      displayName: "faizen",
      bio: "Founder & owner of prophile.",
      avatarUrl: "/showcase/saraansx.jpg",
      bannerImageUrl: "/showcase/rio/banner.png",
      profileSettings: { ...DEFAULT_PROFILE_SETTINGS, musicAutoPlay: true },
    })
    .onConflictDoNothing()
    .returning();

  if (created) {
    await db
      .insert(userBackgrounds)
      .values({ userId: created.id, url: "/showcase/rio/banner.png", position: 0 });
    const defaultEquipped = new Set(["owner", "developer", "staff", "early", "verified", "premium"]);
    for (const [idx, badgeId] of OWNER_GRANTED_BADGES.entries()) {
      await db
        .insert(userBadges)
        .values({
          userId: created.id,
          badgeId,
          owned: true,
          equipped: defaultEquipped.has(badgeId),
          position: idx,
        })
        .onConflictDoNothing();
    }
    return created.id;
  }
  return null;
}

async function runSeed(): Promise<void> {
  try {
    const ownerId = await ensureOwnerAccount();

    if (ownerId) {
      const existingTemplates = await db.select({ id: templates.id }).from(templates).limit(1);
      if (existingTemplates.length === 0) {
        await db
          .insert(templates)
          .values([
            {
              slug: "midnight-aurora",
              name: "Midnight Aurora",
              thumbnailUrl: "/showcase/rio/banner.png",
              tags: ["aurora", "glass", "dark"],
              isPublic: true,
              requiresPremium: false,
              useCount: 428,
              favoriteCount: 142,
              creatorId: ownerId,
              config: {
                backgroundEffect: "aurora",
                pageBgColor: "#050508",
                profileBgColor: "#0c0c14",
                profileBgOpacity: 60,
                profileBorderColor: "#f05e23",
                profileBorderOpacity: 25,
                profileBorderWidth: 1,
                profileBorderRadius: 24,
                profileCardBlur: 18,
                usernameGlowEnabled: true,
              },
            },
            {
              slug: "obsidian-minimal",
              name: "Obsidian Minimal",
              thumbnailUrl: "/showcase.jpg",
              tags: ["minimal", "monochrome"],
              isPublic: true,
              requiresPremium: false,
              useCount: 319,
              favoriteCount: 98,
              creatorId: ownerId,
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
              slug: "cyber-colorbends",
              name: "Cyber ColorBends",
              thumbnailUrl: "/showcase/chanel.webp",
              tags: ["shader", "neon", "animated"],
              isPublic: true,
              requiresPremium: false,
              useCount: 275,
              favoriteCount: 84,
              creatorId: ownerId,
              config: {
                backgroundEffect: "colorbends",
                pageBgColor: "#050505",
                profileBgColor: "#101018",
                profileBgOpacity: 50,
                profileBorderColor: "#f47b47",
                profileBorderOpacity: 30,
                profileBorderWidth: 1,
                profileBorderRadius: 28,
                profileCardBlur: 22,
              },
            },
          ])
          .onConflictDoNothing();
      }
    }

    seeded = true;
  } catch (error) {
    console.error("Seed initialization error:", error instanceof Error ? error.message : String(error));
    throw new Error("Database initialization failed", { cause: error });
  }
}

function sanitizeUsernameCandidate(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 24);
  return cleaned.length >= 2 ? cleaned : `user${Math.floor(1000 + Math.random() * 9000)}`;
}

async function allocateUniqueUsername(baseCandidate: string): Promise<string> {
  let candidate = sanitizeUsernameCandidate(baseCandidate);
  for (let i = 0; i < 10; i++) {
    const taken = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, candidate))
      .limit(1);
    if (taken.length === 0) return candidate;
    candidate = `${sanitizeUsernameCandidate(baseCandidate).slice(0, 18)}${Math.floor(100 + Math.random() * 900)}`;
  }
  return `user_${crypto.randomBytes(3).toString("hex")}`;
}

export async function getOrCreateUserFromAuth(authUser: {
  uid: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}): Promise<DbUserRow> {
  await ensureSeedData();
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, authUser.uid))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .insert(users)
        .values({
          uid: authUser.uid,
          username: existing[0].username,
          email: authUser.email ?? existing[0].email,
          displayName: existing[0].displayName ?? authUser.name ?? existing[0].username,
          avatarUrl: existing[0].avatarUrl ?? authUser.picture ?? "/showcase/saraansx.jpg",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: authUser.email ?? existing[0].email,
            updatedAt: new Date(),
          },
        })
        .returning();
      return updated;
    }

    const baseName =
      authUser.email?.split("@")[0] ||
      authUser.name ||
      `user_${authUser.uid.slice(0, 6)}`;
    const username = await allocateUniqueUsername(baseName);

    const [created] = await db
      .insert(users)
      .values({
        uid: authUser.uid,
        username,
        needsUsername: false,
        email: authUser.email ?? null,
        displayName: authUser.name ?? username,
        avatarUrl: authUser.picture ?? "/showcase/saraansx.jpg",
        bannerImageUrl: "/showcase/rio/banner.png",
        bio: "Welcome to my prophile page.",
        isPremium: true,
        hasImageHost: true,
        hasVerified: true,
        hasDonator: false,
        badgeTokens: 3,
        aliasTokens: 3,
        domainTokens: 2,
        views: 1,
        likesCount: 0,
        dislikesCount: 0,
        profileSettings: { ...DEFAULT_PROFILE_SETTINGS },
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: authUser.email ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Seed starter background and badges for the new user
    await db
      .insert(userBackgrounds)
      .values({ userId: created.id, url: "/showcase/rio/banner.png", position: 0 });
    for (const [idx, badgeId] of ["early", "premium", "verified", "image-host"].entries()) {
      await db
        .insert(userBadges)
        .values({
          userId: created.id,
          badgeId,
          owned: true,
          equipped: idx < 3,
          position: idx,
        })
        .onConflictDoNothing();
    }

    return created;
  } catch (error) {
    console.error("Failed to sync user:", error instanceof Error ? error.message : String(error));
    throw new Error("Database operation failed", { cause: error });
  }
}

export async function findUserById(userId: number): Promise<DbUserRow | null> {
  await ensureSeedData();
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return row ?? null;
}

export async function authenticateUserWithPassword(
  identifier: string,
  password: string
): Promise<{ user?: DbUserRow; error?: string }> {
  await ensureSeedData();
  const clean = identifier.trim().toLowerCase();
  if (!clean || !password) {
    return { error: "Email and password are required." };
  }

  const isEmail = clean.includes("@");
  const [row] = await db
    .select()
    .from(users)
    .where(isEmail ? sql`lower(${users.email}) = ${clean}` : sql`lower(${users.username}) = ${clean}`)
    .limit(1);

  if (!row) {
    return { error: "Invalid email/username or password." };
  }
  if (!isEmail && !row.usernameLoginEnabled) {
    return { error: "Username login is disabled for this account. Please use your email address." };
  }
  if (!row.passwordHash || !verifyPassword(password, row.passwordHash)) {
    return { error: "Invalid email/username or password." };
  }

  return { user: row };
}

export async function registerUserWithEmailPassword(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ user?: DbUserRow; error?: string }> {
  await ensureSeedData();
  const cleanUsername = input.username.trim().toLowerCase();
  const cleanEmail = input.email.trim().toLowerCase();
  const password = input.password;

  if (!cleanUsername || cleanUsername.length < 2 || cleanUsername.length > 24 || !/^[a-z0-9_.-]+$/.test(cleanUsername)) {
    return { error: "Username must be 2–24 characters using letters, numbers, dots, underscores, or hyphens." };
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: "Please enter a valid email address." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${cleanUsername}`)
    .limit(1);
  if (existingUsername) {
    return { error: "That username is already taken." };
  }

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${cleanEmail}`)
    .limit(1);
  if (existingEmail) {
    return { error: "That email is already registered." };
  }

  const [created] = await db
    .insert(users)
    .values({
      uid: `local_${crypto.randomBytes(12).toString("hex")}`,
      username: cleanUsername,
      needsUsername: false,
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: "user",
      emailVerified: true,
      isPremium: true,
      hasImageHost: true,
      hasVerified: true,
      hasDonator: false,
      badgeTokens: 3,
      aliasTokens: 3,
      domainTokens: 2,
      usernameLoginEnabled: true,
      views: 1,
      likesCount: 0,
      dislikesCount: 0,
      displayName: cleanUsername,
      bio: "Welcome to my prophile page.",
      avatarUrl: "/showcase/saraansx.jpg",
      bannerImageUrl: "/showcase/rio/banner.png",
      profileSettings: { ...DEFAULT_PROFILE_SETTINGS },
    })
    .returning();

  await db
    .insert(userBackgrounds)
    .values({ userId: created.id, url: "/showcase/rio/banner.png", position: 0 });
  for (const [idx, badgeId] of ["early", "premium", "verified", "image-host"].entries()) {
    await db
      .insert(userBadges)
      .values({
        userId: created.id,
        badgeId,
        owned: true,
        equipped: idx < 3,
        position: idx,
      })
      .onConflictDoNothing();
  }

  return { user: created };
}

export async function updateUserPassword(
  userId: number,
  currentPassword: string | undefined,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "New password must be at least 6 characters long." };
  }
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) return { ok: false, error: "Account not found." };
  if (row.passwordHash && currentPassword !== undefined) {
    if (!verifyPassword(currentPassword, row.passwordHash)) {
      return { ok: false, error: "Current password is incorrect." };
    }
  }
  await db
    .update(users)
    .set({
      passwordHash: hashPassword(newPassword),
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  return { ok: true };
}

export async function getBootstrapSnapshot(viewerId: number | null) {
  await ensureSeedData();
  try {
    const [
      allUsers,
      allBackgrounds,
      allBadges,
      allCustomBadges,
      allAliases,
      allDomains,
      allTemplates,
      allFavorites,
      allComments,
      allCommentLikes,
      viewerFiles,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.views)),
      db.select().from(userBackgrounds).orderBy(userBackgrounds.position, userBackgrounds.id),
      db.select().from(userBadges).orderBy(userBadges.position, userBadges.id),
      db.select().from(customBadges).orderBy(customBadges.createdAt),
      db.select().from(aliases).orderBy(aliases.createdAt),
      db.select().from(domains).orderBy(domains.createdAt),
      db.select().from(templates).orderBy(desc(templates.createdAt)),
      viewerId
        ? db.select().from(templateFavorites).where(eq(templateFavorites.userId, viewerId))
        : Promise.resolve([]),
      db.select().from(comments).orderBy(desc(comments.pinned), desc(comments.createdAt)),
      viewerId
        ? db.select().from(commentLikes).where(eq(commentLikes.userId, viewerId))
        : Promise.resolve([]),
      viewerId
        ? db
            .select()
            .from(imageHostFiles)
            .where(eq(imageHostFiles.userId, viewerId))
            .orderBy(desc(imageHostFiles.createdAt))
        : Promise.resolve([]),
    ]);

    const usersMap: Record<number, HydratedProfileUser> = {};
    for (const u of allUsers) {
      usersMap[u.id] = serializeUserRow(u);
    }

    const backgroundsMap: Record<number, string[]> = {};
    for (const bg of allBackgrounds) {
      if (!backgroundsMap[bg.userId]) backgroundsMap[bg.userId] = [];
      backgroundsMap[bg.userId].push(bg.url);
    }

    const equippedBadgesMap: Record<number, string[]> = {};
    const ownedBadgesMap: Record<number, string[]> = {};
    for (const b of allBadges) {
      if (b.owned) {
        if (!ownedBadgesMap[b.userId]) ownedBadgesMap[b.userId] = [];
        ownedBadgesMap[b.userId].push(b.badgeId);
      }
      if (b.equipped) {
        if (!equippedBadgesMap[b.userId]) equippedBadgesMap[b.userId] = [];
        equippedBadgesMap[b.userId].push(b.badgeId);
      }
    }
    for (const u of allUsers) {
      if (u.role === "admin") {
        ownedBadgesMap[u.id] = Array.from(
          new Set([...(ownedBadgesMap[u.id] ?? []), ...OWNER_GRANTED_BADGES])
        );
      }
    }

    const customBadgesMap: Record<number, Array<{ id: string; name: string; iconUrl: string }>> = {};
    for (const cb of allCustomBadges) {
      if (!customBadgesMap[cb.userId]) customBadgesMap[cb.userId] = [];
      customBadgesMap[cb.userId].push({ id: cb.id, name: cb.name, iconUrl: cb.iconUrl });
    }

    const aliasesMap: Record<number, Array<{ id: number; alias: string; createdAt: string }>> = {};
    for (const a of allAliases) {
      if (!aliasesMap[a.userId]) aliasesMap[a.userId] = [];
      aliasesMap[a.userId].push({
        id: a.id,
        alias: a.alias,
        createdAt: a.createdAt.toISOString(),
      });
    }

    const favTplIds = new Set(allFavorites.map((f) => f.templateId));
    const serializedTemplates = allTemplates.map((t) => {
      const creator = usersMap[t.creatorId];
      const favorited = favTplIds.has(t.id);
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        thumbnailUrl: t.thumbnailUrl,
        isPublic: t.isPublic,
        useCount: t.useCount,
        favoriteCount: t.favoriteCount,
        favoritedByViewer: favorited,
        favorited,
        requiresPremium: t.requiresPremium,
        tags: t.tags ?? [],
        createdAt: t.createdAt.toISOString(),
        creatorId: t.creatorId,
        creatorUsername: creator?.username ?? "prophile",
        creatorAvatarUrl: creator?.avatarUrl ?? null,
        config: t.config ?? {},
      };
    });

    const likedCommentIds = new Set(allCommentLikes.map((l) => l.commentId));
    const serializedComments = allComments.map((c) => ({
      id: c.id,
      profileId: c.profileId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      pinned: c.pinned,
      likesCount: c.likesCount,
      likedByMe: likedCommentIds.has(c.id),
      replyToId: c.replyToId,
    }));

    const serializedFiles = viewerFiles.map((f) => ({
      id: f.id,
      url: f.url,
      name: f.publicName,
      size: f.sizeBytes,
      kind: (f.kind === "video" ? "video" : "image") as "image" | "video",
      favorite: f.favorite,
      locked: f.locked,
      createdAt: f.createdAt.getTime(),
    }));

    return {
      currentUserId: viewerId,
      sessionUserId: viewerId,
      users: usersMap,
      backgrounds: backgroundsMap,
      userBackgrounds: backgroundsMap,
      equippedBadges: equippedBadgesMap,
      ownedBadges: ownedBadgesMap,
      customBadges: customBadgesMap,
      aliases: aliasesMap,
      domains: allDomains.map((d) => ({
        id: d.id,
        userId: d.userId,
        hostname: d.hostname,
        type: d.type as "profile" | "image_host",
        visibility: d.visibility as "private" | "public",
        status: d.status as "pending" | "active",
        dcvTarget: d.dcvTarget,
      })),
      templates: serializedTemplates,
      comments: serializedComments,
      imageFiles: viewerFiles.map((f) => ({
        id: f.id,
        userId: f.userId,
        publicName: f.publicName,
        originalName: f.originalName,
        mimeType: f.mimeType,
        sizeBytes: f.sizeBytes,
        url: f.url,
        favorite: f.favorite,
        hasPassword: f.locked,
        views: f.views,
        createdAt: f.createdAt.toISOString(),
      })),
      imageHostFiles: serializedFiles,
    };
  } catch (error) {
    console.error("Failed to load bootstrap data:", error instanceof Error ? error.message : String(error));
    throw new Error("Database operation failed", { cause: error });
  }
}

export async function updateUserProfilePatch(
  userId: number,
  patch: Record<string, unknown>
): Promise<HydratedProfileUser> {
  try {
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) throw new Error("User not found");

    const columnUpdates: Record<string, unknown> = { updatedAt: new Date() };
    const nextSettings: Record<string, unknown> = {
      ...((existing.profileSettings as Record<string, unknown>) ?? {}),
    };
    const nextEffectConfig: Record<string, unknown> = {
      ...((nextSettings.effectConfig as Record<string, unknown>) ?? {}),
    };

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (DIRECT_USER_COLUMNS.has(key)) {
        columnUpdates[key] = value;
      } else {
        nextSettings[key] = value;
        if (
          key.startsWith("aurora") ||
          key.startsWith("darkveil") ||
          key.startsWith("pixelblast") ||
          key.startsWith("colorbends") ||
          key.startsWith("liquidchrome") ||
          key.startsWith("crtwarp")
        ) {
          nextEffectConfig[key] = value;
        }
      }
    }

    nextSettings.effectConfig = nextEffectConfig;
    columnUpdates.profileSettings = nextSettings;

    const [updated] = await db
      .update(users)
      .set(columnUpdates)
      .where(eq(users.id, userId))
      .returning();

    return serializeUserRow(updated);
  } catch (error) {
    console.error("Failed to update user profile:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to update profile", { cause: error });
  }
}

export async function replaceUserBackgrounds(userId: number, urls: string[]): Promise<string[]> {
  try {
    const cleanUrls = urls.filter((u) => typeof u === "string" && u.trim().length > 0).slice(0, 12);
    await db.delete(userBackgrounds).where(eq(userBackgrounds.userId, userId));
    if (cleanUrls.length > 0) {
      await db.insert(userBackgrounds).values(
        cleanUrls.map((url, idx) => ({
          userId,
          url,
          position: idx,
        }))
      );
    }
    return cleanUrls;
  } catch (error) {
    console.error("Failed to replace backgrounds:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to update backgrounds", { cause: error });
  }
}

export async function getUserBadgesState(userId: number) {
  try {
    const [uRows, bRows, cbRows] = await Promise.all([
      db
        .select({ badgeTokens: users.badgeTokens, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId))
        .orderBy(userBadges.position, userBadges.id),
      db.select().from(customBadges).where(eq(customBadges.userId, userId)).orderBy(customBadges.createdAt),
    ]);

    const custom = cbRows.map((c) => ({ id: c.id, name: c.name, iconUrl: c.iconUrl }));
    const isAdmin = uRows[0]?.role === "admin";
    const owned = Array.from(
      new Set([
        ...bRows.filter((b) => b.owned).map((b) => b.badgeId),
        ...custom.map((c) => c.id),
        ...(isAdmin ? OWNER_GRANTED_BADGES : []),
      ])
    );
    const equipped = bRows.filter((b) => b.equipped).map((b) => b.badgeId);

    return {
      owned,
      equipped,
      custom,
      tokens: uRows[0]?.badgeTokens ?? 1,
    };
  } catch (error) {
    console.error("Failed to load badges:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to load badges", { cause: error });
  }
}

export async function saveUserEquippedBadges(userId: number, badgeIds: string[]) {
  try {
    await db
      .update(userBadges)
      .set({ equipped: false })
      .where(eq(userBadges.userId, userId));

    for (let i = 0; i < badgeIds.length; i++) {
      const badgeId = badgeIds[i];
      await db
        .insert(userBadges)
        .values({ userId, badgeId, owned: true, equipped: true, position: i })
        .onConflictDoUpdate({
          target: [userBadges.userId, userBadges.badgeId],
          set: { equipped: true, position: i },
        });
    }
    return getUserBadgesState(userId);
  } catch (error) {
    console.error("Failed to save equipped badges:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to save badges", { cause: error });
  }
}

export async function createUserCustomBadge(
  userId: number,
  name: string,
  iconUrl: string
) {
  try {
    const id = `custom-${crypto.randomBytes(6).toString("hex")}`;
    await db.insert(customBadges).values({
      id,
      userId,
      name: name.trim() || "Custom",
      iconUrl,
    });
    await db
      .insert(userBadges)
      .values({ userId, badgeId: id, owned: true, equipped: true, position: 0 })
      .onConflictDoNothing();
    return getUserBadgesState(userId);
  } catch (error) {
    console.error("Failed to create custom badge:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to create custom badge", { cause: error });
  }
}

export async function deleteUserCustomBadge(userId: number, badgeId: string) {
  try {
    await db
      .delete(customBadges)
      .where(and(eq(customBadges.id, badgeId), eq(customBadges.userId, userId)));
    await db
      .delete(userBadges)
      .where(and(eq(userBadges.badgeId, badgeId), eq(userBadges.userId, userId)));
    return getUserBadgesState(userId);
  } catch (error) {
    console.error("Failed to delete custom badge:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to delete custom badge", { cause: error });
  }
}

export async function resetUserCustomBadges(userId: number) {
  try {
    const rows = await db
      .select({ id: customBadges.id })
      .from(customBadges)
      .where(eq(customBadges.userId, userId));
    const ids = rows.map((r) => r.id);
    await db.delete(customBadges).where(eq(customBadges.userId, userId));
    if (ids.length > 0) {
      await db
        .delete(userBadges)
        .where(and(eq(userBadges.userId, userId), inArray(userBadges.badgeId, ids)));
    }
    return getUserBadgesState(userId);
  } catch (error) {
    console.error("Failed to reset custom badges:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to reset custom badges", { cause: error });
  }
}

export async function incrementProfileView(profileId: number): Promise<void> {
  try {
    await db
      .update(users)
      .set({ views: sql`${users.views} + 1` })
      .where(eq(users.id, profileId));
  } catch (error) {
    console.error("Failed to increment profile view:", error instanceof Error ? error.message : String(error));
  }
}

export async function saveMediaObjectFallback(params: {
  storageKey: string;
  userId: number | null;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}): Promise<string> {
  try {
    await db
      .insert(mediaObjects)
      .values({
        storageKey: params.storageKey,
        userId: params.userId,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes,
        dataBase64: params.buffer.toString("base64"),
      })
      .onConflictDoUpdate({
        target: mediaObjects.storageKey,
        set: {
          mimeType: params.mimeType,
          sizeBytes: params.sizeBytes,
          dataBase64: params.buffer.toString("base64"),
        },
      });
    return `/api/media/object/${encodeURIComponent(params.storageKey)}`;
  } catch (error) {
    console.error("Failed to store media object:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to store media object", { cause: error });
  }
}

export async function loadMediaObjectFallback(storageKey: string): Promise<{
  buffer: Buffer;
  mimeType: string;
} | null> {
  try {
    const [row] = await db
      .select()
      .from(mediaObjects)
      .where(eq(mediaObjects.storageKey, storageKey))
      .limit(1);
    if (!row) return null;
    return {
      buffer: Buffer.from(row.dataBase64, "base64"),
      mimeType: row.mimeType,
    };
  } catch (error) {
    console.error("Failed to load media object:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function deleteMediaObjectFallback(storageKey: string): Promise<void> {
  try {
    await db.delete(mediaObjects).where(eq(mediaObjects.storageKey, storageKey));
  } catch (error) {
    console.error("Failed to delete media object:", error instanceof Error ? error.message : String(error));
  }
}
