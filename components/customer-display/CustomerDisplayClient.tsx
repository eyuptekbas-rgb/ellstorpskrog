"use client";

import { memo, useEffect, useState } from "react";
import {
  getCustomerDisplayProvider,
  type CustomerDisplayState,
} from "@/lib/customer-display/provider";
import {
  subscribeCustomerDisplayWithReconnect,
  type CustomerDisplayConnectionState,
} from "@/lib/customer-display/reconnect";

function CustomerDisplayClient() {
  const [state, setState] = useState<CustomerDisplayState | null>(null);
  const [connection, setConnection] =
    useState<CustomerDisplayConnectionState>("waiting");

  useEffect(() => {
    const provider = getCustomerDisplayProvider();
    return subscribeCustomerDisplayWithReconnect(
      setState,
      setConnection,
      provider.subscribe.bind(provider)
    );
  }, []);

  if (!state) {
    return (
      <div
        className="flex h-dvh flex-col items-center justify-center bg-black text-white/40"
        role="status"
        aria-live="polite"
      >
        <p className="text-2xl">Väntar på kassa…</p>
        {connection === "reconnecting" ? (
          <p className="mt-2 text-sm text-amber-400/80">Återansluter…</p>
        ) : null}
      </div>
    );
  }

  const paymentLabel =
    state.paymentStatus === "processing"
      ? "Bearbetar betalning…"
      : state.paymentStatus === "paid"
        ? "Betalt"
        : state.paymentStatus === "failed"
          ? "Betalning misslyckades"
          : state.paymentStatus === "pending"
            ? "Väntar på betalning"
            : null;

  return (
    <div className="flex h-dvh flex-col bg-black text-white" role="main" aria-label="Kunddisplay">
      {connection === "reconnecting" ? (
        <div
          className="absolute right-4 top-4 rounded-full bg-amber-500/20 px-3 py-1 text-xs text-amber-300"
          role="status"
        >
          Återansluter…
        </div>
      ) : null}

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {state.lines.map((line, index) => (
          <p
            key={`${line.text}-${index}`}
            className={`${
              line.size === "lg"
                ? "font-serif text-6xl"
                : line.size === "sm"
                  ? "text-2xl text-white/55"
                  : "text-4xl"
            } ${line.tone === "success" ? "text-emerald-300" : ""} ${
              line.tone === "accent" ? "text-[#e8c4a8]" : ""
            }`}
          >
            {line.text}
          </p>
        ))}

        {state.phase === "payment" ? (
          <p className="mt-6 animate-pulse text-3xl text-[#e8c4a8]" aria-live="polite">
            {paymentLabel ?? "Betalning"}
          </p>
        ) : null}

        {state.items.length > 0 ? (
          <div className="mt-10 w-full max-w-2xl space-y-3 text-left" aria-label="Varukorg">
            {state.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-2xl"
              >
                <span>
                  {item.qty}× {item.name}
                </span>
                <span>{item.price * item.qty} kr</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <footer className="border-t border-white/10 px-8 py-6">
        <div className="mx-auto flex max-w-4xl items-end justify-between gap-6">
          <div className="text-left text-white/50">
            {paymentLabel ? (
              <p className="text-xl uppercase tracking-[0.2em]" aria-live="polite">
                {paymentLabel}
              </p>
            ) : null}
            {state.orderNumber ? <p>Order {state.orderNumber}</p> : null}
          </div>
          <div className="text-right">
            {state.discount > 0 ? (
              <p className="text-xl text-white/45 line-through">{state.subtotal} kr</p>
            ) : null}
            <p className="font-serif text-5xl" aria-live="polite">
              {state.total} kr
            </p>
          </div>
        </div>
      </footer>

      {state.phase === "thank-you" ? (
        <div className="pointer-events-none absolute inset-0 animate-pulse bg-emerald-500/5" />
      ) : null}
    </div>
  );
}

export default memo(CustomerDisplayClient);
