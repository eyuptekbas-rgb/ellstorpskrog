"use client";

import SharedMobileHeader from "@/components/header/SharedMobileHeader";

type Props = {
  cartCount: number;
  cartTotal: number;
  isMenuPage: boolean;
  isOpen: boolean | null;
  scrolled?: boolean;
};

export default function MobileAppHeader(props: Props) {
  return (
    <SharedMobileHeader
      {...props}
      homeHref="/"
      menuHref="/menu"
      checkoutHref="/checkout"
      restaurantName="Ellstorps Krog"
    />
  );
}
