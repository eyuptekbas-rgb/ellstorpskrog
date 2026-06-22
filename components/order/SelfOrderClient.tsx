"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Minus, Plus, QrCode, ShoppingBag, UtensilsCrossed } from "lucide-react";
import RmsEmptyState from "@/components/rms/RmsEmptyState";
import RmsErrorState from "@/components/rms/RmsErrorState";
import RmsLoadingState from "@/components/rms/RmsLoadingState";
import { parseTableFromSearchParams, buildSelfOrderUrl } from "@/lib/self-order/table";
import { ORDER_STATUS_LABELS } from "@/lib/self-order/track";

type MenuProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  soldOut: boolean;
};

type MenuCategory = {
  id: string;
  name: string;
  products: MenuProduct[];
};

type CartLine = {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
};

function SelfOrderClient() {
  const searchParams = useSearchParams();
  const table = useMemo(
    () => parseTableFromSearchParams(searchParams),
    [searchParams]
  );

  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ orderNumber: string; id: string } | null>(null);
  const [trackPhone, setTrackPhone] = useState("");
  const [tracked, setTracked] = useState<{
    status: string;
    orderNumber: string;
  } | null>(null);
  const [error, setError] = useState("");

  const [menuError, setMenuError] = useState("");

  const loadMenu = useCallback(() => {
    setLoading(true);
    setMenuError("");
    void fetch("/api/self-order/menu")
      .then((res) => {
        if (!res.ok) throw new Error("Menyn kunde inte laddas.");
        return res.json();
      })
      .then((data) => {
        if (data?.menu) setMenu(data.menu);
      })
      .catch((err) => {
        setMenuError(err instanceof Error ? err.message : "Menyn kunde inte laddas.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const addToCart = (product: MenuProduct) => {
    if (product.soldOut) return;
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  };

  const submitOrder = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/self-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName,
          guestPhone,
          table: table.tableName,
          tableId: table.tableId,
          note,
          items: cart.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            quantity: line.quantity,
            price: line.price,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order failed");
      setPlaced({ orderNumber: data.orderNumber, id: data.id });
      setCart([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka order");
    } finally {
      setSubmitting(false);
    }
  };

  const trackOrder = useCallback(async () => {
    if (!placed?.orderNumber || trackPhone.length < 4) return;
    const params = new URLSearchParams({
      orderNumber: placed.orderNumber,
      phoneLast4: trackPhone.slice(-4),
    });
    const res = await fetch(`/api/self-order/track?${params.toString()}`);
    const data = await res.json();
    if (res.ok) {
      setTracked({
        orderNumber: data.order.orderNumber,
        status: data.order.status,
      });
    }
  }, [placed?.orderNumber, trackPhone]);

  useEffect(() => {
    if (!placed) return;
    const timer = setInterval(() => void trackOrder(), 5000);
    return () => clearInterval(timer);
  }, [placed, trackOrder]);

  const qrUrl = table.tableName ? buildSelfOrderUrl(table.tableName) : null;

  return (
    <div className="min-h-dvh bg-[#0f0f0f] text-white rms-animate-in">
      <header className="border-b border-white/8 px-4 py-5 sm:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d4a574]">
          Self Order
        </p>
        <h1 className="font-serif text-3xl">Beställ vid bordet</h1>
        <p className="mt-1 text-sm text-white/45">
          {table.tableName ? `Bord ${table.tableName}` : "Skanna QR-kod eller ange bordsnummer"}
        </p>
      </header>

      <main
        id="order-main"
        className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_22rem] lg:px-6"
      >
        <section className="space-y-4" aria-label="Meny">
          {loading ? (
            <RmsLoadingState label="Hämtar meny…" />
          ) : menuError ? (
            <RmsErrorState message={menuError} onRetry={loadMenu} offline={typeof navigator !== "undefined" && !navigator.onLine} />
          ) : menu.length === 0 ? (
            <RmsEmptyState
              icon={UtensilsCrossed}
              title="Ingen meny tillgänglig"
              description="Menyn kunde inte visas just nu. Be personalen om hjälp."
              action={
                <button
                  type="button"
                  onClick={loadMenu}
                  className="rms-focus rounded-xl bg-[#b85c38] px-4 py-2.5 text-sm font-semibold"
                >
                  Försök igen
                </button>
              }
            />
          ) : (
            menu.map((category) => (
              <article key={category.id} className="rms-panel p-4">
                <h2 className="font-serif text-xl">{category.name}</h2>
                <ul className="mt-3 space-y-2" role="list">
                  {category.products.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        disabled={product.soldOut}
                        onClick={() => addToCart(product)}
                        aria-label={`Lägg till ${product.name}, ${product.price} kronor`}
                        className="rms-focus rms-touch-target flex w-full items-center justify-between rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-left transition hover:border-[#b85c38]/25 disabled:opacity-40"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-white/45">{product.description}</p>
                        </div>
                        <span className="font-semibold text-[#e8c4a8]">{product.price} kr</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}

          {qrUrl ? (
            <div className="rounded-3xl border border-white/8 bg-[#141414] p-4">
              <div className="flex items-center gap-2 text-sm text-white/60">
                <QrCode size={16} />
                QR-länk för bord {table.tableName}
              </div>
              <p className="mt-2 break-all text-xs text-white/35">{qrUrl}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start" aria-label="Varukorg">
          <div className="rms-panel p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <h2 className="font-semibold">Din order</h2>
            </div>
            <div className="mt-3 space-y-2">
              {cart.length === 0 ? (
                <p className="text-sm text-white/40">Välj rätter från menyn</p>
              ) : (
                cart.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between text-sm">
                    <span>
                      {line.quantity}× {line.productName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCart((prev) =>
                            prev
                              .map((row) =>
                                row.productId === line.productId
                                  ? { ...row, quantity: row.quantity - 1 }
                                  : row
                              )
                              .filter((row) => row.quantity > 0)
                          )
                        }
                        className="rounded-lg border border-white/10 p-1"
                      >
                        <Minus size={12} />
                      </button>
                      <span>{line.price * line.quantity} kr</span>
                      <button
                        type="button"
                        onClick={() => addToCart({
                          id: line.productId,
                          name: line.productName,
                          description: "",
                          price: line.price,
                          soldOut: false,
                        })}
                        className="rounded-lg border border-white/10 p-1"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="mt-4 text-lg font-semibold">Totalt: {total} kr</p>

            <div className="mt-4 space-y-2">
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Namn (valfritt)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="Telefon (för spårning)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Meddelande till köket"
                className="min-h-20 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
            </div>

            {error ? (
              <div className="mt-2">
                <RmsErrorState message={error} offline={typeof navigator !== "undefined" && !navigator.onLine} />
              </div>
            ) : null}

            <button
              type="button"
              disabled={!cart.length || submitting}
              onClick={() => void submitOrder()}
              aria-busy={submitting}
              className="rms-focus rms-touch-target mt-4 w-full rounded-xl bg-[#b85c38] px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Skickar…" : "Skicka till köket"}
            </button>
          </div>

          {placed ? (
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="font-semibold text-emerald-100">Order {placed.orderNumber} mottagen</p>
              <p className="mt-1 text-sm text-emerald-100/70">Betala vid servering eller kassa</p>
              <input
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="Telefon (sista 4) för spårning"
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
              />
              {tracked ? (
                <p className="mt-2 text-sm">
                  Status:{" "}
                  {ORDER_STATUS_LABELS[tracked.status as keyof typeof ORDER_STATUS_LABELS] ??
                    tracked.status}
                </p>
              ) : null}
            </div>
          ) : null}
        </aside>
      </main>
    </div>
  );
}

export default memo(SelfOrderClient);
