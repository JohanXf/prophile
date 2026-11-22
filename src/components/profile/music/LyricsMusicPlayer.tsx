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

export default function LyricsMusicPlayer({
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
  onTrackChange,
  titleStyle,
  artistStyle,
  lyricStyle,
  lyricColor = "#FFFFFF",
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
  onTrackChange?: (index: number) => void;
  titleStyle?: CSSProperties;
  artistStyle?: CSSProperties;
  lyricStyle?: CSSProperties;
  lyricColor?: string;
  shuffle?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    onTrackChange?.(Math.min(index, tracks.length - 1));
  }, [index, tracks.length, onTrackChange]);

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
  const lyricsRef = useRef<HTMLDivElement | null>(null);
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

  const rafRef = useRef<number | null>(null);
  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRaf = useCallback(() => {
    stopRaf();
    const tick = () => {
      const a = audioRef.current;
      if (!a) {
        rafRef.current = null;
        return;
      }
      if (!a.paused) setElapsed(a.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopRaf]);

  useEffect(() => () => {
    stopRaf();
    audioRef.current?.pause();
    audioRef.current = null;
  }, [stopRaf]);

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
      startRaf();
    };
    const onPause = () => {
      stopRaf();
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
      stopRaf();
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
  }, [tracks, applyVolume, shuffle, randomDifferent, startRaf, stopRaf]);

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

  const GAP_MS = 3000;
  const EDGE_MS = 300;
  const lines = track?.lyrics ?? [];
  const ms = elapsed * 1000;
  const activeIdx = lines.findIndex((l, i) => {
    const next = lines[i + 1];
    return ms >= l.start && (next ? ms < next.start : ms <= l.end + 4000);
  });

  type DisplayItem =
    | { kind: "line"; line: { text: string; start: number; end: number }; idx: number }
    | { kind: "music"; key: string };
  const displayItems: DisplayItem[] = [];
  if (lines.length > 0) {
    displayItems.push({ kind: "music", key: "intro" });
  }
  lines.forEach((l, i) => {
    displayItems.push({ kind: "line", line: l, idx: i });
    const next = lines[i + 1];
    if (next && next.start - l.end > GAP_MS) {
      displayItems.push({ kind: "music", key: `gap-${i}` });
    }
  });
  if (lines.length > 0) {
    displayItems.push({ kind: "music", key: "outro" });
  }

  const activeMusicKey: string | null =
    playing && lines.length > 0
      ? (() => {
          const first = lines[0];
          if (ms < first.start) return "intro";
          for (let i = 0; i < lines.length - 1; i++) {
            const l = lines[i];
            const next = lines[i + 1];
            if (
              next.start - l.end > GAP_MS &&
              ms > l.end + EDGE_MS &&
              ms < next.start
            ) {
              return `gap-${i}`;
            }
          }
          const last = lines[lines.length - 1];
          if (ms > last.end + EDGE_MS) {
            return "outro";
          }
          return null;
        })()
      : null;

  const scrollKey = activeMusicKey
    ? `key:${activeMusicKey}`
    : activeIdx >= 0
      ? `idx:${activeIdx}`
      : null;

  useEffect(() => {
    if (!scrollKey) return;
    const box = lyricsRef.current;
    const [kind, val] = scrollKey.split(":");
    const el = box?.querySelector<HTMLElement>(
      kind === "key" ? `[data-key="${val}"]` : `[data-idx="${val}"]`
    );
    if (!box || !el) return;
    box.scrollTo({
      top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2,
      behavior: "smooth",
    });
  }, [scrollKey, index]);

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
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/85"
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

      <div className="relative px-4 pt-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl bg-[#161616] flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
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

        <div className="mt-3 flex items-center gap-2.5">
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

      {lines.length > 0 && (
        <div
          ref={lyricsRef}
          className="relative mx-4 mt-2.5 mb-4 px-3.5 py-3 rounded-xl bg-black/30 border border-white/[0.07] max-h-[124px] overflow-y-auto no-scrollbar flex flex-col gap-1.5"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)",
          }}
        >
          {displayItems.map((item) =>
            item.kind === "music" ? (
              <p
                key={item.key}
                data-key={item.key}
                style={{ ...lyricStyle, color: lyricColor }}
                className={`leading-snug transition-all duration-300 ${
                  item.key === activeMusicKey
                    ? "font-semibold opacity-100 text-[#f47b47]"
                    : "font-normal opacity-35"
                }`}
              >
                ♪
              </p>
            ) : (
              <button
                type="button"
                key={`line-${item.idx}`}
                data-idx={item.idx}
                onClick={() => {
                  const audio = audioRef.current;
                  const targetSec = item.line.start / 1000;
                  if (audio) {
                    try { audio.currentTime = targetSec; } catch {}
                    setElapsed(targetSec);
                    if (audio.paused) ensureAndPlay()?.catch(() => {});
                  } else {
                    ensureAndPlay()?.then(() => {
                      if (audioRef.current) {
                        try { audioRef.current.currentTime = targetSec; } catch {}
                        setElapsed(targetSec);
                      }
                    }).catch(() => {});
                  }
                }}
                style={{ ...lyricStyle, color: lyricColor }}
                className={`text-left leading-snug transition-all duration-300 cursor-pointer ${
                  (item.idx === activeIdx && !activeMusicKey) || (!playing && activeIdx < 0 && item.idx === 0)
                    ? "font-semibold opacity-100"
                    : "font-normal opacity-45 hover:opacity-80"
                }`}
              >
                {item.line.text}
              </button>
            )
          )}
        </div>
      )}
      {lines.length === 0 && <div className="h-3.5" />}
    </div>
  );
}
