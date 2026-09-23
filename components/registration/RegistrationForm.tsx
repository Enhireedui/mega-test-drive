"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { registerAttendee } from "@/actions/register";
import { REGISTERED_EVENT } from "@/components/registration/StickyRegister";
import { ActionButton } from "@/components/ui/ActionButton";
import { ChoiceGroup } from "@/components/ui/ChoiceGroup";
import { TextField } from "@/components/ui/TextField";
import { dayLabel, eventConfig, venueLabel } from "@/lib/config";
import { formatPhoneInput, messageForErrorCode, registrationSchema } from "@/lib/validation";
import type { RegistrationFormValues } from "@/types/registration";

const EMPTY_FORM: RegistrationFormValues = {
  fullName: "",
  phone: "",
  visitDate: "",
  visitTime: "",
  honeypot: "",
};

/** When to tell someone waiting on a submit that it is still going. */
const SLOW_HINT_AFTER_MS = 4_000;

/**
 * The confirmation.
 *
 * It replaces the form in place — no dialog, no overlay, no focus trap, no
 * scroll lock, and nothing to dismiss. The form is a column in a composition, so
 * the calmest possible confirmation is that column quietly becoming the answer.
 *
 * No tick graphic, no colour flood, no confetti. An amber reference rule, the
 * words, and the three facts worth re-reading, set in the same label-and-value
 * rhythm as the table on the left so the two read as one document. Announced
 * through the live region its parent keeps mounted, rather than by stealing
 * focus.
 */
function Confirmation({
  headingId,
  visitDate,
  visitTime,
}: {
  headingId: string;
  visitDate: string;
  visitTime: string;
}) {
  /*
   * The day and the time are read back; the name and the number are not. They
   * typed those a moment ago, and the appointment they just made is the one
   * answer they may genuinely need to check later.
   */
  const rows = [
    { label: "Өдөр", value: dayLabel(visitDate), numeric: true },
    { label: "Цаг", value: visitTime, numeric: true },
    { label: "Байршил", value: venueLabel(), numeric: false },
  ];

  return (
    <div style={{ "--rise-delay": "0.04s" } as React.CSSProperties} className="rise">
      <span aria-hidden="true" className="block h-px w-12 bg-amber" />

      <h2 id={headingId} className="heading mt-7 text-bone">
        Бүртгэл амжилттай
      </h2>

      <p className="mt-4 text-[0.9375rem] leading-relaxed text-slate">
        Бүртгэл баталгаажлаа. Товлосон цагтаа ирээрэй.
      </p>

      <dl className="mt-9 border-t border-rule">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-6 border-b border-rule py-3.5">
            <dt className="ref w-20 shrink-0 pt-0.5 text-slate">{row.label}</dt>
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
 * Day, time, name, number, send.
 *
 * Four questions, one button, no steps. The two choices come first and the two
 * text fields after them: picking a day and a time is two taps and no keyboard,
 * so the form opens with the part that costs nothing and leaves the typing until
 * someone has already committed to a time. It also means the keyboard, when it
 * finally appears, is not covering a control the visitor still has to reach.
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
   * field carrying an error, so registering the phone first would send focus
   * past the name field on a failed submit.
   */
  const nameField = register("fullName");
  const phoneField = register("phone");

  /*
   * `useWatch`, not the `watch()` returned by `useForm`. `watch()` hands back a
   * fresh function on every render, which React Compiler cannot memoize safely,
   * so it bails out of optimising this whole component. `useWatch` subscribes to
   * these fields and re-renders only when they change.
   */
  const visitDate = useWatch({ control, name: "visitDate" });
  const visitTime = useWatch({ control, name: "visitTime" });

  /*
   * A cold Apps Script write takes ~16s. Past a few seconds, say so — a button
   * that just spins that long reads as broken, and a second tap only earns the
   * visitor a "duplicate" answer.
   */
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    /* Reset in onSubmit, not here; the hint only renders while submitting. */
    if (!isSubmitting) return;
    const timer = window.setTimeout(() => setSlow(true), SLOW_HINT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [isSubmitting]);

  /* Tells the docked phone CTA to stand down — see StickyRegister. */
  useEffect(() => {
    if (confirmed) window.dispatchEvent(new Event(REGISTERED_EVENT));
  }, [confirmed]);

  const choose = (field: "visitDate" | "visitTime") => (next: string) => {
    setValue(field, next, { shouldValidate: true, shouldDirty: true });
    setSubmissionError(null);
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmissionError(null);
    setSlow(false);

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
        <Confirmation headingId={headingId} visitDate={visitDate} visitTime={visitTime} />
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
            className="mt-8 min-w-0 space-y-6 border-0 p-0 transition-opacity duration-300 ease-enter disabled:opacity-50"
          >
            <ChoiceGroup
              label="Өдөр"
              options={eventConfig.days.map((day) => ({
                value: day.id,
                primary: day.label,
                secondary: day.weekday,
                numeric: true,
              }))}
              value={visitDate}
              onChange={choose("visitDate")}
              error={errors.visitDate?.message}
            />

            <ChoiceGroup
              label="Цаг"
              options={eventConfig.slots.map((slot) => ({
                value: slot.id,
                primary: slot.label,
                numeric: true,
              }))}
              value={visitTime}
              onChange={choose("visitTime")}
              error={errors.visitTime?.message}
            />

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
              /* No maxLength: the browser would cut a pasted "+976 9911 2233"
                 to "+976 9911", which formats as the wrong but valid-looking
                 "9769 9112". formatPhoneInput strips +976 and caps at 8 digits. */
              prefix="+976"
              placeholder="9911 2233"
              error={errors.phone?.message}
              {...phoneField}
              onChange={(event) => {
                event.target.value = formatPhoneInput(event.target.value);
                void phoneField.onChange(event);
              }}
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
            className="mt-8"
          >
            Бүртгүүлэх
          </ActionButton>

          {isSubmitting && slow ? (
            <p className="mt-4 text-center text-[0.8125rem] leading-relaxed text-slate">
              Түр хүлээнэ үү — 20 секунд хүртэл үргэлжилж магадгүй.
            </p>
          ) : null}
        </form>
      )}
    </>
  );
}
