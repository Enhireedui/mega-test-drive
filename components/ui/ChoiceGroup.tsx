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
  /**
   * `pair` — two-up plates with the label at the left, for options that carry
   * a second line (the days). `row` — a single row of centred figures from
   * `sm` up, for a short sequence (the times); on a phone it falls back to
   * two-up, and an odd last plate takes the whole row rather than leaving a hole.
   */
  layout?: "pair" | "row";
}

const GRID = {
  pair: "grid-cols-2",
  row: "grid-cols-2 sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none",
} as const;

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
 * Selection takes the campaign red as a border and a faint tint of it, with the
 * type brightened to full bone. A chosen plate has to be unmistakable at a
 * glance on a phone, and red is the one colour this page reserves for "yours".
 * The change is carried by border, fill and type weight together, and
 * `aria-checked` carries it for anyone not seeing colour, so colour is never the
 * only signal.
 *
 * 56px minimum on every plate: the brief's touch floor, and enough for the two
 * lines the day options carry.
 */
export function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  error,
  layout = "pair",
}: ChoiceGroupProps) {
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
        className={`mt-2.5 grid gap-2 ${GRID[layout]}`}
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
                "flex min-h-14 flex-col justify-center gap-1.5 rounded border py-3",
                layout === "row"
                  ? "items-center px-2 text-center max-sm:odd:last:col-span-2"
                  : "items-start px-4 text-left",
                "transition-[background-color,border-color,color,scale] duration-200 ease-enter active:scale-[0.98]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber",
                selected
                  ? "border-signal bg-signal/20 text-white shadow-[inset_0_0_0_1px_var(--color-signal)]"
                  : "border-rule-lit bg-well text-bone/85 hover:border-bone/45 hover:text-bone",
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
                    selected ? "text-bone/80" : "text-slate",
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
