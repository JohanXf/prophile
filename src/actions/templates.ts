import { getStore, saveStore } from "@/lib/local-store";
import { sanitizeTemplateConfig, templateRequiresPremium } from "@/lib/template-config";

export type TemplateListItem = {
  id: number;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  isPublic: boolean;
  useCount: number;
  favoriteCount: number;
  favoritedByViewer: boolean;
  createdAt: string;
  creatorId: number | null;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  isOwner: boolean;
  requiresPremium: boolean;
};

export async function createTemplate(input: {
  name: string;
  thumbnailUrl?: string | null;
  config?: Record<string, unknown> | null;
  isPublic?: boolean;
}) {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid] ?? state.users[1];
  const slug =
    input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);
  const tpl = {
    id: Date.now(),
    slug,
    name: input.name.trim(),
    thumbnailUrl: input.thumbnailUrl ?? user.bannerImageUrl ?? "/showcase/rio/banner.png",
    isPublic: input.isPublic ?? true,
    useCount: 1,
    favoriteCount: 0,
    favoritedByViewer: false,
    createdAt: new Date().toISOString(),
    creatorId: uid,
    creatorUsername: user.username,
    creatorAvatarUrl: user.avatarUrl,
    config: (input.config ?? {
      backgroundEffect: user.backgroundEffect,
      pageBgColor: user.pageBgColor,
      profileBgColor: user.profileBgColor,
      profileBgOpacity: user.profileBgOpacity,
      profileBorderColor: user.profileBorderColor,
      profileBorderOpacity: user.profileBorderOpacity,
      profileBorderWidth: user.profileBorderWidth,
      profileBorderRadius: user.profileBorderRadius,
      profileCardBlur: user.profileCardBlur,
    }) as Record<string, unknown>,
  };
  state.templates.unshift(tpl);
  saveStore(state);
  return { id: tpl.id, slug: tpl.slug };
}

export async function deleteTemplate(id: number) {
  const state = getStore();
  state.templates = state.templates.filter((t) => t.id !== id);
  saveStore(state);
  return { ok: true };
}

export async function setTemplateVisibility(id: number, isPublic: boolean) {
  const state = getStore();
  const found = state.templates.find((t) => t.id === id);
  if (found) {
    found.isPublic = isPublic;
    saveStore(state);
  }
  return { ok: true };
}

export async function applyTemplate(id: number) {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid];
  const found = state.templates.find((t) => t.id === id);
  if (user && found) {
    found.useCount += 1;
    Object.assign(user, found.config);
    saveStore(state);
  }
  return { ok: true };
}

export async function listTemplates(opts?: {
  q?: string;
  sort?: "newest" | "popular";
  page?: number;
  limit?: number;
  tab?: "public" | "favorites" | "mine";
}): Promise<{
  items: TemplateListItem[];
  total: number;
  page: number;
  limit: number;
}> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const q = (opts?.q ?? "").toLowerCase().trim();
  const tab = opts?.tab ?? "public";

  let list = state.templates.filter((t) => {
    if (tab === "favorites") return t.favoritedByViewer;
    if (tab === "mine") return t.creatorId === uid;
    return t.isPublic;
  });

  if (q) {
    list = list.filter(
      (t) => t.name.toLowerCase().includes(q) || t.creatorUsername.toLowerCase().includes(q)
    );
  }

  if (opts?.sort === "popular") {
    list = [...list].sort((a, b) => b.useCount - a.useCount);
  }

  const items: TemplateListItem[] = list.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    thumbnailUrl: t.thumbnailUrl,
    isPublic: t.isPublic,
    useCount: t.useCount,
    favoriteCount: t.favoriteCount,
    favoritedByViewer: t.favoritedByViewer,
    createdAt: t.createdAt,
    creatorId: t.creatorId,
    creatorUsername: t.creatorUsername,
    creatorAvatarUrl: t.creatorAvatarUrl,
    isOwner: t.creatorId === uid,
    requiresPremium: templateRequiresPremium(sanitizeTemplateConfig(t.config)),
  }));

  return {
    items,
    total: items.length,
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 18,
  };
}
