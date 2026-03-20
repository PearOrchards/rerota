import { Ellipsis, Pencil, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmEntityModal } from "@/components/ConfirmEntityModal";
import { deleteCompetency } from "@/lib/actions/competencies";
import type { CompetencyWithExpiry } from "@/lib/types/competency";
import { CompetencyFormModal } from "./CompetencyFormModal";

interface ActionsProps {
	competency: CompetencyWithExpiry;
}

export function Actions({ competency }: ActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<CompetencyFormModal
					competency={competency}
					trigger={
						<DropdownMenuItem
							onSelect={(event) => event.preventDefault()}
							className="hover:cursor-pointer"
						>
							<Pencil /> Edit
						</DropdownMenuItem>
					}
				/>
				<ConfirmEntityModal
					title="Delete Competency"
					description={`Are you sure you want to delete the competency of ${competency.staffMemberName} on ${competency.rideName} (as ${competency.positionName})? This action cannot be undone.`}
					trigger={
						<DropdownMenuItem
							className="hover:cursor-pointer"
							onSelect={(event) => event.preventDefault()}
						>
							<Trash /> Delete
						</DropdownMenuItem>
					}
					onConfirm={() => deleteCompetency({
						staffMemberId: competency.staffMemberId,
						rideId: competency.rideId,
						positionId: competency.positionId,
					})}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
