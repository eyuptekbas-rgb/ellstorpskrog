export type CustomerDisplayPhase =
  | "idle"
  | "ordering"
  | "payment"
  | "paid"
  | "thank-you";

export type CustomerDisplayLine = {
  text: string;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "success";
};

export type CustomerDisplayState = {
  phase: CustomerDisplayPhase;
  lines: CustomerDisplayLine[];
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentStatus?: "pending" | "processing" | "paid" | "failed";
  orderNumber?: string;
  updatedAt: string;
};

const STORAGE_KEY = "rms-customer-display-state";
const CHANNEL = "rms-customer-display";

export type CustomerDisplayProvider = {
  readonly id: string;
  push(state: CustomerDisplayState): void;
  subscribe(onChange: (state: CustomerDisplayState | null) => void): () => void;
  clear(): void;
};

function defaultState(): CustomerDisplayState {
  return {
    phase: "idle",
    lines: [{ text: "Välkommen!", size: "lg" }],
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function createBrowserCustomerDisplayProvider(): CustomerDisplayProvider {
  return {
    id: "browser-broadcast",
    push(state) {
      if (typeof window === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.dispatchEvent(new CustomEvent(CHANNEL, { detail: state }));
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(CHANNEL);
        bc.postMessage(state);
        bc.close();
      }
    },
    subscribe(onChange) {
      if (typeof window === "undefined") return () => undefined;

      const read = () => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          onChange(raw ? (JSON.parse(raw) as CustomerDisplayState) : null);
        } catch {
          onChange(null);
        }
      };

      const onCustom = (event: Event) => {
        const detail = (event as CustomEvent<CustomerDisplayState>).detail;
        onChange(detail);
      };

      read();
      window.addEventListener(CHANNEL, onCustom);
      let bc: BroadcastChannel | null = null;
      if ("BroadcastChannel" in window) {
        bc = new BroadcastChannel(CHANNEL);
        bc.onmessage = (event) => onChange(event.data as CustomerDisplayState);
      }

      return () => {
        window.removeEventListener(CHANNEL, onCustom);
        bc?.close();
      };
    },
    clear() {
      this.push(defaultState());
    },
  };
}

let sharedProvider: CustomerDisplayProvider | null = null;

export function getCustomerDisplayProvider(): CustomerDisplayProvider {
  if (!sharedProvider) {
    sharedProvider = createBrowserCustomerDisplayProvider();
  }
  return sharedProvider;
}

export function buildThankYouState(orderNumber?: string): CustomerDisplayState {
  return {
    phase: "thank-you",
    lines: [
      { text: "Tack!", size: "lg", tone: "success" },
      { text: "Vi förbereder din beställning", size: "md" },
    ],
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
    paymentStatus: "paid",
    orderNumber,
    updatedAt: new Date().toISOString(),
  };
}
