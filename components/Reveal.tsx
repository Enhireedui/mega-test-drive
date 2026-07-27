"use client";

import { motion } from "framer-motion";

import { DURATION, EASE_ENTER } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  /** Stagger offset in seconds. */
  delay?: number;
  className?: string;
}

/**
 * The single scroll-reveal primitive: a 20px rise plus a fade, fired once at
 * 15% intersection.
 *
 * `initial` is deliberately constant — reduced motion is resolved by
 * MotionProvider at animation time, so the server and client render the same
 * tree. `data-reveal` lets the no-script fallback in the root layout force the
 * content visible if the bundle never arrives.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  return (
    <motion.div
      data-reveal=""
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: DURATION.compose, ease: EASE_ENTER, delay }}
    >
      {children}
    </motion.div>
  );
}
