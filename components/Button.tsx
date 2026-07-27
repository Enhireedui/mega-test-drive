"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "ghost";
type ButtonSize = "md" | "lg";

const BASE =
  "group/btn relative isolate inline-flex select-none items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium tracking-[0.01em] " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-enter " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hi " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

/* Minimum 48px touch target at every size. */
const SIZES: Record<ButtonSize, string> = {
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-8 text-base",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white edge-lit shadow-[0_14px_44px_-16px_rgb(226_10_23_/_0.85)] " +
    "hover:bg-brand-hi hover:shadow-[0_18px_54px_-14px_rgb(226_10_23_/_0.95)]",
  ghost:
    "border border-white/12 bg-white/[0.03] text-white/80 backdrop-blur-md " +
    "hover:border-white/22 hover:bg-white/[0.06] hover:text-white",
};

interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Replaces the label while the action is in flight. */
  loadingLabel?: string;
  className?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
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
      className={[BASE, SIZES[size], VARIANTS[variant], fullWidth ? "w-full" : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* The travelling hairline highlight — light catching a chrome lip. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-[900ms] ease-enter group-hover/btn:translate-x-full"
      />
      {loading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4 animate-spin" strokeWidth={2} />
          <span>{loadingLabel ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
