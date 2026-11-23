"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   PartyWatch loading bar — Zoom / Google Meet style.

   A thin, gradient top bar that shows while a request is in flight
   (room creation, join, sync, …). Controlled imperatively via
   `useLoadingBar()`: start() → set/inc() → done().

   Colours: night base, ultraviolet → mint → magenta gradient.
   Matches the navbar pill, buttons and accent tokens.
───────────────────────────────────────────────────────────── */

interface LoadingBarContextValue {
  progress: number;
  visible: boolean;
  start: () => void;
  set: (n: number) => void;
  inc: (amount?: number) => void;
  done: () => void;
  isActive: () => boolean;
}

const LoadingBarContext =
  createContext<LoadingBarContextValue | null>(null);

let timer: ReturnType<typeof setTimeout> | null = null;
let currentProgress = 0;
let active = false;

/** Presentational bar. Animates width + glow smoothly. */
function Bar({ progress, visible }: { progress: number; visible: boolean }) {
  const [rendered, setRendered] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setRendered(Math.min(100, Math.max(rendered, progress)));
    });
    return () => cancelAnimationFrame(id);
  }, [progress, rendered]);

  return (
    <>
      {/* Ambient glow behind the bar */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-x-0 top-0 z-[60] h-[6px] origin-left transform scale-x-0",
          "bg-gradient-to-r from-mint/40 via-ultraviolet/60 to-magenta/40 blur-xl",
          "transition-transform duration-700 ease-out",
          visible ? "scale-x-100" : "scale-x-0",
        )}
      />
      {/* The progress bar itself */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[65] h-1.5 origin-left transform",
          "bg-gradient-to-r from-mint via-ultraviolet to-magenta",
          "shadow-[0_0_12px_rgba(46,242,160,0.35),0_0_24px_rgba(109,93,252,0.25)]",
          "transition-all duration-500 ease-out",
          visible ? `scale-x-${rendered / 100}` : "scale-x-0",
        )}
      />
    </>
  );
}

/** Provider — place once at app root (layout.tsx). Holds bar state. */
export function LoadingBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgressState] = useState(0);
  const [visible, setVisible] = useState(false);

  const start = useCallback(() => {
    active = true;
    currentProgress = 0;
    setProgressState(0);
    setVisible(true);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      setProgressState(9);
      timer = setTimeout(() => setProgressState(25), 150);
    }, 50);
  }, []);

  const set = useCallback((n: number) => {
    currentProgress = Math.min(100, Math.max(0, n));
    setProgressState(currentProgress);
  }, []);

  const inc = useCallback(
    (amount = 3) => {
      set(currentProgress + amount);
    },
    [set],
  );

  const done = useCallback(() => {
    active = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    setProgressState(100);
    setTimeout(() => {
      setProgressState(0);
      setVisible(false);
      active = false;
      currentProgress = 0;
    }, 250);
  }, []);

  const isActive = useCallback(() => active, []);

  return (
    <LoadingBarContext.Provider
      value={{ progress, visible, start, set, inc, done, isActive }}
    >
      {children}
      <Bar progress={progress} visible={visible} />
    </LoadingBarContext.Provider>
  );
}

/** Hook to control the bar from any client component. */
export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext);
  if (!ctx) {
    throw new Error("useLoadingBar must be used within a LoadingBarProvider");
  }
  return ctx;
}

export default LoadingBarProvider;
