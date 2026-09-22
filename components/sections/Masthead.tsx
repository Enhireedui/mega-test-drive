import Image from "next/image";

import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { datesLabel, eventConfig, weekdaysLabel } from "@/lib/config";

/**
 * The invitation: who is asking, what it is, where and when, and the form.
 *
 * ── The identity carries it, and there is no photograph ──────────────────
 * The credit and the campaign lockup open the page as real elements — the lockup
 * placed as its own transparent asset, so it stays crisp at every width and
 * scales with the viewport instead of being baked into a bitmap. The page has no
 * photography on it at all; the supplied poster ships as the social card only,
 * where a link preview has no room for real text.
 *
 * ── What the lockup already says, the page does not repeat ───────────────
 * Edition 7 set its venue as display type under the artwork, because its lockup
 * carried only "OFF-ROAD EDITION". This one carries ДАРХАН ХОТ on a red plate,
 * so a heading printing ДАРХАН ХОТ underneath it would be the same word twice in
 * two type treatments. What goes there instead is the thing the lockup does not
 * say and a driver actually needs: the landmark, and the road off it.
 *
 * ── Why the form is up here ──────────────────────────────────────────────
 * The strongest thing this page can do for its one job is delete the step
 * between wanting to register and being able to. On a wide screen the facts hold
 * the left column and the form holds the right, both in the first screenful —
 * there is no "scroll to the form". On a phone the columns become one, identity
 * and facts first, and the docked bar (see StickyRegister) covers the gap.
 *
 *   ┌─────────────────────────────────────────┬──────────────────┐
 *   │ SAIN MOTORS · АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР   │  № 08            │
 *   ├─────────────────────────────────────────┼──────────────────┤
 *   │   [ TEST DRIVE 8 LOCKUP · ДАРХАН ХОТ ]  │   БҮРТГҮҮЛЭХ     │
 *   │                                         │   Өдөр           │
 *   │   ДАРХАН ПЛАЗА                          │   [10.01][10.02] │
 *   │   Шинэ Дархан явах зам                  │   Цаг            │
 *   │   ────────────────────                  │   [10:00][12:00] │
 *   │   ОГНОО   2026.10.01, 02                │   [14:00][16:00] │
 *   │   ГАРАГ   Пүрэв, Баасан гараг           │   Нэр            │
 *   │   ЦАГ     10:00 – 19:00                 │   Утасны дугаар  │
 *   │                                         │   [ БҮРТГҮҮЛЭХ ] │
 *   └─────────────────────────────────────────┴──────────────────┘
 *
 * The vertical rule between the columns is the page's only divider, and it earns
 * its place: left is the event, right is what you do about it.
 *
 * A server component apart from the form. The entrance is a CSS animation and
 * nothing here observes scroll, so everything except the controls works before
 * hydration.
 */

/** Beats of the staggered entrance, in seconds. */
const BEAT = {
  head: 0.04,
  lockup: 0.12,
  venue: 0.24,
  facts: 0.33,
  form: 0.42,
} as const;

/** `--rise-delay` is read by `.rise` in globals.css. */
const rise = (delay: number) => ({ "--rise-delay": `${delay}s` }) as React.CSSProperties;

