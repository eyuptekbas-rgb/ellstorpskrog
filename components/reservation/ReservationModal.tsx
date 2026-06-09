"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from "lucide-react";
import { libre } from "@/app/(site)/fonts";
import {
  RESERVATION_GUEST_CARD_OPTIONS,
  RESERVATION_STEPS,
  ReservationStep,
  formatCompactDate,
  formatGuestSummary,
  formatReservationHoursForDate,
  formatReservationSummaryDate,
  getReservationDateOptions,
  getReservationTimeSlots,
  guestCardToCount,
  isGuestCardSelected,
  isTimeSlotAvailable,
  isValidGuestCount,
  toLocalDateString,
} from "@/lib/reservations/booking-ui";

type Props = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#b85c38]/45 focus:bg-white/[0.06]";

const stepStackClass = "space-y-2.5";

function BookingSummaryCompact({
  date,
  time,
  guestCount,
}: {
  date: string;
  time: string;
  guestCount: number;
}) {
  return (
    <div className="reservation-summary reservation-summary--compact rounded-xl border border-[#b85c38]/20 bg-[#b85c38]/[0.06]">
      <div className="reservation-summary__grid">
        <div className="reservation-summary__item">
          <span className="reservation-summary__label">Datum</span>
          <span className="reservation-summary__value">
            {date ? formatCompactDate(date) : "—"}
          </span>
        </div>
        <div className="reservation-summary__item">
          <span className="reservation-summary__label">Tid</span>
          <span className="reservation-summary__value">{time || "—"}</span>
        </div>
        <div className="reservation-summary__item">
          <span className="reservation-summary__label">Gäster</span>
          <span className="reservation-summary__value">
            {guestCount > 0 ? formatGuestSummary(guestCount) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function GuestCardGrid({
  guestCount,
  onSelect,
}: {
  guestCount: number;
  onSelect: (count: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {RESERVATION_GUEST_CARD_OPTIONS.map((option) => {
        const selected = isGuestCardSelected(option, guestCount);
        return (
          <button
            key={String(option)}
            type="button"
            onClick={() => onSelect(guestCardToCount(option))}
            className={`reservation-guest-card ${selected ? "reservation-guest-card--selected" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function BookingSummary({
  date,
  time,
  guestCount,
  name,
  phone,
  email,
  showContact = false,
}: {
  date: string;
  time: string;
  guestCount: number;
  name?: string;
  phone?: string;
  email?: string;
  showContact?: boolean;
}) {
  return (
    <div className="reservation-summary rounded-xl border border-[#b85c38]/20 bg-[#b85c38]/[0.06] p-3 backdrop-blur-sm">
      <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[#d4a574]">
        Din bokning
      </p>
      <ul className="space-y-1.5 text-sm text-white/75">
        <li className="flex items-start gap-2.5">
          <span aria-hidden>📅</span>
          <span>
            <span className="text-white/40">Datum · </span>
            {formatReservationSummaryDate(date)}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span aria-hidden>🕒</span>
          <span>
            <span className="text-white/40">Tid · </span>
            {time || "—"}
          </span>
        </li>
        <li className="flex items-start gap-2.5">
          <span aria-hidden>👥</span>
          <span>
            <span className="text-white/40">Gäster · </span>
            {guestCount > 0 ? formatGuestSummary(guestCount) : "—"}
          </span>
        </li>
        {showContact && (
          <>
            <li className="flex items-start gap-2.5 border-t border-white/[0.06] pt-2">
              <span aria-hidden>👤</span>
              <span>
                <span className="text-white/40">Namn · </span>
                {name || "—"}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden>📞</span>
              <span>
                <span className="text-white/40">Telefon · </span>
                {phone || "—"}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span aria-hidden>✉️</span>
              <span>
                <span className="text-white/40">E-post · </span>
                {email || "—"}
              </span>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}

export default function ReservationModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const customDateRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ReservationStep>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guestCount, setGuestCount] = useState(2);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const minDate = toLocalDateString(new Date());
  const dateOptions = useMemo(() => getReservationDateOptions(8), [open]);
  const timeSlots = useMemo(
    () => (date ? getReservationTimeSlots(date) : []),
    [date]
  );

  const canProceed = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(date);
      case 2:
        return Boolean(time);
      case 3:
        return isValidGuestCount(guestCount);
      case 4:
        return Boolean(name.trim() && phone.trim() && email.trim());
      case 5:
        return true;
      default:
        return false;
    }
  }, [step, date, time, guestCount, name, phone, email]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetAndClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setError("");
      setSuccess(false);
      setStep(1);
    }
  }, [open]);

  useEffect(() => {
    if (time && date && !isTimeSlotAvailable(date, time)) {
      setTime("");
    }
  }, [date, time, timeSlots]);

  function resetAndClose() {
    setName("");
    setPhone("");
    setEmail("");
    setDate("");
    setTime("");
    setGuestCount(2);
    setComment("");
    setError("");
    setSuccess(false);
    setStep(1);
    onClose();
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          date,
          time,
          guestCount,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Kunde inte skicka bokningen.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setLoading(false);
    }
  }

  function handlePrimaryAction() {
    if (success) return;
    if (step < 5) {
      if (canProceed) setStep((step + 1) as ReservationStep);
      return;
    }
    void handleSubmit();
  }

  function handleBack() {
    if (step > 1) setStep((step - 1) as ReservationStep);
  }

  function advanceStep() {
    setStep((current) => Math.min(current + 1, 5) as ReservationStep);
  }

  const stepTitle = RESERVATION_STEPS[step - 1]?.label ?? "";
  const isCustomDate =
    Boolean(date) && !dateOptions.some((option) => option.value === date);

  function openCustomDatePicker() {
    const input = customDateRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  }

  const mobileStepContext = step > 1 && step < 4 && (
    <div className="reservation-step-context mb-2.5">
      {date && (
        <span className="reservation-step-pill">
          <CalendarDays size={13} />
          {formatCompactDate(date)}
        </span>
      )}
      {step > 2 && time && <span className="reservation-step-pill">🕒 {time}</span>}
      {step > 3 && isValidGuestCount(guestCount) && (
        <span className="reservation-step-pill">
          <Users size={13} />
          {formatGuestSummary(guestCount)}
        </span>
      )}
    </div>
  );

  const mobileDateStep = (
    <div className={stepStackClass}>
      <div className="grid grid-cols-2 gap-2">
        {dateOptions.map((option) => {
          const selected = date === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setDate(option.value);
                advanceStep();
              }}
              className={`reservation-date-card reservation-date-card--featured ${selected ? "reservation-date-card--selected" : ""}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {option.primaryLabel}
                </p>
                <p className="truncate text-[0.6875rem] capitalize text-white/45">
                  {option.secondaryLabel}
                </p>
              </div>
              {option.badge === "today" && (
                <span className="shrink-0 rounded-full bg-[#b85c38]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#e8c4a8]">
                  Idag
                </span>
              )}
              {option.badge === "tomorrow" && (
                <span className="shrink-0 rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/50">
                  Imorgon
                </span>
              )}
              {selected && !option.badge && (
                <Check size={13} className="shrink-0 text-[#e8c4a8]" />
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={customDateRef}
        type="date"
        min={minDate}
        value={isCustomDate ? date : ""}
        onChange={(e) => {
          if (e.target.value) {
            setDate(e.target.value);
            advanceStep();
          }
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        onClick={openCustomDatePicker}
        className={`reservation-date-card reservation-date-card--custom w-full ${isCustomDate ? "reservation-date-card--selected" : ""}`}
      >
        {isCustomDate ? (
          <span className="flex w-full items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">
              {formatCompactDate(date)}
            </span>
            <Check size={13} className="shrink-0 text-[#e8c4a8]" />
          </span>
        ) : (
          "Välj eget datum"
        )}
      </button>
    </div>
  );

  const mobileTimeStep = (
    <div className={stepStackClass}>
      {mobileStepContext}
      <p className="text-xs leading-snug text-white/50">
        {date ? formatReservationHoursForDate(date) : "13:00–stängning"} · var
        30:e minut
      </p>
      <div className="grid max-h-[min(42vh,14rem)] grid-cols-3 gap-2 overflow-y-auto pr-0.5">
        {timeSlots.map((slot) => {
          const available = isTimeSlotAvailable(date, slot);
          const selected = time === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={!available}
              onClick={() => {
                setTime(slot);
                advanceStep();
              }}
              className={`reservation-chip ${selected ? "reservation-chip--selected" : ""} ${!available ? "reservation-chip--disabled" : ""}`}
            >
              {slot}
            </button>
          );
        })}
      </div>
      {timeSlots.length > 0 &&
        !timeSlots.some((slot) => isTimeSlotAvailable(date, slot)) && (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            Inga tider kvar idag. Välj ett annat datum.
          </p>
        )}
    </div>
  );

  const mobileGuestStep = (
    <div className={stepStackClass}>
      {mobileStepContext}
      <GuestCardGrid
        guestCount={guestCount}
        onSelect={(count) => {
          setGuestCount(count);
          advanceStep();
        }}
      />
    </div>
  );

  const mobileContactStep = (
    <div className={stepStackClass}>
      <BookingSummaryCompact date={date} time={time} guestCount={guestCount} />
      <div className="space-y-2">
        <div>
          <label
            htmlFor="res-name-mobile"
            className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
          >
            Namn
          </label>
          <input
            id="res-name-mobile"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="För- och efternamn"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="res-phone-mobile"
            className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
          >
            Telefon
          </label>
          <input
            id="res-phone-mobile"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07X XXX XX XX"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="res-email-mobile"
            className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
          >
            E-post
          </label>
          <input
            id="res-email-mobile"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="namn@exempel.se"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="res-comment-mobile"
            className="mb-1 block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-white/40"
          >
            Kommentar (valfritt)
          </label>
          <textarea
            id="res-comment-mobile"
            rows={1}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Allergier, barnstol…"
            className={`${inputClass} min-h-[2.25rem] resize-none`}
          />
        </div>
      </div>
    </div>
  );

  const mobileConfirmStep = (
    <div className={stepStackClass}>
      <BookingSummary
        date={date}
        time={time}
        guestCount={guestCount}
        name={name}
        phone={phone}
        email={email}
        showContact
      />
      {comment.trim() && (
        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/50">
          {comment}
        </p>
      )}
    </div>
  );

  const dateField = (idSuffix = "") => (
    <div>
      <label
        htmlFor={`res-date${idSuffix}`}
        className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
      >
        Datum
      </label>
      <input
        id={`res-date${idSuffix}`}
        type="date"
        required
        min={minDate}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className={inputClass}
      />
    </div>
  );

  const timeField = (
    <div>
      <p className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]">
        Tid
      </p>
      {date && (
        <p className="mb-3 text-xs text-white/45">
          {formatReservationHoursForDate(date)} · var 30:e minut
        </p>
      )}
      <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {timeSlots.map((slot) => {
          const available = isTimeSlotAvailable(date, slot);
          const selected = time === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={!available}
              onClick={() => setTime(slot)}
              className={`reservation-chip ${selected ? "reservation-chip--selected" : ""} ${!available ? "reservation-chip--disabled" : ""}`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );

  const guestField = (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]">
        <Users size={12} />
        Antal gäster
      </p>
      <GuestCardGrid guestCount={guestCount} onSelect={setGuestCount} />
    </div>
  );

  const contactFields = (idSuffix = "") => (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`res-name${idSuffix}`}
          className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
        >
          Namn
        </label>
        <input
          id={`res-name${idSuffix}`}
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`res-phone${idSuffix}`}
            className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
          >
            Telefon
          </label>
          <input
            id={`res-phone${idSuffix}`}
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor={`res-email${idSuffix}`}
            className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
          >
            E-post
          </label>
          <input
            id={`res-email${idSuffix}`}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor={`res-comment${idSuffix}`}
          className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#d4a574]"
        >
          Kommentar
        </label>
        <textarea
          id={`res-comment${idSuffix}`}
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Allergier, barnstol, särskilda önskemål…"
          className={`${inputClass} resize-none`}
        />
      </div>
    </div>
  );

  const mobileStepContent = (
    <div key={step} className="reservation-step-enter">
      {step === 1 && mobileDateStep}
      {step === 2 && mobileTimeStep}
      {step === 3 && mobileGuestStep}
      {step === 4 && mobileContactStep}
      {step === 5 && mobileConfirmStep}
    </div>
  );

  if (!open) return null;

  return (
    <div
      className="reservation-modal-backdrop fixed inset-0 z-[100] flex items-end justify-center p-0 lg:items-center lg:p-5"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) resetAndClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-modal-title"
        className="reservation-modal-panel reservation-modal-panel--flow relative flex w-full max-w-lg flex-col overflow-hidden rounded-t-[1.25rem] border border-white/[0.1] bg-[#0f0f0f]/92 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(184,92,56,0.08)] backdrop-blur-2xl lg:max-h-[min(92dvh,720px)] lg:rounded-[1.75rem]"
      >
        <div
          className="pointer-events-none absolute inset-x-8 top-0 hidden h-px bg-gradient-to-r from-transparent via-[#b85c38]/70 to-transparent lg:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#b85c38]/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-2.5 lg:border-0 lg:px-7 lg:pt-7 lg:pb-0">
          {!success && step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-[#b85c38]/35 hover:text-white lg:hidden"
              aria-label="Tillbaka"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {(!success && step === 1) || success ? (
            <span className="w-9 lg:hidden" />
          ) : null}

          <div className="min-w-0 flex-1 text-center lg:text-left lg:pr-10">
            {success ? (
              <h2
                id="reservation-modal-title"
                className={`${libre.className} text-xl text-white lg:text-[1.75rem]`}
              >
                Bokning mottagen
              </h2>
            ) : (
              <>
                <p className="section-label mb-1 hidden lg:block">Boka bord</p>
                <h2
                  id="reservation-modal-title"
                  className={`${libre.className} text-xl leading-tight text-white lg:text-[1.75rem]`}
                >
                  <span className="lg:hidden">{stepTitle}</span>
                  <span className="hidden lg:inline">Reservera ditt bord</span>
                </h2>
                <p className="mt-1 hidden text-sm text-white/50 lg:block">
                  Välj datum och tid — vi förbereder en kväll värdig Ellstorps
                  Krog.
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-[#b85c38]/35 hover:text-white"
            aria-label="Stäng"
          >
            <X size={18} />
          </button>
        </div>

        {!success && (
          <div className="shrink-0 px-4 pt-2 lg:hidden">
            <div className="mb-2 flex gap-1">
              {RESERVATION_STEPS.map(({ id, label }) => (
                <div
                  key={id}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    id <= step ? "bg-[#b85c38]" : "bg-white/10"
                  }`}
                  aria-hidden
                />
              ))}
            </div>
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Steg {step} av {RESERVATION_STEPS.length} · {stepTitle}
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2.5 lg:px-7 lg:py-5">
          {success ? (
            <div className="reservation-success py-4 text-center lg:py-6">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#b85c38]/15 text-[#e8c4a8] ring-1 ring-[#b85c38]/30 shadow-[0_0_24px_rgba(184,92,56,0.25)]">
                <Check size={32} strokeWidth={2} />
              </span>
              <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/55">
                Tack för din reservation.
                <br />
                Vi återkommer så snart som möjligt.
              </p>
              <div className="mt-6">
                <BookingSummary
                  date={date}
                  time={time}
                  guestCount={guestCount}
                />
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {/* Mobile step flow */}
              <div className="lg:hidden">{mobileStepContent}</div>

              {/* Desktop — approved single-form layout */}
              <form
                className="hidden space-y-4 lg:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit();
                }}
              >
                <BookingSummary
                  date={date}
                  time={time}
                  guestCount={guestCount}
                />
                {dateField("-desktop")}
                {timeField}
                {guestField}
                {contactFields("-desktop")}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="btn-secondary !px-4 !py-3.5 text-sm"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !date || !time || !isValidGuestCount(guestCount)}
                    className="btn-primary flex items-center justify-center gap-2 !px-4 !py-3.5 text-sm disabled:opacity-60"
                  >
                    <CalendarDays size={16} />
                    {loading ? "Skickar…" : "Boka bord"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Mobile fixed footer */}
        {!success && (
          <div className="reservation-modal-footer shrink-0 border-t border-white/[0.08] bg-[#0f0f0f]/95 p-3 backdrop-blur-xl lg:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="btn-secondary !px-3 !py-2.5 text-sm"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={!canProceed || loading}
                onClick={handlePrimaryAction}
                className="btn-primary flex items-center justify-center gap-2 !px-3 !py-2.5 text-sm disabled:opacity-50"
              >
                {step === 5 ? (
                  loading ? (
                    "Skickar…"
                  ) : (
                    <>
                      <CalendarDays size={16} />
                      Boka bord
                    </>
                  )
                ) : (
                  <>
                    Nästa
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="shrink-0 border-t border-white/[0.08] p-4 lg:border-0 lg:px-7 lg:pb-8">
            <button
              type="button"
              onClick={resetAndClose}
              className="btn-primary w-full !py-3.5 text-sm"
            >
              Stäng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
