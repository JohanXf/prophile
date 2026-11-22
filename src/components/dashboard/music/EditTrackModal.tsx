"use client";

import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type { SearchTrack } from "./SearchTracksModal";
import { parseLRC, toLRC } from "./lrc";
import { uploadMediaFile } from "@/lib/media-upload";

export type EditTrackPatch = {
  title: string;
  artist: string;
  bio: string | null;
  artwork: string | null;
  streamUrl: string | null;
  duration: number | null;
  lyrics: Array<{ text: string; start: number; end: number }> | null;
};

const MAX_AUDIO_MB = 15;
const MAX_COVER_MB = 5;

function probeAudioDuration(url: string): Promise<number | null> {
  return new Promise<number | null>((resolve) => {
    const a = new Audio(url);
    const to = window.setTimeout(() => {
      try { a.src = ""; } catch {}
      resolve(null);
    }, 15000);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      window.clearTimeout(to);
      resolve(Number.isFinite(a.duration) && a.duration > 0 ? Math.round(a.duration) : null);
      try { a.src = ""; } catch {}
    };
    a.onerror = () => {
      window.clearTimeout(to);
      resolve(null);
    };
    a.src = url;
  });
}

export default function EditTrackModal({
  open,
  track,
  focusAudio = false,
  onClose,
  onSave,
}: {
  open: boolean;
  track: SearchTrack | null;
  focusAudio?: boolean;
  onClose: () => void;
  onSave: (patch: EditTrackPatch) => void | Promise<void>;
}) {
  return (
    <AnimatePresence>
      {open && track && (
        <EditTrackForm
          key={`${track.id}-${focusAudio ? "audio" : "edit"}`}
          track={track}
          focusAudio={focusAudio}
          onClose={onClose}
          onSave={onSave}
        />
      )}
    </AnimatePresence>
  );
}

