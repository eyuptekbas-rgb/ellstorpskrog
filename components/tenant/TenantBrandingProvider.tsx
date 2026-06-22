"use client";

import { createContext, useContext } from "react";
const DEFAULT_TENANT_SLUG =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "ellstorps-krog";

export type TenantBranding = {
  slug: string;
  restaurantName: string;
  logo: string | null;
  isDefaultTenant: boolean;
  phone: string;
  email: string;
  address: string;
  facebookUrl: string | null;
  instagramUrl: string | null;
};

const TenantBrandingContext = createContext<TenantBranding | null>(null);

export function TenantBrandingProvider({
  branding,
  children,
}: {
  branding: TenantBranding;
  children: React.ReactNode;
}) {
  return (
    <TenantBrandingContext.Provider value={branding}>
      {children}
    </TenantBrandingContext.Provider>
  );
}

export function useTenantBranding() {
  const ctx = useContext(TenantBrandingContext);
  if (!ctx) {
    throw new Error("useTenantBranding must be used within TenantBrandingProvider");
  }
  return ctx;
}

export function useTenantBrandingOptional() {
  return useContext(TenantBrandingContext);
}

export function isEllstorpsTenant(slug: string) {
  return slug === DEFAULT_TENANT_SLUG;
}
