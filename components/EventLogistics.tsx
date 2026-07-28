import { eventConfig, eventDateRangeLabel, eventHoursLabel } from "@/lib/config";

/**
 * When and where, sitting under the form as the closing confirmation.
 *
 * The day itself is repeated as the hint on the time step inside the form, so
 * nobody chooses an hour without knowing which day they are choosing it for.
 */
export function EventLogistics() {
  const weekday = eventConfig.dates[0]?.weekday ?? "";

  return (
    <div className="flex w-full flex-col items-center text-center">
      <p className="font-display text-[1.0625rem] font-semibold leading-none tracking-[0.05em] tabular-nums text-white/92 sm:text-[1.1875rem]">
        {eventDateRangeLabel()}
        <span aria-hidden="true" className="mx-2 font-normal text-white/25">
          ·
        </span>
        {weekday}
      </p>

      <p className="mt-2 text-[0.75rem] leading-none text-white/50 sm:text-[0.8125rem]">
        <span className="tabular-nums">{eventHoursLabel()}</span>
        <span aria-hidden="true" className="mx-1.5 text-white/25">
          ·
        </span>
        {eventConfig.venue.name}
      </p>
    </div>
  );
}
