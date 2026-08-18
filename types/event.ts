/**
 * The event, as content.
 *
 * Everything the page says about MEGA EVENT TEST DRIVE 7 is described by these
 * types and supplied once in lib/config.ts. No component invents a date, a
 * place, a time or a claim of its own.
 *
 * ── What edition 7 dropped ────────────────────────────────────────────────
 * Edition 6 modelled a *choice*: two days, three arrival windows, ten marques,
 * a five-entry FAQ. Edition 7 has none of that. It is one day, one window, one
 * place, and the form asks for a name and a number — so the day and the window
 * stopped being options a visitor picks and became facts the page states. The
 * types followed: no `EventTimeSlot`, no `closedSlots`, no `EventBrand`, no
 * `FaqEntry`.
 *
 * What it gained is `EventTransport`. A coach runs to the pass on a timetable, so
 * the form does have to ask one question beyond a name and a number — see that
 * type for why it is the only one.
 */

/** The day the fleet is out. One, for this edition. */
export interface EventDate {
  /** Display label, exactly as the poster sets it (e.g. "2026.08.22"). */
  readonly label: string;
  /** Mongolian weekday as the poster writes it (e.g. "Бямба гараг"). */
  readonly weekday: string;
  /** ISO calendar date, for timestamps and structured data. */
  readonly iso: string;
}

/** The hours the event runs. Not a slot a visitor books — the door is open. */
export interface EventHours {
  /** "11:00 – 19:00", as printed. */
  readonly label: string;
  /** The poster's own qualifier under the hours ("цагийн хооронд"). */
  readonly note: string;
  /** Opening time as "HH:mm", for timestamp maths and structured data. */
  readonly opensAt: string;
  /** Closing time as "HH:mm". */
  readonly closesAt: string;
}

export interface EventVenue {
  /** The place, as the poster names it ("Морингийн даваа"). */
  readonly name: string;
  /**
   * The second line under it on the poster ("Наадамчдын зам") — how you get
   * there, not which region it is in. Edition 6's venue carried a `region`;
   * this poster prints an approach road instead, and the two are not the same
   * kind of fact.
   */
  readonly approach: string;
  /** External map URL. An empty string hides the link rather than linking nowhere. */
  readonly mapUrl: string;
  /**
   * Venue coordinates, or `null` when they are not known.
   *
   * Nullable on purpose. Edition 6 could name a provincial stadium and look it
   * up; a mountain pass has no such address, and inventing a latitude to fill
   * a required field would publish a fabricated location in machine-readable
   * form — which is worse than publishing none.
   */
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly timeZone: string;
}

/** Who is putting it on, and in what capacity. */
export interface EventPresenter {
  readonly name: string;
  /** Their role, exactly as the poster states it. Opens the page. */
  readonly role: string;
  readonly logo: string;
  readonly logoWidth: number;
  readonly logoHeight: number;
}

/** A bitmap the page paints, with the dimensions it was written at. */
export interface EventImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/** One shuttle run: out to the pass, and back again. */
export interface ShuttleRun {
  /** Stable id, and the value written to the sheet (e.g. "10:00"). */
  readonly id: string;
  /** Departure from the meeting point. */
  readonly departs: string;
  /** Departure from the pass, on the way back. */
  readonly returns: string;
}

/**
 * How people get there.
 *
 * A coach runs from the meeting point on a fixed timetable, and some people will
 * drive themselves — so this is the one thing the form has to ask beyond a name
 * and a number. Without it the organiser cannot know how many seats to put on the
 * road.
 */
export interface EventTransport {
  /** Where the coach leaves from, as supplied. */
  readonly meetingPoint: string;
  readonly runs: readonly ShuttleRun[];
  /** Label for the "I will drive myself" answer. */
  readonly ownCarLabel: string;
}

export interface EventConfig {
  readonly edition: number;
  /** "MEGA EVENT TEST DRIVE 7" — the campaign's full name, for metadata. */
  readonly title: string;
  /** "OFF-ROAD EDITION" — the sub-title carried in the lockup artwork. */
  readonly editionName: string;
  readonly siteUrl: string;
  /** UTC offset of the venue, in hours (Mongolia is +8 year round). */
  readonly utcOffsetHours: number;
  readonly presenter: EventPresenter;
  /** The campaign lockup. The page's signature, never rebuilt as type. */
  readonly lockup: EventImage;
  /**
   * The full poster, for social cards only — never painted on the page, and the
   * only photography the site ships. The layout has no photographic band.
   */
  readonly poster: EventImage;
  readonly date: EventDate;
  readonly hours: EventHours;
  readonly venue: EventVenue;
  readonly transport: EventTransport;
}
