# MEGA TEST DRIVE 6 — registration

Event registration landing page for **MEGA TEST DRIVE 6**, run inside the
**ШИЛИЙН БОГД MOTO FESTIVAL**, with **SAIN MOTORS** as general sponsor.

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Framer Motion · React Hook Form + Zod · Google Sheets backend.

The page exists to take a registration and does nothing else. It is two bands on
one continuous near-black surface:

1. **The event** — sponsor credit, the festival mark, the event lockup, a short
   rule, the date and the place, and one button. Sized to fit a single screen at
   any viewport.
2. **The invitation** — two paragraphs, centred, separated from the hero by a
   single hairline.

Tapping **Бүртгүүлэх** unfolds the form in place: name, phone, day, time, send.
There is no second screen and nothing to scroll past to reach it.

There is **no footer**, no brand wall and no photography. Nothing was lost with
the footer: the sponsor lockup and the festival lockup are both in the hero, and
so are the date and the venue it used to repeat.

> **What this page deliberately does not say.** Everything stated is either
> printed on the official poster or is a description of how this form behaves.
> There is no price, no prize, no document list, no running order, no opening
> hours and no contact details, because none of that was supplied. The JSON-LD
> omits `offers` for the same reason — asserting a price of zero in
> machine-readable form, where a search engine can repeat it as fact, would be
> worse than saying nothing. Anything the organiser confirms later belongs in
> `lib/config.ts`.

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
the form and the confirmation dialog can be tested. In production a missing
webhook returns a user-facing "system unavailable" message rather than a silent
success.

Requires **Node ≥ 22.15** (see `engines`).

| Script              | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Dev server on :3000                           |
| `npm run build`     | Production build                              |
| `npm start`         | Serve the production build                    |
| `npm run typecheck` | `tsc --noEmit`                                |
| `npm run lint`      | ESLint (flat config, Next rules)              |
| `npm run assets`    | Re-cut `/public` from the designer's artwork  |

> If `.env.local` points at the live spreadsheet, submitting the form in
> development writes a **real row** to it. Test the form up to validation freely;
> point the variable at a scratch deployment before testing a successful write.

### Why `dev` runs Node with `--use-system-ca`

On a network that intercepts TLS (corporate proxy, some antivirus suites), the
server action's call to Apps Script fails with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`: Node ships its own CA bundle and ignores the
Windows/macOS certificate store, so it does not trust the interception
certificate. Registrations then fail locally while working perfectly in
production, which is a confusing way to lose an afternoon.

`--use-system-ca` makes Node trust the OS store, so `npm run dev` behaves like
the deployed site. It is only on `dev` — `build` and `start` stay plain, so the
flag can never affect a deploy.

---

## ⚠️ Upgrading from edition 5 — the backend must be redeployed

**Edition 5's Apps Script caps every arrival window at 40 and answers `full`
beyond it. Edition 6 has no limit at all.** Left deployed, it keeps telling
people "Сонгосон цаг дүүрсэн байна" for a ceiling this app no longer has — and
because it counts by time alone, it merges Saturday's 14:00 with Sunday's 14:00
and starts refusing at half of even that number.

`docs/apps-script.gs` has been rewritten for this. It writes a visit-date column
(D, pushing the time to E), and it counts nothing: the only refusal it can
produce is `duplicate`.

Before launch:

1. Paste the new `docs/apps-script.gs` over `Code.gs` in the sheet's Apps Script
   editor and **publish a new version** (Deploy → Manage deployments → edit →
   New version). Editing without publishing leaves the old code running, which
   is the single most common way this appears to do nothing.
2. Either start a clean sheet for this edition — simplest — or insert one column
   before D on the existing sheet and fill in the edition-6 date for every row you
   keep, so the day and the time do not share a column.

Until step 1 is done the front end cannot help: capacity is enforced upstream, so
a stale deployment refuses submissions no matter what this repo says. Dropping the
recount also takes a full-sheet read off the write path, which is what used to
push an Apps Script cold start past the 8s budget and produce
`Хариу хэт удаж байна`.

---

## Editing the event

**`lib/config.ts` is the single source of truth.** Running the next edition
should not require touching anything else.

