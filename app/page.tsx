import type { Metadata } from "next";

import { EventInfo } from "@/components/EventInfo";
import { Footer } from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { RegistrationCard } from "@/components/RegistrationCard";
import { Reveal } from "@/components/Reveal";
import { getAvailability } from "@/lib/availability";
import { eventConfig, eventStartTimestamps } from "@/lib/config";

export const metadata: Metadata = {
  title: "Бүртгэл",
};

/** Availability is read on the server every 30s; the shell stays static. */
export const revalidate = 30;

function EventStructuredData() {
  const [firstStart] = eventStartTimestamps();
  const startDate = firstStart === undefined ? undefined : new Date(firstStart).toISOString();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventConfig.title,
    description: eventConfig.intro.body[0] ?? eventConfig.intro.lead,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(startDate ? { startDate } : {}),
    location: {
      "@type": "Place",
      name: eventConfig.venue.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Улаанбаатар",
        addressCountry: "MN",
        description: eventConfig.venue.hint,
      },
    },
    organizer: {
      "@type": "Organization",
      name: eventConfig.distributor,
      url: eventConfig.siteUrl,
    },
    image: [`${eventConfig.siteUrl}/event/fleet.jpg`],
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "MNT",
      availability: "https://schema.org/InStock",
      url: `${eventConfig.siteUrl}/#register`,
    },
  };

  return (
    <script
      type="application/ld+json"
      // Values come from the local config only — no user input reaches this.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function Page() {
  const slots = await getAvailability();

  return (
    <>
      <EventStructuredData />
      <main className="mx-auto flex w-full max-w-[46rem] flex-col items-center px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-14">
        <PageHeader />

        {/* Registration first — reading second. */}
        <div className="mt-8 w-full sm:mt-9">
          <RegistrationCard availability={slots} />
        </div>

        <Reveal delay={0.05} className="mt-16 w-full sm:mt-20">
          <EventInfo />
        </Reveal>

        <Footer />
      </main>
    </>
  );
}
