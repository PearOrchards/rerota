import "server-only";

import { prisma } from "@/lib/prisma";
import { listCompetenciesForBusiness } from "@/lib/server/competencies";
import { getRidePositionKey } from "@/lib/utils";

const LOW_COMPETENCY_COVERAGE_MULTIPLIER = 3;

export type DashboardMetrics = {
	expiringCompetencies: number;
	underCoveredRidePositions: number;
};

export async function getDashboardMetricsForBusiness(
	businessId: string,
): Promise<DashboardMetrics> {
	const [competencies, ridePositions] = await Promise.all([
		listCompetenciesForBusiness(businessId),
		prisma.ridePosition.findMany({
			where: {
				ride: { businessId },
			},
			select: {
				rideId: true,
				positionId: true,
				quantity: true,
			},
		}),
	]);

	const competentStaffIdsByRidePosition = new Map<string, Set<string>>();

	for (const competency of competencies) {
		if (competency.status === "Expired") continue;

		const key = getRidePositionKey(competency.rideId, competency.positionId);
		const competentStaffIds = competentStaffIdsByRidePosition.get(key) ?? new Set<string>();
		competentStaffIds.add(competency.staffMemberId);
		competentStaffIdsByRidePosition.set(key, competentStaffIds);
	}

	let underCoveredRidePositions = 0;

	for (const ridePosition of ridePositions) {
		const key = getRidePositionKey(ridePosition.rideId, ridePosition.positionId);
		const competentCount = competentStaffIdsByRidePosition.get(key)?.size ?? 0;

		if (competentCount < ridePosition.quantity * LOW_COMPETENCY_COVERAGE_MULTIPLIER) {
			underCoveredRidePositions += 1;
		}
	}

	return {
		expiringCompetencies: competencies.filter(
			(competency) => competency.status === "Expiring soon",
		).length,
		underCoveredRidePositions,
	};
}
