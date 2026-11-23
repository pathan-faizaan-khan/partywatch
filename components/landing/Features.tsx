import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

function SyncVisual() {
  return (
    <div className="space-y-3 rounded-panel bg-night/80 p-4 sm:p-5">
      {["Aarav", "Mira", "Kabir"].map((n) => (
        <div key={n} className="flex items-center gap-3">
          <Avatar name={n} className="size-9 shrink-0" />
          <div className="h-2 min-w-0 flex-1 rounded-full bg-white/15">
            <div className="h-full w-[42%] rounded-full bg-mint" />
          </div>
          <span className="w-10 text-right text-sm tabular-nums text-white">1:24</span>
        </div>
      ))}
      <p className="pt-1 text-center text-sm font-semibold text-mint">Same second, every screen</p>
    </div>
  );
}

function RoomVisual() {
  return (
    <div className="rounded-panel bg-night/80 p-5 text-center sm:p-6">
      <p className="text-sm text-lilac/70">Room code</p>
      <div className="mt-3 flex justify-center gap-1.5 sm:gap-2" role="img" aria-label="Example room code K7Q4XM">
        {"K7Q4XM".split("").map((c, i) => (
          <span key={i} className="grid size-9 place-items-center rounded-xl bg-white font-display text-lg font-black text-ink sm:size-11 sm:text-xl">
            {c}
          </span>
        ))}
      </div>
      <p className="mt-5 inline-block rounded-full bg-mint px-5 py-2 text-sm font-bold text-ink">Copy invite link</p>
    </div>
  );
}

function ChatVisual() {
  return (
    <div className="space-y-3 rounded-panel bg-night/80 p-4 text-sm sm:p-5">
      <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2.5 text-white">That plot twist 😮</p>
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-ultraviolet px-4 py-2.5 text-white">Rewind it, Mira!</p>
      <div className="flex flex-wrap gap-2 pt-1 text-xl" aria-hidden>
        {["🔥", "😂", "👏", "❤️"].map((e) => (
          <span key={e} className="rounded-full bg-white/10 px-3 py-1">
            {e}
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "Everyone on the same second",
    body: "No more “ready? 3, 2, 1, go.” When the Host plays, pauses or skips ahead, every screen follows right away.",
    tint: "from-ultraviolet/60 to-indigo-deep/70",
    visual: <SyncVisual />,
  },
  {
    title: "Your room is one code away",
    body: "Start a room, share the code or link, and your friends hop right in. Nobody has to call anybody.",
    tint: "from-[#0b5a3e] to-[#1fbf7f]",
    visual: <RoomVisual />,
  },
  {
    title: "React together",
    body: "Laugh, gasp and send reactions while the video plays, just like sitting on the same couch.",
    tint: "from-magenta/60 to-[#4a1a7a]",
    visual: <ChatVisual />,
    soon: true,
  },
];

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="features-title" className="max-w-2xl font-display text-2xl font-black uppercase text-white sm:text-5xl">
            Movie night, minus the countdown
          </h2>
        </Reveal>
        <div className="mt-12 space-y-8 sm:mt-14 sm:space-y-10">
          {FEATURES.map((f, i) => {
            const flip = i % 2 === 1;
            return (
              <article
                key={f.title}
                className={cn("grid items-center gap-8 rounded-[2rem] bg-gradient-to-br p-5 ring-1 ring-white/15 sm:rounded-card sm:p-10 md:grid-cols-2 md:p-12", f.tint)}
              >
                <Reveal dir={flip ? "right" : "left"} className={cn(flip && "md:order-2")}>
                  {f.soon && <span className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-ink">Coming soon</span>}
                  <h3 className="font-display text-xl font-black uppercase text-white sm:text-4xl">{f.title}</h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-white/90 sm:text-lg">{f.body}</p>
                </Reveal>
                <Reveal dir={flip ? "left" : "right"} delay={0.1} className="relative">
                  {f.visual}
                </Reveal>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}