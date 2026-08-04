/**
 * Domain types for the MEGA TEST DRIVE 6 registration flow.
 * Shared by the client form, the server action and the availability reader.
 */

export type SlotStatus = "open" | "full" | "closed";

/** One day × time cell, as the server last saw it. */
export interface SlotAvailability {
  /** Event date id, e.g. "2026.08.08". */
  readonly date: string;
  /** Time slot id, e.g. "14:00". */
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
