import { authFetch } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";
import type { CustomBadge } from "@/components/profile/layouts/ProfileBadges";

export type MyBadges = {
  owned: string[];
  equipped: string[];
  custom: CustomBadge[];
  tokens: number;
};

export async function getMyBadges(): Promise<MyBadges> {
  const res = await authFetch("/api/badges");
  if (!res.ok) {
    return { owned: [], equipped: [], custom: [], tokens: 0 };
  }
  return (await res.json()) as MyBadges;
}

export async function createCustomBadge(input: { name: string; iconUrl: string }): Promise<MyBadges> {
  const res = await authFetch("/api/badges/custom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  await hydrateStoreFromServer();
  if (!res.ok) return getMyBadges();
  return (await res.json()) as MyBadges;
}

export async function resetCustomBadges(): Promise<MyBadges> {
  const res = await authFetch("/api/badges/custom/reset", { method: "POST" });
  await hydrateStoreFromServer();
  if (!res.ok) return getMyBadges();
  return (await res.json()) as MyBadges;
}

export async function deleteCustomBadge(badgeId: string): Promise<MyBadges> {
  const res = await authFetch(`/api/badges/custom/${encodeURIComponent(badgeId)}`, {
    method: "DELETE",
  });
  await hydrateStoreFromServer();
  if (!res.ok) return getMyBadges();
  return (await res.json()) as MyBadges;
}

export async function saveEquippedBadges(ids: string[]): Promise<MyBadges> {
  const res = await authFetch("/api/badges/equipped", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  await hydrateStoreFromServer();
  if (!res.ok) return getMyBadges();
  return (await res.json()) as MyBadges;
}

export async function syncDiscordBadges(): Promise<
  (MyBadges & { added: string[]; removed: string[] }) | { error: string }
> {
  const badges = await getMyBadges();
  return {
    ...badges,
    added: [],
    removed: [],
  };
}
