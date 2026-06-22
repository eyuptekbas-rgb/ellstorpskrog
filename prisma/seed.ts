import { OrderStatus, OrderType, PaymentMethod, PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { syncPrintedMenuForTenant } from "../lib/menu/sync-printed-menu";
import { DEFAULT_OPENING_HOURS } from "../lib/openingHours";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database…");

  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.categoryExtraOption.deleteMany();
  await prisma.extraOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.tenant.deleteMany();

  const tenant = await prisma.tenant.create({
    data: {
      slug: "ellstorps-krog",
      name: "Ellstorps Krog",
      primaryColor: "#b85c38",
      monthlySubscriptionFee: 499,
      orderFee: 2,
      invoiceEmail: "faktura@ellstorpskrog.se",
      companyName: "Ellstorps Krog AB",
      organizationNumber: "559000-0000",
      billingAddress: "Sallerupsvägen 28D\n212 18 Malmö",
    },
  });

  await prisma.siteSettings.create({
    data: {
      tenantId: tenant.id,
      restaurantName: "Ellstorps Krog",
      phone: "+46 40 18 42 68",
      email: "info@ellstorpskrog.se",
      address: "Sallerupsvägen 28D, 212 18 Malmö",
      heroImage: "/hero.jpg",
      deliveryEnabled: true,
      pickupEnabled: true,
      minimumOrder: 150,
      deliveryFee: 49,
      facebookUrl: "https://facebook.com/ellstorpskrog",
      instagramUrl: "https://instagram.com/ellstorpskrog",
      tiktokUrl: null,
      notificationEmail: "orders@ellstorpskrog.se",
      customerEmailsEnabled: true,
      restaurantEmailsEnabled: true,
      metaTitle: "Ellstorps Krog — Restaurang i Malmö",
      metaDescription:
        "Beställ pizza, kebab och husmanskost online hos Ellstorps Krog i Malmö. Avhämtning och hemleverans.",
      ogImage: "/hero.jpg",
      keywords:
        "restaurang malmö, pizza malmö, kebab, hemleverans, ellstorps krog",
      googleAnalyticsId: null,
      googleTagManagerId: null,
      googleAdsConversionId: null,
      metaPixelId: null,
      googleAnalyticsEnabled: false,
      googleTagManagerEnabled: false,
      googleAdsEnabled: false,
      metaPixelEnabled: false,
    },
  });

  const openingHoursSeed = DEFAULT_OPENING_HOURS;

  for (const h of openingHoursSeed) {
    await prisma.openingHours.create({ data: { tenantId: tenant.id, ...h } });
  }

  await prisma.deliveryZone.create({
    data: {
      tenantId: tenant.id,
      name: "Malmö centrum",
      postalCodes: "21218, 21219, 21220, 21221",
      deliveryFee: 49,
      minimumOrder: 150,
    },
  });

  await prisma.deliveryZone.create({
    data: {
      tenantId: tenant.id,
      name: "Malmö syd",
      postalCodes: "21422, 21423, 21424",
      deliveryFee: 69,
      minimumOrder: 200,
    },
  });

  const adminPassword =
    process.env.ADMIN_INITIAL_PASSWORD ?? "ChangeMe123!";
  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.create({
    data: {
      email: "admin@ordina.se",
      name: "Ordina Admin",
      role: UserRole.PLATFORM_ADMIN,
      passwordHash,
    },
  });

  await prisma.user.create({
    data: {
      email: "admin@ellstorpskrog.se",
      name: "Admin",
      phone: "+46 40 18 42 68",
      role: UserRole.ADMIN,
      tenantId: tenant.id,
      passwordHash,
    },
  });

  console.log("Platform admin: admin@ordina.se");
  console.log("Tenant admin: admin@ellstorpskrog.se");
  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.log("Default password: ChangeMe123! (set ADMIN_INITIAL_PASSWORD to override)");
  }

  const menuSync = await syncPrintedMenuForTenant(tenant.slug);
  console.log("Printed menu synced:", menuSync);

  await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: "EK-000001",
      customerName: "Anna Andersson",
      customerPhone: "+46 70 123 45 67",
      customerEmail: "anna@example.com",
      orderType: OrderType.PICKUP,
      paymentMethod: PaymentMethod.CARD,
      note: "Utan lök tack",
      total: 301,
      status: OrderStatus.NEW,
      items: {
        create: [
          {
            productName: "Margherita",
            quantity: 1,
            unitPrice: 121,
            totalPrice: 121,
          },
          {
            productName: "Kebabrulle",
            quantity: 1,
            unitPrice: 140,
            totalPrice: 140,
          },
          {
            productName: "Coca-Cola 33 cl",
            quantity: 1,
            unitPrice: 35,
            totalPrice: 35,
          },
        ],
      },
      statusHistory: {
        create: [{ status: OrderStatus.NEW }],
      },
    },
  });

  await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: "EK-000002",
      customerName: "Erik Johansson",
      customerPhone: "+46 73 987 65 43",
      customerEmail: "erik@example.com",
      customerAddress: "Storgatan 12, Malmö",
      orderType: OrderType.DELIVERY,
      paymentMethod: PaymentMethod.CARD,
      total: 260,
      status: OrderStatus.CONFIRMED,
      items: {
        create: [
          {
            productName: "Entrecôte",
            quantity: 1,
            unitPrice: 260,
            totalPrice: 260,
          },
        ],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.NEW },
          { status: OrderStatus.CONFIRMED },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
