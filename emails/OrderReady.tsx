import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function OrderReadyEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  const isPickup = order.orderType === "PICKUP";

  return (
    <EmailLayout
      preview={`Order ${order.orderNumber} är klar`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        {isPickup ? "Din order är klar för avhämtning" : "Din order är klar"}
      </Heading>
      <Text style={paragraph}>
        Hej {order.customerName},{" "}
        {isPickup
          ? `order ${order.orderNumber} väntar på dig. Hämta den så snart som möjligt.`
          : `order ${order.orderNumber} är färdig och skickas snart.`}
      </Text>
      <OrderSummary order={order} />
      <Text style={{ ...paragraph, marginTop: "24px" }}>
        Frågor? Ring {order.restaurantPhone}.
      </Text>
    </EmailLayout>
  );
}
