import type { EscPosRestaurantInfo } from "./escpos/receipt";

export type EscPosPrintContext = {
  restaurant?: Partial<EscPosRestaurantInfo>;
  cashier?: string;
  tableLabel?: string;
  swishReference?: string | null;
  cardReference?: string | null;
  discountTotal?: number;
  stationName?: string;
  preparationMinutes?: number;
};

export const DEFAULT_THANK_YOU = "Tack för ditt besök!";
