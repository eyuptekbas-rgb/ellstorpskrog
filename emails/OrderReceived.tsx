import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function OrderReceivedEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  const hasWaitTime =
    order.estimatedReadyMinutes != null && order.estimatedReadyMinutes > 0;

  return (
    <EmailLayout
      preview={
        hasWaitTime
          ? `Forventet ventetid ${order.estimatedReadyMinutes} min — ${order.orderNumber}`
          : `Order mottagen ${order.orderNumber}`
      }
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        {hasWaitTime ? "Bestilling bekræftet" : "Order mottagen"}
      </Heading>
      <Text style={paragraph}>
        {hasWaitTime ? (
          <>
            Hej {order.customerName}, din bestilling {order.orderNumber} er
            bekræftet. Forventet ventetid: {order.estimatedReadyMinutes}{" "}
            minutter.
          </>
        ) : (
          <>
            Hej {order.customerName}, tack för din beställning! Vi har mottagit
            order {order.orderNumber} och behandlar den så snart som möjligt.
          </>
        )}
      </Text>
      <OrderSummary order={order} />
      <Text style={{ ...paragraph, marginTop: "24px" }}>
        Vid frågor, kontakta oss på {order.restaurantPhone} eller{" "}
        {order.restaurantEmail}.
      </Text>
    </EmailLayout>
  );
}
