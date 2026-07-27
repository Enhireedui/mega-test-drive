# SAIN MOTORS — MEGA TEST DRIVE 5

Event registration landing page. Next.js 15 (App Router) · TypeScript (strict) ·
Tailwind CSS v4 · Framer Motion · React Hook Form + Zod · Google Sheets backend.

The page is one screen of intent: the mark, when and where, then the form.
The invitation copy sits below it — anyone arriving already knows what MEGA TEST
DRIVE is, so registering comes first and the reading comes second.

Registration is two steps — name and phone, then a time — and takes well under
30 seconds.

---

## Getting started

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Without `GOOGLE_SHEETS_WEBHOOK_URL` set, `npm run dev` still exercises the whole
UI flow — the server action short-circuits to success **in development only** so
the form and success modal can be tested. In production a missing webhook
returns a user-facing "system unavailable" message rather than a silent success.

| Script                 | Purpose                          |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Dev server on :3000              |
| `npm run dev:system-ca`| Dev server behind a TLS proxy    |
| `npm run build`        | Production build                 |
| `npm start`            | Serve the production build       |
| `npm run typecheck`    | `tsc --noEmit`                   |
| `npm run lint`         | ESLint (flat config, Next rules) |

### If the form reports a connection failure locally

On a network that intercepts TLS (corporate proxy, some antivirus suites), the
server action's call to Apps Script fails with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE` — Node ships its own CA bundle and ignores the
Windows/macOS certificate store, so it does not trust the interception
certificate. The page correctly reports a connection problem; nothing is wrong
with the code, and hosted environments are unaffected.

Use `npm run dev:system-ca` (Node ≥ 22.15) to make Node trust the system store.
It is deliberately a separate script: `--use-system-ca` is unknown to older Node
versions, so putting it in `build` would break the deploy.

---

## Deploying to Netlify

`netlify.toml` is committed, so the build settings are already correct. Netlify's
Next.js runtime maps Server Components, the Server Action and `revalidate` onto
Netlify Functions — no code changes are needed.

> Netlify's **drag-and-drop folder upload will not work** for this project. It is
> a server-rendered app with a Server Action, so Netlify has to run the build and
> create functions. Dropping a folder publishes static files only, and the form
> would never submit. Use one of the two routes below.

1. Get the code to Netlify, either by pushing the repo to GitHub/GitLab, or —
   with no Git at all — by running `npx netlify deploy --build --prod` from the
   project folder, which uploads the source and builds it on Netlify.
2. Netlify → **Add new site** → **Import an existing project** → pick the repo.
   Build command `npm run build` and publish directory `.next` are read from
   `netlify.toml`; leave them as detected.
3. **Site configuration → Environment variables**, add both:

   | Key                         | Value                                    | Scope           |
   | --------------------------- | ---------------------------------------- | --------------- |
   | `GOOGLE_SHEETS_WEBHOOK_URL` | the Apps Script `/exec` URL              | secret          |
   | `NEXT_PUBLIC_SITE_URL`      | the final site origin, no trailing slash | all             |

4. **Deploy**. Then re-deploy once after adding the variables if you added them
   after the first build — Next inlines `NEXT_PUBLIC_*` at build time.
5. Submit one real registration and confirm the row appears in the sheet.

Notes specific to serverless hosting:

- The submit path is a **single** upstream request with an 8s timeout, kept
  inside Netlify's 10s synchronous function budget. Apps Script can be slow on a
  cold start, which is why there is no second round trip.
- The in-memory duplicate guard in `actions/register.ts` only covers one warm
  function instance. This is expected: the authoritative duplicate and capacity
  checks run inside an Apps Script document lock, so scaling out cannot produce
  duplicate rows or oversell a slot.
- `GOOGLE_SHEETS_WEBHOOK_URL` has no `NEXT_PUBLIC_` prefix, so it stays on the
  server and never reaches the browser bundle.

## Editing the event

**`lib/config.ts` is the single source of truth.** Running the next edition
should not require touching anything else.

