import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { HungarianAlgorithm } from "@/lib/HungarianAlgorithm";
import { listCompetenciesForBusiness } from "@/lib/server/competencies";
import type { CompetencyWithExpiry, JoinedRota, RotaAssignmentInput } from "@/lib/types";

type RotaAssignmentCandidate = RotaAssignmentInput & {
	competency: CompetencyWithExpiry;
};

class RotaGenerator {
	private static readonly BASE_COMPETENCY_SCORE = 20;
	private static readonly CRITICAL_DAY_POINT = 7;
	private static readonly CRITICAL_RENEWAL_SCORE = 100;
	private static readonly SINGLE_OPTION_SCORE = 80;
	private static readonly FORBIDDEN_SCORE = -1000000;

	private readonly rotaReference: string;
	private readonly businessId: string;
	private readonly p: PrismaClient;

	private rotaData: JoinedRota | null = null;
	private existingAssignmentKeys = new Set<string>();
	private assignmentCandidates: RotaAssignmentCandidate[] = [];
	private staffScores: Map<string, Map<string, number>> = new Map();
	private remainingCapacityByRidePosition = new Map<string, number>();

	public constructor(rotaId: string, businessId: string) {
		this.p = prisma;
		this.rotaReference = rotaId;
		this.businessId = businessId;
	}

	public async start(): Promise<JoinedRota> {
		const rota = await this.p.rota.findFirst({
			where: {
				id: this.rotaReference,
				businessId: this.businessId,
			},
			include: {
				details: true,
			},
		});

		if (!rota) {
			throw new Error("Unable to start rota - no starting point.");
		}

		this.rotaData = {
			id: rota.id,
			status: rota.status,
			applicableDate: rota.applicableDate,
			details: rota.details.map((detail) => ({
				staffMemberId: detail.staffMemberId,
				rideId: detail.rideId,
				positionId: detail.positionId,
			})),
		};
		this.existingAssignmentKeys = new Set(
			this.rotaData.details.map((detail) => this.getAssignmentKey(detail)),
		);

		await this.initializeRemainingCapacity();
		this.reserveExistingAssignments();
		await this.initializeAssignmentCandidates();
		const slotKeys = this.buildSlotKeysFromRemainingCapacity();
		this.buildBaseScoringMatrix(slotKeys);
		this.applyScorings(slotKeys);
		this.runHungarianSolver();
		await this.persistGeneratedAssignments();

		return this.rotaData;
	}

	private async initializeRemainingCapacity() {
		const rides = await this.p.ride.findMany({
			where: {
				businessId: this.businessId,
			},
			select: {
				id: true,
				ridePositions: {
					select: {
						positionId: true,
						quantity: true,
					},
				},
			},
		});

		this.remainingCapacityByRidePosition = new Map(
			rides.flatMap((ride) => ride.ridePositions.map((ridePosition) => [
				this.getRidePositionKey({
					rideId: ride.id,
					positionId: ridePosition.positionId,
				}),
				ridePosition.quantity,
			])),
		);
	}

	private async initializeAssignmentCandidates() {
		const competencies = await listCompetenciesForBusiness(this.businessId);
		this.assignmentCandidates = competencies
			.filter((competency) => competency.status !== "Expired")
			.map((competency) => ({
				staffMemberId: competency.staffMemberId,
				rideId: competency.rideId,
				positionId: competency.positionId,
				competency,
			}));
	}

	private buildSlotKeysFromRemainingCapacity(): string[] {
		const slotKeys: string[] = [];
		for (const [ridePositionKey, capacity] of this.remainingCapacityByRidePosition) {
			for (let i = 0; i < capacity; i++) {
				slotKeys.push(`${ridePositionKey}:${i}`);
			}
		}
		return slotKeys;
	}

	private buildBaseScoringMatrix(slotKeys: string[]) {
		const staffIds = Array.from(new Set(this.assignmentCandidates.map((candidate) => candidate.staffMemberId)));
		this.staffScores = new Map(
			staffIds.map((staffId) => [
				staffId,
				new Map(slotKeys.map((slotKey) => [slotKey, RotaGenerator.FORBIDDEN_SCORE])),
			]),
		);

		for (const candidate of this.assignmentCandidates) {
			const staffScore = this.staffScores.get(candidate.staffMemberId);
			if (!staffScore) continue;

			const baseKey = this.getRidePositionKey(candidate);
			const capacity = this.remainingCapacityByRidePosition.get(baseKey) ?? 0;
			for (let i = 0; i < capacity; i++) {
				staffScore.set(`${baseKey}:${i}`, RotaGenerator.BASE_COMPETENCY_SCORE);
			}
		}
	}

