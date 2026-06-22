export class FetchTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

/** fetch() with AbortController timeout. Rejects with FetchTimeoutError on expiry. */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (init.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FetchTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
