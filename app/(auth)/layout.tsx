"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLobby = pathname?.includes("/lobby");

  if (isLobby) {
    return (
      <div className="relative min-h-screen bg-night text-lilac selection:bg-mint selection:text-ink">
        <div aria-hidden className="stars pointer-events-none fixed inset-0 opacity-80" />
        <div
          aria-hidden
          className="pointer-events-none fixed -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-ultraviolet/15 blur-[140px]"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed -bottom-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-magenta/15 blur-[140px]"
        />
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-night text-lilac selection:bg-mint selection:text-ink overflow-x-hidden">
      {/* Background starfield & ambient light */}
      <div aria-hidden className="stars pointer-events-none fixed inset-0 opacity-80" />
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl rounded-full bg-ultraviolet/20 blur-[130px]"
      />

      {/* Floating Header matching landing page */}
      <header className="w-full px-4 pt-6 z-30">
        <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-night/80 py-2.5 pl-5 pr-3 ring-1 ring-white/15 backdrop-blur-md">
          <Link href="/" aria-label="PartyWatch home" className="transition hover:opacity-90">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Centered Auth Card */}
      <main className="w-full max-w-md mx-auto px-4 py-10 z-20 flex-1 flex flex-col justify-center">
        <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 sm:p-10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5">
          {children}
        </div>
      </main>

      {/* Footer subtle brand mark */}
      <footer className="w-full py-6 text-center text-xs text-lilac/40 z-10">
        PartyWatch &copy; 2026 &bull; Watch YouTube in sync with friends
      </footer>
    </div>
  );
}
