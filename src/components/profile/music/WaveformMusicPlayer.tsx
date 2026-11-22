"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
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

export function seedHeights(key: string, n: number): number[] {
  let h = 2166136261;
  for (let k = 0; k < key.length; k++) {
    h ^= key.charCodeAt(k) ?? 0;
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h = (Math.imul(h ^ Math.imul(1, 2654435761), 2246822519) >>> 0);
    return ((h >>> 8) % 1000) / 1000;
  };
  const p1 = rnd() * Math.PI * 2;
  const p2 = rnd() * Math.PI * 2;
  const p3 = rnd() * Math.PI * 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const env = 0.62 + 0.38 * Math.sin(i * 0.083 + p1) * Math.sin(i * 0.057 + p2);
    const det = 0.8 + 0.2 * Math.sin(i * 0.83 + p3);
    const edge = Math.min(1, i / 8, (n - 1 - i) / 8);
    const v = (62 * env * det + (rnd() * 14 - 7)) * (0.35 + 0.65 * Math.max(0, edge));
    out.push(Math.min(96, Math.max(12, Math.round(v))));
  }
  return out;
}

const BAR_COUNT = 72;

export default function WaveformMusicPlayer({
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const heights = useMemo(() => seedHeights(track?.id ?? "x", BAR_COUNT), [track?.id]);

  useEffect(() => () => {
    audioRef.current?.pause();
    audioRef.current = null;
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
    };
    const onPause = () => {
      setPlaying(false);
    };
    const onEnded = () => {
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
  }, [tracks, applyVolume, shuffle, randomDifferent]);

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
    setPlaying(false);
    setLoading(false);
    setElapsed(0);
    setDuration(0);
    if (wasPlaying) autoNextRef.current = true;
    setIndex(next);
  };

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const playedBars = Math.floor((progress / 100) * heights.length);

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
          className="absolute inset-0 bg-gradient-to-br from-black/82 via-black/68 to-black/82"
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

      <div className="relative p-4 flex flex-col gap-3.5">
        <div className="flex items-center gap-3.5">
          <div
            className={`relative w-12 h-12 rounded-2xl bg-[#161616] flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[#f05e23]/70">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="truncate leading-snug font-medium text-white" style={titleStyle}>
              {track.title}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate leading-tight text-white/75 opacity-80" style={artistStyle}>
                {track.artist}
              </span>
              {tracks.length > 1 && (
                <span className="shrink-0 text-[10.5px] font-mono tabular-nums text-white/35">
                  {index + 1}/{tracks.length}
                </span>
              )}
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

          <div className="flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/[0.09] p-1 shrink-0 backdrop-blur-md">
            <button
              type="button"
              onClick={() => step(-1)}
              title="Previous track"
              className="w-7 h-7 rounded-full text-white/65 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={toggle}
              title={playing ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f47b47] to-[#f05e23] hover:from-[#f68a5c] hover:to-[#d9511b] text-white flex items-center justify-center transition-all shadow-[0_6px_18px_rgba(240,94,35,0.4)] active:scale-95 cursor-pointer"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : playing ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              title="Next track"
              className="w-7 h-7 rounded-full text-white/65 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 5h2v14h-2zM4 5v14l11-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-black/30 border border-white/[0.06] px-3 py-2 flex items-center gap-2.5">
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
            className="flex-1 h-11 flex items-center gap-[2.5px] cursor-pointer group outline-none"
          >
            {heights.map((h, i) => {
              const isPlayed = i < playedBars;
              const isHead = i === playedBars && playing;
              return (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 min-w-[2px] rounded-full transition-colors duration-150 ${
                    isHead
                      ? "bg-[#fcd3be] shadow-[0_0_8px_rgba(240,94,35,0.85)]"
                      : isPlayed
                        ? "bg-gradient-to-t from-[#d64e18] to-[#f47b47]"
                        : "bg-white/18 group-hover:bg-white/30"
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[11px] font-mono tabular-nums text-white/45 shrink-0 w-8 text-right">
            {duration > 0 ? formatTime(duration) : formatTime(track.duration ?? 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
