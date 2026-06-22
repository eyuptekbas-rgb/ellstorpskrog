export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { registerProcessHandlers } = await import(
    "@/lib/logging/register-process-handlers"
  );
  registerProcessHandlers();
}
