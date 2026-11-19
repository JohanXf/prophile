import { getStore, saveStore } from "@/lib/local-store";
import type { CustomBadge } from "@/components/profile/layouts/ProfileBadges";

export type MyBadges = {
  owned: string[];
  equipped: string[];
  custom: CustomBadge[];
  tokens: number;
};

export async function getMyBadges(): Promise<MyBadges> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid];
  const custom = state.customBadges[uid] ?? [];
  const baseOwned = state.ownedBadges[uid] ?? ["early", "premium", "verified", "donator", "image-host"];
  const owned = Array.from(new Set([...baseOwned, ...custom.map((c) => c.id)]));
  const equipped = state.equippedBadges[uid] ?? ["early", "premium"];
  return {
    owned,
    equipped,
    custom,
    tokens: user?.badgeTokens ?? 3,
  };
}

export async function createCustomBadge(input: { name: string; iconUrl: string }): Promise<MyBadges> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const id = `custom-${Math.random().toString(16).slice(2, 10)}`;
  const custom = state.customBadges[uid] ?? [];
  custom.push({
    id,
    name: input.name.trim() || "Custom",
    iconUrl: input.iconUrl || "/Favicon.png",
  });
  state.customBadges[uid] = custom;
  const equipped = state.equippedBadges[uid] ?? [];
  if (!equipped.includes(id)) {
    state.equippedBadges[uid] = [...equipped, id];
  }
  saveStore(state);
  return getMyBadges();
}

export async function resetCustomBadges(): Promise<MyBadges> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.customBadges[uid] = [];
  state.equippedBadges[uid] = (state.equippedBadges[uid] ?? []).filter((b) => !b.startsWith("custom-"));
  saveStore(state);
  return getMyBadges();
}

export async function deleteCustomBadge(badgeId: string): Promise<MyBadges> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.customBadges[uid] = (state.customBadges[uid] ?? []).filter((b) => b.id !== badgeId);
  state.equippedBadges[uid] = (state.equippedBadges[uid] ?? []).filter((b) => b !== badgeId);
  saveStore(state);
  return getMyBadges();
}

export async function saveEquippedBadges(ids: string[]): Promise<MyBadges> {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.equippedBadges[uid] = ids;
  saveStore(state);
  return getMyBadges();
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
