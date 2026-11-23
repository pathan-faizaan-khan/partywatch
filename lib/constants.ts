export const SITE = {
  name: "PartyWatch",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Watch YouTube together, in sync",
  description:
    "PartyWatch lets you create a room, share a code and watch YouTube together. Play, pause, seek and video changes stay in sync for everyone, with Host and Moderator controls.",
} as const;

// PLACEHOLDER routes: change these when the room pages exist.
export const ROUTES = {
  create: "/room/new",
  join: (code: string) => `/room/${encodeURIComponent(code)}`,
};

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "How it works", href: "#how-it-works" },
];

/* Free image sources: no API keys needed */
export const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}&radius=50`;
export const ytThumb = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
export const DEMO_VIDEO_ID = "aqz-KE-bpKQ"; // swap for any YouTube video id

export const ROLE_CARDS = [
  {
    role: "host",
    title: "Starts the room",
    tint: "from-magenta/50 to-[#4a1a7a]",
    abilities: [
      "Play, pause and skip ahead",
      "Pick the video everyone watches",
      "Choose who becomes a Moderator",
      "Remove someone from the room",
      "Hand the Host role to a friend",
    ],
  },
  {
    role: "moderator",
    title: "The Host's co-pilot",
    tint: "from-[#0b5a3e] to-[#1fbf7f]",
    abilities: ["Play, pause and skip ahead", "Pick the video everyone watches", "Keep the room running smoothly"],
  },
  {
    role: "participant",
    title: "Everyone else",
    tint: "from-ultraviolet/60 to-indigo-deep/80",
    abilities: ["Watch in perfect sync", "See who is in the room", "Ask a Moderator for any change"],
  },
] as const;

export const STEPS = [
  { title: "Start a room", body: "Create a room and you become the Host. It takes a few seconds." },
  { title: "Send the code", body: "Share the room code or link. Friends join as Participants." },
  { title: "Press play", body: "Paste a YouTube link and watch. Everyone sees the same moment." },
];