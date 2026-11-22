"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GripVertical,
  ImagePlus,
  Loader2,
  Maximize2,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import SaveBar from "@/components/dashboard/SaveBar";
import { useUnsavedChanges } from "@/components/dashboard/UnsavedChangesProvider";
import DashboardProfilePreview from "@/components/dashboard/DashboardProfilePreview";
import { PhotoLightboxModal } from "@/components/profile/photos/ProfilePhotoCollection";
import {
  COLLECTION_LAYOUTS,
  MAGAZINE_GRID_COLS,
  MAGAZINE_GRID_ROWS,
  getCollectionLayout,
  normalizeCollectionLayout,
  normalizePhotoCollection,
  type CollectionLayoutId,
  type CollectionPhoto,
  type MagazineSlot,
} from "@/lib/photo-collection";
import { uploadMediaFile } from "@/lib/media-upload";
import { updateLayoutProfile } from "@/actions/profile";
import { toast } from "@/components/ui/toast";
import type { FullUser } from "@/lib/features/users/db";

function EditSlotPhotoModal({
  photo,
  slot,
  onClose,
  onSave,
  onDelete,
}: {
  photo: CollectionPhoto | null;
  slot: MagazineSlot | null;
  onClose: () => void;
  onSave: (patch: Partial<CollectionPhoto>) => void;
  onDelete: () => void;
}) {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(photo?.url ?? "");
  const [caption, setCaption] = useState(photo?.caption ?? "");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!photo) return;
    setUrl(photo.url);
    setCaption(photo.caption ?? "");
  }, [photo]);

  useEffect(() => {
    if (!photo) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [photo, onClose]);

  if (!photo || !slot) return null;

  async function handleReplaceFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadMediaFile(file, {
        category: "general",
        onProgress: setProgress,
      });
      setUrl(result.url);
      toast.success("Photo re-uploaded");
    } catch (err) {
      console.error("Re-upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Failed to re-upload photo");
    } finally {
      setUploading(false);
      setProgress(0);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit photo"
        className="relative z-10 w-full max-w-[440px] max-h-[88vh] overflow-y-auto rounded-[24px] border border-white/10 bg-[#0c0c0c] p-5 sm:p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-normal text-white/95 tracking-tight">
              Edit {slot.label} box
            </h3>
            <p className="text-[12.5px] text-white/40 mt-0.5">
              Re-upload the photo or add an optional caption shown on zoom.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] h-56">
            <img
              src={url}
              alt={caption || "Photo preview"}
              className="max-h-full max-w-full object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 backdrop-blur-sm">
                <Loader2 size={20} className="animate-spin text-[#f05e23]" />
                <span className="text-[12px] text-white/85 tabular-nums">
                  Uploading... {progress}%
                </span>
              </div>
            )}
          </div>

          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleReplaceFile(file);
            }}
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => replaceInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] px-3.5 py-2 text-[12.5px] text-white/85 transition-colors cursor-pointer disabled:opacity-45"
          >
            <RefreshCw size={13.5} className="text-[#f05e23]" />
            Re-upload / Replace photo
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="collection-photo-caption" className="text-[12.5px] text-white/40">
            Caption <span className="text-white/25">(optional)</span>
          </label>
          <input
            id="collection-photo-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 120))}
            maxLength={120}
            placeholder="Write a short caption shown on hover & zoom..."
            className="h-10 rounded-xl border border-white/5 bg-[#161616] px-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-white/15"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2 size={13.5} />
            Remove
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3.5 py-2 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                onSave({
                  url,
                  caption: caption.trim() || undefined,
                });
                onClose();
              }}
              className="rounded-xl bg-[#f05e23]/25 hover:bg-[#f05e23]/35 border border-[#f05e23]/30 px-4 py-2 text-[13px] text-white transition-all cursor-pointer disabled:opacity-45"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionProfileClient({
  user,
  backgrounds,
}: {
  user: FullUser | null;
  backgrounds?: string[];
}) {
  const router = useRouter();
  const unsavedChanges = useUnsavedChanges();
  const initialPhotos = normalizePhotoCollection(user?.photoCollection);
  const initialLayout = normalizeCollectionLayout(user?.photoCollectionLayout);

  const [photos, setPhotos] = useState<CollectionPhoto[]>(initialPhotos);
  const [layoutId, setLayoutId] = useState<CollectionLayoutId>(initialLayout);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const slotInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<number>(0);

  const hydratedSigRef = useRef<string>(
    JSON.stringify({ id: user?.id ?? null, photos: initialPhotos, layoutId: initialLayout })
  );

  useEffect(() => {
    const nextSig = JSON.stringify({
      id: user?.id ?? null,
      photos: initialPhotos,
      layoutId: initialLayout,
    });
    if (nextSig !== hydratedSigRef.current) {
      hydratedSigRef.current = nextSig;
      setPhotos(initialPhotos);
      setLayoutId(initialLayout);
    }
  }, [user?.id, initialPhotos, initialLayout]);

  const hasChanges =
    layoutId !== initialLayout || JSON.stringify(photos) !== JSON.stringify(initialPhotos);

  useEffect(() => {
    unsavedChanges?.register("collection", hasChanges);
    return () => unsavedChanges?.register("collection", false);
  }, [hasChanges, unsavedChanges]);

  const layout = getCollectionLayout(layoutId);
  const photoBySlot = new Map<number, CollectionPhoto>();
  for (const photo of photos) {
    if (photo.slotIndex >= 0 && photo.slotIndex < layout.slots.length) {
      photoBySlot.set(photo.slotIndex, photo);
    }
  }

  const orderedFilledPhotos = layout.slots
    .map((slot) => photoBySlot.get(slot.index))
    .filter((item): item is CollectionPhoto => Boolean(item));

  const filledCount = orderedFilledPhotos.length;
  const totalSlots = layout.slots.length;

  function handleSwitchLayout(nextId: CollectionLayoutId) {
    if (nextId === layoutId) return;
    const nextLayout = getCollectionLayout(nextId);
    setPhotos((prev) =>
      prev
        .filter((photo) => photo.slotIndex < nextLayout.slots.length)
        .map((photo) => {
          const targetSlot = nextLayout.slots[photo.slotIndex];
          return targetSlot ? { ...photo, size: targetSlot.size } : photo;
        })
    );
    setLayoutId(nextId);
  }

  async function uploadToSlot(slotIndex: number, fileList: FileList | File[]) {
    const imageFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please drop or select image files (PNG, JPG, WebP, GIF).");
      return;
    }

    const slotQueue: number[] = [slotIndex];
    if (imageFiles.length > 1) {
      for (const slot of layout.slots) {
        if (slot.index !== slotIndex && !photoBySlot.has(slot.index)) {
          slotQueue.push(slot.index);
        }
      }
    }

    const pairs = imageFiles
      .slice(0, slotQueue.length)
      .map((file, idx) => ({ file, targetSlot: slotQueue[idx] }));

    let uploadedCount = 0;
    let failedCount = 0;

    for (const { file, targetSlot } of pairs) {
      const slotMeta = layout.slots[targetSlot];
      if (!slotMeta) continue;
      setUploadingSlot(targetSlot);
      setUploadProgress(0);
      try {
        const result = await uploadMediaFile(file, {
          category: "general",
          onProgress: setUploadProgress,
        });
        setPhotos((prev) => {
          const existing = prev.find((item) => item.slotIndex === targetSlot);
          const nextPhoto: CollectionPhoto = {
            id:
              existing?.id ??
              `col-${targetSlot}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
            url: result.url,
            size: slotMeta.size,
            slotIndex: targetSlot,
            ...(existing?.caption ? { caption: existing.caption } : {}),
          };
          const filtered = prev.filter((item) => item.slotIndex !== targetSlot);
          return [...filtered, nextPhoto].sort((a, b) => a.slotIndex - b.slotIndex);
        });
        uploadedCount++;
      } catch (err) {
        failedCount++;
        console.error("Slot upload failed:", err);
      }
    }

    setUploadingSlot(null);
    setUploadProgress(0);
    if (slotInputRef.current) slotInputRef.current.value = "";
    if (multiInputRef.current) multiInputRef.current.value = "";

    if (uploadedCount > 0) {
      toast.success(
        uploadedCount === 1
          ? "Photo placed in box"
          : `${uploadedCount} photos placed in collection`
      );
    }
    if (failedCount > 0) {
      toast.error(
        failedCount === 1 ? "1 photo failed to upload." : `${failedCount} photos failed to upload.`
      );
    }
  }

  async function handleFillEmptySlots(fileList: FileList | File[]) {
    const firstEmpty = layout.slots.find((slot) => !photoBySlot.has(slot.index));
    if (!firstEmpty) {
      toast.error("All boxes in this magazine are filled. Drop onto a specific box to replace it.");
      return;
    }
    await uploadToSlot(firstEmpty.index, fileList);
  }

  function swapOrMoveSlot(fromSlot: number, toSlot: number) {
    if (fromSlot === toSlot) return;
    const fromMeta = layout.slots[fromSlot];
    const toMeta = layout.slots[toSlot];
    if (!fromMeta || !toMeta) return;

    setPhotos((prev) => {
      const fromPhoto = prev.find((p) => p.slotIndex === fromSlot);
      if (!fromPhoto) return prev;
      const toPhoto = prev.find((p) => p.slotIndex === toSlot);
      const others = prev.filter((p) => p.slotIndex !== fromSlot && p.slotIndex !== toSlot);

      const next: CollectionPhoto[] = [
        ...others,
        { ...fromPhoto, slotIndex: toSlot, size: toMeta.size },
      ];
      if (toPhoto) {
        next.push({ ...toPhoto, slotIndex: fromSlot, size: fromMeta.size });
      }
      return next.sort((a, b) => a.slotIndex - b.slotIndex);
    });
  }

  function patchSlotPhoto(slotIndex: number, patch: Partial<CollectionPhoto>) {
    setPhotos((prev) =>
      prev.map((item) => (item.slotIndex === slotIndex ? { ...item, ...patch } : item))
    );
  }

  function removeSlotPhoto(slotIndex: number) {
    setPhotos((prev) => prev.filter((item) => item.slotIndex !== slotIndex));
    if (editingSlotIndex === slotIndex) setEditingSlotIndex(null);
  }

  async function handleSave() {
    try {
      await updateLayoutProfile({
        photoCollection: photos,
        photoCollectionLayout: layoutId,
      });
      hydratedSigRef.current = JSON.stringify({ id: user?.id ?? null, photos, layoutId });
      toast.success("Collection saved successfully");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save collection");
    }
  }

  function handleRevert() {
    setPhotos(initialPhotos);
    setLayoutId(initialLayout);
  }

  const editingSlot =
    editingSlotIndex !== null ? layout.slots[editingSlotIndex] ?? null : null;
  const editingPhoto =
    editingSlotIndex !== null ? photoBySlot.get(editingSlotIndex) ?? null : null;

  return (
    <>
      <div
        className="flex flex-col gap-5 pb-28 w-full"
        style={{ paddingRight: "calc(var(--preview-width, 380px) + 2rem)" }}
      >
        <input
          ref={slotInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void uploadToSlot(targetSlotRef.current, e.target.files);
            }
          }}
        />
        <input
          ref={multiInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              void handleFillEmptySlots(e.target.files);
            }
          }}
        />

        {/* Magazine Structure Selector */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[18px] p-4 sm:p-5 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-normal text-white tracking-tight">
                Magazine structure
              </h2>
              <p className="text-[12px] text-white/40 mt-0.5">
                Matches your profile card width with compact mixed PFP, portrait, and landscape boxes.
              </p>
            </div>
            <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-white/50 tabular-nums">
              {filledCount} / {totalSlots} photos
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {COLLECTION_LAYOUTS.map((preset) => {
              const active = layoutId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSwitchLayout(preset.id)}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl border p-3 text-center transition-all cursor-pointer ${
                    active
                      ? "bg-[#f05e23]/12 border-[#f05e23]/55 text-white"
                      : "bg-[#131313] border-white/[0.06] text-white/65 hover:border-white/15 hover:text-white"
                  }`}
                >
                  {/* Miniature 12×14 wireframe preview */}
                  <div
                    className="w-[54px] grid grid-cols-12 gap-[1.5px] rounded-md border border-white/10 bg-[#090909] p-[3px]"
                    style={{
                      aspectRatio: `${MAGAZINE_GRID_COLS} / ${MAGAZINE_GRID_ROWS}`,
                      gridTemplateRows: `repeat(${MAGAZINE_GRID_ROWS}, minmax(0, 1fr))`,
                    }}
                  >
                    {preset.slots.map((slot) => (
                      <span
                        key={slot.index}
                        style={{
                          gridColumn: `${slot.colStart} / ${slot.colEnd}`,
                          gridRow: `${slot.rowStart} / ${slot.rowEnd}`,
                        }}
                        className={`rounded-[1.5px] transition-colors ${
                          active ? "bg-[#f05e23]/70" : "bg-white/22"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col leading-tight">
                    <span className="text-[12.5px] font-medium">{preset.name}</span>
                    <span className="text-[10.5px] text-white/35 mt-0.5 tabular-nums">
                      {preset.slots.length} photos
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Full-Width Magazine Drag-and-Drop Builder */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[18px] p-4 sm:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-normal text-white tracking-tight">
                Drop photos into boxes
              </h2>
              <p className="text-[12px] text-white/40 mt-0.5">
                Drag files into any box, click an empty box to upload, or drag filled boxes to swap.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {filledCount < totalSlots && (
                <button
                  type="button"
                  disabled={uploadingSlot !== null}
                  onClick={() => multiInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-[#f05e23]/20 hover:bg-[#f05e23]/30 border border-[#f05e23]/25 px-3 py-1.5 text-[12px] text-white transition-colors cursor-pointer disabled:opacity-45"
                >
                  <Upload size={13} />
                  Auto-fill
                </button>
              )}
              {filledCount > 0 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(0)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.09] px-3 py-1.5 text-[12px] text-white/80 transition-colors cursor-pointer"
                >
                  <Maximize2 size={12.5} className="text-[#f05e23]" />
                  Preview zoom
                </button>
              )}
            </div>
          </div>

          {/* 12×14 Full-Width Magazine Canvas */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#070707] p-3.5 sm:p-4 flex flex-col items-center">
            <div
              className="w-full max-w-[540px] grid grid-cols-12 gap-1.5 sm:gap-2"
              style={{
                aspectRatio: `${MAGAZINE_GRID_COLS} / ${MAGAZINE_GRID_ROWS}`,
                gridTemplateRows: `repeat(${MAGAZINE_GRID_ROWS}, minmax(0, 1fr))`,
              }}
            >
              {layout.slots.map((slot) => {
                const photo = photoBySlot.get(slot.index);
                const isUploading = uploadingSlot === slot.index;
                const isDragOver = dragOverSlot === slot.index;
                const isDragging = draggingSlot === slot.index;
                const filledIdx = photo
                  ? orderedFilledPhotos.findIndex((p) => p.id === photo.id)
                  : -1;
                const isCompactTile =
                  slot.colEnd - slot.colStart <= 2 && slot.rowEnd - slot.rowStart <= 2;

                return (
                  <div
                    key={slot.index}
                    style={{
                      gridColumn: `${slot.colStart} / ${slot.colEnd}`,
                      gridRow: `${slot.rowStart} / ${slot.rowEnd}`,
                    }}
                    draggable={Boolean(photo) && !isUploading}
                    onDragStart={(e) => {
                      if (!photo) return;
                      setDraggingSlot(slot.index);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/x-collection-slot", String(slot.index));
                    }}
                    onDragEnd={() => {
                      setDraggingSlot(null);
                      setDragOverSlot(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverSlot !== slot.index) setDragOverSlot(slot.index);
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDragOverSlot((cur) => (cur === slot.index ? null : cur));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverSlot(null);
                      const draggedSlotStr = e.dataTransfer.getData("text/x-collection-slot");
                      if (draggedSlotStr !== "") {
                        const fromSlot = Number(draggedSlotStr);
                        if (Number.isInteger(fromSlot)) {
                          swapOrMoveSlot(fromSlot, slot.index);
                        }
                        setDraggingSlot(null);
                        return;
                      }
                      if (e.dataTransfer.files?.length) {
                        void uploadToSlot(slot.index, e.dataTransfer.files);
                      }
                    }}
                    className={`group relative w-full h-full overflow-hidden rounded-[12px] border transition-all select-none ${
                      isDragOver
                        ? "border-[#f05e23] bg-[#f05e23]/18 ring-2 ring-[#f05e23]/35 scale-[0.98]"
                        : photo
                        ? "border-white/12 bg-[#141414]"
                        : "border-dashed border-white/14 bg-[#111111] hover:border-[#f05e23]/55 hover:bg-[#161616]"
                    } ${isDragging ? "opacity-45" : ""}`}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.url}
                          alt={photo.caption || `${slot.label} photo`}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

                        {/* Top-left drag indicator */}
                        {!isCompactTile && (
                          <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded-md border border-white/12 bg-black/65 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white/85 backdrop-blur-sm cursor-grab active:cursor-grabbing">
                            <GripVertical size={9.5} className="text-white/55" />
                            <span>{slot.label}</span>
                          </div>
                        )}

                        {/* Top-right remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSlotPhoto(slot.index);
                          }}
                          aria-label="Remove photo from box"
                          title="Remove"
                          className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-md border border-white/15 bg-black/70 text-white/80 hover:bg-red-500 hover:border-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm"
                        >
                          <Trash2 size={10} />
                        </button>

                        {/* Bottom action icons: Zoom, Re-upload, Edit */}
                        <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (filledIdx >= 0) setLightboxIndex(filledIdx);
                            }}
                            aria-label="Zoom full picture"
                            title="Zoom full picture"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-black/75 text-white hover:bg-[#f05e23] hover:border-[#f05e23] transition-colors cursor-pointer backdrop-blur-sm"
                          >
                            <Maximize2 size={10.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              targetSlotRef.current = slot.index;
                              slotInputRef.current?.click();
                            }}
                            aria-label="Re-upload photo"
                            title="Re-upload"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-black/75 text-white hover:bg-[#f05e23] hover:border-[#f05e23] transition-colors cursor-pointer backdrop-blur-sm"
                          >
                            <RefreshCw size={10.5} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSlotIndex(slot.index);
                            }}
                            aria-label="Edit photo"
                            title="Edit caption & image"
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-black/75 text-white hover:bg-[#f05e23] hover:border-[#f05e23] transition-colors cursor-pointer backdrop-blur-sm"
                          >
                            <Pencil size={10.5} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => {
                          targetSlotRef.current = slot.index;
                          slotInputRef.current?.click();
                        }}
                        className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-center cursor-pointer disabled:cursor-wait"
                      >
                        <ImagePlus
                          size={isCompactTile ? 13 : 15}
                          className={`transition-colors ${
                            isDragOver
                              ? "text-[#f05e23]"
                              : "text-white/30 group-hover:text-[#f05e23]"
                          }`}
                        />
                        <span className="text-[9.5px] font-medium text-white/60 leading-tight">
                          {slot.label}
                        </span>
                      </button>
                    )}

                    {isUploading && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-black/75 backdrop-blur-sm">
                        <Loader2 size={16} className="animate-spin text-[#f05e23]" />
                        <span className="text-[10px] text-white/85 tabular-nums">
                          {uploadProgress > 0 ? `${uploadProgress}%` : "..."}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between w-full max-w-[540px] text-[11px] text-white/35">
              <span>Matches your profile card width ({user?.contentWidth ?? 700}px)</span>
              {filledCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <DashboardProfilePreview
        user={user}
        backgrounds={backgrounds}
        overrides={{
          photoCollection: photos,
          photoCollectionLayout: layoutId,
        }}
      />

      <SaveBar show={hasChanges} onSave={handleSave} onRevert={handleRevert} />

      <EditSlotPhotoModal
        photo={editingPhoto}
        slot={editingSlot}
        onClose={() => setEditingSlotIndex(null)}
        onSave={(patch) => {
          if (editingSlotIndex !== null) patchSlotPhoto(editingSlotIndex, patch);
        }}
        onDelete={() => {
          if (editingSlotIndex !== null) removeSlotPhoto(editingSlotIndex);
        }}
      />

      {lightboxIndex !== null && orderedFilledPhotos.length > 0 && (
        <PhotoLightboxModal
          photos={orderedFilledPhotos}
          activeIndex={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
