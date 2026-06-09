import { Heading, Link, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

type Props = OrderEmailData & { adminOrderUrl?: string };

export default function RestaurantPaymentReceivedEmail({
  order,
  restaurantName,
  adminOrderUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Betalning mottagen ${order.orderNumber}`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Betalning mottagen
      </Heading>
      <Text style={paragraph}>
        Betalning på {order.total} kr har mottagits för order {order.orderNumber}{" "}
        ({order.customerName}).
      </Text>
      <OrderSummary order={order} />
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
