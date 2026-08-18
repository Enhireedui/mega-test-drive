import { Masthead } from "@/components/sections/Masthead";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { eventConfig, eventEndTimestamp, eventStartTimestamp, venueLabel } from "@/lib/config";

/*
 * Fully static. Every word comes from lib/config.ts and nothing is read back at
 * runtime — no capacity to report, no availability to check — so there is no
 * `revalidate` and no upstream request between a visitor and the first paint.
 */

function EventStructuredData() {
  const { title, editionName, venue, presenter, siteUrl, poster } = eventConfig;
  const start = eventStartTimestamp();
  const end = eventEndTimestamp();

  /*
   * Only claims the poster makes or this app enforces.
   *
   * No `offers` block: nothing has told us what admission costs, and asserting a
   * price of zero in machine-readable form — where a search engine can surface it
   * as fact — would be worse than omitting it. No `geo` block either, for the
   * same reason: the venue's coordinates are unknown, and a guess published here
   * is a guess published as data.
   */
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${title} — ${editionName}`,
    description:
      `${title} — ${editionName}. ${venueLabel()}, ` +
      `${eventConfig.date.label} (${eventConfig.date.weekday}), ${eventConfig.hours.label}.`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(start === null ? {} : { startDate: new Date(start).toISOString() }),
    ...(end === null ? {} : { endDate: new Date(end).toISOString() }),
    location: {
      "@type": "Place",
      name: venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: venue.approach,
        addressCountry: "MN",
      },
      /* The organiser's own map link, published only when one exists. A `geo` block
         is still omitted: the coordinates remain unknown, and a guessed latitude
         published as machine-readable fact is worse than no latitude. */
      ...(venue.mapUrl ? { hasMap: venue.mapUrl } : {}),
    },
    organizer: {
      "@type": "Organization",
      name: presenter.name,
      url: siteUrl,
    },
    image: [`${siteUrl}${poster.src}`],
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
 * A cover, the facts beside the form, and a colophon.
 *
 * Two elements. The masthead carries the whole invitation — the credit, the
 * campaign lockup, the place, the three facts and the form — and the colophon signs
 * it. Nothing else: no navigation, no benefits section, no lineup, no FAQ, no brand
 * wall, no photographic band and no second call to action.
 *
 * There is no photograph on the page at all, and that is the brief rather than an
 * omission. What carries it instead is the campaign lockup — chrome and red, and
 * dramatic on its own — over the contour field. The supplied photography still ships
 * as the social card, where a link preview has no room for real text.
 */
export default function Page() {
  return (
    <>
      <EventStructuredData />

      <a
        href="#registration"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-bone focus:px-5 focus:py-3 focus:text-[0.8125rem] focus:text-basalt"
      >
        Бүртгэл рүү шилжих
      </a>

      <main>
        <Masthead />
      </main>

      <SiteFooter />
    </>
  );
}
