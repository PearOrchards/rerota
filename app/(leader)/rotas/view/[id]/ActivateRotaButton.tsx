"use client";

import { ConfirmEntityModal } from "@/components/ConfirmEntityModal";
import { Button } from "@/components/ui/button";
import { activateRota } from "@/lib/actions/rotas";

type ActivateRotaButtonProps = {
  rotaId: string;
  disabled: boolean;
};

export default function ActivateRotaButton({
	rotaId,
	disabled,
}: ActivateRotaButtonProps) {
	return (
		<ConfirmEntityModal
			title="Activate this rota?"
			description="This will notify staff of their assignments and the rota cannot be retracted. You can still make changes later if issues arise, such as staff sickness."
			trigger={<Button disabled={disabled}>Activate Rota</Button>}
			onConfirm={() => activateRota(rotaId)}
			buttonText="Yes, activate rota"
		/>
	);
}
