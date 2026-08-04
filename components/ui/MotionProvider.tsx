"use client";

import { MotionConfig } from "framer-motion";

/**
 * Reduced motion is handled here, once, at animation time.
 *
 * Branching *rendered output* on `useReducedMotion()` cannot work: the hook is
 * `false` during SSR and the real preference on the client, so the two trees
 * disagree and React refuses to patch the difference. `reducedMotion="user"`
 * keeps the markup identical on both sides and instead snaps transform and
 * layout animations for anyone who asked for less motion, while still allowing
 * opacity to fade — so no element is ever left invisible.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
