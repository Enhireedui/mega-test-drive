import Image from "next/image";

import { eventConfig } from "@/lib/config";
import { normalizePhone } from "@/lib/validation";
import sainLogo from "@/public/brand/sain-motors.png";

/** Quiet close: the mark, who is running it, where, and nothing else. */
export function Footer() {
  const { venue, contact, distributor, distributorNote } = eventConfig;
  const eventYear = eventConfig.dates[0]?.iso.slice(0, 4) ?? "";

  return (
    <footer className="mt-16 flex w-full flex-col items-center gap-4 border-t border-white/[0.06] pt-10 text-center sm:mt-20 sm:pt-12">
      <Image
        src={sainLogo}
        alt={distributor}
        loading="lazy"
        sizes="112px"
        className="h-5 w-[4.75rem] opacity-70"
      />

      <p className="text-[0.625rem] font-medium uppercase tracking-[0.24em] text-white/55">
        {distributorNote}
      </p>

      <p className="text-[0.8125rem] leading-relaxed text-white/60">
        {venue.mapUrl ? (
          <a
            href={venue.mapUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-white/20 underline-offset-4 transition-colors duration-200 hover:text-white hover:decoration-white/50"
          >
            {venue.name}
          </a>
        ) : (
          venue.name
        )}
        <span className="text-white/35"> · </span>
        {venue.hint}
      </p>

      {contact.phone ? (
        <a
          href={`tel:+976${normalizePhone(contact.phone)}`}
          className="font-display text-[0.9375rem] font-semibold tabular-nums tracking-tight text-white/75 transition-colors duration-200 hover:text-white"
        >
          {contact.phone}
        </a>
      ) : null}

      <p className="mt-2 text-[0.6875rem] text-white/45">
        © {eventYear} {distributor}
      </p>
    </footer>
  );
}
