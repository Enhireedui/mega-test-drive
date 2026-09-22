/**
 * Keeps the Apps Script deployment warm.
 *
 * ── The problem this exists to solve ──────────────────────────────────────
 * A Google Apps Script Web App that has not been called for a while is cold,
 * and a cold one is slow in a way no serverless timeout can absorb. Measured
 * against the live endpoint on 2026-09-22:
 *
 *     GET  (health)   cold 42.3s   warm 1.2s
 *     POST (write)    cold 16.0s   warm 4.0s
 *
 * Netlify gives a synchronous function 10 seconds. So on a cold endpoint the
 * registration action gives up — while Apps Script carries on server-side and
 * writes the row anyway. The visitor is told their registration failed, and it
 * is sitting in the sheet. That is the worst failure this app can produce, and
 * raising the timeout cannot fix it: 16 seconds does not fit inside 10.
 *
 * ── The fix ───────────────────────────────────────────────────────────────
 * Never let it go cold. A GET every five minutes costs one trivial request and
 * keeps every real registration on the warm path, where a write takes about
 * four seconds and finishes comfortably inside the budget.
 *
 * `doGet` in docs/apps-script.gs exists for exactly this: it answers
 * `{ ok: true }`, touches no sheet and writes nothing, so this can never
 * create a row.
 *
 * ── Notes ─────────────────────────────────────────────────────────────────
 * This is deliberately quiet. A ping that fails is not an incident — the next
 * one is five minutes away and a visitor arriving in between simply gets the
 * cold path the app already handles. It logs the outcome so a run can be read
 * in the Netlify function log, and never throws: a scheduled function that
 * fails loudly every five minutes trains people to ignore the log.
 *
 * Nothing on the site depends on this running. It is a latency optimisation,
 * not a piece of the registration path.
 */

/** Generous: this is a background ping with nobody waiting on it. */
const PING_TIMEOUT_MS = 60_000;

export default async () => {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!url) {
    console.log("keep-warm: GOOGLE_SHEETS_WEBHOOK_URL is not set — nothing to ping");
    return new Response("skipped", { status: 200 });
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    /* Drain the body so the connection is not left half-read. */
    await response.text();

    console.log(`keep-warm: HTTP ${response.status} in ${Date.now() - startedAt}ms`);
  } catch (error) {
    console.log(
      `keep-warm: ping failed after ${Date.now() - startedAt}ms — ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return new Response("ok", { status: 200 });
};

/**
 * Every five minutes.
 *
 * Apps Script stays warm for longer than that, so this is comfortably inside
 * the window rather than racing it, and it is 288 trivial requests a day —
 * nowhere near any Apps Script quota.
 */
export const config = {
  schedule: "*/5 * * * *",
};
