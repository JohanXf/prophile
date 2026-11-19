import { getStore } from "@/lib/local-store";
import { sanitizeTemplateConfig, templateRequiresPremium } from "@/lib/template-config";

export type PublicTemplate = {
  id: number;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  useCount: number;
  createdAt: string;
  creatorId: number | null;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  favoriteCount: number;
  requiresPremium: boolean;
};

export async function getPublicTemplateBySlug(slug: string): Promise<PublicTemplate | null> {
  const state = getStore();
  const clean = slug?.trim().toLowerCase();
  const found = state.templates.find((t) => t.slug.toLowerCase() === clean);
  if (!found) return null;
  return {
    id: found.id,
    slug: found.slug,
    name: found.name,
    thumbnailUrl: found.thumbnailUrl,
    useCount: found.useCount,
    createdAt: found.createdAt,
    creatorId: found.creatorId,
    creatorUsername: found.creatorUsername,
    creatorAvatarUrl: found.creatorAvatarUrl,
    favoriteCount: found.favoriteCount,
    requiresPremium: templateRequiresPremium(sanitizeTemplateConfig(found.config)),
  };
}

export type TemplatePreviewConfig = {
  id: number;
  slug: string;
  name: string;
  isPublic: boolean;
  config: Record<string, unknown>;
};

export async function getTemplateForPreview(id: number, _viewerId?: number): Promise<TemplatePreviewConfig | null> {
  const state = getStore();
  const found = state.templates.find((t) => t.id === id) ?? state.templates[0];
  if (!found) return null;
  return {
    id: found.id,
    slug: found.slug,
    name: found.name,
    isPublic: found.isPublic,
    config: sanitizeTemplateConfig(found.config) as Record<string, unknown>,
  };
}

export async function getViewerFavorite(templateId: number): Promise<{ favorited: boolean }> {
  const state = getStore();
  const found = state.templates.find((t) => t.id === templateId);
  return { favorited: !!found?.favoritedByViewer };
}