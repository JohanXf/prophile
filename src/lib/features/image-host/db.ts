import { getStore, updateStore } from "@/lib/local-store";
import type { ImageHostKind } from "@/lib/image-host";

export type ImageHostFilter = "all" | "image" | "video" | "favorite";

export interface ImageHostStats {
  totalUploads: number;
  storageUsedBytes: number;
  favorites: number;
  byKind: { kind: string; count: number }[];
  recent: { at: number; size: number }[];
}

export async function getImageHostStats(_userId: number): Promise<ImageHostStats> {
  const files = getStore().imageHostFiles;
  const storageUsedBytes = files.reduce((acc, f) => acc + f.size, 0);
  const favorites = files.filter((f) => f.favorite).length;
  const imageCount = files.filter((f) => f.kind === "image").length;
  const videoCount = files.filter((f) => f.kind === "video").length;
  return {
    totalUploads: files.length,
    storageUsedBytes,
    favorites,
    byKind: [
      { kind: "image", count: imageCount },
      { kind: "video", count: videoCount },
    ],
    recent: files.map((f) => ({ at: f.createdAt, size: f.size })),
  };
}

export async function listImageHostFiles(
  _userId: number,
  { limit, offset, filter }: { limit: number; offset: number; filter: ImageHostFilter },
) {
  let files = [...getStore().imageHostFiles];
  if (filter === "image" || filter === "video") {
    files = files.filter((f) => f.kind === filter);
  } else if (filter === "favorite") {
    files = files.filter((f) => f.favorite);
  }
  return {
    files: files.slice(offset, offset + limit),
    total: files.length,
  };
}

export async function listImageHostActivity(
  _userId: number,
  { limit, offset }: { limit: number; offset: number },
) {
  const files = getStore().imageHostFiles;
  const items = files.map((f) => ({
    action: "upload" as const,
    kind: f.kind,
    name: f.name,
    size: f.size,
    url: f.url,
    createdAt: f.createdAt,
  }));
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
  };
}

export async function setImageHostFavorite(
  _userId: number,
  ids: number[],
  favorite: boolean,
): Promise<number[]> {
  updateStore((s) => {
    for (const f of s.imageHostFiles) {
      if (ids.includes(f.id)) f.favorite = favorite;
    }
  });
  return ids;
}

export async function deleteImageHostFiles(
  _userId: number,
  ids: number[],
) {
  let usedBytes = 0;
  updateStore((s) => {
    s.imageHostFiles = s.imageHostFiles.filter((f) => !ids.includes(f.id));
    usedBytes = s.imageHostFiles.reduce((acc, f) => acc + f.size, 0);
  });
  return {
    deletedIds: ids,
    orphanedStorageIds: [],
    deletedUrls: [],
    usedBytes,
  };
}

export async function recordImageHostFile(input: {
  userId: number;
  storageId: string;
  ext: string;
  name: string;
  size: number;
  kind: ImageHostKind;
}): Promise<string> {
  let url = input.storageId;
  updateStore((s) => {
    const nextId = s.imageHostFiles.reduce((max, f) => Math.max(max, f.id), 0) + 1;
    s.imageHostFiles.unshift({
      id: nextId,
      url,
      name: input.name,
      size: input.size,
      kind: input.kind,
      favorite: false,
      locked: false,
      createdAt: Date.now(),
    });
  });
  return url;
}
