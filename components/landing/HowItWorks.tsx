import { Reveal } from "@/components/ui/Reveal";
import { STEPS } from "@/lib/constants";

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 id="how-title" className="font-display text-2xl font-black uppercase text-white sm:text-5xl">
            Ready in three steps
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 0.12} className="h-full">
                <div className="h-full rounded-[2rem] bg-white/5 p-6 ring-1 ring-white/15 sm:p-8">
                  <span className="grid size-14 place-items-center rounded-full bg-mint font-display text-2xl font-black text-ink">
                    {i + 1}
                  </span>
                  <h3 className="mt-6 font-display text-lg font-black uppercase text-white sm:text-xl">{s.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-lilac/85">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}