"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Popover({
  trigger,
  children,
  side = "top",
  align = "center",
  className,
}: {
  trigger: (o: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 8 : -8, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            onClick={() => setOpen(false)}
            className={cn(
              "absolute z-50 min-w-52 rounded-2xl bg-night border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl",
              side === "top" ? "bottom-full mb-3" : "top-full mt-2",
              align === "center" ? "left-1/2 -translate-x-1/2" : align === "right" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition",
        danger ? "text-magenta hover:bg-magenta/20 hover:text-white" : "text-lilac/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}