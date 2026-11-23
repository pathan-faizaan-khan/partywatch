"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Crown,
  DoorOpen,
  Eye,
  Loader2,
  LogOut,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { useLoadingBar } from "@/components/ui/LoadingBar";
import { saveCreatedRoom } from "@/lib/created-rooms";

/* ───────────────────────────── helpers ───────────────────────────── */

// Unambiguous characters only (no 0/O, 1/I) so codes are easy to read aloud.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PATTERN = /^[A-Z0-9]{4,12}$/;
const RECENT_KEY = "pw:recent-rooms";

function generateRoomCode(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return "PW" + Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** Accepts a bare code ("pw8391") or a full invite link (".../room/PW8391"). */
function extractRoomCode(input: string): string {
  const match = input.trim().match(/\/room\/([A-Za-z0-9]+)/);
  return (match ? match[1] : input).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string").slice(0, 4) : [];
  } catch {
    return [];
  }
}

function pushRecent(code: string) {
  try {
    const next = [code, ...readRecent().filter((c) => c !== code)].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: recents are a nice-to-have */
  }
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const ROLE_INFO = [
  { icon: Crown, name: "Host", tone: "text-magenta bg-magenta/15", text: "Starts the room. Picks the video, controls playback and chooses Moderators." },
  { icon: ShieldCheck, name: "Moderator", tone: "text-mint bg-mint/15", text: "The Host's co-pilot. Can play, pause, skip and change the video." },
  { icon: Eye, name: "Participant", tone: "text-lilac bg-white/10", text: "Watches in perfect sync and can ask a Moderator for changes." },
];

/* ─────────────────────────────── page ─────────────────────────────── */

export default function LobbyPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const { start, done } = useLoadingBar();

  const [draftCode, setDraftCode] = useState<string | null>(null); // generated after mount (no SSR mismatch)
  const [roomInput, setRoomInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDraftCode(generateRoomCode());
      setRecent(readRecent());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Protected route guard: redirect only when loading is finished AND there is no user.
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  /** Create a room, punch the loading bar (Zoom / Meet style), then redirect. */
  const handleCreateRoom = async () => {
    if (creating || !user) return;
    setCreating(true);
    start();
    try {
      const code = draftCode ?? generateRoomCode();
      const res = await api.post<{ code: string }>("/rooms", { code, name: `Room ${code}` });
      saveCreatedRoom({ code: res.code, createdBy: user.id, createdAt: Date.now() });
      pushRecent(res.code);
      done();
      router.push(`/room/${res.code}`);
    } catch (err) {
      done();
      setCreating(false);
      console.error("Failed to create room:", err);
    }
  };

  const joinCode = (raw: string) => {
    const code = extractRoomCode(raw);
    if (!code) {
      setJoinError("Enter a room code or paste an invite link.");
      return;
    }
    if (!CODE_PATTERN.test(code)) {
      setJoinError("Room codes are 4–12 letters and numbers.");
      return;
    }
    setJoinError(null);
    pushRecent(code);
    router.push(`/room/${code}`);
  };

  const handleJoinRoom = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    joinCode(roomInput);
  };

  if (isLoading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-night p-6 text-lilac">
        <div className="flex flex-col items-center gap-5">
          <Logo />
          <div className="flex items-center gap-2.5 text-sm text-lilac/70">
            <Loader2 className="size-4 animate-spin text-ultraviolet" aria-hidden />
            Getting your lobby ready…
          </div>
        </div>
      </div>
    );
  }

  const parsedInput = extractRoomCode(roomInput);
  const looksLikeLink = roomInput.includes("/") && parsedInput.length > 0;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-dvh overflow-x-hidden bg-night text-lilac selection:bg-mint selection:text-ink">
        {/* Backdrop */}
        <div aria-hidden className="pointer-events-none fixed inset-0">
          <div className="bg-cosmos absolute inset-0 opacity-80" />
          <div className="stars absolute inset-0 opacity-70" />
        </div>

        {/* Navbar */}
        <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
          <nav
            aria-label="Lobby"
            className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-night/75 py-2 pl-4 pr-2 ring-1 ring-white/12 backdrop-blur-md sm:pl-5"
          >
            <Link href="/" aria-label="PartyWatch home" className="transition hover:opacity-90">
              <Logo />
            </Link>
            <UserMenu
              username={user.username}
              email={user.email}
              avatarUrl={user.avatarUrl}
              onLogout={handleLogout}
            />
          </nav>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-36">
          {/* Greeting */}
          <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
            
            <h1 className="mt-5 text-balance font-display text-3xl font-black uppercase leading-[1.05] text-white sm:text-5xl">
              What are we watching tonight?
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-lilac/80 sm:text-lg">
              Start a room and send the code, or jump into one your friends already started.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-[1.15fr_1fr]">
            {/* ───── Host card ───── */}
            <motion.section
              {...fadeUp(0.1)}
              aria-labelledby="host-title"
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ultraviolet via-[#4a3fd6] to-[#2a1f8f] p-6 ring-1 ring-white/20 sm:rounded-card sm:p-10"
            >
              <Play aria-hidden className="pointer-events-none absolute -bottom-10 -right-8 size-56 fill-white/[0.07] text-transparent" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  <Sparkles className="size-3.5" aria-hidden /> You&apos;ll be the Host
                </span>
                <h2 id="host-title" className="mt-5 font-display text-2xl font-black uppercase text-white sm:text-4xl">
                  Start a party
                </h2>
                <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">
                  Pick the video and control playback. Everyone who joins sees the same moment as you.
                </p>

                {/* Code preview */}
                <div className="mt-7 rounded-panel bg-night/35 p-4 ring-1 ring-white/15 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your room code</p>
                    <button
                      type="button"
                      onClick={() => setDraftCode(generateRoomCode())}
                      disabled={creating}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw className="size-3.5" aria-hidden /> New code
                    </button>
                  </div>
                  <div className="mt-3 flex gap-1.5 sm:gap-2" role="img" aria-label={draftCode ? `Room code ${draftCode}` : "Generating room code"}>
                    {(draftCode ?? "······").split("").map((c, i) => (
                      <span
                        key={i}
                        className={cn(
                          "grid h-11 flex-1 place-items-center rounded-xl bg-white font-mono text-lg font-black text-ink sm:h-14 sm:text-2xl",
                          !draftCode && "animate-pulse bg-white/25 text-transparent",
                        )}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 truncate text-xs text-white/60">Invite link: /room/{draftCode ?? "…"}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creating || !draftCode}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-ink shadow-lg shadow-night/30 transition hover:-translate-y-0.5 hover:bg-lilac active:scale-[0.98] disabled:translate-y-0 disabled:opacity-70 sm:w-auto"
                >
                  {creating ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Play className="size-5 fill-current" aria-hidden />}
                  {creating ? "Creating your room…" : "Create room"}
                </button>
              </div>
            </motion.section>

            {/* ───── Join card ───── */}
            <motion.section
              {...fadeUp(0.2)}
              aria-labelledby="join-title"
              className="rounded-[2rem] bg-white/[0.05] p-6 ring-1 ring-white/12 sm:rounded-card sm:p-10"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-mint/15 text-mint ring-1 ring-mint/30">
                <DoorOpen className="size-6" aria-hidden />
              </span>
              <h2 id="join-title" className="mt-5 font-display text-2xl font-black uppercase text-white sm:text-4xl">
                Join a party
              </h2>
              <p className="mt-3 text-base leading-relaxed text-lilac/80">
                Got a code or an invite link from a friend? Drop it in and you&apos;re in.
              </p>

              <form onSubmit={handleJoinRoom} noValidate className="mt-7">
                <label htmlFor="room-code" className="text-xs font-semibold uppercase tracking-wider text-lilac/60">
                  Room code or invite link
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-full bg-night/60 p-1.5 ring-1 ring-white/15 transition focus-within:ring-2 focus-within:ring-mint">
                  <input
                    id="room-code"
                    type="text"
                    value={roomInput}
                    onChange={(e) => {
                      setRoomInput(e.target.value);
                      if (joinError) setJoinError(null);
                    }}
                    placeholder="PW8391 or paste a link"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={joinError ? true : undefined}
                    aria-describedby="join-hint"
                    className="min-w-0 flex-1 bg-transparent px-4 py-2 font-mono text-base font-semibold uppercase tracking-[0.15em] text-white outline-none placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-lilac/40"
                  />
                  <button
                    type="submit"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-mint px-5 py-3 text-sm font-bold text-ink transition hover:bg-mint/90 active:scale-95"
                  >
                    Join <ArrowRight className="size-4" aria-hidden />
                  </button>
                </div>
                <p
                  id="join-hint"
                  role={joinError ? "alert" : undefined}
                  className={cn("mt-2.5 min-h-5 px-2 text-xs", joinError ? "font-medium text-magenta" : "text-lilac/55")}
                >
                  {joinError ??
                    (looksLikeLink ? `Invite link detected. We'll join room ${parsedInput}.` : "Ask the Host for the code, or paste the link they sent.")}
                </p>
              </form>

              <AnimatePresence initial={false}>
                {recent.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-lilac/60">Recent rooms</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {recent.map((code) => (
                        <li key={code}>
                          <button
                            type="button"
                            onClick={() => joinCode(code)}
                            className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3.5 py-2 font-mono text-xs font-bold tracking-wider text-white ring-1 ring-white/12 transition hover:bg-white/15 active:scale-95"
                          >
                            <Clock className="size-3.5 text-lilac/60" aria-hidden />
                            {code}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* Roles explainer */}
          <motion.section {...fadeUp(0.3)} aria-labelledby="roles-title" className="mt-14 sm:mt-20">
            <h2 id="roles-title" className="text-center font-display text-lg font-black uppercase text-white sm:text-2xl">
              Who holds the remote?
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {ROLE_INFO.map(({ icon: Icon, name, tone, text }) => (
                <li key={name} className="rounded-panel bg-white/[0.04] p-5 ring-1 ring-white/10">
                  <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold", tone)}>
                    <Icon className="size-3.5" aria-hidden /> {name}
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-lilac/75">{text}</p>
                </li>
              ))}
            </ul>
          </motion.section>
        </main>
      </div>
    </MotionConfig>
  );
}

/* ───────────────────────────── user menu ───────────────────────────── */

function UserMenu({
  username,
  email,
  avatarUrl,
  onLogout,
}: {
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full bg-white/8 py-1 pl-1 pr-3 ring-1 ring-white/12 transition hover:bg-white/14"
      >
        <Avatar username={username} avatarUrl={avatarUrl} />
        <span className="hidden max-w-[9rem] truncate text-sm font-medium text-white sm:block">{username}</span>
        <ChevronDown className={cn("size-4 text-lilac/60 transition", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-3 w-64 origin-top-right rounded-panel bg-night/95 p-2 ring-1 ring-white/15 shadow-2xl backdrop-blur-md"
          >
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-white">{username}</p>
              {email && <p className="truncate text-xs text-lilac/60">{email}</p>}
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-lilac transition hover:bg-magenta/15 hover:text-magenta"
            >
              <LogOut className="size-4" aria-hidden /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Avatar({ username, avatarUrl }: { username: string; avatarUrl?: string | null }): ReactNode {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt="" className="size-8 rounded-full bg-white/10 object-cover" />
    );
  }
  return (
    <span className="grid size-8 place-items-center rounded-full bg-gradient-to-tr from-ultraviolet to-magenta text-xs font-bold text-white">
      {username.slice(0, 2).toUpperCase() || "PW"}
    </span>
  );
}