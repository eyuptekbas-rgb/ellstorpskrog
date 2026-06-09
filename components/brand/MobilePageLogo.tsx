import BrandLogo from "@/components/brand/BrandLogo";

type Props = {
  className?: string;
  priority?: boolean;
};

/**
 * Official logo image directly below the mobile header — hidden on desktop
 * where the desktop header/footer already show BrandLogo.
 */
export default function MobilePageLogo({
  className = "mx-auto",
  priority = false,
}: Props) {
  return (
    <BrandLogo
      size="mobile-page"
      href="/"
      priority={priority}
      className={`lg:hidden ${className}`.trim()}
    />
  );
}
