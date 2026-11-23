import { Crown, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type Role = "host" | "moderator" | "participant";

const config = {
  host: { label: "Host", Icon: Crown, cls: "bg-magenta/20 text-magenta" },
  moderator: { label: "Moderator", Icon: ShieldCheck, cls: "bg-mint/20 text-mint" },
  participant: { label: "Participant", Icon: Eye, cls: "bg-white/10 text-lilac" },
} as const;

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const { label, Icon, cls } = config[role];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", cls, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