```ts
dates: [
  { id: "2026.08.08", label: "2026.08.08", dayOfMonth: "08", weekday: "Бямба", iso: "2026-08-08" },
  { id: "2026.08.09", label: "2026.08.09", dayOfMonth: "09", weekday: "Ням",   iso: "2026-08-09" },
]
timeSlots:  [{ id: "11:00" }, { id: "14:00" }, { id: "17:00" }]
slotDurationHours: 3        // plates read "11:00 – 14:00"
closedSlots: []             // force-close one: ["2026.08.09|17:00"]
```

**There is no registration ceiling.** Every day and every window accepts everyone
who signs up, so no plate can ever read "дүүрсэн" and nobody is turned away for
capacity. `closedSlots` is the only way to take a window off the form: named there
by hand, it disables itself and reads **Хаагдсан**. A day whose every window has
been closed is shown struck through rather than removed — removing it would leave
someone wondering whether they had misread the poster. If closures leave only one
day standing it is preselected, so the form does not present a decision that has
already been made.

Because availability cannot change at runtime, both option groups are built once
at module scope in `RegistrationForm` and the page is fully static — no
`revalidate`, and no upstream request between a visitor and the first paint.

Derived automatically: the date range label, the weekday label, each slot's end
time, the brand count, the Zod schema's allowed values, and the JSON-LD.

### Confirm before launch

- **The three arrival windows (11:00 / 14:00 / 17:00) are carried over from
  edition 5.** The MTD6 poster prints no opening hours, so nothing on the page
  claims any — the times are presented only as the windows the form offers, which
  is exactly what they are. If the real schedule differs, `timeSlots` and
  `slotDurationHours` are the only things to change.
- `venue.mapUrl` — blank by default. Filling it in shows a "Замыг харах" link;
  blank keeps the venue as plain text rather than linking nowhere.
- `NEXT_PUBLIC_SITE_URL` — canonical and Open Graph URLs.

---

## Assets

The supplied artwork is print-scale and composed for dark surfaces: three
white-and-red lockups on transparency at 7–9k px wide, all ten brand marks in a
single 11 811px strip, and a 150 MB layered poster whose middle third is the only
fleet photography that exists for this edition. None of it can ship as-is.

`scripts/prepare-assets.mjs` is the reproducible step between those files and
`/public`. Outputs are committed, so it only needs re-running when the artwork
changes.

```bash
npm run assets                       # expects ../testDrive6
MTD6_SOURCE_DIR="D:/art" npm run assets
node scripts/prepare-assets.mjs --analyze   # print measurements, write nothing
```

What it does, and why each step is measured rather than hardcoded:

- **Slices the brand strip into ten marks.** Boundaries come from the alpha
  channel, not pixel offsets. A gap-width threshold cannot do this job: AITO is
  set with letterspacing as wide as the space between two neighbouring brands, so
  any single cutoff either splits AITO into four marks or merges RELY into MAXUS.
  Since the number of marks per row is known, it takes the four widest gaps
  instead — scale-free, and it cannot miscount. (Measured: it splits on gaps
  ≥ 573px while the widest gap it keeps is 165px.)
- **Re-inks those marks from white to near-black** so they can sit on the white
  marquee. Achromatic pixels are inverted; anything with real chroma is brand red
  and is set rather than inverted, because inverting red yields cyan.
- **Crops the fleet still out of the poster**, from below the last row of the
  festival title to above the first row of the MEGA lockup — both located by
  finding the poster's bright saturated red, with a margin for the glow around
  those glyphs. The result is a 2.34:1 still with no baked-in typography.
- **Drops "ЕРӨНХИЙ ИВЭЭН ТЭТГЭГЧ" off the SAIN MOTORS lockup**, where it is drawn
  as a hairline outline that collapses into grey mush at the size a sponsor credit
  is actually shown. It is set as real letterspaced type instead.
- **Keeps the full poster** for social cards — the one place the baked-in
  typography is an asset rather than a liability.

Two supplied images are **not** used: `fleet.jpg` and the loose `.jfif` in the
project root are the edition-4 poster, carrying "MEGA TEST DRIVE 4" and the old
date and venue as pixels. Using them would put wrong information on the page.

---

## Backend — Google Sheets via Apps Script

