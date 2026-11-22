"use client";

import { useMemo } from "react";
import { seedHeights } from "@/components/profile/music/WaveformMusicPlayer";
import ColorPickerInput from "@/components/ui/color-picker";
import { DEFAULT_MUSIC_CARD_COLOR } from "@/lib/music";

export type MusicPlayerStyle = "compact" | "waveform" | "lyrics";

interface PlayerStyleOption {
  id: MusicPlayerStyle;
  name: string;
  description: string;
  enabled: boolean;
}

const PLAYER_STYLES: PlayerStyleOption[] = [
  {
    id: "compact",
    name: "Compact player",
    description: "Artwork, title and play button in a slim row.",
    enabled: true,
  },
  {
    id: "waveform",
    name: "Waveform player",
    description: "Full-width scrubable waveform, SoundCloud style.",
    enabled: true,
  },
  {
    id: "lyrics",
    name: "Lyrics player",
    description: "Karaoke-style synced lyrics panel.",
    enabled: true,
  },
];

function CompactPlayerMock() {
  return (
    <div className="relative w-full my-auto rounded-2xl bg-[#101010] border border-white/10 p-2.5 flex flex-col gap-2 overflow-hidden" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#f05e23]/15 ring-1 ring-[#f05e23]/40 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="h-2 w-2/3 rounded bg-white/20" />
          <div className="h-1.5 w-2/5 rounded bg-white/10" />
        </div>
        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-white/[0.06] border border-white/10 p-0.5 shrink-0">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f47b47] to-[#f05e23] flex items-center justify-center shadow-[0_2px_10px_rgba(240,94,35,0.4)]">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff" className="ml-px">
              <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[7.5px] font-mono text-white/45 shrink-0">0:42</span>
        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-[#d64e18] to-[#f69267]" />
        </div>
        <span className="text-[7.5px] font-mono text-white/40 shrink-0">2:30</span>
      </div>
    </div>
  );
}

function LyricsPlayerMock() {
  return (
    <div className="w-full rounded-2xl bg-[#101010] border border-white/10 p-2.5 flex flex-col gap-2" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-[#f05e23]/15 ring-1 ring-[#f05e23]/40 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="h-2 w-1/2 rounded bg-white/20" />
          <div className="h-1.5 w-1/3 rounded bg-white/10" />
        </div>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#f47b47] to-[#f05e23] flex items-center justify-center shrink-0">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff" className="ml-px">
            <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" />
          </svg>
        </div>
      </div>
      <div className="rounded-lg bg-black/30 border border-white/[0.06] px-2 py-1.5 flex flex-col gap-0.5">
        <p className="text-[9px] text-white/25 truncate">midnight drives and city lights</p>
        <p className="text-[10.5px] text-white font-medium truncate">we were never going home</p>
        <p className="text-[9px] text-white/25 truncate">dancing till the morning comes</p>
      </div>
    </div>
  );
}

function WaveformPlayerMock() {
  const bars = useMemo(() => seedHeights("preview", 34), []);
  return (
    <div className="w-full my-auto rounded-2xl bg-[#101010] border border-white/10 p-2.5 flex flex-col gap-2" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-[#f05e23]/15 ring-1 ring-[#f05e23]/40 flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="h-2 w-1/2 rounded bg-white/20" />
          <div className="h-1.5 w-1/3 rounded bg-white/10" />
        </div>
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f47b47] to-[#f05e23] flex items-center justify-center shrink-0 shadow-[0_2px_10px_rgba(240,94,35,0.35)]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="#fff" className="ml-px">
            <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" />
          </svg>
        </div>
      </div>
      <div className="rounded-lg bg-black/30 border border-white/[0.06] px-2 py-1 flex items-center gap-1.5">
        <span className="text-[7.5px] font-mono text-white/45 shrink-0">0:29</span>
        <div className="flex-1 min-w-0 overflow-hidden flex items-center gap-[2px] h-6">
          {bars.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 min-w-0 rounded-full ${i < 13 ? "bg-gradient-to-t from-[#d64e18] to-[#f47b47]" : "bg-white/20"}`}
            />
          ))}
        </div>
        <span className="text-[7.5px] font-mono text-white/40 shrink-0">2:30</span>
      </div>
    </div>
  );
}

interface PlayerStyleSectionProps {
  playerStyle: MusicPlayerStyle;
  setPlayerStyle: (val: MusicPlayerStyle) => void;
  autoPlay: boolean;
  setAutoPlay: (val: boolean) => void;
  artBg: boolean;
  setArtBg: (val: boolean) => void;
  volumeControl: boolean;
  setVolumeControl: (val: boolean) => void;
  defaultVolume: number;
  setDefaultVolume: (val: number) => void;
  shuffle: boolean;
  setShuffle: (val: boolean) => void;
  cardColor: string | null;
  setCardColor: (val: string | null) => void;
  cardOpacity: number;
  setCardOpacity: (val: number) => void;
  trackCount: number;
}

export default function PlayerStyleSection({ playerStyle, setPlayerStyle, autoPlay, setAutoPlay, artBg, setArtBg, volumeControl, setVolumeControl, defaultVolume, setDefaultVolume, shuffle, setShuffle, cardColor, setCardColor, cardOpacity, setCardOpacity, trackCount }: PlayerStyleSectionProps) {
  return (
    <div className="bg-[#0c0c0c] border border-white/5 rounded-[20px] p-4 sm:p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f05e23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
        <div className="flex flex-col">
          <span className="text-[14px] font-normal text-white/90 tracking-tight">Player style</span>
          <p className="text-[12.5px] text-white/40">How your playlist looks on your profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLAYER_STYLES.map((option) => {
          const isSelected = playerStyle === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={!option.enabled}
              onClick={() => setPlayerStyle(option.id)}
              aria-pressed={isSelected}
              className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 text-left transition-all ${
                !option.enabled
                  ? "bg-[#101010]/50 border-white/5 opacity-50 cursor-not-allowed"
                  : isSelected
                    ? "bg-[#1f0e08] border-[#f05e23]/40 cursor-pointer"
                    : "bg-[#141414]/70 border-white/5 hover:border-white/15 cursor-pointer"
              }`}
            >
              <span className="text-[13px] font-medium text-white/90">{option.name}</span>
              {option.id === "compact" ? (
                <CompactPlayerMock />
              ) : option.id === "lyrics" ? (
                <LyricsPlayerMock />
              ) : option.id === "waveform" ? (
                <WaveformPlayerMock />
              ) : (
                <span className="w-full aspect-[16/7] rounded-xl bg-[#161616] border border-white/5 flex items-center justify-center text-[11px] text-white/25">
                  Soon
                </span>
              )}
              <span className="text-[11.5px] text-white/35 leading-snug">{option.description}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={autoPlay}
        onClick={() => setAutoPlay(!autoPlay)}
        className="flex items-center justify-between gap-3 rounded-2xl bg-[#141414]/70 border border-white/5 hover:border-white/15 px-4 py-3.5 text-left transition-all cursor-pointer"
      >
        <span className="flex flex-col">
          <span className="text-[13px] font-normal text-white/90">Autoplay on profile</span>
          <span className="text-[11.5px] text-white/35 leading-snug">Automatically start playing your soundtrack when visitors open your page</span>
        </span>
        <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${autoPlay ? "bg-[#f05e23]" : "bg-white/10"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoPlay ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={artBg}
        onClick={() => setArtBg(!artBg)}
        className="flex items-center justify-between gap-3 rounded-2xl bg-[#141414]/70 border border-white/5 hover:border-white/15 px-4 py-3.5 text-left transition-all cursor-pointer"
      >
        <span className="flex flex-col">
          <span className="text-[13px] font-normal text-white/90">Artwork background</span>
          <span className="text-[11.5px] text-white/35 leading-snug">Blurry song cover behind the player, changes per track</span>
        </span>
        <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${artBg ? "bg-[#f05e23]" : "bg-white/10"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${artBg ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>

      <div className="rounded-2xl bg-[#141414]/70 border border-white/5 px-4 py-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[13px] font-normal text-white/90">Card background</span>
            <span className="text-[11.5px] text-white/35 leading-snug">Color and transparency of the player card</span>
          </span>
          {(cardColor !== null || cardOpacity !== 100) && (
            <button
              type="button"
              onClick={() => {
                setCardColor(null);
                setCardOpacity(100);
              }}
              className="text-[11.5px] text-white/45 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              Reset
            </button>
          )}
        </div>
        <ColorPickerInput value={cardColor ?? DEFAULT_MUSIC_CARD_COLOR} onChange={(v) => setCardColor(v.toLowerCase())} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-white/60">Opacity</span>
          <span className="text-[12px] font-mono text-white/60 tabular-nums shrink-0">{cardOpacity}%</span>
        </div>
        <div className="relative flex items-center h-5 group w-full">
          <div className="absolute w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="absolute h-full bg-[#f05e23]" style={{ width: `${cardOpacity}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={cardOpacity}
            onChange={(e) => setCardOpacity(Number(e.target.value))}
            aria-label="Music card opacity"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div
            className="absolute w-4 h-4 bg-[#050505] border-[2px] border-[#f05e23] rounded-full pointer-events-none transition-transform group-active:scale-110 shadow-lg"
            style={{ left: `calc(${cardOpacity}% - 8px)` }}
          />
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={volumeControl}
        onClick={() => setVolumeControl(!volumeControl)}
        className="flex items-center justify-between gap-3 rounded-2xl bg-[#141414]/70 border border-white/5 hover:border-white/15 px-4 py-3.5 text-left transition-all cursor-pointer"
      >
        <span className="flex flex-col">
          <span className="text-[13px] font-normal text-white/90">Volume control</span>
          <span className="text-[11.5px] text-white/35 leading-snug">Frosted volume button on the player — hover for slider, click to mute</span>
        </span>
        <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${volumeControl ? "bg-[#f05e23]" : "bg-white/10"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${volumeControl ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>

      <div className="rounded-2xl bg-[#141414]/70 border border-white/5 px-4 py-3.5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="text-[13px] font-normal text-white/90">Default volume</span>
            <span className="text-[11.5px] text-white/35 leading-snug">
              Volume visitors hear when your profile opens. They can still lower or raise it.
            </span>
          </span>
          <span className="text-[12px] font-mono text-white/60 tabular-nums shrink-0">{defaultVolume}%</span>
        </div>

        <div className="relative flex items-center h-5 group w-full">
          <div className="absolute w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="absolute h-full bg-[#f05e23]" style={{ width: `${defaultVolume}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={defaultVolume}
            onChange={(e) => setDefaultVolume(Number(e.target.value))}
            aria-label="Default music volume"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          <div
            className="absolute w-4 h-4 bg-[#050505] border-[2px] border-[#f05e23] rounded-full pointer-events-none transition-transform group-active:scale-110 shadow-lg"
            style={{ left: `calc(${defaultVolume}% - 8px)` }}
          />
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={shuffle}
        disabled={trackCount < 2}
        onClick={() => setShuffle(!shuffle)}
        title={trackCount < 2 ? "Add at least 2 tracks to use shuffle" : undefined}
        className={`flex items-center justify-between gap-3 rounded-2xl bg-[#141414]/70 border border-white/5 px-4 py-3.5 text-left transition-all ${trackCount < 2 ? "opacity-40 cursor-not-allowed" : "hover:border-white/15 cursor-pointer"}`}
      >
        <span className="flex flex-col">
          <span className="text-[13px] font-normal text-white/90">Shuffle mode</span>
          <span className="text-[11.5px] text-white/35 leading-snug">{trackCount < 2 ? "Add at least 2 tracks to use shuffle" : "Play tracks in random order instead of sequence"}</span>
        </span>
        <span className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${shuffle && trackCount >= 2 ? "bg-[#f05e23]" : "bg-white/10"}`}>
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${shuffle && trackCount >= 2 ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
    </div>
  );
}
