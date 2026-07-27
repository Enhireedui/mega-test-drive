/**
 * Motion tokens.
 *
 * One easing curve and four durations for the whole page, so nothing drifts out
 * of step. Mirrors `--ease-enter` and the animation timings in globals.css —
 * CSS owns the ambient and entrance animations, these own the JS-driven ones.
 */

/** Expo-out. Fast to leave, soft to arrive. */
export const EASE_ENTER: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  /** Hover, press, colour changes. */
  micro: 0.18,
  /** A control changing state; validation copy appearing. */
  state: 0.24,
  /** Content arriving. */
  enter: 0.44,
  /** A composed reveal, such as the confirmation card. */
  compose: 0.5,
} as const;
