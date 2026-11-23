import { cn } from "@/lib/utils";

/** Two play triangles, offset: two screens, one moment. Plus a bit of confetti. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-9", className)}>
      <defs>
        <linearGradient id="pw-logo-g" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7a6bff" />
          <stop offset="1" stopColor="#ff4fd8" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="15" fill="url(#pw-logo-g)" />
      <path d="M12 14v20l15-10z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
      <path d="M21 14v20l15-10z" fill="#2ef2a0" stroke="#4a3be0" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
      <path d="M21 14v20l15-10z" fill="#2ef2a0" stroke="#2ef2a0" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="38.5" cy="9.5" r="2.2" fill="#fff" />
      <circle cx="9.5" cy="39" r="1.6" fill="#fff" fillOpacity=".8" />
      <rect x="34" y="37" width="4" height="4" rx="1" fill="#ffe86b" transform="rotate(20 36 39)" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-xl font-black text-white">
        Party<span className="text-mint">Watch</span>
      </span>
    </span>
  );
}