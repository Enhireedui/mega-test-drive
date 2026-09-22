"use client";

import { useEffect, useState } from "react";

/** Fired by the form once a registration has been accepted. */
export const REGISTERED_EVENT = "registration:done";

/**
 * The phone's call to action.
 *
 * On a wide screen the form sits beside the facts and is on screen from the
 * first paint, so there is nothing to dock — this is `lg:hidden` and costs a
 * desktop visitor nothing but the observer it never fires.
 *
 * On a phone the columns stack and the form is below the facts, so without this
 * the one action the page exists for is off screen on arrival. The bar is shown
 * for exactly that case and no other: it docks while the registration section is
 * out of view and gets out of the way the moment the real form is on screen, so
 * it never covers the fields it is pointing at and never sits over the
 * confirmation.
 *
 * ── Why an observer and not a scroll listener ────────────────────────────
 * A scroll handler runs on every frame of every scroll and has to measure the
 * section itself, which is a layout read in the middle of a scroll — the classic
 * way to make a phone stutter. `IntersectionObserver` answers the same question
 * off the main thread and calls back twice: once when the form leaves, once when
 * it arrives.
 *
 * It is `position: fixed`, so it is outside the document flow and cannot push
 * content; `SiteFooter` carries matching bottom padding on small screens so the
 * bar never rests on top of the colophon, and `env(safe-area-inset-bottom)`
 * keeps it clear of the home indicator on a notched iPhone.
 */
export function StickyRegister({ targetId, label }: { targetId: string; label: string }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry?.isIntersecting),
      /*
       * The bottom 55% of the viewport does not count as arrived.
       *
       * Measured, not guessed: on a 390×800 phone the registration column starts
       * at y≈652 and its submit button at y≈1279. Watching the section's own top
       * edge would therefore hide the bar on first paint — the heading is
       * technically on screen, while everything a visitor has to touch is two
       * thirds of a screen below it. Shrinking the root's bottom edge means the
       * bar stands down only once the form has climbed into the upper 45% of the
       * screen, which is the point at which the day and time plates are actually
       * in front of the visitor.
       */
      { threshold: 0, rootMargin: "0px 0px -55% 0px" },
    );
    observer.observe(target);

    const finish = () => setDone(true);
    window.addEventListener(REGISTERED_EVENT, finish);

    return () => {
      observer.disconnect();
      window.removeEventListener(REGISTERED_EVENT, finish);
    };
  }, [targetId]);

  if (done || !visible) return null;

  return (
    <div
      className={
        "dock fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-midnight/95 " +
        "px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
      }
    >
      {/*
       * An anchor, not a button: it works before hydration, it can be
       * middle-clicked, and `scroll-behavior: smooth` on the root gives it the
       * same movement a button would have had to script.
       */}
      <a
        href={`#${targetId}`}
        className={
          "flex h-14 w-full select-none items-center justify-center rounded bg-signal-deep " +
          "font-sans text-[0.8125rem] font-medium uppercase tracking-[0.2em] text-white " +
          "transition-colors duration-300 ease-enter hover:bg-signal " +
          "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-amber"
        }
      >
        {label}
      </a>
    </div>
  );
}
