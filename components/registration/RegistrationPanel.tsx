"use client";

import { useRef, useState } from "react";

import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { ActionButton } from "@/components/ui/ActionButton";
import type { SlotAvailability } from "@/types/registration";

interface RegistrationPanelProps {
  availability: readonly SlotAvailability[];
}

/**
 * One button that becomes the form.
 *
 * The page opens as a single call to action: nobody is asked for anything until
 * they have said they want to register, which is the whole reason the hero can
 * stay this quiet. Tapping it unfolds the fields in place.
 *
 * The reveal is opacity and an 18px rise, run as a CSS animation.
 *
 * Two things it deliberately is not. It is not an animated height: `0 → auto` is
 * a layout animation, and those are skipped for anyone who asks for reduced
 * motion, which would leave the wrapper at zero height with the form clipped
 * inside it — present in the DOM and impossible to see or tap. And it is not a
 * JavaScript animation: the fields start at `opacity: 0`, so if the thing that
 * restores them can stall, the button appears to do nothing. CSS cannot stall,
 * and `animation-fill-mode: both` holds the finished state.
 */
export function RegistrationPanel({ availability }: RegistrationPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /* Open, then bring the fields into view. Focus is handled inside the form,
     after the reveal, so the keyboard does not throw itself up over content that
     is still moving. */
  const handleOpen = () => {
    setOpen(true);
    window.setTimeout(() => {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 140);
  };

  return (
    <div ref={panelRef} id="register" className="w-full scroll-mt-6">
      {open ? (
        <div
          style={{ "--rise-delay": "0.05s" } as React.CSSProperties}
          className="hero-rise mx-auto w-full max-w-[38rem]"
        >
          <RegistrationForm availability={availability} autoFocus />
        </div>
      ) : (
        <div className="flex justify-center">
          {/* 288px of presence, but never wider than the column it sits in — a
              flat `min-w` would overflow a 320px phone by more than its padding. */}
          <ActionButton
            size="lg"
            onClick={handleOpen}
            aria-expanded={false}
            aria-controls="register"
            className="min-w-[min(18rem,100%)]"
          >
            Бүртгүүлэх
          </ActionButton>
        </div>
      )}
    </div>
  );
}
