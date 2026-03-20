-- CreateEnum
CREATE TYPE "RotaStatus" AS ENUM ('DRAFT', 'READY', 'ACTIVE', 'ARCHIVED');

-- DropIndex
DROP INDEX "RidePosition_positionId_idx";

-- CreateTable
CREATE TABLE "Rota" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "applicableDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "RotaStatus" NOT NULL,

    CONSTRAINT "Rota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RotaDetail" (
    "staffMemberId" TEXT NOT NULL,
    "parentRotaId" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,

    CONSTRAINT "RotaDetail_pkey" PRIMARY KEY ("staffMemberId","parentRotaId","rideId","positionId")
);

-- AddForeignKey
ALTER TABLE "Rota" ADD CONSTRAINT "Rota_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaDetail" ADD CONSTRAINT "RotaDetail_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaDetail" ADD CONSTRAINT "RotaDetail_parentRotaId_fkey" FOREIGN KEY ("parentRotaId") REFERENCES "Rota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaDetail" ADD CONSTRAINT "RotaDetail_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaDetail" ADD CONSTRAINT "RotaDetail_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
