"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { ActionButton } from "@/components/ui/ActionButton";
import { DURATION, EASE_ENTER } from "@/lib/motion";

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  /** What was booked, restated once so it can be checked at a glance. */
  summary: string;
}

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * The confirmation.
 *
 * A drawn tick, one sentence, the day and time that were taken, and the way
 * out. It restates the slot and nothing else: the visitor typed their own name
 * and number a moment ago, and reading those back is the least useful thing to
 * hand them here — but the slot is the one thing they chose from a list and may
 * genuinely want to re-read.
 */
export function SuccessDialog({ open, onClose, summary }: SuccessDialogProps) {
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
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 160);

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
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-4 pt-16 sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.state, ease: EASE_ENTER }}
            onClick={onClose}
            className="absolute inset-0 bg-night/80 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: DURATION.micro } }}
            transition={{ duration: DURATION.compose, ease: EASE_ENTER }}
            /* A raised surface, not a white card: one step up from the page,
               a hairline, and a shadow deep enough to lift it off the backdrop
               without becoming a visible box. */
            className="relative max-h-[calc(100svh-5rem)] w-full max-w-[26rem] overflow-y-auto overscroll-contain rounded-3xl border border-edge bg-night-soft px-8 pb-8 pt-10 shadow-[0_48px_120px_-32px_rgb(0_0_0_/_0.8)] sm:pb-10 sm:pt-12"
          >
            <div className="relative size-11">
              <motion.span
                aria-hidden="true"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: DURATION.state, ease: EASE_ENTER, delay: 0.05 }}
                className="absolute inset-0 rounded-full bg-accent"
              />
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute inset-0 size-11 p-3 text-white"
              >
                <motion.path
                  d="M4.5 12.6 9.4 17.5 19.5 7"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, ease: EASE_ENTER, delay: 0.22 }}
                />
              </svg>
            </div>

            <h2 id={titleId} className="display-md mt-8 text-white">
              Бүртгэл баталгаажлаа.
            </h2>

            <p data-numeric="" className="mt-4 text-[0.9375rem] leading-relaxed text-white/60">
              {summary}
            </p>

            <ActionButton
              ref={closeButtonRef}
              variant="outlined"
              size="md"
              fullWidth
              onClick={onClose}
              className="mt-9"
            >
              Хаах
            </ActionButton>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
