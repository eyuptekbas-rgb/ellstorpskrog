import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";

export async function requireStaffSession() {
  const session = await auth();

  if (!session?.user || !isStaffRole(session.user.role)) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session, response: null };
}
