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
	private static readonly CRITICAL_DAY_POINT = 7;
	private static readonly BASE_COMPETENCY_SCORE = 10;
	private static readonly CRITICAL_RENEWAL_SCORE = 100;

	private readonly rotaReference: string;
	private readonly businessId: string;
	private readonly p: PrismaClient;
	private rotaData: JoinedRota | null = null;
	private assignmentCandidates: RotaAssignmentCandidate[] = [];

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

		await this.initializeAssignmentCandidates();
		await this.assignStaffWithinCriticalPeriod();
		this.rankAssignmentCandidates();

		return this.rotaData;
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

	// Applies the critical-renewal weighting onto the existing candidate pool.
	private async assignStaffWithinCriticalPeriod() {
		for (const candidate of this.assignmentCandidates) {
			const daysRemaining = candidate.competency.daysRemaining;
			if (daysRemaining === null || daysRemaining < 0 || daysRemaining > RotaGenerator.CRITICAL_DAY_POINT) continue;

			candidate.score += RotaGenerator.CRITICAL_RENEWAL_SCORE;
			if (!candidate.reasons.includes("critical_renewal_window")) {
				candidate.reasons.push("critical_renewal_window");
			}
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
}

export default RotaGenerator;
