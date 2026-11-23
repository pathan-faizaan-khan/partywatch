const STORAGE_KEY = "pw_created_rooms";

export interface CreatedRoom {
  code: string;
  createdBy: string;
  createdAt: number;
}

function readList(): CreatedRoom[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeList(list: CreatedRoom[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — ignore
  }
}

/** Remember a room the host just created (frontend-only until the backend room API exists). */
export function saveCreatedRoom(room: CreatedRoom) {
  const list = readList().filter((r) => r.code !== room.code);
  writeList([...list, room]);
}

/** Look up a locally-created room by code. */
export function getCreatedRoom(code: string): CreatedRoom | null {
  return readList().find((r) => r.code === code) || null;
}

/** Drop a locally-created room once it has been claimed / synced to the backend. */
export function removeCreatedRoom(code: string) {
  writeList(readList().filter((r) => r.code !== code));
}
