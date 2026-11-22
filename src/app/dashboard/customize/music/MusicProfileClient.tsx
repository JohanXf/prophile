"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import SaveBar from "@/components/dashboard/SaveBar";
import { useUnsavedChanges } from "@/components/dashboard/UnsavedChangesProvider";
import DashboardProfilePreview from "@/components/dashboard/DashboardProfilePreview";
import PlayerStyleSection, { type MusicPlayerStyle } from "@/components/dashboard/music/PlayerStyleSection";
import SearchTracksModal, { type SearchTrack } from "@/components/dashboard/music/SearchTracksModal";
import EditTrackModal, { type EditTrackPatch } from "@/components/dashboard/music/EditTrackModal";
import { updateGeneralProfile, updateMusicProfile } from "@/actions/profile";
import { toast } from "@/components/ui/toast";
import PremiumLock from "@/components/ui/premium-lock";
import { isPremiumActive } from "@/lib/premium";
import { isVideoUrl } from "@/lib/utils/media";
import { type FullUser } from "@/lib/features/users/db";

type Track = SearchTrack;

const FREE_TRACKS = 1;
const PREMIUM_TRACKS = 10;

function toTrack(raw: NonNullable<FullUser["musicTracks"]>[number]): Track {
  return {
    id: raw.id,
    title: raw.title,
    artist: raw.artist,
    bio: raw.bio ?? null,
    artwork: raw.artwork ?? null,
    album: raw.album ?? undefined,
    duration: raw.duration ?? undefined,
    streamUrl: raw.streamUrl ?? (raw as { audioUrl?: string | null }).audioUrl ?? undefined,
    lyrics: raw.lyrics ?? undefined,
  };
}

function sanitizeStyle(raw: string | null | undefined): MusicPlayerStyle {
  return raw === "lyrics" ? "lyrics" : raw === "waveform" ? "waveform" : "compact";
}

function normTrack(t: Track) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    bio: t.bio ?? null,
    artwork: t.artwork ?? null,
    album: t.album ?? null,
    duration: t.duration ?? null,
    streamUrl: t.streamUrl ?? null,
    lyrics: t.lyrics ?? null,
  };
}

