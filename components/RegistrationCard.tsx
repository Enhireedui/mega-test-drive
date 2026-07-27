"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Phone, User } from "lucide-react";

import { registerAttendee } from "@/actions/register";
import { Button } from "@/components/Button";
import { ChoiceGroup, type Choice } from "@/components/ChoiceGroup";
import { Input } from "@/components/Input";
import { SuccessModal, type RegistrationSummary } from "@/components/SuccessModal";
import { eventConfig, findEventDate, slotKey, slotRangeLabel } from "@/lib/config";
import { DURATION, EASE_ENTER } from "@/lib/motion";
import {
  formatPhoneInput,
  messageForErrorCode,
  normalizeFullName,
  registrationSchema,
} from "@/lib/validation";
import type { RegistrationFormValues, SlotAvailability } from "@/types/registration";

interface RegistrationCardProps {
  availability: readonly SlotAvailability[];
}

/**
 * The event runs on one day, so `visitDate` is taken from the config rather
 * than asked for — it is still validated and still written to the sheet.
 */
const EVENT_DATE_ID = eventConfig.dates[0]?.id ?? "";

const EMPTY_FORM: RegistrationFormValues = {
  fullName: "",
  phone: "",
  visitDate: EVENT_DATE_ID,
  visitTime: "",
  honeypot: "",
};

interface StepProps {
  index: number;
  title: string;
  /** Optional one-line clarification under the title. */
  hint?: string;
  /** Lets a nested radiogroup borrow this heading as its accessible name. */
  titleId?: string;
  children: React.ReactNode;
}

