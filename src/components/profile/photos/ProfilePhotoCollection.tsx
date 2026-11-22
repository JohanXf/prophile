"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import {
  MAGAZINE_GRID_COLS,
  MAGAZINE_GRID_ROWS,
  getCollectionLayout,
  type CollectionLayoutId,
  type CollectionPhoto,
  type CollectionPhotoSize,
} from "@/lib/photo-collection";

interface ProfilePhotoCollectionProps {
  photos: CollectionPhoto[];
  layoutId?: CollectionLayoutId;
  borderRadius?: number;
  borderColor?: string;
  borderOpacity?: number;
}

const SIZE_BADGE_LABEL: Record<CollectionPhotoSize, string> = {
  pfp: "PFP",
  portrait: "Portrait",
  landscape: "Landscape",
};

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return `rgba(255, 255, 255, ${alpha})`;
}

export function PhotoLightboxModal({
  photos,
  activeIndex,
  onChangeIndex,
  onClose,
}: {
  photos: CollectionPhoto[];
  activeIndex: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const movedRef = useRef(false);

  const count = photos.length;
  const safeIndex = Math.max(0, Math.min(count - 1, activeIndex));
  const current = photos[safeIndex];

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    resetZoom();
    onChangeIndex((safeIndex - 1 + count) % count);
  }, [count, onChangeIndex, resetZoom, safeIndex]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    resetZoom();
    onChangeIndex((safeIndex + 1) % count);
  }, [count, onChangeIndex, resetZoom, safeIndex]);

  const zoomIn = useCallback(() => {
    setZoom((z) => (z < 1.5 ? 1.75 : z < 2.25 ? 2.5 : 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = z > 2.25 ? 1.75 : 1;
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const toggleZoom = useCallback(() => {
    setZoom((z) => {
      if (z > 1) {
        setOffset({ x: 0, y: 0 });
        return 1;
      }
      return 1.85;
    });
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrev, onClose, resetZoom, zoomIn, zoomOut]);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full photo viewer"
      className="fixed inset-0 z-[260] flex flex-col bg-black/92 backdrop-blur-xl animate-in fade-in duration-150 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top toolbar */}
      <div className="relative z-20 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/80 tabular-nums backdrop-blur-md">
            {safeIndex + 1} / {count}
          </span>
          <span className="hidden sm:inline-flex rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-white/55">
            {SIZE_BADGE_LABEL[current.size]}
          </span>
          {zoom > 1 && (
            <span className="hidden sm:inline-flex rounded-xl border border-[#f05e23]/30 bg-[#f05e23]/15 px-2.5 py-1.5 text-[11.5px] font-medium text-[#f05e23] tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed backdrop-blur-md"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 3}
            aria-label="Zoom in"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed backdrop-blur-md"
          >
            <ZoomIn size={16} />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={resetZoom}
              aria-label="Reset zoom"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/80 hover:bg-white/[0.14] hover:text-white transition-colors cursor-pointer backdrop-blur-md"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close photo viewer"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.1] text-white hover:bg-[#f05e23] hover:border-[#f05e23] transition-colors cursor-pointer backdrop-blur-md ml-1"
          >
            <X size={17} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* Main full-picture stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden px-4 sm:px-16"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {count > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous photo"
            className="absolute left-3 sm:left-5 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/12 bg-black/50 text-white/85 hover:bg-[#f05e23] hover:border-[#f05e23] hover:text-white transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          className={`relative flex items-center justify-center max-w-full max-h-full ${
            zoom > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
          }`}
          onPointerDown={(e) => {
            movedRef.current = false;
            if (zoom <= 1) return;
            e.preventDefault();
            setDragging(true);
            dragStartRef.current = {
              x: e.clientX,
              y: e.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onPointerMove={(e) => {
            if (!dragging || !dragStartRef.current) return;
            const dx = e.clientX - dragStartRef.current.x;
            const dy = e.clientY - dragStartRef.current.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
            setOffset({
              x: dragStartRef.current.ox + dx,
              y: dragStartRef.current.oy + dy,
            });
          }}
          onPointerUp={() => {
            setDragging(false);
            dragStartRef.current = null;
          }}
          onPointerLeave={() => {
            setDragging(false);
            dragStartRef.current = null;
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            toggleZoom();
          }}
        >
          <img
            key={current.id}
            src={current.url}
            alt={current.caption || `Photo ${safeIndex + 1}`}
            draggable={false}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
              transition: dragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.75)] animate-in zoom-in-95 duration-200"
          />
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next photo"
            className="absolute right-3 sm:right-5 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-white/12 bg-black/50 text-white/85 hover:bg-[#f05e23] hover:border-[#f05e23] hover:text-white transition-all cursor-pointer backdrop-blur-md"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Caption & Thumbnail strip */}
      <div className="relative z-20 flex flex-col items-center gap-2.5 px-4 pb-4 pt-2 sm:px-6 sm:pb-5">
        {current.caption && (
          <p className="max-w-xl text-center text-[13px] text-white/85 leading-snug px-3 py-1 rounded-xl bg-white/[0.05] border border-white/10 backdrop-blur-md">
            {current.caption}
          </p>
        )}

        {count > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 px-1">
            {photos.map((photo, index) => {
              const active = index === safeIndex;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    resetZoom();
                    onChangeIndex(index);
                  }}
                  aria-label={`View photo ${index + 1}`}
                  className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border transition-all cursor-pointer ${
                    active
                      ? "border-[#f05e23] ring-2 ring-[#f05e23]/40 opacity-100 scale-105"
                      : "border-white/15 opacity-50 hover:opacity-85"
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * Renders the magazine photo gallery at the exact width of the profile card
 * (`w-full` inside `w-[var(--card-w)]`) using a dense 12-column mixed-size
 * magazine grid with smaller individual photo boxes so 13–14 photos fit cleanly
 * with proportional height. Clicking every photo zooms in on the full uncropped image.
 */
export default function ProfilePhotoCollection({
  photos,
  layoutId = "editorial",
  borderRadius = 14,
  borderColor = "#FFFFFF",
  borderOpacity = 12,
}: ProfilePhotoCollectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const layout = getCollectionLayout(layoutId);
  const photoBySlot = new Map<number, CollectionPhoto>();
  for (const photo of photos) {
    if (photo.slotIndex >= 0 && photo.slotIndex < layout.slots.length) {
      photoBySlot.set(photo.slotIndex, photo);
    }
  }

  const unplaced = photos.filter(
    (photo) => photo.slotIndex < 0 || photo.slotIndex >= layout.slots.length
  );
  for (const photo of unplaced) {
    const freeSlot = layout.slots.find((slot) => !photoBySlot.has(slot.index));
    if (freeSlot) photoBySlot.set(freeSlot.index, photo);
  }

  const visibleEntries = layout.slots
    .map((slot) => {
      const photo = photoBySlot.get(slot.index);
      return photo ? { slot, photo } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  if (visibleEntries.length === 0) return null;

  // Match height tightly to the deepest filled row so partial collections never leave dead blank air
  const maxFilledRow = Math.min(
    MAGAZINE_GRID_ROWS,
    Math.max(4, ...visibleEntries.map((entry) => entry.slot.rowEnd - 1))
  );

  const visiblePhotos = visibleEntries.map((entry) => entry.photo);
  const clampedRadius = Math.max(8, Math.min(20, borderRadius));
  const subtleBorder = hexToRgba(borderColor, Math.max(0.08, Math.min(0.35, borderOpacity / 100)));

  return (
    <>
      <div className="w-full">
        <div
          className="w-full grid grid-cols-12 gap-2"
          style={{
            aspectRatio: `${MAGAZINE_GRID_COLS} / ${maxFilledRow}`,
            gridTemplateRows: `repeat(${maxFilledRow}, minmax(0, 1fr))`,
          }}
        >
          {visibleEntries.map(({ slot, photo }, visibleIndex) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setLightboxIndex(visibleIndex)}
              aria-label={
                photo.caption
                  ? `Zoom in on ${photo.caption}`
                  : `Zoom in on photo ${visibleIndex + 1}`
              }
              style={{
                gridColumn: `${slot.colStart} / ${slot.colEnd}`,
                gridRow: `${slot.rowStart} / ${slot.rowEnd}`,
                borderRadius: `${clampedRadius}px`,
                borderColor: subtleBorder,
              }}
              className="group relative w-full h-full overflow-hidden border bg-black/35 backdrop-blur-sm text-left cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f05e23] transition-all duration-300 hover:border-white/30 hover:shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
            >
              <img
                src={photo.url}
                alt={photo.caption || `Collection photo ${visibleIndex + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <span className="pointer-events-none absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-white/90 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 backdrop-blur-md">
                <Maximize2 size={11} />
              </span>

              {photo.caption && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                  <p className="text-[11px] font-medium text-white/95 line-clamp-2 drop-shadow-sm">
                    {photo.caption}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightboxModal
          photos={visiblePhotos}
          activeIndex={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
