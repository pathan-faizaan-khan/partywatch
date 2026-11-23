"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { PlayerMockup } from "./PlayerMockup";
import { useAuth } from "@/lib/auth-context";

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.14 } } };
const rise: Variants = { hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.7, ease: "easeOut" } } };

export function Hero() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [code, setCode] = useState("");

  const handleRoomAction = () => {
    if (user) {
      router.push("/lobby");
    } else {
      router.push("/login");
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      handleRoomAction();
      return;
    }
    // If a room code was entered, directly join that room!
    if (user) {
      router.push(`/room/${cleanCode}`);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(`/room/${cleanCode}`)}`);
    }
  };

  return (
    <section className="bg-cosmos relative overflow-hidden px-4 pb-24 pt-32 sm:pt-40" aria-labelledby="hero-title">
      <div aria-hidden className="stars pointer-events-none absolute inset-0 opacity-80" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          {/* whileInView sits on the h1 itself so the clipped lines can't block the trigger */}
          <motion.h1
            id="hero-title"
            variants={container}
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: false, amount: 0.5 }}
            className="font-display text-[1.75rem] font-black uppercase leading-[1.05] text-white min-[400px]:text-4xl sm:text-5xl xl:text-6xl"
          >
            {["Watch together.", "Press play once."].map((line) => (
              <span key={line} className="block overflow-hidden pb-1.5">
                <motion.span variants={rise} className="block">
                  {line}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-lilac/90">
              Pick a YouTube video, send your friends a code, and watch it at the exact same moment, even when you are
              miles apart.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div id="join" className="mt-8 flex scroll-mt-32 flex-col gap-4 sm:flex-row sm:items-center">
              <Button onClick={handleRoomAction} size="lg" className="w-full sm:w-auto">
                {user ? "Go to lobby" : "Create a room"}
              </Button>
              <form
                onSubmit={handleJoinWithCode}
                className="flex w-full items-center rounded-full bg-white/10 p-1.5 ring-1 ring-white/20 focus-within:ring-2 sm:w-auto"
              >
                <label htmlFor="room-code" className="sr-only">
                  Room code
                </label>
                <input
                  id="room-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  placeholder="Have a room code?"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white outline-none placeholder:text-lilac/50 sm:w-40 sm:flex-none uppercase"
                />
                <button
                  type="submit"
                  className="rounded-full bg-ultraviolet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ultraviolet/85 active:scale-95 cursor-pointer"
                >
                  Join room
                </button>
              </form>
            </div>
          </Reveal>
        </div>

        <div className="relative">
          <Reveal dir="up" delay={0.2}>
            <PlayerMockup />
          </Reveal>
        </div>
      </div>
    </section>
  );
}