/**
 * The page's atmosphere: a single warm bloom above the mark, a faint horizon
 * ring lifted from the poster's rooftop, and night closing in below.
 *
 * Entirely static CSS — no scroll listener, no client JavaScript, nothing that
 * can leave content in a half-animated state.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-night">
      {/* Light source: behind and above, as on the poster. Its centre sits on
          the event mark, so the brightest part of the page is the anchor. */}
      <div className="absolute left-1/2 top-0 h-[38rem] w-[64rem] max-w-[150vw] -translate-x-1/2 -translate-y-[34%] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_22%,transparent)_0%,color-mix(in_srgb,var(--color-magenta-dusk)_12%,transparent)_46%,transparent_78%)] blur-[40px]" />

      {/* The horizon, reduced to a single hairline circle, centred on the mark. */}
      <div className="absolute left-1/2 top-[7rem] size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05] sm:top-[9rem] sm:size-[34rem]" />

      {/* Indigo depth, resolving to near-black at the close. */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(180deg,transparent_0%,color-mix(in_srgb,var(--color-indigo-sky)_30%,transparent)_52%,var(--color-abyss)_100%)]" />

      <div className="grain absolute inset-0 opacity-[0.032] mix-blend-overlay" />
    </div>
  );
}
