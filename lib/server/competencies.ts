import "server-only";

import { prisma } from "@/lib/prisma";
import type { CompetencyWithExpiry } from "@/lib/types/competency";

const COMPETENCY_EXPIRY_CATEGORY = "Competency Break until Lost";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const addDays = (date: Date, days: number): Date =>
	new Date(date.getTime() + days * DAY_IN_MS);

const getReferenceDate = (achievedAt: Date, lastRotatedAt: Date | null): Date =>
	lastRotatedAt ?? achievedAt;

async function getExpiryCategoryId(businessId: string): Promise<string | null> {
	const category = await prisma.category.findFirst({
		where: {
			businessId,
			name: COMPETENCY_EXPIRY_CATEGORY,
		},
		select: { id: true },
	});

	return category?.id ?? null;
}

// Caller must ensure the business scope is already authorized.
export async function listCompetenciesForBusiness(
	businessId: string,
): Promise<CompetencyWithExpiry[]> {
	const competencies = await prisma.competency.findMany({
		where: {
			staffMember: { businessId },
			ride: { businessId },
			position: { businessId },
		},
		include: {
			staffMember: {
				select: {
					firstName: true,
					lastName: true,
				},
			},
			ride: {
				select: {
					id: true,
					name: true,
					tierId: true,
					tier: {
						select: {
							name: true,
						},
					},
				},
			},
			position: {
				select: {
					name: true,
				},
			},
		},
		orderBy: [
			{ staffMember: { lastName: "asc" } },
			{ staffMember: { firstName: "asc" } },
			{ ride: { name: "asc" } },
			{ position: { name: "asc" } },
		],
	});

	if (!competencies.length) {
		return [];
	}

	const matrixByTierAndPosition = new Map<string, number>();
	const categoryId = await getExpiryCategoryId(businessId);

	if (categoryId) {
		const uniqueTierIds = Array.from(new Set(competencies.map((entry) => entry.ride.tierId)));
		const uniquePositionIds = Array.from(new Set(competencies.map((entry) => entry.positionId)));

		const numberMatrixRows = await prisma.numberMatrix.findMany({
			where: {
				categoryId,
				tierId: { in: uniqueTierIds },
				positionId: { in: uniquePositionIds },
			},
			select: {
				tierId: true,
				positionId: true,
				time: true,
			},
		});

		for (const numberMatrixRow of numberMatrixRows) {
			matrixByTierAndPosition.set(
				`${numberMatrixRow.tierId}:${numberMatrixRow.positionId}`,
				numberMatrixRow.time,
			);
		}
	}

	const now = new Date();
	return competencies.map((competency) => {
		const referenceDate = getReferenceDate(competency.achievedAt, competency.last_rotatedAt);
		const expiryWindowDays = matrixByTierAndPosition.get(
			`${competency.ride.tierId}:${competency.positionId}`,
		) ?? null;

		const expiresAt = expiryWindowDays === null ? null : addDays(referenceDate, expiryWindowDays);
		const daysRemaining = expiresAt === null
			? null
			: Math.ceil((expiresAt.getTime() - now.getTime()) / DAY_IN_MS);

		let status: CompetencyWithExpiry["status"] = "Not configured";
		if (daysRemaining !== null) {
			if (daysRemaining < 0) {
				status = "Expired";
			} else if (daysRemaining <= 14) {
				status = "Expiring soon";
			} else {
				status = "Current";
			}
		}

		return {
			staffMemberId: competency.staffMemberId,
			rideId: competency.rideId,
			positionId: competency.positionId,
			staffMemberName: `${competency.staffMember.firstName} ${competency.staffMember.lastName}`,
			rideName: competency.ride.name,
			positionName: competency.position.name,
			tierName: competency.ride.tier.name,
			achievedAt: competency.achievedAt,
			lastRotatedAt: competency.last_rotatedAt,
			expiryWindowDays,
			expiresAt,
			daysRemaining,
			status,
		};
	});
}
