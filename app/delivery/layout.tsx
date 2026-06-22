import type { Metadata } from "next";
import DeliveryShell from "@/components/delivery/DeliveryShell";

export const metadata: Metadata = {
  title: "Delivery",
  robots: { index: false, follow: false },
};

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <DeliveryShell>{children}</DeliveryShell>;
}
