-- CreateTable
CREATE TABLE "RidePosition" (
    "rideId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RidePosition_pkey" PRIMARY KEY ("rideId","positionId")
);

-- Backfill existing ride-position pairs from implicit many-to-many relation
INSERT INTO "RidePosition" ("rideId", "positionId", "quantity")
SELECT "B", "A", 1
FROM "_PositionToRide";

-- CreateIndex
CREATE INDEX "RidePosition_positionId_idx" ON "RidePosition"("positionId");

-- AddForeignKey
ALTER TABLE "RidePosition" ADD CONSTRAINT "RidePosition_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePosition" ADD CONSTRAINT "RidePosition_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old implicit relation table
DROP TABLE "_PositionToRide";
