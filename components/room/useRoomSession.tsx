"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { PresenceNotification } from "./PresenceToast";
import type {
  ChatMessage,
  Member,
  PendingRequest,
  Playback,
  Reaction,
  RequestKind,
  RoomInfo,
  RoomMembership,
  RoomRole,
  RoomUser,
} from "./types";

const uid = () => Math.random().toString(36).slice(2, 10);

function getWebSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const wsProto = apiUrl.startsWith("https") ? "wss" : "ws";
  const host = apiUrl.replace(/^https?:\/\//, "");
  return `${wsProto}://${host}/ws`;
}

export function useRoomSession({
  room,
  membership,
  user,
}: {
  room: RoomInfo;
  membership: RoomMembership;
  user: RoomUser;
}) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  const { accessToken } = useAuth();
  const myId = user.id || membership.userId;

  const [members, setMembers] = useState<Member[]>([
    { ...membership, userId: myId, avatarUrl: user.avatarUrl },
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [notifications, setNotifications] = useState<PresenceNotification[]>([]);
  const [playback, setPlayback] = useState<Playback>(() => ({
    videoId: room.videoId,
    playing: room.playState === "playing",
    time: room.currentTime,
    updatedAt: Date.now(),
    seq: 0,
  }));

  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);

  const me = members.find((m) => m.userId === myId) ?? {
    ...membership,
    userId: myId,
    avatarUrl: user.avatarUrl,
  };
  const canControl = me.role === "host" || me.role === "moderator";
  const canManage = me.role === "host";

  const notify = useCallback((item: Omit<PresenceNotification, "id">) => {
    const id = uid();
    setNotifications((prev) => [...prev, { id, ...item }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3200);
  }, []);

  // Helper to send messages over WebSocket (queues if still connecting)
  const sendWs = useCallback((type: string, payload?: unknown) => {
    const ws = wsRef.current;
    const raw = JSON.stringify({ type, payload });
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(raw);
    } else {
      queueRef.current.push(raw);
    }
  }, []);

  const apply = useCallback(
    (patch: Partial<Playback>) =>
      setPlayback((p) => ({ ...p, ...patch, updatedAt: Date.now(), seq: p.seq + 1 })),
    [],
  );

  // Playback control actions
  const play = useCallback(
    (at: number) => {
      if (!canControl) return;
      apply({ playing: true, time: at });
      sendWs("play", { time: at });
    },
    [canControl, apply, sendWs],
  );

  const pause = useCallback(
    (at: number) => {
      if (!canControl) return;
      apply({ playing: false, time: at });
      sendWs("pause", { time: at });
    },
    [canControl, apply, sendWs],
  );

  const seek = useCallback(
    (to: number) => {
      if (!canControl) return;
      apply({ time: to });
      sendWs("seek", { time: to });
    },
    [canControl, apply, sendWs],
  );

  const changeVideo = useCallback(
    (videoId: string) => {
      if (!canControl) return;
      apply({ videoId, time: 0, playing: true });
      sendWs("change_video", { videoId });
    },
    [canControl, apply, sendWs],
  );

  const sendMessage = useCallback(
    (text: string) => {
      const body = text.trim().slice(0, 500);
      if (!body) return;
      sendWs("chat_message", { body });
    },
    [sendWs],
  );

  const sendReaction = useCallback(
    (emoji: string) => {
      const id = uid();
      setReactions((r) => [...r, { id, emoji, x: 12 + Math.random() * 76 }]);
      setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2600);
      sendWs("reaction", { emoji });
    },
    [sendWs],
  );

  const assignRole = useCallback(
    (userId: string, role: RoomRole) => {
      if (!canManage) return;
      sendWs("assign_role", { userId, role });
      setMembers((list) =>
        list.map((m) => {
          if (m.userId === userId) return { ...m, role };
          if (role === "host" && m.role === "host") return { ...m, role: "moderator" };
          return m;
        }),
      );
    },
    [canManage, sendWs],
  );

  const removeMember = useCallback(
    (userId: string) => {
      if (!canManage) return;
      sendWs("remove_participant", { userId });
      setMembers((list) => list.filter((m) => m.userId !== userId));
    },
    [canManage, sendWs],
  );

  const requestChange = useCallback(
    (kind: RequestKind, extra: { time?: number; videoId?: string } = {}) => {
      sendWs("change_request", { kind, ...extra });
      setRequests((r) => [
        ...r,
        { id: uid(), userId: me.userId, username: me.username, kind, ...extra },
      ]);
    },
    [me.userId, me.username, sendWs],
  );

  const resolveRequest = useCallback(
    (id: string, approve: boolean) => {
      if (!canControl) return;
      sendWs("resolve_request", { id, approve });
      setRequests((r) => r.filter((x) => x.id !== id));
    },
    [canControl, sendWs],
  );

  const closeRoom = useCallback(() => {
    if (!canManage) return;
    sendWs("close_room");
  }, [canManage, sendWs]);

  const leaveRoom = useCallback(
    (transferHost = false) => {
      sendWs("leave_room", { transferHost });
    },
    [sendWs],
  );

  // WebSocket lifecycle management
  useEffect(() => {
    let active = true;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!active) return;
      const baseWsUrl = getWebSocketUrl();
      const params = new URLSearchParams({
        code: room.code,
        userId: myId,
        username: user.username || membership.username,
      });
      if (accessToken) params.set("token", accessToken);

      const ws = new WebSocket(`${baseWsUrl}?${params.toString()}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) return;
        console.log(`[WS] Connected to room ${room.code}`);
        ws.send(
          JSON.stringify({
            type: "join_room",
            payload: {
              code: room.code,
              userId: myId,
              username: user.username || membership.username,
              token: accessToken,
            },
          }),
        );

        // Flush message queue
        while (queueRef.current.length > 0) {
          const item = queueRef.current.shift();
          if (item) ws.send(item);
        }
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const { type, payload } = JSON.parse(event.data);

          switch (type) {
            case "room_state": {
              if (payload.playback) {
                setPlayback({
                  videoId: payload.playback.videoId,
                  playing: payload.playback.playState === "playing",
                  time: payload.playback.currentTime,
                  updatedAt: payload.playback.updatedAt || Date.now(),
                  seq: payload.playback.version || 0,
                });
              }
              if (Array.isArray(payload.members)) {
                setMembers(payload.members);
              }
              if (Array.isArray(payload.messages)) {
                setMessages(payload.messages);
              }
              if (Array.isArray(payload.requests)) {
                setRequests(payload.requests);
              }
              break;
            }

            case "sync_state": {
              if (payload) {
                setPlayback({
                  videoId: payload.videoId,
                  playing: payload.playState === "playing",
                  time: payload.currentTime,
                  updatedAt: payload.updatedAt || Date.now(),
                  seq: payload.version || 0,
                });
              }
              break;
            }

            case "user_joined": {
              if (Array.isArray(payload?.participants)) {
                setMembers(payload.participants);
              }
              if (payload?.username && payload.userId !== myId) {
                notify({
                  type: "joined",
                  username: payload.username,
                  avatarUrl: payload.avatarUrl,
                  message: "joined the room",
                });
              }
              break;
            }

            case "user_left": {
              if (Array.isArray(payload?.participants)) {
                setMembers(payload.participants);
              }
              if (payload?.username && payload.userId !== myId) {
                notify({
                  type: "left",
                  username: payload.username,
                  message: "left the room",
                });
              }
              break;
            }

            case "role_assigned": {
              if (Array.isArray(payload?.participants)) {
                setMembers(payload.participants);
              }
              if (payload?.userId) {
                const title = payload.role === "host" ? "the Host" : payload.role === "moderator" ? "a Moderator" : "a Participant";
                notify({
                  type: "role",
                  username: payload.userId === myId ? "You" : payload.username || "User",
                  role: payload.role,
                  message: `is now ${title}`,
                });
              }
              break;
            }

            case "host_transferred": {
              if (Array.isArray(payload?.participants)) {
                setMembers(payload.participants);
              }
              notify({
                type: "role",
                username: payload.newHostId === myId ? "You" : payload.newHostUsername || "User",
                role: "host",
                message: "is now the Host",
              });
              break;
            }

            case "host_offline_warning": {
              notify({
                type: "info",
                username: "Host",
                message: payload?.message || "The host has disconnected. Room will close in 5 minutes if they don't return.",
              });
              break;
            }

            case "host_reconnected": {
              notify({
                type: "info",
                username: "Host",
                message: payload?.message || "The host has reconnected.",
              });
              break;
            }

            case "room_closed": {
              alert(payload?.message || "The host ended the watch party.");
              routerRef.current.push("/lobby");
              break;
            }

            case "participant_removed": {
              if (payload?.userId === myId) {
                alert("You have been removed from the room by the host.");
                routerRef.current.push("/lobby");
              } else if (Array.isArray(payload?.participants)) {
                setMembers(payload.participants);
              }
              break;
            }

            case "chat_message": {
              if (payload?.id && payload?.body) {
                setMessages((prev) => {
                  if (prev.some((m) => m.id === payload.id)) return prev;
                  return [...prev, payload];
                });
              }
              break;
            }

            case "reaction": {
              if (payload?.emoji) {
                // If it was sent by someone else, display it
                if (payload.userId !== myId) {
                  const id = payload.id || uid();
                  setReactions((r) => [...r, { id, emoji: payload.emoji, x: payload.x || 50 }]);
                  setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), 2600);
                }
              }
              break;
            }

            case "change_request_created": {
              if (payload?.id) {
                setRequests((prev) => {
                  if (prev.some((r) => r.id === payload.id)) return prev;
                  return [...prev, payload];
                });
              }
              break;
            }

            case "change_request_resolved": {
              if (payload?.id) {
                setRequests((prev) => prev.filter((r) => r.id !== payload.id));
              }
              break;
            }
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = (e) => {
        if (!active) return;
        console.log(`[WS] Connection closed: code=${e.code}`);
        if (e.code !== 1000 && e.code !== 4001) {
          reconnectTimer = setTimeout(() => {
            connect();
          }, 1500);
        }
      };
    };

    connect();

    // Ping interval to keep connection alive
    pingTimer = setInterval(() => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      active = false;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const ws = wsRef.current;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close(1000, "Component unmounted");
      }
      wsRef.current = null;
    };
  }, [room.code, accessToken, myId, user.username, membership.username, notify]);

  return {
    me,
    members,
    messages,
    requests,
    reactions,
    notifications,
    playback,
    canControl,
    canManage,
    actions: {
      play,
      pause,
      seek,
      changeVideo,
      sendMessage,
      sendReaction,
      assignRole,
      removeMember,
      requestChange,
      resolveRequest,
      closeRoom,
      leaveRoom,
    },
  };
}

export type RoomSession = ReturnType<typeof useRoomSession>;
