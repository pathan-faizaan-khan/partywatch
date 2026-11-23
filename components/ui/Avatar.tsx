import { avatar } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatar(name)}
      alt={`${name}'s avatar`}
      width={40}
      height={40}
      loading="lazy"
      className={cn("size-10 rounded-full bg-white/10", className)}
    />
  );
}
