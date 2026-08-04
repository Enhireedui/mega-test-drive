"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";

import { registerAttendee } from "@/actions/register";
import { SuccessDialog } from "@/components/registration/SuccessDialog";
import { ActionButton } from "@/components/ui/ActionButton";
import { OptionGroup, type Option } from "@/components/ui/OptionGroup";
import { TextField } from "@/components/ui/TextField";
import { eventConfig, findEventDate, isSlotClosed, slotRangeLabel } from "@/lib/config";
import { DURATION, EASE_ENTER } from "@/lib/motion";
import { formatPhoneInput, messageForErrorCode, registrationSchema } from "@/lib/validation";
import type { RegistrationFormValues } from "@/types/registration";

interface RegistrationFormProps {
  /** Focused when the form unfolds, so the keyboard opens on the first field. */
  autoFocus?: boolean;
}

const EMPTY_FORM: RegistrationFormValues = {
  fullName: "",
  phone: "",
  visitDate: "",
  visitTime: "",
  honeypot: "",
};

/** Shown on a window the organiser has closed. Nothing is ever *full*. */
const CLOSED_NOTE = "Хаагдсан";

/*
 * Both option groups are built once, here, at module scope.
 *
 * No window has a registration ceiling, so there is nothing to count and nothing
 * to fetch: whether a plate can be tapped depends only on `closedSlots`, which is
 * fixed in lib/config.ts. That makes the options constant for the lifetime of the
 * bundle — recomputing them per render, from a server snapshot that no longer
 * exists, would be work in service of an answer that cannot change.
 */
const TIME_OPTIONS: Record<string, Option[]> = Object.fromEntries(
  eventConfig.dates.map((date) => [
    date.id,
    eventConfig.timeSlots.map((slot) => {
      const closed = isSlotClosed(date.id, slot.id);
      return {
        value: slot.id,
        label: slotRangeLabel(slot.id),
        /* An open window says nothing extra; only a closed one has news. */
        ...(closed ? { note: CLOSED_NOTE } : {}),
        disabled: closed,
      };
    }),
  ]),
);

/**
 * A day is offered unless every one of its windows has been closed by hand. Such
 * a day is shown struck through rather than removed — removing it would leave
 * someone wondering whether they had misread the poster.
 */
const DAY_OPTIONS: Option[] = eventConfig.dates.map((date) => {
  const open = (TIME_OPTIONS[date.id] ?? []).some((option) => !option.disabled);

  return {
    value: date.id,
    label: date.label,
    ...(open ? { detail: `${date.weekday} гараг` } : { note: CLOSED_NOTE }),
    disabled: !open,
  };
});

/**
 * Name, number, day, time, send.
 *
 * Four questions and no steps. Unlike edition 5 there are two event days, so the
 * day is asked for rather than assumed — and choosing a day clears the time,
 * because the same clock time on Saturday and on Sunday are different windows,
 * and carrying a selection across would submit a day nobody chose it for.
 *
 * Nothing here is rationed. Every window takes everyone who signs up, so no plate
 * ever reads "дүүрсэн" and the form never needs to know what the sheet holds.
 */
