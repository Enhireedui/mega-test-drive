"use client";

import { MotionConfig } from "framer-motion";

/**
 * Reduced motion is handled here, once, at animation time.
 *
 * Branching *rendered output* on `useReducedMotion()` cannot work: the hook
 * resolves to `false` during SSR and to the real preference on the client, so
 * the two trees disagree and React refuses to patch the difference. With
 * `reducedMotion="user"` framer keeps the markup identical on both sides and
 * instead snaps transform/layout animations for users who ask for less motion,
 * while still allowing opacity to fade — so nothing is ever left invisible.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
