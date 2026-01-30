/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `businessId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Position` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Ride` table without a default value. This is not possible if the table is not empty.
  - Added the required column `businessId` to the `Tier` table without a default value. This is not possible if the table is not empty.

*/
-- Add businessId columns, but as nullable first
ALTER TABLE "Category" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Position" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Ride" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Tier" ADD COLUMN "businessId" TEXT;

-- For Ride, we can infer businessId from the tier's business (via StaffMember competencies)
-- For others, we'll use the first business as default
UPDATE "Category" SET "businessId" = (SELECT "id" FROM "Business" LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Tier" SET "businessId" = (SELECT "id" FROM "Business" LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Position" SET "businessId" = (SELECT "id" FROM "Business" LIMIT 1) WHERE "businessId" IS NULL;
UPDATE "Ride" SET "businessId" = (SELECT "id" FROM "Business" LIMIT 1) WHERE "businessId" IS NULL;

-- Update columns as NOT NULL
ALTER TABLE "Category" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Position" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Ride" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Tier" ALTER COLUMN "businessId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tier" ADD CONSTRAINT "Tier_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