No SQL, no Firebase. Registrations land in this spreadsheet:

**https://docs.google.com/spreadsheets/d/1mP1Z-Kzs9IVhOJMEKJ-42TLGgKmASnXuNevielY7fgw/edit**

`docs/apps-script.gs` is the Web App that writes to it; its sheet ID is already
filled in. Full deployment steps are in that file's header comment.

> **One manual step remains, and only the sheet's owner can do it.** Deploying an
> Apps Script Web App requires signing in to that Google account and approving a
> permission prompt, so the `/exec` URL cannot be generated from here.

| Direction | Contract                                                              |
| --------- | --------------------------------------------------------------------- |
| `POST`    | `{ timestamp, fullName, phone, visitDate, visitTime }`                |
| →         | `{ ok: true }` \| `{ ok: false, reason: "duplicate"\|"invalid"\|… }`   |
| `GET`     | `{ ok: true }` — a health check; the site reads nothing back           |

The script writes the date, time and phone as text (leading apostrophe) and reads
every row with `getDisplayValues()`. Both matter: Sheets coerces `"11:00"` into a
1899 time value, and reading it back with `getValues()` yields a `Date` whose
string form starts `"Sat Dec 30…"`. The same hazard applies one step worse to the
date column, which Sheets will reformat to `"2026-08-08"`, `"8/8/2026"` or a real
Date depending on locale — `dateKey_` reassembles a canonical `yyyy.MM.dd` from
whatever three numbers come back, taking any four-digit group as the year so
day-first and year-first locales land on the same key.

The duplicate check runs inside an Apps Script document lock, so concurrent
submissions cannot write the same person twice. Nothing is counted — there is no
capacity, so a submission is one append plus a phone-column read.

Nothing is read back at render time either. The page holds no number that the
sheet could contradict, so there is no availability fetch, no revalidate window
and no cache tag to purge after a write.

`GOOGLE_SHEETS_WEBHOOK_URL` is server-only. It is never prefixed with
`NEXT_PUBLIC_` and never reaches the browser.

### Error handling

Every path resolves to a typed `RegistrationErrorCode` mapped to Mongolian copy
in `lib/validation.ts`. No technical detail is ever surfaced.

`VALIDATION` · `DUPLICATE` · `SLOT_UNAVAILABLE` · `TIMEOUT` · `NETWORK` ·
`UPSTREAM` · `CONFIG` · `UNKNOWN`

`SLOT_UNAVAILABLE` no longer means "full" — no window has a ceiling. It means the
window was closed by hand in `closedSlots`, and it reads
"Сонгосон цаг боломжгүй болсон байна".

**One registration per phone number**, on either day — matching what the form
promises. This is not a capacity rule: it keeps the list one row per person, so
each driver registers under their own number. The Apps Script check matches on the
number alone and is the authority.

Double submission is blocked four ways: the fields lock behind a disabled
`fieldset` while the action is in flight, the button disables itself, a ref-based
lock rejects re-entry, and the server keeps a short-lived per-phone dedupe map.

Success is only ever reported on an explicit `{ ok: true }`. A Web App deployed
with the wrong access setting answers HTTP 200 with a Google sign-in page, so an
unparseable body is treated as `UPSTREAM` — the page never tells someone they are
registered when nothing reached the sheet. A `fetch` TypeError is likewise
reported as `UPSTREAM`, not as a network error: that is the server failing to
reach Apps Script, and it must not be blamed on the visitor's connection.
`NETWORK` is reserved for the browser actually reporting itself offline.

---

## Deploying to Netlify

`netlify.toml` is committed, so the build settings are already correct. Netlify's
Next.js runtime maps Server Components, the Server Action and `revalidate` onto
Netlify Functions — no code changes are needed.

> Netlify's **drag-and-drop folder upload will not work** for this project. It is
> a server-rendered app with a Server Action, so Netlify has to run the build and
> create functions. Dropping a folder publishes static files only, and the form
> would never submit.

1. Get the code to Netlify, either by pushing the repo to GitHub/GitLab, or —
   with no Git at all — by running `npx netlify deploy --build --prod` from the
   project folder, which uploads the source and builds it on Netlify.
