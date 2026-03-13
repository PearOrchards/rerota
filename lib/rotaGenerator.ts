import { StaffMember } from "@/generated/prisma/client";
import { RideWithExtra, JoinedRota } from "@/lib/types";
import { PrismaClient } from "../generated/prisma/client";
import { prisma } from "./prisma";
import { getCompetencies } from "@/lib/actions/competencies";

class RotaGenerator {
	private static readonly CRITICAL_DAY_POINT: number = 7;
	private readonly rotaReference: string;
	private rotaData: JoinedRota | null = null;

	private p: PrismaClient;

	public constructor(rotaId: string) {
		this.p = prisma;
		this.rotaReference = rotaId;
	}

	public async start(): Promise<JoinedRota> {
		const rota = await this.p.rota.findUnique({
			where: { id: this.rotaReference },
			include: {
				details: true,
			},
		});
		if (!rota) throw new Error("Unable to start rota - no starting point.");
		this.rotaData = rota;

		await this.assignStaffWithinCriticalPeriod();

		return rota;
	}

	// ? Internal functions for calculating different points of the rota
	private async assignStaffWithinCriticalPeriod() {
		// Get competencies, with expiry within the critical period
		const today = new Date();
		const criticalDate = new Date(today.getTime() + RotaGenerator.CRITICAL_DAY_POINT * 24 * 60 * 60 * 1000);
		criticalDate.setHours(23, 59, 59, 999); // Set to end of day

 		const criticalCompetencies = await getCompetencies();
	}

}