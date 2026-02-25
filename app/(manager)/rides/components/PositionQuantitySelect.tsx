"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RidePositionQuantity } from "@/lib/types/rides";
import { cn } from "@/lib/utils";
import { ChevronDown, Minus, Plus } from "lucide-react";

interface RoleQuantityOption {
	value: string;
	label: string;
	disabled?: boolean;
}

interface RoleQuantitySelectProps {
	options: RoleQuantityOption[];
	value: RidePositionQuantity[];
	onValueChange: (value: RidePositionQuantity[]) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
}

function toQuantityMap(value: RidePositionQuantity[]): Map<string, number> {
	const quantityMap = new Map<string, number>();
	for (const roleQuantity of value) {
		const quantity = Math.max(0, Math.floor(Number(roleQuantity.quantity) || 0));
		if (!roleQuantity.positionId || !quantity) {
			continue;
		}
		quantityMap.set(roleQuantity.positionId, quantity);
	}
	return quantityMap;
}

export function PositionQuantitySelect({
	options,
	value,
	onValueChange,
	placeholder = "Select roles",
	emptyMessage = "No roles available.",
	className,
}: RoleQuantitySelectProps) {
	const quantityMap = toQuantityMap(value);

	const setQuantity = (positionId: string, quantity: number) => {
		const nextQuantities = toQuantityMap(value);
		const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
		if (!safeQuantity) {
			nextQuantities.delete(positionId);
		} else {
			nextQuantities.set(positionId, safeQuantity);
		}

		const orderedValues = options
			.map((option) => ({
				positionId: option.value,
				quantity: nextQuantities.get(option.value) || 0,
			}))
			.filter((roleQuantity) => roleQuantity.quantity > 0);

		onValueChange(orderedValues);
	};

	const selectedRoleText = options
		.map((option) => {
			const quantity = quantityMap.get(option.value) || 0;
			if (!quantity) {
				return null;
			}
			return quantity > 1 ? `${option.label} x${quantity}` : option.label;
		})
		.filter(Boolean)
		.join(", ");

	const triggerText = selectedRoleText || placeholder;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn("w-full justify-between font-normal", className)}
				>
					<span className="truncate text-left">{triggerText}</span>
					<ChevronDown className="opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-2">
				{options.length ? (
					<div className="space-y-1">
						{options.map((option) => {
							const quantity = quantityMap.get(option.value) || 0;
							return (
								<div key={option.value} className="flex items-center justify-between gap-2 py-1">
									<span className={cn("text-sm", option.disabled && "text-muted-foreground")}>
										{option.label}
									</span>
									<div className="flex items-center gap-1">
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={option.disabled || quantity <= 0}
											onClick={() => setQuantity(option.value, quantity - 1)}
										>
											<Minus />
										</Button>
										<span className="w-8 text-center text-sm font-medium tabular-nums">{quantity}</span>
										<Button
											type="button"
											variant="outline"
											size="icon-sm"
											disabled={option.disabled}
											onClick={() => setQuantity(option.value, quantity + 1)}
										>
											<Plus />
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<p className="px-2 py-1.5 text-sm text-muted-foreground">
						{emptyMessage}
					</p>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
