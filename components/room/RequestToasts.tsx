"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { formatTime, thumbnail } from "@/lib/youtube";
import { Avatar } from "./Avatar";
import type { PendingRequest } from "./types";

const describe = (r: PendingRequest) => {
  switch (r.kind) {
    case "play":
      return "wants to play the video";
    case "pause":
      return "wants to pause the video";
    case "seek":
      return `wants to jump to ${formatTime(r.time ?? 0)}`;
    case "change_video":
      return "suggested a video";
  }
};

/** Shown to the Host and Moderators when a Participant asks for a change. */
export function RequestToasts({
  requests,
  onResolve,
}: {
  requests: PendingRequest[];
  onResolve: (id: string, approve: boolean) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {requests.map((r) => (
          <motion.div
            key={r.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="alert"
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-night border border-white/10 p-3 shadow-2xl backdrop-blur-xl"
          >
            {r.kind === "change_video" && r.videoId ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnail(r.videoId)} alt="" className="h-12 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <Avatar name={r.username} size={36} />
            )}
            <p className="min-w-0 flex-1 text-xs sm:text-sm leading-snug text-lilac/75">
              <span className="font-bold text-white">{r.username}</span> {describe(r)}
            </p>
            <button
              type="button"
              onClick={() => onResolve(r.id, false)}
              aria-label="Decline"
              className="grid size-8 place-items-center rounded-full bg-white/5 border border-white/10 text-lilac/70 transition hover:bg-magenta/20 hover:text-magenta hover:border-magenta/30 active:scale-90 cursor-pointer"
            >
              <X className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onResolve(r.id, true)}
              aria-label="Approve"
              className="grid size-8 place-items-center rounded-full bg-mint text-ink transition hover:bg-mint/85 active:scale-90 cursor-pointer"
            >
              <Check className="size-3.5" aria-hidden />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}