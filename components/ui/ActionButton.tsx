"use client";

import { forwardRef } from "react";

/**
 * The call to action.
 *
 * The only red surface on the page, and the only filled one. Everything else is
 * type on the ground or a hairline, which is what makes a single block of colour
 * read as *the* thing to do rather than as one of several coloured elements.
 *
 * 56px tall, 4px radius. The radius is the deliberate part: 4px, not 12px. This
 * page is a field document — hairlines, tabular figures, letterspaced reference
 * labels — and a softly rounded button in the middle of that reads as though it
 * were imported from a different design. A near-square block matches the plate
 * and the rules around it, and still reads as a control rather than a slab
 * because of the letterspaced caps and the fill.
 *
 * Two things move on hover: the fill brightens from `signal-deep` to the exact
 * logo red, and the label's tracking opens by 0.01em. No lift, no glow, no
 * shadow — on a near-black ground a shadow is invisible, and a red bloom under a
 * red button reads as a web effect rather than as a material.
 */
const FACE =
  "group inline-flex h-14 select-none items-center justify-center gap-3 rounded " +
  "bg-signal-deep px-10 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-white " +
  "transition-[background-color,letter-spacing] duration-300 ease-enter " +
  "hover:bg-signal hover:tracking-[0.21em] " +
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-amber " +
  "disabled:pointer-events-none disabled:opacity-45";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="size-3.5 animate-spin motion-reduce:animate-none"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.6" />
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
  fullWidth?: boolean;
  loading?: boolean;
  /** Replaces the label while the action is in flight. */
  loadingLabel?: string;
  className?: string;
}

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  {
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
      className={[FACE, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ")}
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

/**
 * The same face, as a link — for a target the page can move to rather than
 * something to submit. Keeps working with JavaScript disabled and offers a real
 * href to middle-click or share.
 */
export function ActionLink({
  fullWidth = false,
  children,
  className = "",
  ...rest
}: Omit<React.ComponentPropsWithoutRef<"a">, "className"> & {
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <a className={[FACE, fullWidth ? "w-full" : "", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </a>
  );
}
