import { Position, Ride, RidePosition, Tier } from "@/generated/prisma/client";

export type RidePositionQuantity = {
	positionId: string;
	quantity: number;
};

export interface RidePositionWithPosition extends RidePosition {
	position: Position;
}

export interface RideWithExtra extends Ride {
	competenciesCount: number;
	tier: Tier;
	ridePositions: RidePositionWithPosition[];
}

export type RideFormData = Ride & {
	positionQuantities: RidePositionQuantity[];
};
