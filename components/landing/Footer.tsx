"use client";

import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Reveal } from "@/components/ui/Reveal";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

export function Footer() {
  const router = useRouter();
  const { user } = useAuth();

  const handleRoomAction = () => {
    if (user) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  return (
    <footer className="border-t border-white/10 bg-night/80 px-4 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr]">
        <Reveal>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-lilac/70">{SITE.tagline}. Great videos are better with friends.</p>
        </Reveal>
        <Reveal delay={0.1}>
          <nav aria-label="Explore">
            <p className="text-sm font-semibold text-white">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-lilac/80">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
        <Reveal delay={0.2}>
          <nav aria-label="Get started">
            <p className="text-sm font-semibold text-white">Get started</p>
            <ul className="mt-3 space-y-2 text-sm text-lilac/80">
              <li>
                <button
                  type="button"
                  onClick={handleRoomAction}
                  className="hover:text-white text-left cursor-pointer"
                >
                  Create a room
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleRoomAction}
                  className="hover:text-white text-left cursor-pointer"
                >
                  Join a room
                </button>
              </li>
            </ul>
          </nav>
        </Reveal>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs text-lilac/50">© 2026 {SITE.name}</p>
    </footer>
  );
}
