/**
 * Domain types for the MEGA EVENT TEST DRIVE 8 registration flow.
 * Shared by the client form and the server action.
 *
 * ── Four questions ────────────────────────────────────────────────────────
 * A name, a phone number, which day, and what time. Edition 7 asked a name, a
 * number and which coach; there is no coach this time, and there are two days
 * instead of one, so the transport question became a when question.
 *
 * Day and time both earn their place operationally rather than editorially: the
 * fleet is out on two separate days across an eleven-hour window, and nobody can
 * staff that from a list of names.
 */

/** Raw values held by the form. `honeypot` must stay empty for humans. */
export interface RegistrationFormValues {
  fullName: string;
  phone: string;
  /** A day id from lib/config.ts (e.g. "10.01"). */
  visitDate: string;
  /** A slot id from lib/config.ts (e.g. "12:00"). */
  visitTime: string;
  honeypot: string;
}

export type RegistrationErrorCode =
  | "VALIDATION"
  | "DUPLICATE"
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

/**
 * Payload contract shared with the Google Apps Script endpoint.
 *
 * `timestamp`, `fullName` and `phone` keep the names they have had since edition
 * 6 — the sheet's first three columns never changed and renaming them would
 * break a working endpoint for nothing. `visitDate` and `visitTime` are edition
 * 6's own names, brought back now that there is something to put in them again;
 * they replace edition 7's `transport`.
 *
 * `event` is new, and is the one constant on the row: the organiser asked for
 * the campaign to be identifiable in the sheet itself, so a tab that is ever
 * copied or merged still says which event it holds.
 *
 * **This changes the upstream contract.** docs/apps-script.gs has been rewritten
 * to match and must be published as a NEW VERSION before this page can take a
 * registration: edition 7's deployed script rejects any body without a
 * transport. See the header of that file.
 */
export interface RegistrationPayload {
  readonly timestamp: string;
  readonly fullName: string;
  readonly phone: string;
  /** Spelled out for the organiser — see `dayLabel` in lib/config.ts. */
  readonly visitDate: string;
  readonly visitTime: string;
  readonly event: string;
}
