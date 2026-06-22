import type { Metadata, Viewport } from "next";
import PosShell from "@/components/pos/PosShell";
import "../../styles/pos-pro.css";

export const metadata: Metadata = {
  title: "POS",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PosShell>{children}</PosShell>;
}
