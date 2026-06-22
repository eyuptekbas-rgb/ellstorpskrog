import type { Metadata } from "next";
import CustomerDisplayShell from "@/components/customer-display/CustomerDisplayShell";

export const metadata: Metadata = {
  title: "Customer Display",
  robots: { index: false, follow: false },
};

export default function CustomerDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerDisplayShell>{children}</CustomerDisplayShell>;
}
