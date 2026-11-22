export const COLLECTION_PHOTO_SIZES = [
  {
    id: "pfp",
    label: "PFP",
    ratio: "1:1",
    description: "Square tile",
  },
  {
    id: "portrait",
    label: "Portrait",
    ratio: "3:4",
    description: "Tall portrait frame",
  },
  {
    id: "landscape",
    label: "Landscape",
    ratio: "16:9",
    description: "Wide landscape frame",
  },
] as const;

export type CollectionPhotoSize = (typeof COLLECTION_PHOTO_SIZES)[number]["id"];

export const MAGAZINE_GRID_COLS = 12;
export const MAGAZINE_GRID_ROWS = 14;

export interface MagazineSlot {
  index: number;
  size: CollectionPhotoSize;
  label: string;
  /** 1-indexed CSS grid lines on a 12-column × 14-row magazine canvas */
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

export interface CollectionLayoutPreset {
  id: "editorial" | "lookbook" | "contact";
  name: string;
  description: string;
  slots: MagazineSlot[];
}

export const COLLECTION_LAYOUTS: readonly CollectionLayoutPreset[] = [
  {
    id: "editorial",
    name: "Editorial",
    description: "13 compact mixed landscape, portrait & PFP frames",
    slots: [
      // Band 1: rows 1–4 (height 4)
      { index: 0, size: "landscape", label: "Landscape", colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 5 },
      { index: 1, size: "pfp", label: "PFP", colStart: 7, colEnd: 9, rowStart: 1, rowEnd: 3 },
      { index: 2, size: "pfp", label: "PFP", colStart: 7, colEnd: 9, rowStart: 3, rowEnd: 5 },
      { index: 3, size: "landscape", label: "Landscape", colStart: 9, colEnd: 13, rowStart: 1, rowEnd: 3 },
      { index: 4, size: "landscape", label: "Landscape", colStart: 9, colEnd: 13, rowStart: 3, rowEnd: 5 },
      // Band 2: rows 5–10 (height 6)
      { index: 5, size: "portrait", label: "Portrait", colStart: 1, colEnd: 5, rowStart: 5, rowEnd: 11 },
      { index: 6, size: "pfp", label: "PFP", colStart: 5, colEnd: 8, rowStart: 5, rowEnd: 8 },
      { index: 7, size: "landscape", label: "Landscape", colStart: 8, colEnd: 13, rowStart: 5, rowEnd: 8 },
      { index: 8, size: "landscape", label: "Landscape", colStart: 5, colEnd: 10, rowStart: 8, rowEnd: 11 },
      { index: 9, size: "pfp", label: "PFP", colStart: 10, colEnd: 13, rowStart: 8, rowEnd: 11 },
      // Band 3: rows 11–14 (height 4)
      { index: 10, size: "portrait", label: "Portrait", colStart: 1, colEnd: 4, rowStart: 11, rowEnd: 15 },
      { index: 11, size: "landscape", label: "Landscape", colStart: 4, colEnd: 10, rowStart: 11, rowEnd: 15 },
      { index: 12, size: "portrait", label: "Portrait", colStart: 10, colEnd: 13, rowStart: 11, rowEnd: 15 },
    ],
  },
  {
    id: "lookbook",
    name: "Lookbook",
    description: "13 fashion-spread frames with center hero & portraits",
    slots: [
      // Band 1: rows 1–5 (height 5)
      { index: 0, size: "portrait", label: "Portrait", colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 6 },
      { index: 1, size: "landscape", label: "Landscape", colStart: 5, colEnd: 9, rowStart: 1, rowEnd: 3 },
      { index: 2, size: "pfp", label: "PFP", colStart: 9, colEnd: 11, rowStart: 1, rowEnd: 3 },
      { index: 3, size: "pfp", label: "PFP", colStart: 11, colEnd: 13, rowStart: 1, rowEnd: 3 },
      { index: 4, size: "landscape", label: "Landscape", colStart: 5, colEnd: 10, rowStart: 3, rowEnd: 6 },
      { index: 5, size: "pfp", label: "PFP", colStart: 10, colEnd: 13, rowStart: 3, rowEnd: 6 },
      // Band 2: rows 6–9 (height 4)
      { index: 6, size: "landscape", label: "Landscape", colStart: 1, colEnd: 9, rowStart: 6, rowEnd: 10 },
      { index: 7, size: "pfp", label: "PFP", colStart: 9, colEnd: 13, rowStart: 6, rowEnd: 10 },
      // Band 3: rows 10–14 (height 5)
      { index: 8, size: "portrait", label: "Portrait", colStart: 1, colEnd: 5, rowStart: 10, rowEnd: 15 },
      { index: 9, size: "pfp", label: "PFP", colStart: 5, colEnd: 7, rowStart: 10, rowEnd: 12 },
      { index: 10, size: "pfp", label: "PFP", colStart: 7, colEnd: 9, rowStart: 10, rowEnd: 12 },
      { index: 11, size: "landscape", label: "Landscape", colStart: 5, colEnd: 9, rowStart: 12, rowEnd: 15 },
      { index: 12, size: "portrait", label: "Portrait", colStart: 9, colEnd: 13, rowStart: 10, rowEnd: 15 },
    ],
  },
  {
    id: "contact",
    name: "Contact Sheet",
    description: "14 dense tiles with 4 PFP row & mixed gallery bands",
    slots: [
      // Band 1: rows 1–3 (height 3)
      { index: 0, size: "pfp", label: "PFP", colStart: 1, colEnd: 4, rowStart: 1, rowEnd: 4 },
      { index: 1, size: "pfp", label: "PFP", colStart: 4, colEnd: 7, rowStart: 1, rowEnd: 4 },
      { index: 2, size: "pfp", label: "PFP", colStart: 7, colEnd: 10, rowStart: 1, rowEnd: 4 },
      { index: 3, size: "pfp", label: "PFP", colStart: 10, colEnd: 13, rowStart: 1, rowEnd: 4 },
      // Band 2: rows 4–7 (height 4)
      { index: 4, size: "portrait", label: "Portrait", colStart: 1, colEnd: 4, rowStart: 4, rowEnd: 8 },
      { index: 5, size: "landscape", label: "Landscape", colStart: 4, colEnd: 10, rowStart: 4, rowEnd: 8 },
      { index: 6, size: "portrait", label: "Portrait", colStart: 10, colEnd: 13, rowStart: 4, rowEnd: 8 },
      // Band 3: rows 8–11 (height 4)
      { index: 7, size: "landscape", label: "Landscape", colStart: 1, colEnd: 5, rowStart: 8, rowEnd: 10 },
      { index: 8, size: "landscape", label: "Landscape", colStart: 1, colEnd: 5, rowStart: 10, rowEnd: 12 },
      { index: 9, size: "portrait", label: "Portrait", colStart: 5, colEnd: 8, rowStart: 8, rowEnd: 12 },
      { index: 10, size: "landscape", label: "Landscape", colStart: 8, colEnd: 13, rowStart: 8, rowEnd: 12 },
      // Band 4: rows 12–14 (height 3)
      { index: 11, size: "landscape", label: "Landscape", colStart: 1, colEnd: 6, rowStart: 12, rowEnd: 15 },
      { index: 12, size: "pfp", label: "PFP", colStart: 6, colEnd: 9, rowStart: 12, rowEnd: 15 },
      { index: 13, size: "landscape", label: "Landscape", colStart: 9, colEnd: 13, rowStart: 12, rowEnd: 15 },
    ],
  },
] as const;

export type CollectionLayoutId = CollectionLayoutPreset["id"];

export interface CollectionPhoto {
  id: string;
  url: string;
  size: CollectionPhotoSize;
  slotIndex: number;
  caption?: string;
}

export const MAX_COLLECTION_PHOTOS = 14;

const SIZE_IDS = COLLECTION_PHOTO_SIZES.map((item) => item.id) as string[];
const LAYOUT_IDS = COLLECTION_LAYOUTS.map((item) => item.id) as string[];

export function normalizeCollectionPhotoSize(raw: unknown): CollectionPhotoSize {
  if (typeof raw === "string" && SIZE_IDS.includes(raw)) {
    return raw as CollectionPhotoSize;
  }
  return "pfp";
}

export function normalizeCollectionLayout(raw: unknown): CollectionLayoutId {
  if (raw === "spotlight") return "lookbook";
  if (raw === "gallery") return "contact";
  if (typeof raw === "string" && LAYOUT_IDS.includes(raw)) {
    return raw as CollectionLayoutId;
  }
  return "editorial";
}

export function getCollectionLayout(id?: unknown): CollectionLayoutPreset {
  const normalized = normalizeCollectionLayout(id);
  return COLLECTION_LAYOUTS.find((layout) => layout.id === normalized) ?? COLLECTION_LAYOUTS[0];
}

export function normalizePhotoCollection(raw: unknown): CollectionPhoto[] {
  if (!Array.isArray(raw)) return [];

  const usedSlots = new Set<number>();

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const value = item as Record<string, unknown>;
      const url = typeof value.url === "string" ? value.url.trim() : "";
      if (!url) return null;

      let slotIndex =
        typeof value.slotIndex === "number" &&
        Number.isInteger(value.slotIndex) &&
        value.slotIndex >= 0 &&
        value.slotIndex < MAX_COLLECTION_PHOTOS
          ? value.slotIndex
          : index;

      while (usedSlots.has(slotIndex) && slotIndex < MAX_COLLECTION_PHOTOS) {
        slotIndex++;
      }
      if (slotIndex >= MAX_COLLECTION_PHOTOS) return null;
      usedSlots.add(slotIndex);

      const caption =
        typeof value.caption === "string" && value.caption.trim()
          ? value.caption.trim().slice(0, 120)
          : undefined;

      return {
        id:
          typeof value.id === "string" && value.id.trim()
            ? value.id.trim()
            : `col-${slotIndex}-${Math.random().toString(36).slice(2, 8)}`,
        url,
        size: normalizeCollectionPhotoSize(value.size),
        slotIndex,
        ...(caption ? { caption } : {}),
      } satisfies CollectionPhoto;
    })
    .filter((photo): photo is CollectionPhoto => Boolean(photo))
    .slice(0, MAX_COLLECTION_PHOTOS);
}

export function photoSizeMeta(size: CollectionPhotoSize) {
  return (
    COLLECTION_PHOTO_SIZES.find((item) => item.id === size) ??
    COLLECTION_PHOTO_SIZES[0]
  );
}
