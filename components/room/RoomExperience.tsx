"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Dock } from "./Dock";
import { InviteDialog, LeaveDialog, VideoDialog } from "./Dialogs";
import { ChatPanel, PeoplePanel } from "./Panels";
import { PresenceToasts } from "./PresenceToast";
import { Rail } from "./Rail";
import { RequestToasts } from "./RequestToasts";
import { Stage } from "./Stage";
import type { PanelId, RoomInfo, RoomMembership, RoomUser } from "./types";
import { useRoomSession } from "./useRoomSession";

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    useCallback(
      (callback) => {
        const mq = window.matchMedia(query);
        mq.addEventListener("change", callback);
        return () => mq.removeEventListener("change", callback);
      },
      [query],
    ),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The whole in-room screen: full-screen stage, control dock, icon rail and slide-out panels. */
export function RoomExperience({
  room,
  membership,
  user,
  onLeave,
}: {
  room: RoomInfo;
  membership: RoomMembership;
  user: RoomUser;
  onLeave: () => void;
}) {
  const session = useRoomSession({ room, membership, user });
  const { playback, canControl, actions, me } = session;
  const code = room.code;

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const stageRef = useRef<HTMLDivElement>(null);

  const [panel, setPanel] = useState<PanelId | null>(null);
  const [dialog, setDialog] = useState<"invite" | "video" | "leave" | null>(null);
  const [clock, setClock] = useState({ time: playback.time, duration: 0 });
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [quality, setQuality] = useState("auto");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [availableRates, setAvailableRates] = useState<number[]>([]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice((n) => (n === message ? null : n)), 2600);
  }, []);

  /* Playback helpers */
  const togglePlay = useCallback(() => {
    if (!playback.videoId) return;
    if (playback.playing) actions.pause(clock.time);
    else actions.play(clock.time);
  }, [playback.videoId, playback.playing, actions, clock.time]);

  const handleTime = useCallback((time: number, duration: number) => {
    setClock((c) => (Math.abs(c.time - time) < 0.2 && c.duration === duration ? c : { time, duration }));
  }, []);

  const ask = (kind: "play" | "pause") => {
    actions.requestChange(kind, { time: clock.time });
    flash("Request sent. The Host will see it.");
  };

  /* Panels + unread badge */
  const togglePanel = (id: PanelId) => {
    setPanel((p) => {
      const next = p === id ? null : id;
      if (next === "chat") setUnread(0);
      return next;
    });
  };
  const seenCount = useRef(0);
  useEffect(() => {
    const total = session.messages.length;
    const latest = session.messages[total - 1];
    if (total > seenCount.current && latest && latest.userId !== me.userId && panel !== "chat") {
      setUnread((u) => u + (total - seenCount.current));
    }
    seenCount.current = total;
  }, [session.messages, panel, me.userId]);

  /* Full screen */
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stageRef.current?.requestFullscreen().catch(() => {});
  };

  /* Keyboard: Esc closes dialog, Space plays/pauses for controls, 'C' toggles captions */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && (el.closest("input, textarea, select, button, [contenteditable='true']") || el.isContentEditable);
      if (e.code === "Space" && canControl && !typing && !dialog) {
        e.preventDefault();
        togglePlay();
      }
      if ((e.key === "c" || e.key === "C") && !typing && !dialog) {
        setCaptions((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canControl, dialog, togglePlay]);

  const panelBody = panel && (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={panel}
        initial={{ opacity: 0, x: 14 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -14 }}
        transition={{ duration: 0.15 }}
        className="h-full"
      >
        {panel === "chat" ? (
          <ChatPanel session={session} onClose={() => setPanel(null)} />
        ) : (
          <PeoplePanel session={session} onClose={() => setPanel(null)} onInvite={() => setDialog("invite")} />
        )}
      </motion.div>
    </AnimatePresence>
  );

  const incoming = canControl ? session.requests.filter((r) => r.userId !== me.userId) : [];

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0 flex overflow-hidden bg-night text-lilac selection:bg-mint selection:text-ink">
        {/* Stage + controls (this is what goes full screen) */}
        <div ref={stageRef} className="relative flex min-w-0 flex-1 flex-col bg-night">
          <Stage
            session={session}
            code={code}
            volume={volume}
            muted={muted}
            captions={captions}
            quality={quality}
            playbackRate={playbackRate}
            onTime={handleTime}
            onTogglePlay={togglePlay}
            onEnded={() => canControl && actions.pause(clock.duration)}
            onSuggest={() => setDialog("video")}
            onQualitiesAvailable={setAvailableQualities}
            onRatesAvailable={setAvailableRates}
          />
          <Dock
            session={session}
            code={code}
            time={clock.time}
            duration={clock.duration}
            volume={volume}
            muted={muted}
            captions={captions}
            onToggleCaptions={() => setCaptions((c) => !c)}
            quality={quality}
            onQuality={setQuality}
            availableQualities={availableQualities}
            playbackRate={playbackRate}
            onPlaybackRate={setPlaybackRate}
            availableRates={availableRates}
            onVolume={(v) => {
              setVolume(v);
              setMuted(false);
            }}
            onToggleMute={() => setMuted((m) => !m)}
            onTogglePlay={togglePlay}
            onInvite={() => setDialog("invite")}
            onPickVideo={() => setDialog("video")}
            isFullscreen={isFullscreen}
            onFullscreen={toggleFullscreen}
            panel={panel}
            onTogglePanel={togglePanel}
            unread={unread}
            onLeave={() => setDialog("leave")}
            onAsk={ask}
          />
        </div>

        {/* Desktop: panel slides out from the rail */}
        {isDesktop && (
          <>
            <AnimatePresence initial={false}>
              {panel && (
                <motion.aside
                  key="panel"
                  initial={{ width: 0 }}
                  animate={{ width: 340 }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="shrink-0 overflow-hidden border-l border-dc-900 bg-dc-700"
                >
                  <div className="h-full w-[340px]">{panelBody}</div>
                </motion.aside>
              )}
            </AnimatePresence>
            <Rail panel={panel} onToggle={togglePanel} unread={unread} peopleCount={session.members.length} />
          </>
        )}

        {/* Mobile: panel is a sheet */}
        <AnimatePresence>
          {!isDesktop && panel && (
            <motion.button
              key="backdrop"
              type="button"
              aria-label="Close panel"
              onClick={() => setPanel(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60"
            />
          )}
          {!isDesktop && panel && (
            <motion.aside
              key="sheet"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm shadow-2xl"
            >
              {panelBody}
            </motion.aside>
          )}
        </AnimatePresence>

        <RequestToasts requests={incoming} onResolve={actions.resolveRequest} />

        <AnimatePresence>
          {notice && (
            <motion.p
              key={notice}
              role="status"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pointer-events-none fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-xl"
            >
              {notice}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Subtle Meet / Zoom presence toasts for user joined / left / role promoted */}
        <PresenceToasts notifications={session.notifications} />

        <AnimatePresence>
          {dialog === "invite" && <InviteDialog key="invite" code={code} onClose={() => setDialog(null)} />}
          {dialog === "video" && (
            <VideoDialog
              key="video"
              mode={canControl ? "change" : "suggest"}
              onClose={() => setDialog(null)}
              onSubmit={(id) => {
                if (canControl) actions.changeVideo(id);
                else {
                  actions.requestChange("change_video", { videoId: id });
                  flash("Suggestion sent. The Host will see it.");
                }
                setDialog(null);
              }}
            />
          )}
          {dialog === "leave" && (
            <LeaveDialog
              key="leave"
              isHost={session.canManage}
              hasOtherMembers={session.members.length > 1}
              onClose={() => setDialog(null)}
              onLeaveOnly={() => {
                setDialog(null);
                actions.leaveRoom(session.canManage);
                onLeave();
              }}
              onEndParty={() => {
                setDialog(null);
                actions.closeRoom();
                onLeave();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}