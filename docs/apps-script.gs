/**
 * SAIN MOTORS — MEGA TEST DRIVE 6
 * Google Apps Script backend for the registration landing page.
 *
 * ── WHAT CHANGED SINCE EDITION 5 — READ THIS FIRST ─────────────────────────
 * Two changes, and the old script cannot be left in place for either:
 *
 *   1. Edition 6 runs on TWO days (8 and 9 August 2026), where edition 5 ran on
 *      one. A visit date column is now written (column D), and the time moves to
 *      column E.
 *   2. THERE IS NO CAPACITY LIMIT. Every day and every arrival window accepts
 *      everyone who signs up.
 *
 * Edition 5's script capped each time at 40 and answered `full` beyond that —
 * counting by time alone, so against a two-day event it merged Saturday's 14:00
 * with Sunday's 14:00 and refused people at half of even that cap. Leaving it
 * deployed keeps turning people away for a limit that no longer exists.
 *
 * Removing the count also makes every write faster: a submission is now one
 * append plus a phone-column read, with no full recount of the sheet in front of
 * it, which is what used to push a cold start past the site's 8s budget.
 *
 * If you are upgrading an existing sheet, see "Migrating the sheet" below.
 *
 * ── Sheet layout (must match COLUMN_* below) ───────────────────────────────
 *   A  Бүртгүүлсэн огноо   written by this script
 *   B  Овог нэр            written by this script
 *   C  Утас                written by this script
 *   D  Ирэх өдөр           written by this script   ← new in edition 6
 *   E  Ирэх цаг            written by this script
 *   F  Холбогдсон          left blank — for your team
 *   G  Ирсэн эсэх          left blank — for your team
 *   H  Тэмдэглэл           left blank — for your team
 *
 * Columns F–H are never touched, so notes added by hand survive every write.
 *
 * ── Deployment (must be done from the sheet owner's Google account) ────────
 * 1. Open the sheet ▸ Extensions ▸ Apps Script.
 * 2. In the Files panel, open `Code.gs`, select everything and replace it with
 *    this file. Save (Ctrl+S).
 * 3. Deploy ▸ New deployment ▸ gear icon ▸ Web app
 *      Execute as:        Me
 *      Who has access:    Anyone          ← not "Anyone with Google Account"
 *    Approve the permission prompt (Advanced ▸ Go to project ▸ Allow).
 * 4. Copy the /exec URL into GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * After editing this file later you must publish a NEW VERSION
 * (Deploy ▸ Manage deployments ▸ edit ▸ New version) or the old code keeps
 * running. This is the single most common reason a change appears to do nothing.
 *
 * ── Migrating the sheet from edition 5 ─────────────────────────────────────
 * Edition 5's sheet has the time in column D and your own notes in E–G. Either
 * start a clean sheet for this edition (simplest), or insert one column before D
 * and fill it with the edition-6 date for the rows you are keeping, so the day
 * and the time do not end up in the same column.
 *
 * ── Contract ──────────────────────────────────────────────────────────────
 * POST  body: { timestamp, fullName, phone, visitDate, visitTime }
 *       ->    { ok: true } | { ok: false, reason: "duplicate" | "invalid" |
 *                                                "busy" }
 *
 * GET   ->    { ok: true }   — a health check, nothing more. The site reads no
 *                             counts, because there is no limit to report.
 *
 * There is no `full`. The duplicate check runs inside a document lock, so
 * concurrent submissions cannot write the same person twice.
 */

var SPREADSHEET_ID = "1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw";
var SHEET_NAME = "Sheet1";

var TIME_ZONE = "Asia/Ulaanbaatar";
var LOCK_TIMEOUT_MS = 20000;

/* 1-indexed column positions. */
var COLUMN_TIMESTAMP = 1;
var COLUMN_NAME = 2;
var COLUMN_PHONE = 3;
var COLUMN_DATE = 4;
var COLUMN_TIME = 5;

var HEADERS = [
  "Бүртгүүлсэн огноо",
  "Овог нэр",
  "Утас",
  "Ирэх өдөр",
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
 * Sheets silently coerces "11:00" into a time value, so reading with getValues()
 * hands back a Date whose string form begins "Sat Dec 30 1899" — which is why
 * every row is read with getDisplayValues(). The display string itself varies
 * with the spreadsheet locale ("14:00", "14:00:00", "2:00 PM"), and all three
 * reduce to "14:00" here so one column cannot end up holding three spellings of
 * the same window.
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

/**
 * Normalises a visit date to "yyyy.MM.dd", the id the site sends.
 *
 * Same hazard as the time column, one step worse: Sheets will happily reformat
 * "2026.08.08" into "2026-08-08", "8/8/2026" or a real Date depending on the
 * spreadsheet's locale. Anything that yields three numbers is reassembled from
 * them; a four-digit group is taken as the year wherever it appears, so both
 * day-first and year-first locales land on the same string.
 */
function dateKey_(value) {
  var text = String(value).trim();
  if (!text) return "";

  var groups = text.match(/\d+/g);
  if (!groups || groups.length < 3) return text;

  var year = "";
  var rest = [];
  for (var i = 0; i < groups.length; i += 1) {
    if (!year && groups[i].length === 4) year = groups[i];
    else rest.push(groups[i]);
  }
  if (!year || rest.length < 2) return text;

  var pad = function (part) {
    return part.length === 1 ? "0" + part : part;
  };
  return year + "." + pad(rest[0]) + "." + pad(rest[1]);
}

function digitsOnly_(value) {
  return String(value).replace(/\D/g, "");
}

/**
 * True when this phone is already registered, on either day.
 *
 * Matched on the number alone, not number + slot: the form promises one
 * registration per phone, so letting the same person into a second window would
 * contradict what they were told and put one person on the list twice.
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

/* A health check. The site asks this endpoint nothing at render time — with no
   limit there is no availability to report, so the page is served from static
   HTML and never waits on Apps Script to paint. */
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
  var visitDate = dateKey_(body.visitDate || "");
  var visitTime = timeKey_(body.visitTime || "");
  var submittedAt = body.timestamp ? new Date(body.timestamp) : new Date();
  if (isNaN(submittedAt.getTime())) submittedAt = new Date();

  if (!fullName || phone.length !== 8 || !visitDate || !visitTime) {
    return json_({ ok: false, reason: "invalid" });
  }

  var lock = LockService.getDocumentLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    return json_({ ok: false, reason: "busy" });
  }

  try {
    var sheet = sheet_();

    /* The only reason a submission is ever refused. No seat is counted and no
       window has a ceiling. */
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
    /* Same trick for the date and time, so "2026.08.08" and "11:00" stay text
       and are read back byte-for-byte instead of as 1899 dates. */
    row[COLUMN_DATE - 1] = "'" + visitDate;
    row[COLUMN_TIME - 1] = "'" + visitTime;

    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
