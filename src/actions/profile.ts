import { getStore, saveStore } from "@/lib/local-store";
import type { ProfileLink } from "@/lib/links";
import type { MusicTrack } from "@/lib/music";
import type { WidgetConfig } from "@/lib/widget-types";

function updateCurrentUser(patch: Record<string, unknown>) {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  const user = state.users[uid];
  if (!user) return;
  const nextEffectConfig = { ...(user.effectConfig ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    (user as unknown as Record<string, unknown>)[k] = v;
    if (
      k.startsWith("aurora") ||
      k.startsWith("darkveil") ||
      k.startsWith("pixelblast") ||
      k.startsWith("colorbends") ||
      k.startsWith("liquidchrome") ||
      k.startsWith("crtwarp")
    ) {
      (nextEffectConfig as Record<string, unknown>)[k] = v;
    }
  }
  user.effectConfig = nextEffectConfig as typeof user.effectConfig;
  user.updatedAt = new Date();
  saveStore(state);
}

export async function updateGeneralProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateBackgrounds(urls: string[]) {
  const state = getStore();
  const uid = state.currentUserId ?? 1;
  state.backgrounds[uid] = Array.isArray(urls) ? urls : [];
  saveStore(state);
  return { success: true };
}

export async function updateAppearanceProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateColorsProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateLayoutProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateMetadataProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateEffectsProfile(data: Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateProfileWidgets(data: { widgets?: WidgetConfig[] } & Record<string, unknown>) {
  updateCurrentUser(data);
  return { success: true };
}

export async function updateMusicProfile(
  data: {
    tracks?: MusicTrack[];
    style?: string;
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
  if (typeof data.style === "string") patch.musicPlayerStyle = data.style;
  if (typeof data.artBg === "boolean") patch.musicPlayerArtBg = data.artBg;
  if (typeof data.volumeControl === "boolean") patch.musicPlayerVolume = data.volumeControl;
  if (typeof data.defaultVolume === "number") patch.musicPlayerDefaultVolume = data.defaultVolume;
  if (typeof data.shuffle === "boolean") patch.musicPlayerShuffle = data.shuffle;
  if (data.cardColor !== undefined) patch.musicCardColor = data.cardColor;
  if (typeof data.cardOpacity === "number") patch.musicCardOpacity = data.cardOpacity;
  updateCurrentUser(patch);
  return {
    success: true,
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
  updateCurrentUser(data);
  return { success: true, links: (data.links ?? []) as ProfileLink[] };
}

export async function deleteLinkIconFiles(_urls: string[]) {
  return { success: true };
}
