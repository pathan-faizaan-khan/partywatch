export type RoomRole = "host" | "moderator" | "participant" | "viewer";
export type PanelId = "chat" | "people";

export interface RoomUser {
  id: string;
  username: string;
  avatarUrl?: string | null;
  email?: string | null;
}

export interface RoomInfo {
  code: string;
  name: string;
  status: string;
  videoId: string | null;
  playState: "playing" | "paused";
  currentTime: number;
}

export interface RoomMembership {
  userId: string;
  username: string;
  role: RoomRole;
  isOnline: boolean;
}

export interface Member extends RoomMembership {
  avatarUrl?: string | null;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  body: string;
  createdAt: number;
}

/** What everyone should be watching. `seq` bumps on every accepted change. */
export interface Playback {
  videoId: string | null;
  playing: boolean;
  time: number;
  updatedAt: number;
  seq: number;
}

export type RequestKind = "play" | "pause" | "seek" | "change_video";

export interface PendingRequest {
  id: string;
  userId: string;
  username: string;
  kind: RequestKind;
  time?: number;
  videoId?: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  x: number;
}
