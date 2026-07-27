"use client";

import { useId, useRef } from "react";

import { FieldMessage } from "@/components/FieldMessage";

export interface Choice {
  value: string;
  /** Primary line, set in the display face. */
  label: string;
  /** Shown only when the option cannot be picked, e.g. "Дүүрсэн". */
  note?: string;
  disabled?: boolean;
}

interface ChoiceGroupProps {
  /** id of the visible heading that names this group — the step title, so the
   *  name is never announced twice. */
  labelledBy: string;
  value: string;
  choices: readonly Choice[];
  onChange: (value: string) => void;
  error?: string | undefined;
}

/**
 * A set of cards behaving as one radio group.
 *
 * Cards rather than a dropdown: every option and its availability is visible at
 * a glance, and choosing takes one tap instead of two. Three across only once
 * there is room for the label — a range like "11:00 – 14:00" cannot fit a third
 * of a 375px screen, so the cards stack there.
 */
export function ChoiceGroup({
  labelledBy,
  value,
  choices,
  onChange,
  error,
}: ChoiceGroupProps) {
  const errorId = `${useId()}-error`;

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = choices.findIndex((choice) => choice.value === value);
  const selectable = choices.reduce<number[]>((accumulator, choice, index) => {
    if (!choice.disabled) accumulator.push(index);
    return accumulator;
  }, []);
  const firstSelectable = selectable[0] ?? -1;

  /* Arrow-key traversal, as expected of a radiogroup. Skips full slots. */
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

    const choice = choices[index];
    if (!choice) return;
    onChange(choice.value);
    buttonRefs.current[index]?.focus();
  };

  return (
    <div>
      <div
        role="radiogroup"
        aria-labelledby={labelledBy}
        aria-describedby={error ? errorId : undefined}
        onKeyDown={handleKeyDown}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {choices.map((choice, index) => {
          const isSelected = choice.value === value;
          const isDisabled = Boolean(choice.disabled);

          return (
            <button
              key={choice.value}
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isDisabled}
              tabIndex={isSelected || (selectedIndex === -1 && index === firstSelectable) ? 0 : -1}
              onClick={() => onChange(choice.value)}
              className={[
                "group/choice relative flex min-h-[4.25rem] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl border px-3 py-4",
                "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-enter",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-hi",
                isDisabled
                  ? "cursor-not-allowed border-white/[0.05] bg-white/[0.012]"
                  : isSelected
                    ? "-translate-y-0.5 border-brand/60 bg-brand/[0.1] shadow-[0_14px_38px_-18px_rgb(226_10_23_/_0.95)]"
                    : "border-white/[0.09] bg-white/[0.022] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05]",
              ].join(" ")}
            >
              {/* Warm bloom behind the chosen card. */}
              {isSelected ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-9 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-brand/40 blur-2xl"
                />
              ) : null}

              <span
                className={[
                  "relative whitespace-nowrap font-display text-[1.0625rem] font-semibold leading-none tracking-tight tabular-nums",
                  isDisabled
                    ? "text-white/40 line-through decoration-white/35"
                    : isSelected
                      ? "text-white"
                      : "text-white/85",
                ].join(" ")}
              >
                {choice.label}
              </span>

              {choice.note ? (
                <span className="relative text-[0.625rem] uppercase leading-none tracking-[0.12em] text-white/45">
                  {choice.note}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <FieldMessage id={errorId} message={error} />
    </div>
  );
}
