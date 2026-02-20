import { Ellipsis, Pencil, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteEntityModal } from "@/components/DeleteEntityModal";
import { deleteStaffMember } from "@/lib/actions/staff";
import { StaffMemberWithCompetencies } from "@/lib/types/staffMember";
import { StaffFormModal } from "./StaffFormModal";

interface ActionsProps {
	staffMember: StaffMemberWithCompetencies;
	businessId: string;
}

export function Actions({
	staffMember,
	businessId,
}: ActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Ellipsis className="m-auto hover:cursor-pointer" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="left">
				<StaffFormModal
					staffMember={staffMember}
					trigger={
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="hover:cursor-pointer"
						>
							<Pencil /> Edit
						</DropdownMenuItem>
					}
					businessId={businessId}
				/>
				<DeleteEntityModal
					title="Delete Staff Member"
					description={`Are you sure you want to delete ${staffMember.firstName} ${staffMember.lastName}? This action cannot be undone.`}
					trigger={
						<DropdownMenuItem
							className="hover:cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							<Trash /> Delete
						</DropdownMenuItem>
					}
					onConfirm={() => deleteStaffMember(staffMember.id)}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
