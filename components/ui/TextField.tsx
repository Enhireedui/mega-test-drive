"use client";

import { forwardRef, useId } from "react";

import { FieldError } from "@/components/ui/FieldError";

interface TextFieldProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "className" | "id"> {
  label: string;
  error?: string | undefined;
  /** Static leading text, e.g. the "+976" dialling code. */
  prefix?: string;
  id?: string;
}

/**
 * A field drawn as a rule, not a box.
 *
 * No container, no fill, no radius — a hairline under a large input. That is what
 * keeps the form reading as part of the page rather than as a widget bolted onto
 * it, and on a dark ground it matters more than on a light one: a filled input
 * would put a grey slab in the middle of the composition.
 *
 * The label sits above the value at all times instead of floating into place. A
 * floating label has to be animated, has to survive autofill and programmatic
 * resets, and buys nothing on a form this short; a fixed one is always legible
 * and never lies about state.
 *
 * On focus the hairline is overdrawn by a red rule that scales in from the left.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, prefix, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error);

  return (
    <div>
      <label htmlFor={inputId} className="eyebrow block text-white/55">
        {label}
      </label>

      <div className="group/field relative mt-4 flex items-baseline gap-2.5">
        {prefix ? (
          <span
            aria-hidden="true"
            data-numeric=""
            className="shrink-0 pb-3.5 text-[1.0625rem] text-white/50"
          >
            {prefix}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          /*
           * 17px, not 15: Safari on iOS zooms the page in on focus for any field
           * under 16px and never zooms back out, leaving someone pinching the
           * page into place halfway through registering.
           */
          /* Placeholder at 45%, not 25%: the phone field's placeholder is a
             format hint ("9911 2233"), which is real information and has to be
             readable rather than merely present. */
          className="peer h-12 w-full min-w-0 bg-transparent pb-3.5 text-[1.0625rem] text-white outline-none placeholder:text-white/45 disabled:cursor-not-allowed"
          {...rest}
        />

        {/* Resting hairline. */}
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-px transition-colors duration-300 ease-enter",
            invalid ? "bg-accent-bright/45" : "bg-edge group-hover/field:bg-edge-lit",
          ].join(" ")}
        />
        {/* Focus rule, drawn left to right over it. */}
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-accent",
            "transition-transform duration-500 ease-enter peer-focus:scale-x-100",
            invalid ? "scale-x-100" : "scale-x-0",
          ].join(" ")}
        />
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
});