export function Masthead() {
  const { presenter, lockup, title, editionName, edition, hours, venue } = eventConfig;

  /*
   * The facts, as a field table. Three rows, each a label against a value —
   * which is what makes them scannable in one pass and why they are a `dl`
   * rather than three sentences. The weekdays are not a figure, so that is the
   * one value not marked numeric.
   */
  const facts = [
    { label: "Огноо", value: datesLabel(), numeric: true },
    { label: "Гараг", value: weekdaysLabel(), numeric: false },
    { label: "Цаг", value: hours.label, numeric: true, note: hours.note },
  ];

  return (
    <section className="relative isolate px-6 pb-16 sm:px-10 lg:px-14 lg:pb-24">
      {/* ── the standing head ───────────────────────────────────────────────
          The wordmark, the credit set as real letterspaced type, and the edition
          number as a reference mark. One hairline under it, and no navigation:
          there is nowhere else to go. */}
      <header
        style={rise(BEAT.head)}
        className="rise flex items-center justify-between gap-6 border-b border-rule py-5 lg:py-6"
      >
        {/* `items-start` is load-bearing: a flex column stretches its children
            across the cross axis by default, which on a phone stretched the
            wordmark to the width of the credit line under it and distorted it. */}
        <div className="flex min-w-0 flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-6">
          <Image
            src={presenter.logo}
            alt={presenter.name}
            width={presenter.logoWidth}
            height={presenter.logoHeight}
            priority
            sizes="150px"
            className="h-4 w-auto shrink-0"
          />
          {/* Set as type, not lifted from the artwork: the supplied lockup
              carries this line as a hairline outline that turns to grey mush at
              the size a distributor credit is actually shown. */}
          <p className="ref text-slate">{presenter.role}</p>
        </div>

        <p className="ref shrink-0 text-amber" data-numeric="">
          № {String(edition).padStart(2, "0")}
        </p>
      </header>

      {/* ── the two columns ─────────────────────────────────────────────── */}
      <div className="grid items-start gap-y-12 lg:grid-cols-[1fr_auto] lg:gap-x-16 xl:gap-x-24">
        {/* ── left: what it is ─────────────────────────────────────────── */}
        <div className="pt-10 lg:pt-16">
          {/*
           * The campaign identity. `h1` wraps the artwork and carries the full
           * name as its accessible text, so the page has a real heading without
           * setting display type that would compete with the lockup.
           */}
          <h1 style={rise(BEAT.lockup)} className="rise">
            <Image
              src={lockup.src}
              alt={`${title} — ${editionName}`}
              width={lockup.width}
              height={lockup.height}
              priority
              sizes="(min-width: 1280px) 576px, (min-width: 1024px) 46vw, (min-width: 640px) 74vw, 88vw"
              className="h-auto w-[min(88vw,28rem)] lg:w-[min(46vw,36rem)]"
            />
          </h1>

          <div style={rise(BEAT.venue)} className="rise mt-[clamp(2.5rem,6vw,3.75rem)]">
            <h2 className="display text-bone">{venue.landmark}</h2>
            <p className="mt-3 font-display text-[1.0625rem] font-normal tracking-[0.08em] text-slate sm:text-lg">
              {venue.approach}
            </p>

            {/* Rendered only when a destination exists, so it can never open
                nowhere. No map link was supplied for this edition, so this is
                absent rather than guessed at. */}
            {venue.mapUrl ? (
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="ref mt-6 inline-flex items-center gap-2 border-b border-rule-lit pb-1 text-bone transition-colors duration-300 ease-enter hover:border-amber hover:text-amber"
              >
                Байршлыг харах
                {/* Marks the link as leaving the page. Decorative, so the label
                    carries the meaning. */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="size-2.5 shrink-0"
                >
                  <path
                    d="M2.5 9.5 9.5 2.5M9.5 2.5H4.5M9.5 2.5v5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : null}
          </div>

          {/* Labels in a fixed column so the three values align on a common left
              edge — the thing that makes a table read as data rather than as
              three stacked lines. */}
          <dl
            style={rise(BEAT.facts)}
            className="rise mt-[clamp(2.5rem,5vw,3.5rem)] max-w-md border-t border-rule"
          >
            {facts.map((fact) => (
              <div
                key={fact.label}
                className="flex items-baseline gap-6 border-b border-rule py-4 sm:gap-8"
              >
                <dt className="ref w-20 shrink-0 pt-1 text-slate">{fact.label}</dt>
                <dd
                  className="figure-md text-bone"
                  {...(fact.numeric ? { "data-numeric": "" } : {})}
                >
                  {fact.value}
                  {/* Its own line, deliberately — set inline it wrapped under the
                      figure at narrow widths and read as a broken row. The poster
                      sets it this way too. */}
                  {fact.note ? (
                    <span className="mt-1.5 block font-sans text-[0.8125rem] font-normal leading-none tracking-normal text-slate">
                      {fact.note}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── right: what you do about it ──────────────────────────────────
            A fixed 22rem measure from `lg` up — wide enough for a comfortable
            17px field and a two-up set of plates, narrow enough that it reads as
            a form rather than as a second column of content. */}
        <div
          id="registration"
          style={rise(BEAT.form)}
          className="rise w-full scroll-mt-8 lg:w-[22rem] lg:border-l lg:border-rule lg:pl-16 lg:pt-16 xl:pl-24"
        >
          <RegistrationForm headingId="registration-title" />
        </div>
      </div>
    </section>
  );
}
