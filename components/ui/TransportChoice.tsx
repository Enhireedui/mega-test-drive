"use client";

import { useId, useRef } from "react";

import { FieldError } from "@/components/ui/FieldError";
import { OWN_CAR, eventConfig } from "@/lib/config";

interface TransportChoiceProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}

/**
 * How they are getting there.
 *
 * ── The timetable *is* the control ───────────────────────────────────────
 * The organiser supplied this as a two-column table — departures from the
 * showroom, departures back from the pass — followed by a separate question
 * asking which one you want. Printing the table and then asking underneath it
 * would make a visitor hold three pairs of times in their head and then map an
 * answer onto them.
 *
 * So each row of the table becomes one control carrying both of its times: the
 * departure large, the return underneath as a quiet second line. Nothing is lost
 * and there is no table on the page. The fourth option is for people driving
 * themselves, and it is deliberately last and visually identical — arriving under
 * your own steam is an answer, not an opt-out.
 *
 * The group is labelled "АВТОБУС" because that is what three of the four options
 * are and what the timetable is about. The sheet column and the confirmation stay
 * labelled "Унаа", which has to cover the fourth answer as well.
 *
 * ── The control ──────────────────────────────────────────────────────────
 * A real `radiogroup`: arrow keys move between options, only the selected one is
 * a tab stop, and each is a `button` with `role="radio"` rather than a styled
 * `<input>` so the plate can carry two lines of type.
 *
 * Selection fills with **bone** — the ground's opposite — not with red. Red on
 * this page means "this button submits", and a chosen coach is not that. Filling
 * with the strongest available contrast also means the selected state needs no
 * tick, no border and no shadow to read.
 */
export function TransportChoice({ value, onChange, error }: TransportChoiceProps) {
  const rawId = useId();
  const labelId = `${rawId}-label`;
  const errorId = `${rawId}-error`;
  const { transport } = eventConfig;

  const options = [
    ...transport.runs.map((run) => ({
      value: run.id,
      primary: run.departs,
      secondary: `Буцах ${run.returns}`,
      numeric: true,
    })),
    { value: OWN_CAR, primary: transport.ownCarLabel, secondary: null, numeric: false },
  ];

  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);

  /* Arrow-key traversal, as expected of a radiogroup. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();

    const current = selectedIndex === -1 ? 0 : selectedIndex;
    const next = (current + step + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    buttons.current[next]?.focus();
  };

  return (
    <div>
      <p id={labelId} className="ref text-sage">
        Автобус
      </p>

      {/* The meeting point, once, under the label — it is the same for every
          coach, so repeating it on three controls would be noise. */}
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-sage">
        {transport.meetingPoint}-оос хөдөлнө.
      </p>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
        className="mt-4 grid grid-cols-2 gap-2"
      >
        {options.map((option, index) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              /* One stop per group in the tab order, per the radiogroup pattern. */
              tabIndex={selected || (selectedIndex === -1 && index === 0) ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={[
                /* 4px radius and a hairline, matching the button and the plate —
                   this page has no rounded cards for a control to imitate. */
                "flex min-h-[3.25rem] flex-col items-start justify-center gap-1 rounded border px-3.5 py-2.5 text-left",
                "transition-[background-color,border-color,color] duration-200 ease-enter",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber",
                selected
                  ? "border-bone bg-bone text-basalt"
                  : "border-rule text-bone hover:border-rule-lit hover:bg-bone/[0.04]",
              ].join(" ")}
            >
              <span
                className="font-display text-[1.0625rem] font-medium leading-none tracking-[0.02em]"
                {...(option.numeric ? { "data-numeric": "" } : {})}
              >
                {option.primary}
              </span>
              {option.secondary ? (
                <span
                  data-numeric=""
                  className={[
                    "text-[0.75rem] leading-none",
                    selected ? "text-basalt/60" : "text-sage",
                  ].join(" ")}
                >
                  {option.secondary}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
}
