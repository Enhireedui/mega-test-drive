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
 * A field drawn as a ruled line, not a box.
 *
 * The whole page is hairlines and letterspaced labels — a data table, a plate
 * caption, a survey. A filled input with a border and a radius would be the one
 * element that looked like a web form dropped into that, so the field is a rule
 * with a value sitting on it. Same logic as the entry lines on a paper form,
 * which is exactly the register this page is written in.
 *
 * The label sits above the value at all times instead of floating into place. A
 * floating label has to be animated, has to survive autofill and programmatic
 * resets, and buys nothing on a form of two fields; a fixed one is always legible
 * and never lies about state.
 *
 * On focus an amber rule is drawn left-to-right over the resting hairline —
 * amber, not red, because red on this page means "this button submits" and a
 * focused field is not that.
 *
 * The box is 44px, not 48. On a ruled field the value sits just above the rule, so
 * a taller box only adds dead air between the label and the thing it labels — at
 * 48px they read as two separate elements. 44px is still the touch minimum.
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
      <label htmlFor={inputId} className="ref block text-slate">
        {label}
      </label>

      <div className="group/field relative mt-2 flex items-baseline gap-2.5">
        {prefix ? (
          <span
            aria-hidden="true"
            data-numeric=""
            className="shrink-0 pb-2.5 font-display text-[1.0625rem] tracking-wide text-slate"
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
           *
           * Placeholder at 45%: the phone field's placeholder is a format hint
           * ("9911 2233"), which is real information and has to be readable
           * rather than merely present.
           */
          className="peer h-11 w-full min-w-0 bg-transparent pb-2.5 text-[1.0625rem] text-bone outline-none placeholder:text-slate/55 disabled:cursor-not-allowed"
          {...rest}
        />

        {/* Resting hairline. */}
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-px transition-colors duration-300 ease-enter",
            invalid ? "bg-signal/55" : "bg-rule group-hover/field:bg-rule-lit",
          ].join(" ")}
        />
        {/* Focus rule, drawn left to right over it. */}
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-amber",
            "transition-transform duration-500 ease-enter peer-focus:scale-x-100",
            invalid ? "scale-x-100 bg-signal" : "scale-x-0",
          ].join(" ")}
        />
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
});
