# MEGA EVENT TEST DRIVE 8 — ДАРХАН ХОТ

A one-page registration site for SAIN MOTORS' eighth MEGA EVENT TEST DRIVE:
two days in Darkhan, 2026.10.01 and 10.02, 10:00–19:00.

The page states the event and takes a registration. There is nothing else on it
— no navigation, no FAQ, no benefits section, no photographic band, and no
second call to action beyond the bar docked on phones.

---

## ⚠️ Before you launch: republish the Apps Script

**Edition 7's deployed script rejects every edition 8 registration.**

Edition 7 asked which coach someone was taking and sent a `transport` field.
There is no coach this time; the form asks which of the two days and what time,
and sends `visitDate` and `visitTime` instead. The deployed script requires
`transport` and answers `{ ok: false, reason: "invalid" }` without it — which
this page reports to the visitor as "Бүртгэл илгээхэд алдаа гарлаа."

This was confirmed against the live endpoint on 2026-09-22:

```
GET  /exec                              -> 200 {"ok":true}
POST /exec  (edition 8 body, no transport) -> 200 {"ok":false,"reason":"invalid"}
```

So, before launch, from the spreadsheet owner's Google account:

1. Open the registrations sheet ▸ **Extensions ▸ Apps Script**.
2. Open `Code.gs`, select all, and replace it with `docs/apps-script.gs`. Save.
3. **Deploy ▸ Manage deployments ▸** edit the existing deployment ▸
   **Version: New version ▸ Deploy.**

Editing the deployment in place keeps the `/exec` URL, so
`GOOGLE_SHEETS_WEBHOOK_URL` does not change. Editing the file *without*
publishing a new version leaves the old code running — the most common reason a
change appears to do nothing.

Edition 8 writes to its own tab, **"Тест драйв 8"**, created on the first
registration. Earlier editions' tabs are never read or written; the duplicate
check only ever reads the tab it writes to.

### Verifying it after you redeploy

```bash
curl -s -X POST "$GOOGLE_SHEETS_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{"timestamp":"2026-10-01T02:00:00.000Z","fullName":"ТЕСТ Бүртгэл","phone":"99000000","visitDate":"10.01 (Пүрэв)","visitTime":"12:00","event":"MEGA TEST DRIVE 8"}'
```