2. Netlify → **Add new site** → **Import an existing project** → pick the repo.
   Build command and publish directory are read from `netlify.toml`.
3. **Site configuration → Environment variables**, add both:

   | Key                         | Value                                    | Scope  |
   | --------------------------- | ---------------------------------------- | ------ |
   | `GOOGLE_SHEETS_WEBHOOK_URL` | the Apps Script `/exec` URL              | secret |
   | `NEXT_PUBLIC_SITE_URL`      | the final site origin, no trailing slash | all    |

4. **Deploy**, then re-deploy once if the variables were added after the first
   build — Next inlines `NEXT_PUBLIC_*` at build time.
5. Submit one real registration and confirm the row appears in the sheet, with
   the day in column D.

Notes specific to serverless hosting:

- The submit path is a **single** upstream request with an 8s timeout, kept inside
  Netlify's 10s synchronous function budget. Apps Script can be slow on a cold
  start, which is why there is no second round trip — and, now that nothing is
  counted, no full-sheet read in front of the append either.
- The in-memory duplicate guard in `actions/register.ts` only covers one warm
  function instance. This is expected: the authoritative checks run inside the
  Apps Script document lock, so scaling out cannot produce duplicate rows.

---

## Design

One near-black ground, white type, one red — see the token block at the top of
`app/globals.css`. The page is a single dark surface from the first pixel to the
last, which is also what the supplied artwork wants: **every lockup is
white-and-red on transparency and was drawn for exactly that ground.**

There is **no light palette**. There used to be one, for a white page with a dark
hero. Now that nothing is set on paper, carrying `paper`/`ink` tokens and a `tone`
prop through every control would have been two code paths where one is real, so
both were deleted along with `components/ui/tone.ts`.

### Palette

| Token                     | Value     | Role                                    |
| ------------------------- | --------- | --------------------------------------- |
| `--color-night`           | `#06070a` | the page                                |
| `--color-night-soft`      | `#0b0d12` | raised surface — the confirmation       |
| `--color-night-lift`      | `#12151c` | a plate under the cursor                |
| `--color-edge`            | white 8%  | resting hairline                        |
| `--color-edge-lit`        | white 18% | active hairline                         |
| `--color-accent`          | `#e81820` | the logo red — focus rule, hover fill   |
| `--color-accent-deep`     | `#d0121a` | button base; white type at 5.9:1        |
| `--color-accent-bright`   | `#ff4d54` | small red text on the dark ground       |

The accent is sampled from the artwork rather than guessed: `#e81820` is the solid
red of the "Event" script in the MTD6 lockup. `accent-deep` is that hue taken down
far enough for white type to sit on it, and it brightens to the exact logo red on
hover. `accent-bright` exists because `#e81820` manages only 4.3:1 against
`#06070a`, which is not enough for a 13px error message.

Red appears on the call to action, the focus rule under a field, and validation
copy. Nothing else. Selected day and time plates fill with **white**, not red — a
chosen time is not a submit button, and letting them share a colour would make the
form look like it had two. Filling with the ground's exact opposite is also the
strongest signal available on a dark surface, and it needs no border, tick or
shadow to read.

Geometry is square throughout: no radius on the fields, the plates or the button.

### Depth

A flat near-black reads as cheap at full-screen scale — a whole viewport of one
value gives the eye nothing to settle on. But the obvious fix is worse: the hero
originally carried a hard red wash out of the top-left corner, which put a colour
cast behind a chrome lockup that reads better against nothing, and it was removed
for that reason.

`components/ui/Backdrop.tsx` replaces it with four layers that are deliberately
almost invisible, fixed behind the whole document:

1. a cool neutral lift from above, so the top sits a few values off black;
2. a single red ember, low and wide, echoing the poster's light without tinting
   anything the artwork sits on;
3. a vignette pulling the outer edges down — which does more for the sense of
   light than either radial;
4. grain over all of it.

The grain is not decoration. A radial ramp across 2000px of near-black bands
visibly, far more so than the same ramp on a light ground, and a few per cent of
noise is the cheapest way to break the steps up.

Elsewhere, depth is a hairline. The invitation is separated from the hero by one,
and it is the only structural border on the page.

### The button

