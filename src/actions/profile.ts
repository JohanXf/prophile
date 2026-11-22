import { authFetch } from "@/lib/auth-client";
import { hydrateStoreFromServer } from "@/lib/local-store";
import type { ProfileLink } from "@/lib/links";
import type { MusicTrack } from "@/lib/music";
import type { WidgetConfig } from "@/lib/widget-types";

async function patchProfile(patch: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const res = await authFetch("/api/profile/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: (body as { error?: string }).error || "Failed to save profile changes." };
  }
  await hydrateStoreFromServer();
  return { success: true };
}

export async function updateGeneralProfile(data: Record<string, unknown>) {
  return patchProfile(data);
}

export async function updateBackgrounds(urls: string[]) {
  const res = await authFetch("/api/profile/backgrounds", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { success: false, error: (body as { error?: string }).error || "Failed to update backgrounds." };
  }
  await hydrateStoreFromServer();
  return { success: true };
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
