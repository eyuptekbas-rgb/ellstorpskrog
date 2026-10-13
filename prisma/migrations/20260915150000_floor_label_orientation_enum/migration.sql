-- Align FloorLabel.orientation with the Prisma enum without rewriting migration history.
-- Invalid legacy values fail the cast and roll back; existing values are not coerced.
BEGIN;

CREATE TYPE "FloorLabelOrientation" AS ENUM ('HORIZONTAL', 'VERTICAL');

ALTER TABLE "FloorLabel" ALTER COLUMN "orientation" DROP DEFAULT;
ALTER TABLE "FloorLabel"
  ALTER COLUMN "orientation" TYPE "FloorLabelOrientation"
  USING ("orientation"::"FloorLabelOrientation");
ALTER TABLE "FloorLabel"
  ALTER COLUMN "orientation" SET DEFAULT 'HORIZONTAL'::"FloorLabelOrientation";

COMMIT;
