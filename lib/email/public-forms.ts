// Server-side only: imported by public form API routes, never by UI components.
import { escapeHtml } from "@/lib/email/escape-html";
import { getFromAddress, getResendClient } from "@/lib/email/resend";
import type { CreateReservationInput } from "@/lib/reservations";

const recipients = {
  contact: { env: "CONTACT_TO_EMAIL", address: "info@ellstorpskrog.se" },
  reservation: { env: "RESERVATION_TO_EMAIL", address: "reservation@ellstorpskrog.se" },
} as const;

export class PublicFormEmailConfigError extends Error {}

export function getPublicFormEmailConfig(kind: keyof typeof recipients) {
  const expected = recipients[kind];
  const configured = process.env[expected.env]?.trim().toLowerCase();
  // Fail closed on a swapped/mistyped inbox; never fall back to the other form.
  if (configured && configured !== expected.address) {
    throw new PublicFormEmailConfigError(`${expected.env} must be ${expected.address}`);
  }
  const resend = getResendClient();
  if (!resend) throw new PublicFormEmailConfigError("Email service not configured");
  return { resend, to: expected.address, from: getFromAddress("Ellstorps Krog") };
}

export type ContactEmailInput = { name: string; email: string; message: string };
export type ReservationEmailInput = Omit<CreateReservationInput, "comment" | "tableId"> & { comment?: string | null; tableId?: string | null };

export async function sendContactEmail(input: ContactEmailInput) {
  const { resend, to, from } = getPublicFormEmailConfig("contact");
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.email,
    subject: "Nytt meddelande från kontaktformuläret",
    html: `<p><strong>Namn:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>E-post:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Meddelande:</strong></p>
      <p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p>`,
  });
  if (error) throw new Error("Contact email delivery failed");
}

export async function sendReservationEmail(input: ReservationEmailInput, reservationId: string) {
  const { resend, to, from } = getPublicFormEmailConfig("reservation");
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: input.email,
    subject: `Ny bordsbokning – ${input.date} ${input.time}`,
    html: `<p><strong>Bokningsnummer:</strong> ${escapeHtml(reservationId)}</p>
      <p><strong>Namn:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>E-post:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(input.phone)}</p>
      <p><strong>Datum:</strong> ${escapeHtml(input.date)}</p>
      <p><strong>Tid:</strong> ${escapeHtml(input.time)}</p>
      <p><strong>Antal gäster:</strong> ${input.guestCount}</p>
      <p><strong>Meddelande:</strong> ${escapeHtml(input.comment || "—").replace(/\n/g, "<br/>")}</p>`,
  }, { idempotencyKey: `reservation/${reservationId}` });
  if (error) throw new Error("Reservation email delivery failed");
}
