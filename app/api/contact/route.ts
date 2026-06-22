import { getResendClient, isEmailConfigured } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape-html";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`contact:${ip}`, 5, 60_000);
    if (!limit.allowed) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
      });
    }

    if (!isEmailConfigured()) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 503 }
      );
    }

    const resend = getResendClient();
    if (!resend) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 503 }
      );
    }
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400 }
      );
    }

    const safeName = escapeHtml(String(name));
    const safeEmail = escapeHtml(String(email));
    const safeMessage = escapeHtml(String(message)).replace(/\n/g, "<br/>");

    await resend.emails.send({
      from: "Ellstorps Krog <no-reply@ellstorpskrog.se>",
      to: [process.env.CONTACT_TO_EMAIL!],
      replyTo: email,
      subject: "Ny besked fra kontaktformular",
      html: `
        <p><strong>Navn:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Besked:</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500 }
    );
  }
}
