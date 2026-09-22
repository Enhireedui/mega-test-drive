import Image from "next/image";

import { eventConfig } from "@/lib/config";

/**
 * The colophon.
 *
 * A field record is signed at the foot, so this is set as one: the mark and who
 * they are, and nothing else. Nothing is repeated from above — the date, the hours
 * and the venue are each stated once, in the table, and a footer restating them
 * would be the same sentence twice on a page this short.
 *
 * The map link is not down here either. It belongs beside the place it points
 * at, in the masthead, where someone is actually wondering where the venue is —
 * a colophon is the last place anyone looks for directions.
 *
 * The extra bottom padding under `lg` is clearance for the docked phone CTA,
 * which is `position: fixed` and so cannot reserve space for itself. Without it
 * the bar rests on top of the wordmark at the foot of the page.
 */
export function SiteFooter() {
  const { presenter } = eventConfig;

  return (
    <footer className="px-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-10 sm:px-10 lg:px-14 lg:pb-16">
      <div className="flex items-center gap-5 sm:gap-6">
        <Image
          src={presenter.logo}
          alt={presenter.name}
          width={presenter.logoWidth}
          height={presenter.logoHeight}
          loading="lazy"
          sizes="150px"
          className="h-4 w-auto shrink-0"
        />
        <p className="ref text-slate">{presenter.role}</p>
      </div>
    </footer>
  );
}
