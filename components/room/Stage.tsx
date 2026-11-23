"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Hand, Link2, Play } from "lucide-react";
import { parseYouTubeId } from "@/lib/youtube";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "./Avatar";
import { YouTubePlayer } from "./YoutubePlayer";
import type { RoomSession } from "./useRoomSession";

export function Stage({
  session,
  code,
  volume,
  muted,
  captions = false,
  quality = "auto",
  playbackRate = 1,
  onTime,
  onTogglePlay,
  onEnded,
  onSuggest,
  onQualitiesAvailable,
  onRatesAvailable,
}: {
  session: RoomSession;
  code: string;
  volume: number;
  muted: boolean;
  captions?: boolean;
  quality?: string;
  playbackRate?: number;
  onTime: (time: number, duration: number) => void;
  onTogglePlay: () => void;
  onEnded: () => void;
  onSuggest: () => void;
  onQualitiesAvailable?: (levels: string[]) => void;
  onRatesAvailable?: (rates: number[]) => void;
}) {
  const { playback, reactions, canControl, actions, members } = session;

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
      {playback.videoId ? (
        <>
          <YouTubePlayer
            playback={playback}
            volume={volume}
            muted={muted}
            captions={captions}
            quality={quality}
            playbackRate={playbackRate}
            onTime={onTime}
            onEnded={onEnded}
            onQualitiesAvailable={onQualitiesAvailable}
            onRatesAvailable={onRatesAvailable}
          />
          {/* Subtle watermark logo on active stream (YouTube broadcast style) */}
          <div className="pointer-events-none absolute top-4 left-4 z-20 opacity-30 transition-opacity hover:opacity-80">
            <Logo />
          </div>
          {/* Blocks the embedded player's own click handling so only shared controls move the video. */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={canControl ? (playback.playing ? "Pause" : "Play") : "Video"}
            onClick={canControl ? onTogglePlay : undefined}
            className={canControl ? "absolute inset-0 cursor-pointer" : "absolute inset-0 cursor-default"}
          />
          <AnimatePresence>
            {!playback.playing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 grid place-items-center"
              >
                <span className="grid size-20 place-items-center rounded-full bg-black/55 ring-1 ring-white/20 backdrop-blur">
                  <Play className="ml-1 size-9 fill-white text-white" aria-hidden />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        <EmptyStage code={code} canControl={canControl} members={members} onPick={actions.changeVideo} onSuggest={onSuggest} />
      )}

      {/* Floating reactions */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -280, scale: [0.5, 1.3, 1, 1] }}
              transition={{ duration: 2.4, ease: "easeOut" }}
              style={{ left: `${r.x}%` }}
              className="absolute bottom-6 text-4xl sm:text-5xl"
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyStage({
  code,
  canControl,
  members,
  onPick,
  onSuggest,
}: {
  code: string;
  canControl: boolean;
  members: RoomSession["members"];
  onPick: (id: string) => void;
  onSuggest: () => void;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = parseYouTubeId(link);
    if (!id) return setError("That doesn't look like a YouTube link. Try copying it again.");
    onPick(id);
  };

  return (
    <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-night p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md text-center space-y-5"
      >
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className="space-y-2">
          <h1 className="text-balance text-2xl font-black uppercase tracking-tight text-white sm:text-3xl font-display">
            {canControl ? "What are we watching?" : "Waiting for the show to start"}
          </h1>
          <p className="text-sm leading-relaxed text-lilac/70">
            {canControl
              ? "Paste a YouTube link and everyone in the room will watch it with you."
              : "The Host will pick a video soon. You can suggest one too."}
          </p>
        </div>

        {canControl ? (
          <form onSubmit={submit} className="mt-4">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5 focus-within:border-white/30 transition shadow-inner">
              <Link2 className="ml-3 size-4 shrink-0 text-lilac/40" aria-hidden />
              <label htmlFor="stage-link" className="sr-only">YouTube link</label>
              <input
                id="stage-link"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError(null);
                }}
                placeholder="Paste a YouTube link"
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white placeholder:text-lilac/35 outline-none border-none focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="rounded-full bg-white text-ink px-5 py-2 text-xs font-bold transition hover:bg-lilac active:scale-95 cursor-pointer shadow"
              >
                Watch
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-magenta">{error}</p>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={onSuggest}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white text-ink px-6 py-2.5 text-xs font-bold transition hover:bg-lilac active:scale-95 cursor-pointer"
          >
            <Hand className="size-4" aria-hidden /> Suggest a video
          </button>
        )}

        {/* Who's here + code */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <ul className="flex -space-x-2" aria-label="People in the room">
            {members.slice(0, 6).map((m) => (
              <li key={m.userId} title={m.username} className="rounded-full ring-2 ring-night">
                <Avatar name={m.username} src={m.avatarUrl} size={34} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }).catch(() => {});
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-lilac/75 transition hover:text-white hover:border-white/20 cursor-pointer"
          >
            <span>Room code</span>
            <span className="font-mono text-xs font-bold tracking-widest text-white bg-white/10 px-2 py-0.5 rounded-md">{code}</span>
            {copied ? <Check className="size-3.5 text-mint" aria-hidden /> : <Copy className="size-3.5 text-lilac/40" aria-hidden />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}