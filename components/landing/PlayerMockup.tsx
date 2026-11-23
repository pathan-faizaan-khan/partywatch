"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FastForward, Pause, Play, Rewind } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge, type Role } from "@/components/ui/RoleBadge";
import { DEMO_VIDEO_ID, ytThumb } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DURATION = 240;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const LOCKED = "Only the Host and Moderators can control playback.";

/** Interactive demo: switch your role and see who can control the room. */
export function PlayerMockup() {
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(42);
  const [myRole, setMyRole] = useState<Role>("moderator");
  const [note, setNote] = useState("Everyone in the room is watching the same moment.");
  const canControl = myRole !== "participant";

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => (t >= DURATION ? 0 : t + 1)), 1000);
    return () => clearInterval(id);
  }, [playing]);

  function act(run: () => void, message: string) {
    if (!canControl) return setNote(LOCKED);
    run();
    setNote(message);
  }

  const toggle = () =>
    act(() => setPlaying((p) => !p), playing ? "You paused. Everyone paused." : "You pressed play. Everyone is playing.");
  const jump = (to: number) =>
    act(() => setTime(Math.max(0, Math.min(DURATION, to))), `You jumped to ${fmt(Math.max(0, Math.min(DURATION, to)))}. Everyone followed.`);

  const lock = !canControl;
  const ctl = cn(
    "grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20",
    lock && "opacity-40 hover:bg-white/10",
  );

  return (
    <div className="w-full rounded-card bg-ink/80 p-3 shadow-2xl ring-1 ring-white/15 backdrop-blur sm:p-4">
      <div className="relative aspect-video overflow-hidden rounded-panel bg-gradient-to-br from-magenta/70 via-ultraviolet to-indigo-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ytThumb(DEMO_VIDEO_ID)}
          alt=""
          loading="eager"
          className="absolute inset-0 size-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-mint px-3 py-1 text-xs font-bold text-ink">
          <span className="size-2 animate-pulse rounded-full bg-ink" aria-hidden />
          Live sync
        </span>
        <AnimatePresence>
          {!playing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 grid place-items-center bg-night/50"
            >
              <Pause className="size-14 text-white" aria-hidden />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1">
        <button type="button" aria-label="Back 10 seconds" aria-disabled={lock} onClick={() => jump(time - 10)} className={ctl}>
          <Rewind className="size-4" aria-hidden />
        </button>
        <button type="button" aria-label={playing ? "Pause" : "Play"} aria-disabled={lock} onClick={toggle} className={cn(ctl, "bg-white text-ink hover:bg-lilac", lock && "bg-white/40 hover:bg-white/40")}>
          {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
        </button>
        <button type="button" aria-label="Forward 10 seconds" aria-disabled={lock} onClick={() => jump(time + 10)} className={ctl}>
          <FastForward className="size-4" aria-hidden />
        </button>
        <input
          type="range"
          min={0}
          max={DURATION}
          value={time}
          aria-label="Seek"
          aria-disabled={lock}
          onChange={(e) => jump(Number(e.target.value))}
          className="mx-2 h-1.5 flex-1 cursor-pointer accent-mint"
        />
        <span className="w-12 text-right text-xs tabular-nums text-lilac/80">{fmt(time)}</span>
      </div>

      <p aria-live="polite" className="mt-3 min-h-10 rounded-panel bg-white/5 px-4 py-2.5 text-sm text-lilac/90">
        {note}
      </p>

      <ul className="mt-3 space-y-2 px-1">
        {[
          { name: "Aarav", role: "host" as Role },
          { name: "Mira", role: "moderator" as Role },
          { name: "You", role: myRole },
        ].map((p) => (
          <li key={p.name} className="flex items-center gap-3">
            <Avatar name={p.name} className="size-8" />
            <span className="text-sm font-medium text-white">{p.name}</span>
            <RoleBadge role={p.role} />
            <span className="ml-auto flex items-center gap-1.5 text-xs text-mint">
              <span className="size-1.5 rounded-full bg-mint" aria-hidden /> in sync
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2 px-1 text-xs">
        <span className="text-lilac/70">Try it, your role:</span>
        {(["moderator", "participant"] as const).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={myRole === r}
            onClick={() => {
              setMyRole(r);
              setNote(r === "participant" ? LOCKED : "You are a Moderator now. Controls are unlocked.");
            }}
            className={cn("rounded-full px-3 py-1.5 font-semibold capitalize ring-1 ring-white/20 transition", myRole === r ? "bg-ultraviolet text-white" : "text-lilac/80 hover:bg-white/10")}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
