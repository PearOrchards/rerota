import { RotaStatus } from "@/generated/prisma/client";

export type RotaAssignmentInput = {
	staffMemberId: string;
	rideId: string;
	positionId: string;
};

export type JoinedRota = {
	id: string;
	status: RotaStatus;
	applicableDate: Date;
	details: RotaAssignmentInput[];
};