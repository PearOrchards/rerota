"use client";

import { ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

interface MultiSelectProps {
	options: MultiSelectOption[];
	value: string[];
	onValueChange: (value: string[]) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
}

export function MultiSelect({
	options,
	value,
	onValueChange,
	placeholder = "Select options",
	emptyMessage = "No options available.",
	className,
}: MultiSelectProps) {
	const toggleOption = (optionValue: string) => {
		const nextValue = value.includes(optionValue)
			? value.filter((selectedValue) => selectedValue !== optionValue)
			: [...value, optionValue];
		onValueChange(nextValue);
	};

	const selectedLabelText = options
		.filter((option) => value.includes(option.value))
		.map((option) => option.label)
		.join(", ");

	const triggerText = selectedLabelText || placeholder;

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
			<DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
				{options.length ? (
					options.map((option) => (
						<DropdownMenuCheckboxItem
							key={option.value}
							checked={value.includes(option.value)}
							disabled={option.disabled}
							onCheckedChange={() => toggleOption(option.value)}
							onSelect={(e) => e.preventDefault()}
						>
							{option.label}
						</DropdownMenuCheckboxItem>
					))
				) : (
					<p className="px-2 py-1.5 text-sm text-muted-foreground">
						{emptyMessage}
					</p>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
