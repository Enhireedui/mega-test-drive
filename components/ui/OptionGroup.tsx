"use client";

import { useId, useRef } from "react";

import { FieldError } from "@/components/ui/FieldError";

export interface Option {
  value: string;
  /** Primary line, set in the display face. */
  label: string;
  /** Quiet second line, e.g. a weekday. */
  detail?: string;
  /** Shown only when the option cannot be taken, e.g. "Дүүрсэн". */
  note?: string;
  disabled?: boolean;
}

interface OptionGroupProps {
  /** id of the visible label naming this group, so it is never announced twice. */
  labelledBy: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
  error?: string | undefined;
  /** Columns from the `sm` breakpoint up. Below it, options always stack. */
  columns?: 2 | 3;
}

const COLUMNS: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
};

/**
 * A set of plates behaving as one radio group.
 *
 * Plates rather than a select: every option and its availability is legible at a
 * glance, and choosing costs one tap instead of two.
 *
 * Selection fills with **white**, not red. Red on this page means "this is the
 * button that does the thing", and a chosen time is not that — letting the two
 * share a colour would make the form look like it had two submit buttons. Filling
 * with the ground's exact opposite is also the strongest possible signal on a
 * dark surface, and it needs no border, no tick and no shadow to read.
 *
 * Sharp corners, one hairline, no shadow. The only things that move are the fill
 * and a 1px lift.
 */
export function OptionGroup({
  labelledBy,
  value,
  options,
  onChange,
  error,
  columns = 3,
}: OptionGroupProps) {
  const errorId = `${useId()}-error`;

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectable = options.reduce<number[]>((accumulator, option, index) => {
    if (!option.disabled) accumulator.push(index);
    return accumulator;
  }, []);
  const firstSelectable = selectable[0] ?? -1;

  /* Arrow-key traversal, as expected of a radiogroup. Skips taken slots. */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0 || selectable.length === 0) return;
    event.preventDefault();

    const current = selectable.indexOf(selectedIndex);
    const next = current === -1 ? 0 : (current + step + selectable.length) % selectable.length;
    const index = selectable[next];
    if (index === undefined) return;

    const option = options[index];
    if (!option) return;
    onChange(option.value);
    buttonRefs.current[index]?.focus();
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
        className={`grid grid-cols-1 gap-3 ${COLUMNS[columns]}`}
      >
        {options.map((option, index) => {
          const isSelected = option.value === value;
          const isDisabled = Boolean(option.disabled);

          return (
            <button
              key={option.value}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              /* Only one stop per group in the tab order, per the radiogroup pattern. */
              tabIndex={isSelected || (selectedIndex === -1 && index === firstSelectable) ? 0 : -1}
              onClick={() => onChange(option.value)}
              className={[
                /* 80px tall and 12px of radius — on the 8px grid, and one step
                   down from the button's 16px, so the two read as one system. */
                "relative flex min-h-20 flex-col items-start justify-center gap-2 rounded-xl px-5 py-4 text-left",
                "border transition-[background-color,border-color,color,transform] duration-300 ease-enter",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                isDisabled
                  ? "cursor-not-allowed border-white/[0.05] bg-white/[0.012] text-white/30"
                  : isSelected
                    ? "border-white bg-white text-night"
                    : "border-edge bg-white/[0.02] text-white/85 hover:-translate-y-px hover:border-edge-lit hover:bg-night-lift",
              ].join(" ")}
            >
              <span
                data-numeric=""
                className={[
                  "font-display text-[1.125rem] font-semibold leading-none tracking-[-0.01em]",
                  isDisabled ? "line-through decoration-white/30" : "",
                ].join(" ")}
              >
                {option.label}
              </span>

              {option.note ? (
                <span className="eyebrow text-[0.625rem] text-white/55">{option.note}</span>
              ) : option.detail ? (
                <span
                  className={[
                    "text-[0.8125rem] leading-none",
                    isSelected ? "text-night/60" : "text-white/60",
                  ].join(" ")}
                >
                  {option.detail}
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
