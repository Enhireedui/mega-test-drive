"use client";

import { forwardRef } from "react";

/**
 * The call to action.
 *
 * One shape, one colour, sharp corners. There is exactly one of these visible at
 * a time and it is the only red surface on the page, which is what makes the red
 * mean something.
 *
 * ── Proportions ───────────────────────────────────────────────────────────
 * 56px tall, 16px radius. Both are deliberate: 56 keeps the button on the 8px
 * grid the rest of the page is set to while clearing the 48px touch minimum with
 * room to spare, and 16px of radius is the point where a rectangle reads as
 * *considered* rather than either boxy or pill-shaped. The plates in the form
 * carry 12px, one step down — a coherent scale, larger element, larger radius.
 *
 * ── The micro-interaction ─────────────────────────────────────────────────
 * Three things move on hover, all of them small:
 *
 *   · the fill brightens from `accent-deep` to the exact logo red,
 *   · the button rises 2px,
 *   · a soft red glow fades in beneath it.
 *
 * The glow is the whole trick. It is a shadow in the accent rather than in black,
 * so the button reads as a lit surface instead of a raised card, and it is blurred
 * far enough out that it never resolves into a visible edge. It is held at 0.32 —
 * enough to feel lit, not enough to look like it is glowing. On press the lift
 * returns to zero, so the button answers a finger and not only a cursor.
 *
 * There used to be a hairline of light that swept across the face on hover. It was
 * removed: on a flat red rectangle it read as an effect rather than as a material.
 *
 * Set as caps with 0.09em of tracking — enough that the label reads as a marque's
 * button rather than a web form's, tight enough that Mongolian Cyrillic does not
 * come apart into separate letters.
 */

type Size = "md" | "lg";

const BASE =
  "relative inline-flex select-none items-center justify-center gap-3 rounded-2xl " +
  "font-medium uppercase tracking-[0.09em] " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-enter " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent " +
  "disabled:pointer-events-none disabled:opacity-50";

/* On the 8px grid, and comfortably past the 48px touch minimum at both sizes. */
const SIZES: Record<Size, string> = {
  md: "h-12 px-8 text-[0.8125rem]",
  lg: "h-14 px-10 text-[0.875rem]",
};

const FILLED =
  "bg-accent-deep text-white shadow-[0_0_0_0_rgb(232_24_32_/_0)] " +
  "hover:-translate-y-0.5 hover:bg-accent hover:shadow-[0_16px_40px_-14px_rgb(232_24_32_/_0.32)] " +
  "active:translate-y-0 active:shadow-[0_8px_20px_-12px_rgb(232_24_32_/_0.28)]";

const OUTLINED =
  "border border-edge text-white/85 " +
  "hover:-translate-y-0.5 hover:border-edge-lit hover:bg-white/[0.04] hover:text-white " +
  "active:translate-y-0";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5 animate-spin motion-reduce:animate-none"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.6" />
      <path
        d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ActionButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "className"> {
  size?: Size;
  variant?: "filled" | "outlined";
  fullWidth?: boolean;
  loading?: boolean;
  /** Replaces the label while the action is in flight. */
  loadingLabel?: string;
  className?: string;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
    size = "lg",
    variant = "filled",
    fullWidth = false,
    loading = false,
    loadingLabel,
    disabled,
    children,
    className = "",
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      /* Blocks the second click of a double-click while the action runs. */
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={[
        BASE,
        SIZES[size],
        variant === "filled" ? FILLED : OUTLINED,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

interface ActionLinkProps extends Omit<React.ComponentPropsWithoutRef<"a">, "className"> {
  size?: Size;
  variant?: "filled" | "outlined";
  fullWidth?: boolean;
  className?: string;
}

/**
 * The same face, as a link — for a target the page can move to rather than
 * something to submit. Keeps working with JavaScript disabled and offers a real
 * href to middle-click or share.
 */
export function ActionLink({
  size = "lg",
  variant = "filled",
  fullWidth = false,
  children,
  className = "",
  ...rest
}: ActionLinkProps) {
  return (
    <a
      className={[
        BASE,
        SIZES[size],
        variant === "filled" ? FILLED : OUTLINED,
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </a>
  );
}
