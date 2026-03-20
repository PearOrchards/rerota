"use server";

import { prisma } from "@/lib/prisma";
import { RotaStatus } from "@/generated/prisma/client";
import { requireSession } from "@/lib/auth/session";
import { roleAllows } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import type { ModifyResponse, RotaAssignmentInput, JoinedRota } from "@/lib/types";
import { extractReadableErrorMessage } from "@/lib/utils";
import RotaGenerator from "@/lib/RotaGenerator";

const COMPETENCY_EXPIRY_CATEGORY = "Competency Break until Lost";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getTodayBounds = () => {
	const start = new Date();
	start.setHours(0, 0, 0, 0);

	const end = new Date(start);
	end.setDate(end.getDate() + 1);

	return { start, end };
};

const getReferenceDate = (achievedAt: Date, lastRotatedAt: Date | null): Date =>
	lastRotatedAt ?? achievedAt;

const addDays = (date: Date, days: number): Date =>
	new Date(date.getTime() + days * DAY_IN_MS);

async function requireRotaAccess() {
	const session = await requireSession();

	if (!roleAllows(session.roleName, "Team Leader")) {
		throw new Error("Forbidden");
	}

	return session;
}

async function requireOwnedRota(rotaId: string, businessId: string) {
	const rota = await prisma.rota.findFirst({
		where: {
			id: rotaId,
			businessId,
		},
		select: {
			id: true,
			status: true,
			applicableDate: true,
		},
	});

	if (!rota) {
		throw new Error("Rota not found.");
	}

	return rota;
}

function revalidateRotaPaths(rotaId: string) {
	revalidatePath("/rotas");
	revalidatePath("/rotas/modify");
	revalidatePath(`/rotas/modify/${rotaId}`);
	revalidatePath(`/rotas/view/${rotaId}`);
}

