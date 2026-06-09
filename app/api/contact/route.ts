import { getResendClient, isEmailConfigured } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
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

    await resend.emails.send({
      from: "Ellstorps Krog <no-reply@ellstorpskrog.se>",
      to: [process.env.CONTACT_TO_EMAIL!],
      replyTo: email,
      subject: "Ny besked fra kontaktformular",
      html: `
        <p><strong>Navn:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Besked:</strong></p>
        <p>${message.replace(/\n/g, "<br/>")}</p>
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
