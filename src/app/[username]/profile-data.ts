import { getStore, hydrateFullUser } from "@/lib/local-store";
import type { FullUser } from "@/lib/features/users/db";

export const profileCacheTag = (username: string) => `profile:${username.toLowerCase().trim()}`;

export function revalidateProfile(_username: string) {}

export function getProfileRowsSync(username: string): FullUser[] {
  const key = username.toLowerCase().trim();
  const found = Object.values(getStore().users).find((u) => u.username.toLowerCase() === key);
  const full = hydrateFullUser(found);
  return full ? [full] : [];
}

export async function getProfileRows(username: string): Promise<FullUser[]> {
  return getProfileRowsSync(username);
}
