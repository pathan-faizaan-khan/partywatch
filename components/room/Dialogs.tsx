"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Link2, LogOut, PhoneOff, Share2, X } from "lucide-react";
import { parseYouTubeId, thumbnail } from "@/lib/youtube";

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] grid place-items-end bg-black/70 p-3 sm:place-items-center sm:p-6"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.96 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-night border border-white/10 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white font-display">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-lilac/70">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full text-lilac/60 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function InviteDialog({ code, onClose }: { code: string; onClose: () => void }) {
  const link = useMemo(() => `${window.location.origin}/room/${code}`, [code]);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const copy = (what: "link" | "code") => {
    navigator.clipboard.writeText(what === "link" ? link : code).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    }).catch(() => {});
  };

  return (
    <Modal title="Invite friends" subtitle="Anyone with the link or code can join your party." onClose={onClose}>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-lilac/70">Room code</p>
      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5" role="img" aria-label={`Room code ${code}`}>
          {code.split("").map((c, i) => (
            <span key={i} className="grid h-11 flex-1 place-items-center rounded-xl border border-white/10 bg-white/5 font-mono text-base font-black text-white">
              {c}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => copy("code")}
          aria-label="Copy room code"
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-lilac/80 transition hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
        >
          {copied === "code" ? <Check className="size-4 text-mint" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </button>
      </div>

      <label htmlFor="invite-link" className="mt-5 block text-xs font-bold uppercase tracking-wider text-lilac/70">Invite link</label>
      <div className="mt-2 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5">
        <input
          id="invite-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent px-3 text-xs sm:text-sm text-lilac/80 outline-none select-all"
        />
        <button
          type="button"
          onClick={() => copy("link")}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${copied === "link" ? "bg-mint text-ink" : "bg-white text-ink hover:bg-lilac"}`}
        >
          {copied === "link" ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {canShare && (
        <button
          type="button"
          onClick={() => navigator.share({ title: "Join my PartyWatch room", text: `Join my PartyWatch room ${code}`, url: link }).catch(() => {})}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/20 active:scale-[0.98] cursor-pointer"
        >
          <Share2 className="size-3.5" aria-hidden /> Share link
        </button>
      )}
    </Modal>
  );
}

export function VideoDialog({
  mode,
  onSubmit,
  onClose,
}: {
  mode: "change" | "suggest";
  onSubmit: (videoId: string) => void;
  onClose: () => void;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = parseYouTubeId(link);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return setError("That doesn't look like a YouTube link. Try copying it again.");
    onSubmit(id);
  };

  return (
    <Modal
      title={mode === "change" ? "Change the video" : "Suggest a video"}
      subtitle={mode === "change" ? "Everyone will switch to it right away." : "The Host or a Moderator will see your suggestion."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="mt-5">
        <label htmlFor="video-link" className="text-xs font-bold uppercase tracking-wider text-lilac/70">YouTube link</label>
        <div className="mt-2 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 focus-within:border-white/30 transition">
          <Link2 className="ml-1 size-4 shrink-0 text-lilac/40" aria-hidden />
          <input
            ref={inputRef}
            id="video-link"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setError(null);
            }}
            placeholder="https://youtube.com/watch?v=…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-white outline-none border-none focus:outline-none focus:ring-0 placeholder:text-lilac/35"
          />
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-magenta">{error}</p>
        )}

        {id && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail(id)} alt="Video preview" className="aspect-video w-full object-cover" />
          </motion.div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-xs font-semibold text-lilac/70 transition hover:text-white cursor-pointer">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!id}
            className="rounded-full bg-white text-ink hover:bg-lilac px-5 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer shadow"
          >
            {mode === "change" ? "Play Video" : "Send Suggestion"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function LeaveDialog({
  isHost,
  hasOtherMembers,
  onClose,
  onLeaveOnly,
  onEndParty,
}: {
  isHost: boolean;
  hasOtherMembers: boolean;
  onClose: () => void;
  onLeaveOnly: () => void;
  onEndParty: () => void;
}) {
  return (
    <Modal
      title={isHost ? "Leave or end party?" : "Leave watch party?"}
      subtitle={
        isHost
          ? hasOtherMembers
            ? "You are the host. You can end the party for everyone or leave and pass host to another member."
            : "You are the host. Ending the party will close this room."
          : "Are you sure you want to leave? You can rejoin anytime with the room code."
      }
      onClose={onClose}
    >
      <div className="mt-6 flex flex-col gap-2.5">
        {isHost ? (
          <>
            <button
              type="button"
              onClick={onEndParty}
              className="flex items-center justify-center gap-2 rounded-2xl bg-magenta text-white py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-magenta/90 active:scale-98 cursor-pointer shadow-lg"
            >
              <PhoneOff className="size-4" aria-hidden /> End party for everyone
            </button>
            {hasOtherMembers && (
              <button
                type="button"
                onClick={onLeaveOnly}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-white py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-white/10 active:scale-98 cursor-pointer"
              >
                <LogOut className="size-4 text-lilac/70" aria-hidden /> Leave party only
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full py-2 text-xs font-semibold text-lilac/60 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onLeaveOnly}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white text-ink py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-lilac active:scale-98 cursor-pointer shadow"
            >
              <LogOut className="size-4" aria-hidden /> Leave Room
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full py-2 text-xs font-semibold text-lilac/60 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}