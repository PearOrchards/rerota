"use client";

import React from "react";
import { EntityFormModal } from "@/components/EntityFormModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCompetency, updateCompetencyDates } from "@/lib/actions/competencies";
import type {
	CompetencyCreateData,
	CompetencyDateUpdateData,
	CompetencyCreateRideOption,
	CompetencyCreateStaffOption,
	CompetencyWithExpiry,
} from "@/lib/types/competency";

interface CompetencyFormModalProps {
	trigger: React.ReactNode;
	competency?: CompetencyWithExpiry;
	availableStaff?: CompetencyCreateStaffOption[];
	availableRides?: CompetencyCreateRideOption[];
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	timeZone: "UTC",
});
const getDateInputValue = (date: Date): string => dateFormatter.format(date);
const formatInputDate = (date: Date | null): string => !date ? "" : getDateInputValue(date);

export function CompetencyFormModal({
	trigger,
	competency,
	availableStaff,
	availableRides,
}: CompetencyFormModalProps) {
	const isEditMode = !!competency;
	const staff = availableStaff ?? [];
	const rides = availableRides ?? [];

	const getDefaultValues = (): CompetencyCreateData | CompetencyDateUpdateData => {
		if (competency) {
			return {
				staffMemberId: competency.staffMemberId,
				rideId: competency.rideId,
				positionId: competency.positionId,
				achievedAt: formatInputDate(competency.achievedAt),
				lastRotatedAt: formatInputDate(competency.lastRotatedAt),
			};
		}

		const firstRideWithPositions = rides.find((ride) => ride.positions.length > 0);
		const firstRide = firstRideWithPositions ?? rides[0];
		return {
			staffMemberId: staff[0]?.id ?? "",
			rideId: firstRide?.id ?? "",
			positionId: firstRide?.positions[0]?.id ?? "",
			achievedAt: getDateInputValue(new Date()),
			lastRotatedAt: null,
		};
	};

	const handleSubmit = async (data: CompetencyCreateData | CompetencyDateUpdateData) => {
		return isEditMode
			? await updateCompetencyDates(data as CompetencyDateUpdateData)
			: await createCompetency(data as CompetencyCreateData);
	};

	return (
		<EntityFormModal<CompetencyCreateData | CompetencyDateUpdateData>
			entity={getDefaultValues()}
			trigger={trigger}
			title={isEditMode ? `Edit ${competency.staffMemberName}` : "Create Competency"}
			description={isEditMode
				? `${competency.rideName} - ${competency.positionName}`
				: "Add a new staff competency."}
			onSubmit={handleSubmit}
			getDefaultValues={getDefaultValues}
		>
			{(formData, onChange) => {
				const selectedRide = rides.find((ride) => ride.id === formData?.rideId)
					?? rides.find((ride) => ride.positions.length > 0)
					?? rides[0];
				const availablePositions = selectedRide?.positions ?? [];

				return (
					<>
						{!isEditMode && (
							<>
								<div className="grid gap-2">
									<Label htmlFor="staffMemberId">Staff Member</Label>
									<Select
										value={formData?.staffMemberId || ""}
										onValueChange={(value) => onChange("staffMemberId", value)}
										required
									>
										<SelectTrigger id="staffMemberId" className="w-full">
											<SelectValue placeholder="Select staff member" />
										</SelectTrigger>
										<SelectContent>
											{staff.map((staffMember) => (
												<SelectItem key={staffMember.id} value={staffMember.id}>
													{staffMember.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="rideId">Ride</Label>
									<Select
										value={formData?.rideId || ""}
										onValueChange={(value) => {
											const ride = rides.find((option) => option.id === value);
											const fallbackPositionId = ride?.positions[0]?.id ?? "";

											onChange("rideId", value);
											if (!ride?.positions.some((position) => position.id === formData?.positionId)) {
												onChange("positionId", fallbackPositionId);
											}
										}}
										required
									>
										<SelectTrigger id="rideId" className="w-full">
											<SelectValue placeholder="Select ride" />
										</SelectTrigger>
										<SelectContent>
											{rides.map((ride) => (
												<SelectItem key={ride.id} value={ride.id}>
													{ride.name} ({ride.tierName})
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className="grid gap-2">
									<Label htmlFor="positionId">Position</Label>
									<Select
										value={formData?.positionId || ""}
										onValueChange={(value) => onChange("positionId", value)}
										required
										disabled={!availablePositions.length}
									>
										<SelectTrigger id="positionId" className="w-full">
											<SelectValue placeholder="Select position" />
										</SelectTrigger>
										<SelectContent>
											{availablePositions.map((position) => (
												<SelectItem key={position.id} value={position.id}>
													{position.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</>
						)}

						<div className="grid gap-2">
							<Label htmlFor="achievedAt">Achieved Date</Label>
							<Input
								id="achievedAt"
								type="date"
								value={formData?.achievedAt || ""}
								onChange={(event) => onChange("achievedAt", event.target.value)}
								required
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="lastRotatedAt">Last Rotated Date</Label>
							<Input
								id="lastRotatedAt"
								type="date"
								value={formData?.lastRotatedAt || ""}
								onChange={(event) => onChange("lastRotatedAt", event.target.value || null)}
							/>
						</div>
					</>
				);
			}}
		</EntityFormModal>
	);
}
