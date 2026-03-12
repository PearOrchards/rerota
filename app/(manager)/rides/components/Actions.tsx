import { Copy, Ellipsis, Pencil, Trash } from "lucide-react";
import { deleteRide } from "@/lib/actions/rides";
import type { RideFormData, RideWithExtra } from "@/lib/types/rides";
import { Position, Tier } from "@/generated/prisma/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RideFormModal } from "./RideFormModal";
import { ConfirmEntityModal } from "@/components/ConfirmEntityModal";

export function Actions({
	ride,
	tiers,
	positions,
	businessId,
}: {
	ride: RideWithExtra;
	tiers: Tier[];
	positions: Position[];
	businessId: string;
}) {
	const rideForForm: RideFormData = {
		id: ride.id,
		name: ride.name,
		description: ride.description ?? "",
		tierId: ride.tierId,
		businessId: ride.businessId,
		positionQuantities: ride.ridePositions.map((ridePosition) => ({
			positionId: ridePosition.positionId,
			quantity: ridePosition.quantity,
		})),
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<RideFormModal
					ride={rideForForm}
					trigger={
						<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:cursor-pointer">
							<Pencil /> Edit
						</DropdownMenuItem>
					}
					availableTiers={tiers}
					availablePositions={positions}
					businessId={businessId}
				/>
				<DropdownMenuItem className="hover:cursor-pointer"><Copy /> Duplicate</DropdownMenuItem>
				<ConfirmEntityModal
					title="Delete Ride"
					description="Are you sure you want to delete this ride? This action cannot be undone."
					trigger={
						<DropdownMenuItem
							className="hover:cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							<Trash /> Delete
						</DropdownMenuItem>
					}
					onConfirm={() => deleteRide(ride.id)}
				/>

			</DropdownMenuContent>
		</DropdownMenu>
	);
}