function EditTrackForm({
  track,
  focusAudio,
  onClose,
  onSave,
}: {
  track: SearchTrack;
  focusAudio: boolean;
  onClose: () => void;
  onSave: (patch: EditTrackPatch) => void | Promise<void>;
}) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [bio, setBio] = useState(track.bio ?? "");
  const [lrc, setLrc] = useState(() => toLRC(track.lyrics));
  const [currentArtwork, setCurrentArtwork] = useState<string | null>(track.artwork ?? null);
  const [pickedCover, setPickedCover] = useState<{ file: File; url: string } | null>(null);
  const [pickedAudio, setPickedAudio] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!pickedCover) return;
    return () => URL.revokeObjectURL(pickedCover.url);
  }, [pickedCover]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const pickAudio = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      setError(`The audio file must be ${MAX_AUDIO_MB}MB or smaller.`);
      return;
    }
    setPickedAudio(file);
  };

  const pickCover = (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("The cover / banner must be an image.");
      return;
    }
    if (file.size > MAX_COVER_MB * 1024 * 1024) {
      setError(`The cover / banner must be smaller than ${MAX_COVER_MB}MB.`);
      return;
    }
    setPickedCover({ file, url: URL.createObjectURL(file) });
  };

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      let nextStreamUrl = track.streamUrl ?? null;
      let nextDuration = track.duration ?? null;

      if (pickedAudio) {
        const uploadedAudio = await uploadMediaFile(pickedAudio, { category: "audio" });
        nextStreamUrl = uploadedAudio.url;
        const probed = await probeAudioDuration(uploadedAudio.url);
        if (probed) nextDuration = probed;
      }

      const nextArtwork = pickedCover
        ? (await uploadMediaFile(pickedCover.file, { category: "audio" })).url
        : currentArtwork;

      const parsedLyrics = lrc.trim() ? parseLRC(lrc, nextDuration) : null;

      await onSave({
        title: title.trim() || track.title,
        artist: artist.trim() || track.artist,
        bio: bio.trim() || null,
        artwork: nextArtwork,
        streamUrl: nextStreamUrl,
        duration: nextDuration,
        lyrics: parsedLyrics && parsedLyrics.length > 0 ? parsedLyrics : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the track");
      setBusy(false);
    }
  };

  const previewSrc = pickedCover?.url ?? currentArtwork;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit track"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-[500px] max-h-[88vh] flex flex-col bg-[#0c0c0c] border border-white/10 rounded-[24px] shadow-2xl z-10 overflow-hidden"
      >
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <h3 className="text-[15px] font-normal text-white tracking-tight">
            {focusAudio ? "Re-upload & edit track" : "Edit track"}
          </h3>
          <p className="text-[12.5px] text-white/40 mt-0.5">
            Update title, artist, bio, lyrics, optional cover banner, or replace the audio file.
          </p>
        </div>

        <div className="px-4 sm:px-6 py-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-4 py-1">
            {/* Re-upload / Replace Audio File */}
            <div
              className={`rounded-2xl border p-3.5 transition-colors ${
                focusAudio || pickedAudio
                  ? "bg-[#f05e23]/[0.07] border-[#f05e23]/35"
                  : "bg-[#141414]/60 border-white/[0.06]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-white/90">Audio file</p>
                  <p className="text-[11.5px] text-white/40 truncate mt-0.5">
                    {pickedAudio
                      ? `New file: ${pickedAudio.name}`
                      : track.streamUrl
                        ? "Current audio attached · click to re-upload"
                        : "No audio uploaded yet"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {pickedAudio && (
                    <button
                      type="button"
                      onClick={() => setPickedAudio(null)}
                      className="h-8 px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11.5px] text-white/60 hover:text-white transition-colors cursor-pointer"
                    >
                      Undo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => audioInputRef.current?.click()}
                    className="h-8 px-3 rounded-xl bg-[#f05e23]/20 hover:bg-[#f05e23]/30 border border-[#f05e23]/30 text-[12px] text-white transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {pickedAudio ? "Choose another" : "Re-upload audio"}
                  </button>
                </div>
              </div>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/mp4,audio/m4a,audio/ogg,audio/flac,audio/wav,audio/*"
                className="hidden"
                onChange={(e) => {
                  pickAudio(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Optional Cover / Banner */}
            <div className="flex items-center gap-3.5">
              <label className="group relative w-20 h-20 rounded-2xl bg-[#141414] border border-white/10 overflow-hidden shrink-0 cursor-pointer transition-colors hover:border-[#f05e23]/40">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    pickCover(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                {previewSrc ? (
                  <NextImage
                    src={previewSrc}
                    alt=""
                    fill
                    sizes="80px"
                    unoptimized
                    draggable={false}
                    className="object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-white/35">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.5-3.5a2 2 0 0 0-3 0L6 20" />
                    </svg>
                  </span>
                )}
                <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] text-white">
                  {previewSrc ? "Change" : "Upload"}
                </span>
              </label>

              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="text-[13px] text-white/85">
                  Cover / Banner <span className="text-white/30 text-[11.5px]">(optional)</span>
                </span>
                <span className="text-[11.5px] text-white/40 truncate">
                  {pickedCover
                    ? pickedCover.file.name
                    : currentArtwork
                      ? "Click image to replace"
                      : "Optional cover or banner image"}
                </span>
                <span className="text-[11px] text-white/25">Up to {MAX_COVER_MB}MB · leave empty for clean icon</span>
                <div className="flex items-center gap-3 mt-0.5">
                  {pickedCover && (
                    <button
                      type="button"
                      onClick={() => setPickedCover(null)}
                      className="text-left text-[11.5px] text-white/50 hover:text-white/85 transition-colors cursor-pointer"
                    >
                      Undo change
                    </button>
                  )}
                  {previewSrc && (
                    <button
                      type="button"
                      onClick={() => {
                        setPickedCover(null);
                        setCurrentArtwork(null);
                      }}
                      className="text-left text-[11.5px] text-red-400/80 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Remove banner
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-title" className="text-[12.5px] text-white/50">Title</label>
              <input
                id="track-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                placeholder="Song title"
                className="bg-[#161616] border border-white/8 rounded-xl h-10 px-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f05e23]/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-artist" className="text-[12.5px] text-white/50">Artist</label>
              <input
                id="track-artist"
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                maxLength={200}
                placeholder="Artist name"
                className="bg-[#161616] border border-white/8 rounded-xl h-10 px-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f05e23]/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-bio" className="text-[12.5px] text-white/50">
                Bio / Caption <span className="text-white/25">(optional)</span>
              </label>
              <input
                id="track-bio"
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={180}
                placeholder="Short mood, album note, or caption shown on the player"
                className="bg-[#161616] border border-white/8 rounded-xl h-10 px-3.5 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-[#f05e23]/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="track-lyrics" className="text-[12.5px] text-white/50">
                Lyrics <span className="text-white/25">(optional · synced LRC or plain lines)</span>
              </label>
              <textarea
                id="track-lyrics"
                value={lrc}
                onChange={(e) => setLrc(e.target.value)}
                rows={4}
                placeholder={"[00:12.00] First line\n[00:16.50] Second line\n\nOr paste plain lyrics line by line"}
                className="bg-[#161616] border border-white/8 rounded-xl px-3.5 py-2.5 text-[13px] font-mono text-white placeholder:text-white/25 resize-y focus:outline-none focus:border-[#f05e23]/40"
              />
            </div>

            {error ? <p className="text-[12.5px] text-red-400">{error}</p> : null}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 px-3.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] text-[13px] text-white/70 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="h-9 px-4 rounded-xl bg-[#f05e23]/25 hover:bg-[#f05e23]/35 border border-[#f05e23]/30 text-white text-[13px] font-normal transition-all shadow-[0_0_15px_rgba(240,94,35,0.12)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[108px]"
          >
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
