"use client";

import { createContext, useCallback, useContext } from "react";
import { usePathname } from "next/navigation";
import { withTenantPath } from "@/lib/tenant/public-path";

type ResolvePath = (path: string) => string;

const TenantPathContext = createContext<ResolvePath>((path) => path);

export function useTenantPublicPath(): ResolvePath {
  return useContext(TenantPathContext);
}

export function TenantPublicPathProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const resolve = useCallback(
    (path: string) => withTenantPath(pathname, path),
    [pathname]
  );

  return (
    <TenantPathContext.Provider value={resolve}>{children}</TenantPathContext.Provider>
  );
}
