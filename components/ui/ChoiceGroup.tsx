"use client";

import { useId, useRef } from "react";

import { FieldError } from "@/components/ui/FieldError";

export interface Choice {
  /** Stable id, and the value submitted. */
  readonly value: string;
  /** The large line on the plate. */
  readonly primary: string;
  /** The quiet second line, when there is one. */
  readonly secondary?: string | null;
  /** Set for values that are figures, so they sit on tabular numerals. */
  readonly numeric?: boolean;
}

interface ChoiceGroupProps {
  label: string;
  options: readonly Choice[];
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
}

/**
 * A set of plates, one of which is chosen.
 *
 * Edition 7 had one of these — the coach timetable — written as a bespoke
 * component. Edition 8 asks two questions in this shape (which day, what time),
 * so the control is the general one and the questions are data. Two instances,
 * one implementation, one set of keyboard semantics to get right.
 *
 * ── The control ──────────────────────────────────────────────────────────
 * A real `radiogroup`: arrow keys move between options, only the selected one is
 * a tab stop, and each is a `button` with `role="radio"` rather than a styled
 * `<input>` so a plate can carry two lines of type.
 *
 * Selection fills with **bone** — the ground's opposite — not with red. Red on
 * this page means "this button submits", and a chosen time is not that. Filling
 * with the strongest available contrast also means the selected state carries
 * without a tick, and `aria-checked` carries it for anyone not seeing the fill,
 * so colour is never the only signal.
 *
 * 56px minimum on every plate: the brief's touch floor, and enough for the two
 * lines the day options carry.
 */
export function ChoiceGroup({ label, options, value, onChange, error }: ChoiceGroupProps) {
  const rawId = useId();
  const labelId = `${rawId}-label`;
  const errorId = `${rawId}-error`;

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
      <p id={labelId} className="ref text-slate">
        {label}
      </p>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
        className="mt-3 grid grid-cols-2 gap-2.5"
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
                /* 4px radius and a hairline, matching the button and the rules —
                   this page has no rounded cards for a control to imitate. */
                "flex min-h-14 flex-col items-start justify-center gap-1 rounded border px-4 py-3 text-left",
                "transition-[background-color,border-color,color] duration-200 ease-enter",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber",
                selected
                  ? "border-bone bg-bone text-midnight"
                  : "border-rule text-bone hover:border-rule-lit hover:bg-bone/[0.05]",
              ].join(" ")}
            >
              <span
                className="font-display text-[1.125rem] font-medium leading-none tracking-[0.02em]"
                {...(option.numeric ? { "data-numeric": "" } : {})}
              >
                {option.primary}
              </span>
              {option.secondary ? (
                <span
                  className={[
                    "text-[0.75rem] leading-none",
                    selected ? "text-midnight/60" : "text-slate",
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