Three things move on hover, all small: the fill brightens from `accent-deep` to
the exact logo red, the button rises 1px, and a wide soft glow fades in beneath
it. The glow is the trick — it is a shadow in the *accent* rather than in black,
so the button reads as a lit surface rather than a raised card, and it is blurred
far enough out never to resolve into a visible edge. On press the lift returns to
zero, so it answers a finger and not only a cursor.

A hairline of light used to sweep across the face on hover. It was removed: on a
flat red rectangle it read as an effect rather than as a material.

### Fitting one screen

The two hero lockups and every gap between them are sized in **`svh`**, not `rem`
or `vw`: their heights are a share of the viewport's height, so a short window
shrinks them rather than overflowing. Widths are then capped in `vw` so a short,
wide window cannot overflow sideways instead, and clamps hold both ends.

Each clamp's floor is set as low as the composition tolerates rather than as low as
it looks good, because the floors are exactly what binds on a short window; their
sum is the hero's minimum height.

| Viewport  | Hero   | Lockup  | Fits one screen |
| --------- | ------ | ------- | --------------- |
| 375×812   | 812px  | 323×195 | ✅ exactly       |
| 1280×800  | 800px  | 662×192 | ✅ exactly       |
| 2560×1080 | 1080px | —       | ✅ exactly       |

No horizontal overflow at any of them. A landscape phone is the one case that
cannot fit; it degrades by growing past the fold with the button still on screen,
rather than by shrinking the lockup into illegibility.

### The hero's entrance is CSS, not JavaScript

Every element in the hero starts at `opacity: 0`, which makes whatever brings it
back load-bearing. When that was framer-motion, the hero measured **`opacity: 0`
permanently** in a tab that was not compositing frames — because framer drives
animations from `requestAnimationFrame`, and if the frame loop never runs the
element never leaves its `initial` state. The same failure follows from a thrown
error, a bundle that never arrives, or a hydration mismatch.

The entrance is now a CSS animation (`hero-rise`). It needs no bundle, it runs
before hydration, and `animation-fill-mode: both` holds the finished state. Under
`prefers-reduced-motion` the block at the foot of `globals.css` collapses the
duration, landing every element on its end state — visible, unmoved.

**The hero is a server component with no JavaScript of its own at all.** The fleet
photograph used to sit at the bottom of the band and carried a scroll-driven
parallax, which was the only reason the hero needed to be a client component; when
the photograph was removed the parallax went with it and framer-motion left the
critical path entirely. Only the form is interactive.

Reduced motion is otherwise handled once, in `MotionProvider`. Branching
*rendered output* on `useReducedMotion()` cannot work — the hook is `false`
during SSR and the real preference on the client, so the trees disagree and React
refuses to patch the difference. `MotionConfig reducedMotion="user"` keeps the
markup identical on both sides and snaps transforms instead.

### The brand marks

Not currently on the page. The ten marks are still cut, inked and committed under
`public/brands/`, and each carries an optical `scale` in `lib/config.ts` — all ten
were exported at the common cap height the poster sets them at, but equal height is
not equal *weight*: SOUEAST is over three times the width of 212 at that height,
and BYD's strokes are far heavier than JETOUR's, so the multipliers pull the
extremes back. Adjust by eye, never by formula.

> A set of eight symbol logos (with the SOUEAST swirl, the CHERY mark, the BESTUNE
> КИ) was evaluated and **rejected**: the file was an AI-generated screenshot with
> the transparency checkerboard and selection marquees baked into the RGB, no alpha
> channel at all, roughly a fifth of the poster artwork's resolution, and it was
> missing AITO and RIDDARA. Symbol logos would be an upgrade over bare wordmarks —
> but they need to come from the manufacturers' real brand kits.

---

## Type

Self-hosted from `public/fonts` rather than fetched from Google at build time: no
third-party request at runtime, no build that can silently fall back to system
fonts behind a proxy, and deterministic output.

**Montserrat** (display) · **Inter** (interface) — both variable, subset to
`latin` + `cyrillic` + `cyrillic-ext`.

> `cyrillic-ext` is not optional. Mongolian Ө/ө (U+04E8/04E9) and Ү/ү
> (U+04AE/04AF) sit outside the basic `cyrillic` range. Several otherwise
> attractive display faces — Unbounded, Onest, Manrope — ship a near-empty
> `cyrillic-ext` and silently drop those four letters mid-headline. Both faces
> here were verified against the full Mongolian set.

