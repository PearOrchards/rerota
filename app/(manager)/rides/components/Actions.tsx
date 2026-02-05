import { Copy, Ellipsis, Pencil, Trash } from "lucide-react";
import { deleteRide } from "@/lib/actions/rides";
import type { RideWithExtra } from "@/lib/types/rides";
import { Tier } from "@/generated/prisma/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RideFormModal } from "./RideFormModal";
import { DeleteEntityModal } from "@/components/DeleteEntityModal";

export function Actions({
	ride,
	tiers,
	businessId,
}: {
    ride: RideWithExtra;
    tiers: Tier[];
    businessId: string;
}) {
	const { competenciesCount, ...rest } = ride; // Exclude competenciesCount when passing ride data

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<RideFormModal
					ride={rest}
					trigger={
						<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:cursor-pointer">
							<Pencil /> Edit
						</DropdownMenuItem>
					}
					availableTiers={tiers}
					businessId={businessId}
				/>
				<DropdownMenuItem className="hover:cursor-pointer"><Copy /> Duplicate</DropdownMenuItem>
				<DeleteEntityModal
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