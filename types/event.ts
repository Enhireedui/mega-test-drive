/**
 * The event, as content.
 *
 * Everything the page says about MEGA TEST DRIVE 6 is described by these types
 * and supplied once in lib/config.ts. No component invents a date, a place, a
 * brand or a number of its own.
 */

/** A day the fleet is open for test drives. */
export interface EventDate {
  /** Stable id, also the value written to the sheet (e.g. "2026.08.08"). */
  readonly id: string;
  /** Full display label (e.g. "2026.08.08"). */
  readonly label: string;
  /** Day of the month on its own, set large in the date block (e.g. "08"). */
  readonly dayOfMonth: string;
  /** Mongolian weekday (e.g. "Бямба"). */
  readonly weekday: string;
  /** ISO calendar date, for timestamp maths and the weather request. */
  readonly iso: string;
}

/** A bookable arrival time. Slots run for `slotDurationHours`. */
export interface EventTimeSlot {
  /** Stable id / sheet value (e.g. "11:00"). */
  readonly id: string;
  readonly label: string;
}

export interface EventVenue {
  /** The place itself (e.g. "Төв цэнгэлдэх хүрээлэн"). */
  readonly name: string;
  /** Where that place is (e.g. "Сүхбаатар аймаг"). */
  readonly region: string;
  /** External map URL. An empty string hides the link rather than linking nowhere. */
  readonly mapUrl: string;
  /** Venue coordinates, used for the forecast. */
  readonly latitude: number;
  readonly longitude: number;
  /** IANA zone, so the forecast comes back on local calendar days. */
  readonly timeZone: string;
}

/** The festival MEGA TEST DRIVE 6 runs inside. */
export interface EventHost {
  readonly name: string;
  /** Path to the host's lockup, drawn for dark surfaces. */
  readonly logo: string;
  readonly logoWidth: number;
  readonly logoHeight: number;
}

/** Who is putting it on, and in what capacity. */
export interface EventPresenter {
  readonly name: string;
  /** Their role, exactly as the artwork states it. Opens the page. */
  readonly role: string;
  /**
   * The role as the footer states it. Usually the same words as `role`, but the
   * sign-off names the commercial relationship rather than the poster credit,
   * and the two are not always one thing.
   */
  readonly signOffRole: string;
  readonly logo: string;
  readonly logoWidth: number;
  readonly logoHeight: number;
}

/** One participating marque. Shown as its logo and nothing else. */
export interface EventBrand {
  /** Accessible name — the only text form of the mark on the page. */
  readonly name: string;
  readonly logo: string;
  readonly logoWidth: number;
  readonly logoHeight: number;
  /** Optical size multiplier on the shared cap height of the brand wall. */
  readonly scale: number;
}

export interface FaqEntry {
  readonly question: string;
  readonly answer: string;
}

export interface EventConfig {
  readonly edition: number;
  readonly title: string;
  readonly siteUrl: string;
  /** UTC offset of the venue, in hours (Mongolia is +8 year round). */
  readonly utcOffsetHours: number;
  readonly host: EventHost;
  readonly presenter: EventPresenter;
  /** The event's own lockup, drawn for dark surfaces. */
  readonly lockup: {
    readonly src: string;
    readonly width: number;
    readonly height: number;
  };
  /** The full poster, used for social cards. */
  readonly poster: { readonly src: string; readonly width: number; readonly height: number };
  readonly dates: readonly EventDate[];
  readonly timeSlots: readonly EventTimeSlot[];
  readonly slotDurationHours: number;
  /**
   * Slots closed by hand as `"<dateId>|<timeId>"`.
   *
   * The only way a window can be unavailable. There is no registration ceiling:
   * every day and every time takes as many people as turn up.
   */
  readonly closedSlots: readonly string[];
  readonly venue: EventVenue;
  readonly brands: readonly EventBrand[];
  readonly faq: readonly FaqEntry[];
}
