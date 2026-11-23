"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { NAV_LINKS } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  const handleRoomAction = () => {
    if (user) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-mint to-magenta"
      />
      {/* fixed (not in flow), so the hero gradient runs behind it with no dark band */}
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-4 sm:px-4">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-night/70 py-2 pl-4 pr-2 ring-1 ring-white/15 backdrop-blur-md sm:pl-5"
        >
          <Link href="/" aria-label="PartyWatch home" onClick={() => setOpen(false)}>
            <Logo />
          </Link>
          <ul className="hidden items-center gap-8 text-sm font-medium md:flex">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-lilac/80 transition hover:text-white">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Button onClick={handleRoomAction} variant="ghost" className="hidden sm:inline-flex">
              Join room
            </Button>
            <Button onClick={handleRoomAction}>
              {user ? "Go to lobby" : "Create room"}
            </Button>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white md:hidden"
            >
              {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-2 max-w-6xl rounded-panel bg-night/95 p-4 ring-1 ring-white/15 backdrop-blur-md md:hidden"
            >
              <ul className="space-y-1">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-3 text-base font-medium text-white hover:bg-white/10"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleRoomAction();
                    }}
                    className="block w-full text-left rounded-xl px-4 py-3 text-base font-medium text-white hover:bg-white/10"
                  >
                    Join room
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleRoomAction();
                    }}
                    className="block w-full text-left rounded-xl px-4 py-3 text-base font-medium text-white hover:bg-white/10"
                  >
                    {user ? "Go to lobby" : "Create room"}
                  </button>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}