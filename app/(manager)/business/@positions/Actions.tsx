import { Pencil, Trash } from "lucide-react";
import { PositionFormModal } from "@/app/(manager)/business/@positions/PositionFormModal";
import { Button } from "@/components/ui/button";

import { Position } from "@/generated/prisma/client";
import { DeleteEntityModal } from "@/components/DeleteEntityModal";
import { deletePosition } from "@/lib/actions/positions";

interface ActionsProps {
    position: Position;
}

export function Actions({
	position,
}: ActionsProps) {
	return (
		<div>
			<PositionFormModal
				trigger={
					<Button variant="ghost" size="icon">
						<Pencil />
					</Button>
				}
				position={position}
			/>
			<DeleteEntityModal
				title={"Delete Position"}
				trigger={
					<Button variant="ghost" size="icon">
						<Trash />
					</Button>
				}
				onConfirm={
				    () => deletePosition(position.id)
			    }
			/>
		</div>
	);
}

