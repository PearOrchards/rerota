import { StaffMember } from "@/generated/prisma/client";

export interface StaffMemberWithCompetencies extends StaffMember {
    competenciesCount: number;
}

export type StaffMemberFormData = Pick<StaffMember, "id" | "firstName" | "lastName" | "businessId">;
