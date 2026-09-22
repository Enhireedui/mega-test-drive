/**
 * The event, as content.
 *
 * Everything the page says about MEGA EVENT TEST DRIVE 8 is described by these
 * types and supplied once in lib/config.ts. No component invents a date, a
 * place, a time or a claim of its own.
 *
 * ── What changed from edition 7 ───────────────────────────────────────────
 * Edition 7 was one day at a mountain pass with a coach running to it, so the
 * form asked which coach and the page stated the day as a fact. Edition 8 is two
 * days in a city, with no coach laid on — the poster carries no timetable and no
 * meeting point, so `EventTransport` is gone rather than invented.
 *
 * In its place the visitor picks *when* they are coming: one of two days and one
 * of four arrival slots. Those are choices, so they are modelled as `EventDay`
 * and `EventSlot` and validated against these lists rather than against a
 * hardcoded rule somewhere else.
 *
 * `EventMarque` is also new. The poster prints ten makes, which is the single
 * most useful thing a visitor weighing up a test drive can know, and it is the
 * page's texture — information where edition 7 had a drawing of its mountain.
 */

/** One of the days the fleet is out. */
export interface EventDay {
  /** Stable id, and the value written to the sheet (e.g. "10.01"). */
  readonly id: string;
  /** Display label, exactly as the poster sets it (e.g. "10.01"). */
  readonly label: string;
  /** Mongolian weekday as the poster writes it (e.g. "Пүрэв"). */
  readonly weekday: string;
  /** ISO calendar date, for timestamps and structured data. */
  readonly iso: string;
}

/**
 * One arrival slot.
 *
 * Not a capacity and not a booking window — the door is open 11 hours and these
 * are the times the organiser asks people to aim for, so the fleet is not all
 * claimed at once. There is no `closed` flag and no seat count: nothing has been
 * supplied that would let this page refuse anyone, and a slot that greys itself
 * out without a real number behind it is fake scarcity.
 */
export interface EventSlot {
  /** Stable id, and the value written to the sheet (e.g. "12:00"). */
  readonly id: string;
  /** "HH:mm", as printed and as shown on the control. */
  readonly label: string;
}

/** The hours the doors are open. Stated, not chosen. */
export interface EventHours {
  /** "10:00 – 19:00", as printed. */
  readonly label: string;
  /** The poster's own qualifier under the hours ("цагийн хооронд"). */
  readonly note: string;
  /** Opening time as "HH:mm", for timestamp maths and structured data. */
  readonly opensAt: string;
  /** Closing time as "HH:mm". */
  readonly closesAt: string;
}

export interface EventVenue {
  /**
   * The city, as the poster names it ("Дархан хот").
   *
   * Carried for metadata and structured data — **not** set as display type on
   * the page. The campaign lockup already prints ДАРХАН ХОТ on its red plate, so
   * a heading repeating it under the artwork would be the same word twice.
   */
  readonly name: string;
  /**
   * The landmark you navigate by ("Дархан Плаза"), set as the page's display
   * heading. The poster writes the location as one phrase — "Дархан Плазагаас
   * шинэ Дархан явах замд" — which is a sentence, not a heading; it is split
   * into the landmark and the road so the eye lands on the thing it recognises.
   */
  readonly landmark: string;
  /** The road, under the landmark ("Шинэ Дархан явах зам"). */
  readonly approach: string;
  /** External map URL. An empty string hides the link rather than linking nowhere. */
  readonly mapUrl: string;
  /**
   * Venue coordinates, or `null` when they are not known.
   *
   * Nullable on purpose: nothing supplied for this edition pins the site down to
   * a coordinate, and inventing one would publish a fabricated location in
   * machine-readable form — which is worse than publishing none.
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

/**
 * One make on the day.
 *
 * Set as type, never as a logo: no marque artwork was supplied, and redrawing
 * ten manufacturers' wordmarks from memory would put ten fake logos on a
 * distributor's page. `note` carries the qualifier the poster prints under a
 * name, and only where it prints one.
 */
export interface EventMarque {
  readonly name: string;
  readonly note?: string;
}

export interface EventConfig {
  readonly edition: number;
  /** "MEGA EVENT TEST DRIVE 8" — the campaign's full name, for metadata. */
  readonly title: string;
  /**
   * The identifier written to the sheet's event column, exactly as the
   * organiser refers to the campaign.
   */
  readonly eventId: string;
  /** "ДАРХАН ХОТ" — the city, carried on the lockup's red plate. */
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
  /** Both days, in order. The form asks which one. */
  readonly days: readonly EventDay[];
  /** The four arrival slots. The form asks which one. */
  readonly slots: readonly EventSlot[];
  readonly hours: EventHours;
  readonly venue: EventVenue;
  /** The makes out on the day, as printed on the poster. */
  readonly marques: readonly EventMarque[];
}
