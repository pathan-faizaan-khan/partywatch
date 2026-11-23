"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const OFFSETS = {
  up: { y: 44 },
  down: { y: -44 },
  left: { x: -56 },
  right: { x: 56 },
  scale: { scale: 0.85 },
} as const;

/**
 * Scroll-linked entrance. It plays when the element enters the screen and
 * plays in reverse when it leaves, so it animates scrolling down AND up.
 */
export function Reveal({
  children,
  dir = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  dir?: keyof typeof OFFSETS;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...OFFSETS[dir] }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}