/** Numbered step: a red index, a title, an optional hint, then the controls. */
function Step({ index, title, hint, titleId, children }: StepProps) {
  return (
    <div>
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className="mt-px grid size-7 shrink-0 place-items-center rounded-full bg-brand text-[0.75rem] font-semibold text-white shadow-[0_8px_22px_-8px_rgb(226_10_23_/_0.9)]"
        >
          {index}
        </span>
        <div className="min-w-0">
          <h2
            id={titleId}
            className="font-display text-[1.0625rem] font-semibold leading-tight tracking-tight text-white"
          >
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-[0.8125rem] leading-snug text-white/55">{hint}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export function RegistrationCard({ availability }: RegistrationCardProps) {
  const timeStepId = `${useId()}-time`;

  /** Seats claimed in this browser session, applied on top of the server snapshot. */
  const [claimedSeats, setClaimedSeats] = useState<Record<string, number>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<RegistrationSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const submitLock = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
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

  const visitTime = watch("visitTime");

  /**
   * Registered in visual order: React Hook Form focuses the first *registered*
   * field that has an error, so registering the phone first would send focus
   * past the name field on a failed submit.
   */
  const nameField = register("fullName");
  const phoneField = register("phone");

  const timeChoices = useMemo<Choice[]>(
    () =>
      availability
        .filter((slot) => slot.date === EVENT_DATE_ID)
        .map((slot) => {
          const claimed = claimedSeats[slotKey(slot.date, slot.time)] ?? 0;
          const remaining = Math.max(0, slot.remaining - claimed);
          const closed = slot.status === "closed" || remaining <= 0;

          return {
            value: slot.time,
            label: slotRangeLabel(slot.time),
            /* Only a full slot says anything; an open one just reads as a time. */
            ...(closed ? { note: "Дүүрсэн" } : {}),
            disabled: closed,
          };
        }),
    [availability, claimedSeats],
  );

  const handleTimeChange = (nextTime: string) => {
    setValue("visitTime", nextTime, { shouldValidate: true, shouldDirty: true });
    setSubmissionError(null);
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmissionError(null);

    const key = slotKey(values.visitDate, values.visitTime);

    try {
      const result = await registerAttendee(values);

      if (result.status === "success") {
        const date = findEventDate(values.visitDate);
        setClaimedSeats((previous) => ({ ...previous, [key]: (previous[key] ?? 0) + 1 }));
        /* Read back exactly what was submitted, so the confirmation is checkable. */
        setConfirmation({
          name: normalizeFullName(values.fullName),
          phone: formatPhoneInput(values.phone),
          dateLabel: date?.label ?? values.visitDate,
          weekday: date?.weekday ?? "",
          timeLabel: slotRangeLabel(values.visitTime),
        });
        reset(EMPTY_FORM);
        setModalOpen(true);
        return;
      }

      const message = messageForErrorCode(result.code);
      if (result.code === "SLOT_UNAVAILABLE") {
        /* Reflect the closure immediately so the card greys out. */
        setClaimedSeats((previous) => ({ ...previous, [key]: eventConfig.maxPerSlot }));
        setValue("visitTime", "", { shouldValidate: false });
      }
      /*
       * Show the reason once. When it belongs to a field, it goes under that
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
       * when the browser actually reports one — otherwise a server-side fault
       * would be blamed on the visitor's internet.
       */
      const offline = typeof navigator !== "undefined" && navigator.onLine === false;
      setSubmissionError(messageForErrorCode(offline ? "NETWORK" : "UNKNOWN"));
    } finally {
      submitLock.current = false;
    }
  };

  return (
    <section id="register" aria-label="Бүртгэл" className="w-full scroll-mt-8">
      <div className="glass relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] edge-lit">
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="px-5 pb-7 pt-7 sm:px-9 sm:pb-9 sm:pt-9"
        >
          {/* Bot trap. Off-screen, never announced, never tabbable. */}
          <div aria-hidden="true" className="absolute -left-[9999px] top-0 size-0 overflow-hidden">
            <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
          </div>

          {/* Fields lock while the action is in flight, so nothing can be
              edited between validation and the write. */}
          <fieldset
            disabled={isSubmitting}
            className="min-w-0 border-0 p-0 transition-opacity duration-300 ease-enter disabled:opacity-60"
          >
            <Step index={1} title="Таны мэдээлэл" hint="Бүртгэлээ баталгаажуулахад холбогдоно">
              <div className="grid gap-1 sm:grid-cols-2 sm:gap-x-4">
                <Input
                  label="Нэр"
                  autoComplete="name"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="next"
                  icon={User}
                  error={errors.fullName?.message}
                  {...nameField}
                />
                <Input
                  label="Утасны дугаар"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  enterKeyHint="done"
                  maxLength={9}
                  prefix="+976"
                  icon={Phone}
                  error={errors.phone?.message}
                  {...phoneField}
                  onChange={(event) => {
                    event.target.value = formatPhoneInput(event.target.value);
                    void phoneField.onChange(event);
                  }}
                />
              </div>
            </Step>

            <div aria-hidden="true" className="hairline-h my-7 h-px sm:my-8" />

            <Step index={2} title="Бүртгүүлэх цаг" titleId={timeStepId}>
              <ChoiceGroup
                labelledBy={timeStepId}
                value={visitTime}
                choices={timeChoices}
                onChange={handleTimeChange}
                error={errors.visitTime?.message}
              />
            </Step>
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
                className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] px-4 py-3.5"
              >
                <AlertCircle
                  aria-hidden="true"
                  strokeWidth={1.5}
                  className="mt-px size-[1.0625rem] shrink-0 text-brand-hi"
                />
                <p className="text-[0.8125rem] leading-relaxed text-white/75">{submissionError}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={isSubmitting}
            loadingLabel="Бүртгэж байна"
            className="mt-7 sm:mt-8"
          >
            Бүртгүүлэх
          </Button>

          {/* Progress is visible on the button; this makes it audible too. */}
          <p aria-live="polite" className="sr-only">
            {isSubmitting ? "Бүртгэлийг илгээж байна" : ""}
          </p>

          <p className="mt-4 text-center text-[0.6875rem] leading-relaxed text-white/50">
            Нэг утасны дугаараар зөвхөн нэг удаа бүртгүүлэх боломжтой. Таны дугаарыг бүртгэл
            баталгаажуулахад ашиглана.
          </p>
        </form>
      </div>

      <SuccessModal open={modalOpen} onClose={() => setModalOpen(false)} summary={confirmation} />
    </section>
  );
}