export async function getToday(): Promise<JoinedRota | null> {
	const session = await requireRotaAccess();
	const { start, end } = getTodayBounds();

	return await prisma.rota.findFirst({
		where: {
			businessId: session.businessId,
			applicableDate: {
				gte: start,
				lt: end,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			status: true,
			applicableDate: true,
			details: {
				select: {
					staffMemberId: true,
					rideId: true,
					positionId: true,
				},
			},
		},
	});
}

export async function getPreviousRotas(): Promise<JoinedRota[]> {
	const session = await requireSession();
	const { start } = getTodayBounds();

	return await prisma.rota.findMany({
		where: {
			businessId: session.businessId,
			applicableDate: {
				lt: start,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
			status: true,
			applicableDate: true,
			details: {
				select: {
					staffMemberId: true,
					rideId: true,
					positionId: true,
				},
			},
		},
	});
}

export async function getRotaById(rotaId: string): Promise<JoinedRota | null> {
	const session = await requireRotaAccess();

	return await prisma.rota.findFirst({
		where: {
			id: rotaId,
			businessId: session.businessId,
		},
		select: {
			id: true,
			status: true,
			applicableDate: true,
			details: {
				select: {
					staffMemberId: true,
					rideId: true,
					positionId: true,
				},
			},
		},
	});
}

export async function getOrCreateTodayRotaId(): Promise<string> {
	const session = await requireRotaAccess();
	const { start, end } = getTodayBounds();

	const existingRota = await prisma.rota.findFirst({
		where: {
			businessId: session.businessId,
			applicableDate: {
				gte: start,
				lt: end,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
		select: {
			id: true,
		},
	});

	if (existingRota) {
		return existingRota.id;
	}

	const newRota = await prisma.rota.create({
		data: {
			businessId: session.businessId,
			applicableDate: new Date(start),
			status: RotaStatus.DRAFT,
		},
		select: {
			id: true,
		},
	});

	revalidateRotaPaths(newRota.id);

	return newRota.id;
}

async function saveRotaAssignment(
	entries: RotaAssignmentInput[],
	businessId: string,
	rotaId?: string,
): Promise<string> {
	const normalizedEntries = Array.from(
		new Map(
			entries.map((entry) => [
				`${entry.staffMemberId}:${entry.rideId}:${entry.positionId}`,
				entry,
			]),
		).values(),
	);

	const { start, end } = getTodayBounds();
	const targetRota = rotaId ? await requireOwnedRota(rotaId, businessId) : null;
	const applicableDate = targetRota
		? targetRota.applicableDate
		: new Date(start);
	const staffIds = Array.from(
		new Set(normalizedEntries.map((entry) => entry.staffMemberId)),
	);
	const rideIds = Array.from(
		new Set(normalizedEntries.map((entry) => entry.rideId)),
	);
	const positionIds = Array.from(
		new Set(normalizedEntries.map((entry) => entry.positionId)),
	);

	const [rides, staffMembers, category] = await Promise.all([
		prisma.ride.findMany({
			where: {
				id: { in: rideIds },
				businessId,
			},
			select: {
				id: true,
				tierId: true,
				ridePositions: {
					select: {
						positionId: true,
						quantity: true,
					},
				},
			},
		}),
		prisma.staffMember.findMany({
			where: {
				id: { in: staffIds },
				businessId,
			},
			select: {
				id: true,
			},
		}),
		prisma.category.findFirst({
			where: {
				businessId,
				name: COMPETENCY_EXPIRY_CATEGORY,
			},
			select: {
				id: true,
			},
		}),
	]);

	if (staffMembers.length !== staffIds.length) {
		throw new Error("One or more staff members are invalid.");
	}
	if (rides.length !== rideIds.length) {
		throw new Error("One or more rides are invalid.");
	}

	const rideById = new Map(rides.map((ride) => [ride.id, ride]));
	const requestedCountByRidePosition = new Map<string, number>();
	const requestedCountByStaffId = new Map<string, number>();
	const uniqueTierPositionKeys = new Set<string>();

	for (const entry of normalizedEntries) {
		const ride = rideById.get(entry.rideId);
		if (!ride) {
			throw new Error("One or more rides are invalid.");
		}

		const ridePosition = ride.ridePositions.find((item) => item.positionId === entry.positionId);
		if (!ridePosition) {
			throw new Error("One or more ride positions are invalid.");
		}

		const ridePositionKey = `${entry.rideId}:${entry.positionId}`;
		const nextCount = (requestedCountByRidePosition.get(ridePositionKey) ?? 0) + 1;
		const nextStaffCount = (requestedCountByStaffId.get(entry.staffMemberId) ?? 0) + 1;

		if (nextCount > ridePosition.quantity) {
			throw new Error("Too many staff were assigned to one or more ride positions.");
		}
		if (nextStaffCount > 1) {
			throw new Error("A staff member cannot be assigned to more than one rota position.");
		}

		requestedCountByRidePosition.set(ridePositionKey, nextCount);
		requestedCountByStaffId.set(entry.staffMemberId, nextStaffCount);
		uniqueTierPositionKeys.add(`${ride.tierId}:${entry.positionId}`);
	}

	const competencies = await prisma.competency.findMany({
		where: {
			staffMemberId: { in: staffIds },
			rideId: { in: rideIds },
			positionId: { in: positionIds },
		},
		select: {
			staffMemberId: true,
			rideId: true,
			positionId: true,
			achievedAt: true,
			last_rotatedAt: true,
		},
	});
	const competencyByKey = new Map(
		competencies.map((competency) => [
			`${competency.staffMemberId}:${competency.rideId}:${competency.positionId}`,
			competency,
		]),
	);

	const expiryWindowByTierPosition = new Map<string, number>();
	if (category && uniqueTierPositionKeys.size) {
		const tierIds = Array.from(new Set(Array.from(uniqueTierPositionKeys, (key) => key.split(":")[0])));
		const uniquePositionIds = Array.from(new Set(Array.from(uniqueTierPositionKeys, (key) => key.split(":")[1])));

		const numberMatrixRows = await prisma.numberMatrix.findMany({
			where: {
				categoryId: category.id,
				tierId: { in: tierIds },
				positionId: { in: uniquePositionIds },
			},
			select: {
				tierId: true,
				positionId: true,
				time: true,
			},
		});

		for (const numberMatrixRow of numberMatrixRows) {
			expiryWindowByTierPosition.set(
				`${numberMatrixRow.tierId}:${numberMatrixRow.positionId}`,
				numberMatrixRow.time,
			);
		}
	}

	for (const entry of normalizedEntries) {
		const competency = competencyByKey.get(`${entry.staffMemberId}:${entry.rideId}:${entry.positionId}`);
		if (!competency) {
			throw new Error("One or more staff members are not competent for their assigned position.");
		}

		const ride = rideById.get(entry.rideId);
		if (!ride) {
			throw new Error("One or more rides are invalid.");
		}

		const expiryWindowDays = expiryWindowByTierPosition.get(`${ride.tierId}:${entry.positionId}`);
		if (expiryWindowDays === undefined) {
			continue;
		}

		const expiresAt = addDays(
			getReferenceDate(competency.achievedAt, competency.last_rotatedAt),
			expiryWindowDays,
		);

		if (expiresAt <= new Date()) {
			throw new Error("One or more selected competencies have expired.");
		}
	}

	const existingRota = targetRota
		? { id: targetRota.id, status: targetRota.status }
		: await prisma.rota.findFirst({
			where: {
				businessId,
				applicableDate: {
					gte: start,
					lt: end,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			select: {
				id: true,
				status: true,
			},
		});

	let id: string | null = null;

	if (existingRota) {
		if (existingRota.status !== RotaStatus.DRAFT) {
			throw new Error("Only draft rotas can be modified.");
		}

		await prisma.rota.update({
			where: {
				id: existingRota.id,
			},
			data: {
				details: {
					deleteMany: {},
					...(normalizedEntries.length
						? {
							createMany: {
								data: normalizedEntries,
							},
						}
						: {}),
				},
			},
		});
		id = existingRota.id;
	} else {
		const newRota = await prisma.rota.create({
			data: {
				businessId,
				applicableDate,
				status: RotaStatus.DRAFT,
				...(normalizedEntries.length
					? {
						details: {
							createMany: {
								data: normalizedEntries,
							},
						},
					}
					: {}),
			},
		});
		id = newRota.id;
	}

	return id;
}

export async function fillRotaById(
	rotaId: string,
	entries: RotaAssignmentInput[],
): Promise<ModifyResponse> {
	const session = await requireRotaAccess();

	try {
		const savedRotaId = await saveRotaAssignment(
			entries,
			session.businessId,
			rotaId,
		);
		const generator = new RotaGenerator(savedRotaId, session.businessId);
		await generator.start();
		revalidateRotaPaths(savedRotaId);

		return {
			success: true,
			message: "Rota generated successfully.",
		};
	} catch (error) {
		console.error("Error saving rota:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function saveRotaById(
	rotaId: string,
	entries: RotaAssignmentInput[],
): Promise<ModifyResponse> {
	const session = await requireRotaAccess();

	try {
		const savedRotaId = await saveRotaAssignment(
			entries,
			session.businessId,
			rotaId,
		);
		revalidateRotaPaths(savedRotaId);

		return {
			success: true,
			message: "Rota saved successfully.",
		};
	} catch (error) {
		console.error("Error saving rota:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}

export async function activateRota(rotaId: string): Promise<ModifyResponse> {
	const session = await requireRotaAccess();

	try {
		const rota = await prisma.rota.findFirst({
			where: {
				id: rotaId,
				businessId: session.businessId,
			},
			select: {
				id: true,
				status: true,
				details: {
					select: {
						staffMemberId: true,
					},
				},
			},
		});

		if (!rota) {
			throw new Error("Rota not found.");
		}
		if (rota.status !== RotaStatus.DRAFT) {
			throw new Error("Only draft rotas can be activated.");
		}
		if (!rota.details.length) {
			throw new Error("Cannot activate an empty rota.");
		}

		await prisma.rota.update({
			where: { id: rota.id },
			data: { status: RotaStatus.ACTIVE },
		});

		revalidateRotaPaths(rota.id);

		return {
			success: true,
			message: "Rota is now active.",
		};
	} catch (error) {
		console.error("Error activating rota:", error);
		return {
			success: false,
			message: extractReadableErrorMessage(error),
		};
	}
}
