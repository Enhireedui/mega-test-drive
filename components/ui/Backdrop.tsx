/**
 * The page's depth, in three layers and no graphics.
 *
 * A flat near-black reads as cheap at full-screen scale — a whole viewport of one
 * value gives the eye nothing to settle on. But the obvious fix is worse: the hero
 * originally carried a hard red wash out of the top-left corner, which put a
 * colour cast behind a chrome lockup that reads better against nothing.
 *
 * What is here instead is a lit centre and dark edges, which is the oldest trick
 * for making a surface look expensive and the quietest:
 *
 *   1. one very weak neutral radial, centred slightly above the middle so its
 *      brightest point sits where the lockup does;
 *   2. a vignette pulling the outer edges down — this does more for the sense of
 *      light than the radial itself;
 *   3. grain over both.
 *
 * There used to be a red ember low on the page as well. It is gone: with an
 * ambient glow now sitting behind the hero title, a second coloured source was
 * one light too many.
 *
 * The grain is not decoration. A radial ramp across 2000px of near-black bands
 * visibly — far more so than the same ramp on a light ground, because the eye has
 * more contrast sensitivity down there — and a few per cent of noise is the
 * cheapest way to break the steps up.
 *
 * `fixed` and `-z-10`: it is the room, not a section, so it does not scroll with
 * the content and never participates in layout.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 1 — the lit centre. 4.5% white at its peak, falling away to nothing. */}
      <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_38%,rgb(255_255_255_/_0.045)_0%,rgb(255_255_255_/_0.016)_45%,transparent_75%)]" />

      {/* 2 — vignette. */}
      <div className="absolute inset-0 bg-[radial-gradient(115%_95%_at_50%_45%,transparent_35%,rgb(0_0_0_/_0.45)_100%)]" />

      {/* 3 — grain. */}
      <div className="grain absolute inset-0 opacity-[0.045] mix-blend-soft-light" />
    </div>
  );
}