export default function MusicProfileClient({ user, backgrounds }: { user: FullUser | null; backgrounds?: string[] }) {
  const router = useRouter();
  const unsavedChanges = useUnsavedChanges();
  const initialTracks: Track[] = (user?.musicTracks ?? []).map(toTrack);
  const initialPlayerStyle = sanitizeStyle(user?.musicPlayerStyle);
  const initialAutoPlay = user?.musicAutoPlay !== false;
  const initialArtBg = user?.musicPlayerArtBg ?? false;
  const initialVolumeControl = user?.musicPlayerVolume ?? true;
  const initialDefaultVolume = user?.musicPlayerDefaultVolume ?? 100;
  const initialShuffle = user?.musicPlayerShuffle ?? false;
  const initialCardColor = user?.musicCardColor ?? null;
  const initialCardOpacity = user?.musicCardOpacity ?? 100;

  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<"choose" | "search" | "upload">("upload");
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editFocusAudio, setEditFocusAudio] = useState(false);
  const [playerStyle, setPlayerStyle] = useState<MusicPlayerStyle>(initialPlayerStyle);
  const [autoPlay, setAutoPlay] = useState<boolean>(initialAutoPlay);
  const [artBg, setArtBg] = useState<boolean>(initialArtBg);
  const [volumeControl, setVolumeControl] = useState<boolean>(initialVolumeControl);
  const [defaultVolume, setDefaultVolume] = useState<number>(initialDefaultVolume);
  const [shuffle, setShuffle] = useState<boolean>(initialShuffle);
  const [cardColor, setCardColor] = useState<string | null>(initialCardColor);
  const [cardOpacity, setCardOpacity] = useState<number>(initialCardOpacity);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [mutingBg, setMutingBg] = useState(false);

  const hydratedSignatureRef = useRef<string>(
    JSON.stringify({
      id: user?.id ?? null,
      tracks: initialTracks.map(normTrack),
      playerStyle: initialPlayerStyle,
      autoPlay: initialAutoPlay,
      artBg: initialArtBg,
      volumeControl: initialVolumeControl,
      defaultVolume: initialDefaultVolume,
      shuffle: initialShuffle,
      cardColor: initialCardColor,
      cardOpacity: initialCardOpacity,
    })
  );

  // Sync state cleanly if store hydrates asynchronously after initial render
  useEffect(() => {
    const nextSig = JSON.stringify({
      id: user?.id ?? null,
      tracks: initialTracks.map(normTrack),
      playerStyle: initialPlayerStyle,
      autoPlay: initialAutoPlay,
      artBg: initialArtBg,
      volumeControl: initialVolumeControl,
      defaultVolume: initialDefaultVolume,
      shuffle: initialShuffle,
      cardColor: initialCardColor,
      cardOpacity: initialCardOpacity,
    });
    if (nextSig !== hydratedSignatureRef.current) {
      hydratedSignatureRef.current = nextSig;
      setTracks(initialTracks);
      setPlayerStyle(initialPlayerStyle);
      setAutoPlay(initialAutoPlay);
      setArtBg(initialArtBg);
      setVolumeControl(initialVolumeControl);
      setDefaultVolume(initialDefaultVolume);
      setShuffle(initialShuffle);
      setCardColor(initialCardColor);
      setCardOpacity(initialCardOpacity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const moveTrack = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setTracks((prev) => {
      const from = prev.findIndex((t) => t.id === fromId);
      const to = prev.findIndex((t) => t.id === toId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      if (!moved) return prev;
      next.splice(to, 0, moved);
      return next;
    });
  };

  const trackDragId = useRef<string | null>(null);

  const trackIdAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return el?.closest?.("[data-track-id]")?.getAttribute("data-track-id") ?? null;
  };

  const handleTrackPointerDown = (id: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    trackDragId.current = id;
    setDragId(id);
    setDropId(null);
  };

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    const from = trackDragId.current;
    if (!from) return;
    const over = trackIdAt(e.clientX, e.clientY);
    if (over && over !== from) {
      moveTrack(from, over);
      setDropId(over);
    }
  };

  const handleTrackPointerEnd = () => {
    trackDragId.current = null;
    setDragId(null);
    setDropId(null);
  };

  const handleTrackKeyDown = (id: string) => (e: React.KeyboardEvent) => {
    const dir = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const nextIdx = idx + dir;
      if (idx < 0 || nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(idx, 1);
      if (!moved) return prev;
      copy.splice(nextIdx, 0, moved);
      return copy;
    });
  };

  const hasChanges =
    playerStyle !== initialPlayerStyle ||
    autoPlay !== initialAutoPlay ||
    artBg !== initialArtBg ||
    volumeControl !== initialVolumeControl ||
    defaultVolume !== initialDefaultVolume ||
    shuffle !== initialShuffle ||
    cardColor !== initialCardColor ||
    cardOpacity !== initialCardOpacity ||
    JSON.stringify(tracks.map(normTrack)) !== JSON.stringify(initialTracks.map(normTrack));

  const count = tracks.length;
  const backgroundSoundOn = Boolean(user?.bannerBackgroundSound) && (backgrounds ?? []).some(isVideoUrl);
  const isPremium = isPremiumActive(user) || user?.role === "admin";
  const maxTracks = isPremium ? PREMIUM_TRACKS : FREE_TRACKS;

  const persistMusic = async (nextTracks: Track[], nextShuffle: boolean, successMessage: string) => {
    try {
      const res = await updateMusicProfile({
        tracks: nextTracks,
        playerStyle,
        autoPlay,
        artBg,
        volumeControl,
        defaultVolume,
        shuffle: nextShuffle,
        cardColor,
        cardOpacity,
      });
      if (res && "success" in res && res.success === false) {
        toast.error(res.error || "Failed to save music");
        return false;
      }
      if (res?.tracks) setTracks(res.tracks.map(toTrack));
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save music");
      return false;
    }
  };

  const addTrack = async (track: SearchTrack) => {
    if (tracks.length >= maxTracks) {
      toast.error(`You can only add up to ${maxTracks} track${maxTracks === 1 ? "" : "s"}.`);
      return;
    }
    const nextTracks = [...tracks, track];
    setTracks(nextTracks);
    await persistMusic(nextTracks, shuffle, "Track added and saved");
  };

  const saveEditedTrack = async (patch: EditTrackPatch) => {
    if (!editingTrack) return;
    const id = editingTrack.id;
    const nextTracks = tracks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTracks(nextTracks);
    setEditingTrack(null);
    setEditFocusAudio(false);
    await persistMusic(nextTracks, shuffle, "Track updated");
  };

  const removeTrack = async (id: string) => {
    const nextTracks = tracks.filter((t) => t.id !== id);
    const nextShuffle = nextTracks.length < 2 ? false : shuffle;
    setTracks(nextTracks);
    setShuffle(nextShuffle);
    await persistMusic(nextTracks, nextShuffle, "Track removed");
  };

  const openUploadModal = () => {
    setModalView("upload");
    setModalOpen(true);
  };

  const openSearchModal = () => {
    setModalView("search");
    setModalOpen(true);
  };

  return (
    <>
      <div
        className="flex flex-col gap-8 w-full pb-20"
        style={{ paddingRight: 'calc(var(--preview-width, 380px) + 2rem)' }}
      >
        {backgroundSoundOn && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-[#f05e23]/[0.07] border border-[#f05e23]/25 rounded-[18px] px-4 py-3.5">
            <div className="flex gap-3 min-w-0">
              <svg className="text-[#f05e23] shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[13.5px] font-normal text-white/95 tracking-tight">
                  Background video sound is currently on
                </span>
                <p className="text-[12px] text-white/45">
                  Mute your background video so your profile music player plays instead.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={mutingBg}
              onClick={async () => {
                setMutingBg(true);
                const res = await updateGeneralProfile({ bannerBackgroundSound: false });
                setMutingBg(false);
                if (res.success) {
                  toast.success("Background video muted");
                  router.refresh();
                } else {
                  toast.error(res.error || "Could not mute background video");
                }
              }}
              className="shrink-0 bg-[#f05e23]/20 hover:bg-[#f05e23]/30 border border-[#f05e23]/35 text-[12.5px] text-white font-normal rounded-xl px-3.5 py-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {mutingBg ? "Muting..." : "Mute background video"}
            </button>
          </div>
        )}

        <div className="bg-[#0c0c0c] border border-white/5 rounded-[20px] p-4 sm:p-6 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <h2 className="text-[14.5px] font-normal text-white/95 tracking-tight tabular-nums">
                Your tracks ({count}/{maxTracks})
              </h2>
              <p className="text-[12.5px] font-normal text-white/40 mt-0.5">
                Upload audio files, search songs, or edit title, bio, lyrics & cover banner.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                disabled={count >= maxTracks}
                onClick={openUploadModal}
                title={count >= maxTracks ? `Maximum ${maxTracks} tracks reached` : "Upload your own audio file"}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-normal whitespace-nowrap shrink-0 transition-all duration-200 ${
                  count >= maxTracks
                    ? "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed"
                    : "bg-[#f05e23]/22 hover:bg-[#f05e23]/32 border border-[#f05e23]/35 text-white shadow-[0_0_15px_rgba(240,94,35,0.12)] cursor-pointer active:scale-95"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload audio</span>
              </button>

              <button
                type="button"
                disabled={count >= maxTracks}
                onClick={openSearchModal}
                title={count >= maxTracks ? `Maximum ${maxTracks} tracks reached` : "Search songs with lyrics"}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-normal whitespace-nowrap shrink-0 transition-all duration-200 ${
                  count >= maxTracks
                    ? "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed"
                    : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/85 hover:text-white cursor-pointer active:scale-95"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <span>Search song</span>
              </button>
            </div>
          </div>

          {count > 0 ? (
            <div className="flex flex-col gap-2.5">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  data-track-id={track.id}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#141414]/80 hover:bg-[#171717] border rounded-2xl transition-all duration-150 ${
                    dragId === track.id
                      ? "opacity-40 border-white/20"
                      : dropId === track.id
                        ? "border-[#f05e23]/50"
                        : "border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Reorder ${track.title}`}
                      onPointerDown={handleTrackPointerDown(track.id)}
                      onPointerMove={handleTrackPointerMove}
                      onPointerUp={handleTrackPointerEnd}
                      onPointerCancel={handleTrackPointerEnd}
                      onKeyDown={handleTrackKeyDown(track.id)}
                      className="touch-none cursor-grab active:cursor-grabbing p-2 -m-2 rounded-md text-white/25 hover:text-white/65 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f05e23]/60"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center overflow-hidden shrink-0">
                      {track.artwork ? (
                        <NextImage src={track.artwork} alt="" width={40} height={40} unoptimized draggable={false} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#f05e23]/70">
                          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[13.5px] font-normal text-white/95 tracking-tight truncate">
                        {track.title}
                      </span>
                      <span className="text-[11.5px] text-white/45 truncate">
                        {track.artist}
                        {track.bio ? ` · ${track.bio}` : ""}
                        {track.lyrics && track.lyrics.length > 0 ? ` · ${track.lyrics.length} lyrics lines` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditFocusAudio(false);
                        setEditingTrack(track);
                      }}
                      title="Edit title, artist, bio, lyrics or cover"
                      className="h-8 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] hover:border-white/20 flex items-center gap-1.5 text-[12px] text-white/75 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditFocusAudio(true);
                        setEditingTrack(track);
                      }}
                      title="Re-upload audio file"
                      className="h-8 px-2.5 rounded-xl bg-[#f05e23]/12 hover:bg-[#f05e23]/22 border border-[#f05e23]/25 flex items-center gap-1.5 text-[12px] text-white/90 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span>Re-upload</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeTrack(track.id)}
                      title="Remove track"
                      aria-label={`Remove ${track.title}`}
                      className="w-8 h-8 rounded-xl bg-white/[0.03] hover:bg-red-500/12 border border-white/[0.07] hover:border-red-500/25 flex items-center justify-center text-white/50 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full border border-dashed border-white/[0.1] rounded-2xl bg-[#141414]/35 py-10 px-6 flex flex-col items-center justify-center text-center transition-colors hover:border-white/15">
              <div className="w-10 h-10 rounded-xl bg-[#f05e23]/12 border border-[#f05e23]/25 flex items-center justify-center text-[#f05e23] mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              <h3 className="text-[14px] font-normal text-white/95 tracking-tight">
                No tracks yet
              </h3>
              <p className="text-[12.5px] font-normal text-white/40 mt-1 max-w-xs leading-relaxed">
                Upload an MP3 or search for a song to start playing music on your profile.
              </p>

              <div className="flex items-center gap-2.5 mt-4">
                <button
                  type="button"
                  onClick={openUploadModal}
                  className="px-4 py-2 rounded-xl bg-[#f05e23]/22 hover:bg-[#f05e23]/32 border border-[#f05e23]/35 text-white text-[12.5px] transition-colors cursor-pointer"
                >
                  Upload audio
                </button>
                <button
                  type="button"
                  onClick={openSearchModal}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white/85 text-[12.5px] transition-colors cursor-pointer"
                >
                  Search song
                </button>
              </div>
            </div>
          )}
        </div>

        <PlayerStyleSection
          playerStyle={playerStyle}
          setPlayerStyle={setPlayerStyle}
          autoPlay={autoPlay}
          setAutoPlay={setAutoPlay}
          artBg={artBg}
          setArtBg={setArtBg}
          volumeControl={volumeControl}
          setVolumeControl={setVolumeControl}
          defaultVolume={defaultVolume}
          setDefaultVolume={setDefaultVolume}
          shuffle={shuffle}
          setShuffle={setShuffle}
          cardColor={cardColor}
          setCardColor={setCardColor}
          cardOpacity={cardOpacity}
          setCardOpacity={setCardOpacity}
          trackCount={count}
        />

        {!isPremium && (
          <div className="flex gap-3 bg-[#0c0c0c] border border-white/5 rounded-[16px] px-4 py-3.5 relative overflow-hidden">
            <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full bg-[#f05e23]/70" />
            <PremiumLock size={16} className="mt-0.5" />
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[14px] font-medium text-white/90 tracking-tight">
                Need more audio tracks?
              </span>
              <p className="text-[12.5px] text-white/40">
                Get{" "}
                <span className="inline-flex items-center gap-1 text-white font-medium">
                  <svg width="11" height="11" viewBox="0 0 512 512" fill="#c084fc" aria-hidden="true">
                    <path d="M396.31 32H264l84.19 112.26L396.31 32Zm-280.62 0 48.12 112.26L248 32H115.69ZM256 74.67 192 160h128l-64-85.33Zm166.95-23.61L376.26 160H488L422.95 51.06Zm-333.9 0L23 160h112.74L89.05 51.06ZM146.68 192H24l222.8 288h.53L146.68 192Zm218.64 0L264.67 480h.53L488 192H365.32Zm-35.93 0H182.61L256 400l73.39-208Z" />
                  </svg>
                  Premium
                </span>{" "}
                to add {PREMIUM_TRACKS - FREE_TRACKS} more.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (unsavedChanges?.isDirty) {
                  unsavedChanges.block();
                  return;
                }
                router.push("/pricing");
              }}
              className="shrink-0 self-center bg-[#f05e23]/20 hover:bg-[#f05e23]/30 text-white text-[12.5px] font-normal rounded-xl px-3.5 py-2 transition-colors cursor-pointer"
            >
              Get Premium
            </button>
          </div>
        )}
      </div>

      <DashboardProfilePreview
        user={user}
        backgrounds={backgrounds}
        overrides={{
          musicTracks: tracks,
          musicPlayerStyle: playerStyle,
          musicAutoPlay: autoPlay,
          musicPlayerArtBg: artBg,
          musicPlayerVolume: volumeControl,
          musicPlayerDefaultVolume: defaultVolume,
          musicPlayerShuffle: shuffle,
          musicCardColor: cardColor,
          musicCardOpacity: cardOpacity,
        }}
      />

      <SaveBar
        show={hasChanges}
        onSave={async () => {
          await persistMusic(tracks, shuffle, "Music settings saved");
        }}
        onRevert={() => {
          setTracks(initialTracks);
          setPlayerStyle(initialPlayerStyle);
          setAutoPlay(initialAutoPlay);
          setArtBg(initialArtBg);
          setVolumeControl(initialVolumeControl);
          setDefaultVolume(initialDefaultVolume);
          setShuffle(initialShuffle);
          setCardColor(initialCardColor);
          setCardOpacity(initialCardOpacity);
        }}
      />

      <SearchTracksModal
        open={modalOpen}
        initialView={modalView}
        onClose={() => setModalOpen(false)}
        onSelect={addTrack}
      />

      <EditTrackModal
        open={editingTrack !== null}
        track={editingTrack}
        focusAudio={editFocusAudio}
        onClose={() => {
          setEditingTrack(null);
          setEditFocusAudio(false);
        }}
        onSave={saveEditedTrack}
      />
    </>
  );
}
