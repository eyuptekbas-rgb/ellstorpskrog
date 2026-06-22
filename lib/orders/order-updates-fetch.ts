import type { OrderFilterGroup } from "@/lib/orders/admin-filters";
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";
import { posDebugLog } from "@/lib/debug/pos-emergency-debug";
import type { AdminOrderListItem } from "@/components/admin/orders/useOrderPolling";

export type OrderUpdatesFetchParams = {
  search: string;
  filter: OrderFilterGroup;
};

export const ORDER_FETCH_TIMEOUT_MS = 8_000;

export async function defaultFetchOrdersImpl({
  search,
  filter,
}: OrderUpdatesFetchParams): Promise<AdminOrderListItem[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (filter !== "ALL") params.set("group", filter);

  const url = `/api/orders?${params.toString()}`;
  posDebugLog("HTTP GET ORDERS", { url, timeoutMs: ORDER_FETCH_TIMEOUT_MS });

  const res = await fetchWithTimeout(
    url,
    {},
    ORDER_FETCH_TIMEOUT_MS
  );
  posDebugLog("HTTP GET ORDERS RESPONSE", { url, ok: res.ok, status: res.status });
  if (!res.ok) throw new Error("fetch-failed");
  const json = await res.json();
  posDebugLog("HTTP GET ORDERS JSON PARSED", { count: Array.isArray(json) ? json.length : "not-array" });
  return json;
}
