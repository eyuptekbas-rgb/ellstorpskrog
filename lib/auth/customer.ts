import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { isCustomerRole } from "@/lib/auth/roles";

export { isCustomerRole };

export async function requireCustomerSession() {
  const session = await auth();
  if (!session?.user?.id || !isCustomerRole(session.user.role)) {
    return null;
  }
  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
