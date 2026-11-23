import { cn } from "@/lib/utils";

const PALETTE = [
  "#6d5dfc", // ultraviolet
  "#2ef2a0", // mint
  "#ff4fd8", // magenta
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#a855f7", // violet
];

export function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name,
  src,
  size = 36,
  online,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full rounded-full object-cover" />
      ) : (
        <span
          className="grid size-full place-items-center rounded-full font-bold text-white shadow-inner"
          style={{ background: colorFor(name), fontSize: size * 0.4 }}
        >
          {name.slice(0, 1).toUpperCase() || "?"}
        </span>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-night",
            online ? "bg-mint" : "bg-lilac/30",
          )}
        />
      )}
    </span>
  );
}