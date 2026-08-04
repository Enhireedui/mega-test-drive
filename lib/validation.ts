import { z } from "zod";

import { findEventDate, isKnownTimeSlot } from "@/lib/config";

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
  const withoutCountryCode =
    digits.length > 8 && digits.startsWith("976") ? digits.slice(3) : digits;
  return withoutCountryCode;
}

/** "9911 2233" — grouping used while typing, purely presentational. */
export function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value).slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)} ${digits.slice(4)}`;
}

/** Inline field messages: short prompts, so no closing full stop. */
export const messages = {
  fullNameRequired: "Нэрээ оруулна уу",
  fullNameInvalid: "Зөвхөн үсэг, зай болон зураас оруулах боломжтой",
  phoneRequired: "Утасны дугаараа оруулна уу",
  phoneInvalid: "8 оронтой мобайл дугаараа зөв оруулна уу",
  dateRequired: "Ирэх өдрөө сонгоно уу",
  timeRequired: "Цагаа сонгоно уу",
} as const;

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
  visitDate: z
    .string()
    .min(1, messages.dateRequired)
    .refine((value) => findEventDate(value) !== undefined, messages.dateRequired),
  visitTime: z
    .string()
    .min(1, messages.timeRequired)
    .refine((value) => isKnownTimeSlot(value), messages.timeRequired),
  // Bots fill every field they find; humans never see this one.
  honeypot: z.string().max(0),
});

export type RegistrationSchema = z.infer<typeof registrationSchema>;

/** Collapse runs of whitespace so "  Бат   Эрдэнэ " becomes "Бат Эрдэнэ". */
export function normalizeFullName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/** User-facing copy for every failure path. Never leaks technical detail. */
export const errorCopy: Record<string, string> = {
  VALIDATION: "Бүртгэлийн мэдээлэл дутуу байна. Талбар бүрийг шалгаад дахин оролдоно уу.",
  DUPLICATE: "Энэ утасны дугаараар аль хэдийн бүртгүүлсэн байна.",
  /* Not "дүүрсэн" — no window has a ceiling. A time is unavailable only when the
     organiser has closed it by hand. */
  SLOT_UNAVAILABLE: "Сонгосон цаг боломжгүй болсон байна. Өөр цаг сонгоно уу.",
  TIMEOUT: "Хариу хэт удаж байна. Холболтоо шалгаад дахин оролдоно уу.",
  NETWORK: "Интернэт холболт тасалдсан байна. Дахин оролдоно уу.",
  UPSTREAM: "Бүртгэл хүлээн авахад түр зуурын доголдол гарлаа. Хэсэг хугацааны дараа дахин оролдоно уу.",
  CONFIG: "Бүртгэлийн систем түр хугацаанд ажиллахгүй байна. Та бидэнтэй шууд холбогдоно уу.",
  UNKNOWN: "Уучлаарай, бүртгэл хийгдсэнгүй. Дахин оролдоно уу.",
};

export function messageForErrorCode(code: string): string {
  return errorCopy[code] ?? errorCopy.UNKNOWN ?? "";
}
