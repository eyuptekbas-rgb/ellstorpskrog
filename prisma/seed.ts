import { OrderStatus, OrderType, PaymentMethod, PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { DEFAULT_OPENING_HOURS } from "../lib/openingHours";

const prisma = new PrismaClient();

const categories = [
  {
    slug: "pizza",
    name: "Pizza",
    sortOrder: 1,
    products: [
      {
        name: "Margherita",
        description: "Tomatsås, mozzarella, färsk basilika och olivolja.",
        price: 109,
        options: [
          { name: "Extra ost", priceModifier: 15 },
          { name: "Glutenfri botten", priceModifier: 25 },
        ],
      },
      {
        name: "Capricciosa",
        description: "Skinka, champinjoner, oliver och riven ost.",
        price: 129,
        options: [{ name: "Extra skinka", priceModifier: 20 }],
      },
      {
        name: "Kebabpizza",
        description: "Kebabkött, lök, feferoni, kebabsås och ost.",
        price: 125,
        options: [
          { name: "Extra kebab", priceModifier: 25 },
          { name: "Stark sås", priceModifier: 0 },
        ],
      },
      {
        name: "Quattro Stagioni",
        description: "Skinka, champinjoner, räkor och artiskock.",
        price: 135,
        options: [],
      },
    ],
  },
  {
    slug: "kebab",
    name: "Kebab",
    sortOrder: 2,
    products: [
      {
        name: "Kebabrulle",
        description: "Mört kebabkött, sallad, lök och valfri sås i tunnbröd.",
        price: 95,
        options: [
          { name: "Extra sås", priceModifier: 5 },
          { name: "Pommes i rulle", priceModifier: 15 },
        ],
      },
      {
        name: "Kebabtallrik",
        description: "Kebabkött serveras med pommes, sallad och sås.",
        price: 115,
        options: [{ name: "Extra kött", priceModifier: 25 }],
      },
      {
        name: "Döner kebab",
        description: "Klassisk döner med färska grönsaker och vitlökssås.",
        price: 105,
        options: [],
      },
      {
        name: "Kyckling kebab",
        description: "Marinerad kyckling, ris, sallad och hemgjord sås.",
        price: 110,
        options: [{ name: "Byt till pommes", priceModifier: 0 }],
      },
    ],
  },
  {
    slug: "burgare",
    name: "Burgare",
    sortOrder: 3,
    products: [
      {
        name: "Classic Burger",
        description: "Nötfärs, sallad, tomat, lök och husets burgarsås.",
        price: 99,
        options: [
          { name: "Extra ost", priceModifier: 10 },
          { name: "Bacon", priceModifier: 15 },
        ],
      },
      {
        name: "Cheese Burger",
        description: "Dubbel ost, picklad gurka, sallad och pommes.",
        price: 109,
        options: [],
      },
      {
        name: "Ellstorps Special",
        description: "Bacon, cheddar, karamelliserad lök och BBQ-sås.",
        price: 129,
        options: [{ name: "Dubbel patty", priceModifier: 30 }],
      },
      {
        name: "Veggie Burger",
        description: "Veggiebiff, avokado, ruccola och vitlöksaioli.",
        price: 95,
        options: [],
      },
    ],
  },
  {
    slug: "grill",
    name: "Grillrätter",
    sortOrder: 4,
    products: [
      {
        name: "Grillspett",
        description: "Marinerade spett med ris, grillad paprika och tzatziki.",
        price: 139,
        options: [],
      },
      {
        name: "Entrecôte",
        description: "250 g entrecôte, bearnaisesås, pommes och sallad.",
        price: 189,
        options: [{ name: "Medium stekning", priceModifier: 0, required: true }],
      },
      {
        name: "Kycklingfilé",
        description: "Grillad kyckling, rostad potatis och vitlökssmör.",
        price: 145,
        options: [],
      },
      {
        name: "Fläskfilé",
        description: "Fläskfilé, pepparsås, ugnsrostade grönsaker och potatis.",
        price: 155,
        options: [],
      },
    ],
  },
  {
    slug: "drycker",
    name: "Drycker",
    sortOrder: 5,
    products: [
      {
        name: "Coca-Cola 33 cl",
        description: "Klassisk Coca-Cola, serveras kall.",
        price: 25,
        options: [],
      },
      {
        name: "Läsk Light",
        description: "Fanta, Sprite eller Pepsi Max – välj vid beställning.",
        price: 25,
        options: [],
      },
      {
        name: "Mineralvatten",
        description: "Kolsyrat eller stilla mineralvatten 50 cl.",
        price: 22,
        options: [],
      },
      {
        name: "Folköl",
        description: "Kall öl på fat eller flaska, fråga personalen.",
        price: 45,
        options: [],
      },
    ],
  },
];

async function main() {
  console.log("Seeding database…");

  await prisma.orderItem.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.deliveryZone.deleteMany();
  await prisma.openingHours.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();

  await prisma.siteSettings.create({
    data: {
      id: 1,
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
    await prisma.openingHours.create({ data: h });
  }

  await prisma.deliveryZone.create({
    data: {
      name: "Malmö centrum",
      postalCodes: "21218, 21219, 21220, 21221",
      deliveryFee: 49,
      minimumOrder: 150,
    },
  });

  await prisma.deliveryZone.create({
    data: {
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
      email: "admin@ellstorpskrog.se",
      name: "Admin",
      phone: "+46 40 18 42 68",
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  console.log("Admin user: admin@ellstorpskrog.se");
  if (!process.env.ADMIN_INITIAL_PASSWORD) {
    console.log("Default password: ChangeMe123! (set ADMIN_INITIAL_PASSWORD to override)");
  }

  for (const category of categories) {
    const createdCategory = await prisma.category.create({
      data: {
        slug: category.slug,
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });

    for (const [index, product] of category.products.entries()) {
      await prisma.product.create({
        data: {
          categoryId: createdCategory.id,
          name: product.name,
          description: product.description,
          price: product.price,
          sortOrder: index,
          options: {
            create: product.options.map((opt, optIndex) => ({
              name: opt.name,
              priceModifier: opt.priceModifier,
              required:
                "required" in opt && typeof opt.required === "boolean"
                  ? opt.required
                  : false,
              sortOrder: optIndex,
            })),
          },
        },
      });
    }
  }

  await prisma.order.create({
    data: {
      orderNumber: "EK-000001",
      customerName: "Anna Andersson",
      customerPhone: "+46 70 123 45 67",
      customerEmail: "anna@example.com",
      orderType: OrderType.PICKUP,
      paymentMethod: PaymentMethod.ON_PICKUP,
      note: "Utan lök tack",
      total: 234,
      status: OrderStatus.NEW,
      items: {
        create: [
          {
            productName: "Margherita",
            quantity: 1,
            unitPrice: 109,
            totalPrice: 109,
          },
          {
            productName: "Kebabrulle",
            quantity: 1,
            unitPrice: 95,
            totalPrice: 95,
          },
          {
            productName: "Coca-Cola 33 cl",
            quantity: 2,
            unitPrice: 25,
            totalPrice: 50,
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
      orderNumber: "EK-000002",
      customerName: "Erik Johansson",
      customerPhone: "+46 73 987 65 43",
      customerEmail: "erik@example.com",
      customerAddress: "Storgatan 12, Malmö",
      orderType: OrderType.DELIVERY,
      paymentMethod: PaymentMethod.CARD,
      total: 189,
      status: OrderStatus.CONFIRMED,
      items: {
        create: [
          {
            productName: "Entrecôte",
            quantity: 1,
            unitPrice: 189,
            totalPrice: 189,
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
