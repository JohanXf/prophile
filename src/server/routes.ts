import express, { type Router, type Response } from "express";
import multer from "multer";
import crypto from "crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, isTransientDbError, withDbRetry } from "../db/index.ts";
import {
  users,
  aliases,
  domains,
  templates,
  templateFavorites,
  comments,
  commentLikes,
  profileFeedback,
  imageHostFiles,
} from "../db/schema.ts";
import {
  ensureSeedData,
  getBootstrapSnapshot,
  serializeUserRow,
  updateUserProfilePatch,
  replaceUserBackgrounds,
  getUserBadgesState,
  saveUserEquippedBadges,
  createUserCustomBadge,
  deleteUserCustomBadge,
  resetUserCustomBadges,
  incrementProfileView,
  saveMediaObjectFallback,
  loadMediaObjectFallback,
  deleteMediaObjectFallback,
  authenticateUserWithPassword,
  registerUserWithEmailPassword,
  updateUserPassword,
} from "../db/repository.ts";
import {
  clearSessionCookie,
  setSessionCookie,
  signSessionToken,
} from "../lib/password-auth.ts";
import {
  isR2Configured,
  validateMediaFile,
  generateStorageKey,
  createPresignedUploadUrl,
  uploadBufferToR2,
  getObjectFromR2,
  deleteObjectFromR2,
  MAX_MEDIA_BYTES,
  type MediaCategory,
} from "../lib/r2.ts";
import { requireAuth, optionalAuth, type AuthenticatedRequest } from "../middleware/auth.ts";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MEDIA_BYTES },
});

const SAMPLE_SEARCH_TRACKS = [
  {
    id: "sc-1",
    title: "MONTAGEM Miau",
    artist: "Lenar",
    duration: 94,
    artworkUrl: "/showcase-music-cover.jpg",
    audioUrl: "/montagem-miau.mp3",
  },
  {
    id: "sc-2",
    title: "All The Stars",
    artist: "Kendrick Lamar, SZA",
    duration: 232,
    artworkUrl: "/all-the-stars-cover.jpg",
    audioUrl: "/all-the-stars.mp3",
  },
  {
    id: "sc-3",
    title: "Soft Spot",
    artist: "keshi",
    duration: 204,
    artworkUrl: "/soft-spot-cover.jpg",
    audioUrl: "/soft-spot.mp3",
  },
  {
    id: "sc-4",
    title: "Chanel",
    artist: "Tyla",
    duration: 185,
    artworkUrl: "/showcase/chanel.webp",
    audioUrl: "/showcase/chanel.mp3",
  },
];

const CURATED_ICONS = [
  "simple-icons:github",
  "simple-icons:discord",
  "simple-icons:spotify",
  "simple-icons:youtube",
  "simple-icons:twitch",
  "simple-icons:instagram",
  "simple-icons:tiktok",
  "simple-icons:x",
  "simple-icons:steam",
  "simple-icons:soundcloud",
  "simple-icons:telegram",
  "simple-icons:roblox",
  "simple-icons:valorant",
  "simple-icons:pinterest",
  "simple-icons:applemusic",
  "simple-icons:linkedin",
];

function hashSecret(val: string): string {
  return crypto.createHash("sha256").update(val).digest("hex");
}

function sendDbError(res: Response, error: unknown, fallback = "Service unavailable") {
  console.error("API error:", error instanceof Error ? error.message : String(error));
  return res.status(500).json({ error: fallback });
}

