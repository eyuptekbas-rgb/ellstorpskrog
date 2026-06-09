import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function OrderCancelledEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  return (
    <EmailLayout
      preview={`Order ${order.orderNumber} avbruten`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Order avbruten
      </Heading>
      <Text style={paragraph}>
        Hej {order.customerName}, din order {order.orderNumber} har avbrutits.
        Kontakta oss på {order.restaurantPhone} om du har frågor.
      </Text>
      <OrderSummary order={order} />
    </EmailLayout>
  );
}
