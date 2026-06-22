import { OrderType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureSiteSettings } from "@/lib/settings";
import { matchDeliveryZone } from "@/lib/settings/utils";
import type { OrderItemInput } from "@/lib/orders/create-order";

export type OrderItemPayload = {
  productId?: string;
  productName: string;
  quantity: number;
  price: number;
  selectedOptionIds?: string[];
};

export type ValidateOrderPricingInput = {
  tenantId: string;
  orderType: OrderType;
  items: OrderItemPayload[];
  customerAddress?: string;
  clientTotal?: number;
  clientDeliveryFee?: number;
  clientSubtotal?: number;
};

export type ValidatedOrderPricing = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: OrderItemInput[];
};

export class OrderPricingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function validateOrderPricing(
  input: ValidateOrderPricingInput
): Promise<ValidatedOrderPricing> {
  const { tenantId, orderType, items, customerAddress } = input;

  if (!items.length) {
    throw new OrderPricingError("Order must contain at least one item");
  }

  const [settings, zones] = await Promise.all([
    ensureSiteSettings(tenantId),
    prisma.deliveryZone.findMany({ where: { tenantId } }),
  ]);

  const validatedItems: OrderItemInput[] = [];
  let subtotal = 0;

  for (const item of items) {
    if (!item.productId?.trim()) {
      throw new OrderPricingError("Each item must include productId");
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw new OrderPricingError("Invalid item quantity");
    }

    const product = await prisma.product.findFirst({
      where: {
        id: item.productId,
        active: true,
        soldOut: false,
        category: { tenantId },
      },
      include: {
        category: {
          include: {
            extraOptions: {
              include: { extraOption: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new OrderPricingError("Invalid or unavailable product in order");
    }

    const optionIds = [...new Set(item.selectedOptionIds ?? [])];
    let optionTotal = 0;

    if (optionIds.length > 0) {
      const allowed = new Map(
        product.category.extraOptions
          .filter((row) => row.extraOption.active)
          .map((row) => [row.extraOption.id, row.extraOption])
      );

      for (const optionId of optionIds) {
        const option = allowed.get(optionId);
        if (!option || option.tenantId !== tenantId) {
          throw new OrderPricingError("Invalid extra option for product");
        }
        optionTotal += option.priceModifier;
      }
    }

    const expectedUnitPrice = product.price + optionTotal;

    // Always trust server-side catalog pricing. Client cart totals can be stale
    // after menu edits; the order is charged using expectedUnitPrice below.
    subtotal += expectedUnitPrice * item.quantity;
    validatedItems.push({
      productId: product.id,
      productName: item.productName.trim() || product.name,
      quantity: item.quantity,
      price: expectedUnitPrice,
    });
  }

  let deliveryFee = 0;
  let minimumOrder = settings.minimumOrder;

  if (orderType === OrderType.DELIVERY) {
    if (!settings.deliveryEnabled) {
      throw new OrderPricingError("Delivery is not available");
    }
    if (!customerAddress?.trim()) {
      throw new OrderPricingError("Address is required for delivery");
    }
    const match = matchDeliveryZone(customerAddress, zones, settings);
    if (zones.length > 0 && !match.zone) {
      throw new OrderPricingError("Address is outside delivery area");
    }
    deliveryFee = match.deliveryFee;
    minimumOrder = match.minimumOrder;
  } else if (!settings.pickupEnabled) {
    throw new OrderPricingError("Pickup is not available");
  }

  if (minimumOrder > 0 && subtotal < minimumOrder) {
    throw new OrderPricingError(
      `Minimum order is ${minimumOrder} kr (excluding delivery fee)`
    );
  }

  const total = subtotal + deliveryFee;

  return { subtotal, deliveryFee, total, items: validatedItems };
}
