import "server-only";

import { prisma } from "@/lib/prisma";
import { listCompetenciesForBusiness } from "@/lib/server/competencies";
import type { DashboardMetrics, DashboardTask } from "@/lib/types/dashboard";
import { getRidePositionKey } from "@/lib/utils";

const LOW_COMPETENCY_COVERAGE_MULTIPLIER = 3;

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
		const competentStaffIds =
      competentStaffIdsByRidePosition.get(key) ?? new Set<string>();
		competentStaffIds.add(competency.staffMemberId);
		competentStaffIdsByRidePosition.set(key, competentStaffIds);
	}

	let underCoveredRidePositions = 0;

	for (const ridePosition of ridePositions) {
		const key = getRidePositionKey(
			ridePosition.rideId,
			ridePosition.positionId,
		);
		const competentCount = competentStaffIdsByRidePosition.get(key)?.size ?? 0;

		if (
			competentCount <
      ridePosition.quantity * LOW_COMPETENCY_COVERAGE_MULTIPLIER
		) {
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

export async function getDashboardTasksForBusiness(
	businessId: string,
): Promise<DashboardTask[]> {
	const [metrics, ridesCount, staffCount, competenciesCount] =
    await Promise.all([
    	getDashboardMetricsForBusiness(businessId),
    	prisma.ride.count({ where: { businessId } }),
    	prisma.staffMember.count({ where: { businessId } }),
    	prisma.competency.count({ where: { staffMember: { businessId } } }),
    ]);

	const tasks: DashboardTask[] = [];

	if (metrics.expiringCompetencies > 0) {
		tasks.push({
			id: "expiring-competencies",
			title: "Review expiring competencies",
			description: `${metrics.expiringCompetencies} competencies are due within 14 days.`,
			href: "/competencies",
			priority: 100,
		});
	}

	if (metrics.underCoveredRidePositions > 0) {
		tasks.push({
			id: "under-covered-ride-positions",
			title: "Audit rides with thin cover",
			description: `${metrics.underCoveredRidePositions} positions are below the recommended coverage threshold.`,
			href: "/rides",
			priority: 90,
		});
	}

	if (competenciesCount === 0 && ridesCount > 0 && staffCount > 0) {
		tasks.push({
			id: "missing-competencies",
			title: "Add your first competencies",
			description: "Staff and rides exist, but no competencies have been recorded yet.",
			href: "/competencies",
			priority: 80,
		});
	}

	if (ridesCount === 0) {
		tasks.push({
			id: "missing-rides",
			title: "Create your first ride",
			description: "No rides are configured for this business.",
			href: "/rides",
			priority: 70,
		});
	}

	if (staffCount === 0) {
		tasks.push({
			id: "missing-staff",
			title: "Add staff members",
			description: "No staff are configured for this business.",
			href: "/staff",
			priority: 70,
		});
	}

	if (!tasks.length) {
		tasks.push({
			id: "healthy",
			title: "Everything looks healthy",
			description: "Congratulations! Keep up the good work.",
			href: "/competencies",
			priority: 10,
		});
	}

	return tasks
		.sort((firstTask, secondTask) => secondTask.priority - firstTask.priority)
		.slice(0, 4);
}
