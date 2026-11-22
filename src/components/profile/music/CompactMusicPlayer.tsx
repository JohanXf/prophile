"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { musicCardBackground, type MusicTrack } from "@/lib/music";
import { isHostedMediaUrl } from "@/lib/media-hosts";
import { DEFAULT_VOLUME_PLACEMENT, useVolume, VolumeButton, type VolumePlacement } from "./volume";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function resolveStreamUrl(t: MusicTrack | null): string | null {
  if (!t) return null;
  const candidate = t.streamUrl || (t as MusicTrack & { audioUrl?: string }).audioUrl;
  return isHostedMediaUrl(candidate) ? (candidate as string) : null;
}

export default function CompactMusicPlayer({
  tracks,
  autoPlay = false,
  artBg = true,
  volumeControl = false,
  volumeFloating = true,
  volumePlacement = DEFAULT_VOLUME_PLACEMENT,
  volumePortalTarget = null,
  volumeContained = false,
  volumeColor = "#f05e23",
  defaultVolume = 1,
  titleStyle,
  artistStyle,
  shuffle = false,
  cardColor,
  cardOpacity,
}: {
  cardColor?: string | null;
  cardOpacity?: number | null;
  tracks: MusicTrack[];
  autoPlay?: boolean;
  artBg?: boolean;
  volumeControl?: boolean;
  volumeFloating?: boolean;
  volumePlacement?: VolumePlacement;
  volumePortalTarget?: HTMLElement | null;
  volumeContained?: boolean;
  volumeColor?: string;
  defaultVolume?: number;
  titleStyle?: CSSProperties;
  artistStyle?: CSSProperties;
  shuffle?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useLayoutEffect(() => {
    if (shuffle && tracks.length > 1) setIndex(Math.floor(Math.random() * tracks.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingUnlock, setAwaitingUnlock] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [levels, setLevels] = useState<number[] | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const levelTimerRef = useRef<number | null>(null);
  const autoNextRef = useRef(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const { volume, muted, setVolume, toggleMute, applyVolume } = useVolume(audioRef, defaultVolume);

  const randomDifferent = useCallback(
    (from: number) => {
      if (tracks.length <= 1) return from;
      let n = from;
      while (n === from) n = Math.floor(Math.random() * tracks.length);
      return n;
    },
    [tracks],
  );

  const seekFromClientX = (clientX: number) => {
    const el = barRef.current;
    const audio = audioRef.current;
    const total = audio?.duration && Number.isFinite(audio.duration) ? audio.duration : duration;
    if (!el || !audio || !total) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width)));
    try {
      audio.currentTime = frac * total;
    } catch {}
    setElapsed(frac * total);
  };

  const track = tracks[Math.min(index, tracks.length - 1)] ?? null;

  useEffect(() => () => {
    if (levelTimerRef.current !== null) window.clearInterval(levelTimerRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  const bounceRef = useRef(0);

  const startLevels = useCallback(() => {
    if (levelTimerRef.current !== null || document.hidden) return;
    const phases = [0, 1.8, 3.6, 5.1];
    const speeds = [1.15, 1.5, 0.9, 1.3];
    levelTimerRef.current = window.setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) {
        setLevels(null);
        return;
      }
      bounceRef.current += 0.72;
      const t = bounceRef.current;
      setLevels(
        phases.map((p, i) => {
          const v = 50 + 42 * Math.sin(t * (speeds[i] ?? 1) + p) + (Math.random() * 12 - 6);
          return Math.min(100, Math.max(16, Math.round(v)));
        })
      );
    }, 70);
  }, []);

  const stopLevels = useCallback(() => {
    if (levelTimerRef.current !== null) {
      window.clearInterval(levelTimerRef.current);
      levelTimerRef.current = null;
    }
    setLevels(null);
  }, []);

  const startLevelsRef = useRef(startLevels);
  useEffect(() => {
    startLevelsRef.current = startLevels;
  }, [startLevels]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (levelTimerRef.current !== null) {
          window.clearInterval(levelTimerRef.current);
          levelTimerRef.current = null;
        }
      } else if (audioRef.current && !audioRef.current.paused) {
        startLevelsRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const playAt = useCallback((target: number): Promise<void> | undefined => {
    const existing = audioRef.current;
    if (existing) {
      if (!existing.paused) return undefined;
      setLoading(true);
      return existing.play().then(() => {
        setAwaitingUnlock(false);
      }).catch((err) => {
        setLoading(false);
        throw err;
      });
    }
    const t = tracks[Math.min(target, tracks.length - 1)] ?? null;
    const url = resolveStreamUrl(t);
    if (!url) {
      setLoading(false);
      return undefined;
    }
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    audioRef.current = audio;
    applyVolume(audio);
    setLoading(true);
    setElapsed(0);
    const onTime = () => setElapsed(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onPlaying = () => {
      setLoading(false);
      setPlaying(true);
      setAwaitingUnlock(false);
      startLevels();
    };
    const onPause = () => {
      setPlaying(false);
      stopLevels();
    };
    const onEnded = () => {
      stopLevels();
      const next = shuffle ? randomDifferent(target) : target < tracks.length - 1 ? target + 1 : 0;
      if (next === target) {
        try { audio.currentTime = 0; } catch {}
        setElapsed(0);
        setLoading(true);
        audio.play().catch(() => {
          setLoading(false);
          setPlaying(false);
        });
      } else {
        audioRef.current = null;
        setElapsed(0);
        setDuration(0);
        setPlaying(false);
        setLoading(false);
        autoNextRef.current = true;
        setIndex(next);
      }
    };
    const onError = () => {
      stopLevels();
      audioRef.current = null;
      setLoading(false);
      setPlaying(false);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return audio.play().then(() => {
      setAwaitingUnlock(false);
    }).catch((err) => {
      onError();
      throw err;
    });
  }, [tracks, applyVolume, shuffle, randomDifferent, startLevels, stopLevels]);

  const ensureAndPlay = useCallback(
    (): Promise<void> | undefined => playAt(index),
    [playAt, index],
  );

  useEffect(() => {
    if (!autoNextRef.current) return;
    autoNextRef.current = false;
    ensureAndPlay()?.catch(() => {});
  }, [index, ensureAndPlay]);

  const autoTriedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay) return;
    const key = `${index}:${tracks[index]?.id ?? ""}`;
    if (autoTriedRef.current === key) return;
    autoTriedRef.current = key;
    let retry: (() => void) | null = null;
    const cleanupRetry = () => {
      if (retry) {
        window.removeEventListener("pointerdown", retry, true);
        window.removeEventListener("click", retry, true);
        window.removeEventListener("keydown", retry, true);
        window.removeEventListener("touchstart", retry, true);
        retry = null;
      }
    };
    const attempt = ensureAndPlay();
    if (attempt) {
      attempt.catch(() => {
        setAwaitingUnlock(true);
        if (retry) return;
        retry = () => {
          ensureAndPlay()
            ?.then(() => {
              setAwaitingUnlock(false);
              cleanupRetry();
            })
            .catch(() => {});
        };
        window.addEventListener("pointerdown", retry, true);
        window.addEventListener("click", retry, true);
        window.addEventListener("keydown", retry, true);
        window.addEventListener("touchstart", retry, true);
      });
    }
    return () => {
      cleanupRetry();
    };
  }, [autoPlay, index, tracks, ensureAndPlay]);

  const toggle = () => {
    const existing = audioRef.current;
    if (existing && playing) {
      existing.pause();
      setPlaying(false);
      return;
    }
    setAwaitingUnlock(false);
    ensureAndPlay()?.catch(() => {});
  };

  const step = (dir: 1 | -1) => {
    const next = shuffle ? randomDifferent(index) : (index + dir + tracks.length) % tracks.length;
    if (next === index) {
      const existing = audioRef.current;
      if (existing) {
        try { existing.currentTime = 0; } catch {}
        setElapsed(0);
        if (!playing) {
          setLoading(true);
          existing.play().catch(() => setLoading(false));
        }
      } else {
        toggle();
      }
      return;
    }
    const wasPlaying = !!audioRef.current && !audioRef.current.paused;
    audioRef.current?.pause();
    audioRef.current = null;
    stopLevels();
    setPlaying(false);
    setLoading(false);
    setElapsed(0);
    setDuration(0);
    if (wasPlaying) autoNextRef.current = true;
    setIndex(next);
  };

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const bars = levels ?? [28, 46, 22, 36];

  if (!track) return null;

  return (
    <div
      className="relative w-full rounded-[22px] border border-white/[0.11] overflow-hidden shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      style={{ backgroundColor: musicCardBackground(cardColor, cardOpacity) }}
    >
      {artBg && track.artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          loading="lazy"
          key={track.id}
          src={track.artwork}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover blur-3xl scale-150 opacity-55"
        />
      ) : null}
      {artBg && track.artwork ? (
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/80"
          aria-hidden="true"
        />
      ) : null}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden="true"
      />
      {volumeControl ? (
        <VolumeButton
          volume={volume}
          muted={muted}
          setVolume={setVolume}
          toggleMute={toggleMute}
          fixed={volumeFloating}
          placement={volumePlacement}
          portalTarget={volumePortalTarget}
          contained={volumeContained}
          color={volumeColor}
        />
      ) : null}

      <div className="relative px-4 pt-3.5 pb-4 flex flex-col gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`relative w-14 h-14 rounded-2xl bg-[#161616] flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
              playing
                ? "ring-2 ring-[#f05e23]/60 shadow-[0_0_24px_rgba(240,94,35,0.28)]"
                : "border border-white/10"
            }`}
          >
            {track.artwork ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                loading="lazy"
                src={track.artwork}
                alt={track.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#f05e23]/70">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            )}
            <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center gap-[2.5px] pb-1" aria-hidden="true">
              {bars.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${Math.max(22, Math.round(h * 0.14))}px` }}
                  className={`w-[2.5px] rounded-full transition-[height] duration-100 ease-out ${
                    levels ? "bg-[#f05e23]" : "bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="truncate leading-snug font-medium text-white" style={titleStyle}>
              {track.title}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate leading-tight text-white/75 opacity-80" style={artistStyle}>
                {track.artist}
              </span>
              {awaitingUnlock && !playing && (
                <button
                  type="button"
                  onClick={toggle}
                  className="shrink-0 text-[10.5px] font-medium text-[#f47b47] hover:text-white transition-colors cursor-pointer"
                >
                  Tap to play
                </button>
              )}
            </div>
            {track.bio ? (
              <p className="text-[11px] text-white/55 truncate leading-snug mt-0.5">
                {track.bio}
              </p>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.09] p-1 shrink-0 backdrop-blur-md">
            <button
              type="button"
              onClick={() => step(-1)}
              title={tracks.length > 1 ? "Previous track" : "Restart song"}
              className="w-8 h-8 rounded-full text-white/65 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={toggle}
              title={playing ? "Pause" : "Play"}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f47b47] to-[#f05e23] hover:from-[#f68a5c] hover:to-[#d9511b] text-white flex items-center justify-center shrink-0 transition-all shadow-[0_6px_20px_rgba(240,94,35,0.4)] active:scale-95 cursor-pointer"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : playing ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => step(1)}
              title={tracks.length > 1 ? "Next track" : "Restart song"}
              className="w-8 h-8 rounded-full text-white/65 hover:text-white hover:bg-white/10 flex items-center justify-center shrink-0 transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-mono tabular-nums text-white/55 shrink-0 w-8">
            {formatTime(elapsed)}
          </span>
          <div
            ref={barRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration || 0)}
            aria-valuenow={Math.round(elapsed)}
            tabIndex={0}
            onPointerDown={(e) => {
              (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
              setDragging(true);
              seekFromClientX(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging) seekFromClientX(e.clientX);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onKeyDown={(e) => {
              const audio = audioRef.current;
              if (!audio || !duration) return;
              if (e.key === "ArrowRight") { try { audio.currentTime = Math.min(duration, audio.currentTime + 5); } catch {} }
              if (e.key === "ArrowLeft") { try { audio.currentTime = Math.max(0, audio.currentTime - 5); } catch {} }
            }}
            className="relative flex-1 h-4 flex items-center cursor-pointer group outline-none"
          >
            <div className="w-full h-1.5 rounded-full bg-white/12 overflow-visible">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-[#d64e18] via-[#f05e23] to-[#f69267] shadow-[0_0_12px_rgba(240,94,35,0.45)]"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(240,94,35,0.8)] scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all" />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono tabular-nums text-white/45 shrink-0 w-8 text-right">
            {duration > 0 ? formatTime(duration) : formatTime(track.duration ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