export function createApiRouter(): Router {
  const router = express.Router();

  // --- Bootstrap & Auth ---
  router.get("/bootstrap", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await getBootstrapSnapshot(req.dbUser?.id ?? null);
      return res.json(snapshot);
    } catch (error) {
      return sendDbError(res, error, "Failed to load application data");
    }
  });

  router.get("/auth/me", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.dbUser) {
        return res.json({ authenticated: false, user: null });
      }
      return res.json({ authenticated: true, user: serializeUserRow(req.dbUser) });
    } catch (error) {
      return sendDbError(res, error, "Failed to load session");
    }
  });

  router.post("/auth/login", async (req, res) => {
    try {
      const identifier = String(req.body?.identifier || req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const result = await authenticateUserWithPassword(identifier, password);
      if (result.error || !result.user) {
        return res.status(401).json({ error: result.error || "Invalid credentials." });
      }
      const token = signSessionToken(result.user.id, result.user.email);
      setSessionCookie(res, token);
      return res.json({
        success: true,
        token,
        user: serializeUserRow(result.user),
      });
    } catch (error) {
      return sendDbError(res, error, "Sign in failed");
    }
  });

  router.post("/auth/register", async (req, res) => {
    try {
      const username = String(req.body?.username || "").trim();
      const email = String(req.body?.email || "").trim();
      const password = String(req.body?.password || "");
      const result = await registerUserWithEmailPassword({ username, email, password });
      if (result.error || !result.user) {
        return res.status(400).json({ error: result.error || "Registration failed." });
      }
      const token = signSessionToken(result.user.id, result.user.email);
      setSessionCookie(res, token);
      return res.status(201).json({
        success: true,
        token,
        user: serializeUserRow(result.user),
      });
    } catch (error) {
      return sendDbError(res, error, "Registration failed");
    }
  });

  router.post("/auth/logout", async (_req, res) => {
    clearSessionCookie(res);
    return res.json({ success: true });
  });

  router.patch("/account/password", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const currentPassword =
        req.body?.currentPassword !== undefined ? String(req.body.currentPassword) : undefined;
      const newPassword = String(req.body?.newPassword || "");
      const result = await updateUserPassword(req.dbUser!.id, currentPassword, newPassword);
      if (!result.ok) {
        return res.status(400).json({ error: result.error || "Failed to update password." });
      }
      return res.json({ ok: true });
    } catch (error) {
      return sendDbError(res, error, "Failed to update password");
    }
  });

  router.get("/auth/check-availability", async (req, res) => {
    try {
      await ensureSeedData();
      const username = String(req.query.username || "").toLowerCase().trim();
      const email = String(req.query.email || "").toLowerCase().trim();

      if (username) {
        if (username.length < 2) {
          return res.json({ available: false, field: "username", error: "Username must be at least 2 characters." });
        }
        const existingUser = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        if (existingUser.length > 0) {
          return res.json({ available: false, field: "username", error: "That username is already taken." });
        }
      }

      if (email) {
        const existingEmail = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (existingEmail.length > 0) {
          return res.json({ available: false, field: "email", error: "That email is already registered." });
        }
      }

      return res.json({ available: true });
    } catch (error) {
      return sendDbError(res, error, "Availability check failed");
    }
  });

  // --- Profile Endpoints ---
  router.get("/profile/me", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.dbUser?.id ?? null;
      const profileId = Number(req.query.profileId || 0);
      if (!uid) {
        return res.json({ viewerId: null, feedback: null, user: null, backgrounds: [], equippedBadges: [], customBadges: [] });
      }
      let feedback: string | null = null;
      if (profileId > 0) {
        const [fb] = await db
          .select({ type: profileFeedback.type })
          .from(profileFeedback)
          .where(and(eq(profileFeedback.receiverId, profileId), eq(profileFeedback.giverId, uid)))
          .limit(1);
        feedback = fb?.type ?? null;
      }
      const snapshot = await getBootstrapSnapshot(uid);
      return res.json({
        viewerId: uid,
        feedback,
        user: snapshot.users[uid],
        backgrounds: snapshot.backgrounds[uid] ?? [],
        equippedBadges: snapshot.equippedBadges[uid] ?? [],
        customBadges: snapshot.customBadges[uid] ?? [],
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to load profile");
    }
  });

  router.patch("/profile/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const patch = req.body && typeof req.body === "object" ? req.body : {};
      const updated = await updateUserProfilePatch(req.dbUser!.id, patch);
      return res.json({ success: true, user: updated });
    } catch (error) {
      return sendDbError(res, error, "Failed to save profile changes");
    }
  });

  router.put("/profile/backgrounds", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
      const saved = await replaceUserBackgrounds(req.dbUser!.id, urls);
      return res.json({ success: true, backgrounds: saved });
    } catch (error) {
      return sendDbError(res, error, "Failed to update backgrounds");
    }
  });

  router.get("/profile/live", async (req, res) => {
    try {
      await ensureSeedData();
      const username = String(req.query.username || "").toLowerCase().trim();
      const [row] = await db
        .select({
          views: users.views,
          likesCount: users.likesCount,
          dislikesCount: users.dislikesCount,
        })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      return res.json({
        views: row?.views ?? 0,
        likes: row?.likesCount ?? 0,
        dislikes: row?.dislikesCount ?? 0,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to load live stats");
    }
  });

  router.post("/track-view", async (req, res) => {
    try {
      const profileId = Number(req.body?.profileId);
      if (Number.isInteger(profileId) && profileId > 0) {
        await incrementProfileView(profileId);
      }
      return res.json({ ok: true });
    } catch (error) {
      return sendDbError(res, error, "Failed to record view");
    }
  });

  // --- Badges ---
  router.get("/badges", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const data = await getUserBadgesState(req.dbUser!.id);
      return res.json(data);
    } catch (error) {
      return sendDbError(res, error, "Failed to fetch badges");
    }
  });

  router.put("/badges/equipped", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
      const data = await saveUserEquippedBadges(req.dbUser!.id, ids);
      return res.json(data);
    } catch (error) {
      return sendDbError(res, error, "Failed to save equipped badges");
    }
  });

  router.post("/badges/custom", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const name = String(req.body?.name || "").trim();
      const iconUrl = String(req.body?.iconUrl || "").trim();
      if (!name || !iconUrl) {
        return res.status(400).json({ error: "Badge name and icon URL are required." });
      }
      const data = await createUserCustomBadge(req.dbUser!.id, name, iconUrl);
      return res.json(data);
    } catch (error) {
      return sendDbError(res, error, "Failed to create custom badge");
    }
  });

  router.delete("/badges/custom/:badgeId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const data = await deleteUserCustomBadge(req.dbUser!.id, String(req.params.badgeId));
      return res.json(data);
    } catch (error) {
      return sendDbError(res, error, "Failed to delete custom badge");
    }
  });

  router.post("/badges/custom/reset", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const data = await resetUserCustomBadges(req.dbUser!.id);
      return res.json(data);
    } catch (error) {
      return sendDbError(res, error, "Failed to reset custom badges");
    }
  });

  // --- Account & Aliases ---
  async function getAliasStateForUser(userId: number) {
    const [uRow] = await db
      .select({ aliasTokens: users.aliasTokens, isPremium: users.isPremium })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const rows = await db
      .select()
      .from(aliases)
      .where(eq(aliases.userId, userId))
      .orderBy(aliases.createdAt);
    const tokens = uRow?.aliasTokens ?? 1;
    const premium = Boolean(uRow?.isPremium);
    return {
      aliases: rows.map((r) => ({ id: r.id, alias: r.alias, createdAt: r.createdAt.toISOString() })),
      tokens,
      slots: tokens + (premium ? 2 : 0),
      premium,
    };
  }

  router.patch("/account/username", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const clean = String(req.body?.username || "").toLowerCase().trim();
      if (!/^[a-z0-9_.-]{2,24}$/.test(clean)) {
        return res.status(400).json({ error: "Username must be 2–24 characters (letters, numbers, ., _, -)." });
      }
      const taken = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, clean))
        .limit(1);
      if (taken.length > 0 && taken[0].id !== req.dbUser!.id) {
        return res.status(409).json({ error: "That username is already taken." });
      }
      await db
        .update(users)
        .set({ username: clean, needsUsername: false, updatedAt: new Date() })
        .where(eq(users.id, req.dbUser!.id));
      return res.json({ ok: true, data: { username: clean } });
    } catch (error) {
      return sendDbError(res, error, "Failed to update username");
    }
  });

  router.patch("/account/display-name", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const displayName = String(req.body?.displayName || "").trim().slice(0, 48);
      await db
        .update(users)
        .set({ displayName, updatedAt: new Date() })
        .where(eq(users.id, req.dbUser!.id));
      return res.json({ ok: true, data: { displayName } });
    } catch (error) {
      return sendDbError(res, error, "Failed to update display name");
    }
  });

  router.post("/account/aliases", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const clean = String(req.body?.alias || "").toLowerCase().trim();
      if (!clean || clean.length < 1 || clean.length > 24) {
        return res.status(400).json({ error: "Enter a valid alias (1–24 characters)." });
      }
      const existingAlias = await db.select({ id: aliases.id }).from(aliases).where(eq(aliases.alias, clean)).limit(1);
      const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.username, clean)).limit(1);
      if (existingAlias.length > 0 || existingUser.length > 0) {
        return res.status(409).json({ error: "That handle is already claimed." });
      }
      await db.insert(aliases).values({ userId: req.dbUser!.id, alias: clean });
      return res.json({ ok: true, data: await getAliasStateForUser(req.dbUser!.id) });
    } catch (error) {
      return sendDbError(res, error, "Failed to add alias");
    }
  });

  router.patch("/account/aliases/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const clean = String(req.body?.alias || "").toLowerCase().trim();
      if (!clean) return res.status(400).json({ error: "Alias is required." });
      await db
        .update(aliases)
        .set({ alias: clean })
        .where(and(eq(aliases.id, id), eq(aliases.userId, req.dbUser!.id)));
      return res.json({ ok: true, data: await getAliasStateForUser(req.dbUser!.id) });
    } catch (error) {
      return sendDbError(res, error, "Failed to update alias");
    }
  });

  router.delete("/account/aliases/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db
        .delete(aliases)
        .where(and(eq(aliases.id, id), eq(aliases.userId, req.dbUser!.id)));
      return res.json({ ok: true, data: await getAliasStateForUser(req.dbUser!.id) });
    } catch (error) {
      return sendDbError(res, error, "Failed to delete alias");
    }
  });

  router.post("/account/aliases/:id/swap", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const [target] = await db
        .select()
        .from(aliases)
        .where(and(eq(aliases.id, id), eq(aliases.userId, req.dbUser!.id)))
        .limit(1);
      if (!target) return res.status(404).json({ error: "Alias not found." });

      const oldUsername = req.dbUser!.username;
      const newUsername = target.alias;
      await db.update(aliases).set({ alias: `__swap_${id}_${Date.now()}` }).where(eq(aliases.id, id));
      await db.update(users).set({ username: newUsername, updatedAt: new Date() }).where(eq(users.id, req.dbUser!.id));
      await db.update(aliases).set({ alias: oldUsername }).where(eq(aliases.id, id));

      const state = await getAliasStateForUser(req.dbUser!.id);
      return res.json({ ok: true, data: { ...state, username: newUsername } });
    } catch (error) {
      return sendDbError(res, error, "Failed to swap alias");
    }
  });

  router.patch("/account/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body ?? {};
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (typeof body.usernameLoginEnabled === "boolean") updates.usernameLoginEnabled = body.usernameLoginEnabled;
      if (body.disconnectDiscord) {
        updates.discordId = null;
        updates.discordUsername = null;
      }
      if (body.twoFactorEnabled === true) updates.twoFactorEnabledAt = new Date();
      if (body.twoFactorEnabled === false) updates.twoFactorEnabledAt = null;
      await db.update(users).set(updates).where(eq(users.id, req.dbUser!.id));
      return res.json({ ok: true, data: {} });
    } catch (error) {
      return sendDbError(res, error, "Failed to update account settings");
    }
  });

  // --- Domains ---
  async function getDomainStateForUser(userId: number) {
    const [uRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const allDomains = await db.select().from(domains).orderBy(domains.createdAt);
    const ownerIds = Array.from(new Set(allDomains.map((d) => d.userId)));
    const ownerRows =
      ownerIds.length > 0
        ? await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.id, ownerIds))
        : [];
    const ownerMap = new Map(ownerRows.map((o) => [o.id, o.username]));

    const own = allDomains.filter((d) => d.userId === userId);
    const available = allDomains
      .filter((d) => d.status === "active" && (d.visibility === "public" || d.userId === userId))
      .map((d) => ({
        id: d.id,
        hostname: d.hostname,
        type: d.type as "profile" | "image_host",
        owner: ownerMap.get(d.userId) ?? "prophile",
        own: d.userId === userId,
      }));

    return {
      username: uRow?.username ?? "prophile",
      tokens: uRow?.domainTokens ?? 1,
      domains: own.map((d) => ({
        id: d.id,
        hostname: d.hostname,
        type: d.type as "profile" | "image_host",
        visibility: d.visibility as "private" | "public",
        status: d.status as "pending" | "active",
        dcvTarget: d.dcvTarget,
      })),
      available,
      profileDomainId: null,
      imageDomainId: null,
    };
  }

  router.post("/domains", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const hostname = String(req.body?.hostname || "").toLowerCase().trim();
      const type = req.body?.type === "image_host" ? "image_host" : "profile";
      const visibility = req.body?.visibility === "public" ? "public" : "private";
      if (!hostname || !hostname.includes(".")) {
        return res.status(400).json({ error: "Enter a valid hostname." });
      }
      await db.insert(domains).values({
        userId: req.dbUser!.id,
        hostname,
        type,
        visibility,
        status: "active",
        dcvTarget: null,
      });
      return res.json({ ok: true, data: await getDomainStateForUser(req.dbUser!.id) });
    } catch (error) {
      return sendDbError(res, error, "Failed to add domain");
    }
  });

  router.post("/domains/:id/verify", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db
        .update(domains)
        .set({ status: "active" })
        .where(and(eq(domains.id, id), eq(domains.userId, req.dbUser!.id)));
      const state = await getDomainStateForUser(req.dbUser!.id);
      return res.json({ ok: true, data: { ...state, active: true } });
    } catch (error) {
      return sendDbError(res, error, "Failed to verify domain");
    }
  });

  router.delete("/domains/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(domains).where(and(eq(domains.id, id), eq(domains.userId, req.dbUser!.id)));
      return res.json({ ok: true, data: await getDomainStateForUser(req.dbUser!.id) });
    } catch (error) {
      return sendDbError(res, error, "Failed to remove domain");
    }
  });

  // --- Comments ---
  router.get("/comments", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      await ensureSeedData();
      const profileId = Number(req.query.profileId);
      if (!profileId) return res.json({ success: true, comments: [], total: 0, hasMore: false });

      const allRows = await db
        .select()
        .from(comments)
        .where(eq(comments.profileId, profileId))
        .orderBy(desc(comments.pinned), desc(comments.createdAt));

      const authorIds = Array.from(new Set(allRows.map((c) => c.authorId)));
      const authorRows =
        authorIds.length > 0
          ? await db.select().from(users).where(inArray(users.id, authorIds))
          : [];
      const authorMap = new Map(authorRows.map((u) => [u.id, serializeUserRow(u)]));

      const viewerLikes = req.dbUser
        ? new Set(
            (
              await db
                .select({ commentId: commentLikes.commentId })
                .from(commentLikes)
                .where(eq(commentLikes.userId, req.dbUser.id))
            ).map((l) => l.commentId)
          )
        : new Set<number>();

      const toAuthor = (id: number) => {
        const u = authorMap.get(id);
        return {
          id: u?.id ?? id,
          username: u?.username ?? "user",
          displayName: u?.displayName ?? u?.username ?? "user",
          avatarUrl: u?.avatarUrl ?? null,
          avatarShape: (u?.avatarShape as string) ?? "circle",
        };
      };

      const topLevel = allRows.filter((c) => !c.replyToId);
      const formatted = topLevel.map((c) => ({
        id: c.id,
        profileId: c.profileId,
        authorId: c.authorId,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        pinned: c.pinned,
        likesCount: c.likesCount,
        likedByMe: viewerLikes.has(c.id),
        replyToId: c.replyToId,
        author: toAuthor(c.authorId),
        replies: allRows
          .filter((r) => r.replyToId === c.id)
          .map((r) => ({
            id: r.id,
            profileId: r.profileId,
            authorId: r.authorId,
            content: r.content,
            createdAt: r.createdAt.toISOString(),
            pinned: r.pinned,
            likesCount: r.likesCount,
            likedByMe: viewerLikes.has(r.id),
            replyToId: r.replyToId,
            author: toAuthor(r.authorId),
          })),
      }));

      return res.json({ success: true, comments: formatted, total: formatted.length, hasMore: false });
    } catch (error) {
      return sendDbError(res, error, "Failed to load comments");
    }
  });

  router.post("/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const profileId = Number(req.body?.profileId);
      const content = String(req.body?.content || "").trim();
      const replyToId = req.body?.replyToId ? Number(req.body.replyToId) : null;
      if (!profileId || !content) {
        return res.status(400).json({ error: "Comment content is required." });
      }
      const [inserted] = await db
        .insert(comments)
        .values({
          profileId,
          authorId: req.dbUser!.id,
          content: content.slice(0, 1000),
          replyToId,
        })
        .returning();

      const author = serializeUserRow(req.dbUser!);
      return res.json({
        success: true,
        comment: {
          id: inserted.id,
          profileId: inserted.profileId,
          authorId: inserted.authorId,
          content: inserted.content,
          createdAt: inserted.createdAt.toISOString(),
          pinned: inserted.pinned,
          likesCount: inserted.likesCount,
          likedByMe: false,
          replyToId: inserted.replyToId,
          author: {
            id: author.id,
            username: author.username,
            displayName: author.displayName,
            avatarUrl: author.avatarUrl,
            avatarShape: author.avatarShape,
          },
          replies: [],
        },
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to post comment");
    }
  });

  router.post("/comments/:id/like", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = Number(req.params.id);
      const userId = req.dbUser!.id;
      const existing = await db
        .select()
        .from(commentLikes)
        .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)))
        .limit(1);

      let liked = false;
      if (existing.length > 0) {
        await db
          .delete(commentLikes)
          .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
        await db
          .update(comments)
          .set({ likesCount: sql`GREATEST(0, ${comments.likesCount} - 1)` })
          .where(eq(comments.id, commentId));
      } else {
        liked = true;
        await db.insert(commentLikes).values({ commentId, userId }).onConflictDoNothing();
        await db
          .update(comments)
          .set({ likesCount: sql`${comments.likesCount} + 1` })
          .where(eq(comments.id, commentId));
      }

      const [updated] = await db.select({ likesCount: comments.likesCount }).from(comments).where(eq(comments.id, commentId)).limit(1);
      return res.json({ success: true, liked, likesCount: updated?.likesCount ?? 0 });
    } catch (error) {
      return sendDbError(res, error, "Failed to toggle comment like");
    }
  });

  router.post("/comments/:id/pin", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = Number(req.params.id);
      const [row] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
      if (!row || row.profileId !== req.dbUser!.id) {
        return res.status(403).json({ error: "Only the profile owner can pin comments." });
      }
      const nextPinned = !row.pinned;
      await db.update(comments).set({ pinned: nextPinned }).where(eq(comments.id, commentId));
      return res.json({ success: true, pinned: nextPinned });
    } catch (error) {
      return sendDbError(res, error, "Failed to pin comment");
    }
  });

  router.patch("/comments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = Number(req.params.id);
      const content = String(req.body?.content || "").trim();
      if (!content) return res.status(400).json({ error: "Content is required." });
      await db
        .update(comments)
        .set({ content: content.slice(0, 1000) })
        .where(and(eq(comments.id, commentId), eq(comments.authorId, req.dbUser!.id)));
      return res.json({ success: true, content });
    } catch (error) {
      return sendDbError(res, error, "Failed to edit comment");
    }
  });

  router.delete("/comments/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = Number(req.params.id);
      const [row] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
      if (!row) return res.json({ success: true });
      if (row.authorId !== req.dbUser!.id && row.profileId !== req.dbUser!.id) {
        return res.status(403).json({ error: "Not authorized to delete this comment." });
      }
      await db.delete(comments).where(eq(comments.replyToId, commentId));
      await db.delete(comments).where(eq(comments.id, commentId));
      return res.json({ success: true });
    } catch (error) {
      return sendDbError(res, error, "Failed to delete comment");
    }
  });

  router.get("/dashboard/comments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.dbUser!.id;
      const [receivedRows, givenRows] = await Promise.all([
        db.select().from(comments).where(eq(comments.profileId, uid)).orderBy(desc(comments.createdAt)),
        db.select().from(comments).where(eq(comments.authorId, uid)).orderBy(desc(comments.createdAt)),
      ]);
      const userIds = Array.from(
        new Set([...receivedRows.map((r) => r.authorId), ...givenRows.map((g) => g.profileId)])
      );
      const userRows =
        userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
      const uMap = new Map(userRows.map((u) => [u.id, serializeUserRow(u)]));

      const pick = (id: number) => {
        const u = uMap.get(id);
        return {
          id: u?.id ?? id,
          username: u?.username ?? "user",
          displayName: u?.displayName ?? u?.username ?? "user",
          avatarUrl: u?.avatarUrl ?? null,
          avatarShape: (u?.avatarShape as string) ?? "circle",
        };
      };

      const received = receivedRows.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        pinned: c.pinned,
        likesCount: c.likesCount,
        likedByMe: false,
        author: pick(c.authorId),
      }));

      const given = givenRows.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        pinned: c.pinned,
        likesCount: c.likesCount,
        likedByMe: false,
        profileUser: pick(c.profileId),
      }));

      return res.json({
        success: true,
        received,
        given,
        receivedHasMore: false,
        givenHasMore: false,
        receivedTotal: received.length,
        givenTotal: given.length,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to fetch dashboard comments");
    }
  });

  // --- Feedback ---
  router.post("/feedback", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const receiverId = Number(req.body?.userId);
      const type = String(req.body?.type || "");
      const giverId = req.dbUser!.id;
      if (!receiverId) return res.status(400).json({ success: false, error: "Profile not found." });

      if (type === "like" || type === "dislike") {
        await db
          .insert(profileFeedback)
          .values({ receiverId, giverId, type })
          .onConflictDoUpdate({
            target: [profileFeedback.receiverId, profileFeedback.giverId],
            set: { type },
          });
      } else {
        await db
          .delete(profileFeedback)
          .where(and(eq(profileFeedback.receiverId, receiverId), eq(profileFeedback.giverId, giverId)));
      }

      if (type === "like") {
        await db.update(users).set({ likesCount: sql`${users.likesCount} + 1` }).where(eq(users.id, receiverId));
      } else if (type === "unlike") {
        await db.update(users).set({ likesCount: sql`GREATEST(0, ${users.likesCount} - 1)` }).where(eq(users.id, receiverId));
      } else if (type === "dislike") {
        await db.update(users).set({ dislikesCount: sql`${users.dislikesCount} + 1` }).where(eq(users.id, receiverId));
      } else if (type === "undislike") {
        await db.update(users).set({ dislikesCount: sql`GREATEST(0, ${users.dislikesCount} - 1)` }).where(eq(users.id, receiverId));
      }

      const [target] = await db
        .select({ likesCount: users.likesCount, dislikesCount: users.dislikesCount })
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1);

      return res.json({
        success: true,
        likesCount: target?.likesCount ?? 0,
        dislikesCount: target?.dislikesCount ?? 0,
        userReaction: type === "like" ? "like" : type === "dislike" ? "dislike" : null,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to submit feedback");
    }
  });

  router.get("/dashboard/feedback", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const uid = req.dbUser!.id;
      const [receivedRows, givenRows] = await Promise.all([
        db.select().from(profileFeedback).where(eq(profileFeedback.receiverId, uid)).orderBy(desc(profileFeedback.createdAt)),
        db.select().from(profileFeedback).where(eq(profileFeedback.giverId, uid)).orderBy(desc(profileFeedback.createdAt)),
      ]);
      const userIds = Array.from(
        new Set([...receivedRows.map((r) => r.giverId), ...givenRows.map((g) => g.receiverId)])
      );
      const userRows =
        userIds.length > 0 ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
      const uMap = new Map(userRows.map((u) => [u.id, serializeUserRow(u)]));

      const pick = (id: number) => {
        const u = uMap.get(id);
        return {
          id: u?.id ?? id,
          username: u?.username ?? "user",
          displayName: u?.displayName ?? u?.username ?? "user",
          avatarUrl: u?.avatarUrl ?? null,
          avatarShape: (u?.avatarShape as string) ?? "circle",
        };
      };

      const received = receivedRows.map((r) => ({
        id: r.id,
        receiverId: r.receiverId,
        giverId: r.giverId,
        type: r.type as "like" | "dislike",
        createdAt: r.createdAt.toISOString(),
        user: pick(r.giverId),
      }));

      const given = givenRows.map((r) => ({
        id: r.id,
        receiverId: r.receiverId,
        giverId: r.giverId,
        type: r.type as "like" | "dislike",
        createdAt: r.createdAt.toISOString(),
        user: pick(r.receiverId),
      }));

      return res.json({
        success: true,
        received,
        given,
        receivedHasMore: false,
        givenHasMore: false,
        receivedTotal: received.length,
        givenTotal: given.length,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to load feedback");
    }
  });

  // --- Templates ---
  router.get("/templates", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const snapshot = await getBootstrapSnapshot(req.dbUser?.id ?? null);
      const tab = String(req.query.tab || "discover");
      const q = String(req.query.q || "").toLowerCase().trim();
      const sort = String(req.query.sort || "newest");
      const uid = req.dbUser?.id ?? null;

      let items = [...snapshot.templates];
      if (tab === "mine" && uid) items = items.filter((t) => t.creatorId === uid);
      else if (tab === "favorites") items = items.filter((t) => t.favoritedByViewer);
      else items = items.filter((t) => t.isPublic || t.creatorId === uid);

      if (q) {
        items = items.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
            (t.creatorUsername || "").toLowerCase().includes(q)
        );
      }

      if (sort === "popular") {
        items.sort((a, b) => b.useCount - a.useCount);
      }

      return res.json({
        items: items.map((t) => ({ ...t, isOwner: uid != null && t.creatorId === uid })),
        total: items.length,
        nextCursor: null,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to load templates");
    }
  });

  router.post("/templates", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const body = req.body ?? {};
      const name = String(body.name || "Untitled Template").trim().slice(0, 64);
      const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "template";
      const slug = `${slugBase}-${crypto.randomBytes(3).toString("hex")}`;
      const user = serializeUserRow(req.dbUser!);

      const config =
        body.config && typeof body.config === "object"
          ? body.config
          : {
              backgroundEffect: user.backgroundEffect,
              pageBgColor: user.pageBgColor,
              profileBgColor: user.profileBgColor,
              profileBgOpacity: user.profileBgOpacity,
              profileBorderColor: user.profileBorderColor,
              profileBorderOpacity: user.profileBorderOpacity,
              profileBorderWidth: user.profileBorderWidth,
              profileBorderRadius: user.profileBorderRadius,
              profileCardBlur: user.profileCardBlur,
            };

      const [inserted] = await db
        .insert(templates)
        .values({
          slug,
          name,
          thumbnailUrl: body.thumbnailUrl ?? user.bannerImageUrl ?? "/showcase/rio/banner.png",
          tags: Array.isArray(body.tags) ? body.tags.map(String).slice(0, 8) : ["custom"],
          isPublic: body.isPublic !== false,
          requiresPremium: false,
          useCount: 1,
          favoriteCount: 0,
          creatorId: req.dbUser!.id,
          config,
        })
        .returning();

      return res.json({
        id: inserted.id,
        slug: inserted.slug,
        template: {
          ...inserted,
          createdAt: inserted.createdAt.toISOString(),
          favoritedByViewer: false,
          favorited: false,
          creatorUsername: user.username,
          creatorAvatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to create template");
    }
  });

  router.get("/templates/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const snapshot = await getBootstrapSnapshot(req.dbUser?.id ?? null);
      const tpl = snapshot.templates.find((t) => t.id === id);
      if (!tpl) return res.status(404).json({ error: "Template not found" });
      return res.json({ template: tpl });
    } catch (error) {
      return sendDbError(res, error, "Failed to load template");
    }
  });

  router.patch("/templates/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const body = req.body ?? {};
      const updates: Record<string, unknown> = {};
      if (typeof body.name === "string") updates.name = body.name.trim().slice(0, 64);
      if (Array.isArray(body.tags)) updates.tags = body.tags.map(String).slice(0, 8);
      if (typeof body.isPublic === "boolean") updates.isPublic = body.isPublic;

      const [updated] = await db
        .update(templates)
        .set(updates)
        .where(and(eq(templates.id, id), eq(templates.creatorId, req.dbUser!.id)))
        .returning();

      return res.json({ template: updated ?? null });
    } catch (error) {
      return sendDbError(res, error, "Failed to update template");
    }
  });

  router.delete("/templates/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(templates).where(and(eq(templates.id, id), eq(templates.creatorId, req.dbUser!.id)));
      return res.json({ ok: true });
    } catch (error) {
      return sendDbError(res, error, "Failed to delete template");
    }
  });

  router.post("/templates/:id/favorite", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const inserted = await db
        .insert(templateFavorites)
        .values({ templateId: id, userId: req.dbUser!.id })
        .onConflictDoNothing()
        .returning();
      if (inserted.length > 0) {
        await db.update(templates).set({ favoriteCount: sql`${templates.favoriteCount} + 1` }).where(eq(templates.id, id));
      }
      const [row] = await db.select({ favoriteCount: templates.favoriteCount }).from(templates).where(eq(templates.id, id)).limit(1);
      return res.json({ favorited: true, favoriteCount: row?.favoriteCount ?? 0 });
    } catch (error) {
      return sendDbError(res, error, "Failed to favorite template");
    }
  });

  router.delete("/templates/:id/favorite", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await db
        .delete(templateFavorites)
        .where(and(eq(templateFavorites.templateId, id), eq(templateFavorites.userId, req.dbUser!.id)))
        .returning();
      if (deleted.length > 0) {
        await db.update(templates).set({ favoriteCount: sql`GREATEST(0, ${templates.favoriteCount} - 1)` }).where(eq(templates.id, id));
      }
      const [row] = await db.select({ favoriteCount: templates.favoriteCount }).from(templates).where(eq(templates.id, id)).limit(1);
      return res.json({ favorited: false, favoriteCount: row?.favoriteCount ?? 0 });
    } catch (error) {
      return sendDbError(res, error, "Failed to unfavorite template");
    }
  });

  router.post("/templates/:id/apply", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const [tpl] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
      if (!tpl) return res.status(404).json({ error: "Template not found" });

      await db.update(templates).set({ useCount: sql`${templates.useCount} + 1` }).where(eq(templates.id, id));

      const rawCfg = (tpl.config ?? {}) as Record<string, unknown>;
      const stylePatch =
        rawCfg.style && typeof rawCfg.style === "object"
          ? (rawCfg.style as Record<string, unknown>)
          : rawCfg;

      await updateUserProfilePatch(req.dbUser!.id, stylePatch);
      if (Array.isArray(rawCfg.backgrounds) && rawCfg.backgrounds.length > 0) {
        await replaceUserBackgrounds(req.dbUser!.id, rawCfg.backgrounds.map(String));
      }
      return res.json({ ok: true });
    } catch (error) {
      return sendDbError(res, error, "Failed to apply template");
    }
  });

  // --- Cloudflare R2 Media Upload Flow (Presigned + Direct Multipart + Object Serving) ---
  router.post("/media/presign", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const filename = String(req.body?.filename || "upload.bin");
      const contentType = String(req.body?.contentType || "application/octet-stream");
      const sizeBytes = Number(req.body?.sizeBytes || 0);
      const category = (String(req.body?.category || "general") as MediaCategory);

      const check = validateMediaFile(contentType, sizeBytes);
      if (!check.ok) {
        return res.status(400).json({ error: check.error });
      }

      if (!isR2Configured()) {
        return res.json({
          mode: "multipart",
          uploadUrl: category === "image-host" ? "/api/image-host/upload" : "/api/upload",
          kind: check.kind,
        });
      }

      const presigned = await createPresignedUploadUrl({
        userId: req.dbUser!.id,
        category,
        filename,
        contentType,
        sizeBytes,
      });

      return res.json({
        mode: "r2",
        ...presigned,
        kind: check.kind,
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to generate upload URL");
    }
  });

  router.post("/media/confirm", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const storageKey = String(req.body?.storageKey || "");
      const url = String(req.body?.publicUrl || "");
      const originalName = String(req.body?.filename || "upload");
      const mimeType = String(req.body?.contentType || "image/png");
      const sizeBytes = Number(req.body?.sizeBytes || 0);
      const category = String(req.body?.category || "general");
      const check = validateMediaFile(mimeType, Math.max(1, sizeBytes));
      if (!check.ok) return res.status(400).json({ error: check.error });

      if (category === "image-host") {
        const publicName = `${crypto.randomBytes(4).toString("hex")}-${originalName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const [inserted] = await db
          .insert(imageHostFiles)
          .values({
            userId: req.dbUser!.id,
            storageKey,
            storageProvider: "r2",
            url,
            publicName,
            originalName,
            mimeType,
            sizeBytes,
            kind: check.kind,
          })
          .returning();

        return res.json({
          url: inserted.url,
          file: {
            id: inserted.id,
            url: inserted.url,
            name: inserted.publicName,
            size: inserted.sizeBytes,
            kind: inserted.kind,
            favorite: inserted.favorite,
            locked: inserted.locked,
            createdAt: inserted.createdAt.getTime(),
          },
        });
      }

      return res.json({ url, storageKey });
    } catch (error) {
      return sendDbError(res, error, "Failed to confirm media upload");
    }
  });

  async function persistUploadedBuffer(
    userId: number,
    category: MediaCategory,
    file: Express.Multer.File
  ): Promise<{ url: string; storageKey: string; provider: "r2" | "postgres"; kind: "image" | "video" | "audio" }> {
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    const extMime: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
      svg: "image/svg+xml",
      ico: "image/x-icon",
      cur: "image/x-icon",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
      aac: "audio/aac",
      flac: "audio/flac",
      mp4: "video/mp4",
      webm: "video/webm",
      mov: "video/quicktime",
    };
    const resolvedMime =
      file.mimetype && file.mimetype !== "application/octet-stream"
        ? file.mimetype
        : extMime[ext] || file.mimetype || "application/octet-stream";

    const check = validateMediaFile(resolvedMime, file.size);
    if (!check.ok) {
      throw new Error(check.error);
    }
    const storageKey = generateStorageKey(userId, category, file.originalname, resolvedMime);
    if (isR2Configured()) {
      try {
        const uploaded = await uploadBufferToR2({
          storageKey,
          buffer: file.buffer,
          contentType: resolvedMime,
        });
        return { url: uploaded.publicUrl, storageKey, provider: "r2", kind: check.kind };
      } catch (r2Error) {
        console.error(
          "R2 server upload failed, falling back to PostgreSQL media storage:",
          r2Error instanceof Error ? r2Error.message : String(r2Error)
        );
      }
    }
    const url = await saveMediaObjectFallback({
      storageKey,
      userId,
      mimeType: resolvedMime,
      sizeBytes: file.size,
      buffer: file.buffer,
    });
    return { url, storageKey, provider: "postgres", kind: check.kind };
  }

  router.post("/upload", requireAuth, upload.any(), async (req: AuthenticatedRequest, res) => {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const file = files[0];
      if (!file) return res.status(400).json({ error: "No file uploaded." });
      const category = (String(req.body?.category || req.body?.assetType || req.query.category || "general") as MediaCategory);
      const saved = await persistUploadedBuffer(req.dbUser!.id, category, file);
      return res.json({ url: saved.url, storageKey: saved.storageKey, kind: saved.kind });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      const isValidation = message.includes("Unsupported file type") || message.includes("File size");
      return res.status(isValidation ? 400 : 500).json({ error: message });
    }
  });

  router.get("/media/object/:key", async (req, res) => {
    try {
      const key = decodeURIComponent(String(req.params.key || ""));
      if (!key) return res.status(400).end();

      if (isR2Configured()) {
        const r2Obj = await getObjectFromR2(key);
        if (r2Obj) {
          res.setHeader("Content-Type", r2Obj.contentType);
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          return res.send(Buffer.from(r2Obj.body));
        }
      }

      const fallback = await loadMediaObjectFallback(key);
      if (!fallback) return res.status(404).json({ error: "Media not found" });

      res.setHeader("Content-Type", fallback.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(fallback.buffer);
    } catch (error) {
      return sendDbError(res, error, "Failed to serve media");
    }
  });

  // --- Image Host Endpoints ---
  router.post(
    "/image-host/upload",
    requireAuth,
    upload.any(),
    async (req: AuthenticatedRequest, res) => {
      try {
        const files = (req.files as Express.Multer.File[]) || [];
        const file = files[0];
        if (!file) return res.status(400).json({ error: "No file uploaded." });

        const saved = await persistUploadedBuffer(req.dbUser!.id, "image-host", file);
        const publicName = `${crypto.randomBytes(4).toString("hex")}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

        const [inserted] = await db
          .insert(imageHostFiles)
          .values({
            userId: req.dbUser!.id,
            storageKey: saved.storageKey,
            storageProvider: saved.provider,
            url: saved.url,
            publicName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            kind: saved.kind,
          })
          .returning();

        return res.json({
          url: inserted.url,
          file: {
            id: inserted.id,
            url: inserted.url,
            name: inserted.publicName,
            size: inserted.sizeBytes,
            kind: inserted.kind,
            favorite: inserted.favorite,
            locked: inserted.locked,
            createdAt: inserted.createdAt.getTime(),
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        return res.status(400).json({ error: message });
      }
    }
  );

  router.get("/image-host/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const files = await db
        .select()
        .from(imageHostFiles)
        .where(eq(imageHostFiles.userId, req.dbUser!.id))
        .orderBy(desc(imageHostFiles.createdAt));

      const storageUsedBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
      return res.json({
        totalUploads: files.length,
        storageUsedBytes,
        favorites: files.filter((f) => f.favorite).length,
        byKind: [
          { kind: "image", count: files.filter((f) => f.kind === "image").length },
          { kind: "video", count: files.filter((f) => f.kind === "video").length },
        ],
        recent: files.map((f) => ({ at: f.createdAt.getTime(), size: f.sizeBytes })),
      });
    } catch (error) {
      return sendDbError(res, error, "Failed to load storage stats");
    }
  });

  router.get("/image-host/activity", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Number(req.query.limit || 15);
      const offset = Number(req.query.offset || 0);
      const files = await db
        .select()
        .from(imageHostFiles)
        .where(eq(imageHostFiles.userId, req.dbUser!.id))
        .orderBy(desc(imageHostFiles.createdAt));

      const items = files.map((f) => ({
        action: "upload",
        kind: f.kind,
        name: f.publicName,
        size: f.sizeBytes,
        url: f.url,
        createdAt: f.createdAt.getTime(),
      }));
      return res.json({ items: items.slice(offset, offset + limit), total: items.length });
    } catch (error) {
      return sendDbError(res, error, "Failed to load activity");
    }
  });

  router.get("/image-host/files", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const limit = Number(req.query.limit || 24);
      const offset = Number(req.query.offset || 0);
      const filter = String(req.query.filter || "all");
      let rows = await db
        .select()
        .from(imageHostFiles)
        .where(eq(imageHostFiles.userId, req.dbUser!.id))
        .orderBy(desc(imageHostFiles.createdAt));

      if (filter === "image" || filter === "video") rows = rows.filter((f) => f.kind === filter);
      else if (filter === "favorite") rows = rows.filter((f) => f.favorite);

      const formatted = rows.map((f) => ({
        id: f.id,
        url: f.url,
        name: f.publicName,
        size: f.sizeBytes,
        kind: f.kind === "video" ? "video" : "image",
        favorite: f.favorite,
        locked: f.locked,
        createdAt: f.createdAt.getTime(),
      }));

      return res.json({ files: formatted.slice(offset, offset + limit), total: formatted.length });
    } catch (error) {
      return sendDbError(res, error, "Failed to load files");
    }
  });

  router.patch("/image-host/files", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
      const favorite = Boolean(req.body?.favorite);
      if (ids.length > 0) {
        await db
          .update(imageHostFiles)
          .set({ favorite })
          .where(and(eq(imageHostFiles.userId, req.dbUser!.id), inArray(imageHostFiles.id, ids)));
      }
      return res.json({ updatedIds: ids });
    } catch (error) {
      return sendDbError(res, error, "Failed to update files");
    }
  });

  router.delete("/image-host/files", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number) : [];
      if (ids.length > 0) {
        const targets = await db
          .select()
          .from(imageHostFiles)
          .where(and(eq(imageHostFiles.userId, req.dbUser!.id), inArray(imageHostFiles.id, ids)));

        for (const t of targets) {
          if (t.storageProvider === "r2") await deleteObjectFromR2(t.storageKey);
          else if (t.storageProvider === "postgres") await deleteMediaObjectFallback(t.storageKey);
        }

        await db
          .delete(imageHostFiles)
          .where(and(eq(imageHostFiles.userId, req.dbUser!.id), inArray(imageHostFiles.id, ids)));
      }

      const remaining = await db
        .select({ sizeBytes: imageHostFiles.sizeBytes })
        .from(imageHostFiles)
        .where(eq(imageHostFiles.userId, req.dbUser!.id));
      const usedBytes = remaining.reduce((acc, f) => acc + f.sizeBytes, 0);
      return res.json({ deletedIds: ids, usedBytes });
    } catch (error) {
      return sendDbError(res, error, "Failed to delete files");
    }
  });

  router.post("/image-host/files/:id/password", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const password = String(req.body?.password || "");
      const locked = Boolean(password);
      await db
        .update(imageHostFiles)
        .set({ locked, passwordHash: locked ? hashSecret(password) : null })
        .where(and(eq(imageHostFiles.id, id), eq(imageHostFiles.userId, req.dbUser!.id)));
      return res.json({ locked });
    } catch (error) {
      return sendDbError(res, error, "Failed to update file protection");
    }
  });

  router.post("/image-host/unlock", async (req, res) => {
    try {
      const name = String(req.body?.name || "");
      const password = String(req.body?.password || "");
      const [file] = await db
        .select()
        .from(imageHostFiles)
        .where(eq(imageHostFiles.publicName, name))
        .limit(1);
      if (!file) return res.status(404).json({ error: "File not found." });
      if (file.locked && file.passwordHash && file.passwordHash !== hashSecret(password)) {
        return res.status(403).json({ error: "Incorrect password." });
      }
      return res.json({ url: file.url });
    } catch (error) {
      return sendDbError(res, error, "Failed to unlock file");
    }
  });

  router.get("/image-host/download/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [file] = await db
        .select()
        .from(imageHostFiles)
        .where(eq(imageHostFiles.id, id))
        .limit(1);
      if (!file) return res.status(404).json({ error: "File not found" });
      return res.redirect(file.url);
    } catch (error) {
      return sendDbError(res, error, "Download failed");
    }
  });

  // --- Checkout Entitlements ---
  router.post(["/checkout/polar", "/checkout/order", "/checkout/verify"], requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const product = String(req.body?.product || "premium");
      const qty = Math.max(1, Number(req.body?.quantity || 1));
      const uid = req.dbUser!.id;

      if (product === "premium") {
        await db.update(users).set({ isPremium: true, updatedAt: new Date() }).where(eq(users.id, uid));
      } else if (product === "image-host") {
        await db.update(users).set({ hasImageHost: true, updatedAt: new Date() }).where(eq(users.id, uid));
      } else if (product === "verified") {
        await db.update(users).set({ hasVerified: true, updatedAt: new Date() }).where(eq(users.id, uid));
      } else if (product === "donator") {
        await db.update(users).set({ hasDonator: true, updatedAt: new Date() }).where(eq(users.id, uid));
      } else if (product === "badge-token") {
        await db.update(users).set({ badgeTokens: sql`${users.badgeTokens} + ${qty}` }).where(eq(users.id, uid));
      } else if (product === "alias-token") {
        await db.update(users).set({ aliasTokens: sql`${users.aliasTokens} + ${qty}` }).where(eq(users.id, uid));
      } else if (product === "domain-token") {
        await db.update(users).set({ domainTokens: sql`${users.domainTokens} + ${qty}` }).where(eq(users.id, uid));
      }

      if (req.path === "/checkout/polar") {
        return res.json({ url: "/dashboard" });
      }
      return res.json({
        orderId: `order_${Date.now()}`,
        amount: 100,
        currency: "USD",
        keyId: "prophile_checkout",
        ok: true,
      });
    } catch (error) {
      return sendDbError(res, error, "Checkout failed");
    }
  });

  // --- Music, Icons & Live Widget Proxies ---
  router.get("/music/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    const mapFallback = (t: (typeof SAMPLE_SEARCH_TRACKS)[number]) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: null,
      artwork: t.artworkUrl ?? null,
      duration: t.duration ?? null,
      streamUrl: t.audioUrl ?? null,
    });

    if (!q) {
      return res.json({
        ok: true,
        results: SAMPLE_SEARCH_TRACKS.map(mapFallback),
      });
    }

    try {
      const upstream = await fetch(
        `https://itunes.apple.com/search?media=music&entity=song&limit=8&term=${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (upstream.ok) {
        const json = (await upstream.json()) as {
          results?: Array<{
            trackId?: number;
            trackName?: string;
            artistName?: string;
            collectionName?: string;
            artworkUrl100?: string;
            trackTimeMillis?: number;
            previewUrl?: string;
          }>;
        };
        const mapped = (json.results ?? [])
          .filter((item) => item.trackName && item.artistName && item.previewUrl)
          .map((item) => ({
            id: `itunes-${item.trackId ?? Date.now()}`,
            title: item.trackName || "Untitled",
            artist: item.artistName || "Unknown artist",
            album: item.collectionName ?? null,
            artwork: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "600x600bb") : null,
            duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 30,
            streamUrl: item.previewUrl ?? null,
          }));
        if (mapped.length > 0) {
          return res.json({ ok: true, results: mapped });
        }
      }
    } catch {
      // Fall back to built-in catalog below
    }

    const qLower = q.toLowerCase();
    const filtered = SAMPLE_SEARCH_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(qLower) || t.artist.toLowerCase().includes(qLower)
    );
    const list = filtered.length > 0 ? filtered : SAMPLE_SEARCH_TRACKS;
    return res.json({
      ok: true,
      results: list.map(mapFallback),
    });
  });

  router.get("/music/lyrics", async (req, res) => {
    const title = String(req.query.title || "").trim();
    const artist = String(req.query.artist || "").trim();
    const duration = Number(req.query.duration || 0);

    const parseSynced = (lrcText: string) => {
      const parsed: Array<{ text: string; start: number }> = [];
      for (const raw of lrcText.split(/\r?\n/)) {
        const m = raw.match(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)/);
        if (!m || !m[4]?.trim()) continue;
        let ms = (parseInt(m[1], 10) * 60 + parseInt(m[2], 10)) * 1000;
        const frac = m[3] ?? "";
        if (frac.length === 3) ms += parseInt(frac, 10);
        else if (frac.length === 2) ms += parseInt(frac, 10) * 10;
        else if (frac.length === 1) ms += parseInt(frac, 10) * 100;
        parsed.push({ text: m[4].trim().slice(0, 300), start: ms });
      }
      parsed.sort((a, b) => a.start - b.start);
      return parsed.slice(0, 300).map((l, i) => ({
        text: l.text,
        start: l.start,
        end: parsed[i + 1]?.start ?? l.start + 4000,
      }));
    };

    if (title && artist) {
      try {
        const qs = new URLSearchParams({
          track_name: title,
          artist_name: artist,
          ...(duration > 0 ? { duration: String(Math.round(duration)) } : {}),
        });
        const upstream = await fetch(`https://lrclib.net/api/get?${qs.toString()}`, {
          signal: AbortSignal.timeout(4500),
          headers: { "User-Agent": "prophile/1.0" },
        });
        if (upstream.ok) {
          const data = (await upstream.json()) as {
            syncedLyrics?: string | null;
            plainLyrics?: string | null;
          };
          if (data.syncedLyrics) {
            const lines = parseSynced(data.syncedLyrics);
            if (lines.length > 0) return res.json({ ok: true, lines });
          }
          if (data.plainLyrics) {
            const plainLines = data.plainLyrics
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 120);
            if (plainLines.length > 0) {
              const step = Math.max(2000, Math.round(((duration > 10 ? duration : plainLines.length * 3.5) * 1000) / plainLines.length));
              return res.json({
                ok: true,
                lines: plainLines.map((text, idx) => ({
                  text,
                  start: idx * step,
                  end: (idx + 1) * step,
                })),
              });
            }
          }
        }
      } catch {
        // Gracefully return empty lines when external lyrics API is unavailable
      }
    }

    return res.json({ ok: true, lines: [] });
  });

  router.get("/icons/search", async (req, res) => {
    const query = String(req.query.query || "").trim();
    if (!query) {
      return res.json({
        icons: CURATED_ICONS.map((name) => ({
          name,
          url: `https://api.iconify.design/${name}.svg`,
          color: "#ffffff",
        })),
      });
    }
    try {
      const r = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`);
      if (r.ok) {
        const data = (await r.json()) as { icons?: string[] };
        if (Array.isArray(data.icons)) {
          return res.json({
            icons: data.icons.map((name) => ({
              name,
              url: `https://api.iconify.design/${name}.svg`,
              color: "#ffffff",
            })),
          });
        }
      }
    } catch {
      // fallback below
    }
    return res.json({
      icons: CURATED_ICONS.map((name) => ({
        name,
        url: `https://api.iconify.design/${name}.svg`,
        color: "#ffffff",
      })),
    });
  });

  router.get("/icons/batch", (req, res) => {
    const rawIcons = String(req.query.icons || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const icons: Record<string, { url: string; color: string }> = {};
    for (const name of rawIcons) {
      icons[name] = { url: `https://api.iconify.design/${name}.svg`, color: "#ffffff" };
    }
    return res.json({ icons });
  });

  // Live GitHub widget proxy
  router.get("/widgets/github/user/:username", async (req, res) => {
    const username = req.params.username;
    try {
      const ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
      if (ghRes.ok) {
        const gh = (await ghRes.json()) as Record<string, unknown>;
        return res.json({
          login: gh.login,
          name: gh.name || gh.login,
          avatar_url: gh.avatar_url,
          followers: gh.followers ?? 0,
          following: gh.following ?? 0,
          public_repos: gh.public_repos ?? 0,
          html_url: gh.html_url || `https://github.com/${username}`,
        });
      }
    } catch {
      // fallback below
    }
    return res.json({
      login: username,
      name: username,
      avatar_url: "/showcase/saraansx.jpg",
      followers: 428,
      following: 34,
      public_repos: 29,
      html_url: `https://github.com/${username}`,
    });
  });

  router.get("/widgets/github/repo/:owner/:repo", async (req, res) => {
    const { owner, repo } = req.params;
    try {
      const ghRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
      );
      if (ghRes.ok) {
        const gh = (await ghRes.json()) as Record<string, unknown>;
        const ghOwner = gh.owner as Record<string, unknown> | undefined;
        return res.json({
          full_name: gh.full_name,
          owner: { avatar_url: ghOwner?.avatar_url || "/showcase/saraansx.jpg" },
          stargazers_count: gh.stargazers_count ?? 0,
          forks_count: gh.forks_count ?? 0,
          subscribers_count: gh.subscribers_count ?? 0,
          open_issues_count: gh.open_issues_count ?? 0,
          language: gh.language || "TypeScript",
          html_url: gh.html_url || `https://github.com/${owner}/${repo}`,
        });
      }
    } catch {
      // fallback below
    }
    return res.json({
      full_name: `${owner}/${repo}`,
      owner: { avatar_url: "/showcase/saraansx.jpg" },
      stargazers_count: 1420,
      forks_count: 185,
      subscribers_count: 64,
      open_issues_count: 3,
      language: "TypeScript",
      html_url: `https://github.com/${owner}/${repo}`,
    });
  });

  router.get("/widgets/github/avatar/:username", (req, res) => {
    return res.redirect(`https://github.com/${encodeURIComponent(req.params.username)}.png`);
  });

  router.get("/widgets/:platform/image", (req, res) => {
    const target = String(req.query.url || "");
    if (target.startsWith("https://") || target.startsWith("http://") || target.startsWith("/")) {
      return res.redirect(target);
    }
    return res.status(400).end();
  });

  router.get("/widgets/discord/user/:userId", (req, res) => {
    return res.json({
      id: req.params.userId,
      username: "rio",
      global_name: "Rio",
      avatar: null,
      avatarUrl: "/showcase/rio/avatar.png",
      status: "online",
      custom_status: { text: "building prophile", emoji_name: "⚡" },
      activities: [
        {
          name: "Visual Studio Code",
          type: 0,
          details: "Editing prophile",
          state: "Workspace: prophile",
          large_image_url: "/showcase/chanel.webp",
        },
      ],
      badges: ["staff", "partner", "hypesquad_brilliance", "early_supporter", "nitro"],
    });
  });

  router.get("/widgets/discord/invite/:code", (req, res) => {
    const code = req.params.code;
    return res.json({
      code,
      guild: {
        id: "128940192840192",
        name: `${code.toUpperCase()} Community`,
        icon: null,
        banner: "/showcase/rio/banner.png",
        splash: null,
      },
      approximate_member_count: 14820,
      approximate_presence_count: 3490,
    });
  });

  router.get("/widgets/spotify/item/:type/:id", (req, res) => {
    const { type, id } = req.params;
    return res.json({
      id,
      type,
      name: "Chanel",
      subtitle: "Tyla",
      imageUrl: "/showcase/chanel.webp",
      url: `https://open.spotify.com/${type}/${id}`,
      releaseYear: "2024",
      durationMs: 185000,
      explicit: false,
    });
  });

  router.get("/widgets/apple-music/item/*", (_req, res) => {
    return res.json({
      name: "Soft Spot",
      subtitle: "keshi",
      imageUrl: "/soft-spot-cover.jpg",
      url: "https://music.apple.com",
      releaseYear: "2024",
      kind: "song",
    });
  });

  router.get("/widgets/soundcloud/*", (req, res) => {
    const handle = String((req.params as Record<string, string>)[0] || "artist").split("/").pop() || "artist";
    return res.json({
      kind: "user",
      username: handle,
      displayName: handle,
      avatarUrl: "/showcase/chanel.webp",
      bannerUrl: "/showcase/rio/banner.png",
      followers: 18400,
      tracksCount: 42,
      verified: true,
      url: `https://soundcloud.com/${handle}`,
    });
  });

  router.get("/widgets/youtube/channel/:handle", (req, res) => {
    const handle = req.params.handle;
    return res.json({
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      title: handle.replace(/^@/, ""),
      avatarUrl: "/showcase/rio/avatar.png",
      bannerUrl: "/showcase/rio/banner.png",
      subscriberCount: 142000,
      videoCount: 86,
      viewCount: 9420000,
      url: `https://youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`,
      latestVideo: {
        id: "dQw4w9WgXcQ",
        title: "Designing Next-Gen Shaders & Interactive Profiles",
        thumbnailUrl: "/showcase/rio/banner.png",
        publishedAt: "2 days ago",
        viewCount: 48200,
      },
    });
  });

  router.get("/widgets/twitch/channel/:login", (req, res) => {
    const login = req.params.login;
    return res.json({
      login,
      displayName: login,
      description: "Streaming creative coding & late-night vibes.",
      profileImageUrl: "/showcase/rex/avatar.png",
      OfflineImageUrl: "/showcase/rio/banner.png",
      followers: 28900,
      isLive: true,
      stream: {
        title: "Late Night Ranked + Shader Experiments",
        gameName: "VALORANT",
        viewerCount: 412,
        thumbnailUrl: "/showcase/rio/banner.png",
      },
    });
  });

  router.get("/widgets/tiktok/user/:username", (req, res) => {
    const username = req.params.username;
    return res.json({
      username,
      nickname: username,
      avatarUrl: "/showcase/saraansx.jpg",
      followers: 94500,
      following: 120,
      hearts: 2400000,
      videos: 64,
      verified: true,
      signature: "digital creator • prophile",
      url: `https://www.tiktok.com/@${username}`,
    });
  });

  router.get("/widgets/instagram/user/:username", (req, res) => {
    const username = req.params.username;
    return res.json({
      username,
      fullName: username,
      avatarUrl: "/showcase/mia.jpg",
      followers: 62300,
      following: 310,
      posts: 48,
      isVerified: true,
      biography: "visuals & motion",
      url: `https://www.instagram.com/${username}/`,
    });
  });

  router.get("/widgets/telegram/user/:username", (req, res) => {
    const username = req.params.username;
    return res.json({
      username,
      title: username,
      description: "Updates, resources & announcements.",
      avatarUrl: "/showcase/rio/avatar.png",
      membersCount: 12450,
      onlineCount: 840,
      kind: "channel",
      url: `https://t.me/${username}`,
    });
  });

  router.get("/widgets/pinterest/user/:username", (req, res) => {
    const username = req.params.username;
    return res.json({
      username,
      name: username,
      avatar_url: "/showcase/ohjoy.jpg",
      pin_count: 642,
      first_pin_image: "/showcase/rio/banner.png",
      url: `https://www.pinterest.com/${username}/`,
    });
  });

  router.get("/widgets/pinterest/board/:username/:board", (req, res) => {
    const { username, board } = req.params;
    return res.json({
      username,
      board_slug: board,
      name: board.replace(/-/g, " "),
      owner_name: username,
      owner_username: username,
      owner_image: "/showcase/ohjoy.jpg",
      pin_count: 128,
      cover_image: "/showcase/rio/banner.png",
      first_pin_image: "/showcase/rio/banner.png",
      url: `https://www.pinterest.com/${username}/${board}/`,
    });
  });

  router.get("/widgets/steam/user/:id", (req, res) => {
    const id = req.params.id;
    return res.json({
      personaname: id,
      profileurl: `https://steamcommunity.com/id/${id}`,
      avatarfull: "/showcase/rio/avatar.png",
      profile_background: "/showcase/rio/banner.png",
      level: 88,
      game_count: 214,
      member_since: "October 14, 2018",
    });
  });

  router.get("/widgets/roblox/user/:username", (req, res) => {
    const username = req.params.username;
    return res.json({
      id: 1948201,
      username,
      displayName: username,
      avatarUrl: "/showcase/rex/avatar.png",
      friendsCount: 184,
      followersCount: 12900,
      followingCount: 45,
      created: "2019-04-12T00:00:00Z",
      isVerified: true,
    });
  });

  router.get("/widgets/valorant/player/:name/:tag", (req, res) => {
    const { name, tag } = req.params;
    return res.json({
      name: name || "Rio",
      tag: tag || "NA1",
      account_level: 245,
      card_id: "9fb348bc-41a0-91ad-8a3e-818035c4e561",
      current_rank: { tier: 24, tier_name: "Immortal 1", rr: 68 },
      highest_rank: { tier: 27, tier_name: "Radiant" },
      last_matches: {
        any: { agent: "Jett", map: "Ascent" },
        competitive: { agent: "Jett", map: "Ascent" },
      },
    });
  });

  router.get("/widgets/genshin/user/:uid", (req, res) => {
    return res.json({
      uid: req.params.uid,
      nickname: "Traveler",
      level: 60,
      world_level: 8,
      signature: "Ad Astra Abyssosque",
      achievements: 1180,
      spiral_abyss: "12-3",
      avatar_url: "/showcase/saraansx.jpg",
      namecard_url: "/showcase/rio/banner.png",
    });
  });

  router.get("/widgets/weather/current/:location", (req, res) => {
    return res.json({
      location: req.params.location || "Tokyo",
      country: "JP",
      temp_c: 19,
      temp_f: 66,
      condition: "Clear sky",
      code: 0,
      is_day: false,
      humidity: 58,
      wind_kph: 11,
    });
  });

  return router;
}