```ts
dates:      [{ id: "2026.08.01", label: "2026.08.01", weekday: "Бямба", iso: "2026-08-01" }]
timeSlots:  [{ id: "11:00" }, { id: "14:00" }, { id: "17:00" }]
slotDurationHours: 3        // cards read "11:00 – 14:00"; hours read 11:00 – 20:00
maxPerSlot: 40              // registration ceiling per slot
closedSlots: []             // force-close a slot: ["2026.08.01|14:00"]
```

A slot that reaches `maxPerSlot`, or appears in `closedSlots`, is disabled
automatically and reads **Дүүрсэн**. Open slots show only their time range.

Derived automatically from the above: the header pill, the opening hours label,
each slot's end time, the schema's allowed values, the capacity check in the
server action, and the JSON-LD event data.

Two notes on scope:

- **The page assumes a single event day** and therefore asks only for a time.
  Adding a second entry to `dates` would also mean adding a date step to
  `RegistrationCard` — a second `ChoiceGroup` with the dates as choices, plus a
  handler that clears the chosen time when the day changes.
- `stats.brandCount` is **11** because that is what the supplied marketing copy
  states, while `brands` lists the **10** wordmarks from the Event 4 poster. Add
  the eleventh marque to `brands`, or correct `brandCount`, before launch.

### Still to fill in before launch

- `contact.phone`, `contact.facebookUrl`, `contact.instagramUrl` — deliberately
  empty strings so no invented contact details can ship. Each row hides itself
  while blank.
- `venue.mapUrl` — blank renders the venue as plain text instead of a link.
- `NEXT_PUBLIC_SITE_URL` — used for canonical and Open Graph URLs.

---

## Backend — Google Sheets via Apps Script

No SQL, no Firebase. Registrations land in this spreadsheet:

**https://docs.google.com/spreadsheets/d/1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw/edit**

`docs/apps-script.gs` is the Web App that writes to it; its sheet ID is already
filled in. Full deployment steps are in that file's header comment.

> **One manual step remains, and only the sheet's owner can do it.** Deploying an
> Apps Script Web App requires signing in to that Google account and approving a
> permission prompt, so the `/exec` URL cannot be generated from here. Open the
> sheet → Extensions → Apps Script → paste the file → Deploy → Web app
> (*Execute as: Me*, *Who has access: Anyone*) → copy the `/exec` URL into
> `GOOGLE_SHEETS_WEBHOOK_URL`. Check `SLOT_CAPACITY` matches `maxPerSlot`.

| Direction | Contract                                                       |
| --------- | -------------------------------------------------------------- |
| `POST`    | `{ timestamp, fullName, phone, visitDate, visitTime }`         |
| →         | `{ ok: true }` \| `{ ok: false, reason: "duplicate"\|"full" }` |
| `GET`     | `?mode=counts` → `{ counts: { "11:00": 12, "14:00": 3 } }`     |

Counts come back keyed by time only, because the sheet holds one event day;
`normalizeCountKeys` attributes bare times to the configured date and drops
anything it cannot parse, so a malformed key can never silently close a slot.

The script writes the time and phone as text (leading apostrophe) and reads
every row with `getDisplayValues()`. Both matter: Sheets coerces `"11:00"` into a
1899 time value, and reading it back with `getValues()` yields a `Date` whose
string form starts `"Sat Dec 30…"` — which would make the duplicate and capacity
checks stop matching without any visible error.

The capacity and duplicate checks run inside an Apps Script document lock, so
concurrent submissions cannot oversell a slot or write the same person twice.

Availability is read server-side on render (30s revalidate, tagged
`availability`) and revalidated immediately after a successful write. Every
failure mode — no webhook, timeout, non-200, malformed JSON — degrades to
"assume open", so the page always renders and the authoritative capacity check
still happens inside Apps Script at write time.

`GOOGLE_SHEETS_WEBHOOK_URL` is server-only. It is never prefixed with
`NEXT_PUBLIC_` and never reaches the browser.

### Error handling

Every path resolves to a typed `RegistrationErrorCode` mapped to Mongolian copy
in `lib/validation.ts`. No technical detail is ever surfaced.

`VALIDATION` · `DUPLICATE` · `SLOT_UNAVAILABLE` · `TIMEOUT` · `NETWORK` ·
`UPSTREAM` · `CONFIG` · `UNKNOWN`

