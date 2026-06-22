import Link from "next/link";
import { Phone, ShoppingBag } from "lucide-react";

type Props = {
  phoneHref: string;
  cartHref: string;
  cartCount: number;
  cartTotal: number;
  isMenuPage?: boolean;
  variant?: "mobile" | "desktop";
};

function openCartDrawer() {
  window.dispatchEvent(new Event("open-cart-drawer"));
}

export default function HeaderActions({
  phoneHref,
  cartHref,
  cartCount,
  cartTotal,
  isMenuPage = false,
  variant = "mobile",
}: Props) {
  const isMobile = variant === "mobile";

  const cartClassName = isMobile
    ? "app-mobile-header__action-btn app-mobile-header__action-btn--cart app-mobile-header__action-btn--cart-summary"
    : "site-header-icon-btn site-header-icon-btn--cart site-header-icon-btn--cart-summary";

  const badgeClassName = isMobile
    ? "app-mobile-header__cart-badge"
    : "site-header-cart-badge";

  const cartLabel =
    cartCount > 0
      ? `Varukorg, ${cartCount} artiklar, ${cartTotal} kr`
      : "Gå till menyn";

  const cartContent = (
    <>
      <span className="site-header-cart-icon-wrap">
        <ShoppingBag size={isMobile ? 17 : 18} strokeWidth={1.75} aria-hidden />
        {cartCount > 0 && (
          <span className={badgeClassName}>
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </span>
      {cartCount > 0 && (
        <span className="site-header-cart-total w-full text-center">
          {cartTotal} kr
        </span>
      )}
    </>
  );

  return (
    <div
      className={
        isMobile ? "app-mobile-header__actions" : "site-header-actions"
      }
    >
      <a
        href={phoneHref}
        className={
          isMobile
            ? "app-mobile-header__action-btn app-mobile-header__action-btn--phone"
            : "site-header-icon-btn"
        }
        aria-label="Ring oss"
      >
        <Phone size={isMobile ? 17 : 18} strokeWidth={1.75} aria-hidden />
      </a>
      {isMenuPage ? (
        <button
          type="button"
          onClick={openCartDrawer}
          className={cartClassName}
          aria-label={cartLabel}
        >
          {cartContent}
        </button>
      ) : (
        <Link href={cartHref} className={cartClassName} aria-label={cartLabel}>
          {cartContent}
        </Link>
      )}
    </div>
  );
}
