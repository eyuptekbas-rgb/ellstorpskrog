import { MapPin } from "lucide-react";

type Props = {
  location?: string;
  isOpen: boolean | null;
  className?: string;
};

export default function HeaderStatusChips({
  location = "Malmö",
  isOpen,
  className = "",
}: Props) {
  const statusLabel =
    isOpen === null ? "…" : isOpen ? "Öppet nu" : "Stängt";

  return (
    <span className={`site-header-chips ${className}`.trim()}>
      <span className="site-header-chip site-header-chip--location">
        <MapPin size={10} strokeWidth={2.25} aria-hidden />
        {location}
      </span>
      <span
        className={
          isOpen
            ? "site-header-chip site-header-chip--open"
            : isOpen === false
              ? "site-header-chip site-header-chip--closed"
              : "site-header-chip"
        }
      >
        <span className="site-header-chip-dot" aria-hidden />
        {statusLabel}
      </span>
    </span>
  );
}
