const WORDS = ["Watch", "Laugh", "React", "Hang out", "Repeat"];

function Row() {
  return (
    <ul className="flex shrink-0 items-center gap-6 pr-6 sm:gap-10 sm:pr-10">
      {WORDS.map((w) => (
        <li key={w} className="flex items-center gap-6 sm:gap-10">
          <span className="font-display text-3xl font-black uppercase text-white sm:text-6xl">{w}</span>
          <svg viewBox="0 0 24 24" className="size-7 text-mint sm:size-9" fill="currentColor">
            <path d="M7 4.5v15l13-7.5z" />
          </svg>
        </li>
      ))}
    </ul>
  );
}

/** Decorative scrolling strip. Hidden from assistive tech. */
export function Marquee() {
  return (
    <div aria-hidden className="overflow-hidden border-y border-white/10 bg-ultraviolet/30 py-5 sm:py-6">
      <div className="flex w-max animate-marquee will-change-transform">
        <Row />
        <Row />
      </div>
    </div>
  );
}