import { Heading, Text } from "@react-email/components";
import * as React from "react";
import { OrderSummary } from "@/emails/components/OrderSummary";
import { EmailLayout, paragraph } from "@/emails/components/EmailLayout";
import type { OrderEmailData } from "@/lib/email/types";

export default function OrderCompletedEmail({
  order,
  restaurantName,
}: OrderEmailData) {
  const isPickup = order.orderType === "PICKUP";

  return (
    <EmailLayout
      preview={`Order ${order.orderNumber} slutförd`}
      restaurantName={restaurantName}
    >
      <Heading style={{ color: "#18181b", fontSize: "20px", margin: "0 0 8px" }}>
        Order slutförd
      </Heading>
      <Text style={paragraph}>
        Hej {order.customerName},{" "}
        {isPickup
          ? `tack för att du hämtade order ${order.orderNumber}. Vi hoppas maten smakade!`
          : `din order ${order.orderNumber} har levererats. Smaklig måltid!`}
      </Text>
      <OrderSummary order={order} />
    </EmailLayout>
  );
}
