"use client";

import SharedMobileHeader from "@/components/header/SharedMobileHeader";
import { useTenantBranding } from "@/components/tenant/TenantBrandingProvider";
import { useTenantPublicPath } from "@/components/tenant/TenantPublicPathProvider";

type Props = {
  cartCount: number;
  cartTotal: number;
  isMenuPage: boolean;
  isOpen: boolean | null;
  scrolled?: boolean;
};

export default function TenantMobileHeader(props: Props) {
  const { restaurantName } = useTenantBranding();
  const tp = useTenantPublicPath();

  return (
    <SharedMobileHeader
      {...props}
      homeHref={tp("/")}
      menuHref={tp("/menu")}
      checkoutHref={tp("/checkout")}
      restaurantName={restaurantName}
    />
  );
}
