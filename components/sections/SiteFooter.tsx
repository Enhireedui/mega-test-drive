import Image from "next/image";

import { eventConfig } from "@/lib/config";

/**
 * The sign-off. The last thing on the page, and all of it.
 *
 * The sponsor's mark and one line naming them. No date, no venue, no copyright,
 * no second lockup — the hero states the facts one screen above this, and a footer
 * that repeats them is just a second chance to read the same sentence.
 *
 * This is now the *only* place the sponsor appears. It used to be credited at the
 * top of the hero as well, which on a page this short was the same credit twice.
 *
 * The sign-off names them "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР" — official distributor —
 * which is the standing relationship, not the poster credit. The hero opens with
 * the poster's own words ("ЕРӨНХИЙ ИВЭЭН ТЭТГЭГЧ"); the footer closes with what
 * the company is. Hence two fields on the presenter rather than one.
 */
export function SiteFooter() {
  const { presenter } = eventConfig;

  return (
    <footer className="border-t border-edge px-6 py-16 text-center sm:py-20">
      <Image
        src={presenter.logo}
        alt={presenter.name}
        width={presenter.logoWidth}
        height={presenter.logoHeight}
        loading="lazy"
        sizes="220px"
        className="mx-auto h-6 w-auto sm:h-7"
      />

      <p className="eyebrow mt-6 text-white/55">
        {presenter.signOffRole}
        <span aria-hidden="true" className="mx-2 text-white/25">
          ·
        </span>
        {presenter.name}
      </p>
    </footer>
  );
}
