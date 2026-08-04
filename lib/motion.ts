/**
 * Motion tokens.
 *
 * One easing curve and four durations for the whole page, mirroring
 * `--ease-enter` in globals.css.
 *
 * CSS owns every entrance — see the `hero-rise` note in globals.css for why
 * anything that starts at `opacity: 0` must not depend on JavaScript to come
 * back. What is left here is for animations that only exist once a visitor has
 * interacted: validation copy arriving, and the confirmation dialog.
 *
 * The durations are long by web-app standards, deliberately: the brief for this
 * page is calm, and `micro` is the only one answering a tap.
 */

/** Expo-out. Leaves quickly, arrives softly. */
export const EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const DURATION = {
  /** Hover, press, colour changes. */
  micro: 0.2,
  /** A control changing state; validation copy appearing. */
  state: 0.28,
  /** Content arriving. */
  enter: 0.45,
  /** The confirmation landing. */
  compose: 0.5,
} as const;
