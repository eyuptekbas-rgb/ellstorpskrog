import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    const transporter = nodemailer.createTransport({
      host: "smtp.one.com",
      port: 465,
      secure: true,
      auth: {
        user: String(process.env.SMTP_USER),
        pass: String(process.env.SMTP_PASS),
      },
    });

    await transporter.sendMail({
      from: `"Ellstorps Krog" <info@ellstorpskrog.se>`,
      to: "info@ellstorpskrog.se",
      replyTo: email,
      subject: "Ny besked fra kontaktformular",
      text: `Navn: ${name}
Email: ${email}

${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("MAIL ERROR:", error);
    return NextResponse.json(
      { error: "Kunne ikke sende mail" },
      { status: 500 }
    );
  }
}
