"use client";

import { Position } from "@/generated/prisma/client";
import { EntityFormModal } from "@/components/EntityFormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPosition, updatePosition } from "@/lib/actions/positions";
import React from "react";

interface PositionFormModalProps {
    position?: Position;
    trigger: React.ReactNode;
    onSuccess?: () => void;
}

export function PositionFormModal({
	position,
	trigger,
}: PositionFormModalProps) {
	const getDefaultValues = (): Position => ({
		id: "",
		name: "",
		order: 0,
		businessId: position?.businessId || "",
	});

	const handleSubmit = async (data: Position) => {
		const submitData = { ...data, businessId: position?.businessId || "" };
		return position ? await updatePosition(submitData) : await createPosition(submitData);
	};

	return (
		<EntityFormModal<Position>
			entity={position ?? undefined}
			trigger={trigger}
			title={position ? "Edit Position Name" : "Create Position"}
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
						placeholder="Position Name"
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

