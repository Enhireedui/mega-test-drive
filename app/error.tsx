"use client";

import { ActionButton } from "@/components/ui/ActionButton";

/**
 * The page failed to render.
 *
 * Set in the same type and on the same ground as everything else, because a
 * visitor who has hit this has no use for a styled panel — they need one sentence
 * and a button. `svh`, not `vh`: on a phone 100vh is taller than the visible area
 * while the browser's own chrome is on screen, which would push the button under
 * it.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-7">
      <div className="w-full max-w-md">
        <p className="eyebrow text-white/50">Алдаа</p>
        <h1 className="display-md mt-7 text-white">Хуудсыг харуулах боломжгүй байна.</h1>
        <p className="mt-5 text-[0.9375rem] leading-relaxed text-white/55">
          Энэ доголдол түр зуурын байж магадгүй. Дахин оролдоод үзнэ үү.
        </p>
        <ActionButton size="md" onClick={() => reset()} className="mt-10">
          Дахин оролдох
        </ActionButton>
      </div>
    </div>
  );
}