**One registration per phone number**, in any slot — matching what the form
promises. The Apps Script check matches on the number alone and is the
authority; a per-slot check would let the same person quietly take all three
times.

Double submission is blocked four ways: the fields lock behind a disabled
`fieldset` while the action is in flight, the button disables itself, a
ref-based lock rejects re-entry, and the server keeps a short-lived per-phone
dedupe map. A cold start cannot let a duplicate row through, because the sheet
is checked inside a document lock.

Success is only ever reported on an explicit `{ ok: true }`. A Web App deployed
with the wrong access setting answers HTTP 200 with a Google sign-in page, so an
unparseable body is treated as `UPSTREAM` — the page never tells someone they
are registered when nothing reached the sheet.

---

## Type

Self-hosted from `public/fonts` rather than fetched from Google at build time:
no third-party request at runtime, no build that can silently fall back to
system fonts behind a proxy, and deterministic output.

**Montserrat** (display) · **Inter** (interface) — both variable, subset to
`latin` + `cyrillic` + `cyrillic-ext`.

> `cyrillic-ext` is not optional. Mongolian Ө/ө (U+04E8/04E9) and Ү/ү
> (U+04AE/04AF) sit outside the basic `cyrillic` range. Several otherwise
> attractive display faces — Unbounded, Onest, Manrope — ship a near-empty
> `cyrillic-ext` and silently drop those four letters mid-headline. Both faces
> here were verified against the full Mongolian set.

Numerals are tabular globally, so counts and times never jitter as they change.

---

## Architecture

```
app/
  layout.tsx        metadata, font preloads, no-script reveal fallback
  page.tsx          server component; reads availability, renders the page
  globals.css       design tokens (@theme), base layer, utilities
  fonts.css         self-hosted @font-face with unicode-range
actions/
  register.ts       "use server" — validate, dedupe, capacity, write, revalidate
lib/
  config.ts         SINGLE SOURCE OF TRUTH + derived label helpers
  validation.ts     Zod schema, MN phone rules, user-facing error copy
  availability.ts   reads slot counts, projects them onto date × time
types/
  registration.ts   domain types shared by client, action and reader
components/
  Backdrop  PageHeader  RegistrationCard  EventInfo  Footer
  Button  Input  ChoiceGroup  FieldMessage  SuccessModal  Reveal  MotionProvider
```

Server Components by default. Only the form, the modal, the reveal wrapper and
the motion provider are client components.

### Two decisions worth knowing

**Reduced motion is handled once, in `MotionProvider`.** Branching *rendered
output* on `useReducedMotion()` cannot work — the hook resolves to `false`
during SSR and to the real preference on the client, so the trees disagree and
React refuses to patch the difference. `MotionConfig reducedMotion="user"` keeps
the markup identical on both sides and snaps transform animations instead, so
content is never left invisible. `[data-reveal]` additionally has a `<noscript>`
override in the root layout, so scroll-revealed content cannot stay hidden if
the bundle never arrives.

**The floating label is pure CSS** (`peer-[:placeholder-shown:not(:focus)]`),
not JS state, so it stays correct through `reset()` and browser autofill —
cases where a JS-tracked "filled" flag silently desynchronises.

---

## Accessibility

- Every text pairing verified ≥ 4.5:1 against its actual composited background,
  measured through a canvas so Tailwind's `oklab()` output resolves correctly
  (lowest measured: 4.52:1).
- Slot cards are a real `radiogroup` with roving tabindex and arrow-key
  traversal that skips full slots; the group borrows the visible step heading as
  its accessible name rather than repeating it for screen readers.
- Success modal: `role="dialog"`, `aria-modal`, focus trap, Escape to close,
  scroll lock with scrollbar-width compensation, focus restored on close. Its
  summary lists exactly what was submitted, so a registration is checkable.
- Validation fires on blur, never mid-typing; messages occupy reserved height,
  so an error never shifts the layout. Submit progress is announced through an
  `aria-live` region as well as shown on the button.
- Touch targets ≥ 44px at 320px and ≥ 48px from 375px up. Focus rings are
  designed, never removed.
- Verified with no horizontal overflow and no clipped text at 320, 375, 768 and
  1440px.
