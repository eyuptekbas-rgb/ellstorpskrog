import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // info@ellstorpskrog.se
        pass: process.env.SMTP_PASS, // mailbox-adgangskode
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
  } catch (error: any) {
    console.error("MAIL ERROR FULL:", error?.message, error);
    return NextResponse.json(
      { error: error?.message || "Kunne ikke sende mail" },
      { status: 500 }
    );
  }
}
