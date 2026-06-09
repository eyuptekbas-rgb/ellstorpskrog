import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function OrderReceivedEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  return (
    <EmailLayout
      preview={`Order mottagen ${order.orderNumber}`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Order mottagen
      </Heading>
      <Text style={paragraph}>
        Hej {order.customerName}, tack för din beställning! Vi har mottagit order{" "}
        {order.orderNumber} och behandlar den så snart som möjligt.
      </Text>
      <OrderSummary order={order} />
      <Text style={{ ...paragraph, marginTop: "24px" }}>
        Vid frågor, kontakta oss på {order.restaurantPhone} eller{" "}
        {order.restaurantEmail}.
      </Text>
    </EmailLayout>
  );
}
