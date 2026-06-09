"use client";

import { CalendarDays } from "lucide-react";
import { useReservationOptional } from "@/components/ReservationProvider";

export default function FooterReservationButton() {
  const reservation = useReservationOptional();

  if (!reservation) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={reservation.openReservation}
      className="btn-secondary justify-center sm:justify-start"
    >
      <CalendarDays size={16} />
      Boka bord
    </button>
  );
}
