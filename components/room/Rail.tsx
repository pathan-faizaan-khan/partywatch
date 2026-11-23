"use client";

import { motion } from "framer-motion";
import { MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PanelId } from "./types";

const ITEMS = [
  { id: "chat" as const, label: "Chat", icon: MessageSquare },
  { id: "people" as const, label: "People", icon: Users },
];

/** Slim icon bar on the right edge. Click an icon to open its panel, click again to close. */
export function Rail({
  panel,
  onToggle,
  unread,
  peopleCount,
}: {
  panel: PanelId | null;
  onToggle: (p: PanelId) => void;
  unread: number;
  peopleCount: number;
}) {
  return (
    <nav aria-label="Room panels" className="flex w-14 shrink-0 flex-col items-center gap-2.5 border-l border-white/10 bg-night/95 py-4">
      {ITEMS.map(({ id, label, icon: Icon }) => {
        const active = panel === id;
        const badge = id === "chat" ? unread : 0;
        return (
          <div key={id} className="group/tip relative flex w-full justify-center">
            {/* Active marker */}
            <motion.span
              aria-hidden
              initial={false}
              animate={{ height: active ? 22 : 0, opacity: active ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              className="absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r-full bg-white"
            />
            <button
              type="button"
              onClick={() => onToggle(id)}
              aria-label={label}
              aria-pressed={active}
              className={cn(
                "relative grid size-10 place-items-center transition-all duration-200 active:scale-90 cursor-pointer",
                active
                  ? "rounded-xl bg-white/15 text-white border border-white/25 shadow-sm"
                  : "rounded-xl bg-white/5 border border-white/10 text-lilac/60 hover:text-white hover:bg-white/10 hover:border-white/20",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
              {badge > 0 && (
                <span className="absolute -bottom-1 -right-1 grid min-w-[16px] place-items-center rounded-full bg-magenta px-1 text-[9px] font-bold leading-4 text-white ring-1 ring-night">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {id === "people" && peopleCount > 0 && !active && (
                <span className="absolute -bottom-1 -right-1 grid min-w-[16px] place-items-center rounded-full bg-white/10 px-1 text-[9px] font-bold leading-4 text-lilac ring-1 ring-night">
                  {peopleCount}
                </span>
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute right-full top-1/2 mr-2.5 -translate-y-1/2 whitespace-nowrap rounded-md bg-night border border-white/10 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover/tip:opacity-100"
            >
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}