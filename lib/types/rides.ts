import { Ride } from "@/generated/prisma/client";

export interface RideWithExtra extends Ride {
    competenciesCount: number;
}