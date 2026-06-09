import { Heading, Link, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

type Props = OrderEmailData & { adminOrderUrl?: string };

export default function RestaurantOrderCancelledEmail({
  order,
  restaurantName,
  adminOrderUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Order avbruten ${order.orderNumber}`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Order avbruten
      </Heading>
      <Text style={paragraph}>
        Order {order.orderNumber} från {order.customerName} har avbrutits.
      </Text>
      <OrderSummary order={order} />
      {adminOrderUrl && (
        <Text style={{ ...paragraph, marginTop: "24px" }}>
          <Link href={adminOrderUrl} style={{ color: "#b85c38" }}>
            Visa order i admin →
          </Link>
        </Text>
      )}
    </EmailLayout>
  );
}
