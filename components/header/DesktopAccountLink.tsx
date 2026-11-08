"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useSession } from "next-auth/react";
import { isCustomerRole } from "@/lib/auth/roles";

export default function DesktopAccountLink() {
  const { data: session, status } = useSession();
  const isCustomer = status === "authenticated" && isCustomerRole(session?.user?.role);

  return (
    <Link
      href={isCustomer ? "/konto" : "/konto/logga-in"}
      prefetch={false}
      className="site-header-icon-btn focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d4a574]"
      aria-label="Konto"
      title={isCustomer ? "Konto" : "Logga in"}
    >
      <UserRound size={18} strokeWidth={1.75} aria-hidden />
    </Link>
  );
}
