import { authFetch } from "@/lib/auth-client";
import {
  applyUpdatedBackgroundsToStore,
  applyUpdatedUserToStore,
  getStore,
  hydrateStoreFromServer,
  type StoredUserBase,
} from "@/lib/local-store";
import { auth, syncPublicProfileToFirestore } from "@/lib/firebase";
import type { ProfileLink } from "@/lib/links";
import type { MusicTrack } from "@/lib/music";
import type { WidgetConfig } from "@/lib/widget-types";

function mirrorUserToFirestore(user: StoredUserBase, backgrounds?: string[]) {
  if (!auth.currentUser || !auth.currentUser.emailVerified) return;
  const state = getStore();
  const bgs = backgrounds ?? state.backgrounds[user.id] ?? [];
  const badges = state.equippedBadges[user.id] ?? [];
  void syncPublicProfileToFirestore({
    uid: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerImageUrl || bgs[0] || null,
    location: user.location,
    occupation: user.occupation,
    badges,
  }).catch(() => {
    // Non-blocking background mirror
  });
}

async function patchProfile(patch: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authFetch("/api/profile/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { user?: StoredUserBase; error?: string })
      : {};

    if (!res.ok) {
      const state = getStore();
      const currentUser = state.currentUserId != null ? state.users[state.currentUserId] : null;
      if (res.status === 404 && currentUser) {
        const merged = {
          ...currentUser,
          ...patch,
          updatedAt: new Date(),
        } as StoredUserBase;
        applyUpdatedUserToStore(merged);
        mirrorUserToFirestore(merged);
        return { success: true };
      }
      return {
        success: false,
        error: body.error || `Failed to save profile changes (HTTP ${res.status}).`,
      };
    }

    if (body.user) {
      applyUpdatedUserToStore(body.user);
      mirrorUserToFirestore(body.user);
    } else {
      void hydrateStoreFromServer(true);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save profile changes.",
    };
  }
}

export async function updateGeneralProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateBackgrounds(urls: string[]) {
  try {
    const res = await authFetch("/api/profile/backgrounds", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? ((await res.json().catch(() => ({}))) as { backgrounds?: string[]; error?: string })
      : {};

    const state = getStore();
    const uid = state.currentUserId;
    const currentUser = uid != null ? state.users[uid] : null;

    if (!res.ok) {
      if (res.status === 404 && uid != null && currentUser) {
        applyUpdatedBackgroundsToStore(uid, urls);
        mirrorUserToFirestore(currentUser, urls);
        return { success: true };
      }
      return {
        success: false,
        error: body.error || `Failed to update backgrounds (HTTP ${res.status}).`,
      };
    }

    const saved = Array.isArray(body.backgrounds) ? body.backgrounds : urls;
    if (uid != null) {
      applyUpdatedBackgroundsToStore(uid, saved);
      if (currentUser) mirrorUserToFirestore(currentUser, saved);
    } else {
      void hydrateStoreFromServer(true);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update backgrounds.",
    };
  }
}

export async function updateAppearanceProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateColorsProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateLayoutProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateMetadataProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateEffectsProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateProfileWidgets(data: { widgets?: WidgetConfig[] } & Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateMusicProfile(
  data: {
    tracks?: MusicTrack[];
    style?: string;
    playerStyle?: string;
    autoPlay?: boolean;
    artBg?: boolean;
    volumeControl?: boolean;
    defaultVolume?: number;
    shuffle?: boolean;
    cardColor?: string | null;
    cardOpacity?: number;
  } & Record<string, unknown>
): Promise<{
  success: boolean;
  error?: string;
  tracks: MusicTrack[];
  artBg?: boolean;
  volumeControl?: boolean;
  defaultVolume?: number;
  shuffle?: boolean;
  cardColor?: string | null;
  cardOpacity?: number;
}> {
  const patch: Record<string, unknown> = { ...data };
  if (Array.isArray(data.tracks)) patch.musicTracks = data.tracks;
  if (typeof data.playerStyle === "string") patch.musicPlayerStyle = data.playerStyle;
  else if (typeof data.style === "string") patch.musicPlayerStyle = data.style;
  if (typeof data.autoPlay === "boolean") patch.musicAutoPlay = data.autoPlay;
  if (typeof data.artBg === "boolean") patch.musicPlayerArtBg = data.artBg;
  if (typeof data.volumeControl === "boolean") patch.musicPlayerVolume = data.volumeControl;
  if (typeof data.defaultVolume === "number") patch.musicPlayerDefaultVolume = data.defaultVolume;
  if (typeof data.shuffle === "boolean") patch.musicPlayerShuffle = data.shuffle;
  if (data.cardColor !== undefined) patch.musicCardColor = data.cardColor;
  if (typeof data.cardOpacity === "number") patch.musicCardOpacity = data.cardOpacity;

  const result = await patchProfile(patch);
  return {
    success: result.success,
    error: result.error,
    tracks: (data.tracks ?? []) as MusicTrack[],
    artBg: data.artBg,
    volumeControl: data.volumeControl,
    defaultVolume: data.defaultVolume,
    shuffle: data.shuffle,
    cardColor: data.cardColor,
    cardOpacity: data.cardOpacity,
  };
}

export async function saveProfileLinks(
  data: {
    links?: ProfileLink[];
    linksAlignment?: string;
    linksSocialBackground?: boolean;
    linksBorderRadius?: number;
    linksIconSize?: number;
    linksIconGap?: number;
    linksIconColor?: string | null;
    linksTextColor?: string | null;
    linksFont?: string;
    linksFontSize?: number;
    linksFontWeight?: number;
    linksLetterSpacing?: number;
  } & Record<string, unknown>
) {
  const result = await patchProfile(data);
  return { success: result.success, error: result.error, links: (data.links ?? []) as ProfileLink[] };
}

export async function deleteLinkIconFiles(_urls: string[]) {
  return { success: true };
}