`{"ok":true}` means it is live. Delete that row from the tab afterwards.

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then fill in the webhook URL
npm run dev
```

| Script            | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Development server                                 |
| `npm run build`   | Production build                                   |
| `npm run lint`    | ESLint                                             |
| `npm run typecheck` | `tsc --noEmit`                                   |
| `npm run assets`  | Rebuilds the lockup and the social card from source artwork |

**Submitting the form in development writes a real row to the live sheet** while
`.env.local` points at it. To exercise the whole flow without doing that, put an
empty override in `.env.development.local` (it wins in development, and is
gitignored) — an unset URL reports success and writes nowhere.

---

## Editing the event

Everything the page says lives in **`lib/config.ts`** and nowhere else. No
component invents a date, a place, a time or a claim of its own. Change the
event there; change the artwork by re-running `npm run assets`.

The facts are transcribed from the supplied poster
(`MEGA DARKHAN CITY undsen poster 1x1 ratio 2.png`) and from nowhere else.

### The two questions beyond a name and a number

`days` and `slots`. They are validated against their own ids in
`lib/validation.ts`, so editing the timetable in the config cannot leave a stale
rule that rejects an option the form is offering.

The day is asked because the fleet is out on two separate days and an organiser
cannot staff them from a list of times alone. The four slots are arrival times
inside the open hours, not a booking system: there is no capacity, no seat count
and no closed state, because nothing has been supplied that would let this page
refuse anyone. A slot that greys itself out without a real number behind it is
fake scarcity.

### What is deliberately not on the page

No coach, no meeting point, no phone number, no price, no prizes, no giveaways,
no capacity and no map link. Edition 7 had a shuttle timetable and a map URL
because the organiser supplied them; this poster carries neither. Anything
confirmed later belongs in `lib/config.ts` and nowhere else.

---

## Assets

`scripts/prepare-assets.mjs` reads the supplied artwork from `../testdrive8` and
writes two files. Outputs are committed, so it only re-runs when the artwork
changes. Every crop is derived from a measured alpha profile rather than from
pixel offsets typed in by hand.

| Output                             | From                                    |
| ---------------------------------- | --------------------------------------- |
| `public/brand/mega-test-drive-8.png` | `MEGA TEST DRIVE 8.png` (5315×2147)   |
| `public/event/poster.jpg`          | the square poster, for social cards only |

`public/brand/sain-motors.png` is **not** rebuilt. The distributor wordmark did
not change and no new source was supplied, so the committed asset is kept.

### The poster is never painted on the page

It is a vertical sandwich: the SAIN MOTORS credit, the campaign lockup, the
fleet on wet asphalt, a list of makes, then a bar carrying the dates, the place
and the hours. Every layer except the photograph is typography this page sets as
real text, so it cannot be a hero, a background or a crop. It is kept whole,
once, as the Open Graph card — a link preview is the one place baked-in type is
the right answer.

---

## Design

### The identity carries the page

The lockup is placed as its own transparent asset — never rebuilt as type, never
recoloured, never distorted, nothing layered over it. It is the page's only
large visual element, and there is no photography on the page at all.

Because the lockup already prints **ДАРХАН ХОТ** on its red plate, the page does
not repeat it. The display heading under the artwork is the landmark a driver
actually navigates by — ДАРХАН ПЛАЗА — with the road under it.

### Palette — sampled, not invented

Edition 7's ground was a green-black taken from the steppe at dusk. This
edition's poster is Darkhan at dusk, so every value was re-sampled from it:

| Token            | Value     | Where it came from                                    |
| ---------------- | --------- | ----------------------------------------------------- |
| `midnight`       | `#090d1c` | the poster's darkest decile (`#030308`) over a night sky running `#050e31`–`#121d4b` |
| `bone`           | `#e9e7ec` | its brightest quartile (`#f2edec`), pulled off white so it does not out-glare the chrome lockup |
| `slate`          | `#949ab0` | the dusk haze — 6.9:1 on midnight, so it is safe for real copy |
| `amber`          | `#dd8a3f` | the sunset over the city (measured `#d8725f`), opened up so it cannot be mistaken for the campaign red — 7.2:1 |
| `signal`         | `#cc2229` | the measured mean of the ДАРХАН ХОТ plate, across 258k opaque pixels |
| `signal-deep`    | `#a8151c` | the resting button fill — carries white at 7.5:1 |
| `signal-bright`  | `#ff6a6f` | 13px validation copy — 6.9:1 where the plate red manages 3.5:1 |

The ground has to be dark: the lockup is a white-to-chrome wordmark with no
outline or dark keyline (measured mean luminance 255 across 1.4M opaque pixels),
and on a light ground it very nearly disappears.

Red appears in exactly one place — the call to action. That is what makes it
read as the action rather than as decoration.

### Type — Oswald + Inter, and one hard test

Unchanged from edition 7, and deliberately so. Mongolian **Ө/ө** (U+04E8/04E9)
and **Ү/ү** (U+04AE/04AF) sit outside the basic `cyrillic` range, in
`cyrillic-ext`, and several otherwise attractive display faces declare that range
and ship almost none of it. Sofia Sans Condensed carries the whole standard
Cyrillic alphabet, declares `U+0460-052F`, and still omits exactly those four
letters — so «БҮРТГҮҮЛЭХ», the one word this page exists to be clicked on, would
render with two letters in a fallback face. Any new face must clear that test
before it ships. See the header of `app/fonts.css`.

### The contour field went, and nothing replaced it

Edition 7's one graphic was its mountain pass drawn as elevation contours — the
terrain was the event, so surveying it was the page's argument. Edition 8 is two
days in a city and has no such subject; keeping that drawing would have left a
picture of a mountain on a page about Darkhan.

Nothing was drawn in its place. The lockup carries the page over an empty
ground, and that restraint is deliberate: on a page whose whole job is one form,
an invented graphic would be the only thing on it not doing work.

The poster's list of makes was set as an index here for a while and then cut, on
request. It is in the git history if a later edition wants it back — and if it
returns it should return as **type, never as logos**: no marque artwork was
supplied, and redrawing ten manufacturers' wordmarks would put ten fake logos on
an official distributor's page.

### The form is in the composition, not below it

