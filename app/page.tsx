import { Hero } from "@/components/sections/Hero";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { eventConfig, eventStartTimestamps } from "@/lib/config";

/*
 * Fully static. Every word on this page comes from lib/config.ts, and with no
 * capacity to report there is nothing left to re-read at runtime — so there is
 * no `revalidate` and no upstream request between a visitor and the first paint.
 */

function EventStructuredData() {
  const [firstStart] = eventStartTimestamps();
  const startDate = firstStart === undefined ? undefined : new Date(firstStart).toISOString();
  const { venue, dates } = eventConfig;
  const lastDate = dates[dates.length - 1];

  /*
   * Only claims that are printed on the poster or enforced by this app. In
   * particular there is no `offers` block: nothing has told us what admission
   * costs, and asserting a price of zero in machine-readable form — where a
   * search engine can surface it as fact — would be worse than omitting it.
   */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventConfig.title,
    description: `${eventConfig.host.name}-ийн хүрээнд болох ${eventConfig.title}.`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(startDate ? { startDate } : {}),
    ...(lastDate ? { endDate: lastDate.iso } : {}),
    location: {
      "@type": "Place",
      name: venue.name,
      address: {
        "@type": "PostalAddress",
        addressRegion: venue.region,
        addressCountry: "MN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: venue.latitude,
        longitude: venue.longitude,
      },
    },
    superEvent: { "@type": "Event", name: eventConfig.host.name },
    sponsor: {
      "@type": "Organization",
      name: eventConfig.presenter.name,
      url: eventConfig.siteUrl,
    },
    image: [`${eventConfig.siteUrl}${eventConfig.poster.src}`],
  };

  return (
    <script
      type="application/ld+json"
      // Values come from the local config only — no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * One screen, and a sign-off.
 *
 * The event with its form fills the viewport; below it the sponsor's mark and one
 * line naming them. There is nothing else — no invitation copy, no brand wall, no
 * photography, no availability counter, no FAQ. A visitor arrives, reads two
 * facts, and registers.
 */
export default function Page() {
  return (
    <>
      <EventStructuredData />

      <a
        href="#register"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-5 focus:py-3 focus:text-[0.8125rem] focus:text-night"
      >
        Бүртгэл рүү шилжих
      </a>

      <main>
        <Hero />
      </main>

      <SiteFooter />
    </>
  );
}
