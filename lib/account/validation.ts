import { normalizePhone } from "@/lib/account/phone";

export type RegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  password: string;
};

export function parseRegisterBody(body: unknown):
  | { ok: true; data: RegisterInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Ogiltig begäran" };
  }

  const raw = body as Record<string, unknown>;
  const firstName = String(raw.firstName ?? "").trim();
  const lastName = String(raw.lastName ?? "").trim();
  const phone = normalizePhone(String(raw.phone ?? "").trim());
  const email = String(raw.email ?? "").trim().toLowerCase();
  const address = String(raw.address ?? "").trim();
  const postalCode = String(raw.postalCode ?? "").trim();
  const city = String(raw.city ?? "").trim();
  const password = String(raw.password ?? "");

  if (!firstName) return { ok: false, error: "Förnamn krävs" };
  if (!lastName) return { ok: false, error: "Efternamn krävs" };
  if (!phone || phone.length < 8) return { ok: false, error: "Telefonnummer krävs" };
  if (!email || !email.includes("@")) return { ok: false, error: "Giltig e-post krävs" };
  if (!address) return { ok: false, error: "Adress krävs" };
  if (!postalCode) return { ok: false, error: "Postnummer krävs" };
  if (!city) return { ok: false, error: "Stad krävs" };
  if (password.length < 8) {
    return { ok: false, error: "Lösenordet måste vara minst 8 tecken" };
  }

  return {
    ok: true,
    data: {
      firstName,
      lastName,
      phone,
      email,
      address,
      postalCode,
      city,
      password,
    },
  };
}
