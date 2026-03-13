import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { listCompetenciesForBusiness } from "@/lib/server/competencies";
import type { CompetencyWithExpiry, JoinedRota, RotaAssignmentInput } from "@/lib/types";

type RotaAssignmentCandidate = RotaAssignmentInput & {
	score: number;
	reasons: string[];
	competency: CompetencyWithExpiry;
};

class RotaGenerator {
	private static readonly BASE_COMPETENCY_SCORE = 10;
	private static readonly CRITICAL_DAY_POINT = 7;
	private static readonly CRITICAL_RENEWAL_SCORE = 100;
	private static readonly SINGLE_OPTION_SCORE = 80;

	private readonly rotaReference: string;
	private readonly businessId: string;
	private readonly p: PrismaClient;
	private rotaData: JoinedRota | null = null;
	private existingAssignmentKeys = new Set<string>();
	private assignmentCandidates: RotaAssignmentCandidate[] = [];
	private assignedStaffIds = new Set<string>();
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
		await this.initializeAssignmentCandidates();
		this.reserveExistingAssignments();
		this.filterUnavailableCandidates();
		this.completeAssignments();
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
				score: RotaGenerator.BASE_COMPETENCY_SCORE,
				reasons: ["competency_valid"],
				competency,
			}));
	}

	private reserveExistingAssignments() {
		if (!this.rotaData) {
			throw new Error("Unable to reserve assignments without a loaded rota.");
		}

		for (const assignment of this.rotaData.details) {
			if (this.assignedStaffIds.has(assignment.staffMemberId)) {
				throw new Error("Rota has duplicate staff assignments.");
			}

			const ridePositionKey = this.getRidePositionKey(assignment);
			const remainingCapacity = this.remainingCapacityByRidePosition.get(ridePositionKey);
			if (remainingCapacity === undefined || remainingCapacity < 1) {
				throw new Error("Rota has invalid ride-position assignments.");
			}

			this.assignedStaffIds.add(assignment.staffMemberId);
			this.remainingCapacityByRidePosition.set(ridePositionKey, remainingCapacity - 1);
		}
	}

	private filterUnavailableCandidates() {
		this.assignmentCandidates = this.assignmentCandidates.filter((candidate) => this.canAssignCandidate(candidate));
	}

	private completeAssignments() {
		while (this.assignmentCandidates.length > 0) {
			this.recalculateCandidateScores();

			const bestCandidate = this.assignmentCandidates[0];
			if (!bestCandidate) {
				return;
			}

			if (!this.canAssignCandidate(bestCandidate)) {
				this.assignmentCandidates.shift();
				continue;
			}

			this.applyAssignment(bestCandidate);
			this.filterUnavailableCandidates();
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

	private recalculateCandidateScores() {
		for (const candidate of this.assignmentCandidates) {
			candidate.score = RotaGenerator.BASE_COMPETENCY_SCORE;
			candidate.reasons = ["competency_valid"];
		}

		this.assignStaffWithinCriticalPeriod();
		this.scoreSingleRemainingOptions();
		this.rankAssignmentCandidates();
	}

	// Applies the critical-renewal weighting onto the existing candidate pool.
	private assignStaffWithinCriticalPeriod() {
		for (const candidate of this.assignmentCandidates) {
			const daysRemaining = candidate.competency.daysRemaining;
			if (daysRemaining === null || daysRemaining < 0 || daysRemaining > RotaGenerator.CRITICAL_DAY_POINT) {
				continue;
			}

			candidate.score += RotaGenerator.CRITICAL_RENEWAL_SCORE;
			candidate.reasons.push("critical_renewal_window");
		}
	}

	private scoreSingleRemainingOptions() {
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

			candidate.score += RotaGenerator.SINGLE_OPTION_SCORE;
			candidate.reasons.push("single_remaining_option");
		}
	}

	private rankAssignmentCandidates() {
		this.assignmentCandidates.sort((left, right) => {
			if (right.score !== left.score) {
				return right.score - left.score;
			}

			const leftDaysRemaining = left.competency.daysRemaining ?? Number.POSITIVE_INFINITY;
			const rightDaysRemaining = right.competency.daysRemaining ?? Number.POSITIVE_INFINITY;
			if (leftDaysRemaining !== rightDaysRemaining) {
				return leftDaysRemaining - rightDaysRemaining;
			}

			if (left.competency.staffMemberName !== right.competency.staffMemberName) {
				return left.competency.staffMemberName.localeCompare(right.competency.staffMemberName);
			}

			if (left.competency.rideName !== right.competency.rideName) {
				return left.competency.rideName.localeCompare(right.competency.rideName);
			}

			return left.competency.positionName.localeCompare(right.competency.positionName);
		});
	}

	private applyAssignment(candidate: RotaAssignmentCandidate) {
		if (!this.rotaData) {
			throw new Error("Unable to apply assignments without a loaded rota.");
		}

		const ridePositionKey = this.getRidePositionKey(candidate);
		const remainingCapacity = this.remainingCapacityByRidePosition.get(ridePositionKey);
		if (remainingCapacity === undefined || remainingCapacity < 1) {
			throw new Error("Unable to assign a candidate to a full ride position.");
		}

		this.rotaData.details.push({
			staffMemberId: candidate.staffMemberId,
			rideId: candidate.rideId,
			positionId: candidate.positionId,
		});
		this.assignedStaffIds.add(candidate.staffMemberId);
		this.remainingCapacityByRidePosition.set(ridePositionKey, remainingCapacity - 1);
	}

	private canAssignCandidate(candidate: RotaAssignmentInput): boolean {
		if (this.assignedStaffIds.has(candidate.staffMemberId)) {
			return false;
		}

		const remainingCapacity = this.remainingCapacityByRidePosition.get(this.getRidePositionKey(candidate));
		return remainingCapacity !== undefined && remainingCapacity > 0;
	}

	private getRidePositionKey(candidate: Pick<RotaAssignmentInput, "rideId" | "positionId">): string {
		return `${candidate.rideId}:${candidate.positionId}`;
	}

	private getAssignmentKey(candidate: RotaAssignmentInput): string {
		return `${candidate.staffMemberId}:${candidate.rideId}:${candidate.positionId}`;
	}
}

export default RotaGenerator;
