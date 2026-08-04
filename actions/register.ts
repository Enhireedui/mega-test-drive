"use server";

import { isSlotClosed } from "@/lib/config";
import { normalizeFullName, normalizePhone, registrationSchema } from "@/lib/validation";
import type {
  RegistrationFormValues,
  RegistrationPayload,
  RegistrationResult,
} from "@/types/registration";

/** Comfortably inside a serverless host's 10s synchronous function budget. */
const WRITE_TIMEOUT_MS = 8_000;

/** Window in which an identical submission is treated as a double-post. */
const DEDUPE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Guards against double submissions from the same device/number within one
 * server instance. The Apps Script endpoint performs the authoritative
 * duplicate check, so a cold start can never let a duplicate row through.
 */
const recentSubmissions = new Map<string, number>();

function pruneRecentSubmissions(now: number): void {
  for (const [key, timestamp] of recentSubmissions) {
    if (now - timestamp > DEDUPE_WINDOW_MS) recentSubmissions.delete(key);
  }
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

/** Apps Script answers `{ ok: true }` or `{ ok: false, reason: "duplicate" | … }`. */
function readUpstreamOutcome(raw: string): { ok: boolean; reason?: string } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { ok, reason } = parsed as { ok?: unknown; reason?: unknown };
    if (typeof ok !== "boolean") return null;
    return typeof reason === "string" ? { ok, reason } : { ok };
  } catch {
    return null;
  }
}

export async function registerAttendee(
  values: RegistrationFormValues,
): Promise<RegistrationResult> {
  // 1 — bot trap. Silent, generic response.
  if (values.honeypot.trim().length > 0) {
    return { status: "error", code: "VALIDATION" };
  }

  // 2 — re-validate on the server; never trust the client.
  const parsed = registrationSchema.safeParse(values);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return {
      status: "error",
      code: "VALIDATION",
      ...(typeof field === "string" && field !== "honeypot"
        ? { field: field as keyof RegistrationFormValues }
        : {}),
    };
  }

  const fullName = normalizeFullName(parsed.data.fullName);
  const phone = normalizePhone(parsed.data.phone);
  const { visitDate, visitTime } = parsed.data;

  // 3 — manually closed slot. The only refusal a window can produce: there is no
  //     per-day or per-time ceiling, so nobody is ever turned away for capacity.
  if (isSlotClosed(visitDate, visitTime)) {
    return { status: "error", code: "SLOT_UNAVAILABLE", field: "visitTime" };
  }

  // 4 — in-flight duplicate guard. Keyed on the number alone, matching the
  //     one-registration-per-phone rule stated on the form.
  const now = Date.now();
  pruneRecentSubmissions(now);
  const dedupeKey = phone;
  if (recentSubmissions.has(dedupeKey)) {
    return { status: "error", code: "DUPLICATE", field: "phone" };
  }

  /*
   * One upstream request, and only one. There is no capacity to check, so the
   * write is the whole conversation — which is what keeps this inside the host's
   * 10s synchronous function budget on an Apps Script cold start.
   */
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    // Local development without a sheet still exercises the full UI flow.
    if (process.env.NODE_ENV === "development") {
      recentSubmissions.set(dedupeKey, now);
      return { status: "success" };
    }
    return { status: "error", code: "CONFIG" };
  }

  const payload: RegistrationPayload = {
    timestamp: new Date(now).toISOString(),
    fullName,
    phone,
    visitDate,
    visitTime,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(WRITE_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { status: "error", code: "UPSTREAM" };
    }

    const outcome = readUpstreamOutcome(await response.text());

    /*
     * Never report success without an explicit `ok: true`. A Web App deployed
     * with the wrong access setting answers 200 with a Google sign-in page, and
     * treating an unparseable body as success would tell people they are
     * registered while nothing was ever written to the sheet.
     */
    if (!outcome) {
      return { status: "error", code: "UPSTREAM" };
    }
    if (!outcome.ok) {
      if (outcome.reason === "duplicate") {
        return { status: "error", code: "DUPLICATE", field: "phone" };
      }
      /*
       * `full` is no longer a refusal this app can cause — the script has no
       * capacity check. It is still mapped rather than dropped because an older
       * deployment left in place would answer it, and letting that fall through
       * to UPSTREAM would hide a real, actionable message behind a shrug.
       */
      if (outcome.reason === "full") {
        return { status: "error", code: "SLOT_UNAVAILABLE", field: "visitTime" };
      }
      return { status: "error", code: "UPSTREAM" };
    }
  } catch (error) {
    if (isTimeoutError(error)) return { status: "error", code: "TIMEOUT" };
    /*
     * A `fetch` TypeError here is the server failing to reach Apps Script — a
     * bad URL, DNS, or a TLS chain it does not trust. It is never the visitor's
     * connection, so it must not be reported as one; NETWORK is reserved for
     * the browser telling us it is offline.
     */
    if (error instanceof TypeError) return { status: "error", code: "UPSTREAM" };
    return { status: "error", code: "UNKNOWN" };
  }

  recentSubmissions.set(dedupeKey, now);
  return { status: "success" };
}
