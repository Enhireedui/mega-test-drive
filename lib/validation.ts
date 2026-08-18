import { z } from "zod";

import { transportChoices } from "@/lib/config";

/**
 * Mongolian mobile numbers are 8 digits and begin with 5–9
 * (Mobicom / Unitel / Skytel / G-Mobile ranges).
 */
const MN_MOBILE_PATTERN = /^[5-9]\d{7}$/;

/**
 * Reduce any user-entered form of a Mongolian number to bare 8 digits:
 * strips spaces, dashes, parentheses and an optional +976 / 976 country code.
 */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length > 8 && digits.startsWith("976") ? digits.slice(3) : digits;
}

/** "9911 2233" — grouping used while typing, purely presentational. */
export function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/**
 * Inline field messages.
 *
 * Full sentences with a closing full stop, which is what the brief specifies:
 * with only two fields on the page an error is a rare event and reads as a
 * remark, not as a terse label under a control.
 */
const messages = {
  fullNameRequired: "Нэрээ оруулна уу.",
  fullNameInvalid: "Зөвхөн үсэг, зай болон зураас оруулах боломжтой.",
  phoneRequired: "Утасны дугаараа оруулна уу.",
  phoneInvalid: "Утасны дугаараа зөв оруулна уу.",
  transportRequired: "Унаагаа сонгоно уу.",
} as const;

/**
 * Three fields, and the trap.
 *
 * No `visitDate`, no `visitTime`, no model: the event is one day inside one
 * window and the fleet is not chosen from a list. `transport` is the one question
 * beyond a name and a number, and it is asked because the organiser runs a coach
 * on a timetable and cannot load it otherwise.
 *
 * It is validated against the ids in lib/config.ts rather than a hardcoded list,
 * so editing the timetable there cannot leave a stale rule here that rejects a
 * run the form is offering.
 */
export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, messages.fullNameRequired)
    .max(80, messages.fullNameRequired)
    .regex(/^[\p{L}\p{M}\s'’.-]+$/u, messages.fullNameInvalid),
  phone: z
    .string()
    .trim()
    .min(1, messages.phoneRequired)
    .refine((value) => MN_MOBILE_PATTERN.test(normalizePhone(value)), messages.phoneInvalid),
  transport: z
    .string()
    .refine((value) => transportChoices().includes(value), messages.transportRequired),
  // Bots fill every field they find; humans never see this one.
  honeypot: z.string().max(0),
});

/** Collapse runs of whitespace so "  Бат   Эрдэнэ " becomes "Бат Эрдэнэ". */
export function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * User-facing copy for every failure path. Never leaks technical detail.
 *
 * Most codes answer with the one sentence the brief specifies, because from the
 * visitor's chair a timeout, a bad gateway and an unparseable response are the
 * same event with the same remedy: it did not go through, try again. The three
 * that say something else are the three where "try again" would be wrong advice
 * — an already-registered number, a dead connection, and a misconfigured
 * endpoint that will keep failing until someone fixes it.
 */
const GENERIC_FAILURE = "Бүртгэл илгээхэд алдаа гарлаа. Дахин оролдоно уу.";

const errorCopy: Record<string, string> = {
  VALIDATION: "Бөглөсөн мэдээллээ шалгаад дахин оролдоно уу.",
  DUPLICATE: "Энэ утасны дугаараар аль хэдийн бүртгүүлсэн байна.",
  TIMEOUT: GENERIC_FAILURE,
  NETWORK: "Интернэт холболт тасалдсан байна. Дахин оролдоно уу.",
  UPSTREAM: GENERIC_FAILURE,
  CONFIG: "Бүртгэлийн систем түр хугацаанд ажиллахгүй байна. Та бидэнтэй шууд холбогдоно уу.",
  UNKNOWN: GENERIC_FAILURE,
};

export function messageForErrorCode(code: string): string {
  return errorCopy[code] ?? GENERIC_FAILURE;
}
