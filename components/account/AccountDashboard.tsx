"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { CalendarDays, LogOut, MapPin, UserRound } from "lucide-react";
import AccountInstallCard from "@/components/account/AccountInstallCard";
import { AccountField, AccountSection } from "@/components/account/AccountUi";

type Profile = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  loyaltyPoints: number;
};

type Address = {
  id: string;
  label: string | null;
  address: string;
  postalCode: string;
  city: string;
  isDefault: boolean;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  orderType: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
};

type Reservation = {
  id: string;
  guestCount: number;
  date: string;
  time: string;
  status: string;
};

const ORDER_STATUS: Record<string, string> = {
  NEW: "Ny",
  CONFIRMED: "Bekräftad",
  PREPARING: "Tillagas",
  READY: "Klar",
  DELIVERING: "Levereras",
  COMPLETED: "Slutförd",
  CANCELLED: "Avbruten",
};

export default function AccountDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");

  const loadData = useCallback(async () => {
    const [profileRes, ordersRes, reservationsRes] = await Promise.all([
      fetch("/api/account/profile"),
      fetch("/api/account/orders"),
      fetch("/api/account/reservations"),
    ]);

    if (!profileRes.ok) return;

    const profileData = (await profileRes.json()) as {
      profile: Profile & { addresses: Address[] };
    };
    const p = profileData.profile;

    setProfile(p);
    setAddresses(p.addresses ?? []);
    setFirstName(p.firstName ?? "");
    setLastName(p.lastName ?? "");
    setEmail(p.email);
    setPhone(p.phone ?? "");
    setAddress(p.address ?? "");
    setPostalCode(p.postalCode ?? "");
    setCity(p.city ?? "");

    if (ordersRes.ok) {
      const ordersData = (await ordersRes.json()) as { orders: Order[] };
      setOrders(ordersData.orders);
    }

    if (reservationsRes.ok) {
      const reservationsData = (await reservationsRes.json()) as {
        reservations: Reservation[];
      };
      setReservations(reservationsData.reservations);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        address,
        postalCode,
        city,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setMessage("Kunde inte spara ändringar");
      return;
    }

    setMessage("Profil uppdaterad");
    void loadData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white/50 lg:hidden">
        Laddar profil…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-[var(--content-px)] pb-[calc(var(--bottom-nav-height)+var(--bottom-nav-fab-overflow)+env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(var(--header-height-mobile)+1.25rem)] lg:hidden">
      <div className="mb-1">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b85c38]">
          Profil
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl text-white">
          Mitt konto
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Hantera dina uppgifter i EllstorpsKrog.
        </p>
      </div>

      <AccountSection title="Personuppgifter">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <AccountField
              id="profile-firstName"
              label="Förnamn"
              value={firstName}
              onChange={setFirstName}
            />
            <AccountField
              id="profile-lastName"
              label="Efternamn"
              value={lastName}
              onChange={setLastName}
            />
          </div>
          <AccountField
            id="profile-phone"
            label="Telefon"
            type="tel"
            value={phone}
            onChange={setPhone}
          />
          <AccountField
            id="profile-email"
            label="E-post"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <AccountField
            id="profile-address"
            label="Adress"
            value={address}
            onChange={setAddress}
          />
          <div className="grid grid-cols-2 gap-3">
            <AccountField
              id="profile-postalCode"
              label="Postnummer"
              value={postalCode}
              onChange={setPostalCode}
            />
            <AccountField
              id="profile-city"
              label="Stad"
              value={city}
              onChange={setCity}
            />
          </div>
          {message && (
            <p className="text-sm text-emerald-300">{message}</p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full !py-3 text-sm disabled:opacity-60"
          >
            {saving ? "Sparar…" : "Spara uppgifter"}
          </button>
        </form>
      </AccountSection>

      <AccountSection title="Sparade adresser">
        {addresses.length === 0 ? (
          <p className="text-sm text-white/45">Inga sparade adresser ännu.</p>
        ) : (
          <ul className="space-y-3">
            {addresses.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/[0.06] bg-[#111] p-4"
              >
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-white">
                  <MapPin size={14} className="text-[#b85c38]" />
                  {item.label ?? "Adress"}
                  {item.isDefault && (
                    <span className="rounded-full bg-[#b85c38]/15 px-2 py-0.5 text-[10px] text-[#e8c4a8]">
                      Standard
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/55">
                  {item.address}, {item.postalCode} {item.city}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection title="Orderhistorik">
        {orders.length === 0 ? (
          <p className="text-sm text-white/45">Inga tidigare beställningar.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-xl border border-white/[0.06] bg-[#111] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      #{order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {ORDER_STATUS[order.status] ?? order.status} ·{" "}
                      {order.orderType === "DELIVERY" ? "Leverans" : "Avhämtning"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#e8c4a8]">
                    {order.total} kr
                  </p>
                </div>
                {order.items.length > 0 && (
                  <p className="mt-2 text-xs text-white/40">
                    {order.items
                      .map((i) => `${i.quantity}× ${i.productName}`)
                      .join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountSection title="Bokningar">
        {reservations.length === 0 ? (
          <p className="text-sm text-white/45">Inga bordsbokningar ännu.</p>
        ) : (
          <ul className="space-y-3">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#111] p-4"
              >
                <CalendarDays size={18} className="shrink-0 text-[#b85c38]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {reservation.date} kl. {reservation.time}
                  </p>
                  <p className="text-xs text-white/45">
                    {reservation.guestCount} gäster · {reservation.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AccountSection>

      <AccountInstallCard />

      {profile && profile.loyaltyPoints >= 0 && (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-xs text-white/35">
          <UserRound size={14} className="mb-1 inline text-white/25" /> Bonuspoäng
          kommer snart — du har förberedda {profile.loyaltyPoints} poäng.
        </div>
      )}

      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#141414] py-3.5 text-sm font-medium text-white/80 transition hover:text-white"
      >
        <LogOut size={16} />
        Logga ut
      </button>
    </div>
  );
}
