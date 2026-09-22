/**
 * SAIN MOTORS — MEGA EVENT TEST DRIVE 8 (ДАРХАН ХОТ)
 * Google Apps Script backend for the registration landing page.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  YOU MUST PUBLISH A NEW VERSION OF THIS SCRIPT BEFORE THE PAGE GOES LIVE.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Edition 8's form asks four questions — a name, a phone number, which of the
 * two days, and what time — and sends exactly those plus the campaign's own
 * name. Edition 7's script requires a `transport` field in every request and
 * answers `{ ok: false, reason: "invalid" }` when it is missing. If edition 7's
 * script is left deployed, EVERY registration on the new page fails. There is no
 * partial-compatibility mode: update this file and redeploy.
 *
 * Why the fields moved: edition 7 ran one day at a mountain pass with a coach on
 * a timetable, so "which coach" was the one genuine per-person answer. Edition 8
 * runs 2026.10.01 and 10.02 in Darkhan with no coach laid on, so the question
 * became "which day, and when" — two answers that are real data on every row.
 *
 * `event` is the one constant written per row. It is redundant while this tab
 * holds one campaign, and it is there on purpose: a tab that is later copied,
 * exported or merged still says which event it holds.
 *
 * ── The same spreadsheet as editions 6 and 7, on its own tab ───────────────
 * SPREADSHEET_ID is unchanged: the registrations stay in one place and you keep
 * working in the document you already have open. Edition 8's rows land on their
 * own tab inside it, created on the first registration. Earlier editions' tabs
 * are never read or written.
 *
 * Two reasons the rows do not simply continue below edition 7's:
 *
 *   1. The columns no longer line up. Edition 7 wrote "Унаа" into D and left E
 *      to your team; this edition writes the day into D, the time into E and the
 *      campaign into F. Appending to that tab would file arrival times under a
 *      column your team uses by hand.
 *   2. The duplicate check reads the whole phone column of the tab it writes to.
 *      Sharing a tab with edition 7 would tell everyone who registered in August
 *      that they are already registered, and the page has no way to tell them
 *      apart from a genuine double submission.
 *
 * ── Sheet layout (must match COLUMN_* below) ───────────────────────────────
 *   A  Бүртгүүлсэн огноо   written by this script
 *   B  Овог нэр            written by this script
 *   C  Утас                written by this script
 *   D  Ирэх өдөр           written by this script
 *   E  Цаг                 written by this script
 *   F  Эвент               written by this script
 *   G  Холбогдсон          left blank — for your team
 *   H  Ирсэн эсэх          left blank — for your team
 *   I  Тэмдэглэл           left blank — for your team
 *
 * Columns G–I are never touched, so notes added by hand survive every write.
 *
 * ── Deployment (must be done from the sheet owner's Google account) ────────
 * 1. Open the sheet ▸ Extensions ▸ Apps Script.
 * 2. In the Files panel, open `Code.gs`, select everything and replace it with
 *    this file. Save (Ctrl+S).
 * 3. Deploy ▸ Manage deployments ▸ edit the existing deployment ▸
 *    Version: New version ▸ Deploy.
 *    (First time only: Deploy ▸ New deployment ▸ gear ▸ Web app,
 *       Execute as:      Me
 *       Who has access:  Anyone        ← not "Anyone with Google Account"
 *     then approve the permission prompt, and copy the /exec URL into
 *     GOOGLE_SHEETS_WEBHOOK_URL.)
 *
 * Editing the deployment in place keeps the /exec URL you already have, so
 * GOOGLE_SHEETS_WEBHOOK_URL does not change. Editing this file WITHOUT
 * publishing a new version leaves the old code running. This is the single most
 * common reason a change appears to do nothing.
 *
 * ── Contract ──────────────────────────────────────────────────────────────
 * POST  body: { timestamp, fullName, phone, visitDate, visitTime, event }
 *       ->    { ok: true } | { ok: false, reason: "duplicate" | "invalid" |
 *                                                "busy" }
 *
 * GET   ->    { ok: true }   — a health check, nothing more. The site reads
 *                             nothing back at render time, so the page is served
 *                             from static HTML and never waits on Apps Script.
 *
 * There is no capacity limit and no `full`: every registration is accepted. The
 * duplicate check runs inside a document lock, so concurrent submissions cannot
 * write the same person twice.
 */

