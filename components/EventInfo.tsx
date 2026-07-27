import { eventConfig } from "@/lib/config";

/**
 * The invitation, placed after the form: someone arriving already knows what
 * MEGA TEST DRIVE is, so registering comes first and the reading comes second.
 */
export function EventInfo() {
  const { intro } = eventConfig;

  return (
    <section aria-labelledby="event-info-heading" className="w-full">
      <div aria-hidden="true" className="hairline-h h-px" />

      {/* Clearly above the step titles in the hierarchy — this is the payoff line. */}
      <h2
        id="event-info-heading"
        className="text-flare mx-auto mt-12 max-w-[30rem] text-balance text-center font-display text-[clamp(1.1875rem,4vw,1.625rem)] font-bold leading-[1.35] tracking-[-0.015em] sm:mt-14"
      >
        {intro.lead}
      </h2>

      <div className="mx-auto mt-6 max-w-[32rem] space-y-4 text-center sm:mt-7">
        {intro.body.map((paragraph) => (
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
