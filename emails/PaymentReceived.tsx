import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function PaymentReceivedEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  return (
    <EmailLayout
      preview={`Betalning mottagen ${order.orderNumber}`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Betalning mottagen
      </Heading>
      <Text style={paragraph}>
        Hej {order.customerName}, vi har tagit emot din betalning på {order.total}{" "}
        kr för order {order.orderNumber}. Tack!
      </Text>
      <OrderSummary order={order} />
    </EmailLayout>
  );
}
