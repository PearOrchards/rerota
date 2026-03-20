import { Pencil, Trash } from "lucide-react";
import { TierFormModal } from "@/app/(manager)/business/@tiers/TierFormModal";
import { Button } from "@/components/ui/button";

import { Tier } from "@/generated/prisma/client";
import { ConfirmEntityModal } from "@/components/ConfirmEntityModal";
import { deleteTier } from "@/lib/actions/tiers";

interface ActionsProps {
    tier: Tier;
}

export function Actions({
	tier,
}: ActionsProps) {
	return (
		<div>
			<TierFormModal
				trigger={
					<Button variant="ghost" size="icon">
						<Pencil />
					</Button>
				}
				tier={tier}
			/>
			<ConfirmEntityModal
				title={"Delete Tier"}
				trigger={
					<Button variant="ghost" size="icon">
						<Trash />
					</Button>
				}
				onConfirm={
				    () => deleteTier(tier.id)
			    }
			/>
		</div>
	);
}