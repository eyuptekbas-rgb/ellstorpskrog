import { Section, Text } from "@react-email/components";
import * as React from "react";
import {
  card,
  itemRow,
  label,
  total,
  value,
} from "@/emails/components/EmailLayout";
import type { OrderEmailPayload } from "@/lib/email/types";

export function OrderSummary({ order }: { order: OrderEmailPayload }) {
  return (
    <>
      <Section style={card}>
        <Text style={label}>Ordernummer</Text>
        <Text style={value}>{order.orderNumber}</Text>

        <Text style={label}>Beställningstyp</Text>
        <Text style={value}>{order.orderTypeLabel}</Text>

        <Text style={label}>Betalning</Text>
        <Text style={value}>{order.paymentLabel}</Text>

        {order.customerAddress && (
          <>
            <Text style={label}>Leveransadress</Text>
            <Text style={value}>{order.customerAddress}</Text>
          </>
        )}

        {order.note && (
          <>
            <Text style={label}>Meddelande</Text>
            <Text style={value}>{order.note}</Text>
          </>
        )}
      </Section>

      <Text style={label}>Produkter</Text>
      {order.items.map((item) => (
        <Text key={item.id} style={itemRow}>
          {item.quantity}× {item.productName} — {item.totalPrice} kr
        </Text>
      ))}

      <Text style={total}>Totalt: {order.total} kr</Text>
    </>
  );
}
