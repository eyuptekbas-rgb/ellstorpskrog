import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  await prisma.tenant.update({
    where: { slug: "ellstorps-krog" },
    data: {
      monthlySubscriptionFee: 499,
      orderFee: 2,
      invoiceEmail: "faktura@ellstorpskrog.se",
      companyName: "Ellstorps Krog AB",
      organizationNumber: "559000-0000",
      billingAddress: "Sallerupsvägen 28D\n212 18 Malmö",
    },
  });
  console.log("Billing fields updated for ellstorps-krog");
  await prisma.$disconnect();
}

main().catch(console.error);
