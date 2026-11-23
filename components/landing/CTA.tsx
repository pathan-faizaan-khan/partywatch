"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/lib/auth-context";

export function CTA() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCreateRoom = () => {
    if (user) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  return (
    <section aria-labelledby="cta-title" className="px-4 pb-20 sm:pb-28">
      <Reveal dir="scale">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-ultraviolet to-magenta p-8 text-center sm:rounded-card sm:p-20">
          <h2 id="cta-title" className="mx-auto max-w-2xl font-display text-2xl font-black uppercase text-white sm:text-5xl">
            Your room is one click away
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base text-white/90 sm:text-lg">Pick a video, send the code, and watch together.</p>
          <Button onClick={handleCreateRoom} size="lg" className="mt-8 w-full sm:w-auto">
            {user ? "Go to lobby" : "Create a room"}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
