import type { Metadata } from "next";
import "../../styles/rms-polish.css";

export const metadata: Metadata = {
  title: "Beställ",
  robots: { index: false, follow: false },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
