import { Position, Ride, Tier } from "@/generated/prisma/client";

export interface RideWithExtra extends Ride {
	competenciesCount: number;
	tier: Tier;
	positions: Position[];
}

export type RideFormData = Ride & {
	positionIds: string[];
};
