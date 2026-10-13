"use client";

import { createContext, useCallback, useContext, useState } from "react";
import ReservationModal from "@/components/reservation/ReservationModal";

type ReservationContextType = {
  openReservation: (tableId?: string | React.MouseEvent<HTMLButtonElement>) => void;
  selectedTableId: string | null;
  closeReservation: () => void;
  isReservationOpen: boolean;
};

const ReservationContext = createContext<ReservationContextType | null>(null);

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservation must be used inside ReservationProvider");
  }
  return context;
}

export function useReservationOptional() {
  return useContext(ReservationContext);
}

export default function ReservationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const openReservation = useCallback((tableId?: string | React.MouseEvent<HTMLButtonElement>) => { setSelectedTableId(typeof tableId === "string" ? tableId : null); setOpen(true); }, []);
  const closeReservation = useCallback(() => setOpen(false), []);

  return (
    <ReservationContext.Provider
      value={{
        openReservation,
        selectedTableId,
        closeReservation,
        isReservationOpen: open,
      }}
    >
      {children}
      <ReservationModal open={open} onClose={closeReservation} selectedTableId={selectedTableId} onTableChange={setSelectedTableId} />
    </ReservationContext.Provider>
  );
}
