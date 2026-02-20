"use client";

import React, { ReactNode } from "react";
import { EntityFormModal } from "@/components/EntityFormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { createRide, updateRide } from "@/lib/actions/rides";
import type { Position, Tier } from "@/generated/prisma/client";
import { RideFormData } from "@/lib/types/rides";

interface RideFormModalProps {
	ride?: RideFormData;
	trigger: ReactNode;
	onSuccess?: () => void;
	availableTiers: Tier[];
	availablePositions: Position[];
	businessId: string;
}

export function RideFormModal({
	ride,
	trigger,
	onSuccess,
	availableTiers,
	availablePositions,
	businessId,
}: RideFormModalProps) {
	const allPositionIds = availablePositions.map((position) => position.id);

	const getDefaultValues = (): RideFormData => ({
		id: "",
		name: "",
		description: "",
		tierId: availableTiers[0]?.id || "",
		businessId,
		positionIds: allPositionIds,
	});

	const handleSubmit = async (data: RideFormData) => {
		const submitData = { ...data, businessId }; // Need to ensure businessId is always set
		return ride ? await updateRide(submitData) : await createRide(submitData);
	};

	const entityData = ride
		? {
			...ride,
			businessId,
			positionIds: ride.positionIds.length ? ride.positionIds : allPositionIds,
		}
		: undefined;
	const positionOptions = availablePositions.map((position) => ({
		value: position.id,
		label: position.name,
	}));

	return (
		<EntityFormModal<RideFormData>
			entity={entityData}
			trigger={trigger}
			title={ride ? "Edit Ride" : "Create Ride"}
			description={ride ? "Update the ride details below." : "Add a new ride to the system."}
			onSubmit={handleSubmit}
			getDefaultValues={getDefaultValues}
			onSuccess={onSuccess}
		>
			{(formData, onChange) => (
				<div className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={formData?.name || ""}
							onChange={(e) => onChange("name", e.target.value)}
							placeholder="e.g., Roller Coaster"
							required
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="description">Description</Label>
						<Input
							id="description"
							value={formData?.description || ""}
							onChange={(e) => onChange("description", e.target.value)}
							placeholder="Brief description of the ride"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="tierId">Tier</Label>
						<Select
							value={formData?.tierId || ""}
							onValueChange={(value) => onChange("tierId", value)}
							required
						>
							<SelectTrigger id="tierId" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{availableTiers.map((tier) => (
									<SelectItem key={tier.id} value={tier.id}>
										{tier.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-2">
						<Label>Roles</Label>
						<MultiSelect
							options={positionOptions}
							value={formData?.positionIds ?? []}
							onValueChange={(value) => onChange("positionIds", value)}
							placeholder="Select roles"
							emptyMessage="No roles available. Create positions first."
						/>
					</div>
				</div>
			)}
		</EntityFormModal>
	);
}
