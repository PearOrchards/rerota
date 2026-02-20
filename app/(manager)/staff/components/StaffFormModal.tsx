"use client";

import React from "react";
import { EntityFormModal } from "@/components/EntityFormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaffMember } from "@/generated/prisma/client";
import { createStaffMember, updateStaffMember } from "@/lib/actions/staff";
import { StaffMemberFormData } from "@/lib/types/staffMember";

interface StaffFormModalProps {
	staffMember?: StaffMember;
	trigger: React.ReactNode;
	onSuccess?: () => void;
	businessId: string;
}

export function StaffFormModal({
	staffMember,
	trigger,
	onSuccess,
	businessId,
}: StaffFormModalProps) {
	const getDefaultValues = (): StaffMemberFormData => ({
		id: "",
		firstName: "",
		lastName: "",
		businessId,
	});

	const handleSubmit = async (data: StaffMemberFormData) => {
		const submitData = {
			...data,
			businessId,
		};
		return staffMember ? await updateStaffMember(submitData) : await createStaffMember(submitData);
	};

	const entityData = staffMember
		? {
			id: staffMember.id,
			firstName: staffMember.firstName,
			lastName: staffMember.lastName,
			businessId,
		}
		: undefined;

	return (
		<EntityFormModal<StaffMemberFormData>
			entity={entityData}
			trigger={trigger}
			title={staffMember ? "Edit Staff Member" : "Create Staff Member"}
			description={staffMember ? "Update staff details below." : "Add a new staff member to the system."}
			onSubmit={handleSubmit}
			getDefaultValues={getDefaultValues}
			onSuccess={onSuccess}
		>
			{(formData, onChange) => (
				<>
					<div className="grid gap-2">
						<Label htmlFor="firstName">First Name</Label>
						<Input
							id="firstName"
							value={formData?.firstName || ""}
							onChange={(e) => onChange("firstName", e.target.value)}
							placeholder="e.g., Alex"
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							value={formData?.lastName || ""}
							onChange={(e) => onChange("lastName", e.target.value)}
							placeholder="e.g., Johnson"
							required
						/>
					</div>
				</>
			)}
		</EntityFormModal>
	);
}
