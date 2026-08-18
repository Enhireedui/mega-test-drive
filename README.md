# MEGA EVENT TEST DRIVE 7 — OFF-ROAD EDITION

Campaign registration microsite for SAIN MOTORS. One composition and a colophon:
the identity, the place, three facts, and a form of three questions. Next.js App
Router, fully static, no client-side data fetching, and no photography on the page.

---

## ⚠️ Before you launch: republish the Apps Script

**Edition 6's script rejects every edition-7 submission.** It requires a visit date
and a visit time in every request body; this edition asks for neither, so the body
carries `{ timestamp, fullName, phone, transport }` and the old script answers
`{ ok: false, reason: "invalid" }` to all of it.

Fix, once:

1. Open **edition 6's registrations sheet** ▸ **Extensions ▸ Apps Script**.
2. Replace all of `Code.gs` with [`docs/apps-script.gs`](docs/apps-script.gs). Save.
3. **Deploy ▸ Manage deployments ▸** edit the live deployment ▸ Version: **New
   version** ▸ Deploy.

Editing the file without publishing a new version leaves the old code running. That
is the most common reason a change appears to do nothing.

Nothing else moves: the script writes into **edition 6's spreadsheet**, and editing
the existing deployment keeps the `/exec` URL you already have, so
`GOOGLE_SHEETS_WEBHOOK_URL` stays as it is.

Inside that file, edition 7's rows go on **their own tab**, `Тест драйв 7`, created on
the first registration. Edition 6's `Sheet1` is never read or written. Two reasons
they are not one list: edition 6 put the visit day in D and the time in E where this
edition puts **Унаа** — which coach the person is taking, or that they are driving
themselves — and the duplicate check reads the whole phone column of the tab it
writes to, so a shared tab would tell every visitor who signed up in August that they
are already registered. The layout is documented at the top of `docs/apps-script.gs`.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Create `.env.local` from [`.env.example`](.env.example):

| Variable                    | Purpose                                                     |
| --------------------------- | ----------------------------------------------------------- |
| `GOOGLE_SHEETS_WEBHOOK_URL` | The Apps Script `/exec` URL. **Secret** — it accepts writes. |
| `NEXT_PUBLIC_SITE_URL`      | Canonical origin, for Open Graph absolute URLs.              |

With `GOOGLE_SHEETS_WEBHOOK_URL` unset, `npm run dev` reports every submission as a
success without writing anywhere — which is how to exercise the confirmation state
without putting test rows in the live sheet. To do that while `.env.local` holds the
real URL, put an empty override in `.env.development.local` (it wins in development
and is gitignored) and delete it afterwards.

`npm run dev` runs Node with `--use-system-ca` so the Apps Script request trusts a
corporate TLS chain.

Checks:

```bash
npm run typecheck && npm run lint && npm run build
```

---

## Editing the event

Everything the page says lives in [`lib/config.ts`](lib/config.ts) — the date, the
weekday, the hours, the venue, the presenter, the asset paths. No component invents
a fact. Changing the event means editing that one file.

The facts are transcribed from the supplied poster and nothing else. Its
information bar reads:

```
2026.08.22        Морингийн даваа       11:00 - 19:00
Бямба гараг       Наадамчдын зам        цагийн хооронд
```

> **Note on the venue.** An early brief wrote the second line as "Надамын зам". The
> poster prints **"Наадамчдын зам"**, and the poster is the source of truth, so that
> is what ships. Change it in `lib/config.ts` if the organiser confirms otherwise.

### The coach

`transport` in `lib/config.ts` holds the timetable the organiser supplied — three
runs, each with a departure from the BYD 4S showroom and the time it starts back
from the pass. Editing that array is all it takes to change the timetable: the
control, the validation and the value written to the sheet are all derived from it,
so there is no second place to keep in step.

The page does not print the table and then ask a question underneath it. Each run
*is* one control, carrying its departure large and its return as a quiet second
line, with a fourth option for people driving themselves. Nothing is lost and there
is no table on the page.

### What is deliberately not on the page

No price, prizes, giveaways, refreshments, entertainment, vehicle count, capacity,
model list, or promise of an SMS. None of it was supplied, and a registration page
that invents any of it makes a promise the organiser never made. Anything confirmed
later belongs in `lib/config.ts`.

`venue.mapUrl` holds the organiser's own map link, and the "Байршлыг харах" link
beside the venue renders only while it is set — emptying it hides the link rather
than pointing it nowhere. `venue.latitude` / `longitude` stay `null`, which omits the
`geo` block from the page's structured data: the coordinates are genuinely unknown,
and a guessed latitude published as machine-readable fact is worse than none.

---

## Assets

Source artwork lives outside the repo, in `../testdriver7`:

