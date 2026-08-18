/**
 * SAIN MOTORS — MEGA EVENT TEST DRIVE 7 (OFF-ROAD EDITION)
 * Google Apps Script backend for the registration landing page.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  YOU MUST PUBLISH A NEW VERSION OF THIS SCRIPT BEFORE THE PAGE GOES LIVE.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Edition 7's form asks three questions — a name, a phone number, and which
 * coach the person is taking — and sends exactly those. Edition 6's script
 * requires a visit date and a visit time in every request and answers
 * `{ ok: false, reason: "invalid" }` when they are missing. If edition 6's script
 * is left deployed, EVERY registration on the new page fails. There is no
 * partial-compatibility mode: update this file and redeploy.
 *
 * Why the old fields went away: edition 6 ran over two days with three arrival
 * windows, so the day and the window were genuine answers. Edition 7 is one day,
 * 2026.08.22, with the door open 11:00–19:00. Writing that same pair into every
 * row would be a constant pretending to be data, so the page stopped sending it
 * and this script stopped asking.
 *
 * What replaced them is one genuinely per-person field: "Унаа". A coach runs from
 * the BYD 4S showroom on a fixed timetable, and column D is how you load it —
 * it reads either "Автобус 10:00 (буцах 12:00)" or "Хувийн унаагаар".
 *
 * ── The same spreadsheet as edition 6, on its own tab ──────────────────────
 * SPREADSHEET_ID is edition 6's file, unchanged: the registrations stay in one
 * place and you keep working in the document you already have open. Edition 7's
 * rows land on their own tab inside it, created on the first registration, and
 * edition 6's "Sheet1" is never read or written.
 *
 * Two reasons the rows do not simply continue below edition 6's:
 *
 *   1. The columns no longer line up. Edition 6 wrote the visit day into D and
 *      the visit time into E; this edition writes "Унаа" into D and leaves E to
 *      your team. Appending to that sheet would file coach times under
 *      "Ирэх өдөр" and leave a permanent seam in the middle of one column.
 *   2. The duplicate check reads the whole phone column of the tab it writes to.
 *      Sharing a tab with edition 6 would make every returning visitor — anyone
 *      who signed up in August — be told they are already registered, and the
 *      page has no way to tell them apart from a genuine double submission.
 *
 * ── Sheet layout (must match COLUMN_* below) ───────────────────────────────
 *   A  Бүртгүүлсэн огноо   written by this script
 *   B  Овог нэр            written by this script
 *   C  Утас                written by this script
 *   D  Унаа                written by this script
 *   E  Холбогдсон          left blank — for your team
 *   F  Ирсэн эсэх          left blank — for your team
 *   G  Тэмдэглэл           left blank — for your team
 *
 * Columns E–G are never touched, so notes added by hand survive every write.
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
 * POST  body: { timestamp, fullName, phone, transport }
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

/* Edition 6's spreadsheet. Edition 7 writes into the same file, on SHEET_NAME. */
var SPREADSHEET_ID = "1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw";

/* Edition 7's own tab. Created on the first registration if it is not there.
   Edition 6's rows live on "Sheet1" and are left alone. Renaming the tab by hand
   in Sheets means renaming it here too, or the next write recreates it empty. */
var SHEET_NAME = "Тест драйв 7";

var TIME_ZONE = "Asia/Ulaanbaatar";
var LOCK_TIMEOUT_MS = 20000;

/* 1-indexed column positions. */
var COLUMN_TIMESTAMP = 1;
var COLUMN_NAME = 2;
var COLUMN_PHONE = 3;
var COLUMN_TRANSPORT = 4;

var HEADERS = [
  "Бүртгүүлсэн огноо",
  "Овог нэр",
  "Утас",
  "Унаа",
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
  var transport = String(body.transport || "").trim();
  var submittedAt = body.timestamp ? new Date(body.timestamp) : new Date();
  if (isNaN(submittedAt.getTime())) submittedAt = new Date();

  /* Mongolian mobile numbers are 8 digits. The site validates this too; the
     check is repeated here because a webhook URL is a public endpoint. */
  if (!fullName || phone.length !== 8 || !transport) {
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
    /* Leading apostrophe again: "10:00" inside the label is enough for Sheets to
       try to reinterpret the cell in some locales. */
    row[COLUMN_TRANSPORT - 1] = "'" + transport;

    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
