import { eventConfig } from "@/lib/config";

/**
 * The invitation, after the form.
 *
 * The incentive that used to open this section now sits in the hero, where it
 * can do its work; what remains is the warm detail somebody reads once they
 * have already decided — or while they are deciding.
 */
export function EventInfo() {
  return (
    <section aria-labelledby="event-info-heading" className="w-full">
      <h2 id="event-info-heading" className="sr-only">
        Урилга
      </h2>

      <div aria-hidden="true" className="hairline-h h-px" />

      <div className="mx-auto mt-11 max-w-[32rem] space-y-4 text-center sm:mt-12">
        {eventConfig.intro.body.map((paragraph) => (
          <p
            key={paragraph}
            className="text-pretty text-[0.9375rem] leading-[1.8] text-white/60 sm:text-base"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
