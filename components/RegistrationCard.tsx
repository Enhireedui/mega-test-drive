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
import { SuccessModal } from "@/components/SuccessModal";
import { eventConfig, eventDateRangeLabel, slotKey, slotRangeLabel } from "@/lib/config";
import { DURATION, EASE_ENTER } from "@/lib/motion";
import { formatPhoneInput, messageForErrorCode, registrationSchema } from "@/lib/validation";
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

/**
 * The form, behind one button.
 *
 * The page opens as a single call to action and the fields unfold in place when
 * it is tapped, so a phone visitor is asked for nothing until they have said
 * they want to register. Once open it is only name, phone, a time and one send
 * button — no numbered steps, no headings inside the card.
 *
 * The day sits as a quiet micro-label above the time cards: nobody should pick
 * an hour without knowing which day they are picking it for, and it is the only
 * place that line appears now.
 */
export function RegistrationCard({ availability }: RegistrationCardProps) {
  const timeLabelId = `${useId()}-time`;

  const [open, setOpen] = useState(false);
  /** Seats claimed in this browser session, applied on top of the server snapshot. */
  const [claimedSeats, setClaimedSeats] = useState<Record<string, number>>({});
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const submitLock = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);

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

  /** Open, then bring the card into view without stealing focus — a forced
   *  focus here would throw up the keyboard before anyone had looked. */
  const handleOpen = () => {
    setOpen(true);
    window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  };

  const onSubmit = async (values: RegistrationFormValues) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmissionError(null);

    const key = slotKey(values.visitDate, values.visitTime);

    try {
      const result = await registerAttendee(values);

      if (result.status === "success") {
        setClaimedSeats((previous) => ({ ...previous, [key]: (previous[key] ?? 0) + 1 }));
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
    <section ref={sectionRef} id="register" aria-label="Бүртгэл" className="w-full scroll-mt-8">
      {open ? null : (
        <div className="mx-auto w-full max-w-[22rem]">
          <Button size="lg" fullWidth onClick={handleOpen} aria-expanded={false}>
            Бүртгүүлэх
          </Button>
        </div>
      )}

      {open ? (
        /*
         * Opacity and a small lift only — never an animated height.
         * `height: 0 → auto` is a layout animation, and framer skips layout
         * animations for anyone who asks for reduced motion: the wrapper would
         * stay at zero height with its content clipped, leaving the form
         * present in the DOM but impossible to see or tap.
         */
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.compose, ease: EASE_ENTER }}
        >
          <div className="glass relative overflow-hidden rounded-[1.75rem] border border-white/[0.09] edge-lit">
            <form
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="px-5 pb-7 pt-7 sm:px-9 sm:pb-9 sm:pt-9"
            >
              {/* Bot trap. Off-screen, never announced, never tabbable. */}
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] top-0 size-0 overflow-hidden"
              >
                <input type="text" tabIndex={-1} autoComplete="off" {...register("honeypot")} />
              </div>

              {/* Fields lock while the action is in flight, so nothing can be
                  edited between validation and the write. */}
              <fieldset
                disabled={isSubmitting}
                className="min-w-0 border-0 p-0 transition-opacity duration-300 ease-enter disabled:opacity-60"
              >
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

                <p
                  id={timeLabelId}
                  className="mb-3 mt-4 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-white/55"
                >
                  Цаг сонгох
                  <span aria-hidden="true" className="mx-1.5 text-white/25">
                    ·
                  </span>
                  <span className="tabular-nums text-white/40">
                    {eventDateRangeLabel()} {eventConfig.dates[0]?.weekday ?? ""}
                  </span>
                </p>

                <ChoiceGroup
                  labelledBy={timeLabelId}
                  value={visitTime}
                  choices={timeChoices}
                  onChange={handleTimeChange}
                  error={errors.visitTime?.message}
                />
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
                    className="mt-4 flex items-start gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] px-4 py-3.5"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      strokeWidth={1.5}
                      className="mt-px size-[1.0625rem] shrink-0 text-brand-hi"
                    />
                    <p className="text-[0.8125rem] leading-relaxed text-white/75">
                      {submissionError}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
                loadingLabel="Илгээж байна"
                className="mt-5 sm:mt-6"
              >
                Илгээх
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
        </motion.div>
      ) : null}

      <SuccessModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}
