"use client";

import { AnimatePresence, motion } from "framer-motion";

import { DURATION, EASE_ENTER } from "@/lib/motion";

interface FieldErrorProps {
  id: string;
  message?: string | undefined;
}

/**
 * Validation copy for a single control.
 *
 * The row keeps its height whether or not a message is in it, so an error
 * appearing never nudges the rest of the form — the form's height is constant
 * from first paint to submission, which matters most on a phone, where a shift
 * can move the submit button out from under a thumb.
 *
 * Set in `accent-bright`, not `accent`: the logo red manages only 4.3:1 against
 * this ground, and this is small text.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <div className="min-h-6 pt-2.5">
      <AnimatePresence initial={false}>
        {message ? (
          <motion.p
            key={message}
            id={id}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.state, ease: EASE_ENTER }}
            className="text-[0.8125rem] leading-snug text-accent-bright"
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