On a wide screen the facts hold the left column and the form holds the right,
both in the first screenful — there is no "scroll to the form". On a phone the
columns stack, and the docked bar covers the gap.

### There *is* a sticky mobile CTA this time

Edition 7 did not have one and said so. This page is taller — it gained a day
question — and the measurement decided it: on a 390×800 phone the registration
column starts at y≈652 and its submit button at y≈1279. The
form is two thirds of a screen below the fold on arrival.

`components/registration/StickyRegister.tsx` docks a bar while the form is out of
reach and stands down once it has climbed into the upper 45% of the screen. It
uses `IntersectionObserver`, not a scroll listener — a scroll handler would
measure layout on every frame of every scroll, which is the classic way to make a
phone stutter. It is `lg:hidden`, it disappears for good on success, `SiteFooter`
carries matching bottom padding so it never rests on the colophon, and
`env(safe-area-inset-bottom)` keeps it clear of the home indicator.

### Motion is CSS, and that is load-bearing

Every element that starts at `opacity: 0` has something load-bearing restoring
it. If that were a JS animation loop, a failed hydration, a thrown error or a
bundle that never arrives would leave the lockup permanently invisible — which
is what happened when an earlier edition's hero was built with an animation
library. A CSS animation needs no bundle, runs before hydration, and
`animation-fill-mode: both` holds the finished state. The reduced-motion block
collapses every duration, landing each element on its final state: visible,
unmoved.

---

## Architecture

```
app/          layout (metadata, fonts), page (structured data), error
components/
  sections/   Masthead · SiteFooter
  registration/ RegistrationForm · StickyRegister
  ui/         ActionButton · ChoiceGroup · TextField · FieldError
lib/          config (the event) · validation (the schema + all copy)
actions/      register.ts — the server action
docs/         apps-script.gs — the Google Sheets backend
types/        event · registration
```

The page is fully static. Nothing is read back at runtime — no capacity to
report, no availability to check — so there is no `revalidate` and no upstream
request between a visitor and the first paint.

`ChoiceGroup` is one component asked two questions. Edition 7 wrote its coach
picker as a bespoke control; edition 8 needs the same shape twice, so the control
is general and the questions are data — one implementation, one set of keyboard
semantics to get right.

### Registration

`RegistrationForm` → `registerAttendee` (a server action) → Apps Script → the
sheet. Four fields and a honeypot.

The action re-validates on the server, normalises the name and the number, and
guards against an in-flight double submission keyed on the phone number. It
**never reports success without an explicit `{ ok: true }`** — a Web App deployed
with the wrong access setting answers 200 with a Google sign-in page, and
treating an unparseable body as success would tell people they are registered
while nothing was ever written.

The webhook URL is server-only and never prefixed with `NEXT_PUBLIC_`.

| Sheet column | Written by |
| ------------ | ---------- |
| A Бүртгүүлсэн огноо, B Овог нэр, C Утас, D Ирэх өдөр, E Цаг, F Эвент | this app |
| G Холбогдсон, H Ирсэн эсэх, I Тэмдэглэл | your team — never touched |

Values are written with a leading apostrophe so Sheets cannot reinterpret
`10.01` as a date or `12:00` as a duration, and the name regex accepts only
letters, marks, spaces, apostrophes, dots and hyphens — which also means a value
can never begin with `=`, `+` or `@`.

---

## Accessibility

Semantic markup throughout, every input labelled, and a skip link to the form.

The day and time controls are real `radiogroup`s: arrow keys traverse, only the
selected option is a tab stop, and `aria-checked` carries the selection — so the
chosen state is never communicated by colour alone. Focus is always visible
(amber, 2px, offset). The live region announcing the submission is mounted on
both branches, so it is still there at the moment there is something to announce.

Fields are 17px, not 15: Safari on iOS zooms in on focus for anything under 16px
and never zooms back out.

---

## Deploying

Netlify, via `@netlify/plugin-nextjs`. Push to `main`; Netlify builds.

Environment variables belong in **Site configuration ▸ Environment variables**,
never in `netlify.toml`:

| Variable                    | Notes                                    |
| --------------------------- | ---------------------------------------- |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Secret, server-only. The `/exec` URL.     |
| `NEXT_PUBLIC_SITE_URL`      | Canonical origin, for Open Graph URLs.    |

And, again: **republish the Apps Script before launch**, or every registration
fails.