	private reserveExistingAssignments() {
		if (!this.rotaData) {
			throw new Error("Unable to reserve assignments without a loaded rota.");
		}

		for (const assignment of this.rotaData.details) {
			const ridePositionKey = this.getRidePositionKey(assignment);
			const remainingCapacity = this.remainingCapacityByRidePosition.get(ridePositionKey);
			if (remainingCapacity === undefined || remainingCapacity < 1) {
				throw new Error("Rota has invalid ride-position assignments.");
			}

			this.remainingCapacityByRidePosition.set(ridePositionKey, remainingCapacity - 1);
		}
	}

	private applyScorings(slotKeys: string[]) {
		this.applyCriticalRenewalBonus(slotKeys);
		this.applySingleOptionBonus(slotKeys);
	}

	private applyCriticalRenewalBonus(slotKeys: string[]) {
		for (const candidate of this.assignmentCandidates) {
			const daysRemaining = candidate.competency.daysRemaining;
			if (daysRemaining === null || daysRemaining < 0 || daysRemaining > RotaGenerator.CRITICAL_DAY_POINT) {
				continue;
			}

			const staffScores = this.staffScores.get(candidate.staffMemberId)!;
			const prefix = `${this.getRidePositionKey(candidate)}:`;

			for (const slotKey of slotKeys) {
				if (!slotKey.startsWith(prefix)) continue;
				const currentScore = staffScores.get(slotKey);
				if (currentScore === undefined || currentScore <= RotaGenerator.FORBIDDEN_SCORE) continue;
				staffScores.set(slotKey, currentScore + RotaGenerator.CRITICAL_RENEWAL_SCORE);
			}
		}
	}

	private applySingleOptionBonus(slotKeys: string[]) {
		const candidateCountByStaff = new Map<string, number>();

		for (const candidate of this.assignmentCandidates) {
			candidateCountByStaff.set(
				candidate.staffMemberId,
				(candidateCountByStaff.get(candidate.staffMemberId) ?? 0) + 1,
			);
		}

		for (const candidate of this.assignmentCandidates) {
			if (candidateCountByStaff.get(candidate.staffMemberId) !== 1) {
				continue;
			}

			const staffScores = this.staffScores.get(candidate.staffMemberId)!;
			const prefix = `${this.getRidePositionKey(candidate)}:`;

			for (const slotKey of slotKeys) {
				if (!slotKey.startsWith(prefix)) continue;
				const currentScore = staffScores.get(slotKey);
				if (currentScore === undefined || currentScore <= RotaGenerator.FORBIDDEN_SCORE) continue;
				staffScores.set(slotKey, currentScore + RotaGenerator.SINGLE_OPTION_SCORE);
			}
		}
	}

	private runHungarianSolver() {
		if (!this.rotaData) {
			throw new Error("Unable to run solver without a loaded rota.");
		}
		if (!this.staffScores.size) return;
		const firstStaffScores = this.staffScores.values().next().value as Map<string, number> | undefined;
		if (!firstStaffScores || firstStaffScores.size === 0) return;

		const algorithm = new HungarianAlgorithm(this.staffScores);
		const assignments = algorithm.solve();

		for (const [staffId, slotKey] of assignments) {
			const score = this.staffScores.get(staffId)?.get(slotKey);
			if (score === undefined || score <= RotaGenerator.FORBIDDEN_SCORE) {
				continue;
			}

			// Parse slot key: Ride1:Position1:0 -> extract ride and position
			const lastColonIndex = slotKey.lastIndexOf(":");
			if (lastColonIndex === -1) continue;
			const ridePositionKey = slotKey.substring(0, lastColonIndex);
			const [rideId, positionId] = ridePositionKey.split(":") as [string, string];

			this.rotaData.details.push({
				staffMemberId: staffId,
				rideId,
				positionId,
			});
		}
	}

	private async persistGeneratedAssignments() {
		if (!this.rotaData) {
			throw new Error("Unable to persist assignments without a loaded rota.");
		}

		const generatedDetails = this.rotaData.details.filter(
			(detail) => !this.existingAssignmentKeys.has(this.getAssignmentKey(detail)),
		);

		if (!generatedDetails.length) {
			return;
		}

		await this.p.rotaDetail.createMany({
			data: generatedDetails.map((detail) => ({
				parentRotaId: this.rotaReference,
				staffMemberId: detail.staffMemberId,
				rideId: detail.rideId,
				positionId: detail.positionId,
			})),
			skipDuplicates: true,
		});
	}


	private getRidePositionKey(candidate: Pick<RotaAssignmentInput, "rideId" | "positionId">): string {
		return `${candidate.rideId}:${candidate.positionId}`;
	}

	private getAssignmentKey(candidate: RotaAssignmentInput): string {
		return `${candidate.staffMemberId}:${candidate.rideId}:${candidate.positionId}`;
	}
}

export default RotaGenerator;
