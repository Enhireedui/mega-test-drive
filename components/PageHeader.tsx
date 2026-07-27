import Image from "next/image";

import { eventConfig, eventDateRangeLabel, eventHoursLabel } from "@/lib/config";
import lockup from "@/public/brand/mega-test-drive-5.png";
import sainLogo from "@/public/brand/sain-motors.png";

/**
 * Deliberately short: the distributor mark, the event lockup, and when and
 * where. Nothing else stands between arriving and the first form field.
 *
 * The lockup animates by transform only (never opacity), so it paints
 * immediately and cannot delay Largest Contentful Paint.
 */
export function PageHeader() {
  const { venue, distributor, title, dates } = eventConfig;
  const weekday = dates[0]?.weekday ?? "";

  return (
    <header className="flex w-full flex-col items-center text-center">
      <Image
        src={sainLogo}
        alt={distributor}
        priority
        sizes="130px"
        className="animate-rise h-6 w-[5.75rem] sm:h-7 sm:w-[6.6875rem]"
      />

      <h1
        className="animate-settle relative mt-5 w-full max-w-[11.5rem] sm:mt-6 sm:max-w-[13.5rem]"
        style={{ animationDelay: "0.06s" }}
      >
        <Image
          src={lockup}
          alt={title}
          priority
          sizes="(max-width: 640px) 184px, 216px"
          className="h-auto w-full"
        />
        <span className="sr-only"> — {distributor}-ийн туршилтын жолоодлогын өдөрлөг</span>
        {/* Specular sweep: one sharp glint against an almost-still page. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="animate-sheen absolute inset-y-0 -left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-md" />
        </span>
      </h1>

      {/* Stacked on a phone, one line from sm up — never a ragged wrap. */}
      <p
        className="animate-rise mt-6 flex flex-col items-center gap-1.5 rounded-[1.25rem] border border-brand/25 bg-brand/[0.07] px-5 py-2.5 text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.18em] text-white/75 sm:mt-7 sm:flex-row sm:gap-x-2.5 sm:rounded-full sm:py-2 sm:text-[0.625rem] sm:tracking-[0.22em]"
        style={{ animationDelay: "0.14s" }}
      >
        <span className="tabular-nums">
          {eventDateRangeLabel()} · {weekday}
        </span>
        <span aria-hidden="true" className="hidden text-white/30 sm:inline">
          ·
        </span>
        <span className="tabular-nums">{eventHoursLabel()}</span>
        <span aria-hidden="true" className="hidden text-white/30 sm:inline">
          ·
        </span>
        <span>{venue.name}</span>
      </p>
    </header>
  );
}
