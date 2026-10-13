import { PublicFormEmailConfigError, sendContactEmail } from "@/lib/email/public-forms";
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

    const body = await req.json();
    const { name, email, message } = body ?? {};

    if (![name, email, message].every(value => typeof value === "string" && value.trim())) {
      return new Response(
        JSON.stringify({ error: "Missing fields" }),
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }
    await sendContactEmail({ name: name.trim(), email: email.trim(), message: message.trim() });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }
    if (error instanceof PublicFormEmailConfigError) {
      return Response.json({ error: "Email service not configured" }, { status: 503 });
    }
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500 }
    );
  }
}
