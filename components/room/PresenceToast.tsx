"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Crown, ShieldCheck } from "lucide-react";
import { Avatar } from "./Avatar";

export interface PresenceNotification {
  id: string;
  type: "joined" | "left" | "role" | "info";
  username: string;
  avatarUrl?: string | null;
  message: string;
  role?: string;
}

export function PresenceToasts({ notifications }: { notifications: PresenceNotification[] }) {
  // Cap at 3 notifications max to prevent spam (Meet / Zoom style)
  const visible = notifications.slice(-3);

  return (
    <div className="pointer-events-none fixed bottom-20 left-6 z-40 flex flex-col gap-2">
      <AnimatePresence>
        {visible.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-night/90 px-3.5 py-1.5 text-xs shadow-2xl backdrop-blur-xl"
          >
            {n.type === "joined" && (
              <>
                <span className="size-2 shrink-0 rounded-full bg-mint" aria-hidden />
                <Avatar name={n.username} src={n.avatarUrl} size={20} />
                <span className="font-semibold text-white">{n.username}</span>
                <span className="text-lilac/70">joined</span>
              </>
            )}

            {n.type === "left" && (
              <>
                <span className="size-2 shrink-0 rounded-full bg-white/30" aria-hidden />
                <span className="font-semibold text-white/90">{n.username}</span>
                <span className="text-lilac/50">left</span>
              </>
            )}

            {n.type === "role" && (
              <>
                {n.role === "host" ? (
                  <Crown className="size-3.5 shrink-0 text-mint" aria-hidden />
                ) : (
                  <ShieldCheck className="size-3.5 shrink-0 text-ultraviolet" aria-hidden />
                )}
                <span className="font-semibold text-white">{n.username}</span>
                <span className="text-lilac/80">{n.message}</span>
              </>
            )}

            {n.type === "info" && (
              <>
                <span className="size-2 shrink-0 rounded-full bg-magenta animate-pulse" aria-hidden />
                <span className="font-medium text-lilac/90">{n.message}</span>
              </>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