| File                                        | Becomes                                 |
| ------------------------------------------- | --------------------------------------- |
| `Logo-MT7-OFF.png`                          | `public/brand/mega-test-drive-7.png`    |
| `Logo-MT7-OFF-2.png`                        | `public/brand/sain-motors.png`          |
| `MEGA OFF-ROAD undsen poster 1x1 ratio.png` | `public/event/poster.jpg` (social only) |

`MEGA OFF-ROAD Page cover.png` is also supplied and is deliberately unused. It was
placed at the top of the page and measured: at 2.68:1 it pushed the submit button
below the fold at every width tested. Cropping it to a photographic band below the
form was the next attempt, and that was cut on request. The page carries no
photography at all now.

```bash
npm run assets
```

```bash
node scripts/prepare-assets.mjs --analyze
```

Outputs are committed, so this only re-runs when the artwork changes. Point it
elsewhere with `MTD7_SOURCE_DIR`.

The one interesting thing it does is measured rather than hardcoded: it **trims each
lockup to its own ink** from the alpha channel, and drops the hairline "АЛБАН ЁСНЫ
ДИСТРИБЬЮТЕР" band above the SAIN wordmark — at the size a distributor credit is
shown, that line turns to grey mush, so the page sets it as real letterspaced type
instead.

`public/event/poster.jpg` is the full poster, used **only** for social cards, where
baked-in typography is the point and a link preview has no room for real text. It is
never painted on the page.

---

## Design

**Direction: a survey of a pass.** The event is defined by a place — Морингийн
даваа, a named mountain pass on the Наадамчдын зам road — and sold on terrain. So
the page is built as a field record of that terrain: elevation contours,
letterspaced reference labels, and the facts as a small data table. "OFF-ROAD
EDITION" is the claim the document evidences.

### The contour field is the one bold element

[`components/ui/ContourField.tsx`](components/ui/ContourField.tsx) draws the pass:
nested contour rings with a saddle pinched between two lobes — which is what a pass
*is* on a map — plus a survey crosshair on the saddle itself. Inline SVG: a dozen
paths, no second asset, no request, traced in with `stroke-dashoffset` so it reads
as a drawing being made. Nothing in it is random; random contours read as noise, and
noise is not a survey. It appears once, large, behind the identity, and nowhere else.

### Palette — sampled, not invented

| Token    | Hex       | Role                                                     |
| -------- | --------- | -------------------------------------------------------- |
| `basalt` | `#12140F` | the ground — steppe green-black at dusk                  |
| `bone`   | `#E4DFD3` | type — the mineral dust of the photograph                |
| `sage`   | `#8F8D78` | the only muted tone; 4.6:1 on basalt, safe for real copy  |
| `amber`  | `#D98B2B` | the sun flare — contours and reference marks only         |
| `signal` | `#E81820` | the campaign red, **inherited from the lockup**           |

Every value is sampled from the supplied artwork. `signal` is the exact red of the
"Event" script and the OFF-ROAD EDITION brush, and it appears on the page *only* as
the call to action — which is what makes one block of colour read as the thing to
do. `signal-bright` (`#FF5B60`) exists because the campaign red manages only 4.3:1
on basalt and validation copy is 13px.

**Why the ground is dark, and why it is not black.** Dark is a constraint, not a
habit: the supplied lockup is a white-to-silver chrome wordmark with no outline
(measured median luminance 255), so on a light ground it very nearly disappears, and
the identity may not be recoloured. What did change is *which* dark — a green-black
sampled from the steppe rather than a neutral `#0A0A0A`, warm mineral type rather
than pure white, and amber introduced so red no longer has to be decoration.

### Type — Oswald + Inter, and one hard test

Oswald sets the display voice: condensed, uppercase, and chosen for that. Its narrow
set width is what lets "МОРИНГИЙН ДАВАА" hold one line at display scale on a 375px
screen. Inter handles everything a hand touches or reads at length.

**Any new face must pass the Mongolian test first.** Ө/ө (U+04E8/9) and Ү/ү
(U+04AE/AF) sit in `cyrillic-ext`, and several faces declare that range while
shipping almost none of it. Measured by loading each subset and comparing glyph
advance widths against a fallback:

| Face                    | Ө ө Ү ү     | Note                                     |
| ----------------------- | ----------- | ---------------------------------------- |
| **Oswald**              | present     | 19KB subset — chosen                     |
| Golos Text              | present     | viable alternative                       |
| Sofia Sans Condensed    | **missing** | 3.4KB subset; has all standard Cyrillic  |
| IBM Plex Sans Condensed | **missing** |                                          |
| Barlow Condensed        | —           | no Cyrillic at all                       |

