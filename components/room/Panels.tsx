"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Crown, MessageSquare, MoreHorizontal, Send, ShieldCheck, UserMinus, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, colorFor } from "./Avatar";
import { MenuItem, Popover } from "@/components/room/Popover";
import type { ChatMessage, Member } from "./types";
import type { RoomSession } from "./useRoomSession";

export function PanelShell({
  title,
  onClose,
  action,
  children,
}: {
  title: string;
  onClose: () => void;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex h-full min-h-0 flex-col bg-night border-l border-white/10">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="grid size-8 place-items-center rounded-full text-lilac/60 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

/* ───────────────────────────── Chat ───────────────────────────── */

const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function ChatPanel({ session, onClose }: { session: RoomSession; onClose: () => void }) {
  const { messages, me, actions } = session;
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    actions.sendMessage(text);
    setText("");
  };

  return (
    <PanelShell title="Chat" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-dc-600 text-dc-muted">
                <MessageSquare className="size-7" aria-hidden />
              </span>
              <p className="mt-4 text-base font-bold text-white">It&apos;s quiet in here</p>
              <p className="mt-1 text-sm text-dc-muted">Say hi, or send a reaction while you watch.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {messages.map((m, i) => (
              <MessageRow key={m.id} m={m} prev={messages[i - 1]} mine={m.userId === me.userId} />
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="shrink-0 p-3 border-t border-white/10">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-4 pr-1 focus-within:border-white/30 transition">
          <label htmlFor="chat-input" className="sr-only">Message the room</label>
          <input
            id="chat-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Message the room..."
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-xs sm:text-sm text-white outline-none border-none focus:outline-none focus:ring-0 placeholder:text-lilac/35"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Send message"
            className="grid size-8 place-items-center rounded-full bg-white text-ink transition hover:bg-lilac active:scale-90 disabled:bg-transparent disabled:text-lilac/30 cursor-pointer"
          >
            <Send className="size-3.5" aria-hidden />
          </button>
        </div>
      </form>
    </PanelShell>
  );
}

function MessageRow({ m, prev, mine }: { m: ChatMessage; prev?: ChatMessage; mine: boolean }) {
  const grouped = prev && prev.userId === m.userId && m.createdAt - prev.createdAt < 5 * 60_000;
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("group flex gap-3 rounded-lg px-2 py-0.5 hover:bg-black/10", !grouped && "mt-3")}
    >
      <div className="w-10 shrink-0 pt-0.5">
        {grouped ? (
          <span className="hidden pt-1 text-right text-[10px] text-dc-faint group-hover:block">{clock(m.createdAt)}</span>
        ) : (
          <Avatar name={m.username} size={40} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <p className="flex items-baseline gap-2">
            <span className="truncate text-[15px] font-semibold" style={{ color: colorFor(m.username) }}>
              {m.username}
              {mine && <span className="ml-1.5 text-xs font-medium text-dc-faint">(you)</span>}
            </span>
            <span className="text-xs text-dc-faint">{clock(m.createdAt)}</span>
          </p>
        )}
        <p className="break-words text-[15px] leading-snug text-dc-text">{m.body}</p>
      </div>
    </motion.li>
  );
}

/* ───────────────────────────── People ───────────────────────────── */

export function PeoplePanel({
  session,
  onClose,
  onInvite,
}: {
  session: RoomSession;
  onClose: () => void;
  onInvite: () => void;
}) {
  const { members, me, canManage, actions } = session;
  const hosts = members.filter((m) => m.role === "host");
  const mods = members.filter((m) => m.role === "moderator");
  const rest = members.filter((m) => m.role === "participant" || m.role === "viewer");

  return (
    <PanelShell title="People" onClose={onClose}>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <button
          type="button"
          onClick={onInvite}
          className="mx-1 mt-3 flex w-[calc(100%-0.5rem)] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 py-2 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/25 active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="size-3.5" aria-hidden /> Invite friends
        </button>
        <Group title="Host" list={hosts} meId={me.userId} canManage={canManage} actions={actions} />
        <Group title="Moderators" list={mods} meId={me.userId} canManage={canManage} actions={actions} />
        <Group title="Watching" list={rest} meId={me.userId} canManage={canManage} actions={actions} />
      </div>
    </PanelShell>
  );
}

function Group({
  title,
  list,
  meId,
  canManage,
  actions,
}: {
  title: string;
  list: Member[];
  meId: string;
  canManage: boolean;
  actions: RoomSession["actions"];
}) {
  if (list.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wide text-dc-faint">
        {title} — {list.length}
      </h3>
      <ul>
        {list.map((m) => (
          <li key={m.userId} className="group flex items-center gap-3 rounded-lg px-3 py-1.5 hover:bg-dc-600/60">
            <Avatar name={m.username} src={m.avatarUrl} size={36} online={m.isOnline} className="[&>span:last-child]:ring-dc-700" />
            <span
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 text-[15px] font-semibold",
                m.role === "host" ? "text-dc-yellow" : m.role === "moderator" ? "text-dc-green" : "text-dc-text",
              )}
            >
              <span className="truncate">{m.username}</span>
              {m.userId === meId && <span className="text-xs font-medium text-dc-faint">(you)</span>}
              {m.role === "host" && <Crown className="size-4 shrink-0" aria-label="Host" />}
              {m.role === "moderator" && <ShieldCheck className="size-4 shrink-0" aria-label="Moderator" />}
            </span>
            {canManage && m.userId !== meId && (
              <Popover
                side="bottom"
                align="right"
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={`Manage ${m.username}`}
                    className="grid size-8 place-items-center rounded-full text-lilac/70 opacity-80 transition hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    <MoreHorizontal className="size-[18px]" aria-hidden />
                  </button>
                )}
              >
                {m.role === "moderator" ? (
                  <MenuItem onClick={() => actions.assignRole(m.userId, "participant")}>Remove as moderator</MenuItem>
                ) : (
                  <MenuItem onClick={() => actions.assignRole(m.userId, "moderator")}>Make moderator</MenuItem>
                )}
                <MenuItem onClick={() => actions.assignRole(m.userId, "host")}>Make host</MenuItem>
                <MenuItem danger onClick={() => actions.removeMember(m.userId)}>
                  <UserMinus className="size-4" aria-hidden /> Remove from room
                </MenuItem>
              </Popover>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}