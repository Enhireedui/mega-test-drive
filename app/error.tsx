"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void error;
  }, [error]);

  /* svh, not vh: on a phone 100vh is taller than the visible area while the
     browser's own chrome is on screen, which would push the button under it. */
  return (
    <div className="flex min-h-svh items-center justify-center px-5">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-hi">Something went wrong</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">Бүртгэлний процессыг гүйцэтгэх боломжгүй байна</h2>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Энэ асуудал түр зуурын байж болно. Дахин оролдоод үзнэ үү.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Дахин оролдох
        </button>
      </div>
    </div>
  );
}
