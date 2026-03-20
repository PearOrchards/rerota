"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { listCompetenciesForBusiness } from "@/lib/server/competencies";
import type { ModifyResponse } from "@/lib/types/common";
import type {
	CompetencyCreateContext,
	CompetencyCreateData,
	CompetencyDateUpdateData,
	CompetencyKey,
	CompetencyWithExpiry,
} from "@/lib/types/competency";
import { extractReadableErrorMessage } from "@/lib/utils";

const COMPETENCY_EXPIRY_CATEGORY = "Competency Break until Lost";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const addDays = (date: Date, days: number): Date =>
	new Date(date.getTime() + days * DAY_IN_MS);

const getReferenceDate = (achievedAt: Date, lastRotatedAt: Date | null): Date =>
	lastRotatedAt ?? achievedAt;

const parseDate = (dateValue: string, fieldName: string): Date => {
	if (!dateValue) throw new Error(`${fieldName} is required.`);

	const parsed = new Date(`${dateValue}T12:00:00.000Z`); // Using midday UTC to avoid timezone issues
	if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${fieldName.toLowerCase()}.`);

	return parsed;
};

const validateDates = (achievedAt: Date, lastRotatedAt: Date | null) => {
	const now = new Date();

	if (achievedAt > now) {
		throw new Error("Achieved date cannot be in the future.");
	}
	if (lastRotatedAt && lastRotatedAt < achievedAt) {
		throw new Error("Last rotated date cannot be earlier than the achieved date.");
	}
	if (lastRotatedAt && lastRotatedAt > now) {
		throw new Error("Last rotated date cannot be in the future.");
	}
};

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

async function getExpiryWindowDays(
	businessId: string,
	tierId: string,
	positionId: string,
): Promise<number | null> {
	const categoryId = await getExpiryCategoryId(businessId);
	if (!categoryId) {
		return null;
	}

	const numberMatrixEntry = await prisma.numberMatrix.findFirst({
		where: {
			categoryId,
			tierId,
			positionId,
		},
		select: { time: true },
	});

	return numberMatrixEntry?.time ?? null;
}

async function validateCompetencyExpiryWindow(
	businessId: string,
	tierId: string,
	positionId: string,
	referenceDate: Date,
): Promise<void> {
	const expiryWindowDays = await getExpiryWindowDays(businessId, tierId, positionId);
	if (expiryWindowDays === null) {
		throw new Error("Set up 'Competency Break until Lost' in Number Matrix before saving competency.");
	}

	const expiresAt = addDays(referenceDate, expiryWindowDays);
	if (expiresAt <= new Date()) {
		throw new Error("Dates would make this competency expired. Pick more recent dates.");
	}
}

export async function getCompetencyCreateContext(): Promise<CompetencyCreateContext> {
	const session = await requirePermission("competency:CREATE");

	const [staffMembers, rides] = await Promise.all([
		prisma.staffMember.findMany({
			where: { businessId: session.businessId },
			orderBy: [
				{ lastName: "asc" },
				{ firstName: "asc" },
			],
			select: {
				id: true,
				firstName: true,
				lastName: true,
			},
		}),
		prisma.ride.findMany({
			where: { businessId: session.businessId },
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				tier: {
					select: {
						name: true,
					},
				},
				ridePositions: {
					orderBy: {
						position: {
							order: "asc",
						},
					},
					select: {
						position: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		}),
	]);

	return {
		staff: staffMembers.map((staffMember) => ({
			id: staffMember.id,
			name: `${staffMember.firstName} ${staffMember.lastName}`,
		})),
		rides: rides.map((ride) => ({
			id: ride.id,
			name: ride.name,
			tierName: ride.tier.name,
			positions: ride.ridePositions.map((ridePosition) => ({
				id: ridePosition.position.id,
				name: ridePosition.position.name,
			})),
		})),
	};
}

export async function getCompetencies(): Promise<CompetencyWithExpiry[]> {
	const session = await requirePermission("competency:READ");
	return await listCompetenciesForBusiness(session.businessId);
}

export async function createCompetency(data: CompetencyCreateData): Promise<ModifyResponse> {
	const session = await requirePermission("competency:CREATE");

	try {
		const achievedAt = parseDate(data.achievedAt, "Achieved date");
		const lastRotatedAt = data.lastRotatedAt
			? parseDate(data.lastRotatedAt, "Last rotated date")
			: null;
		validateDates(achievedAt, lastRotatedAt);

		const [staffMember, ride, position, existingCompetency] = await Promise.all([
			prisma.staffMember.findFirst({
				where: {
					id: data.staffMemberId,
					businessId: session.businessId,
				},
				select: { id: true },
			}),
			prisma.ride.findFirst({
				where: {
					id: data.rideId,
					businessId: session.businessId,
				},
				select: {
					id: true,
					tierId: true,
					ridePositions: {
						where: {
							positionId: data.positionId,
						},
						select: {
							positionId: true,
						},
					},
				},
			}),
			prisma.position.findFirst({
				where: {
					id: data.positionId,
					businessId: session.businessId,
				},
				select: { id: true },
			}),
			prisma.competency.findUnique({
				where: {
					staffMemberId_rideId_positionId: {
						staffMemberId: data.staffMemberId,
						rideId: data.rideId,
						positionId: data.positionId,
					},
				},
				select: {
					staffMemberId: true,
				},
			}),
		]);

		if (!staffMember) {
			throw new Error("Staff member not found.");
		}
		if (!ride) {
			throw new Error("Ride not found.");
		}
		if (!position) {
			throw new Error("Position not found.");
		}
		if (!ride.ridePositions.length) {
			throw new Error("Selected position is not available for this ride.");
		}
		if (existingCompetency) {
			throw new Error("This competency already exists.");
		}

		const referenceDate = getReferenceDate(achievedAt, lastRotatedAt);
		await validateCompetencyExpiryWindow(
			session.businessId,
			ride.tierId,
			data.positionId,
			referenceDate,
		);

		await prisma.competency.create({
			data: {
				staffMemberId: data.staffMemberId,
				rideId: data.rideId,
				positionId: data.positionId,
				achievedAt,
				last_rotatedAt: lastRotatedAt,
			},
		});

		revalidatePath("/competencies");
		return {
			success: true,
			message: "Competency created successfully.",
		};
	} catch (error) {
		console.error("Error creating competency:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function updateCompetencyDates(data: CompetencyDateUpdateData): Promise<ModifyResponse> {
	const session = await requirePermission("competency:UPDATE");

	try {
		const achievedAt = parseDate(data.achievedAt, "Achieved date");
		const lastRotatedAt = data.lastRotatedAt
			? parseDate(data.lastRotatedAt, "Last rotated date")
			: null;
		validateDates(achievedAt, lastRotatedAt);

		const competency = await prisma.competency.findFirst({
			where: {
				staffMemberId: data.staffMemberId,
				rideId: data.rideId,
				positionId: data.positionId,
				staffMember: { businessId: session.businessId },
				ride: { businessId: session.businessId },
				position: { businessId: session.businessId },
			},
			select: {
				staffMemberId: true,
				rideId: true,
				positionId: true,
				ride: {
					select: {
						tierId: true,
					},
				},
			},
		});

		if (!competency) {
			throw new Error("Competency not found.");
		}

		const referenceDate = getReferenceDate(achievedAt, lastRotatedAt);
		await validateCompetencyExpiryWindow(
			session.businessId,
			competency.ride.tierId,
			competency.positionId,
			referenceDate,
		);

		await prisma.competency.update({
			where: {
				staffMemberId_rideId_positionId: {
					staffMemberId: competency.staffMemberId,
					rideId: competency.rideId,
					positionId: competency.positionId,
				},
			},
			data: {
				achievedAt,
				last_rotatedAt: lastRotatedAt,
			},
		});

		revalidatePath("/competencies");
		return {
			success: true,
			message: "Competency dates updated successfully.",
		};
	} catch (error) {
		console.error("Error updating competency dates:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function deleteCompetency(key: CompetencyKey): Promise<ModifyResponse> {
	const session = await requirePermission("competency:DELETE");

	try {
		const existing = await prisma.competency.findFirst({
			where: {
				staffMemberId: key.staffMemberId,
				rideId: key.rideId,
				positionId: key.positionId,
				staffMember: { businessId: session.businessId },
				ride: { businessId: session.businessId },
				position: { businessId: session.businessId },
			},
			select: {
				staffMemberId: true,
				rideId: true,
				positionId: true,
			},
		});

		if (!existing) {
			throw new Error("Competency not found.");
		}

		await prisma.competency.delete({
			where: {
				staffMemberId_rideId_positionId: {
					staffMemberId: existing.staffMemberId,
					rideId: existing.rideId,
					positionId: existing.positionId,
				},
			},
		});

		revalidatePath("/competencies");
		return {
			success: true,
			message: "Competency deleted successfully.",
		};
	} catch (error) {
		console.error("Error deleting competency:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
