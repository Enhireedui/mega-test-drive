"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/Button";
import { DURATION, EASE_ENTER } from "@/lib/motion";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * The confirmation: a tick, one sentence and the way out.
 *
 * It does not read back what was just typed — the visitor typed it, and rows of
 * their own data are the least useful thing to hand them at this moment.
 */
export function SuccessModal({ open, onClose }: SuccessModalProps) {
  const rawId = useId();
  const titleId = `success-${rawId}-title`;

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    /* Lock the page and compensate for the scrollbar so nothing shifts. */
    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    document.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 140);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      previouslyFocused.current?.focus();
    };
  }, [open, handleKeyDown]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 pt-14 sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.state, ease: EASE_ENTER }}
            onClick={onClose}
            className="absolute inset-0 bg-abyss/80 backdrop-blur-xl"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 26, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.985, transition: { duration: DURATION.micro } }}
            transition={{ duration: DURATION.compose, ease: EASE_ENTER }}
            className="glass relative max-h-[calc(100svh-4.5rem)] w-full max-w-[23rem] overflow-y-auto overflow-x-hidden overscroll-contain rounded-[1.75rem] border border-white/12 px-6 pb-6 pt-9 text-center edge-lit sm:px-7 sm:pb-7 sm:pt-10"
          >
            {/* Warm bloom, from behind and above — the page's only light source. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(226_10_23_/_0.38),transparent_68%)] blur-2xl"
            />
            {/* Specular sweep across the top edge as the card lands. */}
            <motion.span
              aria-hidden="true"
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.1, ease: EASE_ENTER, delay: 0.22 }}
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent"
            />

            <div className="relative mx-auto grid size-[3.25rem] place-items-center">
              <motion.span
                aria-hidden="true"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DURATION.compose, ease: EASE_ENTER, delay: 0.06 }}
                className="absolute inset-0 rounded-full border border-brand/45 bg-brand/12"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="relative size-6 text-brand-hi"
              >
                <motion.path
                  d="M4.5 12.6 9.4 17.5 19.5 7"
                  stroke="currentColor"
                  strokeWidth={2.25}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: DURATION.compose, ease: EASE_ENTER, delay: 0.2 }}
                />
              </svg>
            </div>

            <h2
              id={titleId}
              className="mx-auto mt-6 max-w-[16rem] text-balance font-display text-[1.25rem] font-semibold leading-[1.35] tracking-[-0.01em] text-chrome"
            >
              Амжилттай бүртгэгдлээ.
            </h2>

            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="md"
              fullWidth
              onClick={onClose}
              className="mt-8"
            >
              Хаах
            </Button>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