/* The same spreadsheet as editions 6 and 7. Edition 8 writes on SHEET_NAME. */
var SPREADSHEET_ID = "1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw";

/* Edition 8's own tab. Created on the first registration if it is not there.
   Earlier editions' rows live on their own tabs and are left alone. Renaming the
   tab by hand in Sheets means renaming it here too, or the next write recreates
   it empty. */
var SHEET_NAME = "Тест драйв 8";

var TIME_ZONE = "Asia/Ulaanbaatar";
var LOCK_TIMEOUT_MS = 20000;

/* 1-indexed column positions. */
var COLUMN_TIMESTAMP = 1;
var COLUMN_NAME = 2;
var COLUMN_PHONE = 3;
var COLUMN_VISIT_DATE = 4;
var COLUMN_VISIT_TIME = 5;
var COLUMN_EVENT = 6;

var HEADERS = [
  "Бүртгүүлсэн огноо",
  "Овог нэр",
  "Утас",
  "Ирэх өдөр",
  "Цаг",
  "Эвент",
  "Холбогдсон",
  "Ирсэн эсэх",
  "Тэмдэглэл"
];

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function sheet_() {
  var spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  /* Only write headers into a completely empty sheet — never overwrite yours. */
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function digitsOnly_(value) {
  return String(value).replace(/\D/g, "");
}

/**
 * True when this phone is already registered.
 *
 * Read with getDisplayValues(), not getValues(): Sheets stores a number typed
 * into a cell as a number, and an 8-digit string read back as a float would
 * never match the digits the site sends.
 */
function isDuplicate_(sheet, phone) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var rows = sheet.getRange(2, COLUMN_PHONE, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < rows.length; i += 1) {
    if (digitsOnly_(rows[i][0]) === phone) return true;
  }
  return false;
}

/* A health check. The site asks this endpoint nothing at render time. */
function doGet() {
  return json_({ ok: true });
}

function doPost(event) {
  var body;
  try {
    body = JSON.parse(event.postData.contents);
  } catch (error) {
    return json_({ ok: false, reason: "invalid" });
  }

  var fullName = String(body.fullName || "").trim();
  var phone = digitsOnly_(body.phone || "");
  var visitDate = String(body.visitDate || "").trim();
  var visitTime = String(body.visitTime || "").trim();
  var eventName = String(body.event || "").trim();
  var submittedAt = body.timestamp ? new Date(body.timestamp) : new Date();
  if (isNaN(submittedAt.getTime())) submittedAt = new Date();

  /* Mongolian mobile numbers are 8 digits. The site validates this too; the
     check is repeated here because a webhook URL is a public endpoint. */
  if (!fullName || phone.length !== 8 || !visitDate || !visitTime) {
    return json_({ ok: false, reason: "invalid" });
  }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    return json_({ ok: false, reason: "busy" });
  }

  try {
    var sheet = sheet_();

    /* The only reason a submission is ever refused. */
    if (isDuplicate_(sheet, phone)) {
      return json_({ ok: false, reason: "duplicate" });
    }

    var row = [];
    row[COLUMN_TIMESTAMP - 1] = Utilities.formatDate(
      submittedAt,
      TIME_ZONE,
      "yyyy-MM-dd HH:mm:ss"
    );
    row[COLUMN_NAME - 1] = fullName;
    /* Leading apostrophe keeps Sheets from eating a leading zero or reading the
       number as a float. */
    row[COLUMN_PHONE - 1] = "'" + phone;
    /* Leading apostrophe again: "10.01" and "12:00" are both shapes Sheets will
       happily reinterpret as a date or a duration in some locales. */
    row[COLUMN_VISIT_DATE - 1] = "'" + visitDate;
    row[COLUMN_VISIT_TIME - 1] = "'" + visitTime;
    row[COLUMN_EVENT - 1] = eventName || "MEGA TEST DRIVE 8";

    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
