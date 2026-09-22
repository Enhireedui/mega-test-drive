import { eventConfig } from "@/lib/config";

/**
 * The makes out on the day.
 *
 * ── Information where the last edition had ornament ──────────────────────
 * Edition 7's one graphic was a drawing of the mountain pass it was held on —
 * the terrain was the event, so surveying it was the page's argument. Edition 8
 * is two days in a city and has no such subject; keeping the contour field would
 * have left a picture of a mountain on a page about Darkhan.
 *
 * What replaces it is the only thing the poster carries that the rest of the
 * page does not, and the thing a visitor weighing up a test drive most wants to
 * know: which cars will be there. Ten names, set as an index. It is texture and
 * it is content, which is the only kind of decoration this page allows.
 *
 * ── Set as type, never as logos ──────────────────────────────────────────
 * No marque artwork was supplied. Redrawing ten manufacturers' wordmarks from
 * memory would put ten fake logos on an official distributor's page — wrong
 * letterforms, wrong colours, wrong trademarks. Oswald at a common size says
 * exactly what the poster says and claims nothing it should not.
 *
 * It sits below the form, not above it. On a phone this is the one band that can
 * safely be met after registering rather than before, and putting it any higher
 * would push the form further down the screen.
 */
export function MarqueIndex() {
  const { marques } = eventConfig;

  return (
    <section
      aria-labelledby="marques-title"
      className="border-t border-rule px-6 pt-10 sm:px-10 lg:px-14 lg:pt-14"
    >
      <h2 id="marques-title" className="ref text-slate">
        Брендүүд
      </h2>

      {/*
       * Two across on a phone, five on a wide screen — ten divides evenly into
       * both, so the last row is never a single orphaned name against empty
       * space. Each cell keeps a hairline under it so the set reads as an index
       * rather than as a wall of words.
       */}
      <ul className="mt-6 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
        {marques.map((marque) => (
          <li
            key={marque.name}
            className="flex items-baseline gap-2 border-b border-rule py-3.5 sm:gap-2.5"
          >
            <span className="font-display text-[1.0625rem] font-medium uppercase tracking-[0.06em] text-bone sm:text-[1.125rem]">
              {marque.name}
            </span>
            {/* Only where the poster prints one. */}
            {marque.note ? (
              <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-slate">
                {marque.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
