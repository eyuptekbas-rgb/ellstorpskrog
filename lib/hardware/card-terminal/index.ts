/** Card terminal provider abstraction for in-store payments. */

export type CardTerminalProviderId =
  | "nets"
  | "worldline"
  | "zettle"
  | "stripe-terminal";

export type CardTerminalStatus =
  | "disconnected"
  | "connecting"
  | "ready"
  | "busy"
  | "error";

export type CardPaymentRequest = {
  amountOre: number;
  currency: "SEK";
  reference: string;
  tipOre?: number;
};

export type CardPaymentResult = {
  success: boolean;
  providerId: CardTerminalProviderId;
  transactionId?: string;
  errorMessage?: string;
  declined?: boolean;
  cancelled?: boolean;
  timedOut?: boolean;
};

export type CardTerminalProvider = {
  readonly id: CardTerminalProviderId;
  readonly label: string;
  status(): CardTerminalStatus;
  connect(): Promise<{ success: boolean; error?: string }>;
  disconnect(): Promise<void>;
  charge(request: CardPaymentRequest): Promise<CardPaymentResult>;
  cancel(): Promise<{ success: boolean }>;
  refund(transactionId: string, amountOre: number): Promise<CardPaymentResult>;
};

function stubTerminal(
  id: CardTerminalProviderId,
  label: string
): CardTerminalProvider {
  return {
    id,
    label,
    status: () => "disconnected",
    async connect() {
      return {
        success: false,
        error: `${label} integration not configured. Connect hardware SDK to enable.`,
      };
    },
    async disconnect() {},
    async charge() {
      return {
        success: false,
        providerId: id,
        errorMessage: `${label} not connected.`,
      };
    },
    async cancel() {
      return { success: false };
    },
    async refund() {
      return {
        success: false,
        providerId: id,
        errorMessage: `${label} not connected.`,
      };
    },
  };
}

export const cardTerminalProviders: Record<
  CardTerminalProviderId,
  CardTerminalProvider
> = {
  nets: stubTerminal("nets", "Nets"),
  worldline: stubTerminal("worldline", "Worldline"),
  zettle: stubTerminal("zettle", "Zettle"),
  "stripe-terminal": stubTerminal("stripe-terminal", "Stripe Terminal"),
};

let activeTerminalId: CardTerminalProviderId | null = null;

export function setActiveCardTerminal(id: CardTerminalProviderId | null) {
  activeTerminalId = id;
}

export function getActiveCardTerminal(): CardTerminalProvider | null {
  return activeTerminalId ? cardTerminalProviders[activeTerminalId] : null;
}

export function listCardTerminalProviders(): CardTerminalProvider[] {
  return Object.values(cardTerminalProviders);
}
