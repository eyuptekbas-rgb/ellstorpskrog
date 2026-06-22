"use client";

import Image from "next/image";
import Link from "next/link";
import { useTenantBrandingOptional } from "@/components/tenant/TenantBrandingProvider";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";

const SIZES = {
  "header-mobile-compact": {
    width: 120,
    height: 120,
    className: "brand-logo brand-logo--header-mobile-compact",
    text: "text-sm",
  },
  "header-mobile": {
    width: 200,
    height: 200,
    className: "brand-logo brand-logo--header-mobile",
    text: "text-base",
  },
  "header-desktop": {
    width: 240,
    height: 240,
    className: "brand-logo brand-logo--header-desktop",
    text: "text-lg",
  },
  footer: {
    width: 220,
    height: 220,
    className: "brand-logo brand-logo--footer",
    text: "text-xl",
  },
  hero: {
    width: 320,
    height: 320,
    className: "brand-logo brand-logo--hero",
    text: "text-3xl",
  },
  "mobile-page": {
    width: 320,
    height: 320,
    className: "brand-logo brand-logo--mobile-page",
    text: "text-2xl",
  },
  "home-hero": {
    width: 110,
    height: 110,
    className: "brand-logo brand-logo--home-hero",
    text: "text-xl",
  },
} as const;

type BrandLogoSize = keyof typeof SIZES;

type Props = {
  size?: BrandLogoSize;
  className?: string;
  priority?: boolean;
  href?: string;
  onClick?: () => void;
};

export default function BrandLogo({
  size = "header-desktop",
  className = "",
  priority = false,
  href = "/",
  onClick,
}: Props) {
  const branding = useTenantBrandingOptional();
  const { width, height, className: sizeClass, text: textSize } = SIZES[size];

  const useEllstorpsLogo =
    !branding?.logo &&
    (!branding || branding.isDefaultTenant);

  const logoSrc = branding?.logo ?? LOGO_PATH;
  const logoAlt = branding?.restaurantName ?? LOGO_ALT;

  const inner = useEllstorpsLogo ? (
    <Image
      src={LOGO_PATH}
      alt={LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      className={`${sizeClass} ${className}`.trim()}
    />
  ) : branding?.logo ? (
    <Image
      src={logoSrc}
      alt={logoAlt}
      width={width}
      height={height}
      priority={priority}
      unoptimized={logoSrc.startsWith("http")}
      className={`${sizeClass} ${className}`.trim()}
    />
  ) : (
    <span
      className={`brand-logo-text font-serif font-semibold leading-tight text-[var(--brand-cream)] ${textSize} ${className}`.trim()}
    >
      {branding?.restaurantName ?? "Restaurang"}
    </span>
  );

  if (!href) return inner;

  return (
    <Link href={href} className="brand-logo-link inline-flex shrink-0" onClick={onClick}>
      {inner}
    </Link>
  );
}
