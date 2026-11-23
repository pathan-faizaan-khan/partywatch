"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { getCreatedRoom } from "@/lib/created-rooms";
import { Logo } from "@/components/ui/Logo";
import { useLoadingBar } from "@/components/ui/LoadingBar";
import { RoomExperience } from "@/components/room/RoomExperience";
import type { RoomInfo, RoomMembership } from "@/components/room/types";

export type { RoomRole } from "@/components/room/types";

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * Room page: auth guard + room loading. Everything you see inside the room
 * lives in components/room/RoomExperience (full-screen, no site navbar).
 */
export default function RoomPage({ params }: PageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { start, done } = useLoadingBar();

  const { code: routeCode } = use(params);
  const cleanCode = routeCode.toUpperCase();

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [membership, setMembership] = useState<RoomMembership | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  // Keep loading-bar controls in a ref so loadRoom stays stable (no refetch loops).
  const bar = useRef({ start, done });
  useEffect(() => {
    bar.current = { start, done };
  });

  const userId = user?.id;
  const username = user?.username;
  const hasUser = Boolean(user);

  const loadRoom = useCallback(async () => {
    if (!userId) return;
    setStatus("loading");
    setError(null);
    bar.current.start();
    try {
      // TODO: replace with the real room API once the backend room routes exist.
      const [roomRes, memberRes] = await Promise.all([
        api.get<RoomInfo>(`/rooms/${encodeURIComponent(cleanCode)}`),
        api.get<RoomMembership>(`/rooms/${encodeURIComponent(cleanCode)}/participants/me`),
      ]);
      setRoom(roomRes);
      setMembership(memberRes);
      setStatus("ready");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        // Not in the backend yet. If this browser just created it, open it as Host.
        if (getCreatedRoom(cleanCode)) {
          setRoom({ code: cleanCode, name: `Room ${cleanCode}`, status: "active", videoId: null, playState: "paused", currentTime: 0 });
          setMembership({ userId, username: username ?? "Guest", role: "host", isOnline: true });
          setStatus("ready");
          return;
        }
        setError("We couldn't find that room");
      } else {
        setError("We couldn't join this room");
      }
      setStatus("error");
    } finally {
      bar.current.done();
    }
  }, [userId, username, cleanCode]);

  useEffect(() => {
    if (authLoading) return;
    if (!hasUser) {
      router.replace("/login");
      return;
    }
    const timer = setTimeout(() => {
      loadRoom();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, hasUser, loadRoom, router]);

  if (status === "error") {
    return (
      <div className="grid min-h-dvh place-items-center bg-dc-900 p-6 text-dc-text">
        <div className="w-full max-w-sm rounded-2xl bg-dc-800 p-8 text-center ring-1 ring-white/10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-dc-red/15 text-dc-red">
            <X className="size-8" aria-hidden />
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-white">{error ?? "Something went wrong"}</h1>
          <p className="mt-2 text-sm leading-relaxed text-dc-muted">
            Check the code <span className="font-mono font-bold text-white">{cleanCode}</span> or ask the Host for a new invite link.
          </p>
          <div className="mt-7 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={loadRoom}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blurple py-3 text-sm font-bold text-white transition hover:bg-blurple-hover active:scale-[0.98]"
            >
              <RefreshCw className="size-4" aria-hidden /> Try again
            </button>
            <button
              type="button"
              onClick={() => router.push("/lobby")}
              className="rounded-lg bg-dc-600 py-3 text-sm font-semibold text-white transition hover:bg-dc-500 active:scale-[0.98]"
            >
              Back to lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || status === "loading" || !room || !membership || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-dc-900 p-6">
        <div className="flex flex-col items-center gap-6">
          <Logo />
          <div role="status" className="flex items-center gap-3 text-sm font-medium text-dc-muted">
            <Loader2 className="size-5 animate-spin text-blurple" aria-hidden />
            Joining room <span className="font-mono font-bold text-white">{cleanCode}</span>…
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoomExperience
      key={cleanCode}
      room={room}
      membership={membership}
      user={{ id: user.id, username: user.username, avatarUrl: user.avatarUrl, email: user.email }}
      onLeave={() => router.push("/lobby")}
    />
  );
}