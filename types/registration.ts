/**
 * Domain types for the MEGA TEST DRIVE 6 registration flow.
 * Shared by the client form and the server action.
 *
 * There is no seat-count type here any more. Windows have no capacity, so there
 * is nothing about a slot the server knows and the config does not.
 */

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
  /** The chosen window was closed by hand. Never a capacity refusal. */
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
