import { eventConfig, isSlotClosed, slotKey } from "@/lib/config";
import type { SlotAvailability, SlotStatus } from "@/types/registration";

/** `"<dateId>|<timeId>"` → registrations already taken. */
export type SlotCounts = Readonly<Record<string, number>>;

export const AVAILABILITY_TAG = "availability";

const READ_TIMEOUT_MS = 6_000;
const REVALIDATE_SECONDS = 30;

function isSlotCounts(value: unknown): value is Record<string, number> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

/**
 * Normalises the keys the endpoint returns to `"<date>|<time>"`.
 *
 * Edition 5 ran on a single day, so its sheet stored only a time and the site
 * attributed bare times to the one configured date. Edition 6 runs on two, and
 * that shortcut is now a correctness hazard rather than a convenience: a bare
 * "14:00" could belong to either Saturday or Sunday, and guessing would report
 * one day as full while the other still had seats.
 *
 * So a bare time is accepted only while there is exactly one event date to
 * attribute it to, and dropped otherwise. Dropping undercounts, which shows a
 * slot as emptier than it is; the Apps Script re-counts under a document lock
 * before every write, so an oversold slot is still refused at the point it
 * matters. Mis-attributing, by contrast, would turn people away from a day that
 * was open.
 */
function normalizeCountKeys(raw: Record<string, number>): Record<string, number> {
  const singleDate = eventConfig.dates.length === 1 ? eventConfig.dates[0]?.id : undefined;
  const normalized: Record<string, number> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (key.includes("|")) {
      normalized[key] = (normalized[key] ?? 0) + value;
      continue;
    }
    if (!singleDate || !/^\d{2}:\d{2}$/.test(key)) continue;
    const composite = slotKey(singleDate, key);
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
