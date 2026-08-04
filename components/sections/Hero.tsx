import Image from "next/image";

import { RegistrationPanel } from "@/components/registration/RegistrationPanel";
import { eventConfig, eventDateRangeLabel, eventWeekdayLabel, venueLabel } from "@/lib/config";

/**
 * One screen. Everything on a single vertical axis.
 *
 * Dark, because every lockup we were given is white-and-red on transparency and
 * was drawn for a dark ground. No photograph, no wash of its own — the depth
 * comes from `Backdrop`, which sits behind the whole document. What is left here
 * is the artwork, two lines of fact, and one button, which is as few things as
 * this page can be made of.
 *
 * A **server component**. The fleet photograph used to sit at the bottom of this
 * band and carried a scroll-driven parallax, which was the only reason the hero
 * needed to be a client component at all. With the photograph gone the parallax
 * went with it, framer-motion left the critical path, and the entire hero is now
 * markup plus CSS. Only the form below is interactive.
 *
 * ── Vertical rhythm ──────────────────────────────────────────────────────
 * Every measure is a clamp whose middle term is `svh`, so the composition is a
 * proportion of the window rather than a fixed stack: a short window shrinks the
 * lockups instead of overflowing, and a tall one gives the slack to the margins
 * because the centre column is `flex-1` and centred. Widths are capped in `vw` so
 * a short, wide window cannot overflow sideways instead. The floors are set as
 * low as the composition tolerates, since they are what binds on a landscape
 * phone; their sum is the hero's minimum height.
 *
 * ── Why the entrance is CSS ───────────────────────────────────────────────
 * See the `hero-rise` note in globals.css. In short: everything here starts
 * invisible, so it must not be JavaScript that makes it visible again.
 */

/**
 * Beats of the staggered entrance, in seconds.
 *
 * 80ms apart, so the whole sequence has landed by 0.71s including the 0.45s each
 * element takes. A longer stagger makes a stack this short feel like it is being
 * dealt out one card at a time.
 */
const BEAT = {
  sponsor: 0.06,
  host: 0.14,
  lockup: 0.22,
  facts: 0.3,
  action: 0.38,
} as const;

/** `--rise-delay` is read by `.hero-rise` in globals.css. */
const rise = (delay: number) => ({ "--rise-delay": `${delay}s` }) as React.CSSProperties;

export function Hero() {
  const { presenter, host, lockup } = eventConfig;

  return (
    <section
      aria-label={eventConfig.title}
      className="relative flex min-h-svh flex-col overflow-hidden"
    >
      {/* ── sponsor credit ─────────────────────────────────────────────────
          Centred, on the same axis as everything else — the poster centres it too,
          and on a composition this symmetrical a single off-axis element is the
          only thing that would keep the screen from balancing.

          It also appears in the footer. That is deliberate and matches the poster:
          the credit opens the page and signs it off. */}
      <header
        style={rise(BEAT.sponsor)}
        className="hero-rise flex shrink-0 flex-col items-center px-6 pt-8 text-center sm:pt-10"
      >
        {/* The role is set as type, not taken from the artwork: the supplied
            lockup carries it as a hairline outline that turns to grey mush at any
            size a sponsor credit is actually shown at. */}
        <p className="eyebrow text-white/55">{presenter.role}</p>
        <Image
          src={presenter.logo}
          alt={presenter.name}
          width={presenter.logoWidth}
          height={presenter.logoHeight}
          priority
          sizes="200px"
          className="mt-4 h-5 w-auto sm:h-[1.375rem]"
        />
      </header>

      {/* ── the announcement, and the form ────────────────────────────────── */}
      {/* Every vertical measure here is a clamp on the 8px grid at both ends. */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-[clamp(1.5rem,4svh,3rem)] text-center sm:px-10">
        <div style={rise(BEAT.host)} className="hero-rise">
          <Image
            src={host.logo}
            alt={host.name}
            width={host.logoWidth}
            height={host.logoHeight}
            priority
            sizes="(min-width: 640px) 360px, 52vw"
            className="h-[clamp(1.875rem,8.5svh,5rem)] w-auto max-w-[52vw]"
          />
        </div>

        {/* 32–56px below the festival mark: the title needs to sit clear of it,
            not tucked under it. */}
        <h1
          style={rise(BEAT.lockup)}
          className="hero-rise relative mt-[clamp(2rem,5svh,3.5rem)]"
        >
          {/* The ambient glow, and the only one on the page. Neutral, not red — a
              red light behind a chrome lockup tints the chrome, which is what was
              wrong with the wash this replaces. Sized generously past the artwork
              and blurred, so it never shows an edge. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[190%] w-[135%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgb(255_255_255_/_0.07),transparent_78%)] blur-2xl"
          />
          <Image
            src={lockup.src}
            alt={eventConfig.title}
            width={lockup.width}
            height={lockup.height}
            priority
            sizes="(min-width: 1024px) 880px, (min-width: 640px) 80vw, 88vw"
            className="relative h-[clamp(2.75rem,24svh,13rem)] w-auto max-w-[86vw]"
          />
        </h1>

        {/* One short rule at 10% — the only border on this band. It was 20%, which
            read as a line drawn across the composition rather than as a pause. */}
        <div
          aria-hidden="true"
          style={rise(BEAT.facts)}
          className="hero-rise mt-[clamp(2rem,5svh,3rem)] h-px w-12 bg-white/10"
        />

        {/* The facts. Two lines, always: the date and the place are separate
            answers, and running them together as one line of middots makes neither
            of them land. Held 24–32px under the rule so they read as belonging to
            the title above rather than floating between it and the button. */}
        <div
          style={rise(BEAT.facts)}
          className="hero-rise mt-[clamp(1.5rem,3.5svh,2rem)] space-y-2"
        >
          <p
            data-numeric=""
            className="text-[0.9375rem] leading-[1.6] tracking-[0.005em] text-white/90 sm:text-base"
          >
            {eventDateRangeLabel()}
            <span aria-hidden="true" className="mx-2.5 text-white/25">
              ·
            </span>
            {eventWeekdayLabel()}
          </p>
          <p className="text-[0.875rem] leading-[1.6] text-white/65 sm:text-[0.9375rem]">
            {venueLabel()}
          </p>
        </div>

        <div
          style={rise(BEAT.action)}
          className="hero-rise mt-[clamp(2.5rem,6svh,4rem)] w-full"
        >
          <RegistrationPanel />
        </div>
      </div>
    </section>
  );
}
