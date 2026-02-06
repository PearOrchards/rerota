"use client";

import { Tier } from "@/generated/prisma/client";
import { EntityFormModal } from "@/components/EntityFormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTier, updateTier } from "@/lib/actions/tiers";
import React from "react";

interface TierFormModalProps {
    tier?: Tier;
    trigger: React.ReactNode;
    onSuccess?: () => void;
}

export function TierFormModal({
	tier,
	trigger,
}: TierFormModalProps) {
	const getDefaultValues = (): Tier => ({
		id: "",
		name: "",
		order: 0,
		businessId: tier?.businessId || "",
	});

	const handleSubmit = async (data: Tier) => {
		const submitData = { ...data, businessId: tier?.businessId || "" };
		return tier ? await updateTier(submitData) : await createTier(submitData);
	};

	return (
		<EntityFormModal<Tier>
			entity={tier ?? undefined}
			trigger={trigger}
			title={tier ? "Edit Tier Name" : "Create Tier"}
			onSubmit={handleSubmit}
			getDefaultValues={getDefaultValues}
		>
			{(formData, onChange) => (
				<div className="grid gap-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						value={formData?.name || ""}
						onChange={(e) => onChange("name", e.target.value)}
						placeholder="Tier Name"
						required
					/>
					<Input
						type="hidden"
						value={formData?.businessId || ""}
						onChange={(e) => onChange("businessId", e.target.value)}
					/>
				</div>
			)}
		</EntityFormModal>
	);
}