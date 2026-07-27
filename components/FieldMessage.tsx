"use client";

import { AnimatePresence, motion } from "framer-motion";

import { DURATION, EASE_ENTER } from "@/lib/motion";

interface FieldMessageProps {
  id: string;
  message?: string | undefined;
}

/**
 * Validation copy for a single field.
 *
 * The row keeps a reserved height whether or not a message is present, so an
 * error appearing never nudges the rest of the form — the form's height is
 * constant from first paint to submission.
 */
export function FieldMessage({ id, message }: FieldMessageProps) {
  return (
    <div className="min-h-[1.375rem] px-1 pt-1.5">
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
            className="text-[0.75rem] leading-tight text-brand-hi"
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
