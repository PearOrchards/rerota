export type CompetencyStatus = "Current" | "Expiring soon" | "Expired" | "Not configured";

export type CompetencyKey = {
	staffMemberId: string;
	rideId: string;
	positionId: string;
};

export interface CompetencyWithExpiry {
	staffMemberId: string;
	rideId: string;
	positionId: string;
	staffMemberName: string;
	rideName: string;
	positionName: string;
	tierName: string;
	achievedAt: Date;
	lastRotatedAt: Date | null;
	expiryWindowDays: number | null;
	expiresAt: Date | null;
	daysRemaining: number | null;
	status: CompetencyStatus;
}

export type CompetencyDateUpdateData = CompetencyKey & {
	achievedAt: string;
	lastRotatedAt: string | null;
};

export type CompetencyCreateData = CompetencyKey & {
	achievedAt: string;
	lastRotatedAt: string | null;
};

export interface CompetencyCreateStaffOption {
	id: string;
	name: string;
}

export interface CompetencyCreatePositionOption {
	id: string;
	name: string;
}

export interface CompetencyCreateRideOption {
	id: string;
	name: string;
	tierName: string;
	positions: CompetencyCreatePositionOption[];
}

export interface CompetencyCreateContext {
	staff: CompetencyCreateStaffOption[];
	rides: CompetencyCreateRideOption[];
}
