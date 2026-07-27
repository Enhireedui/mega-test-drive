/**
 * SAIN MOTORS — MEGA TEST DRIVE 5
 * Google Apps Script backend for the registration landing page.
 *
 * Target sheet:
 * https://docs.google.com/spreadsheets/d/1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw/edit
 *
 * ── Sheet layout (must match COLUMN_* below) ───────────────────────────────
 *   A  Бүртгүүлсэн огноо   written by this script
 *   B  Овог нэр            written by this script
 *   C  Утас                written by this script
 *   D  Ирэх цаг            written by this script
 *   E  Холбогдсон          left blank — for your team
 *   F  Ирсэн эсэх          left blank — for your team
 *   G  Тэмдэглэл           left blank — for your team
 *
 * Columns E–G are never touched, so notes added by hand survive every write.
 *
 * ── Deployment (must be done from the sheet owner's Google account) ────────
 * 1. Open the sheet ▸ Extensions ▸ Apps Script.
 * 2. In the Files panel on the left, open `Code.gs`, select everything and
 *    replace it with this file. Save (Ctrl+S).
 * 3. Check SLOT_CAPACITY below matches `maxPerSlot` in lib/config.ts.
 * 4. Deploy ▸ New deployment ▸ gear icon ▸ Web app
 *      Execute as:        Me
 *      Who has access:    Anyone          ← not "Anyone with Google Account"
 *    Approve the permission prompt (Advanced ▸ Go to project ▸ Allow).
 * 5. Copy the /exec URL into GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * After editing this file later, you must publish a NEW VERSION
 * (Deploy ▸ Manage deployments ▸ edit ▸ New version) or the old code keeps
 * running.
 *
 * ── Contract ──────────────────────────────────────────────────────────────
 * POST  body: { timestamp, fullName, phone, visitDate, visitTime }
 *       ->    { ok: true } | { ok: false, reason: "duplicate" | "full" | "invalid" }
 *
 * GET   ?mode=counts
 *       ->    { counts: { "11:00": 12, "14:00": 3 } }
 *             Keyed by time only: this sheet stores a single event day, and the
 *             site attributes bare times to its configured date.
 *
 * Capacity and duplicate checks run inside a document lock, so concurrent
 * submissions can never oversell a slot or write the same person twice.
 */

var SPREADSHEET_ID = "1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw";
var SHEET_NAME = "Sheet1";

/** Keep in step with `maxPerSlot` in lib/config.ts. */
var SLOT_CAPACITY = 40;

var TIME_ZONE = "Asia/Ulaanbaatar";
var LOCK_TIMEOUT_MS = 20000;

/* 1-indexed column positions. */
var COLUMN_TIMESTAMP = 1;
var COLUMN_NAME = 2;
var COLUMN_PHONE = 3;
var COLUMN_TIME = 4;

var HEADERS = [
  "Бүртгүүлсэн огноо",
  "Овог нэр",
  "Утас",
  "Ирэх цаг",
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

/**
 * Normalises anything a time cell can present into "HH:mm".
 *
 * Sheets silently coerces "11:00" into a time value, so reading with
 * getValues() hands back a Date whose string form begins "Sat Dec 30 1899" —
 * which is why every row must be read with getDisplayValues() and normalised
 * here. The display string itself varies with the spreadsheet locale
 * ("14:00", "14:00:00", "2:00 PM"), and all three must reduce to "14:00" or
 * the duplicate and capacity checks silently stop matching.
 */
function timeKey_(value) {
  var text = String(value).trim();
  var parts = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!parts) return text.slice(0, 5);

  var hour = parseInt(parts[1], 10);
  var suffix = parts[3] ? parts[3].toUpperCase() : "";
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;

  return (hour < 10 ? "0" + hour : String(hour)) + ":" + parts[2];
}

function digitsOnly_(value) {
  return String(value).replace(/\D/g, "");
}

/** Reads the time column once and reduces it to { "11:00": count }. */
function countsByTime_(sheet) {
  var lastRow = sheet.getLastRow();
  var counts = {};
  if (lastRow < 2) return counts;

  /* Display values, never getValues() — see timeKey_ for why. */
  var rows = sheet.getRange(2, COLUMN_TIME, lastRow - 1, 1).getDisplayValues();
  for (var i = 0; i < rows.length; i += 1) {
    var key = timeKey_(rows[i][0]);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/**
 * True when this phone already holds a seat, in any slot.
 *
 * Matched on the number alone, not number + time: the form promises one
 * registration per phone, so allowing the same person into a second slot would
 * contradict what they were told and quietly consume another seat.
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

function doGet(event) {
  var mode = event && event.parameter ? event.parameter.mode : "";
  if (mode !== "counts") return json_({ ok: true });
  return json_({ counts: countsByTime_(sheet_()) });
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
  var visitTime = timeKey_(body.visitTime || "");
  var submittedAt = body.timestamp ? new Date(body.timestamp) : new Date();
  if (isNaN(submittedAt.getTime())) submittedAt = new Date();

  if (!fullName || phone.length !== 8 || !visitTime) {
    return json_({ ok: false, reason: "invalid" });
  }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    return json_({ ok: false, reason: "busy" });
  }

  try {
    var sheet = sheet_();

    if ((countsByTime_(sheet)[visitTime] || 0) >= SLOT_CAPACITY) {
      return json_({ ok: false, reason: "full" });
    }
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
    /* Leading apostrophe keeps Sheets from eating a leading zero. */
    row[COLUMN_PHONE - 1] = "'" + phone;
    /* Same trick for the time, so "11:00" stays text and not a 1899 date. */
    row[COLUMN_TIME - 1] = "'" + visitTime;

    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
