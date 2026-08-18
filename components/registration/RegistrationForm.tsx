"use client";

import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerAttendee } from "@/actions/register";
import { ActionButton } from "@/components/ui/ActionButton";
import { TextField } from "@/components/ui/TextField";
import { TransportChoice } from "@/components/ui/TransportChoice";
import { eventConfig, transportLabel, venueLabel } from "@/lib/config";
import { formatPhoneInput, messageForErrorCode, registrationSchema } from "@/lib/validation";
import type { RegistrationFormValues } from "@/types/registration";

const EMPTY_FORM: RegistrationFormValues = {
  fullName: "",
  phone: "",
  transport: "",
  honeypot: "",
};

/**
 * The confirmation.
 *
 * It replaces the form in place — no dialog, no overlay, no focus trap, no scroll
 * lock, and nothing to dismiss. The form is a column in a composition, so the
 * calmest possible confirmation is that column quietly becoming the answer.
 *
 * No tick graphic, no colour flood, no confetti. An amber reference rule, the
 * words, and the three facts worth re-reading, set in the same label-and-value
 * rhythm as the table on the left so the two read as one document. Announced
 * through the live region its parent keeps mounted, rather than by stealing focus.
 */
function Confirmation({ headingId, transport }: { headingId: string; transport: string }) {
  const { title, date, hours } = eventConfig;

  /*
   * The coach is read back and the name and number are not. They typed those a
   * moment ago; the run they picked is the one answer they may genuinely need to
   * check later, and it is the only one with a time attached to it.
   */
  const rows = [
    { label: "Огноо", value: date.label, numeric: true },
    { label: "Цаг", value: hours.label, numeric: true },
    { label: "Газар", value: venueLabel(), numeric: false },
    { label: "Унаа", value: transportLabel(transport), numeric: false },
  ];

  return (
    <div style={{ "--rise-delay": "0.04s" } as React.CSSProperties} className="rise">
      <span aria-hidden="true" className="block h-px w-12 bg-amber" />

      <h2 id={headingId} className="heading mt-7 text-bone">
        Бүртгэл амжилттай
      </h2>

      <p className="mt-4 text-[0.9375rem] leading-relaxed text-sage">
        {title}-д бүртгүүлсэнд баярлалаа.
      </p>

      <dl className="mt-9 border-t border-rule">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-6 border-b border-rule py-3.5">
            <dt className="ref w-14 shrink-0 pt-0.5 text-sage">{row.label}</dt>
            <dd
              className="font-display text-[1.0625rem] tracking-[0.02em] text-bone"
              {...(row.numeric ? { "data-numeric": "" } : {})}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Name, number, send.
 *
 * Three questions, one button, no steps. The event runs on one day inside one
 * window and the fleet is not picked from a list, so neither is asked. The one
 * thing that is asked beyond a name and a number is which coach — because the
 * organiser runs one on a timetable and cannot load it otherwise.
 *
 * On failure the entered values stay exactly where they are; the form is never
 * reset on an error path, only replaced on success.
 */
export function RegistrationForm({ headingId }: { headingId: string }) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const submitLock = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  /*
   * Registered in visual order: React Hook Form focuses the first *registered*
   * field carrying an error, so registering the phone first would send focus past
   * the name field on a failed submit.
   */
  const nameField = register("fullName");
  const phoneField = register("phone");

  /*
   * `useWatch`, not the `watch()` returned by `useForm`. `watch()` hands back a
   * fresh function on every render, which React Compiler cannot memoize safely, so
   * it bails out of optimising this whole component. `useWatch` subscribes to this
   * one field and re-renders only when it changes.
   */
  const transport = useWatch({ control, name: "transport" });

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmissionError(null);

    try {
      const result = await registerAttendee(values);

      if (result.status === "success") {
        setConfirmed(true);
        return;
      }

      const message = messageForErrorCode(result.code);
      /*
       * Show the reason once. When it belongs to a field it goes under that
       * field; the banner is only for failures with nowhere else to live.
       */
      if (result.field && result.field !== "honeypot") {
        setError(result.field, { type: "server", message });
      } else {
        setSubmissionError(message);
      }
    } catch {
      /*
       * The action itself failed to complete. Only claim a connection problem
       * when the browser actually reports one — a server-side fault must not be
       * blamed on the visitor's internet.
       */
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setSubmissionError(messageForErrorCode(offline ? "NETWORK" : "UNKNOWN"));
    } finally {
      submitLock.current = false;
    }
  };

  /*
   * One live region, mounted whichever branch renders.
   *
   * If the announcement lived inside the form it would unmount at the exact
   * moment there was something worth announcing, and a screen reader would hear
   * nothing at all about the registration having succeeded.
   */
  const announcement = isSubmitting
    ? "Бүртгэлийг илгээж байна"
    : confirmed
      ? "Бүртгэл амжилттай. Дэлгэрэнгүйг доор харна уу."
      : "";

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {confirmed ? (
        <Confirmation headingId={headingId} transport={transport} />
      ) : (
        <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <h2 id={headingId} className="heading text-bone">
            Бүртгүүлэх
          </h2>

          {/* Bot trap. Off-screen, never announced, never tabbable. */}
          <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-0 overflow-hidden">
            <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
          </div>

          {/* Fields lock while the action is in flight, so nothing can be edited
              between validation and the write. */}
          <fieldset
            disabled={isSubmitting}
            className="mt-9 min-w-0 space-y-7 border-0 p-0 transition-opacity duration-300 ease-enter disabled:opacity-50"
          >
            <TextField
              label="Нэр"
              autoComplete="name"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="next"
              error={errors.fullName?.message}
              {...nameField}
            />
            <TextField
              label="Утасны дугаар"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              enterKeyHint="send"
              maxLength={9}
              prefix="+976"
              placeholder="9911 2233"
              error={errors.phone?.message}
              {...phoneField}
              onChange={(event) => {
                event.target.value = formatPhoneInput(event.target.value);
                void phoneField.onChange(event);
              }}
            />

            <TransportChoice
              value={transport}
              onChange={(next) => {
                setValue("transport", next, { shouldValidate: true, shouldDirty: true });
                setSubmissionError(null);
              }}
              error={errors.transport?.message}
            />
          </fieldset>

          {submissionError ? (
            <p
              role="alert"
              className="mt-6 border-l-2 border-signal pl-4 text-[0.875rem] leading-relaxed text-bone"
            >
              {submissionError}
            </p>
          ) : null}

          <ActionButton
            type="submit"
            fullWidth
            loading={isSubmitting}
            loadingLabel="Илгээж байна"
            className="mt-9"
          >
            Бүртгүүлэх
          </ActionButton>
        </form>
      )}
    </>
  );
}
