"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReservation } from "@/components/ReservationProvider";

export default function ReservationRedirectPage() {
  const router = useRouter();
  const { openReservation } = useReservation();

  useEffect(() => {
    openReservation();
    router.replace("/");
  }, [openReservation, router]);

  return null;
}
