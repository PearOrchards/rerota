"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/generated/prisma/client";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	MultiSelect,
	type MultiSelectOption,
} from "@/components/ui/multi-select";
import { saveTodayRota } from "@/lib/actions/rotas";
import type {
	CompetencyWithExpiry,
	RideWithExtra,
	StaffMemberWithCompetencies,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AssignmentMap = Record<string, string[]>;

type ExpandedRide = {
  id: string;
  name: string;
  tierName: string;
  positionQuantities: Record<string, number>;
  totalSlots: number;
};

type RotaTableProps = {
  competencies: CompetencyWithExpiry[];
  initialState: AssignmentMap;
  positions: Position[];
  rides: RideWithExtra[];
  staff: StaffMemberWithCompetencies[];
};

type RidePositionCellProps = {
  assignments: AssignmentMap;
  cellId: string;
  competentStaffIds: string[];
  isHovered: boolean;
  onAssignmentChange: (
    cellId: string,
    nextValue: string[],
    limit: number,
  ) => void;
  onHoverEnd: () => void;
  onHoverStart: () => void;
  quantity: number;
  staffNameById: Map<string, string>;
};

const getRidePositionKey = (rideId: string, positionId: string) =>
	`${rideId}:${positionId}`;

function RidePositionCell({
	assignments,
	cellId,
	competentStaffIds,
	isHovered,
	onAssignmentChange,
	onHoverEnd,
	onHoverStart,
	quantity,
	staffNameById,
}: RidePositionCellProps) {
	const selectedStaffIds = assignments[cellId] ?? []; // Staff members currently assigned to this cell.
	const isAtCapacity = selectedStaffIds.length >= quantity;
	const options: MultiSelectOption[] = competentStaffIds.map((staffId) => {
		// Mostly for whether to disable the option, based on:
		// - If staff member is already assigned to another cell, they shouldn't be available here.
		// - If this cell is at capacity, you shouldn't be able to select more staff, unless
		// - If the staff member is already selected in this cell, they should still be able to be selected
		const isSelectedInCell = selectedStaffIds.includes(staffId);
		const isAssignedElsewhere = Object.entries(assignments).some(
			([assignedCellId, assignedStaffIds]) =>
				assignedCellId !== cellId && assignedStaffIds.includes(staffId),
		);

		return {
			value: staffId,
			label: staffNameById.get(staffId) ?? "Unknown Name",
			disabled: isAssignedElsewhere || (isAtCapacity && !isSelectedInCell),
		};
	});

	return (
		<TableCell
			className={cn(
				"align-top py-2 px-4 text-left transition-colors",
				selectedStaffIds.length ? "bg-emerald-400/10" : "",
				isHovered && !selectedStaffIds.length ? "bg-muted/40" : "",
			)}
			onMouseEnter={onHoverStart}
			onMouseLeave={onHoverEnd}
		>
			<div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
				<span>
					{selectedStaffIds.length} / {quantity} assigned
				</span>
				<span>{competentStaffIds.length} competent</span>
			</div>
			<MultiSelect
				options={options}
				value={selectedStaffIds}
				onValueChange={(nextValue) =>
					onAssignmentChange(cellId, nextValue, quantity)
				}
				placeholder="Select staff..."
				emptyMessage="No competent staff available."
				className="h-8 px-2 text-xs"
			/>
		</TableCell>
	);
}

export default function RotaTable({
	competencies,
	initialState,
	positions,
	rides,
	staff,
}: RotaTableProps) {
	// Hey so I write this code in a flow state, so I'm gonna go back and add comments because oh my god
	const [assignments, setAssignments] = useState<AssignmentMap>(initialState);
	const [hoveredCellId, setHoveredCellId] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// useMemos are used to derive expensive structures which depend on props, meaning on re-renders we can skip recalculating them.
	// e.g., if staff changes, sortedRides doesn't need to be recalculated, but staffNameById does.

	// Structure so rides also include total slots, so it doesn't have to be recalculated every time we render a cell.
	const sortedRides = useMemo<ExpandedRide[]>(() => {
		return (
			rides
				.map((ride) => {
					const positionQuantities = Object.fromEntries(
						ride.ridePositions.map((ridePosition) => [
							ridePosition.positionId,
							ridePosition.quantity,
						]),
					);
					const totalSlots = ride.ridePositions.reduce(
						(sum, ridePosition) => sum + ridePosition.quantity,
						0,
					);

					return {
						id: ride.id,
						name: ride.name,
						tierName: ride.tier.name,
						positionQuantities,
						totalSlots,
					};
				})
			// And sort them by name, just so they're always in a deterministic order. Not strictly necessary but it feels nicer.
				.toSorted((left, right) => left.name.localeCompare(right.name))
		);
	}, [rides]);

	// This structure is simpler, it just allows us to quickly get a staff's name by their ID.
	const staffNameById = useMemo(() => {
		return new Map(
			staff.map((member) => [
				member.id,
				`${member.firstName} ${member.lastName}`,
			]),
		);
	}, [staff]);

	const competentStaffIdsByRidePosition = useMemo(() => {
		// Map of rideId:positionId (-> every position) to staffIds who are competent (& not expired).
		const map = new Map<string, string[]>();

		for (const competency of competencies) {
			if (competency.status === "Expired") continue;

			const key = getRidePositionKey(competency.rideId, competency.positionId);
			const existing = map.get(key);

			if (existing) {
				if (!existing.includes(competency.staffMemberId))
					existing.push(competency.staffMemberId);
				continue;
			}

			map.set(key, [competency.staffMemberId]);
		}

		for (const staffIds of map.values()) {
			// Also sort the names for deterministic ordering.
			staffIds.sort((left, right) => {
				const leftName = staffNameById.get(left) ?? "";
				const rightName = staffNameById.get(right) ?? "";
				return leftName.localeCompare(rightName);
			});
		}

		return map;
	}, [competencies, staffNameById]);

	// These two are just totals for the header
	const totalRequiredSlots = useMemo(
		() => sortedRides.reduce((sum, ride) => sum + ride.totalSlots, 0),
		[sortedRides],
	);
	const assignedSlotsCount = useMemo(
		() =>
			Object.values(assignments).reduce(
				(sum, staffIds) => sum + staffIds.length,
				0,
			),
		[assignments],
	);

	const handleAssignmentChange = (
		cellId: string,
		nextValue: string[],
		limit: number,
	) => {
		// Function for when a cell's assignment changes. Has to update current cell, but also ensure staff aren't double booked, and cell doesn't exceed required quantity.
		setAssignments((currentAssignments) => {
			const currentValue = currentAssignments[cellId] ?? [];
			const uniqueNextValue = Array.from(new Set(nextValue)); // Ensures there's no duplicates
			const normalizedNextValue =
        uniqueNextValue.length > limit // If new value exceeds limit, just keep the old value
        	? currentValue
        	: uniqueNextValue;
			const nextAssignments: AssignmentMap = {};

			// Iterate over existing assignments.
			for (const [existingCellId, selectedStaffIds] of Object.entries(
				currentAssignments,
			)) {
				// If this is the cell we're updating, just skip it for now.
				if (existingCellId === cellId) continue;

				// Filter the assigned staff members for this cell, removing any that are now assigned to the updated cell.
				const filteredStaffIds = selectedStaffIds.filter(
					(staffId) => !normalizedNextValue.includes(staffId),
				);

				// If the new array isn't empty, add it to the next assignments.
				if (filteredStaffIds.length) {
					nextAssignments[existingCellId] = filteredStaffIds;
				}
			}

			// If the new value for the updated cell isn't empty, add it to the next assignments.
			if (normalizedNextValue.length) {
				nextAssignments[cellId] = normalizedNextValue;
			}

			// Final result.
			return nextAssignments;
		});
	};

	// When saving, we need to transform the assignments map back into the format expected by the API, which is an array of { staffMemberId, rideId, positionId }.
	const handleSave = async () => {
		setIsSaving(true);
		try {
			const payload = Object.entries(assignments).flatMap(
				([cellId, staffIds]) => {
					const [rideId, positionId] = cellId.split(":");
					return staffIds.map((staffMemberId) => ({
						staffMemberId,
						rideId,
						positionId,
					}));
				},
			);

			const response = await saveTodayRota(payload);
			if (response.success) {
				toast.success(response.message || "Saved.");
			} else {
				toast.error(response.message || "Failed to save.");
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Failed to save.");
		} finally {
			setIsSaving(false);
		}
	};

	// Following two returns just handle cases where no rides or positions exist.
	// We can't move this up because then we'd be running memos conditionally, and React HATES that.
	if (!sortedRides.length) {
		return (
			<div className="rounded-2xl border border-dashed p-8 text-center text-zinc-400 hover:text-zinc-300">
        Please add rides before building a rota.
			</div>
		);
	}

	if (!positions.length) {
		return (
			<div className="rounded-2xl border border-dashed p-8 text-center text-zinc-400 hover:text-zinc-300">
        Please add positions before building a rota.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2 rounded-2xl border bg-muted/20 px-5 py-4 shadow-lg md:flex-row md:items-center md:justify-between">
				<div>
					<h2 className="text-xl font-semibold">Build Today&apos;s Rota</h2>
					<p className="text-sm text-muted-foreground">
            Each cell represents a position on a ride (multiple staff may be
            required per position). You can assign staff now to &#34;lock&#34;
            them there, otherwise leave them blank.
						<br />
						<i>For best results, do not lock too many staff in.</i>
					</p>
				</div>
				<div className="text-sm font-medium">
					{assignedSlotsCount} of {totalRequiredSlots} slots locked
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border shadow-lg">
				<Table className="text-sm">
					<TableHeader>
						<TableRow>
							<TableHead className="min-w-30">Ride</TableHead>
							{positions.map((position) => (
								<TableHead key={position.id} className="min-w-48">
									{position.name}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedRides.map((ride) => (
							<TableRow key={ride.id}>
								<TableCell className="bg-muted/20 text-left">
									<div className="flex flex-col gap-1 px-2">
										<span className="font-semibold">
											{ride.name} <span className="text-zinc-400">({ride.tierName})</span>
										</span>
										<span className="text-xs text-muted-foreground">
											{ride.totalSlots} required slot
											{ride.totalSlots === 1 ? "" : "s"}
										</span>
									</div>
								</TableCell>
								{positions.map((position) => {
									const quantity = ride.positionQuantities[position.id] ?? 0;

									if (!quantity) {
										return (
											<TableCell
												key={`${ride.id}-${position.id}`}
												className="bg-zinc-950/20 text-zinc-400"
											>
                        N/A
											</TableCell>
										);
									}

									const cellId = getRidePositionKey(ride.id, position.id);
									const competentStaffIds =
                    competentStaffIdsByRidePosition.get(cellId) ?? [];

									// The cell which has all the logic for selecting staff members... the props.......
									return (
										<RidePositionCell
											key={cellId}
											assignments={assignments}
											cellId={cellId}
											competentStaffIds={competentStaffIds}
											isHovered={hoveredCellId === cellId}
											onAssignmentChange={handleAssignmentChange}
											onHoverEnd={() =>
												setHoveredCellId((currentCellId) =>
													currentCellId === cellId ? null : currentCellId,
												)
											}
											onHoverStart={() => setHoveredCellId(cellId)}
											quantity={quantity}
											staffNameById={staffNameById}
										/>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<div className="flex justify-end">
				<Button onClick={handleSave} disabled={isSaving}>
					{isSaving ? "Saving..." : "Save Rota"}
				</Button>
			</div>
		</div>
	);
}
