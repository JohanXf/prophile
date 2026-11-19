import { getStore } from "@/lib/local-store";
import { getSessionUserId } from "@/lib/auth/session";

export async function hasImageHostAccess(userId: number): Promise<boolean> {
  const user = getStore().users[userId];
  return Boolean(user?.hasImageHost ?? true);
}

export type ImageHostUser =
  | { ok: true; userId: number }
  | { ok: false; status: 401 | 403; error: string };

export async function requireImageHostUser(): Promise<ImageHostUser> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, status: 401, error: "Unauthorized" };
  if (!(await hasImageHostAccess(userId))) {
    return { ok: false, status: 403, error: "Image Host isn't unlocked on your account." };
  }
  return { ok: true, userId };
}
