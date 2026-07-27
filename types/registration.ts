/**
 * Domain types for the MEGA TEST DRIVE 5 registration flow.
 * Shared by the client form, the server action and the availability reader.
 */

/** A day the event is open for test drives. */
export interface EventDate {
  /** Stable identifier, also the value written to the sheet (e.g. "2026.07.04"). */
  readonly id: string;
  /** Display label (e.g. "2026.07.04"). */
  readonly label: string;
  /** Mongolian weekday label (e.g. "Бямба гараг"). */
  readonly weekday: string;
  /** ISO calendar date used for timestamp maths (e.g. "2026-07-04"). */
  readonly iso: string;
}

/** A bookable start time. Slots are `slotDurationHours` long. */
export interface EventTimeSlot {
  /** Stable identifier / value written to the sheet (e.g. "11:00"). */
  readonly id: string;
  /** Display label (e.g. "11:00"). */
  readonly label: string;
}

export interface EventVenue {
  readonly name: string;
  readonly hint: string;
  /** External map URL. Empty string hides the link. */
  readonly mapUrl: string;
}

export interface EventContact {
  /** Display form, e.g. "7777 0000". Empty string hides the row. */
  readonly phone: string;
  readonly facebookUrl: string;
  readonly instagramUrl: string;
}

/** Headline numbers reused across hero, highlights and metadata. */
export interface EventStats {
  readonly brandCount: number;
  readonly modelCountLabel: string;
  readonly luckyDrawGuests: number;
}

/** The only prose on the page. */
export interface EventIntroCopy {
  /** Single opening line, set large. */
  readonly lead: string;
  /** Supporting paragraphs, in order. */
  readonly body: readonly string[];
}

export interface EventConfig {
  readonly edition: number;
  readonly title: string;
  readonly distributor: string;
  readonly distributorNote: string;
  readonly siteUrl: string;
  /** UTC offset of the venue, in hours (Ulaanbaatar = +8). */
  readonly utcOffsetHours: number;
  readonly dates: readonly EventDate[];
  readonly timeSlots: readonly EventTimeSlot[];
  readonly slotDurationHours: number;
  /** Registration ceiling for a single date + time slot. */
  readonly maxPerSlot: number;
  /** Manually closed slots as `"<dateId>|<timeId>"`, regardless of capacity. */
  readonly closedSlots: readonly string[];
  readonly venue: EventVenue;
  readonly contact: EventContact;
  readonly brands: readonly string[];
  readonly stats: EventStats;
  readonly intro: EventIntroCopy;
}

export type SlotStatus = "open" | "full" | "closed";

export interface SlotAvailability {
  readonly date: string;
  readonly time: string;
  readonly remaining: number;
  readonly status: SlotStatus;
}

/** Raw values held by the form. `honeypot` must stay empty for humans. */
export interface RegistrationFormValues {
  fullName: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  honeypot: string;
}

export type RegistrationErrorCode =
  | "VALIDATION"
  | "DUPLICATE"
  | "SLOT_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK"
  | "UPSTREAM"
  | "CONFIG"
  | "UNKNOWN";

export type RegistrationResult =
  | { readonly status: "success" }
  | {
      readonly status: "error";
      readonly code: RegistrationErrorCode;
      /** Field to focus when the failure is attributable to one. */
      readonly field?: keyof RegistrationFormValues;
    };

/** Payload contract shared with the Google Apps Script endpoint. */
export interface RegistrationPayload {
  readonly timestamp: string;
  readonly fullName: string;
  readonly phone: string;
  readonly visitDate: string;
  readonly visitTime: string;
}
