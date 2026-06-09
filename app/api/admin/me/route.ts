import { requireStaffSession } from "@/lib/auth/require-staff";

export async function GET() {
  const { session, response } = await requireStaffSession();
  if (response) return response;

  return Response.json({
    ok: true,
    user: {
      id: session!.user.id,
      email: session!.user.email,
      name: session!.user.name,
      role: session!.user.role,
    },
  });
}
