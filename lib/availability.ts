import { eventConfig, isSlotClosed, slotKey } from "@/lib/config";
import type { SlotAvailability, SlotStatus } from "@/types/registration";

/** `"<dateId>|<timeId>"` → number of registrations already taken. */
export type SlotCounts = Readonly<Record<string, number>>;

export const AVAILABILITY_TAG = "availability";

const READ_TIMEOUT_MS = 6_000;
const REVALIDATE_SECONDS = 30;

function isSlotCounts(value: unknown): value is Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

/**
 * Accepts both `"<date>|<time>"` and bare `"<time>"` keys.
 *
 * The sheet for a single-day event stores only a time, so the endpoint returns
 * bare times; those are attributed to the configured event date. Anything that
 * is neither is dropped rather than silently mis-attributed.
 */
function normalizeCountKeys(raw: Record<string, number>): Record<string, number> {
  const eventDate = eventConfig.dates[0]?.id;
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (key.includes("|")) {
      normalized[key] = (normalized[key] ?? 0) + value;
      continue;
    }
    if (!/^\d{2}:\d{2}$/.test(key) || !eventDate) continue;
    const composite = slotKey(eventDate, key);
    normalized[composite] = (normalized[composite] ?? 0) + value;
  }

  return normalized;
}

function extractCounts(payload: unknown): Record<string, number> | null {
  if (typeof payload !== "object" || payload === null) return null;
  const counts = (payload as { counts?: unknown }).counts;
  if (isSlotCounts(counts)) return normalizeCountKeys(counts);
  if (isSlotCounts(payload)) return normalizeCountKeys(payload);
  return null;
}

/**
 * Reads taken-seat counts from the Apps Script endpoint.
 * Every failure mode degrades to "no data" so the page always renders.
 */
async function readSlotCounts(): Promise<SlotCounts | null> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return null;

  const endpoint = `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}mode=counts`;

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS, tags: [AVAILABILITY_TAG] },
    });
    if (!response.ok) return null;
    return extractCounts(await response.json());
  } catch {
    return null;
  }
}

function statusFor(dateId: string, timeId: string, remaining: number): SlotStatus {
  if (isSlotClosed(dateId, timeId)) return "closed";
  if (remaining <= 0) return "full";
  return "open";
}

/** Pure projection of counts onto the configured date × time matrix. */
function buildAvailability(counts: SlotCounts | null): SlotAvailability[] {
  const capacity = eventConfig.maxPerSlot;

  return eventConfig.dates.flatMap((date) =>
    eventConfig.timeSlots.map((slot) => {
      const taken = counts?.[slotKey(date.id, slot.id)] ?? 0;
      const remaining = Math.max(0, capacity - Math.max(0, taken));
      return {
        date: date.id,
        time: slot.id,
        remaining,
        status: statusFor(date.id, slot.id, remaining),
      };
    }),
  );
}

/** Server-side entry point used by the page to seed the registration form. */
export async function getAvailability(): Promise<SlotAvailability[]> {
  return buildAvailability(await readSlotCounts());
}
