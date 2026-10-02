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
 * A quiet boxed field.
 *
 * Earlier editions drew the field as a ruled line. On the page it was elegant,
 * but on a phone opened from a chat app it did not read as somewhere to type —
 * the one thing a registration field must do. So the field is a box again, kept
 * as quiet as a box can be: a barely-lifted fill, a hairline, the same 4px radius
 * as the plates and the button, and no shadow.
 *
 * The label sits above the value at all times instead of floating into place. A
 * floating label has to be animated, has to survive autofill and programmatic
 * resets, and buys nothing on a form of two fields; a fixed one is always legible
 * and never lies about state.
 *
 * Focus turns the hairline amber — amber, not red, because red on this page means
 * "chosen" or "this button submits", and a focused field is neither.
 *
 * 56px tall: the same height as the plates above it and the button below, so the
 * form keeps one rhythm, and comfortably over the touch minimum.
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

      <div
        className={[
          "mt-2.5 flex h-14 items-center rounded border bg-well transition-colors duration-200 ease-enter",
          "focus-within:border-amber",
          invalid ? "border-signal-bright/70" : "border-rule-lit hover:not-focus-within:border-bone/45",
        ].join(" ")}
      >
        {prefix ? (
          <span
            aria-hidden="true"
            data-numeric=""
            className="flex h-full shrink-0 items-center border-r border-rule pl-4 pr-3.5 font-display text-[1.0625rem] tracking-wide text-slate"
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
           * The box carries the focus state, so the input's own outline is off.
           */
          className="h-full w-full min-w-0 bg-transparent px-4 text-[1.0625rem] text-bone outline-none placeholder:text-slate/60 focus-visible:outline-none disabled:cursor-not-allowed"
          {...rest}
        />
      </div>

      <FieldError id={errorId} message={error} />
    </div>
  );
});