`body` does **not** set `-webkit-font-smoothing: antialiased`. Greyscale
antialiasing thins glyphs, which is what you want for light type on a dark ground
and precisely what you do not want for dark type on white — it makes body copy
look under-inked. The dark bands opt into it themselves via the `on-night`
utility.

---

## Architecture

```
app/
  layout.tsx        metadata, font preloads, Backdrop, no-script notice
  page.tsx          server component; fully static, renders two bands
  globals.css       design tokens (@theme), base layer, utilities, hero-rise
  fonts.css         self-hosted @font-face with unicode-range
  icon.svg          favicon, drawn as strokes (no webfont in browser chrome)
  error.tsx         render failure fallback
actions/
  register.ts       "use server" — validate, dedupe, write
lib/
  config.ts         SINGLE SOURCE OF TRUTH + derived label helpers
  validation.ts     Zod schema, MN phone rules, user-facing error copy
  motion.ts         easing + durations for the interaction animations
types/
  event.ts          the event as content
  registration.ts   form domain, shared by the client and the action
components/
  sections/         Hero (server) · Invitation (server)
  registration/     RegistrationPanel · RegistrationForm · SuccessDialog
  ui/               Backdrop (server) · ActionButton · TextField
                    OptionGroup · FieldError · MotionProvider
scripts/
  prepare-assets.mjs   artwork → /public, measured not hardcoded
docs/
  apps-script.gs       the Google Sheets Web App
```

Server Components by default. Only the form, its panel and its dialog are client
components — everything else, including the hero and the backdrop, is markup and
CSS.

`RegistrationForm` reads its two watched fields with `useWatch`, not the
`watch()` returned by `useForm`: `watch()` hands back a fresh function every
render, which React Compiler cannot memoize safely, so it bails out of optimising
the whole component. For the same compiler, `handleSubmit(onSubmit)` is
constructed inside the `onSubmit` event rather than during render, because
`onSubmit` reads a ref.

---

## Accessibility

- **Every** text element on the page was measured, in the browser, against the
  *brightest* point the backdrop ever reaches (`rgb(20, 21, 23)` — the top radial
  laying white at 5.5% over `#06070a`), which is the worst case for light type.
  Colours were resolved through a canvas so Tailwind's `oklab()` output and every
  alpha composite are accounted for. 17 of 17 pass WCAG AA, including text on the
  white selection plates and on the red button.

  That audit caught four real failures introduced by the move to a darker ground:
  `white/40` labels measured 3.83:1 and the 13px form note 3.03:1. Labels are now
  `white/50` (5.33:1), plate details `white/55` (6.14:1), and placeholders
  `white/45` — the phone field's placeholder is a format hint, which is real
  information and has to be readable rather than merely present.
- Day and time plates are a real `radiogroup` with roving tabindex and arrow-key
  traversal that skips taken windows; each group borrows its visible label as its
  accessible name rather than repeating it for screen readers.
- The confirmation is `role="dialog"` with `aria-modal`, a focus trap, Escape to
  close, scroll lock with scrollbar-width compensation, and focus restored on
  close. It restates the day and window that were taken — the one thing chosen
  from a list, and so the one thing worth re-reading — and not the name and number
  the visitor typed a moment ago.
- Validation fires on blur, never mid-typing. Messages occupy reserved height, so
  an error never shifts the layout — which matters most on a phone, where a shift
  can move the submit button out from under a thumb. Submit progress is announced
  through an `aria-live` region as well as shown on the button.
- Field labels sit above their value at all times rather than floating into
  place: a floating label has to be animated, has to survive autofill and
  programmatic resets, and buys nothing on a form this short.
- Inputs are 17px. Safari on iOS zooms the page in on focus for any field under
  16px and never zooms back out, leaving someone pinching the page into place
  halfway through registering.
- Touch targets ≥ 48px. Focus rings are designed, never removed.
- The marquee's duplicate copy is `aria-hidden` with empty `alt`, so the ten
  marques are announced once.
- A skip link jumps straight to the registration panel.
