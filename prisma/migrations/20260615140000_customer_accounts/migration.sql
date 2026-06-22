-- Customer account profiles, saved addresses, favorite orders, loyalty points

ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FavoriteOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "itemsJson" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Reservation" ADD COLUMN "userId" TEXT;

CREATE INDEX "CustomerAddress_userId_idx" ON "CustomerAddress"("userId");
CREATE INDEX "FavoriteOrder_userId_idx" ON "FavoriteOrder"("userId");
CREATE INDEX "Reservation_userId_idx" ON "Reservation"("userId");

ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FavoriteOrder" ADD CONSTRAINT "FavoriteOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
