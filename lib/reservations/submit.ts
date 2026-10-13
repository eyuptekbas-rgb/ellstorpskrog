import { getPublicFormEmailConfig, sendReservationEmail, type ReservationEmailInput } from "@/lib/email/public-forms";

export async function saveAndNotifyReservation<T extends { id: string }>(
  input: ReservationEmailInput,
  save: () => Promise<T>,
) {
  // Reject unavailable/misrouted email configuration before creating a booking.
  getPublicFormEmailConfig("reservation");
  const reservation = await save();
  try {
    await sendReservationEmail(input, reservation.id);
    return { ...reservation, emailNotificationSent: true };
  } catch {
    // The booking exists. Preserve its success response so customers do not retry
    // and create duplicate bookings. Staff can find it by ID in existing records.
    console.error("Reservation email delivery failed", { reservationId: reservation.id });
    return { ...reservation, emailNotificationSent: false };
  }
}
