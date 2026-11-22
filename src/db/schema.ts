import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").unique(),
  username: text("username").notNull().unique(),
  needsUsername: boolean("needs_username").notNull().default(false),
  email: text("email"),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("user"),
  emailVerified: boolean("email_verified").notNull().default(true),
  isPremium: boolean("is_premium").notNull().default(false),
  hasImageHost: boolean("has_image_host").notNull().default(false),
  hasVerified: boolean("has_verified").notNull().default(false),
  hasDonator: boolean("has_donator").notNull().default(false),
  badgeTokens: integer("badge_tokens").notNull().default(1),
  aliasTokens: integer("alias_tokens").notNull().default(1),
  domainTokens: integer("domain_tokens").notNull().default(1),
  usernameLoginEnabled: boolean("username_login_enabled").notNull().default(true),
  discordId: text("discord_id"),
  discordUsername: text("discord_username"),
  views: integer("views").notNull().default(0),
  likesCount: integer("likes_count").notNull().default(0),
  dislikesCount: integer("dislikes_count").notNull().default(0),
  displayName: text("display_name"),
  location: text("location"),
  timezone: text("timezone"),
  occupation: text("occupation"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerImageUrl: text("banner_image_url"),
  profileSettings: jsonb("profile_settings")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  passwordChangedAt: timestamp("password_changed_at"),
  twoFactorEnabledAt: timestamp("two_factor_enabled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userBackgrounds = pgTable("user_backgrounds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    owned: boolean("owned").notNull().default(true),
    equipped: boolean("equipped").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_badges_user_badge_idx").on(table.userId, table.badgeId)]
);

export const customBadges = pgTable("custom_badges", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  iconUrl: text("icon_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aliases = pgTable("aliases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  alias: text("alias").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const domains = pgTable("domains", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hostname: text("hostname").notNull().unique(),
  type: text("type").notNull().default("profile"),
  visibility: text("visibility").notNull().default("private"),
  status: text("status").notNull().default("active"),
  dcvTarget: text("dcv_target"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  isPublic: boolean("is_public").notNull().default(true),
  requiresPremium: boolean("requires_premium").notNull().default(false),
  useCount: integer("use_count").notNull().default(0),
  favoriteCount: integer("favorite_count").notNull().default(0),
  creatorId: integer("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const templateFavorites = pgTable(
  "template_favorites",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("template_favorites_tpl_user_idx").on(table.templateId, table.userId)]
);

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  likesCount: integer("likes_count").notNull().default(0),
  replyToId: integer("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: serial("id").primaryKey(),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("comment_likes_comment_user_idx").on(table.commentId, table.userId)]
);

export const profileFeedback = pgTable(
  "profile_feedback",
  {
    id: serial("id").primaryKey(),
    receiverId: integer("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    giverId: integer("giver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "like" | "dislike"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("profile_feedback_receiver_giver_idx").on(table.receiverId, table.giverId)]
);

export const imageHostFiles = pgTable("image_host_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  storageProvider: text("storage_provider").notNull().default("r2"),
  url: text("url").notNull(),
  publicName: text("public_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  kind: text("kind").notNull().default("image"), // "image" | "video" | "audio"
  favorite: boolean("favorite").notNull().default(false),
  locked: boolean("locked").notNull().default(false),
  passwordHash: text("password_hash"),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaObjects = pgTable("media_objects", {
  storageKey: text("storage_key").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  backgrounds: many(userBackgrounds),
  badges: many(userBadges),
  customBadges: many(customBadges),
  aliases: many(aliases),
  domains: many(domains),
  templates: many(templates),
  imageHostFiles: many(imageHostFiles),
}));

export const userBackgroundsRelations = relations(userBackgrounds, ({ one }) => ({
  user: one(users, { fields: [userBackgrounds.userId], references: [users.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
}));

export const customBadgesRelations = relations(customBadges, ({ one }) => ({
  user: one(users, { fields: [customBadges.userId], references: [users.id] }),
}));

export const aliasesRelations = relations(aliases, ({ one }) => ({
  user: one(users, { fields: [aliases.userId], references: [users.id] }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  user: one(users, { fields: [domains.userId], references: [users.id] }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  creator: one(users, { fields: [templates.creatorId], references: [users.id] }),
}));

export const imageHostFilesRelations = relations(imageHostFiles, ({ one }) => ({
  user: one(users, { fields: [imageHostFiles.userId], references: [users.id] }),
}));