Sofia Sans Condensed is the trap worth naming: it would have rendered "БҮРТГҮҮЛЭХ",
the one word this page exists to be clicked on, with two letters in a fallback face.
See the header of [`app/fonts.css`](app/fonts.css).

Four type treatments and no more: `ref` (the letterspaced label — every piece of
micro-type on the page is one), `display` (the venue, and only the venue),
`figure-md` (dates and times), `heading` (the form and the confirmation).

### The form is in the composition, not below it

On a wide screen the identity and facts hold the left column and the form holds the
right, both above the fold — so there is no "scroll to the form" step and no second
section to build. That is what lets the page be genuinely small. Measured: the
submit button is above the fold from 1024px up.

On a phone the columns become one: identity, facts, then the three questions.
Measured across 375–1440 — no horizontal scroll anywhere, and the whole page is
1.14–1.83 viewport heights.

### Motion is CSS, and that is load-bearing

Every element that starts at `opacity: 0` has something load-bearing restoring it.
If that is a JS animation loop, then a failed hydration, a thrown error, a bundle
that never arrives, or a tab that is not compositing frames leaves the identity
permanently invisible — which is exactly what happened when an earlier edition's
hero was built with `framer-motion`. So the entrance is a CSS stagger with
`animation-fill-mode: both`, the contours trace in CSS, and there is no
scroll-reveal anywhere. `framer-motion` is not a dependency.

Reduced motion collapses every duration. One non-obvious consequence is handled in
`globals.css`: `.trace` must also have its `stroke-dasharray` cleared, or collapsing
the duration leaves the contours stroked with a 1200px gap — i.e. invisible.

### There is no sticky mobile CTA

Scrolling past the facts puts the form on screen, so a bar that appeared when some
earlier button left the viewport would have to hide again almost immediately — it
would flash rather than help, and it would need an IntersectionObserver to avoid
covering the fields it exists to reach.

### One deliberate near-square

The button and the plate carry a 4px radius, not 12px. This page is a field document
— hairlines, tabular figures, ruled entry lines — and a softly rounded button in the
middle of that reads as though it were imported from a different design.

---

## Architecture

```
app/
  layout.tsx     metadata, font preloads, the no-JS notice
  page.tsx       the masthead, the colophon, Event structured data
components/
  sections/      Masthead (the whole invitation) · SiteFooter
  registration/  RegistrationForm (client) + its confirmation
  ui/            ContourField · TransportChoice · ActionButton · TextField · FieldError
lib/             config.ts (every fact) · validation.ts (zod + copy)
actions/         register.ts — "use server"
types/           event.ts · registration.ts
```

Only `RegistrationForm`, `TextField`, `TransportChoice` and `ActionButton` ship
JavaScript. The masthead, the contour field and the colophon are server components
with none.

### Registration

`actions/register.ts` validates with the same zod schema the client uses,
normalises the name and number, checks an in-process duplicate guard keyed on the
phone, and POSTs once to Apps Script with an 8s timeout.

It never reports success without an explicit `{ ok: true }`. A Web App deployed with
the wrong access setting answers `200` with a Google sign-in page, and treating an
unparseable body as success would tell people they are registered while nothing was
written.

Failure copy is in `lib/validation.ts`. Most codes resolve to one sentence — from
the visitor's chair a timeout, a bad gateway and an unparseable response are the
same event with the same remedy. The three that say something else are the three
where "try again" would be wrong advice: an already-registered number, a dead
connection, and a misconfigured endpoint. **Entered values are never cleared on a
failure.**

---

## Accessibility

- Semantic headings: the `h1` wraps the campaign lockup and carries the full
  campaign name as its accessible text, so the page has a real heading without
  setting display type that would compete with the artwork.
- The facts are a `dl` — visible `dt` labels (ОГНОО / ГАРАГ / ЦАГ) against their
  values, which is also what makes them scannable in one pass.
- The coach is a real `radiogroup`: arrow keys traverse it, only the selected option
  is a tab stop, and each is a `button` with `role="radio"` rather than a styled
  `<input>` so the control can carry two lines of type.
- The form's live region is mounted outside the form/confirmation branch. Inside, it
  would unmount at the exact moment there was something worth announcing.
- The heading belongs to the form, not the section: on success it becomes "Бүртгэл
  амжилттай", so the page never shows "Бүртгүүлэх" above a completed registration.
- Amber focus rings and a 2px offset throughout, a skip link to `#registration`,
  44px+ controls, and 17px inputs so iOS Safari does not zoom on focus and leave the
  page stranded.

---

## Deploying

Netlify, via [`netlify.toml`](netlify.toml). Set `GOOGLE_SHEETS_WEBHOOK_URL` and
`NEXT_PUBLIC_SITE_URL` in the site's environment variables — never commit them.

And republish the Apps Script. See the top of this file.
