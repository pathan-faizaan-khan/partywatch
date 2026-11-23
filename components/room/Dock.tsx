"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Hand, Link2, Maximize, MessageSquare, Minimize, PhoneOff, Pause, Play, RotateCcw, RotateCw, Settings, Smile, Subtitles, UserPlus, Users, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { MenuItem, Popover } from "@/components/room/Popover";
import type { PanelId } from "./types";
import type { RoomSession } from "./useRoomSession";

const EMOJIS = ["❤️", "😂", "😮", "👏", "🔥", "🎉"];

const QUALITY_LABELS: Record<string, string> = {
  auto: "Auto",
  highres: "4K (Highest)",
  hd1440: "1440p (QHD)",
  hd1080: "1080p (HD)",
  hd720: "720p (HD)",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
};

export interface DockProps {
  session: RoomSession;
  code: string;
  time: number;
  duration: number;
  volume: number;
  muted: boolean;
  captions?: boolean;
  onToggleCaptions?: () => void;
  quality?: string;
  onQuality?: (q: string) => void;
  availableQualities?: string[];
  playbackRate?: number;
  onPlaybackRate?: (r: number) => void;
  availableRates?: number[];
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onInvite: () => void;
  onPickVideo: () => void;
  isFullscreen: boolean;
  onFullscreen: () => void;
  panel: PanelId | null;
  onTogglePanel: (p: PanelId) => void;
  unread: number;
  onLeave: () => void;
  onAsk: (kind: "play" | "pause") => void;
}

