import { Heading, Link, Section, Text } from "@react-email/components";
import * as React from "react";
import {
  EmailLayout,
  card,
  itemRow,
  label,
  paragraph,
  total,
  value,
} from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

type RestaurantNewOrderEmailProps = OrderEmailData & {
  adminOrderUrl?: string;
};

export default function RestaurantNewOrderEmail({
  order,
  restaurantName,
  adminOrderUrl,
}: RestaurantNewOrderEmailProps) {
  return (
    <EmailLayout
      preview={`Ny order ${order.orderNumber}`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Ny order
      </Heading>
      <Text style={paragraph}>
        En ny order har lagts via webbplatsen. Granska och bekräfta i adminpanelen.
      </Text>

      <Section style={card}>
        <Text style={label}>Ordernummer</Text>
        <Text style={value}>{order.orderNumber}</Text>

        <Text style={label}>Kund</Text>
        <Text style={value}>{order.customerName}</Text>

        <Text style={label}>Telefon</Text>
        <Text style={value}>{order.customerPhone}</Text>

        <Text style={label}>E-post</Text>
        <Text style={value}>{order.customerEmail}</Text>

        <Text style={label}>Beställningstyp</Text>
        <Text style={value}>{order.orderTypeLabel}</Text>

        <Text style={label}>Betalning</Text>
        <Text style={value}>{order.paymentLabel}</Text>

        {order.customerAddress && (
          <>
            <Text style={label}>Adress</Text>
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

      {adminOrderUrl && (
        <Text style={{ ...paragraph, marginTop: "24px" }}>
          <Link href={adminOrderUrl} style={{ color: "#b85c38" }}>
            Öppna order i admin →
          </Link>
        </Text>
      )}
    </EmailLayout>
  );
}
