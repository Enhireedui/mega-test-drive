"use client";

import { forwardRef, useId } from "react";
import type { LucideIcon } from "lucide-react";

import { FieldMessage } from "@/components/FieldMessage";

interface InputProps extends Omit<React.ComponentPropsWithoutRef<"input">, "className" | "id"> {
  label: string;
  error?: string | undefined;
  /** Static leading text, e.g. the "+976" dialling code. */
  prefix?: string;
  icon?: LucideIcon;
  id?: string;
}

/**
 * The floating label is driven purely by CSS (`:placeholder-shown:not(:focus)`)
 * so it stays correct through programmatic resets and browser autofill —
 * cases where a JS-tracked "filled" flag silently desynchronises.
 */
const LABEL_FLOATED =
  "pointer-events-none absolute left-4 top-2 origin-left text-[0.625rem] font-medium uppercase " +
  "tracking-[0.16em] text-white/60 transition-all duration-200 ease-enter";

const LABEL_RESTING =
  "peer-[:placeholder-shown:not(:focus)]:top-1/2 " +
  "peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2 " +
  "peer-[:placeholder-shown:not(:focus)]:text-base " +
  "peer-[:placeholder-shown:not(:focus)]:font-normal " +
  "peer-[:placeholder-shown:not(:focus)]:normal-case " +
  "peer-[:placeholder-shown:not(:focus)]:tracking-normal " +
  "peer-[:placeholder-shown:not(:focus)]:text-white/55";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, prefix, icon: Icon, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? `field-${generatedId}`;
  const errorId = `${inputId}-error`;
  const invalid = Boolean(error);

  return (
    <div>
      <div
        className={[
          "group/field relative overflow-hidden rounded-2xl border bg-white/[0.035] transition-colors duration-200 ease-enter",
          invalid
            ? "border-brand/55"
            : "border-white/10 hover:border-white/[0.18] focus-within:border-white/25",
        ].join(" ")}
      >
        <input
          ref={ref}
          id={inputId}
          /* A single space keeps :placeholder-shown authoritative. */
          placeholder=" "
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={[
            /* 16px, not 15: Safari on iOS zooms the page in on focus for any
               field under 16px and never zooms back out, which would leave
               someone pinching the page back into place mid-registration. */
            "peer h-16 w-full bg-transparent pb-2.5 pt-7 text-base text-white/92 outline-none",
            "caret-brand-hi placeholder:text-transparent disabled:cursor-not-allowed",
            prefix ? "pl-[4.25rem]" : "pl-4",
            Icon ? "pr-12" : "pr-4",
          ].join(" ")}
          {...rest}
        />

        {/* Follows the input so the peer sibling selector above resolves. */}
        <label htmlFor={inputId} className={`${LABEL_FLOATED} ${prefix ? "" : LABEL_RESTING}`}>
          {label}
        </label>

        {/* Focus underline, drawn left to right. */}
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0",
            "transition-transform duration-[240ms] ease-enter peer-focus:scale-x-100",
            invalid ? "scale-x-100 bg-brand" : "bg-brand",
          ].join(" ")}
        />

        {prefix ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-4 text-base tabular-nums text-white/55"
          >
            {prefix}
          </span>
        ) : null}

        {Icon ? (
          <Icon
            aria-hidden="true"
            strokeWidth={1.5}
            className="pointer-events-none absolute right-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-white/40 transition-colors duration-200 group-focus-within/field:text-white/60"
          />
        ) : null}
      </div>

      <FieldMessage id={errorId} message={error} />
    </div>
  );
});
