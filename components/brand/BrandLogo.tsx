import Image from "next/image";
import Link from "next/link";
import { LOGO_ALT, LOGO_PATH } from "@/lib/brand/images";

const SIZES = {
  "header-mobile": {
    width: 200,
    height: 200,
    className: "brand-logo brand-logo--header-mobile",
  },
  "header-desktop": {
    width: 240,
    height: 240,
    className: "brand-logo brand-logo--header-desktop",
  },
  footer: {
    width: 220,
    height: 220,
    className: "brand-logo brand-logo--footer",
  },
  hero: {
    width: 320,
    height: 320,
    className: "brand-logo brand-logo--hero",
  },
  "mobile-page": {
    width: 320,
    height: 320,
    className: "brand-logo brand-logo--mobile-page",
  },
  "home-hero": {
    width: 110,
    height: 110,
    className: "brand-logo brand-logo--home-hero",
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
  const { width, height, className: sizeClass } = SIZES[size];

  const image = (
    <Image
      src={LOGO_PATH}
      alt={LOGO_ALT}
      width={width}
      height={height}
      priority={priority}
      className={`${sizeClass} ${className}`.trim()}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="brand-logo-link inline-flex shrink-0" onClick={onClick}>
      {image}
    </Link>
  );
}