export function RegistrationForm({ autoFocus = false }: RegistrationFormProps) {
  const rawId = useId();
  const dayLabelId = `${rawId}-day`;
  const timeLabelId = `${rawId}-time`;

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const submitLock = useRef(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  /*
   * `useWatch`, not the `watch()` returned by `useForm`. `watch()` hands back a
   * fresh function on every render, which React Compiler cannot memoize safely,
   * so it bails out of optimising this whole component. `useWatch` subscribes to
   * these two fields alone and re-renders only when one of them changes.
   */
  const visitDate = useWatch({ control, name: "visitDate" });
  const visitTime = useWatch({ control, name: "visitTime" });

  /**
   * Registered in visual order: React Hook Form focuses the first *registered*
   * field carrying an error, so registering the phone first would send focus past
   * the name field on a failed submit.
   */
  const nameField = register("fullName");
  const phoneField = register("phone");

  /* Focus the first field once, when the form has unfolded. */
  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 420);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  const timeOptions = visitDate ? (TIME_OPTIONS[visitDate] ?? []) : [];

  /* If closures have left only one day standing, preselect it rather than
     presenting a decision that has already been made. */
  useEffect(() => {
    if (visitDate) return;
    const open = DAY_OPTIONS.filter((option) => !option.disabled);
    if (open.length === 1 && open[0]) {
      setValue("visitDate", open[0].value, { shouldValidate: false });
    }
  }, [visitDate, setValue]);

  const handleDayChange = (nextDate: string) => {
    if (nextDate === visitDate) return;
    setValue("visitDate", nextDate, { shouldValidate: true, shouldDirty: true });
    /* Times belong to a day. Never carry one across. */
    setValue("visitTime", "", { shouldValidate: false });
    setSubmissionError(null);
  };

  const handleTimeChange = (nextTime: string) => {
    setValue("visitTime", nextTime, { shouldValidate: true, shouldDirty: true });
    setSubmissionError(null);
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmissionError(null);

    const date = findEventDate(values.visitDate);

    try {
      const result = await registerAttendee(values);

      if (result.status === "success") {
        setConfirmed(
          `${date?.label ?? values.visitDate} · ${date?.weekday ?? ""} гараг · ` +
            `${slotRangeLabel(values.visitTime)}`,
        );
        reset(EMPTY_FORM);
        return;
      }

      const message = messageForErrorCode(result.code);
      /* The only way this arrives is a window closed by hand after the page was
         built. Clear the choice so the next tap is a fresh one. */
      if (result.code === "SLOT_UNAVAILABLE") {
        setValue("visitTime", "", { shouldValidate: false });
      }
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

  return (
    <>
      <form
        noValidate
        /*
         * `handleSubmit(onSubmit)` is built here, inside the event handler,
         * rather than during render. `onSubmit` reads `submitLock` — and a
         * function that touches a ref must not be handed to something that
         * could, as far as the compiler can tell, call it while rendering.
         * Deferring construction to the event makes the ordering explicit.
         */
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        className="text-left"
      >
        {/* Bot trap. Off-screen, never announced, never tabbable. */}
        <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-0 overflow-hidden">
          <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
        </div>

        {/* Fields lock while the action is in flight, so nothing can be edited
            between validation and the write. */}
        <fieldset
          disabled={isSubmitting}
          className="min-w-0 border-0 p-0 transition-opacity duration-300 ease-enter disabled:opacity-55"
        >
          {/* 48px between the two columns, 8px between stacked rows — every gap in
              this form is a multiple of 8. */}
          <div className="grid gap-x-12 gap-y-2 sm:grid-cols-2">
            <TextField
              label="Нэр"
              autoComplete="name"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="next"
              /* No placeholder. The label already reads "Нэр", and "Овог нэр"
                 under it was the same instruction written twice. The phone field
                 keeps its placeholder because a format hint is not a repeat. */
              error={errors.fullName?.message}
              {...nameField}
              ref={(node) => {
                nameField.ref(node);
                nameRef.current = node;
              }}
            />
            <TextField
              label="Утасны дугаар"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              enterKeyHint="done"
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
          </div>

          <p id={dayLabelId} className="eyebrow mb-4 mt-12 text-white/55 sm:mt-14">
            Ирэх өдөр
          </p>
          <OptionGroup
            labelledBy={dayLabelId}
            value={visitDate}
            options={DAY_OPTIONS}
            onChange={handleDayChange}
            error={errors.visitDate?.message}
            columns={2}
          />

          <p id={timeLabelId} className="eyebrow mb-4 mt-10 text-white/55">
            Ирэх цаг
          </p>
          {visitDate ? (
            <OptionGroup
              labelledBy={timeLabelId}
              value={visitTime}
              options={timeOptions}
              onChange={handleTimeChange}
              error={errors.visitTime?.message}
              columns={3}
            />
          ) : (
            /* Same height as the plates it will be replaced by, so choosing a day
               does not make the page jump under the finger that chose it. */
            <p className="flex min-h-20 items-center text-[0.9375rem] text-white/60">
              Эхлээд ирэх өдрөө сонгоно уу.
            </p>
          )}
        </fieldset>

        <AnimatePresence initial={false}>
          {submissionError ? (
            <motion.div
              key={submissionError}
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.state, ease: EASE_ENTER }}
              className="mt-8 rounded-xl border-l-2 border-accent-bright bg-white/[0.035] px-5 py-4"
            >
              <p className="text-[0.875rem] leading-relaxed text-white/80">{submissionError}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <ActionButton
          type="submit"
          size="lg"
          fullWidth
          loading={isSubmitting}
          loadingLabel="Илгээж байна"
          className="mt-12"
        >
          Бүртгүүлэх
        </ActionButton>

        {/*
         * Progress is visible on the button; this makes it audible too.
         *
         * The two sentences of small print that used to sit under this button are
         * gone: "one registration per phone number" and "we use your number to
         * confirm". Both were true, and neither was worth the weight — the
         * one-per-number rule is stated by the error you get if you break it, and
         * nobody reads a disclaimer before they have decided to submit.
         */}
        <p aria-live="polite" className="sr-only">
          {isSubmitting ? "Бүртгэлийг илгээж байна" : ""}
        </p>
      </form>

      <SuccessDialog
        open={confirmed !== null}
        onClose={() => setConfirmed(null)}
        summary={confirmed ?? ""}
      />
    </>
  );
}