export function Dock(p: DockProps) {
  const { session } = p;
  const { canControl, playback, actions } = session;
  const hasVideo = Boolean(playback.videoId);
  const [scrub, setScrub] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const shown = scrub ?? Math.min(p.time, p.duration || p.time);
  const pct = p.duration ? (shown / p.duration) * 100 : 0;
  const commit = () => {
    if (scrub !== null) actions.seek(scrub);
    setScrub(null);
  };
  const skip = (delta: number) => actions.seek(Math.max(0, Math.min(p.duration || Infinity, p.time + delta)));

  return (
    <footer className="shrink-0 border-t border-white/10 bg-night/95 backdrop-blur-md px-4 py-3 sm:px-6">
      {hasVideo && (
        <div className="mb-2.5 flex items-center gap-3">
          <span className="w-12 text-right text-xs tabular-nums text-lilac/60">{formatTime(shown)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(p.duration, 1)}
            step={0.5}
            value={shown}
            disabled={!canControl}
            aria-label="Seek"
            title={canControl ? undefined : "Only the Host and Moderators can skip around"}
            onChange={(e) => setScrub(Number(e.target.value))}
            onPointerUp={commit}
            onKeyUp={commit}
            className="pw-range min-w-0 flex-1"
            style={{ ["--pct" as string]: `${pct}%` }}
          />
          <span className="w-12 text-xs tabular-nums text-lilac/60">{formatTime(p.duration)}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {/* Left: room code + volume */}
        <div className="hidden flex-1 items-center gap-3 md:flex pl-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(p.code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }).catch(() => {});
            }}
            aria-label={`Copy room code ${p.code}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-lilac/80 hover:text-white hover:border-white/20 transition cursor-pointer"
          >
            <span className="size-2 rounded-full bg-mint" aria-hidden />
            <span className="font-mono text-xs font-bold tracking-widest text-white">{p.code}</span>
            {copied ? <Check className="size-3.5 text-mint" aria-hidden /> : <Copy className="size-3.5 text-lilac/40" aria-hidden />}
          </button>
          <div className="group/vol hidden items-center gap-2 lg:flex">
            <DockButton label={p.muted ? "Unmute" : "Mute"} onClick={p.onToggleMute} small>
              {p.muted || p.volume === 0 ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
            </DockButton>
            <input
              type="range"
              min={0}
              max={100}
              value={p.muted ? 0 : p.volume}
              onChange={(e) => p.onVolume(Number(e.target.value))}
              aria-label="Volume"
              className="pw-range w-20"
              style={{ ["--pct" as string]: `${p.muted ? 0 : p.volume}%` }}
            />
          </div>
        </div>

        {/* Center: playback */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {canControl ? (
            <>
              <DockButton label="Back 10 seconds" onClick={() => skip(-10)} disabled={!hasVideo}>
                <RotateCcw className="size-4" aria-hidden />
              </DockButton>
              <button
                type="button"
                onClick={p.onTogglePlay}
                disabled={!hasVideo}
                aria-label={playback.playing ? "Pause for everyone" : "Play for everyone"}
                className="grid size-11 place-items-center rounded-full bg-white text-ink hover:bg-lilac transition active:scale-95 disabled:opacity-30 cursor-pointer shadow"
              >
                {playback.playing ? <Pause className="size-5 fill-current" aria-hidden /> : <Play className="ml-0.5 size-5 fill-current" aria-hidden />}
              </button>
              <DockButton label="Forward 10 seconds" onClick={() => skip(10)} disabled={!hasVideo}>
                <RotateCw className="size-4" aria-hidden />
              </DockButton>
              <DockButton label="Change video" onClick={p.onPickVideo}>
                <Link2 className="size-4" aria-hidden />
              </DockButton>
            </>
          ) : (
            <Popover
              trigger={({ open, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={open}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white text-ink hover:bg-lilac px-4 text-xs font-bold transition active:scale-95 shadow cursor-pointer"
                >
                  <Hand className="size-4" aria-hidden /> Ask for a change
                </button>
              )}
            >
              {hasVideo && (
                <MenuItem onClick={() => p.onAsk(playback.playing ? "pause" : "play")}>
                  {playback.playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                  Ask to {playback.playing ? "pause" : "play"}
                </MenuItem>
              )}
              <MenuItem onClick={p.onPickVideo}>
                <Link2 className="size-4" aria-hidden /> Suggest a video
              </MenuItem>
            </Popover>
          )}

          <Popover
            trigger={({ open, toggle }) => (
              <DockButton label="React" onClick={toggle} active={open}>
                <Smile className="size-4" aria-hidden />
              </DockButton>
            )}
          >
            <div className="flex gap-1 p-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => actions.sendReaction(e)}
                  aria-label={`React ${e}`}
                  className="grid size-10 place-items-center rounded-lg text-2xl transition hover:scale-125 hover:bg-white/10"
                >
                  {e}
                </button>
              ))}
            </div>
          </Popover>
        </div>

        {/* Right: panels (mobile), invite, fullscreen, leave */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex items-center gap-1.5 lg:hidden">
            <DockButton label="Chat" onClick={() => p.onTogglePanel("chat")} active={p.panel === "chat"} badge={p.unread}>
              <MessageSquare className="size-4" aria-hidden />
            </DockButton>
            <DockButton label="People" onClick={() => p.onTogglePanel("people")} active={p.panel === "people"}>
              <Users className="size-4" aria-hidden />
            </DockButton>
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            {/* Captions (Subtitles) toggle */}
            <DockButton
              label={p.captions ? "Turn off captions (C)" : "Turn on captions (C)"}
              onClick={p.onToggleCaptions || (() => {})}
              active={p.captions}
              disabled={!hasVideo}
            >
              <Subtitles className="size-4" aria-hidden />
            </DockButton>

            {/* Video Settings Popover (Quality & Speed) */}
            <Popover
              align="right"
              trigger={({ open, toggle }) => (
                <DockButton label="Video quality & speed" onClick={toggle} active={open} disabled={!hasVideo}>
                  <Settings className="size-4" aria-hidden />
                </DockButton>
              )}
            >
              <div className="w-52 py-1 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lilac/50">Quality</div>
                {(p.availableQualities && p.availableQualities.length > 0
                  ? p.availableQualities
                  : ["auto", "hd1080", "hd720", "large", "medium", "small"]
                ).map((q) => (
                  <MenuItem key={q} onClick={() => p.onQuality?.(q)}>
                    <span className="flex-1">{QUALITY_LABELS[q] || q}</span>
                    {(p.quality || "auto") === q && <Check className="size-3.5 text-mint" aria-hidden />}
                  </MenuItem>
                ))}
                <div className="my-1.5 border-t border-white/10" />
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-lilac/50">Speed</div>
                {(p.availableRates && p.availableRates.length > 0
                  ? p.availableRates
                  : [0.5, 0.75, 1, 1.25, 1.5, 2]
                ).map((r) => (
                  <MenuItem key={r} onClick={() => p.onPlaybackRate?.(r)}>
                    <span className="flex-1">{r === 1 ? "Normal (1x)" : `${r}x`}</span>
                    {(p.playbackRate || 1) === r && <Check className="size-3.5 text-mint" aria-hidden />}
                  </MenuItem>
                ))}
              </div>
            </Popover>

            <DockButton label="Invite friends" onClick={p.onInvite}>
              <UserPlus className="size-4" aria-hidden />
            </DockButton>
            <DockButton label={p.isFullscreen ? "Exit full screen" : "Full screen"} onClick={p.onFullscreen} >
              {p.isFullscreen ? <Minimize className="size-4" aria-hidden /> : <Maximize className="size-4" aria-hidden />}
            </DockButton>
          </div>
          <button
            type="button"
            onClick={p.onLeave}
            aria-label="Leave room"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-white/90 hover:bg-magenta/20 hover:text-magenta hover:border-magenta/30 transition active:scale-95 cursor-pointer"
          >
            <PhoneOff className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>
    </footer>
  );
}

export function DockButton({
  label,
  onClick,
  children,
  active,
  disabled,
  badge,
  small,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
  small?: boolean;
  className?: string;
}) {
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "relative grid place-items-center rounded-full text-lilac/80 transition active:scale-90 disabled:opacity-40 cursor-pointer",
          small ? "size-8 hover:bg-white/10 hover:text-white" : "size-9 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20",
          active && "bg-white/20 text-white border-white/30",
          className,
        )}
      >
        {children}
        {!!badge && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[16px] place-items-center rounded-full bg-magenta px-1 text-[9px] font-bold leading-4 text-white ring-1 ring-night">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-night border border-white/10 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover/tip:opacity-100 sm:block"
      >
        {label}
      </span>
    </span>
  );
}