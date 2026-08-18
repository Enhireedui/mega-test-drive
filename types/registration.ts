/**
 * Domain types for the MEGA EVENT TEST DRIVE 7 registration flow.
 * Shared by the client form and the server action.
 *
 * ── Three questions ───────────────────────────────────────────────────────
 * A name, a phone number, and how they are getting there. Edition 6 also asked
 * which day and which three-hour window; this edition runs one day with the door
 * open 11:00–19:00, so there is nothing left to choose there. No model selector
 * either — it is a campaign registration, not a configurator.
 *
 * Transport is the exception, and it earns its place operationally rather than
 * editorially: a coach runs to the pass on a fixed timetable, and nobody can load
 * it without knowing who is on it.
 */

/** Raw values held by the form. `honeypot` must stay empty for humans. */
export interface RegistrationFormValues {
  fullName: string;
  phone: string;
  /** A shuttle run id from lib/config.ts, or `OWN_CAR`. */
  transport: string;
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
 * Four fields. Edition 6 sent `visitDate` and `visitTime`; this edition asks for
 * neither, and sending the event's own day and hours back to the sheet would fill
 * two columns with the same constant on every row — a default dressed up as data.
 * What it does send is the transport answer, which is real per-person data.
 *
 * **This changes the upstream contract.** docs/apps-script.gs has been rewritten
 * to match and must be published as a NEW VERSION before this page can take a
 * registration: edition 6's deployed script rejects any body without a visit
 * date. See the header of that file.
 */
export interface RegistrationPayload {
  readonly timestamp: string;
  readonly fullName: string;
  readonly phone: string;
  /** Spelled out for the organiser — see `transportLabel` in lib/config.ts. */
  readonly transport: string;
}
