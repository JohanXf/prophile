"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";

export type VolumePlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "player";

export const DEFAULT_VOLUME_PLACEMENT: VolumePlacement = "top-left";

export function normalizeVolumePlacement(value?: string | null): VolumePlacement {
  if (
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right" ||
    value === "player"
  ) {
    return value;
  }
  return DEFAULT_VOLUME_PLACEMENT;
}

export function useVolume(audioRef: RefObject<HTMLAudioElement | null>, initialVolume = 1) {
  const initial = Math.min(1, Math.max(0, initialVolume));
  const [volume, setVolumeState] = useState(initial);
  const [muted, setMutedState] = useState(false);
  const volumeRef = useRef(initial);
  const mutedRef = useRef(false);

  const applyVolume = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      audio.volume = Math.min(1, Math.max(0, volumeRef.current));
      audio.muted = mutedRef.current;
    } catch {}
  }, []);

  const setVolume = useCallback((v: number) => {
    const c = Math.min(1, Math.max(0, v));
    volumeRef.current = c;
    setVolumeState(c);
    if (c > 0 && mutedRef.current) {
      mutedRef.current = false;
      setMutedState(false);
    }
    applyVolume(audioRef.current);
  }, [applyVolume, audioRef]);

  const [prevInitial, setPrevInitial] = useState(initial);
  if (prevInitial !== initial) {
    setPrevInitial(initial);
    setVolumeState(initial);
    if (initial > 0) setMutedState(false);
  }

  useEffect(() => {
    volumeRef.current = initial;
    if (initial > 0) mutedRef.current = false;
    applyVolume(audioRef.current);
  }, [initial, applyVolume, audioRef]);

  const toggleMute = () => {
    if (mutedRef.current || volumeRef.current === 0) {
      mutedRef.current = false;
      setMutedState(false);
      if (volumeRef.current === 0) {
        volumeRef.current = 0.5;
        setVolumeState(0.5);
      }
    } else {
      mutedRef.current = true;
      setMutedState(true);
    }
    applyVolume(audioRef.current);
  };

  return { volume, muted, setVolume, toggleMute, applyVolume };
}

function positionClasses(placement: VolumePlacement, contained: boolean): string {
  if (placement === "player") {
    return "absolute top-2.5 left-2.5 z-20";
  }
  if (contained) {
    switch (placement) {
      case "top-right":
        return "absolute top-4 right-4 z-[60] flex-row-reverse";
      case "bottom-left":
        return "absolute bottom-4 left-4 z-[60]";
      case "bottom-right":
        return "absolute bottom-4 right-4 z-[60] flex-row-reverse";
      case "top-left":
      default:
        return "absolute top-4 left-4 z-[60]";
    }
  }
  switch (placement) {
    case "top-right":
      return "fixed top-6 right-6 z-[60] flex-row-reverse";
    case "bottom-left":
      return "fixed bottom-6 left-6 z-[60]";
    case "bottom-right":
      return "fixed bottom-6 right-6 z-[60] flex-row-reverse";
    case "top-left":
    default:
      return "fixed top-6 left-6 z-[60]";
  }
}

export function VolumeButton({
  volume,
  muted,
  setVolume,
  toggleMute,
  fixed = true,
  placement = DEFAULT_VOLUME_PLACEMENT,
  portalTarget = null,
  contained = false,
  color = "#f05e23",
  label = "Volume",
}: {
  volume: number;
  muted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  fixed?: boolean;
  placement?: VolumePlacement;
  portalTarget?: HTMLElement | null;
  contained?: boolean;
  color?: string;
  label?: string;
}) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [touch, setTouch] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const glowId = useId().replace(/:/g, "");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setTouch(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (!touch || !open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [touch, open]);

  const effectivePlacement: VolumePlacement = fixed ? normalizeVolumePlacement(placement) : "player";
  const isRightSide = effectivePlacement === "top-right" || effectivePlacement === "bottom-right";

  const handleIconClick = () => {
    if (!touch) {
      toggleMute();
      return;
    }
    if (!open) setOpen(true);
    else toggleMute();
  };

  const marginExpand = isRightSide ? "ml-2" : "mr-2";
  const hoverMarginExpand = isRightSide ? "group-hover/vol:ml-2 focus-within:ml-2" : "group-hover/vol:mr-2 focus-within:mr-2";

  const sliderClass = open
    ? `w-[144px] opacity-100 ${marginExpand}`
    : touch
      ? "w-0 opacity-0"
      : `w-0 opacity-0 group-hover/vol:w-[144px] group-hover/vol:opacity-100 focus-within:w-[144px] focus-within:opacity-100 ${hoverMarginExpand}`;

  const fromClientX = (clientX: number) => {
    const el = barRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setVolume(Math.min(1, Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))));
  };

  const silent = muted || volume === 0;
  const pct = Math.round((silent ? 0 : volume) * 100);
  const accent = color || "#f05e23";

  const content = (
    <div
      ref={rootRef}
      className={`${positionClasses(effectivePlacement, contained)} pointer-events-auto group/vol flex items-center rounded-2xl bg-transparent backdrop-blur-md border border-white/10 hover:border-white/25 shadow-[0_4px_15px_rgba(0,0,0,0.1)] transition-all duration-300 p-1.5`}
      style={{ "--volume-icon": accent } as CSSProperties}
    >
      <button
        type="button"
        onClick={handleIconClick}
        title={touch ? (open ? (silent ? "Unmute" : "Mute") : label) : silent ? "Unmute" : "Mute"}
        aria-label={silent ? `Unmute ${label.toLowerCase()}` : `Mute ${label.toLowerCase()}`}
        aria-expanded={touch ? open : undefined}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--volume-icon)] opacity-80 group-hover/vol:opacity-100 transition-all duration-200 cursor-pointer active:scale-95 shrink-0 focus:outline-none"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter={`url(#vol-glow-${glowId})`}>
          <defs>
            <filter id={`vol-glow-${glowId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="currentColor" floodOpacity="0.9" />
            </filter>
          </defs>
          {silent ? (
            <>
              <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          ) : (
            <>
              <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              {volume > 0.5 ? <path d="M18.5 5.5a9.4 9.4 0 0 1 0 13" /> : null}
            </>
          )}
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out h-9 flex items-center gap-2 ${sliderClass}`}>
        <div
          ref={barRef}
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          tabIndex={0}
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
            setDrag(true);
            fromClientX(e.clientX);
          }}
          onPointerMove={(e) => { if (drag) fromClientX(e.clientX); }}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") setVolume(volume + 0.05);
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") setVolume(volume - 0.05);
          }}
          className="w-[100px] h-9 flex items-center cursor-pointer outline-none select-none shrink-0"
        >
          <div className="relative w-full h-1.5 rounded-full bg-white/15">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--volume-icon)] shadow-[0_0_8px_var(--volume-icon)]"
              style={{ width: `${pct}%` }}
            >
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_var(--volume-icon)]" />
            </div>
          </div>
        </div>
        <span className="text-[11px] font-mono tabular-nums text-white/75 w-8 text-right shrink-0 select-none">
          {pct}%
        </span>
      </div>
    </div>
  );

  if (effectivePlacement === "player") {
    return content;
  }

  if (!mounted) return null;

  const target = portalTarget ?? (contained ? null : document.body);
  if (target) {
    return createPortal(content, target);
  }
  return content;
}
