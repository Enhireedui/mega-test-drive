interface FieldErrorProps {
  id: string;
  message?: string | undefined;
}

/**
 * Validation copy for a single control.
 *
 * The row keeps its height whether or not a message is in it, so an error
 * appearing never nudges the rest of the form — the form's height is constant
 * from first paint to submission, which matters most on a phone, where a shift
 * can move the submit button out from under a thumb.
 *
 * A plain server component: the fade is a CSS transition on opacity, so this
 * needs no `"use client"`, no animation library and no presence tracking. The
 * element is always mounted; only its opacity changes.
 *
 * Set in `signal-bright`, not `signal`: the campaign red manages only 4.3:1
 * against midnight, and this is 13px type.
 */
export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <div className="min-h-6 pt-2.5">
      <p
        id={id}
        /* `alert` only while it says something — an empty live region announced
           on every render would interrupt a screen reader mid-field. */
        role={message ? "alert" : undefined}
        className={[
          "text-[0.8125rem] leading-snug text-signal-bright",
          "transition-opacity duration-200 ease-enter",
          message ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        {message}
      </p>
    </div>
  );
}
