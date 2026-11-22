import { authFetch } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";

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
  const res = await authFetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: number; slug?: string; error?: string };
  if (!res.ok) throw new Error(body.error || "Failed to create template.");
  await hydrateStoreFromServer();
  return { id: body.id!, slug: body.slug! };
}

export async function deleteTemplate(id: number) {
  await authFetch(`/api/templates/${id}`, { method: "DELETE" });
  await hydrateStoreFromServer();
  return { ok: true };
}

export async function setTemplateVisibility(id: number, isPublic: boolean) {
  await authFetch(`/api/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isPublic }),
  });
  await hydrateStoreFromServer();
  return { ok: true };
}

export async function applyTemplate(id: number) {
  await authFetch(`/api/templates/${id}/apply`, { method: "POST" });
  await hydrateStoreFromServer();
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
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.tab) params.set("tab", opts.tab === "public" ? "discover" : opts.tab);
  const res = await authFetch(`/api/templates?${params.toString()}`);
  if (!res.ok) {
    return { items: [], total: 0, page: opts?.page ?? 1, limit: opts?.limit ?? 18 };
  }
  const data = (await res.json()) as { items?: TemplateListItem[]; total?: number };
  const items = data.items ?? [];
  return {
    items,
    total: data.total ?? items.length,
    page: opts?.page ?? 1,
    limit: opts?.limit ?? 18,
  };
}
