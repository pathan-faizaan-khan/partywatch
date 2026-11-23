import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { ROLE_CARDS } from "@/lib/constants";

export function Roles() {
  return (
    <section id="roles" aria-labelledby="roles-title" className="scroll-mt-24 bg-gradient-to-b from-transparent via-indigo-deep/40 to-transparent px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="roles-title" className="max-w-3xl font-display text-2xl font-black uppercase text-white sm:text-5xl">
            You pick who holds the remote
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-xl text-base text-lilac/90 sm:text-lg">
            Whoever starts the room is the Host. Friends join as Participants and just watch. Want a hand running the
            show? Make someone a Moderator.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {ROLE_CARDS.map((r, i) => (
            <li key={r.role}>
              <Reveal delay={i * 0.12} className="h-full">
                <div className={`h-full rounded-[2rem] bg-gradient-to-br p-6 ring-1 ring-white/15 sm:p-8 ${r.tint}`}>
                  <RoleBadge role={r.role} />
                  <h3 className="mt-4 font-display text-xl font-black uppercase text-white">{r.title}</h3>
                  <ul className="mt-5 space-y-3">
                    {r.abilities.map((a) => (
                      <li key={a} className="flex items-start gap-3 text-base text-white/95">
                        <Check className="mt-0.5 size-5 shrink-0 text-mint" aria-hidden />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}