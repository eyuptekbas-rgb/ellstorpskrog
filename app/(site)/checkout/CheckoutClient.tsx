"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";
import CheckoutLoadingSkeleton from "@/components/checkout/CheckoutLoadingSkeleton";
import { FormInput, FormTextarea } from "@/components/checkout/FormField";
import OrderSummary from "@/components/checkout/OrderSummary";
import OrderTypeSelector, {
  type OrderType,
} from "@/components/checkout/OrderTypeSelector";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "@/components/checkout/PaymentMethodSelector";
import StickyTotalBar from "@/components/checkout/StickyTotalBar";
import TrustBadges from "@/components/checkout/TrustBadges";
import { CartItem, formatOrderItemName, loadCart, loadOrderNote, saveOrderNote } from "@/lib/cart";
import { extractPostalCode, matchDeliveryZone } from "@/lib/settings/utils";
import type { DeliveryZone, SiteSettings } from "@prisma/client";

const FORM_ID = "checkout-form";

type PublicSettingsResponse = {
  settings: SiteSettings;
  deliveryZones: DeliveryZone[];
  stripeCardEnabled: boolean;
  stripeTestMode: boolean;
};

export default function CheckoutClient() {
  const tp = useTenantPublicPath();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [stripeCardEnabled, setStripeCardEnabled] = useState(false);
  const [stripeTestMode, setStripeTestMode] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("afhentning");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("afhentning");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCart(loadCart());
    setOrderNote(loadOrderNote());
    setCartLoaded(true);
  }, []);

  // Critical fix 1: whenever a submit error appears, bring it into view and move
  // keyboard focus to it (it is also announced via role="alert"/aria-live).
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      errorRef.current.focus();
    }
  }, [error]);

  // H3: prefill contact fields for logged-in customers. The /api/account/profile
  // endpoint returns 401 for guests (ignored). Each field is only filled when it
  // is still empty, so values the user has already typed are never overwritten.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.profile) return;
        const p = data.profile as {
          firstName?: string | null;
          lastName?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          postalCode?: string | null;
          city?: string | null;
        };
        const fullName = [p.firstName, p.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const composedAddress = [
          p.address,
          [p.postalCode, p.city].filter(Boolean).join(" ").trim(),
        ]
          .filter(Boolean)
          .join(", ");

        if (fullName) setName((cur) => cur || fullName);
        if (p.phone) setPhone((cur) => cur || p.phone || "");
        if (p.email) setEmail((cur) => cur || p.email || "");
        if (composedAddress) setAddress((cur) => cur || composedAddress);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicSettingsResponse | null) => {
        if (data) {
          setSettings(data.settings);
          setDeliveryZones(data.deliveryZones);
          setStripeCardEnabled(data.stripeCardEnabled);
          setStripeTestMode(data.stripeTestMode);
          if (data.settings.pickupEnabled) {
            setOrderType("afhentning");
          } else if (data.settings.deliveryEnabled) {
            setOrderType("levering");
          }
          if (!data.stripeCardEnabled) {
            setPaymentMethod("afhentning");
          } else {
            setPaymentMethod("kort");
          }
        }
      })
      .finally(() => setSettingsLoading(false));
  }, []);

  useEffect(() => {
    if (orderType === "levering") {
      if (stripeCardEnabled) setPaymentMethod("kort");
      return;
    }
    if (paymentMethod === "kort" && !stripeCardEnabled) {
      setPaymentMethod("afhentning");
    }
  }, [orderType, paymentMethod, stripeCardEnabled]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryMatch = useMemo(() => {
    if (!settings || orderType !== "levering") {
      return {
        deliveryFee: 0,
        minimumOrder: settings?.minimumOrder ?? 0,
        zone: null,
      };
    }
    return matchDeliveryZone(address, deliveryZones, {
      deliveryFee: settings.deliveryFee,
      minimumOrder: settings.minimumOrder,
    });
  }, [address, deliveryZones, orderType, settings]);

  const deliveryFee =
    orderType === "levering" ? deliveryMatch.deliveryFee : 0;
  const minimumOrder =
    orderType === "levering"
      ? deliveryMatch.minimumOrder
      : settings?.minimumOrder ?? 0;
  const totalPrice = subtotal + deliveryFee;
  const belowMinimum = minimumOrder > 0 && subtotal < minimumOrder;

  const pickupEnabled = settings?.pickupEnabled ?? true;
  const deliveryEnabled = settings?.deliveryEnabled ?? true;

  // H4: delivery coverage feedback. Only meaningful for delivery orders once a
  // postal code is detectable in the address. With configured zones, coverage
  // depends on a zone match; without zones the restaurant delivers everywhere.
  const addressPostal = extractPostalCode(address);
  const showDeliveryCoverage =
    orderType === "levering" && Boolean(addressPostal);
  const deliveryAvailable =
    deliveryZones.length > 0 ? Boolean(deliveryMatch.zone) : true;

  useEffect(() => {
    saveOrderNote(orderNote);
  }, [orderNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (minimumOrder > 0 && subtotal < minimumOrder) {
      setError(`Minsta order är ${minimumOrder} kr (exkl. leveransavgift).`);
      setLoading(false);
      return;
    }

    if (orderType === "levering" && deliveryZones.length > 0 && !deliveryAvailable) {
      setError("Adressen ligger utanför vårt leveransområde.");
      setLoading(false);
      return;
    }

    const payload = {
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      customerAddress: address || undefined,
      orderType,
      note: orderNote || undefined,
      total: totalPrice,
      subtotal,
      deliveryFee,
      items: cart.map((item) => ({
        productId: item.id,
        productName: formatOrderItemName(item),
        quantity: item.quantity,
        price: item.price,
        selectedOptionIds: item.selectedOptions.map((o) => o.id),
      })),
    };

    try {
      if (paymentMethod === "kort") {
        if (!stripeCardEnabled) {
          throw new Error("Online payment not available");
        }

        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to start payment");
        }

        const { url } = await res.json();
        if (!url) throw new Error("No checkout URL");
        sessionStorage.setItem(
          "faktura_customer_email",
          email.trim().toLowerCase()
        );
        window.location.href = url;
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          paymentMethod: "afhentning",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit order");

      const order = await res.json();
      sessionStorage.setItem(
        "faktura_customer_email",
        email.trim().toLowerCase()
      );

      window.location.href = tp(
        `/checkout/success?order_id=${encodeURIComponent(order.id)}&cash=1`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? "Kunde inte slutföra beställningen. Försök igen."
          : "Kunde inte skicka beställningen. Försök igen."
      );
    } finally {
      setLoading(false);
    }
  };

  const deliveryNeedsOnline = orderType === "levering" && !stripeCardEnabled;
  const pickupPaymentUnavailable =
    orderType === "afhentning" && !stripeCardEnabled && paymentMethod === "kort";

  const submitDisabled =
    loading ||
    deliveryNeedsOnline ||
    pickupPaymentUnavailable ||
    (!pickupEnabled && !deliveryEnabled) ||
    belowMinimum ||
    (orderType === "levering" && deliveryZones.length > 0 && !deliveryAvailable);

  const disabledReason = deliveryNeedsOnline
    ? "Leverans kräver onlinebetalning som inte är aktiverad just nu."
    : !pickupEnabled && !deliveryEnabled
    ? "Avhämtning och leverans är inte tillgängligt just nu."
    : belowMinimum
      ? `Minsta order är ${minimumOrder} kr — du har ${subtotal} kr.`
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-44">
      <div className="mx-auto max-w-lg px-[var(--content-px)] pt-5 sm:pt-8">
        <Link
          href={tp("/menu")}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/55 transition hover:border-white/18 hover:text-white"
        >
          <ArrowLeft size={16} />
          Tillbaka till menyn
        </Link>

        <header className="mb-10">
          <div className="checkout-secure-bar mb-6 flex items-center gap-3 rounded-2xl px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#b85c38]/15 text-[#d4a574]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85">
                Säker checkout
              </p>
              <p className="text-[11px] text-white/55">
                Krypterad betalning via Stripe
              </p>
            </div>
          </div>

          <p className="section-label mb-3">Steg 3 av 3</p>
          <h1 className="text-display text-3xl text-white sm:text-4xl">Kassa</h1>
          <p className="text-body mt-3 text-sm text-white/55">
            Granska din order och slutför betalningen
          </p>

          <div className="mt-6 flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full ${
                  step <= 3 ? "bg-[#b85c38]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </header>

        {!cartLoaded || settingsLoading ? (
          <CheckoutLoadingSkeleton />
        ) : cart.length === 0 ? (
          <div className="rounded-3xl border border-white/8 bg-[#1a1a1a] p-10 text-center">
            <p className="text-white/55 mb-5">Din varukorg är tom</p>
            <Link
              href={tp("/menu")}
              className="inline-flex items-center justify-center rounded-2xl bg-[#b85c38] px-8 py-3.5 font-semibold text-white transition hover:bg-[#a04f30]"
            >
              Gå till menyn
            </Link>
          </div>
        ) : (
          <>
            <form
              id={FORM_ID}
              onSubmit={handleSubmit}
              className="space-y-8 pb-4"
            >
              {error && (
                <div
                  ref={errorRef}
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 focus:outline-none"
                >
                  {error}
                </div>
              )}

              {stripeCardEnabled && stripeTestMode && (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                  Stripe testläge — använd testkort 4242 4242 4242 4242
                </div>
              )}

              <OrderSummary
                cart={cart}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                totalPrice={totalPrice}
                orderType={orderType}
                zoneName={deliveryMatch.zone?.name ?? null}
                minimumOrder={minimumOrder}
                belowMinimum={belowMinimum}
              />

              <section className="card-premium rounded-[var(--radius-card)] p-6 space-y-5">
                <div>
                  <h2 className="font-serif text-xl text-white">Dina uppgifter</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Vi behöver dina kontaktuppgifter för orderbekräftelse
                  </p>
                </div>

                <FormInput
                  label="Namn"
                  placeholder="För- och efternamn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <FormInput
                  label="Telefon"
                  type="tel"
                  placeholder="07X XXX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
                <FormInput
                  label="E-post"
                  type="email"
                  placeholder="namn@exempel.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <FormInput
                  label="Adress"
                  placeholder="Gatuadress och postnummer"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required={orderType === "levering"}
                  autoComplete="street-address"
                  hint={
                    orderType === "levering"
                      ? "Obligatorisk vid hemleverans"
                      : "Valfritt vid avhämtning"
                  }
                />

                {showDeliveryCoverage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs ${
                      deliveryAvailable
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {deliveryAvailable ? (
                      <Check size={14} strokeWidth={2.5} aria-hidden />
                    ) : (
                      <X size={14} strokeWidth={2.5} aria-hidden />
                    )}
                    <span>
                      {deliveryAvailable
                        ? deliveryMatch.zone
                          ? `Leverans tillgänglig (${deliveryMatch.zone.name})`
                          : "Leverans tillgänglig till din adress"
                        : "Din adress ligger utanför vårt leveransområde"}
                    </span>
                  </div>
                )}
              </section>

              <div className="card-premium rounded-[var(--radius-card)] p-5">
                <OrderTypeSelector
                  orderType={orderType}
                  pickupEnabled={pickupEnabled}
                  deliveryEnabled={deliveryEnabled}
                  onChange={setOrderType}
                />
              </div>

              <div className="card-premium rounded-[var(--radius-card)] p-5">
                <PaymentMethodSelector
                  paymentMethod={paymentMethod}
                  orderType={orderType}
                  stripeCardEnabled={stripeCardEnabled}
                  onChange={setPaymentMethod}
                />
              </div>

              <section className="card-premium rounded-[var(--radius-card)] p-5">
                <FormTextarea
                  label="Kommentar till beställningen"
                  placeholder="Allergier, leveransinstruktioner eller andra önskemål…"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  rows={3}
                  hint="Valfritt — synlig för köket och vid leverans"
                />
              </section>

              <TrustBadges />
            </form>

            <StickyTotalBar
              totalPrice={totalPrice}
              loading={loading}
              disabled={submitDisabled}
              paymentMethod={paymentMethod}
              formId={FORM_ID}
              disabledReason={disabledReason}
            />
          </>
        )}
      </div>
    </div>
  );
}
